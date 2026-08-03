import { AIError } from './errors.js';

const SCRIPT_BLOCK = /<script[\s\S]*?>[\s\S]*?<\/script>/gi;
const HTML_TAG = /<[^>]+>/g;
const WHITESPACE = /\s+/g;
const ARABIC_UNSAFE_PATTERN = /\u0627\u0646\u062a\u062d\u0627\u0631|\u0627\u0642\u062a\u0644\s+\u0646\u0641\u0633\u0643|\u062c\u0646\u0633|\u0627\u0628\u0627\u062d|\u0625\u0628\u0627\u062d|\u0645\u062e\u062f\u0631|\u0642\u0646\u0628\u0644\u0629|\u0633\u0644\u0627\u062d/iu;

const UNSAFE_CHILD_PATTERNS = [
  /\b(suicide|self[-\s]?harm|kill\s+yourself)\b/i,
  /\b(murder|torture|bloodbath|gore|decapitat|execution)\b/i,
  /\b(porn|sexual|nude|explicit\s+adult)\b/i,
  /\b(cocaine|heroin|meth|ecstasy|overdose)\b/i,
  /\b(make|build|create)\s+(a\s+)?(bomb|weapon|gun)\b/i,
  /\b(api[_\s-]?key|secret[_\s-]?key|password|bearer\s+[a-z0-9._-]+)\b/i,
  ARABIC_UNSAFE_PATTERN
];

function stripControlChars(value) {
  let output = '';
  for (const char of String(value || '')) {
    const code = char.charCodeAt(0);
    const isControl = (code >= 0 && code <= 8)
      || code === 11
      || code === 12
      || (code >= 14 && code <= 31)
      || code === 127;
    output += isControl ? ' ' : char;
  }
  return output;
}

export function normalizeAIInputText(value, { maxLength = 5000 } = {}) {
  return stripControlChars(value)
    .replace(SCRIPT_BLOCK, ' ')
    .replace(HTML_TAG, ' ')
    .replace(WHITESPACE, ' ')
    .trim()
    .slice(0, maxLength);
}

export function sanitizeProviderText(value, { maxLength = 12000 } = {}) {
  return stripControlChars(value)
    .replace(SCRIPT_BLOCK, ' ')
    .replace(HTML_TAG, ' ')
    .trim()
    .slice(0, maxLength);
}

export function isUnsafeChildText(value) {
  const text = String(value || '');
  return UNSAFE_CHILD_PATTERNS.some((pattern) => pattern.test(text));
}

export function assertChildSafeText(value, {
  provider = null,
  operation = 'ai_output_validation'
} = {}) {
  if (!isUnsafeChildText(value)) return;

  throw new AIError('Generated content did not pass child-safety validation', {
    code: 'AI_UNSAFE_CONTENT',
    status: 422,
    provider,
    retryable: false,
    cause: { operation }
  });
}
