import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EchoFramePackageSchema } from '../src/package/schema';
import { readPackage } from '../src/package/read';
import { writePackage } from '../src/package/write';
import type { EchoFramePackage } from '../src/package/schema';

describe('EchoFramePackageSchema', () => {
  it('accepts a minimal valid package', () => {
    const pkg = {
      version: 1,
      capturedAt: '2026-05-18T10:00:00.000Z',
      sourceUrl: 'https://example.com',
      viewport: { width: 1280, height: 720, dpr: 2 },
      durationMs: 6500,
      events: [],
      assets: [],
      keyframes: [],
      semantic: { title: 'example walkthrough', scenes: [] },
      layers: {},
    };
    expect(() => EchoFramePackageSchema.parse(pkg)).not.toThrow();
  });

  it('rejects a package missing required fields', () => {
    expect(() => EchoFramePackageSchema.parse({ version: 1 })).toThrow();
  });

  it('rejects an unsupported version', () => {
    expect(() =>
      EchoFramePackageSchema.parse({
        version: 99,
        capturedAt: '2026-05-18T10:00:00.000Z',
        sourceUrl: 'https://example.com',
        viewport: { width: 1280, height: 720, dpr: 1 },
        durationMs: 0,
        events: [],
        assets: [],
        keyframes: [],
        semantic: { title: '', scenes: [] },
        layers: {},
      }),
    ).toThrow();
  });
});

describe('package round-trip', () => {
  it('writePackage then readPackage produces the same object', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'echoframes-'));
    const path = join(dir, 'test.echoframe');
    const pkg: EchoFramePackage = {
      version: 1,
      capturedAt: '2026-05-18T10:00:00.000Z',
      sourceUrl: 'https://example.com',
      viewport: { width: 1280, height: 720, dpr: 2 },
      durationMs: 1000,
      events: [{ type: 0, data: {}, timestamp: 0 }],
      assets: [
        {
          originalUrl: 'https://example.com/style.css',
          localPath: 'assets/style.css',
          mime: 'text/css',
          bytes: 42,
          status: 'ok',
        },
      ],
      keyframes: [
        { tMs: 0, file: 'keyframes/0000.png', label: 'initial', trigger: 'interval' },
      ],
      semantic: { title: 'roundtrip', scenes: [] },
      layers: {
        'computed-style': [
          { kind: 'computed-style', path: 'layers/computed-style/0000.json', attachedTo: 'keyframe', index: 0 },
        ],
      },
    };
    const files = new Map<string, Uint8Array>([
      ['assets/style.css', new TextEncoder().encode('body{}')],
      ['keyframes/0000.png', new Uint8Array([137, 80, 78, 71])],
      ['layers/computed-style/0000.json', new TextEncoder().encode('[]')],
    ]);
    await writePackage(pkg, path, files);
    const { manifest, files: readFiles } = await readPackage(path);
    expect(manifest).toEqual(pkg);
    expect(readFiles.get('layers/computed-style/0000.json')).toEqual(new TextEncoder().encode('[]'));
    expect(readFiles.get('assets/style.css')).toEqual(new TextEncoder().encode('body{}'));
    rmSync(dir, { recursive: true, force: true });
  });

  it('readPackage throws on a zip missing manifest.json', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'echoframes-'));
    const path = join(dir, 'bad.echoframe');
    // Write an empty zip (no manifest.json)
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    zip.file('only-this.txt', 'hi');
    const buf = await zip.generateAsync({ type: 'nodebuffer' });
    const { writeFile } = await import('node:fs/promises');
    await writeFile(path, buf);
    await expect(readPackage(path)).rejects.toThrow(/manifest/i);
    rmSync(dir, { recursive: true, force: true });
  });
});
