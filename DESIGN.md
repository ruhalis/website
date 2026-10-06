# Design 13f: Saxe halo, blue and burgundy, lifted

Variant: design 13d with more contrast so the page reads less dark. Field stays pure black; the
band is a visible burgundy #5a1828 (was #3a0c14); headings and plate titles #dc5f7b (6.0:1, was
#9c2f44 at 2.9:1); Saxe #84aee3 (9.1:1, was #4F7CAC); ink #f8f5ef; muted #bdb5a8 (10:1); band
muted #cdbfb0 (7.3:1 on the band); Saxe on the band 5.7:1; hero credit #857e73 (5.2:1); rules
rgba(170,162,148,.32). The hero rider is lifted with filter: brightness(1.6) contrast(1.05)
on the black field (no glow behind him); the posters get brightness(1.25); black stays black,
so nothing seams. A navy glow behind the rider was tried and dropped. Design 13e (ink-navy and
brass) was tried and reverted.

## Previous: design 13d

Variant: design 13 unchanged except for text colour. The stepped name, the role line and the
monospace plate captions are Saxe blue #4F7CAC; the "Projects" heading and the six small-caps
plate titles are a legible burgundy #9c2f44. On the dark burgundy band the "About" and "Contact"
headings are Saxe blue instead. Body paragraphs stay off-white/muted; rules stay grey.
Contrast (WCAG): Saxe on black 4.81:1; #9c2f44 on black 2.90:1 (display sizes only, 1.45rem+,
just under 3:1); Saxe on band #3a0c14 3.87:1; ink #ece7dc on black 17.03:1, on band 13.71:1;
band muted #a99e8e on band 6.41:1.

## Base: design 13, Saxe halo

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
- Type: Bodoni Moda for the name and the About statement; Montserrat Light (300) for the Projects
  heading, plate titles and body; system monospace for labels, captions and the footer.
- Assets: assets/img/hero-halo-{800,1400}.webp from tools/halo-hero.py; assets/posters/*-dark.webp
  from tools/dark-posters.py. The ring SVG is cropped like the picture (cover, top-aligned).
- site.js: one clip plays at a time and nothing autoplays (the 5 s pick-up clip loops once started);
  without JS every clip is a plain <video controls>. 404.html restyled to match.

Video posters are plain dark greyscale with no vignette.
