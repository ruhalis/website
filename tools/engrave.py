# /// script
# requires-python = ">=3.9"
# dependencies = ["pillow", "numpy"]
# ///
"""Line-screen "engraving" in two tones: pale lines on a flat burgundy field.

Every pixel belongs to a horizontal, slightly wavy line; the line is drawn
thicker where the picture is lighter, like a burin cut on a copper plate.

  uv run tools/engrave.py painting.jpg out.webp --width 1200 --height 1600 \
      --crop=-110,-235,3400,4445 --mask tools/napoleon-figure-mask.png
"""
import argparse
import numpy as np
from PIL import Image, ImageFilter, ImageOps


def hexrgb(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float32)


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('input')
    ap.add_argument('output')
    ap.add_argument('--width', type=int, required=True)
    ap.add_argument('--height', type=int)
    ap.add_argument('--crop', help='x0,y0,x1,y1 in source px (may run past the image)')
    ap.add_argument('--mix', default='0.299,0.587,0.114', help='channel weights for the tone')
    ap.add_argument('--levels', default='0.1,0.95')
    ap.add_argument('--auto-levels', help='plo,phi percentiles instead of --levels')
    ap.add_argument('--gamma', type=float, default=1.0)
    ap.add_argument('--mask', help='white = subject; same aspect as the input')
    ap.add_argument('--bg', type=float, default=1.0, help='tone kept outside the mask, 0..1')
    ap.add_argument('--period', type=float, default=5.0, help='line spacing, output px')
    ap.add_argument('--wave', type=float, default=1.2, help='line wobble amplitude, px')
    ap.add_argument('--max-cover', type=float, default=0.85, help='widest line, fraction of the spacing')
    ap.add_argument('--blur', type=float, default=1.0, help='pre-blur, output px')
    ap.add_argument('--vignette', type=float, default=0.0, help='edge fade, fraction of the short side')
    ap.add_argument('--oval', type=float, default=0.0, help='round fade instead of square: start radius, fraction of the half side (e.g. 0.6)')
    ap.add_argument('--field', default='#521320')
    ap.add_argument('--light', default='#f3e6e4')
    ap.add_argument('--quality', type=int, default=74)
    a = ap.parse_args()

    src = ImageOps.exif_transpose(Image.open(a.input)).convert('RGB')
    sw, sh = src.size
    if a.crop:
        x0, y0, x1, y1 = [float(v) for v in a.crop.split(',')]
    else:
        x0, y0, x1, y1 = 0, 0, sw, sh
    W = a.width
    H = a.height or round(W * (y1 - y0) / (x1 - x0))
    bw, bh = x1 - x0, y1 - y0          # cover-fit the crop box into W x H
    if bw / bh > W / H:
        nbw = bh * W / H; x0 += (bw - nbw) / 2; x1 = x0 + nbw
    else:
        nbh = bw * H / W; y0 += (bh - nbh) / 2; y1 = y0 + nbh
    box = (x0, y0, x1, y1)

    def take(img, fill):
        s = img.size[0] / sw
        b = tuple(v * s for v in box)
        k = max(1, int((b[2] - b[0]) / W))   # sample near source scale, then shrink cleanly
        big = img.transform((W * k, H * k), Image.EXTENT, b, Image.BICUBIC, fillcolor=fill)
        return big.resize((W, H), Image.LANCZOS)

    inside = take(Image.new('L', (sw, sh), 255), 0).filter(ImageFilter.GaussianBlur(W * 0.02))
    inside = np.asarray(inside, np.float32) / 255

    rgb = np.asarray(take(src, (0, 0, 0)).filter(ImageFilter.GaussianBlur(a.blur)), np.float32) / 255
    mix = np.array([float(v) for v in a.mix.split(',')], np.float32)
    t = (rgb * mix).sum(-1)
    if a.auto_levels:
        lo, hi = np.percentile(t, [float(v) for v in a.auto_levels.split(',')])
    else:
        lo, hi = [float(v) for v in a.levels.split(',')]
    t = np.clip((t - lo) / max(hi - lo, 1e-3), 0, 1) ** (1 / a.gamma)

    if a.mask:
        m = take(Image.open(a.mask).convert('L'), 0).filter(ImageFilter.GaussianBlur(W * 0.004))
        m = np.asarray(m, np.float32) / 255
        t = t * (a.bg + (1 - a.bg) * m)
    t = t * inside
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    if a.vignette:
        d = np.minimum.reduce([xx, W - 1 - xx, yy, H - 1 - yy]) / (min(W, H) * a.vignette)
        t = t * smooth(0, 1, d)

    if a.oval:
        r = np.hypot((xx - W / 2) / (W / 2), (yy - H / 2) / (H / 2))
        t = t * (1 - smooth(a.oval, 1.0, r))

    # wavy horizontal line screen; low-frequency noise bends the lines
    rng = np.random.default_rng(3)
    n = Image.fromarray((rng.random((H // 40 + 2, W // 40 + 2)) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)
    n = np.asarray(n, np.float32) / 255 - 0.5
    phase = (yy + a.wave * np.sin(xx / (a.period * 9)) + a.wave * 3 * n) / a.period
    dist = np.abs(phase - np.floor(phase) - 0.5) * 2      # 0 on a line's centre, 1 between lines
    cover = np.sqrt(t) * a.max_cover                                    # line width for this tone
    aa = 1.6 / a.period
    ink = np.clip((cover - dist) / aa + 0.5, 0, 1)
    ink = np.where(t < 0.015, 0, ink)

    field, light = hexrgb(a.field), hexrgb(a.light)
    out = field + (light - field) * ink[..., None]
    img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
    kw = {'quality': a.quality}
    if a.output.endswith('.webp'):
        kw['method'] = 6
    img.save(a.output, **kw)
    print(a.output, img.size)


if __name__ == '__main__':
    main()
