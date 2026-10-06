# Design 04: Marble inscription

A Roman inscription (Trajan's Column base, the Res Gestae) set on flat marble.
One narrow centred column, symmetrical, with very large vertical rhythm. No boxes, no shadows, no gradients.

- **Palette**: marble field `#f4f1ea`; carved-stone letters `#2c2a27`; secondary stone `#5f5a52`;
  hairline rules `rgba(44,42,39,.28)`; rubrication burgundy `#7a1f2b` (section titles, interpuncts, numerals);
  Saxon blue `#2b4a86` only for link underlines, focus rings and the playing indicator dot.
- **Type**: local Bodoni Moda for everything. Headings in spaced capitals; body in roman, ledes in italic.
- **Structure**: name cut in two lines; projects numbered I to VI in burgundy, each title in capitals with
  interpuncts between words, between two hairline rules; the video fills the column (the upright clip is narrower).
  Lift steps are counted I to V. 404 is "CDIV".
- **Imagery**: one image, the BONAPARTE / ANNIBAL rock re-cropped from the full painting in `references/`
  as a stone-grey duotone (`assets/img/stone-inscription.webp`); the portrait as a small stone-grey bust
  (`assets/img/portrait-stone.webp`); video posters re-tinted stone grey (`assets/posters/*-stone.webp`).
  Footage plays in true colour.
- **Behaviour**: `site.js` rewritten: play button over the poster, one clip at a time, elapsed time in the
  caption, the short loop plays while on screen (not under reduced motion). Without JS: plain `<video controls>`.
  The hover colour-reveal is dropped.
