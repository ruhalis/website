# Design 13e: Saxe halo, ink-navy and brass

Variant: design 13d with a lighter palette. The page is ink-navy #11151b instead of pure black,
the band is navy #1c2b40 instead of burgundy, and burgundy is gone: the "Projects" heading and the
six small-caps plate titles are brass #d0a861. The stepped name, the role line and the monospace
plate captions stay Saxe blue, lifted to #7ea3cf; "About" and "Contact" on the band are Saxe too.
The hero plate uses mix-blend-mode: screen so its baked-in black melts into the navy field. The
footage boxes keep a true-black screen (--screen) so the dark posters show no seam.
Contrast (WCAG): Saxe on field 7.0:1, on band 5.5:1; brass on field 8.2:1, on band 6.4:1;
ink #ece8df on field 15.0:1, on band 11.7:1; muted #9a9a95 on field 6.5:1, on band 5.1:1;
band muted #b3b6ba on band 7.0:1; hero credit #808186 on field 4.7:1.

## Base: design 13, Saxe halo

Concept: design 05's dark rider, design 01's stepped name and design 07's plates, on pure black.
The rider from David's "Napoleon Crossing the Alps" is a very dark greyscale cut-out dissolving
into black across the right two thirds of a short (about 70vh) hero; one 1.5px Saxe-blue ring is
drawn slowly around his head (static under reduced motion). "Arlan / Baikurazov" in Bodoni Moda
sits left, the surname stepped in by 0.72em, overlapping the dark part of the plate. The six
projects follow at once as two columns of plates (one on phones): small-caps title, 1px rule,
dark greyscale poster, a monospace caption "Plate I. … [3:22, sound]", then the description.
The play control is a small Saxe-blue ring with a triangle. About and Contact sit on the page's
only colour field, one navy band.

- Palette: field #11151b; band #1c2b40; screen #000 behind footage; accent Saxe blue #7ea3cf
  (rings, link underlines, focus, name, captions); headings brass #d0a861; text #ece8df,
  muted #9a9a95 (#b3b6ba on the band); rules rgba(154,154,149,.24).
- Type: Bodoni Moda for the name, section and plate titles and the About statement; IBM Plex Sans
  body; system monospace for labels, captions and the footer.
- Assets: assets/img/hero-halo-{800,1400}.webp from tools/halo-hero.py; assets/posters/*-dark.webp
  from tools/dark-posters.py. The ring SVG is cropped like the picture (cover, top-aligned).
- site.js: one clip plays at a time, the 5 s loop plays while on screen with a Pause switch in
  its caption; without JS every clip is a plain <video controls>. 404.html restyled to match.

Video posters are plain dark greyscale with no vignette.
