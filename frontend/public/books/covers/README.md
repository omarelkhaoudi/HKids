# Book covers

Drop illustrated covers here. The UI loads them automatically.

## Priority (never seed SVG / icon cards)

1. Real illustrated API `cover` / `cover_image` (PNG/JPG/WebP — not `/uploads` SVG)
2. `/books/covers/{slug}.webp`
3. `/books/covers/default.webp`

Theme packs under `/books/covers/themes/` are for **category destination cards only**, not book product covers.

## Replace a cover

```text
frontend/public/books/covers/{slug}.webp
```

Rebuild small / SVG-fallback covers from illustrated theme art:

```bash
node backend/scripts/rebuild-local-covers-from-themes.js --only-small
```
