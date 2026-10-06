# Design 14: Halo on burgundy

One dark burgundy field for the whole page. At the top, David's rider is a pale
rose-cream cut-out that dissolves into the burgundy, with one thin Saxe-blue ring
around his head. The stepped name sits left: "Arlan" above, "Baikurazov" set in
about 0.7em. The hero is about 70vh, so the project plates start on the first screen.
Below, the six projects are plates in two columns with a thin vertical rule between.

- Palette: field #3a0c14, rare rule #5c1521, off-white #ece7dc, muted #8f877a,
  accent Saxe blue #4F7CAC (halo ring, play rings, link underlines, live dot, focus).
  Black appears only inside a video frame while it plays.
- Type: Bodoni Moda (name, headings, small-caps plate titles), IBM Plex Sans (body),
  system monospace (nav, captions, labels, footer).
- Hero art: `tools/halo-burgundy.py` (adapted from the round-1 halo renderer). It stores
  only the light added to the field and the page composites it with
  `mix-blend-mode: screen`, so the fade ends at exactly #3a0c14.
- Posters: `tools/posters-burgundy.py` renders `assets/posters/*-burgundy.webp` as dark
  burgundy duotones, so the grid stays one colour until a clip plays.
- Reused: the stepped name from design 01, the halo cut-out from 05, and the plates
  layout and player script from 07, restyled here.
