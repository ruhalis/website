# Design 07 — Bulletin

A Bulletin de la Grande Armée, stripped down: a printed proclamation in ink and paper.
Typography does the work; double hairline rules are the only ornament. No boxes, shadows or colour fills.

- Field: unbleached paper `#f1ebdd`, flat. Ink: letterpress black `#14120f`; secondary text `#4a443b`.
- Burgundy `#7a1f2b`: section headers and the one ornament (double rule under the masthead).
- Saxon blue `#1f4aa8`: links only (and focus outlines).
- Type: Bodoni Moda at extreme size for the masthead "Arlan Baikurazov", set like a newspaper title,
  with a dateline row (Robotics engineer · Almaty · 2026); project titles as Bodoni small-caps headlines.
  IBM Plex Sans for body text, justified with hyphenation in the columns. Durations as bracketed notes.
- Projects: CSS multi-column, two columns with a hairline column rule on desktop, one on mobile. Each video is a
  "plate" at column width: 1px rule above, caption below ("Plate I." and "[3:22, sound]").
  Posters are the existing colour JPGs, printed grey into the paper with a CSS grayscale filter and multiply blend;
  the footage plays in colour.
- One image: `assets/img/detail-face-ink.webp` (+ `-600` variant), the rider's face rendered with
  `tools/duotone.py` as black ink halftone on paper (inverted tone, 8x8 Bayer, crop 1850,480,2650,1080).
- `site.js` rewritten: printed poster until play, one clip at a time, the 5 s loop plays while visible.
  Without JS each plate is a plain `<video controls>` with its poster. The hover colour reveal was dropped.
