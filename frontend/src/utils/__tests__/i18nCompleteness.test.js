import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { translations, SUPPORTED_LANGUAGES } from '../translations.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = path.resolve(__dirname, '..', '..');

// Modules with their own { en, fr, ar } label objects resolved via helpers
// (premLabel, cdLabel, persLabel, eduLabel, luLabel).
const LABEL_MODULE_PATHS = [
  'constants/premiumLabels.js',
  'constants/contentDeliveryLabels.js',
  'constants/personalizationLabels.js',
  'constants/educationalWorldLabels.js',
  'constants/learningUniverseLabels.js',
];

const KEY_LINE = /^\s+([A-Za-z0-9_]+):\s/;
const LANG_BLOCK_OPEN = /^\s{2}(en|fr|ar):\s*\{/;

/**
 * Extracts { en: [keys...], fr: [...], ar: [...] } from a source file that
 * declares per-language label objects, preserving duplicates so we can
 * detect keys silently overridden by JS object-literal semantics.
 */
function extractLanguageKeys(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const result = { en: [], fr: [], ar: [] };
  let currentLang = null;
  let depth = 0;

  for (const line of source.split(/\r?\n/)) {
    const open = line.match(LANG_BLOCK_OPEN);
    if (!currentLang && open) {
      currentLang = open[1];
      depth = 1;
      continue;
    }
    if (!currentLang) continue;

    // Only record keys at the top level of the language object.
    if (depth === 1) {
      const key = line.match(KEY_LINE);
      if (key) result[currentLang].push(key[1]);
    }
    for (const char of line) {
      if (char === '{') depth += 1;
      if (char === '}') depth -= 1;
    }
    if (depth <= 0) currentLang = null;
  }
  return result;
}

function findDuplicates(keys) {
  const seen = new Set();
  const duplicates = new Set();
  for (const key of keys) {
    if (seen.has(key)) duplicates.add(key);
    seen.add(key);
  }
  return [...duplicates];
}

function walkSourceFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkSourceFiles(fullPath, files);
    } else if (/\.(js|jsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('i18n completeness', () => {
  it('exposes the same key set in every supported language', () => {
    const enKeys = Object.keys(translations.en);
    for (const language of SUPPORTED_LANGUAGES) {
      const keys = new Set(Object.keys(translations[language]));
      const missing = enKeys.filter((key) => !keys.has(key));
      expect(missing, `keys missing from "${language}"`).toEqual([]);
      const extra = [...keys].filter((key) => !(key in translations.en));
      expect(extra, `keys present in "${language}" but missing from "en"`).toEqual([]);
    }
  });

  it('has no duplicated keys inside translations.js language blocks', () => {
    const blocks = extractLanguageKeys(path.join(SRC_ROOT, 'utils', 'translations.js'));
    for (const language of SUPPORTED_LANGUAGES) {
      expect(findDuplicates(blocks[language]), `duplicated keys in translations.${language}`).toEqual([]);
    }
  });

  it('keeps label modules aligned across en/fr/ar without duplicates', () => {
    for (const relativePath of LABEL_MODULE_PATHS) {
      const blocks = extractLanguageKeys(path.join(SRC_ROOT, relativePath));
      expect(blocks.en.length, `${relativePath}: no en keys parsed`).toBeGreaterThan(0);
      for (const language of SUPPORTED_LANGUAGES) {
        expect(findDuplicates(blocks[language]), `${relativePath}: duplicated keys in "${language}"`).toEqual([]);
        const keys = new Set(blocks[language]);
        const missing = blocks.en.filter((key) => !keys.has(key));
        expect(missing, `${relativePath}: keys missing from "${language}"`).toEqual([]);
      }
    }
  });

  it('resolves every static t(...) call to an existing translation key', () => {
    const validKeys = new Set(Object.keys(translations.en));
    // Keys handled by label-module wrappers (withPremiumLabels,
    // withPersonalizationLabels) are also reachable through t().
    for (const relativePath of LABEL_MODULE_PATHS) {
      const blocks = extractLanguageKeys(path.join(SRC_ROOT, relativePath));
      for (const key of blocks.en) validKeys.add(key);
    }

    const missing = [];
    const callPattern = /(?<![A-Za-z0-9_.$])t\(\s*'([A-Za-z0-9_]+)'/g;
    for (const filePath of walkSourceFiles(SRC_ROOT)) {
      const source = fs.readFileSync(filePath, 'utf8');
      for (const match of source.matchAll(callPattern)) {
        const key = match[1];
        if (!validKeys.has(key)) {
          missing.push(`${path.relative(SRC_ROOT, filePath)} -> t('${key}')`);
        }
      }
    }
    expect(missing, 'static t() calls referencing unknown translation keys').toEqual([]);
  });
});
