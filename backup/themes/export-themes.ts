/**
 * Script to export all theme data to JSON files for backup.
 * Run with: npx ts-node backup/themes/export-themes.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { THEME_SPECS, THEME_CATALOG } from '../../src/renderer/themes/theme-catalog';

const outDir = path.join(__dirname);

// Export raw theme specs (compact format)
fs.writeFileSync(
  path.join(outDir, 'theme-specs.json'),
  JSON.stringify(THEME_SPECS, null, 2),
  'utf8',
);

// Export full theme configs (expanded format for renderer)
fs.writeFileSync(
  path.join(outDir, 'theme-configs.json'),
  JSON.stringify(THEME_CATALOG, null, 2),
  'utf8',
);

// Export individual theme files
const individualDir = path.join(outDir, 'individual');
if (!fs.existsSync(individualDir)) {
  fs.mkdirSync(individualDir, { recursive: true });
}

for (const spec of THEME_SPECS) {
  const config = THEME_CATALOG[spec.key];
  const data = {
    spec,
    config,
  };
  fs.writeFileSync(
    path.join(individualDir, `${spec.key}.json`),
    JSON.stringify(data, null, 2),
    'utf8',
  );
}

console.log(`✅ Exported ${THEME_SPECS.length} themes to ${outDir}`);
console.log(`   - theme-specs.json (compact specs)`);
console.log(`   - theme-configs.json (full configs)`);
console.log(`   - individual/*.json (per-theme files)`);
