function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

export function renderCoverSvg({ title, emoji, gradient = ['#7b3eb8', '#389d85'] }) {
  const [c1, c2] = gradient;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="800" viewBox="0 0 640 800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="640" height="800" rx="48" fill="url(#bg)"/>
  <circle cx="520" cy="120" r="90" fill="rgba(255,255,255,0.15)"/>
  <circle cx="100" cy="700" r="120" fill="rgba(255,255,255,0.1)"/>
  <text x="320" y="340" text-anchor="middle" font-size="120">${emoji || '📖'}</text>
  <text x="320" y="500" text-anchor="middle" font-family="Nunito, Arial, sans-serif" font-size="34" font-weight="700" fill="#ffffff">${escapeXml(title)}</text>
  <text x="320" y="560" text-anchor="middle" font-family="Nunito, Arial, sans-serif" font-size="22" fill="rgba(255,255,255,0.9)">Le Lit Qui Lit</text>
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
