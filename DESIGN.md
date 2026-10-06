# Design 05: Gold halo

Concept: after IMG_5606, a statue almost swallowed by pure black where only the halo is gold.
The rider from David's "Napoleon Crossing the Alps" is a very dark greyscale cut-out that fades
into black, and a single 1.5px gold ring is drawn (once, slowly) around his head. The ring comes
back only as the play button on each clip. Nothing else on the page has colour.

- Palette: field #000, type #d9d6cf, secondary #7d7a73, the ring #c9a24a, one footer hairline #24231f.
- Type: Bodoni Moda (regular, the lightest weight the local variable font has) for the name only;
  IBM Plex Sans for everything else; tiny uppercase labels tracked at 0.26em.
- Layout: left-aligned narrow column, enormous vertical whitespace, the six project titles as a
  sparse numbered list, then each clip on its own screen. Clips have no frame: dark greyscale,
  vignetted posters lift away when played so the footage emerges from the black.
- New assets: assets/img/hero-halo-{800,1400}.webp (from the full-res painting plus
  tools/napoleon-figure-mask.png: desaturated, levels crushed to highlights, vignette to black)
  and assets/posters/*-dark.webp (posters re-rendered dark greyscale). About 170 KB in total.
- Reused: the painting, the figure mask, the poster JPEGs, both local fonts. site.js rewritten
  (no hover colour reveal); one clip plays at a time, the 5 s loop plays while on screen, and
  every clip is a plain <video controls> without JS. 404.html restyled to match.
