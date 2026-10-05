#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "numpy>=1.26",
#     "pillow>=10.1",
# ]
# ///
"""Blue-screen duotone: turn any image into a two-tone ordered-dither picture.

    uv run tools/duotone.py INPUT OUTPUT --width 1280 [options]

Pipeline (all sizes are OUTPUT pixels, so the texture has the same scale on
every render):

    crop/pad -> resize -> tone (channel mix, optional keys/masks) -> levels
    -> soft blur -> bloom -> Bayer ordered dither on a `--cell`-pixel grid,
    blended with the continuous tone -> grain -> two-colour map -> edge fade

Colour model: `out = blue + v * (light - blue)` plus grain that swings between
`deep` (the darkest shadow blue) and brighter blues with mean exactly `blue`.
Where the edge fade (`--vignette`) reaches zero the pixel is exactly `blue`
before encoding; add `--alpha` to make those pixels transparent as well, which
keeps the dissolve exact through lossy WebP.

Output is deterministic: the grain is a coordinate hash seeded by `--seed`.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

# Site palette (see assets/palette.json). The look is modelled on an electric
# ultramarine reference (#0e0ef1 field, #0101e8 shadows, #fefeff highlights);
# the site uses Saxon blue instead.
DEFAULT_BLUE = "#1f4aa8"   # flat field = page background (mean of the grainy field)
DEFAULT_LIGHT = "#eef2fc"  # cool near-white highlight
DEFAULT_DEEP = "#143a92"   # darkest shadow blue (grain floor), derived from the blue

BAYER = {
    2: np.array([[0, 2], [3, 1]], dtype=np.float32),
    4: np.array(
        [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]],
        dtype=np.float32,
    ),
}
BAYER[8] = np.block(
    [
        [4 * BAYER[4] + 0, 4 * BAYER[4] + 2],
        [4 * BAYER[4] + 3, 4 * BAYER[4] + 1],
    ]
).astype(np.float32)


# ----------------------------------------------------------------- helpers
def hex_rgb(text: str) -> np.ndarray:
    t = text.strip().lstrip("#")
    if len(t) == 3:
        t = "".join(c * 2 for c in t)
    if len(t) != 6:
        raise argparse.ArgumentTypeError(f"bad colour {text!r}, want #rrggbb")
    return np.array([int(t[i : i + 2], 16) for i in (0, 2, 4)], dtype=np.float32)


def floats(n: int, name: str):
    def parse(text: str) -> tuple[float, ...]:
        parts = [p for p in text.replace(" ", "").split(",") if p != ""]
        if len(parts) != n:
            raise argparse.ArgumentTypeError(f"{name} wants {n} comma-separated numbers")
        return tuple(float(p) for p in parts)

    return parse


def vignette_arg(text: str) -> tuple[float, ...]:
    parts = [float(p) for p in text.replace(" ", "").split(",") if p != ""]
    if len(parts) not in (1, 4):
        raise argparse.ArgumentTypeError("--vignette wants 1 or 4 numbers")
    return tuple(parts)


def smoothstep(x: np.ndarray) -> np.ndarray:
    x = np.clip(x, 0.0, 1.0)
    return x * x * (3.0 - 2.0 * x)


def f_resize(a: np.ndarray, size: tuple[int, int], resample) -> np.ndarray:
    """Resize a float32 2-D array; size is (width, height)."""
    if (a.shape[1], a.shape[0]) == tuple(size):
        return a
    im = Image.fromarray(np.ascontiguousarray(a, dtype=np.float32))
    return np.asarray(im.resize(size, resample), dtype=np.float32)


def _blur_axis(a: np.ndarray, k: np.ndarray, axis: int) -> np.ndarray:
    r = len(k) // 2
    pad = [(0, 0), (0, 0)]
    pad[axis] = (r, r)
    p = np.pad(a, pad, mode="edge")
    out = np.zeros_like(a)
    n = a.shape[axis]
    for i, w in enumerate(k):
        sl = [slice(None), slice(None)]
        sl[axis] = slice(i, i + n)
        out += w * p[tuple(sl)]
    return out


def gaussian(a: np.ndarray, sigma: float) -> np.ndarray:
    """Separable gaussian blur; large radii are done on a reduced copy."""
    if sigma <= 0.05:
        return a
    h, w = a.shape
    f = int(sigma // 3)
    if f >= 2:
        small = f_resize(a, (max(1, round(w / f)), max(1, round(h / f))), Image.BOX)
        small = gaussian(small, sigma / f)
        return f_resize(small, (w, h), Image.BICUBIC)
    r = max(1, int(np.ceil(sigma * 3)))
    x = np.arange(-r, r + 1, dtype=np.float32)
    k = np.exp(-(x * x) / (2 * sigma * sigma))
    k /= k.sum()
    return _blur_axis(_blur_axis(a, k, 0), k, 1)


def hash_uniform(h: int, w: int, seed: int) -> np.ndarray:
    """Deterministic per-pixel uniform noise in (0, 1), independent of numpy's RNG."""
    y, x = np.meshgrid(
        np.arange(h, dtype=np.uint32), np.arange(w, dtype=np.uint32), indexing="ij"
    )
    with np.errstate(over="ignore"):
        v = x * np.uint32(0x9E3779B1) + y * np.uint32(0x85EBCA77)
        v = v + np.uint32((seed * 0x27D4EB2F + 0x165667B1) & 0xFFFFFFFF)
        v ^= v >> np.uint32(16)
        v *= np.uint32(0x7FEB352D)
        v ^= v >> np.uint32(15)
        v *= np.uint32(0x846CA68B)
        v ^= v >> np.uint32(16)
    return (v.astype(np.float64) + 0.5) / 4294967296.0


