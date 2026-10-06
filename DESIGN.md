# Design 08: Chiaroscuro

The look of a dark oil painting (references IMG_5603, IMG_5604): almost everything is black, and a small pool of
warm colour comes out of it. The hero is a tight true-colour crop of David's "Napoleon Crossing the Alps"
(white glove on the reins, blue sleeve, gold cloak, gilded hilt, red sash). It is lit with Pillow and fades to black,
so the burgundy and gold come from the painting itself. The name sits low at the left edge, like a signature.
The project videos are dark rectangles with no frame. Their posters are very dark colour versions that brighten
slightly on hover, and the footage fades up to full light when it plays. Only one clip plays at a time.

- Field `#0e0c0b`. Text cream `#e6dcc8`, secondary `#8f877a` (5.4:1).
- Accents, kept barely visible: burgundy `#6b1e2a` (the dot shown while a clip is live), Saxon blue `#2b4a86` (link underlines),
  `#5b7cc2` (the same blue lifted so the focus ring is visible).
- Type: Bodoni Moda (name and titles, modest sizes, wide tracking, capitals) and IBM Plex Sans (body text and small spaced labels).
- No boxes or shadows. The only rule is the hairline in the footer.
- New images: `assets/img/chiaro-hero-{wide,tall}.webp`, `portrait-dark`, `detail-inscription-dark`,
  `detail-face-dark` (404), `assets/posters/*-dark.webp`. All are made from the painting in `references/` and the
  existing colour JPEGs (lift shadows down, then a radial light mask into the field colour). About 130 KB in total.
- Rewritten: `index.html`, `404.html`, `assets/css/site.css`, `assets/js/site.js` (the feed logic is kept;
  the hover colour reveal is removed). Cache-busting is `?v=5`.
