# Design 15: Blue burin

A black field with one engraving cut in Saxe blue. The hero is a wide 16:9 plate: David's rider
re-cut as wavy horizontal burin lines (thicker where the painting is lighter), placed right of
centre and fading to black at the left. The stepped name sits over that fade. The hero is at most
80vh, so the projects start on the first screen. They are laid out as two columns of plates.

- Palette: field #000; Saxe blue #4F7CAC (engraving lines, link underlines, play glyphs, focus
  rings); rules in Saxe blue at 35% alpha; burgundy #4a1019 only as the About band; text #ece7dc
  and #8f877a. No other colour. Posters are dark grey duotones (#000 / #0b0b0c / #8e8a83) until a clip plays.
- Type: Bodoni Moda (name, small-caps titles, statement), IBM Plex Sans (body), system monospace
  (captions, nav, labels).
- Reused: the stepped name from design 01 ("Arlan" then "Baikurazov" indented 0.7em); the line
  engraving from design 02 (tools/engrave-02.py, with added --fade-left, --fade-bottom and --edge-soft
  options); the two-column plates from design 07 ("Plate I. ... [3:22, sound]", column rule, one column on
  phones), with its one-at-a-time player script.
- Rebuild the images with `bash tools/render-blue-burin.sh`.