def edge_mask(h: int, w: int, fades: tuple[float, float, float, float], margin: float) -> np.ndarray:
    """1 in the middle, 0 within `margin` px of an edge, smooth over the per-edge
    fade widths (left, top, right, bottom) in px. A zero width leaves that edge alone."""
    fl, ft, fr, fb = fades
    x = np.arange(w, dtype=np.float32) + 0.5
    y = np.arange(h, dtype=np.float32) + 0.5

    def ramp(d: np.ndarray, fade: float) -> np.ndarray:
        if fade <= 0:
            return np.ones_like(d)
        return smoothstep((d - margin) / fade)

    mx = ramp(x, fl) * ramp(w - x, fr)
    my = ramp(y, ft) * ramp(h - y, fb)
    return (my[:, None] * mx[None, :]).astype(np.float32)


def vignette_px(args, w: int, h: int, scale: float = 1.0) -> tuple[float, float, float, float] | None:
    v = args.vignette
    if not v or max(v) <= 0:
        return None
    if len(v) == 1:
        v = v * 4
    s = min(w, h) * scale
    return tuple(f * s for f in v)  # type: ignore[return-value]


# -------------------------------------------------------------------- core
def load_and_frame(args) -> tuple[Image.Image, np.ndarray, Image.Image | None]:
    """Returns the framed RGB image, a 0..1 coverage map (0 = padding outside the
    source) and the framed external mask (or None), all at output size."""
    src = ImageOps.exif_transpose(Image.open(args.input))
    if src.mode in ("RGBA", "LA", "P"):
        rgba = src.convert("RGBA")
        bg = Image.new("RGBA", rgba.size, (0, 0, 0, 255))
        src = Image.alpha_composite(bg, rgba)
    src = src.convert("RGB")
    sw, sh = src.size

    mask_src = None
    if args.mask:
        mask_src = Image.open(args.mask).convert("L")
        if mask_src.size != (sw, sh):
            mask_src = mask_src.resize((sw, sh), Image.BILINEAR)

    box = tuple(args.crop) if args.crop else (0.0, 0.0, float(sw), float(sh))
    bw, bh = box[2] - box[0], box[3] - box[1]
    if bw <= 0 or bh <= 0:
        sys.exit("crop box is empty")

    if args.width and args.height:
        ow, oh = args.width, args.height
        # cover: shrink the box to the output aspect, keeping its centre
        want = ow / oh
        if bw / bh > want:
            nbw = bh * want
            box = (box[0] + (bw - nbw) / 2, box[1], box[0] + (bw + nbw) / 2, box[3])
        else:
            nbh = bw / want
            box = (box[0], box[1] + (bh - nbh) / 2, box[2], box[1] + (bh + nbh) / 2)
    elif args.width:
        ow, oh = args.width, max(1, round(args.width * bh / bw))
    elif args.height:
        ow, oh = max(1, round(args.height * bw / bh)), args.height
    elif args.long_side:
        s = args.long_side / max(bw, bh)
        ow, oh = max(1, round(bw * s)), max(1, round(bh * s))
    else:
        ow, oh = max(1, round(bw)), max(1, round(bh))

    # Image.resize(box=...) cannot read outside the source, so pad first if needed.
    x0, y0, x1, y1 = box
    pl, pt = max(0, int(np.ceil(-x0))), max(0, int(np.ceil(-y0)))
    pr, pb = max(0, int(np.ceil(x1 - sw))), max(0, int(np.ceil(y1 - sh)))
    cover = Image.new("L", (sw, sh), 255)
    if pl or pt or pr or pb:
        size = (sw + pl + pr, sh + pt + pb)

        def padded(im: Image.Image, fill) -> Image.Image:
            canvas = Image.new(im.mode, size, fill)
            canvas.paste(im, (pl, pt))
            return canvas

        # replicate edge pixels so the resampling filter has something sane
        arr = np.asarray(src)
        arr = np.pad(arr, ((pt, pb), (pl, pr), (0, 0)), mode="edge")
        src = Image.fromarray(arr)
        cover = padded(cover, 0)
        if mask_src is not None:
            mask_src = padded(mask_src, 0)
        box = (x0 + pl, y0 + pt, x1 + pl, y1 + pt)

    rgb = src.resize((ow, oh), Image.LANCZOS, box=box)
    cov = np.asarray(cover.resize((ow, oh), Image.BILINEAR, box=box), dtype=np.float32) / 255.0
    mask = mask_src.resize((ow, oh), Image.BILINEAR, box=box) if mask_src is not None else None
    return rgb, cov, mask


