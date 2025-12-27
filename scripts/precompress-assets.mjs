import { promises as fs } from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ASSETS_DIR = path.resolve('dist', 'assets');
const COMPRESS_EXTENSIONS = new Set(['.js', '.css', '.html', '.svg', '.json', '.map']);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

async function writeIfChanged(outPath, data) {
  try {
    const existing = await fs.readFile(outPath);
    if (Buffer.compare(existing, data) === 0) return false;
  } catch {
    // ignore
  }
  await fs.writeFile(outPath, data);
  return true;
}

async function main() {
  try {
    await fs.access(ASSETS_DIR);
  } catch {
    console.error(`[precompress] Missing ${ASSETS_DIR}. Run build first.`);
    process.exitCode = 1;
    return;
  }

  const files = await walk(ASSETS_DIR);
  const targets = files.filter((filePath) => COMPRESS_EXTENSIONS.has(path.extname(filePath)));

  let wroteGz = 0;
  let wroteBr = 0;

  for (const filePath of targets) {
    const input = await fs.readFile(filePath);

    const gz = zlib.gzipSync(input, { level: 9 });
    if (await writeIfChanged(`${filePath}.gz`, gz)) wroteGz += 1;

    const br = zlib.brotliCompressSync(input, {
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
      },
    });
    if (await writeIfChanged(`${filePath}.br`, br)) wroteBr += 1;
  }

  console.log(`[precompress] Wrote ${wroteGz} gzip files and ${wroteBr} brotli files in ${ASSETS_DIR}`);
}

await main();

