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
  # Each plate is rendered twice from the same framing: the blue halftone, and
  # its true-colour partner (--cutout) that the page reveals on hover. Both get
  # the figure mask and the edge fade, so they register pixel for pixel.
  #
  # Wide (16:9): figure right of centre, the left third is flat blue for the
  # headline. The crop box runs past the left edge of the painting; that part
  # is flat blue. Three widths for srcset. Blur, glow radius, grain size and
  # the exact-blue margin are scaled with the width, and the dither cell is
  # chosen so there are 1600-1800 cells across the plate in every rendition:
  # about 1 to 1.6 device pixels each on the screen that rendition is served to.
  WIDE=(--crop=-591,120,3427,2380 --vignette 0.05,0.04,0.05,0.30)
  HALF=("${NAPOLEON[@]}" --glow 0.3 --grain 0.7 --alpha)
  wide() { # width height blur glow-radius grain-size cell margin quality cutout-feather colour-quality
    "${DUO[@]}" "$PAINTING" "$OUT/img/hero-napoleon-wide-$1.webp" --width "$1" --height "$2" "${WIDE[@]}" "${HALF[@]}" \
      --blur "$3" --glow-radius "$4" --grain-size "$5" --cell "$6" --vignette-margin "$7" --quality "$8"
    "${DUO[@]}" "$PAINTING" "$OUT/img/hero-napoleon-wide-colour-$1.webp" --width "$1" --height "$2" "${WIDE[@]}" \
      --mask "$MASK" --cutout --cutout-feather "$9" --vignette-margin "$7" --quality "${10}"
  }
  wide 3600 2025 0.9  13 1.5 2   9 66 4   80
  wide 2400 1350 0.6   9 1.2 1.5 6 68 2.7 80
  wide 1600  900 0.45  6 1   1   4 74 1.8 82
  # Tall (3:4), for phones: the whole horse and rider.
  TALL=(--width 1200 --height 1600 --crop=-110,-235,3400,4445 --vignette 0.05,0.05,0.05,0.07)
  "${DUO[@]}" "$PAINTING" "$OUT/img/hero-napoleon-tall-1200.webp" "${TALL[@]}" "${HALF[@]}" \
    --blur 0.45 --glow-radius 5 --grain-size 1 --quality 72
  "${DUO[@]}" "$PAINTING" "$OUT/img/hero-napoleon-tall-colour-1200.webp" "${TALL[@]}" \
    --mask "$MASK" --cutout --cutout-feather 1.4 --quality 82
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
