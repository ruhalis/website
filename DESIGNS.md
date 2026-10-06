# Ten sparse design directions

Each lives on its own branch, redesigning the same content (name, six videos, About, Contact).
Every branch has a `DESIGN.md` with the concept and palette, and a `design-preview.jpg` full-page screenshot.
Hero screens of all ten, side by side: `design-contact-sheet.jpg`.

| # | Branch | Concept | Field | Accents |
|---|--------|---------|-------|---------|
| 01 | `claude/design-01-hermes-terminal` | Hermes Agent homage: near-black, parchment serif + mono labels, projects as a terminal log, one small engraving of the rider | `#0b0b0c` | bronze `#a8864e`, one Saxon-blue live dot |
| 02 | `claude/design-02-burgundy-engraving` | One flat burgundy field, Napoleon re-cut as a pale line engraving, a single thin circle over the rider (ref. IMG_5602) | `#531320` | rose-cream only, no blue |
| 03 | `claude/design-03-campaign-map` | Staff map on bone paper: six engagements joined by a dotted line of march, oval blue-ink cartouche, scale bar | `#efe9dc` | Saxon blue `#1f4aa8`, burgundy `#7a1f2b` |
| 04 | `claude/design-04-marble-inscription` | Roman inscription on marble: centred capitals, interpuncts, numerals I–VI in burgundy rubrication, the BONAPARTE rock | `#f4f1ea` | burgundy `#7a1f2b`, hint of blue |
| 05 | `claude/design-05-gold-halo` | Pure black, the rider fading into darkness, one gold ring around his head (ref. IMG_5606); the ring is also the play button | `#000000` | gold `#c9a24a` only |
| 06 | `claude/design-06-empty-sky` | One viewport of deep Saxon blue with a tiny rider low in the sky (ref. IMG_5601); titles float with sky between them | `#1a2f6b` | one burgundy live dot |
| 07 | `claude/design-07-bulletin` | 1800s printed bulletin: huge Bodoni masthead, double hairline rules, two text columns, ink halftone of the rider's face | `#f1ebdd` | burgundy rules, blue links |
| 08 | `claude/design-08-chiaroscuro` | Dark oil painting: true-colour detail of the glove, sash and gilded hilt vignetted into black; signature-style name | `#0e0c0b` | the painting's own colours |
| 09 | `claude/design-09-two-planes` | Swiss two-plane split: sticky Saxon-blue column, burgundy project plane, 12-column grid, Plex Sans only, rider as a stamp | `#1f4aa8` / `#6b1e2a` | cream `#f2f0ea` |
| 10 | `claude/design-10-oculus` | Baroque ceiling: pale plaster, oval oculus onto a light-blue duotone of the painting, gold hairline frames (ref. IMG_2762) | `#eceae4` | gold `#b8964f`, burgundy labels |

## Notes common to all branches
- Content, meta tags, JSON-LD, favicons and the 404 page are kept; the old hover colour-reveal was dropped everywhere.
- Each branch bumps `?v=5` on the CSS and JS.
- `og.jpg` (the social share image) is unchanged on every branch and still shows the old blue halftone.
- Playback was verified with a stand-in WebM clip because the headless test browser cannot decode H.264; the real MP4s should get one check in a normal browser.
- Old blue halftone assets remain in the repo on every branch, unused by most of the designs.

To try one locally: `git checkout <branch> && npx http-server -p 8080 .`
