# Design 10: Oculus

Looking up into a baroque ceiling (Pozzo, Sant'Ignazio): pale plaster, a gold-ringed oval opening,
and through it a soft Saxon-blue sky with David's rider pointing upward.

- Field: pale plaster `#eceae4`. Text: graphite `#2a2926`, secondary `#5a5750` (6:1).
- Gold `#b8964f`: hairlines only (the oculus ring, the video frames, link underlines, the portrait roundel).
- Burgundy `#7a1f2b`: small-caps section labels only. Saxon blue `#2b4a86` / `#223a6b`: the duotone shadows, hover and focus.
- Type: Bodoni Moda for the name, project titles and ledes; IBM Plex Sans for everything else.
- Layout: one centred, symmetrical column; lots of plaster; no shadows, fills or boxes beyond hairline frames.
- Hero: `assets/img/oculus.webp`, a light duotone of the painting (rendered with `tools/duotone.py`, plaster highlights, blue shadows), clipped to an oval with a single gold ring held off it.
- Projects: six rectangular `<video controls>` with pale-blue duotone posters (`assets/posters/*-pale.webp`), each in a gold hairline frame.
  With JS, a small plaster-and-gold play medallion hides the native controls until a clip is started; one clip plays at a time. Without JS they are plain video players.
- About: a small round pale portrait (`assets/img/portrait-pale.webp`) in a gold roundel.
- Reused: the painting source, colour posters and portrait as inputs, the two local fonts, favicons, meta tags, JSON-LD. 404 page restyled with the same oculus.
