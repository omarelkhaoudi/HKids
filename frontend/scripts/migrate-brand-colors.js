/**
 * HKids — migration palette brand (script one-shot)
 * emerald|green|lime|teal -> secondary
 * indigo|purple|blue|cyan|sky|violet|fuchsia -> primary
 * yellow|orange|amber -> accent
 * Exclut BookReader.jsx (thèmes lecture day/sepia/night)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = path.join(__dirname, '../src');
const EXCLUDE_FILES = new Set(['BookReader.jsx']);

const COLOR_MAP = [
  ['emerald', 'secondary'],
  ['green', 'secondary'],
  ['lime', 'secondary'],
  ['teal', 'secondary'],
  ['indigo', 'primary'],
  ['purple', 'primary'],
  ['blue', 'primary'],
  ['cyan', 'primary'],
  ['sky', 'primary'],
  ['violet', 'primary'],
  ['fuchsia', 'primary'],
  ['yellow', 'accent'],
  ['orange', 'accent'],
  ['amber', 'accent'],
];

function shouldProcess(filePath) {
  const base = path.basename(filePath);
  if (EXCLUDE_FILES.has(base)) return false;
  return /\.(jsx?|css)$/.test(base);
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      walk(full, out);
    } else if (shouldProcess(full)) {
      out.push(full);
    }
  }
  return out;
}

function migrateContent(content) {
  let result = content;
  for (const [from, to] of COLOR_MAP) {
    const re = new RegExp(`\\b${from}(?=-[0-9]|/)`, 'g');
    result = result.replace(re, to);
  }
  return result;
}

const files = walk(SRC_ROOT);
let changed = 0;

for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  const after = migrateContent(before);
  if (after !== before) {
    fs.writeFileSync(file, after, 'utf8');
    changed += 1;
    console.log('updated:', path.relative(SRC_ROOT, file));
  }
}

console.log(`\nDone. ${changed} file(s) updated.`);