def tone_map(rgb: Image.Image, cov: np.ndarray, mask: Image.Image | None, args) -> np.ndarray:
    a = np.asarray(rgb, dtype=np.float32) / 255.0
    h, w = a.shape[:2]
    mr, mg, mb = args.mix
    t = np.clip(a[..., 0] * mr + a[..., 1] * mg + a[..., 2] * mb, 0.0, 1.0)

    if args.invert:
        t = 1.0 - t

    # levels
    if args.auto_levels:
        lo, hi = np.percentile(t, args.auto_levels)
    else:
        lo, hi = args.levels
    if hi - lo < 1e-4:
        hi = lo + 1e-4
    t = np.clip((t - lo) / (hi - lo), 0.0, 1.0)
    if args.gamma != 1.0:
        t = t ** (1.0 / args.gamma)
    if args.contrast != 0.0:
        # S-curve around mid grey; 0 = none, 1 = strong
        s = smoothstep(t)
        t = t + (s - t) * args.contrast

    # keys and masks (all multiply the tone toward 0 = flat blue)
    keep = np.ones((h, w), dtype=np.float32)
    if args.warm_key:
        lo_k, hi_k = args.warm_key
        warm = (a[..., 0] - a[..., 2]) * 255.0
        k = smoothstep((warm - lo_k) / max(hi_k - lo_k, 1e-3))
        keep *= gaussian(k.astype(np.float32), args.key_feather)
    if mask is not None:
        m = np.asarray(mask, dtype=np.float32) / 255.0
        keep *= gaussian(m, args.mask_feather)
    if args.focus:
        cx, cy, rx, ry = args.focus
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        d = np.sqrt((((xx + 0.5) / w - cx) / rx) ** 2 + (((yy + 0.5) / h - cy) / ry) ** 2)
        keep *= 1.0 - smoothstep((d - args.focus_soft) / max(1.0 - args.focus_soft, 1e-3))
    keep = args.bg + (1.0 - args.bg) * keep
    t = t * keep

    # fade where the crop box runs past the source image
    if cov.min() < 0.999:
        fade_px = max(1.0, args.pad_fade * w)
        inside = gaussian(cov, fade_px / 2.5)
        # 0.5 at the source edge -> remap so the edge itself is already 0
        t = t * smoothstep((inside - 0.5) * 2.0) * (cov > 0.5)

    fades = vignette_px(args, w, h)
    if fades:
        t = t * edge_mask(h, w, fades, args.vignette_margin)
    return t.astype(np.float32)


