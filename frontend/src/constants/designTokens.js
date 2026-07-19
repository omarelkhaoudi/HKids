/**
 * HKids Design System — token catalogue (documentation + showcase).
 * Runtime colors live in CSS variables (`index.css`) → Tailwind.
 * Components must never hardcode hex values.
 */

export const DS_PALETTE = [
  { id: 'primary', label: 'Primary Blue', swatch: 'bg-primary-500', role: 'CTA, books, nav active' },
  { id: 'secondary', label: 'Secondary Yellow', swatch: 'bg-secondary-500', role: 'Warmth, highlights' },
  { id: 'orange', label: 'Orange', swatch: 'bg-orange-500', role: 'Audio, soft urgency' },
  { id: 'success', label: 'Success Green', swatch: 'bg-success-500', role: 'Learn, validation' },
  { id: 'magic', label: 'Magic Purple', swatch: 'bg-magic-500', role: 'Create, studio' },
  { id: 'background', label: 'Background', swatch: 'bg-background', role: 'App canvas' },
  { id: 'surface', label: 'Surface', swatch: 'bg-surface', role: 'Panels, cards' },
  { id: 'text', label: 'Text', swatch: 'bg-foreground', role: 'Primary copy' },
  { id: 'border', label: 'Borders', swatch: 'bg-border', role: 'Dividers, outlines' },
];

export const DS_TYPOGRAPHY = [
  { id: 'display', className: 'kids-type-display', label: 'Display', sample: 'Lis avec magie' },
  { id: 'h1', className: 'kids-type-h1', label: 'H1', sample: 'Ta bibliothèque' },
  { id: 'h2', className: 'kids-shelf-title', label: 'H2 / Section', sample: 'Nouveautés' },
  { id: 'card-title', className: 'kids-book-title', label: 'Card Title', sample: 'Le petit dinosaure courageux' },
  { id: 'subtitle', className: 'kids-shelf-subtitle', label: 'Subtitle', sample: 'Des histoires fraîches pour toi' },
  { id: 'author', className: 'kids-book-author', label: 'Author', sample: 'Le Lit Qui Lit' },
  { id: 'body', className: 'kids-type-body', label: 'Body', sample: 'Choisis un livre et commence.' },
  { id: 'metadata', className: 'kids-book-meta-pill', label: 'Metadata', sample: '3–6 · 5:00' },
  { id: 'caption', className: 'kids-type-caption', label: 'Caption', sample: '6–8 ans · 12 min' },
  { id: 'button', className: 'kids-type-button', label: 'Buttons', sample: 'Lire maintenant' },
];

export const DS_RADIUS = [8, 12, 16, 20, 24, 32];

export const DS_SPACING = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64];

export const DS_SHADOWS = [
  { id: 'soft', className: 'shadow-soft', label: 'Soft Shadow' },
  { id: 'card', className: 'shadow-card', label: 'Card Shadow' },
  { id: 'floating', className: 'shadow-floating', label: 'Floating Shadow' },
];

export const DS_MODALITY = {
  books: 'primary',
  audio: 'orange',
  learn: 'success',
  create: 'magic',
};
