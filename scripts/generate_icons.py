"""Generate the Daymark app icon set.

Run from the project root:
    python scripts/generate_icons.py

The mark is a rising sun over a horizon: a simple, optimistic "day mark".
Everything is generated locally so the PWA has no external asset dependency.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
ICONS = PUBLIC / "icons"
SIZE = 1024
SCALE = 4


def _lerp(a: int, b: int, t: float) -> int:
    return round(a + (b - a) * t)


def _gradient(size: int) -> Image.Image:
    """Diagonal three-stop gradient: ice sky -> turquoise -> deep sea."""
    width = height = size
    img = Image.new("RGB", (width, height))
    px = img.load()
    stops = [(0.0, (122, 203, 255)), (0.52, (52, 198, 210)), (1.0, (10, 137, 168))]
    for y in range(height):
        for x in range(width):
            t = (x / (width - 1) * 0.55) + (y / (height - 1) * 0.45)
            for i in range(len(stops) - 1):
                t0, c0 = stops[i]
                t1, c1 = stops[i + 1]
                if t0 <= t <= t1:
                    local = (t - t0) / (t1 - t0)
                    px[x, y] = tuple(_lerp(c0[j], c1[j], local) for j in range(3))
                    break
            else:
                px[x, y] = stops[-1][1]
    return img


def _draw_mark(draw: ImageDraw.ImageDraw, scale: float, cx: float, cy: float) -> None:
    """Draw the mark with its natural 1024px proportions, transformed around (cx, cy)."""

    def tx(x: float) -> float:
        return cx + (x - 512) * scale

    def ty(y: float) -> float:
        return cy + (y - 512) * scale

    white = (255, 255, 255, 255)
    stroke = max(2, round(42 * scale))
    radius = 148 * scale

    # Horizon line.
    draw.rounded_rectangle(
        (tx(236), ty(622), tx(788), ty(622) + stroke),
        radius=stroke / 2,
        fill=white,
    )
    # Rising sun dome.
    draw.arc(
        (tx(512 - radius), ty(600 - radius), tx(512 + radius), ty(600 + radius)),
        start=180,
        end=360,
        fill=white,
        width=stroke,
    )
    # Soft sun dot.
    dot_r = 23 * scale
    draw.ellipse(
        (tx(512) - dot_r, ty(448) - dot_r, tx(512) + dot_r, ty(448) + dot_r),
        fill=white,
    )


def make_icon(mark_scale: float) -> Image.Image:
    big = SIZE * SCALE
    img = _gradient(big).convert("RGBA")

    # Gentle light orb top-left and teal glow bottom-right for depth.
    glow = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse(
        (big * -0.12, big * -0.20, big * 0.62, big * 0.55),
        fill=(255, 255, 255, 64),
    )
    gdraw.ellipse(
        (big * 0.58, big * 0.62, big * 1.18, big * 1.22),
        fill=(5, 102, 130, 70),
    )
    glow = glow.filter(ImageFilter.GaussianBlur(big * 0.055))
    img = Image.alpha_composite(img, glow)

    mark = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    mdraw = ImageDraw.Draw(mark)
    _draw_mark(mdraw, mark_scale * SCALE, big / 2, big / 2)
    img = Image.alpha_composite(img, mark)

    return img.resize((SIZE, SIZE), Image.Resampling.LANCZOS)


def save_resized(img: Image.Image, path: Path, size: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.resize((size, size), Image.Resampling.LANCZOS).convert("RGB").save(
        path, format="PNG", optimize=True
    )
    print(f"wrote {path.relative_to(ROOT)} ({size}x{size})")


def main() -> None:
    ICONS.mkdir(parents=True, exist_ok=True)
    standard = make_icon(0.86)
    maskable = make_icon(0.62)

    for size in (192, 512):
        save_resized(standard, ICONS / f"icon-{size}.png", size)
        save_resized(maskable, ICONS / f"icon-maskable-{size}.png", size)

    save_resized(standard, PUBLIC / "apple-touch-icon.png", 180)
    save_resized(standard, PUBLIC / "favicon-32.png", 32)

    favicon = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7ACBFF"/>
      <stop offset=".55" stop-color="#34C6D2"/>
      <stop offset="1" stop-color="#0A89A8"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="15" fill="url(#g)"/>
  <path d="M16 40h32" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>
  <path d="M25 36a7 7 0 0 1 14 0" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>
  <circle cx="32" cy="20.5" r="2.6" fill="#fff"/>
</svg>
"""
    (PUBLIC / "favicon.svg").write_text(favicon, encoding="utf-8")
    print("wrote public/favicon.svg")


if __name__ == "__main__":
    main()
