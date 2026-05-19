import { readFile } from 'node:fs/promises';
import JSZip from 'jszip';
import { EchoFramePackageSchema, type EchoFramePackage } from './schema';

export interface ReadResult {
  manifest: EchoFramePackage;
  files: Map<string, Uint8Array>;
}

export async function readPackage(path: string): Promise<ReadResult> {
  const buf = await readFile(path);
  const zip = await JSZip.loadAsync(buf);
  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) throw new Error('Missing manifest.json in package');
  const manifest = EchoFramePackageSchema.parse(
    JSON.parse(await manifestFile.async('string')),
  );
  const files = new Map<string, Uint8Array>();
  for (const [name, entry] of Object.entries(zip.files)) {
    if (name === 'manifest.json' || entry.dir) continue;
    files.set(name, await entry.async('uint8array'));
  }
  return { manifest, files };
}
