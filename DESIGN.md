# Design 13: Saxe halo

Concept: design 05's dark rider, design 01's stepped name and design 07's plates, on pure black.
The rider from David's "Napoleon Crossing the Alps" is a very dark greyscale cut-out dissolving
into black across the right two thirds of a short (about 70vh) hero; one 1.5px Saxe-blue ring is
drawn slowly around his head (static under reduced motion). "Arlan / Baikurazov" in Bodoni Moda
sits left, the surname stepped in by 0.72em, overlapping the dark part of the plate. The six
projects follow at once as two columns of plates (one on phones): small-caps title, 1px rule,
dark greyscale poster, a monospace caption "Plate I. … [3:22, sound]", then the description.
The play control is a small Saxe-blue ring with a triangle. About and Contact sit on the page's
only colour field, one dark burgundy band.

- Palette: field #000; band #3a0c14; accent Saxe blue #4F7CAC (rings, link underlines, focus);
  text #ece7dc, muted #8f877a (#a99e8e on the band); rules rgba(143,135,122,.26).
- Type: Bodoni Moda for the name, section and plate titles and the About statement; IBM Plex Sans
  body; system monospace for labels, captions and the footer.
- Assets: assets/img/hero-halo-{800,1400}.webp from tools/halo-hero.py; assets/posters/*-dark.webp
  from tools/dark-posters.py. The ring SVG is cropped like the picture (cover, top-aligned).
- site.js: one clip plays at a time, the 5 s loop plays while on screen with a Pause switch in
  its caption; without JS every clip is a plain <video controls>. 404.html restyled to match.
