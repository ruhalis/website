#!/usr/bin/env bash
# Re-renders every image in assets/ from the source files in the repo root.
#   bash tools/render-assets.sh            # writes into assets/
#   OUT=/some/dir bash tools/render-assets.sh [hero|details|portrait|posters ...]
# Needs uv and ffmpeg. Output is deterministic.
set -euo pipefail
cd "$(dirname "$0")/.."

OUT="${OUT:-assets}"
FFMPEG="${FFMPEG:-$(command -v ffmpeg || echo /opt/homebrew/bin/ffmpeg)}"
DUO=(uv run tools/duotone.py)
PAINTING="David_-_Napoleon_crossing_the_Alps_-_Malmaison2.jpg"
MASK="tools/napoleon-figure-mask.png"   # hand-traced horse + rider, source coordinates
if [ $# -eq 0 ]; then WHAT=(hero details portrait posters); else WHAT=("$@"); fi
want() { local w; for w in "${WHAT[@]}"; do [ "$w" = "$1" ] && return 0; done; return 1; }

mkdir -p "$OUT/img" "$OUT/posters"

# The painting is warm, so the red channel separates figure from sky best.
NAPOLEON=(--mix 1,0,0 --levels 0.34,0.90 --gamma 1.2 --mask "$MASK")

if want hero; then
  # Wide: figure right of centre, the left third is flat blue for the headline.
  # The crop box runs past the left edge of the painting; that part is flat blue.
  "${DUO[@]}" "$PAINTING" "$OUT/img/hero-napoleon-wide.webp" \
    --width 2400 --height 1350 --crop=-591,120,3427,2380 "${NAPOLEON[@]}" \
    --blur 2.0 --vignette 0.05,0.04,0.05,0.30 --alpha --quality 70
  # Tall: the whole horse and rider.
  "${DUO[@]}" "$PAINTING" "$OUT/img/hero-napoleon-tall.webp" \
    --width 1200 --height 1600 --crop=-110,-235,3400,4445 "${NAPOLEON[@]}" \
    --blur 1.3 --glow-radius 10 --vignette 0.05,0.05,0.05,0.07 --alpha --quality 74
fi

if want details; then
  D=(--width 800 --height 600 --mix 1,0,0 --mask "$MASK" --bg 0.3 --quality 70)
  "${DUO[@]}" "$PAINTING" "$OUT/img/detail-face.webp"      "${D[@]}" --crop=1850,480,2650,1080 --levels 0.30,0.92 --gamma 1.2 --blur 1.6
  "${DUO[@]}" "$PAINTING" "$OUT/img/detail-hand.webp"      "${D[@]}" --crop=1380,290,1980,740 --levels 0.30,0.90 --gamma 1.1 --blur 1.8
  "${DUO[@]}" "$PAINTING" "$OUT/img/detail-horse-eye.webp" "${D[@]}" --crop=930,520,1730,1120 --levels 0.22,0.90 --gamma 1.3 --blur 1.6
  # no mask here: the rock is the subject; less blur keeps the lettering readable
  "${DUO[@]}" "$PAINTING" "$OUT/img/detail-inscription.webp" --width 800 --height 600 --quality 70 \
    --crop=0,3520,800,4120 --mix 0.5,0.4,0.1 --levels 0.22,0.62 --gamma 1.0 --contrast 0.5 --blur 0.9 --glow 0.25
  # true-colour partners for the hover reveal: the same crop boxes, so they register over the halftones
  C=(--width 800 --height 600 --clean --quality 82)
  "${DUO[@]}" "$PAINTING" "$OUT/img/detail-face.jpg"        "${C[@]}" --crop=1850,480,2650,1080
  "${DUO[@]}" "$PAINTING" "$OUT/img/detail-hand.jpg"        "${C[@]}" --crop=1380,290,1980,740
  "${DUO[@]}" "$PAINTING" "$OUT/img/detail-horse-eye.jpg"   "${C[@]}" --crop=930,520,1730,1120
  "${DUO[@]}" "$PAINTING" "$OUT/img/detail-inscription.jpg" "${C[@]}" --crop=0,3520,800,4120
fi

if want portrait; then
  "${DUO[@]}" portrait.JPG "$OUT/img/portrait.jpg" --long-side 1000 --clean --quality 85
  # the studio backdrop is pale cyan: key it out so the background is the flat blue
  "${DUO[@]}" portrait.JPG "$OUT/img/portrait-blue.webp" --long-side 1000 \
    --warm-key 0,45 --levels 0.06,0.72 --gamma 1.3 --blur 1.2 --quality 72
fi

if want posters; then
  TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
  poster() { # name  timestamp  duotone options...
    local name="$1" t="$2"; shift 2
    "$FFMPEG" -v error -y -ss "$t" -i "videos/$name.mp4" -frames:v 1 "$TMP/$name.png"
    "${DUO[@]}" "$TMP/$name.png" "$OUT/posters/$name.jpg" --long-side 1280 --clean --quality 82
    "${DUO[@]}" "$TMP/$name.png" "$OUT/posters/$name-blue.webp" --long-side 1280 --quality 68 "$@"
  }
  # Dark robots on pale floors/screens are inverted so the robot is the light subject.
  poster pickup-policy-rl                        0.31 --auto-levels 35,99.5
  poster safety-person-detection-isaacsim       21.38 --auto-levels 35,99.5
  poster unitree-g1-slam-nav                     5.36 --invert --auto-levels 45,99.5
  poster unitree-g1-voice-control                5.84 --auto-levels 35,99.5
  poster unitree-g1-web-control                100.24 --invert --auto-levels 45,99.5
  poster unitree-go2-inside-building-inspection 62.99 --levels 0.2,0.95 --gamma 0.8 --contrast 0.5
fi

cat > "$OUT/palette.json" <<'JSON'
{
  "blue": "#1f4aa8",
  "light": "#eef2fc",
  "deep": "#143a92"
}
JSON
echo "done -> $OUT"
