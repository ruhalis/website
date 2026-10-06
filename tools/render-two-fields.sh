#!/usr/bin/env bash
# Images for the "two fields" design: black hero over a dark burgundy field.
#   bash tools/render-two-fields.sh
# Needs uv. Writes into assets/img and assets/posters.
set -euo pipefail
cd "$(dirname "$0")/.."

PAINTING="references/David_-_Napoleon_crossing_the_Alps_-_Malmaison2.jpg"
MASK="tools/napoleon-figure-mask.png"
FIELD='#3f0e18'      # the burgundy field
CREAM='#e8e1d1'

# 1. Top field: the rider as a very dark greyscale cut-out dissolving into black.
#    The Saxe-blue ring around his head is drawn in CSS (head at 58.1%, 17.1%).
uv run -q tools/halo-hero.py . assets/img

# 2. Contact: a small line engraving of the rider's head, cream lines on burgundy,
#    fading to the field in a circle.
uv run -q tools/engrave.py "$PAINTING" assets/img/engraving-head-480.webp --width 480 --height 480 \
  --crop=1680,400,2530,1250 --mix 1,0,0 --levels 0.30,0.95 --gamma 0.9 \
  --mask "$MASK" --bg 0.15 --period 4 --max-cover 0.88 --blur 0.8 --oval 0.55 \
  --field "$FIELD" --light "$CREAM" --quality 78

# 3. Posters: the true-colour frames as dark burgundy duotones, so the grid is
#    monochrome until a clip plays.
for name in unitree-go2-inside-building-inspection unitree-g1-web-control unitree-g1-slam-nav \
            unitree-g1-voice-control safety-person-detection-isaacsim pickup-policy-rl; do
  tone=(--auto-levels 3,99.7 --gamma 0.42)
  # mostly white UI: map white to a mid burgundy instead of cream
  [ "$name" = unitree-g1-web-control ] && tone=(--levels 0.02,1.5 --gamma 0.6)
  uv run -q tools/duotone.py "assets/posters/$name.jpg" "assets/posters/$name-burgundy.webp" --long-side 1280 \
    "${tone[@]}" --contrast 0.25 --soft 0.8 --cell 2 --glow 0.1 --grain 0.5 --blur 0.6 \
    --blue "$FIELD" --light '#d2bfba' --deep '#3a0c14' --quality 72
done

# 4. About: the portrait in the same burgundy duotone.
uv run -q tools/duotone.py assets/img/portrait.jpg assets/img/portrait-burgundy.webp --width 667 \
  --levels 0.04,1.6 --gamma 0.75 --contrast 0.3 --soft 0.8 --cell 2 --glow 0.1 --grain 0.5 --blur 0.5 --vignette 0.14 \
  --blue "$FIELD" --light '#d2bfba' --deep '#3a0c14' --quality 74
