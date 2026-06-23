// Subset the bundled webfonts to the characters we actually render: ASCII
// letters / digits / punctuation + Spanish accented characters (locale: es).
// Drops CJK + the rest of Unicode that we never paint.
//
// Roboto is a variable font (wdth + wght axes); subset-font preserves the axes
// so weights 400 and 700 still render after the cut.
//
// Usage (one-shot, dependency lives only on disk while running):
//   npx --yes -p subset-font@2 -- node scripts/subset-fonts.mjs
//
// Bump the `output` suffix in the FONTS list whenever the subset changes —
// the /fonts/* cache header is immutable for a year, so the URL itself is
// the cache-bust.

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

import subsetFont from 'subset-font';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

// Letters + digits + punctuation we render, plus Spanish accents.
const TEXT =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' +
  ' .,;:!?_-+=()[]{}/@#áéíóúÁÉÍÓÚñÑüÜçÇ';

const FONTS = [
  {
    label: 'Monaspace Neon',
    input: 'public/fonts/monaspace/MonaspaceNeon-Regular.woff2',
    output: 'public/fonts/monaspace/MonaspaceNeon-Regular.v2.woff2',
  },
  {
    label: 'Roboto Variable',
    input: 'public/fonts/roboto/Roboto-VariableFont_wdth,wght.woff2',
    output: 'public/fonts/roboto/Roboto-VariableFont_wdth,wght.v2.woff2',
  },
];

let processed = 0;
for (const { label, input, output } of FONTS) {
  const inputPath = path.join(root, input);
  const outputPath = path.join(root, output);

  if (!fs.existsSync(inputPath)) {
    console.warn(`Skipping ${label}: source missing at ${inputPath}.`);
    continue;
  }

  const buffer = fs.readFileSync(inputPath);
  const subset = await subsetFont(buffer, TEXT, { targetFormat: 'woff2' });
  fs.writeFileSync(outputPath, subset);

  console.info(
    `${label}: ${buffer.length} → ${subset.length} bytes (${Math.round(
      (1 - subset.length / buffer.length) * 100
    )}% smaller) → ${path.relative(root, outputPath)}`
  );
  processed += 1;
}

if (processed === 0) {
  console.error('No fonts were subset — check the FONTS list above and the source file paths.');
  process.exit(1);
}
