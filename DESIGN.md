# Design 09: Two planes

The modernist counterpart: two flat colour planes meeting at one hard edge, a strict grid, no imagery but a stamp.

- **Planes.** Saxon blue `#1f4aa8` (name, role, intro, CV, index, contact) and burgundy `#6b1e2a` (the six projects, About, footer).
  On wide screens the blue column is five of twelve columns and its contents stay fixed while the burgundy plane scrolls; the edge sits in the middle of the gutter between columns 5 and 6. On phones the planes stack.
- **Grid.** 12 columns from 900px (4 on a phone). The blue plane uses 5 of them, the burgundy 7, both via `subgrid`, so every line on the page sits on one column grid. 8px vertical unit.
- **Type.** IBM Plex Sans only, weights 400 and 600, modular scale 1.25 (0.8 to 5.96rem). Project numerals 01–06 set large in 400.
- **Ink.** `#f2f0ea` on both planes (7.1:1 on blue, 10:1 on burgundy). Secondary text `#c8cfdd` on blue (5.2:1), `#d7c6c4` on burgundy (6.9:1).
- **Image.** One 1-colour stamp of the rider (`assets/img/stamp-rider.png`, cut from the existing colour plate, ~120px), next to the name. Nothing else.
- **Video.** Plain rectangles with a 1px `#f2f0ea` rule; posters re-tinted as a burgundy duotone (`assets/posters/*-burgundy.webp`, made with Pillow from the existing colour posters). A square Play tab sits flush in the bottom-left corner; one clip plays at a time; the 5s loop autoplays in view unless reduced motion is set.
- **Links.** Underlined with a 1px rule; hover inverts (ink background, plane-colour text).
- No serif, no radius, no shadow, no gradient. The halftone hero, detail crops and portrait are not used; `site.js` drops the colour-reveal and keeps the player and an index marker for the section in view.
