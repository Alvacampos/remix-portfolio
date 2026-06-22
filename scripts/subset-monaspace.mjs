// Subset Monaspace Neon to the characters we actually render: ASCII letters /
// digits / punctuation + Spanish accented characters (locale: es). Cuts the
// woff2 from ~199 KB to ~21 KB by dropping CJK + the rest of Unicode.
//
// Usage (one-shot, dependency lives only on disk while running):
//   npx --yes -p subset-font@5 -- node scripts/subset-monaspace.mjs
//
// Bump the suffix in the output filename whenever the subset changes — the
// /assets/* and /fonts/* cache headers are immutable for a year.

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

import subsetFont from 'subset-font';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const inputPath = path.join(root, 'public/fonts/monaspace/MonaspaceNeon-Regular.woff2');
const outputPath = path.join(root, 'public/fonts/monaspace/MonaspaceNeon-Regular.v2.woff2');

if (!fs.existsSync(inputPath)) {
  console.error(`Source font missing at ${inputPath}.`);
  console.error(
    'Drop the upstream MonaspaceNeon-Regular.woff2 there first (github.com/githubnext/monaspace).'
  );
  process.exit(1);
}

// Letters + digits + punctuation we render, plus Spanish accents.
const text =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' +
  ' .,;:!?_-+=()[]{}/@#áéíóúÁÉÍÓÚñÑüÜçÇ';

const buffer = fs.readFileSync(inputPath);
const subset = await subsetFont(buffer, text, { targetFormat: 'woff2' });
fs.writeFileSync(outputPath, subset);

console.info(
  `Subset Monaspace Neon: ${buffer.length} → ${subset.length} bytes (${Math.round(
    (1 - subset.length / buffer.length) * 100
  )}% smaller)`
);
console.info(`Wrote ${path.relative(root, outputPath)}.`);