def final_fade(args, w: int, h: int) -> tuple[np.ndarray, tuple | None]:
    """The last edge fade (exact flat blue / transparent at the border) and the
    per-edge fade widths it was built from (None without --vignette)."""
    fades = vignette_px(args, w, h, 0.5)
    if fades:
        # every edge gets at least a short final fade so the border is exact
        fades = tuple(max(f, 0.02 * min(w, h)) for f in fades)
        return edge_mask(h, w, fades, args.vignette_margin), fades
    return np.ones((h, w), dtype=np.float32), None


def cutout(rgb: Image.Image, cov: np.ndarray, mask: Image.Image | None, args) -> Image.Image:
    """True-colour partner of a masked plate: the framed picture in its own
    colours, with everything that sends the duotone to flat blue (subject mask,
    source-edge fade, --vignette) written to the alpha channel instead. Same
    framing code as the duotone, so the two register pixel for pixel."""
    w, h = rgb.size
    a = np.ones((h, w), dtype=np.float32)
    if mask is not None:
        m = gaussian(np.asarray(mask, dtype=np.float32) / 255.0, args.mask_feather)
        if args.cutout_feather > 0:
            # pull the edge in by about the feather width and soften it, so no
            # rim of the original background is left around the subject
            m = smoothstep((gaussian(m, args.cutout_feather) - 0.5) * 2.0)
        a *= args.bg + (1.0 - args.bg) * m
    if cov.min() < 0.999:
        fade_px = max(1.0, args.pad_fade * w)
        inside = gaussian(cov, fade_px / 2.5)
        a *= smoothstep((inside - 0.5) * 2.0) * (cov > 0.5)
    fades = vignette_px(args, w, h)
    if fades:
        a *= edge_mask(h, w, fades, args.vignette_margin)
    a *= final_fade(args, w, h)[0]
    a8 = np.clip(np.rint(a * 255), 0, 255).astype(np.uint8)
    px = np.asarray(rgb).copy()
    px[a8 == 0] = np.clip(np.rint(args.blue), 0, 255).astype(np.uint8)  # nothing odd under full transparency
    im = Image.fromarray(px)
    im.putalpha(Image.fromarray(a8))
    return im


