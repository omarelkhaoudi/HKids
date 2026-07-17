# Book covers

Drop illustrated covers here. The UI loads them automatically.

## Replace a cover (one file)

```text
frontend/public/books/covers/{slug}.webp
```

Preferred order per book:

1. API `cover_image` when it is a real PNG/JPG/WebP (not seed SVG)
2. `/books/covers/{slug}.webp` (or `.png` / `.jpg`)
3. `/books/covers/themes/{theme}.webp`
4. `/books/covers/default.webp`

Examples:

- `demo-dino-courage.webp`
- `princesse-lina.webp`
- `themes/bedtime.webp`
