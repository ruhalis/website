#!/usr/bin/env -S uv run --script
# /// script
# dependencies = ["numpy>=1.26", "pillow>=10.1"]
# ///
"""Dark posters: every *.jpg in a folder as a very dark, vignetted greyscale webp.

    uv run tools/dark-posters.py assets/posters

Writes <name>-dark.webp next to each JPEG."""
import sys, glob, os, numpy as np
from PIL import Image
d = sys.argv[1]
for p in sorted(glob.glob(d + '/*.jpg')):
    im = Image.open(p).convert('L')
    g = np.asarray(im, dtype=np.float32) / 255
    h, w = g.shape
    v = np.clip((g - 0.12) / 0.88, 0, 1) ** 1.35 * 0.42
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    nx, ny = (xx / w - 0.5) * 2, (yy / h - 0.5) * 2
    r = np.sqrt(nx ** 2 * 0.8 + ny ** 2 * 0.8)
    vig = np.clip(1 - (r - 0.5) / 0.62, 0, 1) ** 1.5
    edge = np.clip(np.minimum.reduce([xx / (0.08 * w), (w - xx) / (0.08 * w), yy / (0.08 * h), (h - yy) / (0.08 * h)]), 0, 1)
    v = v * vig * edge
    out = Image.fromarray((v * 255).astype(np.uint8))
    name = os.path.splitext(p)[0] + '-dark.webp'
    out.save(name, quality=82, method=6)
    print(name, out.size, os.path.getsize(name))
