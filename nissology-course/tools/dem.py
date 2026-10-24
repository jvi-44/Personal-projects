import math, os, sys, json, io, urllib.request
import numpy as np
from PIL import Image
"""Build island heightmaps from AWS Terrain Tiles (Mapzen terrarium encoding).

Land comes from the high-zoom tiles; the sea floor is composited from a lower zoom, where global
bathymetry is present. Output PNGs keep terrarium encoding: h = R*256 + G + B/256 - 32768 (metres).
Usage: python3 tools/dem.py tools/islands.json
"""
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TILES = os.environ.get("TILE_CACHE", os.path.join(ROOT, ".tile-cache"))
OUT = os.path.join(ROOT, "site", "data", "dem")
PREVIEW = os.path.join(TILES, "previews")
def lon2x(lon, z): return (lon + 180) / 360 * 256 * 2**z
def lat2y(lat, z):
    r = math.radians(lat); return (1 - math.log(math.tan(r) + 1/math.cos(r)) / math.pi) / 2 * 256 * 2**z
def tile(z, x, y):
    p = f"{TILES}/{z}_{x}_{y}.png"
    if not os.path.exists(p):
        u = f"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
        urllib.request.urlretrieve(u, p)
    a = np.asarray(Image.open(p).convert("RGB")).astype(np.float64)
    return a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
