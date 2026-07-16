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
  { id: 'hero', className: 'text-hero', label: 'Titre Hero', sample: 'Lis avec magie' },
  { id: 'heading-xl', className: 'text-heading-xl', label: 'Heading XL', sample: 'Ta bibliothèque' },
  { id: 'heading-l', className: 'text-heading-l', label: 'Heading L', sample: 'Continuer' },
  { id: 'heading-m', className: 'text-heading-m', label: 'Heading M', sample: 'Nouveautés' },
  { id: 'body-lg', className: 'text-body-lg', label: 'Body Large', sample: 'Une histoire pour ce soir.' },
  { id: 'body', className: 'text-body', label: 'Body', sample: 'Choisis un livre et commence.' },
  { id: 'caption', className: 'text-caption', label: 'Caption', sample: '6–8 ans · 12 min' },
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
