import { describe, expect, it } from 'vitest';
import { EchoFramePackageSchema } from '../src/package/schema';

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
