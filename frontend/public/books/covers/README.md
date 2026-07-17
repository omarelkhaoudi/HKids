# Book covers

Drop illustrated covers here. The UI loads them automatically.

## Replace a cover (one file)

```text
frontend/public/books/covers/{slug}.webp
```

Preferred order per book:

1. `/books/covers/{slug}.webp` (unique story art)
2. `/books/covers/themes/{theme}.webp` (world / category immersion)
3. `/books/covers/default.webp`
4. Real external illustrated API URLs only (never seed SVG `/uploads/books/`)

Generate missing slug covers:

```bash
node backend/scripts/generate-local-cover-webps.js
```

Examples:

- `demo-dino-courage.webp`
- `spiritual-10.webp`
- `themes/bedtime.webp` (category destination backdrop)
