import { chromium } from 'playwright';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, '..', 'test', 'fixtures', 'example-com-walkthrough');
const RRWEB_BUNDLE = resolve(HERE, '..', '..', 'rrweb', 'dist', 'rrweb.umd.cjs');

async function main(): Promise<void> {
  if (!existsSync(RRWEB_BUNDLE)) {
    throw new Error(`rrweb umd bundle not found at ${RRWEB_BUNDLE}\nRun: yarn workspace rrweb build`);
  }

  mkdirSync(resolve(OUT, 'keyframes'), { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();

  await page.goto('https://example.com', { waitUntil: 'networkidle' });

  // Inject rrweb via addScriptTag to avoid tsx-compiled helper pollution in browser context.
  // Use checkoutEveryNth:2 so periodic full snapshots are emitted, boosting event count.
  // sampling.mousemove:20 emits a mouse-position batch every 20 ms of movement.
  await page.addScriptTag({ path: RRWEB_BUNDLE });

  // page.evaluate calls below use string form rather than typed arrow functions.
  // tsx's esbuild compilation injects a `__name` helper into serialized functions
  // which breaks in the browser context. String form sidesteps the helper.
  await page.evaluate(`
    window.__ef_events = [];
    window.rrweb.record({
      emit: function(e) { window.__ef_events.push(e); },
      checkoutEveryNth: 2,
      sampling: { mousemove: 20, scroll: 150, input: 'last' }
    });
  `);

  // t=0: initial state — no modifications
  await page.screenshot({ path: resolve(OUT, 'keyframes', '0000.png'), fullPage: false });

  // t≈2000: scroll banner — inject visible yellow banner + scroll so pixels change
  await page.waitForTimeout(50);
  await page.mouse.move(200, 300);
  await page.waitForTimeout(100);
  await page.mouse.move(400, 300);
  await page.waitForTimeout(100);
  // Make the page tall enough to scroll (example.com fits in 720px with no overflow),
  // then use page.mouse.wheel (Node-side) so a real wheel event fires and rrweb captures
  // a scroll event (source=3). window.scrollBy inside page.evaluate does NOT fire the
  // scroll event rrweb listens to.
  await page.evaluate(`
    var spacer = document.createElement('div');
    spacer.id = 'ef-scroll-spacer';
    spacer.style.cssText = 'height:1000px';
    document.body.appendChild(spacer);
  `);
  await page.mouse.wheel(0, 200);
  await page.waitForTimeout(200);
  await page.evaluate(`
    var banner = document.createElement('div');
    banner.id = 'ef-marker-scroll';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;height:40px;background:#fde047;z-index:99999;color:#000;font:bold 18px/40px sans-serif;text-align:center';
    banner.textContent = 'scrolled';
    document.body.appendChild(banner);
  `);
  await page.waitForTimeout(100);
  await page.screenshot({ path: resolve(OUT, 'keyframes', '0001.png'), fullPage: false });

  // t≈4000: link outlined — remove banner, add red outline to first <a>
  await page.waitForTimeout(200);
  await page.evaluate(`
    var b = document.getElementById('ef-marker-scroll');
    if (b) b.remove();
    var a = document.querySelector('a');
    if (a) { a.style.outline = '4px solid #ef4444'; a.style.outlineOffset = '2px'; }
  `);
  await page.waitForTimeout(100);
  await page.screenshot({ path: resolve(OUT, 'keyframes', '0002.png'), fullPage: false });

  // t≈4000–6000: more mouse movement before final state
  await page.waitForTimeout(200);
  await page.mouse.move(300, 400);
  await page.waitForTimeout(100);
  await page.mouse.move(500, 400);
  await page.waitForTimeout(1000);

  // Collect events BEFORE mutating the DOM for the final keyframe
  const events = await page.evaluate('window.__ef_events') as unknown[];

  // t≈6000: navigated — simulate post-navigation state by replacing body innerHTML
  // (avoids navigation race condition; keeps the test offline-safe)
  await page.evaluate(`
    var a = document.querySelector('a');
    if (a) { a.style.outline = ''; a.style.outlineOffset = ''; }
    document.body.innerHTML = '<h1>navigated</h1>';
  `);
  await page.waitForTimeout(100);
  await page.screenshot({ path: resolve(OUT, 'keyframes', '0003.png'), fullPage: false });

  await browser.close();

  writeFileSync(resolve(OUT, 'capture.rrweb.json'), JSON.stringify(events));

  if (events.length < 10) {
    throw new Error(`fixture has only ${events.length} events; expected >= 10 (rrweb injection likely failed silently)`);
  }

  writeFileSync(
    resolve(OUT, 'manifest.json'),
    JSON.stringify(
      {
        fixtureId: 'example-com-walkthrough',
        sourceUrl: 'https://example.com',
        durationMs: 6500,
        viewport: { width: 1280, height: 720 },
        // Nominal timeline labels. Not derived from rrweb event.timestamp;
        // downstream consumers should index keyframes by file name, not by tMs.
        keyframes: [
          { tMs: 0, file: 'keyframes/0000.png', label: 'initial load' },
          { tMs: 2000, file: 'keyframes/0001.png', label: 'scroll banner' },
          { tMs: 4000, file: 'keyframes/0002.png', label: 'link outlined' },
          { tMs: 6000, file: 'keyframes/0003.png', label: 'navigated' },
        ],
        events: 'capture.rrweb.json',
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`fixture written: ${events.length} events`);
}

void main();
