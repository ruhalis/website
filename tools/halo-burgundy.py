#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy>=1.26", "pillow>=10.1"]
# ///
"""Halo hero on burgundy: the rider as a pale rose-cream cut-out that dissolves
into the page field (#3a0c14).

    uv run tools/halo-burgundy.py . assets/img

Adapted from the round-1 "gold halo" renderer (dark greyscale fading to black).
The same crushed-highlight greyscale `v` (0..1) is computed from David's painting
and tools/napoleon-figure-mask.png, then mapped to colour as

    out = field + v * (tint(v) - field)

where tint() runs from a dusty rose in the mid-tones to a rose-cream in the
highlights. To keep the dissolve exact through lossy WebP, the file stores not
`out` but the light that a CSS `mix-blend-mode: screen` must add to the field:

    light = 1 - (1 - out) / (1 - field)     so that  screen(field, light) = out

Where v is 0 the light is pure black, which WebP keeps as exact 0, and
screen(field, 0) is exactly the field, so the fade ends at #3a0c14 to the bit.
Writes assets/img/hero-halo-burgundy-{1400,800}.webp (~20-30 KB each) and a
flattened preview hero-halo-burgundy-flat.jpg into the scratch dir if given.
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

FIELD = np.array([0x3a, 0x0c, 0x14], dtype=np.float32)
ROSE = np.array([0xb9, 0x8a, 0x8a], dtype=np.float32)   # mid-tone tint
CREAM = np.array([0xf0, 0xe2, 0xd6], dtype=np.float32)  # highlight tint

root = sys.argv[1] if len(sys.argv) > 1 else '.'
out = sys.argv[2] if len(sys.argv) > 2 else 'assets/img'

src = Image.open(root + '/references/David_-_Napoleon_crossing_the_Alps_-_Malmaison2.jpg').convert('L')
W, H = src.size
mask = Image.open(root + '/tools/napoleon-figure-mask.png').convert('L').resize((W, H), Image.LANCZOS)
mask = mask.filter(ImageFilter.GaussianBlur(110))
box = (560, 250, 3394, 2650)  # rider and the horse's head and chest (a short hero)
g = np.asarray(src.crop(box), dtype=np.float32) / 255
m = np.asarray(mask.crop(box), dtype=np.float32) / 255
v = np.clip((g - 0.42) / 0.58, 0, 1) ** 1.7
v = v * (0.18 + 0.82 * m)
h, w = v.shape
hx, hy = 2180 - box[0], 830 - box[1]  # the head, crop coords
yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
d = np.hypot((xx - hx) / w, (yy - hy) / h * 1.15)
vig = np.clip(1 - (d - 0.10) / 0.70, 0, 1) ** 1.6
edge = np.clip(np.minimum.reduce([xx / (0.32 * w), (w - xx) / (0.06 * w),
                                  (h - yy) / (0.22 * h), yy / (0.1 * h)]), 0, 1)
v = np.clip(v * vig * edge, 0, 1) ** 0.85

t = np.clip(v / 0.8, 0, 1)[..., None] ** 0.8
tint = ROSE + t * (CREAM - ROSE)
out_rgb = FIELD + v[..., None] * (tint - FIELD)              # what the eye should see
light = 255 * (1 - (255 - out_rgb) / (255 - FIELD))          # what the file stores
light = Image.fromarray(light.round().clip(0, 255).astype(np.uint8), 'RGB')

print('crop', w, h, 'head', hx, hy)
for tw in (1400, 800):
    th = round(h * tw / w)
    light.resize((tw, th), Image.LANCZOS).save(f'{out}/hero-halo-burgundy-{tw}.webp', quality=86, method=6)
    print(tw, th, 'head', round(hx * tw / w), round(hy * tw / w))
if len(sys.argv) > 3:
    flat = Image.fromarray(out_rgb.round().clip(0, 255).astype(np.uint8), 'RGB')
    flat.resize((900, round(h * 900 / w)), Image.LANCZOS).save(sys.argv[3] + '/hero-halo-burgundy-flat.jpg', quality=85)