def mosaic(s, n, w, e, z):
    x0, x1 = lon2x(w, z), lon2x(e, z); y0, y1 = lat2y(n, z), lat2y(s, z)
    tx0, tx1, ty0, ty1 = int(x0 // 256), int(x1 // 256), int(y0 // 256), int(y1 // 256)
    big = np.zeros(((ty1 - ty0 + 1) * 256, (tx1 - tx0 + 1) * 256))
    for ty in range(ty0, ty1 + 1):
        for tx in range(tx0, tx1 + 1):
            big[(ty-ty0)*256:(ty-ty0+1)*256, (tx-tx0)*256:(tx-tx0+1)*256] = tile(z, tx, ty)
    cx0, cy0 = x0 - tx0 * 256, y0 - ty0 * 256
    return big[int(cy0):int(cy0 + y1 - y0) + 1, int(cx0):int(cx0 + x1 - x0) + 1]
def composite(hi, s, n, w, e, z, bathyz=None, atoll=None, open_iter=2, min_comp=40, min_land=0.5, cap=None):
    from scipy import ndimage
    zl = bathyz or min(z - 1, 9)
    lo = mosaic(s, n, w, e, zl)
    lo = np.asarray(Image.fromarray(lo.astype(np.float32), mode="F").resize((hi.shape[1], hi.shape[0]), Image.BICUBIC)).astype(np.float64)
    # coarse cells that straddle the coast are contaminated by land heights: replace every cell
    # shallower than -20 m with the nearest properly oceanic value before smoothing
    if not atoll:
        bad = lo > -2
        if bad.any() and (~bad).any():
            idx = ndimage.distance_transform_edt(bad, return_distances=False, return_indices=True)
            lo = lo[tuple(idx)]
    lo = ndimage.gaussian_filter(lo, 3)
    mpp = 40075016.686 * math.cos(math.radians((s + n) / 2)) / (256 * 2**z)
    if atoll:
        islets = ndimage.binary_opening(hi > 0.5, iterations=1) | (ndimage.median_filter(hi, 3) > 0.5)
        lab, nl = ndimage.label(islets)
        sizes = ndimage.sum(islets, lab, range(1, nl + 1))
        islets = np.isin(lab, 1 + np.where(sizes >= 3)[0])
        ys, xs = np.nonzero(islets)
        from matplotlib.path import Path
        from scipy.spatial import ConvexHull
        pts = np.c_[xs, ys]; hull = pts[ConvexHull(pts).vertices]
        yy, xx = np.mgrid[0:hi.shape[0], 0:hi.shape[1]]
        plat = Path(hull).contains_points(np.c_[xx.ravel(), yy.ravel()]).reshape(hi.shape)
        plat = ndimage.binary_dilation(plat, iterations=max(1, int(250 / mpp)))
        din = ndimage.distance_transform_edt(plat) * mpp
        rim = plat & (din < atoll["rim_m"])
        dout = ndimage.distance_transform_edt(~plat) * mpp
        ramp = np.clip(dout / atoll.get("flank_m", 2500.0), 0, 1) ** 0.6
        sea = -2.0 + (np.minimum(lo, -2.0) + 2.0) * ramp
        lag = -atoll["lagoon_m"] * np.clip((din - atoll["rim_m"]) / 1200.0, 0.15, 1.0) ** 0.5
        out = np.where(plat, np.where(rim, -0.6, lag), sea)
        out = ndimage.gaussian_filter(out, 0.8)
        return np.where(islets, np.clip(hi, 1.5, atoll["cap_m"]), out)
    med = ndimage.median_filter(hi, size=5)
    land = ndimage.binary_opening(med > min_land, iterations=open_iter)
    land = land & (lo > -60)
    lab, nl = ndimage.label(land)
    if nl:
        sizes = ndimage.sum(land, lab, range(1, nl + 1))
        land = np.isin(lab, 1 + np.where(sizes >= min_comp)[0])
    land = ndimage.binary_fill_holes(land)
    d = ndimage.distance_transform_edt(~land)
    ramp = np.clip(d * mpp / 1500.0, 0.0, 1.0) ** 0.8
    sea = -2.0 + (np.minimum(lo, -2.0) + 2.0) * ramp
    if cap: med = np.minimum(med, cap)
    out = np.where(land, np.maximum(med, 0.5), sea)
    return ndimage.gaussian_filter(out, 0.6)
def build(name, s, n, w, e, maxpx=512, zmax=13, **opt):
    latc = (s + n) / 2
    z = 1
    while z < zmax and (lon2x(e, z) - lon2x(w, z)) < maxpx * 1.2: z += 1
    x0, x1 = lon2x(w, z), lon2x(e, z); y0, y1 = lat2y(n, z), lat2y(s, z)
    tx0, tx1, ty0, ty1 = int(x0 // 256), int(x1 // 256), int(y0 // 256), int(y1 // 256)
    big = np.zeros(((ty1 - ty0 + 1) * 256, (tx1 - tx0 + 1) * 256))
    for ty in range(ty0, ty1 + 1):
        for tx in range(tx0, tx1 + 1):
            big[(ty-ty0)*256:(ty-ty0+1)*256, (tx-tx0)*256:(tx-tx0+1)*256] = tile(z, tx, ty)
    cx0, cy0 = x0 - tx0 * 256, y0 - ty0 * 256
    cw, ch = x1 - x0, y1 - y0
    crop = big[int(cy0):int(cy0 + ch), int(cx0):int(cx0 + cw)]
    crop = composite(crop, s, n, w, e, z, **opt)
    scale = maxpx / max(crop.shape)
    ow, oh = max(2, round(crop.shape[1] * scale)), max(2, round(crop.shape[0] * scale))
    im = Image.fromarray(crop.astype(np.float32), mode="F").resize((ow, oh), Image.BILINEAR)
    h = np.asarray(im).astype(np.float64)
    if not opt.get("atoll"):
        from scipy import ndimage
        lab, nl = ndimage.label(h > 0)
        if nl:
            sizes = ndimage.sum(h > 0, lab, range(1, nl + 1))
            small = np.isin(lab, 1 + np.where(sizes < max(30, opt.get("min_comp", 40) / 4))[0])
            h = np.where(small, -3.0, h)
    mpp = 40075016.686 * math.cos(math.radians(latc)) / (256 * 2**z) * (crop.shape[1] / ow)
    v = np.clip(h + 32768, 0, 65535.99)
    r = np.floor(v / 256); g = np.floor(v - r * 256); b = np.floor((v - r * 256 - g) * 256)
    Image.fromarray(np.stack([r, g, b], -1).astype(np.uint8)).save(f"{OUT}/{name}.png", optimize=True)
    meta = dict(id=name, w=ow, h=oh, mpp=round(mpp, 2), z=z, bbox=[s, n, w, e], min=round(float(h.min())), max=round(float(h.max())))
    # quick preview: hillshade + sea tint
    gy, gx = np.gradient(h, mpp); sh = np.clip((-gx - gy) / math.sqrt(2) / np.sqrt(1 + gx**2 + gy**2) * 0.9 + 0.5, 0, 1)
    col = np.where(h[..., None] > 0, np.stack([sh*200+30, sh*180+40, sh*120+30], -1), np.stack([sh*40, sh*80+40*(1+h/6000), 120+sh*100], -1))
    Image.fromarray(np.clip(col, 0, 255).astype(np.uint8)).save(f"{PREVIEW}/{name}_preview.png")
    print(json.dumps(meta)); return meta
if __name__ == "__main__":
    os.makedirs(TILES, exist_ok=True); os.makedirs(OUT, exist_ok=True); os.makedirs(PREVIEW, exist_ok=True)
    spec = json.load(open(sys.argv[1]))
    metas = [build(**d) for d in spec]
    json.dump(metas, open(f"{OUT}/meta.json", "w"), indent=1)
