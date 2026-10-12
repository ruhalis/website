#!/usr/bin/env -S uv run --script
# /// script
# dependencies = ["numpy>=1.26", "pillow>=10.1"]
# ///
"""Posters: every *.jpg in a folder as the same frame, in colour, 20% darker, as webp.

    uv run tools/dark-posters.py assets/posters [factor]

Writes <name>-dark.webp next to each JPEG. factor defaults to 0.8 (linear multiply,
no curve, no vignette), so the poster sits a step below the footage and lifts to it on play."""
import sys, glob, os, numpy as np
from PIL import Image
d = sys.argv[1]
k = float(sys.argv[2]) if len(sys.argv) > 2 else 0.8
for p in sorted(glob.glob(d + '/*.jpg')):
    im = Image.open(p).convert('RGB')
    v = np.asarray(im, dtype=np.float32) * k
    out = Image.fromarray(np.clip(v + 0.5, 0, 255).astype(np.uint8))
    name = os.path.splitext(p)[0] + '-dark.webp'
    out.save(name, quality=82, method=6)
    print(name, out.size, os.path.getsize(name))
