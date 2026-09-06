"""Generate the app icons in assets/ (run: python3 scripts/make-icons.py). Needs Pillow."""
import math
import os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, '..', 'assets')

NAVY = (11, 18, 32, 255)
BLACK = (24, 24, 27, 255)
CREAM = (243, 233, 198, 255)
RED = (220, 38, 38, 255)
GREEN = (22, 163, 74, 255)
WIRE = (203, 213, 225, 255)
RIM = (17, 17, 20, 255)
DART_BARREL = (148, 163, 184, 255)
DART_SHAFT = (226, 232, 240, 255)
FLIGHT = (34, 197, 94, 255)

SS = 4  # supersampling factor for smooth edges


def ring(draw, cx, cy, r_out, r_in, start, end, fill):
    """One board segment between two radii and two angles (degrees)."""
    draw.pieslice([cx - r_out, cy - r_out, cx + r_out, cy + r_out], start, end, fill=fill)
    if r_in > 0:
        draw.pieslice([cx - r_in, cy - r_in, cx + r_in, cy + r_in], start, end, fill=None)


def draw_board(img, cx, cy, R, with_dart=True, mono=None):
    """Draw a dartboard of radius R centred at (cx, cy). `mono` = single colour silhouette."""
    d = ImageDraw.Draw(img)
    # Segment boundaries. Segment 0 (the "20") is centred at the top.
    bands = [  # (outer fraction, inner fraction, ring colours?)
        (1.00, 0.92, True),   # double ring
        (0.92, 0.63, False),  # outer single
        (0.63, 0.55, True),   # triple ring
        (0.55, 0.13, False),  # inner single
    ]
    if mono:
        # Silhouette for Android's themed icons: alternate wedges, an outer ring and the bull.
        w = max(2, int(R * 0.06))
        d.ellipse([cx - R * 1.09, cy - R * 1.09, cx + R * 1.09, cy + R * 1.09], outline=mono, width=w)
        for i in range(0, 20, 2):
            start = -99 + i * 18
            d.pieslice([cx - R * 0.96, cy - R * 0.96, cx + R * 0.96, cy + R * 0.96], start, start + 18, fill=mono)
        d.ellipse([cx - R * 0.22, cy - R * 0.22, cx + R * 0.22, cy + R * 0.22], fill=(0, 0, 0, 0))
        ob = R * 0.13
        d.ellipse([cx - ob, cy - ob, cx + ob, cy + ob], fill=mono)
        return
    d.ellipse([cx - R * 1.09, cy - R * 1.09, cx + R * 1.09, cy + R * 1.09], fill=RIM)
    for i in range(20):
        start = -99 + i * 18
        end = start + 18
        dark = i % 2 == 0
        for outer, inner, is_ring in bands:
            col = (RED if dark else GREEN) if is_ring else (BLACK if dark else CREAM)
            r_out = R * outer
            d.pieslice([cx - r_out, cy - r_out, cx + r_out, cy + r_out], start, end, fill=col)
    # Bulls
    ob, ib = R * 0.13, R * 0.055
    d.ellipse([cx - ob, cy - ob, cx + ob, cy + ob], fill=GREEN)
    d.ellipse([cx - ib, cy - ib, cx + ib, cy + ib], fill=RED)
    # Wires
    if True:
        w = max(2, int(R * 0.012))
        for i in range(20):
            a = math.radians(-99 + i * 18)
            d.line([(cx + ob * math.cos(a), cy + ob * math.sin(a)), (cx + R * math.cos(a), cy + R * math.sin(a))], fill=WIRE, width=w)
        for f in (1.0, 0.92, 0.63, 0.55, 0.13, 0.055):
            r = R * f
            d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=WIRE, width=w)
    # Dart, flying in from the top right into the bull
    if with_dart:
        a = math.radians(-42)
        ux, uy = math.cos(a), math.sin(a)
        px, py = -uy, ux  # perpendicular
        tip = (cx + ux * R * 0.02, cy + uy * R * 0.02)
        barrel_s = (cx + ux * R * 0.06, cy + uy * R * 0.06)
        barrel_e = (cx + ux * R * 0.34, cy + uy * R * 0.34)
        shaft_e = (cx + ux * R * 0.62, cy + uy * R * 0.62)
        d.line([tip, barrel_s], fill=DART_SHAFT, width=max(2, int(R * 0.03)))
        d.line([barrel_s, barrel_e], fill=DART_BARREL, width=max(3, int(R * 0.075)))
        d.line([barrel_e, shaft_e], fill=DART_SHAFT, width=max(2, int(R * 0.035)))
        f0 = (cx + ux * R * 0.52, cy + uy * R * 0.52)
        f1 = (cx + ux * R * 0.86, cy + uy * R * 0.86)
        spread = R * 0.16
        flight = [
            f0,
            (f1[0] + px * spread, f1[1] + py * spread),
            (cx + ux * R * 0.78, cy + uy * R * 0.78),
            (f1[0] - px * spread, f1[1] - py * spread),
        ]
        d.polygon(flight, fill=FLIGHT)


def render(size, board_frac, background, with_dart=True, mono=None):
    S = size * SS
    img = Image.new('RGBA', (S, S), background)
    draw_board(img, S / 2, S / 2, S * board_frac / 2, with_dart=with_dart, mono=mono)
    return img.resize((size, size), Image.LANCZOS)


def save(img, name):
    path = os.path.join(ASSETS, name)
    img.save(path, optimize=True)
    print('wrote', path, img.size)


if __name__ == '__main__':
    save(render(1024, 0.80, NAVY), 'icon.png')                          # iOS + generic
    save(render(1024, 0.56, (0, 0, 0, 0)), 'android-icon-foreground.png')  # inside the 66% safe zone
    save(Image.new('RGBA', (1024, 1024), NAVY), 'android-icon-background.png')
    save(render(1024, 0.56, (0, 0, 0, 0), with_dart=False, mono=(255, 255, 255, 255)), 'android-icon-monochrome.png')
    save(render(1024, 0.60, (0, 0, 0, 0)), 'splash-icon.png')
    save(render(64, 0.90, (0, 0, 0, 0)), 'favicon.png')
