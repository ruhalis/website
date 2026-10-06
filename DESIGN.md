# Design 11: Engraving on black

Round-2 combination of three things the owner liked: the stepped name (design 01), the line-screen
engraving of horse and rider (design 02) and the two-column plates grid (design 07), all on black.

- **Hero (one screen):** "Arlan" over "Baikurazov", the surname indented 0.72em, in large off-white
  Bodoni Moda; a Saxe-blue small-caps role line; the intro and two links. On the right, David's
  "Napoleon Crossing the Alps" re-cut as wavy horizontal burin lines in off-white on black
  (`tools/engrave-02.py`), a tall 4:5 crop at about 42-45% of the viewport width.
- **One burgundy rule** (#5c1521) under the hero; burgundy appears again only as the play chip's hover.
- **Projects:** design 07's plates: two columns with a 25%-alpha off-white column rule, a hairline above
  each video, the title in Bodoni small caps, "Plate I." captions with monospace `[3:22, sound]`.
  Posters are dark grey-on-black duotones, so the grid stays monochrome until a clip plays; the live
  clip gets a Saxe-blue dot in its caption. One column on mobile.
- **About, Contact:** short, narrow, quiet; footer in monospace.

Palette: field #0b0b0c, text #e8e1d1 / #bdb5a6, muted #8f877a, rules rgba(232,225,209,.25),
Saxe blue #4f7cac (role line, link underlines, live dot, focus ring), burgundy #5c1521 (one rule, chip hover).
Type: Bodoni Moda (display, small caps), IBM Plex Sans (text), system monospace (labels, durations).

Assets: `bash tools/render-engraving-black.sh` renders `assets/img/engraving-black-{600,1200}.webp`
(same line count in both, so neither is resampled into moire at 1x or 2x) and `assets/posters/*-black.webp`.
