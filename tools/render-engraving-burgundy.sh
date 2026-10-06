#!/usr/bin/env bash
# Pale line engraving and burgundy duotone posters on the #3f0e18 field.
#   bash tools/render-engraving-burgundy.sh
set -euo pipefail
cd "$(dirname "$0")/.."

FIELD='#3f0e18'
LIGHT='#f3e6e4'
EN=(uv run -q tools/engrave.py)
PAINTING="references/David_-_Napoleon_crossing_the_Alps_-_Malmaison2.jpg"
MASK="tools/napoleon-figure-mask.png"

# Hero: the whole horse and rider, 3:4. The red channel separates figure from sky.
# --field is the page colour exactly, so the plate has no visible rectangle.
# Three widths, each with a line spacing of about three device pixels when shown
# near its own size; the browser picks one by srcset, so the lines never alias.
for spec in 600:3.6:0.5 900:4.4:0.7 1200:5.0:0.8; do
  IFS=: read -r w period blur <<< "$spec"
  "${EN[@]}" "$PAINTING" "assets/img/engraving-napoleon-burgundy-$w.webp" --width "$w" --height $((w * 4 / 3)) \
    --crop=-110,-235,3400,4445 --mix 1,0,0 --levels 0.30,0.95 --gamma 1.0 \
    --mask "$MASK" --bg 0.28 --period "$period" --max-cover 0.92 --blur "$blur" --vignette 0.24 \
    --field "$FIELD" --light "$LIGHT" --quality 72
done

# Video posters: the true-colour frames as a quiet burgundy duotone that sits
# in the field; the films play in full colour.
for name in unitree-go2-inside-building-inspection unitree-g1-web-control unitree-g1-slam-nav \
            unitree-g1-voice-control safety-person-detection-isaacsim pickup-policy-rl; do
  g=0.55; [ "$name" = unitree-g1-web-control ] && g=0.3   # mostly white UI: pull it down further
  uv run -q tools/duotone.py "assets/posters/$name.jpg" "assets/posters/$name-wine.webp" --long-side 1280 \
    --auto-levels 3,99.7 --gamma "$g" --contrast 0.25 --soft 0.8 --cell 2 --glow 0.12 --grain 0.6 --blur 0.6 \
    --blue "$FIELD" --light "$LIGHT" --deep "$FIELD" --quality 72
done
