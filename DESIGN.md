# Design 03: Campaign map

A Napoleonic staff map, an order of battle drawn in ink on bone paper. The six projects are six
engagements set out across the sheet, alternating left and right, each with a small numbered
marker (1 to 6) and a date-like label that gives the real duration. A dotted line of march in Saxon blue
runs down the marker gutter of each engagement and curves across the open paper to the next (drawn by
`site.js` from the marker positions; it redraws on resize). The projects are about mapping and navigation,
so the occupancy-grid and route metaphor is honest. The page is mostly empty paper.

- Palette: paper `#efe9dc` (flat, with an SVG-noise fibre at 5 %), ink `#1b1a17`, soft ink `#57524a`,
  Saxon blue `#1f4aa8` (march line, markers, role, play icon), burgundy `#7a1f2b` (kickers and "Duration" only).
- Type: Bodoni Moda for the name, section titles, ledes and statement; IBM Plex Sans small caps with
  letterspacing for labels; system monospace for durations, step numbers and the clock.
- Motifs: a ruled double border around the sheet, a simple compass cross, hairline frames with "Fig. n"
  legends under each video, a hairline scale bar (0 / 5 / 10 m) in the footer.
- The painting appears once, small: an oval blue-ink cartouche in the corner of the hero
  (`assets/img/cartouche-napoleon.webp`, made with `tools/duotone.py --invert` and a paper field).
- Portrait re-rendered in black ink on paper (`assets/img/portrait-ink.webp`).
- Video posters reuse the existing colour JPGs, printed in ink with a CSS grayscale and multiply; clips play in colour.
- `site.js` keeps one-clip-at-a-time playback and the self-playing pick-up loop; the hover colour reveal is dropped.
  Without JS every clip is a plain `<video controls>` over its poster.
