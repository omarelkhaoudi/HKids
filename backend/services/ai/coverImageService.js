import { buildCoverIllustrationPrompt } from '../../content/coverPrompts.js';
import { renderCoverSvg } from '../../content/svgAssets.js';

const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'dall-e-3';
const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt';

function slugSeed(slug = '', attempt = 0) {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return (hash + attempt * 997) || 42;
}

export function resolveCoverImageProvider(requested) {
  const hasOpenAi = Boolean(process.env.OPENAI_API_KEY?.trim());
  if (requested === 'openai') {
    if (!hasOpenAi) throw new Error('OPENAI_API_KEY is required for --provider openai');
    return 'openai';
  }
  if (requested === 'pollinations') return 'pollinations';
  return hasOpenAi ? 'openai' : 'pollinations';
}

async function fetchImageBuffer(url, { timeoutMs = 45000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Image download failed (${response.status})`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (!buffer.length) throw new Error('Downloaded image buffer is empty');
    return buffer;
  } finally {
    clearTimeout(timer);
  }
}

function buildPollinationsPrompt(item, { minimal = false } = {}) {
  if (minimal) {
    const title = String(item.title || 'story').trim();
    const emoji = item.emoji || '📖';
    return `${emoji} kids book cover ${title} watercolor illustration no text`;
  }
  return buildCoverIllustrationPrompt(item, { compact: true });
}

async function generateWithOpenAI(item) {
  const prompt = buildCoverIllustrationPrompt(item);
  const response = await fetch(`${OPENAI_BASE_URL}/images/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_IMAGE_MODEL,
      prompt,
      n: 1,
      size: '1024x1792',
      quality: 'standard',
      response_format: 'b64_json',
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || `OpenAI image API failed (${response.status})`;
    throw new Error(message);
  }

  const b64 = payload?.data?.[0]?.b64_json;
  if (!b64) throw new Error('OpenAI image API returned no image data');
  return Buffer.from(b64, 'base64');
}

async function generateWithPollinations(item, { minimal = false, attempt = 0 } = {}) {
  const prompt = buildPollinationsPrompt(item, { minimal });
  const encoded = encodeURIComponent(prompt);
  const seed = slugSeed(item.slug, attempt);
  const url = `${POLLINATIONS_BASE}/${encoded}?width=640&height=800&seed=${seed}&nologo=true&enhance=true`;
  return fetchImageBuffer(url, { timeoutMs: 45000 });
}

async function generateSvgFallbackPng(item) {
  const svg = renderCoverSvg({
    title: item.title,
    emoji: item.emoji,
    gradient: item.gradient,
    theme: item.theme,
    slug: item.slug,
  });
  const sharp = (await import('sharp')).default;
  return sharp(Buffer.from(svg, 'utf8'))
    .resize(640, 800)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function normalizeToPng(buffer) {
  const sharp = (await import('sharp')).default;
  return sharp(buffer)
    .resize(640, 800, { fit: 'cover', position: 'centre' })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateCoverPngBuffer(item, { provider } = {}) {
  const resolved = resolveCoverImageProvider(provider);

  if (resolved === 'openai') {
    const rawBuffer = await generateWithOpenAI(item);
    return { buffer: await normalizeToPng(rawBuffer), source: 'openai' };
  }

  // Keep Pollinations attempts short: free API often 500s and long retries burn minutes.
  const attempts = [
    { minimal: false, attempt: 0, waitMs: 0 },
    { minimal: true, attempt: 1, waitMs: 1500 },
  ];

  let lastError;
  for (const step of attempts) {
    if (step.waitMs) await sleep(step.waitMs);
    try {
      const rawBuffer = await generateWithPollinations(item, step);
      return { buffer: await normalizeToPng(rawBuffer), source: 'pollinations' };
    } catch (error) {
      lastError = error;
    }
  }

  try {
    // Never persist SVG icon-card fallbacks as "covers" — they regress the kids UI.
    throw lastError || new Error('Pollinations unavailable; refusing SVG icon-card fallback');
  } catch (fallbackError) {
    throw lastError || fallbackError;
  }
}

export function coverPngFilename(slug) {
  return `${slug}-cover.png`;
}
