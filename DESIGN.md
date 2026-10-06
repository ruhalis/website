# Design 01: Hermes terminal

A quiet terminal log on a near-black field, in the spirit of the Hermes Agent site.

- **Concept:** one large serif name, one small classical image placed off-centre, and the
  projects as a numbered log. Each line has an index, a title, its duration, sound flag and file size,
  and a `> Play` command. Playing opens the footage under that line. Only one line is open at a time.
  Without JS every clip is shown as a plain `<video controls>` over its poster.
- **Palette:** field `#0b0b0c`, parchment `#e8e1d1`, secondary `#9a927f`, hairlines
  `rgba(232,225,209,.18)`. Aged bronze `#a8864e` is used only for section numbers, prompts and the
  focus ring. Saxon blue `#2b4a86` is used only for the live dot while a clip plays.
- **Type:** Bodoni Moda (local) for the name, headings, project titles and contact links. IBM Plex Sans
  (local) for body text. A system monospace stack with wide tracking for every label and piece of metadata.
- **Imagery:** `assets/img/engraving-rider.webp` (576x720, ~120 KB) is new. It crops the rider's head
  and raised hand from `references/David_*.jpg` and redraws them as parchment line engraving on black,
  with line thickness set by luminance. It is shown 288 CSS px wide so the lines stay crisp.
  Posters are the existing colour JPGs, shown as monochrome until a clip plays. The portrait is the
  existing `portrait.jpg`, also shown in monochrome.
- **Structure:** no cards and no shadows, only hairline rules. Sections are numbered `00`-`03` and
  separated by a lot of vertical space. 404.html uses the same system.
