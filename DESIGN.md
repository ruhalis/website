# Design 16: Two fields

Two stacked fields with a hard horizontal edge between them.

- **Top field, black (#000), about 75vh.** The rider from David's painting as a very dark greyscale cut-out
  dissolving into black (design 05), on the right, with one thin Saxe-blue ring around his head (drawn in CSS).
  The stepped name on the left (design 01): "Arlan" above, "Baikurazov" indented 0.7em, large Bodoni Moda.
- **Bottom field, dark burgundy (#3f0e18).** The two-column plates grid (design 07): title in Bodoni small caps
  over a hairline, poster at column width, a monospace caption ("Plate I." / "[3:22, sound]"), description;
  a vertical hairline between columns, one column under 760px. Posters are burgundy duotones until a clip plays.
- About and Contact stay on burgundy. Contact's single ornament is a 240px line engraving of the rider's head
  (design 02), cream lines on #3f0e18, fading out in a circle.

Palette: #000, #3f0e18 (field), #5c1521 (hover only), Saxe blue #4f7cac (ring, link underlines, live dot, focus),
text #ece7dc and #8f877a, hairlines rgba(236,214,206,.2/.42). No light backgrounds, no shadows, no gradients.

Type: Bodoni Moda (name, headings, plate titles and numbers), IBM Plex Sans (text), system monospace (details).

Images: `bash tools/render-two-fields.sh` re-renders everything from `references/` and `tools/napoleon-figure-mask.png`
using `tools/halo-hero.py` (the dark cut-out), `tools/engrave.py` (the line engraving; adds `--oval`) and
`tools/duotone.py` (posters and portrait).
