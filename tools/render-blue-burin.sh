#!/usr/bin/env bash
# Plates for the "Blue burin" design: Saxe-blue burin lines on black.
#   bash tools/render-blue-burin.sh
set -euo pipefail
cd "$(dirname "$0")/.."

EN=(uv run -q tools/engrave-02.py)
PAINTING="references/David_-_Napoleon_crossing_the_Alps_-_Malmaison2.jpg"
MASK="tools/napoleon-figure-mask.png"
BLUE='#4F7CAC'

# Hero, 16:9: the crop runs far past the painting's left edge (black there),
# so the rider sits right of centre and the left half is free for the name.
"${EN[@]}" "$PAINTING" assets/img/burin-napoleon-wide-2400.webp --width 2400 --height 1350 \
  --crop=-4100,-350,4167,4300 --mix 1,0,0 --levels 0.36,0.96 --gamma 1.15 \
  --mask "$MASK" --bg 0.05 --edge-soft 0.035 --period 5 --max-cover 0.88 --blur 0.8 --vignette 0.17 \
  --fade-left 0.45,0.70 --field '#000000' --light "$BLUE" --quality 70

# Phone: the same rider upright, fading out at the bottom where the name sits.
"${EN[@]}" "$PAINTING" assets/img/burin-napoleon-tall-780.webp --width 780 --height 1040 \
  --crop=-60,-120,3460,4040 --mix 1,0,0 --levels 0.36,0.96 --gamma 1.15 \
  --mask "$MASK" --bg 0.05 --edge-soft 0.035 --period 4.6 --max-cover 0.9 --blur 0.8 --vignette 0.10 \
  --fade-bottom 0.48,0.86 --field '#000000' --light "$BLUE" --quality 70

# Video posters: dark grey duotones, so the grid is monochrome until a clip plays.
for name in unitree-go2-inside-building-inspection unitree-g1-web-control unitree-g1-slam-nav \
            unitree-g1-voice-control safety-person-detection-isaacsim pickup-policy-rl; do
  g=0.6; [ "$name" = unitree-g1-web-control ] && g=0.35   # mostly white UI: pull it down further
  uv run -q tools/duotone.py "assets/posters/$name.jpg" "assets/posters/$name-grey.webp" --long-side 1280 \
    --auto-levels 3,99.7 --gamma "$g" --contrast 0.25 --soft 0.8 --cell 2 --grain 0.5 --blur 0.6 \
    --blue '#0b0b0c' --light '#8e8a83' --deep '#000000' --quality 72
done
