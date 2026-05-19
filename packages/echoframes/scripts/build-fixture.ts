import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, '..', 'test', 'fixtures', 'example-com-walkthrough');
const RRWEB_BUNDLE = resolve(HERE, '..', '..', 'rrweb', 'dist', 'rrweb.umd.cjs');

async function main(): Promise<void> {
  mkdirSync(resolve(OUT, 'keyframes'), { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();

  await page.goto('https://example.com', { waitUntil: 'networkidle' });

  // Inject rrweb via addScriptTag to avoid tsx-compiled helper pollution in browser context.
  // Use checkoutEveryNth:2 so periodic full snapshots are emitted, boosting event count.
  // sampling.mousemove:20 emits a mouse-position batch every 20 ms of movement.
  await page.addScriptTag({ path: RRWEB_BUNDLE });
  await page.evaluate(`
    window.__ef_events = [];
    window.rrweb.record({
      emit: function(e) { window.__ef_events.push(e); },
      checkoutEveryNth: 2,
      sampling: { mousemove: 20, scroll: 150, input: 'last' }
    });
  `);

  // t=0: initial load screenshot
  await page.screenshot({ path: resolve(OUT, 'keyframes', '0000.png'), fullPage: false });

  // t≈0–2000: mouse movements across the page
  await page.waitForTimeout(50);
  await page.mouse.move(200, 300);
  await page.waitForTimeout(100);
  await page.mouse.move(400, 300);
  await page.waitForTimeout(100);
  await page.mouse.move(600, 300);
  await page.waitForTimeout(100);
  await page.mouse.move(400, 200);
  await page.waitForTimeout(1550);

  // t≈2000: after mouse movement
  await page.evaluate('window.scrollBy(0, 100)');
  await page.screenshot({ path: resolve(OUT, 'keyframes', '0001.png'), fullPage: false });

  // t≈2000–4000: focus interactions
  await page.waitForTimeout(200);
  await page.focus('a');
  await page.waitForTimeout(200);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
  await page.mouse.move(300, 400);
  await page.waitForTimeout(100);
  await page.mouse.move(500, 400);
  await page.waitForTimeout(1100);

  // t≈4000: link hover screenshot
  await page.hover('a');
  await page.screenshot({ path: resolve(OUT, 'keyframes', '0002.png'), fullPage: false });

  // t≈4000–6000: scroll back, more mouse movement
  await page.waitForTimeout(200);
  await page.evaluate('window.scrollBy(0, -50)');
  await page.waitForTimeout(1700);

  // Collect events BEFORE clicking (clicking navigates away, wiping the window context)
  const events = await page.evaluate('window.__ef_events') as unknown[];

  // t≈6000: link clicked screenshot (page may navigate)
  await page.click('a', { noWaitAfter: true }).catch(() => undefined);
  await page.waitForTimeout(200);
  await page.screenshot({ path: resolve(OUT, 'keyframes', '0003.png'), fullPage: false });

  await browser.close();

  writeFileSync(resolve(OUT, 'capture.rrweb.json'), JSON.stringify(events));
  writeFileSync(
    resolve(OUT, 'manifest.json'),
    JSON.stringify(
      {
        fixtureId: 'example-com-walkthrough',
        sourceUrl: 'https://example.com',
        durationMs: 6500,
        viewport: { width: 1280, height: 720 },
        keyframes: [
          { tMs: 0, file: 'keyframes/0000.png', label: 'initial load' },
          { tMs: 2000, file: 'keyframes/0001.png', label: 'after scroll' },
          { tMs: 4000, file: 'keyframes/0002.png', label: 'link hover' },
          { tMs: 6000, file: 'keyframes/0003.png', label: 'link clicked' },
        ],
        events: 'capture.rrweb.json',
      },
      null,
      2,
    ),
  );
  console.log(`fixture written: ${events.length} events`);
}

void main();
