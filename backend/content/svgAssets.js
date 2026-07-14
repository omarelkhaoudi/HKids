function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const THEME_ACCENTS = {
  dinosaurs: { shape: '▲', x: 90, y: 180, size: 48, opacity: 0.22 },
  space: { shape: '✦', x: 520, y: 640, size: 42, opacity: 0.28 },
  animals: { shape: '●', x: 120, y: 620, size: 56, opacity: 0.18 },
  princesses: { shape: '♦', x: 500, y: 200, size: 40, opacity: 0.24 },
  spiritual: { shape: '☼', x: 320, y: 120, size: 46, opacity: 0.2 },
  nature: { shape: '❀', x: 80, y: 500, size: 44, opacity: 0.22 },
  colors: { shape: '◆', x: 540, y: 500, size: 38, opacity: 0.25 },
  numbers: { shape: '◎', x: 100, y: 220, size: 36, opacity: 0.2 },
  alphabet: { shape: '◇', x: 520, y: 300, size: 34, opacity: 0.22 },
  jobs: { shape: '■', x: 140, y: 650, size: 30, opacity: 0.18 },
  world: { shape: '◉', x: 500, y: 650, size: 40, opacity: 0.2 },
  rhymes: { shape: '♪', x: 520, y: 180, size: 50, opacity: 0.24 },
  default: { shape: '✧', x: 110, y: 160, size: 36, opacity: 0.18 },
};

function themeAccentMarkup(theme) {
  const accent = THEME_ACCENTS[theme] || THEME_ACCENTS.default;
  return `<text x="${accent.x}" y="${accent.y}" font-size="${accent.size}" fill="rgba(255,255,255,${accent.opacity})">${accent.shape}</text>`;
}

function wrapLines(text, maxChars = 38) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 4);
}

export function renderCoverSvg({ title, emoji, gradient = ['#7b3eb8', '#389d85'], theme = 'default', slug = '' }) {
  const [c1, c2] = gradient;
  const shortTitle = String(title || '').length > 28 ? `${String(title).slice(0, 25)}...` : title;
  const slugLabel = slug ? slug.replace(/^demo-/, '').replace(/-/g, ' ') : theme;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="800" viewBox="0 0 640 800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="rgba(0,0,0,0.25)"/>
    </filter>
  </defs>
  <rect width="640" height="800" rx="48" fill="url(#bg)"/>
  <circle cx="520" cy="120" r="90" fill="rgba(255,255,255,0.15)"/>
  <circle cx="100" cy="700" r="120" fill="rgba(255,255,255,0.1)"/>
  ${themeAccentMarkup(theme)}
  <rect x="120" y="210" width="400" height="220" rx="36" fill="rgba(255,255,255,0.14)" filter="url(#shadow)"/>
  <text x="320" y="340" text-anchor="middle" font-size="128">${emoji || '📖'}</text>
  <text x="320" y="500" text-anchor="middle" font-family="Nunito, Arial, sans-serif" font-size="30" font-weight="700" fill="#ffffff">${escapeXml(shortTitle)}</text>
  <text x="320" y="545" text-anchor="middle" font-family="Nunito, Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.85)">${escapeXml(slugLabel)}</text>
  <text x="320" y="585" text-anchor="middle" font-family="Nunito, Arial, sans-serif" font-size="20" fill="rgba(255,255,255,0.9)">Le Lit Qui Lit</text>
</svg>`;
}

export function renderPageSvg({
  text,
  emoji,
  gradient = ['#fefcfb', '#e0e7ff'],
  pageNumber = 1,
  totalPages = 1,
}) {
  const [c1, c2] = gradient;
  const lines = wrapLines(text);
  const lineNodes = lines.map((line, index) => {
    const y = 360 + index * 44;
    return `<text x="400" y="${y}" text-anchor="middle" font-family="Nunito, Arial, sans-serif" font-size="28" fill="#1e293b">${escapeXml(line)}</text>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="pageBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" rx="32" fill="url(#pageBg)"/>
  <rect x="24" y="24" width="752" height="552" rx="24" fill="rgba(255,255,255,0.65)"/>
  <text x="400" y="170" text-anchor="middle" font-size="96">${emoji || '📖'}</text>
  ${lineNodes}
  <text x="760" y="560" text-anchor="end" font-family="Nunito, Arial, sans-serif" font-size="18" fill="#64748b">${pageNumber} / ${totalPages}</text>
</svg>`;
}
