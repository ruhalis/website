# Design 02: Burgundy engraving

Concept: the Doré plates in IMG_5602 / IMG_5605, a red-tinted engraving with one thin white circle drawn over it.
The whole page is one flat burgundy field; David's "Napoleon Crossing the Alps" is re-cut as a pale line
engraving (wavy horizontal burin lines, thicker where the painting is lighter) and a single 1px cream circle
sits over the rider. That circle is the only geometric accent on the site, reused small as the play button.
Everything stays monochrome burgundy until a film plays, in colour.

- Palette: field `#531320` (flat, no gradient), type `#f3e6e4` (12.9:1), secondary `#c99ca3` (6.0:1),
  hairlines in the type colour at 22% / 55%. No Saxon blue.
- Type: Bodoni Moda for the name, the very large section titles, film titles, the About statement and contact
  links; IBM Plex Sans for body text; system monospace for small details (role, durations, numerals, credits).
- Layout: sparse single column, huge vertical gaps; hero is name left / tall engraving right (stacked on phones).
- Images: `assets/img/engraving-napoleon-1400.webp` (new, `tools/engrave.py`, uses the existing figure mask) and
  `assets/posters/*-burgundy.webp` (existing colour posters re-tinted with `tools/duotone.py` in burgundy).
  Both are reproducible with `bash tools/render-burgundy.sh`.
- Script: `assets/js/site.js` keeps one-plays-at-a-time and the auto-playing 5 s loop; the hover colour reveal and
  detail windows are dropped. Without JS every film is a plain `<video controls>` over its poster.
