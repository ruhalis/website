#!/usr/bin/env bash
# Burgundy line-engraved plates for the burgundy design (see tools/engrave.py).
#   bash tools/render-burgundy.sh
set -euo pipefail
cd "$(dirname "$0")/.."

EN=(uv run -q tools/engrave.py)
PAINTING="references/David_-_Napoleon_crossing_the_Alps_-_Malmaison2.jpg"
MASK="tools/napoleon-figure-mask.png"

# Hero: the whole horse and rider, 3:4. The red channel separates figure from sky.
"${EN[@]}" "$PAINTING" assets/img/engraving-napoleon-1400.webp --width 1400 --height 1866 \
  --crop=-110,-235,3400,4445 --mix 1,0,0 --levels 0.30,0.95 --gamma 1.0 \
  --mask "$MASK" --bg 0.28 --period 5 --max-cover 0.92 --blur 0.8 --vignette 0.24 --quality 72

# Video posters: the true-colour frames as a quiet burgundy duotone, darkened
# so that they sit in the field; the films play in full colour.
for name in unitree-go2-inside-building-inspection unitree-g1-web-control unitree-g1-slam-nav \
            unitree-g1-voice-control safety-person-detection-isaacsim pickup-policy-rl; do
  g=0.55; [ "$name" = unitree-g1-web-control ] && g=0.3   # mostly white UI: pull it down further
  uv run -q tools/duotone.py "assets/posters/$name.jpg" "assets/posters/$name-burgundy.webp" --long-side 1280 \
    --auto-levels 3,99.7 --gamma "$g" --contrast 0.25 --soft 0.8 --cell 2 --glow 0.12 --grain 0.6 --blur 0.6 \
    --blue '#521320' --light '#f3e6e4' --deep '#3f0e18' --quality 72
done