def render(args) -> Image.Image:
    rgb, cov, mask = load_and_frame(args)
    if args.clean:
        return rgb
    if args.cutout:
        return cutout(rgb, cov, mask, args)

    w, h = rgb.size
    t = tone_map(rgb, cov, mask, args)

    # softness and bloom
    t = gaussian(t, args.blur)
    if args.glow > 0:
        hl = np.clip((t - args.glow_threshold) / max(1.0 - args.glow_threshold, 1e-3), 0, 1)
        halo = gaussian(hl, args.glow_radius)
        t = 1.0 - (1.0 - t) * (1.0 - np.clip(args.glow * halo, 0, 1))
    t = np.clip(t, 0.0, 1.0)

    # ordered dither on a grid of `cell` output pixels
    cell = max(args.cell, 1.0)
    gw, gh = max(1, round(w / cell)), max(1, round(h / cell))
    tc = f_resize(t, (gw, gh), Image.BOX)
    b = BAYER[args.bayer]
    n = b.shape[0]
    thr = (np.tile(b, (gh // n + 1, gw // n + 1))[:gh, :gw] + 0.5) / (n * n)
    dots = (tc > thr).astype(np.float32)
    dots = np.clip(f_resize(dots, (w, h), Image.BICUBIC if cell > 1 else Image.NEAREST), 0, 1)
    dots = gaussian(dots, args.dot_blur)

    # blend the hard dither with the continuous tone
    v = dots * (1.0 - args.soft) + t * args.soft
    # dots never appear where the tone itself is ~0, shadows stay flat
    v = np.clip(v, 0.0, 1.0)

    # final edge fade: guarantees exact flat blue at the border
    fin, fades = final_fade(args, w, h)
    v = v * fin

    blue, light, deep = args.blue, args.light, args.deep
    out = blue[None, None, :] + v[..., None] * (light - blue)[None, None, :]

    if args.grain > 0:
        gs = max(args.grain_size, 1.0)
        e = (-np.log(hash_uniform(h, w, args.seed))).astype(np.float32)  # exponential, mean 1
        if gs > 1:
            # soften the per-pixel grain, then restore the contrast the blur removed
            e = gaussian(e, 0.85 * (gs - 1.0))
            e = 1.0 + (e - e.mean()) / max(float(e.std()), 1e-6)
            e = np.clip(e, 0, None)
            e = e / max(float(e.mean()), 1e-6)
        g = (e - 1.0) * args.grain
        g = g * (1.0 - v) ** 2  # grain lives in the shadows, like film on a screen
        if fades:
            # the grain dies away long before the border, otherwise its texture
            # would draw the image rectangle on a plain page
            gf = max(args.grain_fade, 0.0) * min(w, h)
            g = g * edge_mask(h, w, tuple(max(f, gf) for f in fades), args.vignette_margin)
        out = out + g[..., None] * (blue - deep)[None, None, :]

    out = np.clip(np.rint(out), 0, 255).astype(np.uint8)
    im = Image.fromarray(out)
    if args.alpha and fades:
        # Lossy codecs cannot hold an arbitrary flat colour exactly, so the edge
        # fade can also be written as transparency: over a `blue` page the
        # composite is exact and no rectangle can show.
        im.putalpha(Image.fromarray(np.clip(np.rint(fin * 255), 0, 255).astype(np.uint8)))
    return im


def save(im: Image.Image, args) -> None:
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    ext = out.suffix.lower()
    if ext == ".webp":
        if args.lossless:
            im.save(out, "WEBP", lossless=True, quality=100, method=6)
        else:
            im.save(out, "WEBP", quality=args.quality, method=6)
    elif ext in (".jpg", ".jpeg"):
        im = im.convert("RGB")
        im.save(out, "JPEG", quality=args.quality, optimize=True, progressive=True)
    elif ext == ".png":
        im.save(out, "PNG", optimize=True)
    else:
        im.save(out)


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Convert an image to a blue-screen duotone with ordered-dither halftone.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    p.add_argument("input", help="source image (EXIF rotation is applied)")
    p.add_argument("output", help="output path; .webp, .jpg or .png")

    g = p.add_argument_group("framing")
    g.add_argument("--width", type=int, help="output width in px")
    g.add_argument("--height", type=int, help="output height in px (with --width: cover-crop)")
    g.add_argument("--long-side", type=int, help="output long side in px (instead of --width)")
    g.add_argument("--crop", type=floats(4, "--crop"), metavar="X0,Y0,X1,Y1",
                   help="crop box in source px; may extend past the image (filled with flat blue)")
    g.add_argument("--pad-fade", type=float, default=0.06,
                   help="fade width at a source edge inside the frame, fraction of output width")

    g = p.add_argument_group("tone")
    g.add_argument("--mix", type=floats(3, "--mix"), default=(0.299, 0.587, 0.114), metavar="R,G,B",
                   help="channel weights for the grey tone (may be negative)")
    g.add_argument("--levels", type=floats(2, "--levels"), default=(0.18, 0.92), metavar="BLACK,WHITE",
                   help="tone range mapped to 0..1; everything under BLACK is flat blue")
    g.add_argument("--auto-levels", type=floats(2, "--auto-levels"), metavar="PLO,PHI",
                   help="take BLACK,WHITE from these percentiles of the tone instead of --levels")
    g.add_argument("--gamma", type=float, default=1.0, help=">1 lifts midtones, <1 darkens them")
    g.add_argument("--contrast", type=float, default=0.35, help="S-curve strength, 0..1")
    g.add_argument("--invert", action="store_true", help="invert the tone before levels")

    g = p.add_argument_group("subject isolation (all optional)")
    g.add_argument("--mask", help="greyscale image in source coordinates; white = keep")
    g.add_argument("--mask-feather", type=float, default=0.0, help="extra blur of --mask, output px")
    g.add_argument("--warm-key", type=floats(2, "--warm-key"), metavar="LO,HI",
                   help="keep warm pixels: smoothstep of (R-B) in 0..255 units, e.g. 5,40")
    g.add_argument("--key-feather", type=float, default=1.5, help="blur of the warm key, output px")
    g.add_argument("--focus", type=floats(4, "--focus"), metavar="CX,CY,RX,RY",
                   help="elliptical spotlight in 0..1 output coordinates")
    g.add_argument("--focus-soft", type=float, default=0.45,
                   help="fraction of the spotlight radius that stays at full strength")
    g.add_argument("--bg", type=float, default=0.0,
                   help="how much tone survives outside the mask/key/focus, 0..1")
    g.add_argument("--vignette", type=vignette_arg, default=None, metavar="F | L,T,R,B",
                   help="fade to the exact flat blue at the edges; one width for all four edges or "
                        "left,top,right,bottom, each a fraction of the short side")
    g.add_argument("--vignette-margin", type=float, default=6.0,
                   help="px at each edge that are exactly flat blue when --vignette is on")

    g = p.add_argument_group("texture")
    g.add_argument("--cell", type=float, default=2.0, help="dither cell size in OUTPUT px")
    g.add_argument("--bayer", type=int, choices=(2, 4, 8), default=4, help="Bayer matrix order")
    g.add_argument("--soft", type=float, default=0.38,
                   help="0 = hard two-level dither, 1 = continuous tone; blend between them")
    g.add_argument("--dot-blur", type=float, default=0.45, help="gaussian blur of the dots, output px")
    g.add_argument("--blur", type=float, default=2.0, help="pre-dither blur of the picture, output px")
    g.add_argument("--glow", type=float, default=0.45, help="bloom amount around highlights, 0..1")
    g.add_argument("--glow-radius", type=float, default=14.0, help="bloom radius (sigma), output px")
    g.add_argument("--glow-threshold", type=float, default=0.55, help="tone above which bloom starts")
    g.add_argument("--grain", type=float, default=1.0, help="grain amount; 0 = none")
    g.add_argument("--grain-size", type=float, default=1.5, help="grain size in output px (1 = per-pixel)")
    g.add_argument("--grain-fade", type=float, default=0.24,
                   help="with --vignette: distance over which the grain fades out toward each edge, "
                        "fraction of the short side")
    g.add_argument("--seed", type=int, default=7, help="grain seed")

    g = p.add_argument_group("colour")
    g.add_argument("--blue", type=hex_rgb, default=DEFAULT_BLUE, help="flat field colour")
    g.add_argument("--light", type=hex_rgb, default=DEFAULT_LIGHT, help="highlight colour")
    g.add_argument("--deep", type=hex_rgb, default=DEFAULT_DEEP,
                   help="darkest grain colour; set equal to --blue for no dark grain")

    g = p.add_argument_group("output")
    g.add_argument("--quality", type=int, default=80, help="lossy WebP/JPEG quality")
    g.add_argument("--lossless", action="store_true", help="lossless WebP")
    g.add_argument("--alpha", action="store_true",
                   help="with --vignette: also write the edge fade to the alpha channel (webp/png)")
    g.add_argument("--clean", action="store_true",
                   help="skip the treatment: only crop, resize and strip metadata")
    g.add_argument("--cutout", action="store_true",
                   help="skip the treatment and keep the colours, but write --mask, the source-edge "
                        "fade and --vignette to the alpha channel (webp/png): the true-colour "
                        "partner of a plate rendered with the same framing options")
    g.add_argument("--cutout-feather", type=float, default=2.0,
                   help="with --cutout: how far the mask edge is pulled in and softened, output px")
    return p


def main(argv: list[str] | None = None) -> None:
    args = build_parser().parse_args(argv)
    for name in ("blue", "light", "deep"):
        v = getattr(args, name)
        if isinstance(v, str):
            setattr(args, name, hex_rgb(v))
    im = render(args)
    save(im, args)
    size = Path(args.output).stat().st_size
    print(f"{args.output}  {im.width}x{im.height}  {size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
