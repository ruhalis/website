# /// script
# requires-python = ">=3.9"
# dependencies = ["pillow", "numpy"]
# ///
"""The rider as a very dark greyscale cut-out that dissolves into pure black.

  uv run tools/halo-hero.py <repo root> <output dir>
writes hero-halo-1400.webp and hero-halo-800.webp and prints the head position
(the centre of the ring drawn over it in CSS).
"""
import sys, numpy as np
from PIL import Image, ImageFilter
root = sys.argv[1]; out = sys.argv[2]
src = Image.open(root+'/references/David_-_Napoleon_crossing_the_Alps_-_Malmaison2.jpg').convert('L')
W,H = src.size
mask = Image.open(root+'/tools/napoleon-figure-mask.png').resize((W,H), Image.LANCZOS)
mask = mask.filter(ImageFilter.GaussianBlur(110))
# crop: rider and horse
box = (500, 250, 3394, 3650)
g = np.asarray(src.crop(box), dtype=np.float32)/255
m = np.asarray(mask.crop(box), dtype=np.float32)/255
# crush levels: keep only highlights
v = np.clip((g-0.42)/0.58, 0, 1) ** 1.7
v = v * (0.18 + 0.82*m)
h, w = v.shape
# head (face) in crop coords
hx, hy = 2180-box[0], 830-box[1]
yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
d = np.hypot((xx-hx)/w, (yy-hy)/h*1.15)
vig = np.clip(1 - (d-0.12)/0.62, 0, 1) ** 1.8
edge = np.clip(np.minimum.reduce([xx/(0.32*w), (w-xx)/(0.06*w), (h-yy)/(0.22*h), yy/(0.1*h)]),0,1)
v = v * vig * edge * 0.68
img = Image.fromarray((np.clip(v,0,1)*255).astype(np.uint8))
print('crop', w, h, 'head', hx, hy)
for tw in (1400, 800):
    th = round(h*tw/w)
    im = img.resize((tw, th), Image.LANCZOS)
    im.save(f'{out}/hero-halo-{tw}.webp', quality=90, method=6)
    print(tw, th, 'head', round(hx*tw/w), round(hy*tw/w))
