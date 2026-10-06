#!/usr/bin/env bash
# Assets for the "Engraving on black" design.
#   bash tools/render-engraving-black.sh
# 1. The horse and rider as a line-screen engraving: off-white burin lines on black
#    (tools/engrave-02.py; tall crop for the right half of the hero).
# 2. The six video posters as dark grey-on-black duotones (tools/duotone.py), so the
#    plates grid stays monochrome until a clip plays.
set -euo pipefail
cd "$(dirname "$0")/.."

PAINTING="references/David_-_Napoleon_crossing_the_Alps_-_Malmaison2.jpg"
MASK="tools/napoleon-figure-mask.png"
FIELD='#0b0b0c'

# 600 px is the hero's width on a laptop at 1x, 1200 px the same plate at 2x:
# the same number of lines in both, so neither is resampled into moire.
for spec in "600 3 0.6 0.5" "1200 6 1.2 0.8"; do      # width, line period, wave, blur (px)
  read -r w p wave blur <<< "$spec"; h=$(( w * 5 / 4 ))
  uv run -q tools/engrave-02.py "$PAINTING" "assets/img/engraving-black-$w.webp" --width "$w" --height "$h" \
    --crop=-60,-120,3400,4205 --mix 1,0,0 --levels 0.30,0.95 --gamma 1.0 \
    --mask "$MASK" --bg 0.24 --period "$p" --wave "$wave" --max-cover 0.92 --blur "$blur" \
    --vignette 0.2 --field "$FIELD" --light '#e8e1d1' --quality 72
done

for name in unitree-go2-inside-building-inspection unitree-g1-web-control unitree-g1-slam-nav \
            unitree-g1-voice-control safety-person-detection-isaacsim pickup-policy-rl; do
  g=0.6; [ "$name" = unitree-g1-web-control ] && g=0.35   # mostly white UI: pull it down further
  uv run -q tools/duotone.py "assets/posters/$name.jpg" "assets/posters/$name-black.webp" --long-side 1280 \
    --auto-levels 3,99.7 --gamma "$g" --contrast 0.25 --soft 0.85 --cell 2 --glow 0.08 --grain 0.5 --blur 0.6 \
    --blue "$FIELD" --light '#77716a' --deep '#050505' --quality 72
done
