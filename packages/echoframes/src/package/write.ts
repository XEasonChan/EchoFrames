import { writeFile } from 'node:fs/promises';
import JSZip from 'jszip';
import { EchoFramePackageSchema, type EchoFramePackage } from './schema';

export async function writePackage(
  pkg: EchoFramePackage,
  path: string,
  files: Map<string, Uint8Array>,
): Promise<void> {
  EchoFramePackageSchema.parse(pkg);
  const zip = new JSZip();
  zip.file('manifest.json', JSON.stringify(pkg, null, 2));
  for (const [name, bytes] of files) zip.file(name, bytes);
  const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  await writeFile(path, buf);
}
