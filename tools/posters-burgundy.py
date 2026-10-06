#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy>=1.26", "pillow>=10.1"]
# ///
"""Dark burgundy duotone posters for the "Halo on burgundy" design.

    uv run tools/posters-burgundy.py      # reads assets/posters/*.jpg, writes *-burgundy.webp

Luminance is pressed down (the plates stay dark on the #3a0c14 field) and mapped
through near-black burgundy -> #5c1521 -> rose-cream, so the grid is one colour
until a clip plays.
"""
import glob, os
import numpy as np
from PIL import Image, ImageOps

STOPS = [(0.00, (0x14, 0x05, 0x08)),
         (0.55, (0x5c, 0x15, 0x21)),
         (1.00, (0xc8, 0xa9, 0xa2))]

def ramp(t):
    out = np.zeros(t.shape + (3,), np.float32)
    for (a, ca), (b, cb) in zip(STOPS, STOPS[1:]):
        sel = (t >= a) & (t <= b)
        k = ((t[sel] - a) / (b - a))[..., None]
        out[sel] = np.array(ca) + k * (np.array(cb) - np.array(ca))
    return out

here = os.path.dirname(os.path.abspath(__file__))
posters = os.path.join(here, '..', 'assets', 'posters')
for src in sorted(glob.glob(os.path.join(posters, '*.jpg'))):
    g = ImageOps.autocontrast(Image.open(src).convert('L'), cutoff=1)
    t = (np.asarray(g, np.float32) / 255) ** 1.35 * 0.86
    img = Image.fromarray(ramp(t).round().clip(0, 255).astype(np.uint8), 'RGB')
    dst = src[:-4] + '-burgundy.webp'
    img.save(dst, quality=80, method=6)
    print(os.path.basename(dst), img.size, os.path.getsize(dst) // 1024, 'KB')
