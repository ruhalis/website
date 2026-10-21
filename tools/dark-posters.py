#!/usr/bin/env -S uv run --script
# /// script
# dependencies = ["numpy>=1.26", "pillow>=10.1"]
# ///
"""Posters: each video frame in colour, 20% darker, as webp at the frame's own size.

    uv run tools/dark-posters.py OUT_DIR FRAME.png [FRAME.png ...] [--factor 0.8]

Writes OUT_DIR/<frame name>-dark.webp for each frame. tools/render-assets.sh passes the
lossless PNG straight from ffmpeg, so the poster has the video's resolution and is encoded
once. Linear multiply by factor (no curve, no vignette), so the poster sits a step below
the footage and lifts to it on play."""
import argparse, os, numpy as np
from PIL import Image
p = argparse.ArgumentParser()
p.add_argument('out_dir')
p.add_argument('frames', nargs='+')
p.add_argument('--factor', type=float, default=0.8)
p.add_argument('--quality', type=int, default=90)
a = p.parse_args()
for f in a.frames:
    im = Image.open(f).convert('RGB')
    v = np.asarray(im, dtype=np.float32) * a.factor
    out = Image.fromarray(np.clip(v + 0.5, 0, 255).astype(np.uint8))
    name = os.path.join(a.out_dir, os.path.splitext(os.path.basename(f))[0] + '-dark.webp')
    out.save(name, quality=a.quality, method=6)
    print(name, out.size, os.path.getsize(name))
