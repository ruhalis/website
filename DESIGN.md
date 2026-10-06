# Design 12: Engraving on burgundy

One flat field of dark burgundy for the whole page. A compact hero: the name stepped in large
Bodoni Moda on the left ("Arlan", then "Baikurazov" set in by about 0.7em), and on the right the
line-screen engraving of David's horse and rider in pale rose-cream lines, rendered on the exact
field colour so the plate has no visible edge. One thin Saxe-blue circle is drawn over the rider.
Below it the six films are set as plates in two columns (one on mobile): title in small caps, a
hairline, the poster, a monospace caption ("Plate I. [3:22, sound]"), then the description.

- Field `#3f0e18` (page, engraving field, poster shadows). Nothing else is a background;
  black `#000` appears only behind a clip that is loading or playing.
- Lines and text `#f3e6e4` (engraving), `#ece7dc` (text), `#8f877a` (muted, 4.7:1).
- Saxe blue `#4F7CAC`: the circle, link underlines, the live dot in a playing plate's caption. Nothing else.
- Hairlines: the text colour at 20% and 42% alpha. No boxes, shadows or gradients.
- Type: Bodoni Moda (name, headings, small-caps titles), IBM Plex Sans (text), system monospace
  (durations, plate numbers, captions, navigation).
- Reused: round 1 design 01 (stepped name), 02 (engraving and circle), 07 (two-column plates and
  the one-at-a-time player script).
- Images: `bash tools/render-engraving-burgundy.sh` renders the engraving at 600/900/1200 px
  (line spacing tuned per width so it never aliases) with `tools/engrave.py`, and the burgundy
  duotone posters (`assets/posters/*-wine.webp`) with `tools/duotone.py`.
