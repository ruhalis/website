# Design 06: Empty sky

After the falling figure in a vast Saxon-blue sky (reference IMG_5601). The first screen is a full viewport of a single deep blue. The only other things on it are a small, soft blue silhouette of David's Napoleon placed low and off centre, the name in tiny type in the top-left corner, and the intro sentence.

- **Concept:** the sparsest design of the set. There are no rules, boxes, cards or grid lines. The six project titles float large and alone, with a lot of sky between them. The clips have no frames: each poster is re-tinted into the sky blue and its edges dissolve, so it reads as a soft shape until it is played.
- **Palette:** sky `#1a2f6b`, which lightens very softly to `#223a7a` at the foot of the first screen. Text is cloud `#e9edf7`. Secondary text is haze `#a9b6dd`, at 6.3:1 on the sky and 5.3:1 on the lighter blue. Burgundy `#8a2a3a` appears once, as the dot beside "Live" while a clip plays (not for the ambient loop).
- **Type:** IBM Plex Sans for all body text and labels. Bodoni Moda is used only for the six project titles.
- **Images:**
  - `assets/img/sky-rider.webp` (33 KB) is the horse and rider, cut out with `tools/napoleon-figure-mask.png`. It is a dark-blue duotone with Gaussian softening and a feathered alpha. It is about 15vw wide on desktop and 27vw on phones, and drifts very slowly (the drift is off under reduced motion).
  - `assets/posters/*-sky.webp` are new posters made from the colour JPGs: a duotone from the sky blue to `#6377b3`, softly blurred, 4–11 KB each.
  - `assets/img/portrait-sky.webp` is the portrait in the same blues.
- **Reused:** both local fonts, the play/one-at-a-time/loop logic from the old `site.js` (with the hover colour reveal removed), the meta tags, JSON-LD and favicons.
- **Dropped for sparseness:** the hero detail windows (hand, face, horse eye), the inscription crop and the top nav. The skip link remains.
- **404:** the same empty sky with the small rider.
