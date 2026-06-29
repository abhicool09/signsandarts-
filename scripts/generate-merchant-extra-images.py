from pathlib import Path
from PIL import Image, ImageChops, ImageFilter
import json


ROOT = Path(__file__).resolve().parents[1]
PIXEL_PRODUCTS = ROOT / "pixel-led" / "products.json"


def content_bbox(image):
    rgba = image.convert("RGBA")
    alpha_bbox = rgba.getchannel("A").getbbox()
    if alpha_bbox and rgba.getchannel("A").getextrema()[0] < 255:
        return alpha_bbox

    rgb = image.convert("RGB")
    bg = Image.new("RGB", rgb.size, rgb.getpixel((0, 0)))
    diff = ImageChops.difference(rgb, bg).convert("L")
    mask = diff.point(lambda value: 255 if value > 14 else 0)
    mask = mask.filter(ImageFilter.MaxFilter(5))
    return mask.getbbox() or (0, 0, image.width, image.height)


def expand_bbox(bbox, width, height, factor):
    left, top, right, bottom = bbox
    cx = (left + right) / 2
    cy = (top + bottom) / 2
    bw = (right - left) * factor
    bh = (bottom - top) * factor
    return (
        max(0, int(cx - bw / 2)),
        max(0, int(cy - bh / 2)),
        min(width, int(cx + bw / 2)),
        min(height, int(cy + bh / 2)),
    )


def square_view(image, bbox, fill="#f7f7f7", target=1000, max_size=810):
    crop = image.convert("RGBA").crop(expand_bbox(bbox, image.width, image.height, 1.12))
    crop.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (target, target), fill)
    canvas.alpha_composite(crop, ((target - crop.width) // 2, (target - crop.height) // 2))
    return canvas.convert("RGB")


def detail_view(image, bbox, fill="#ffffff", target=1000):
    close_bbox = expand_bbox(bbox, image.width, image.height, 0.68)
    if close_bbox[2] - close_bbox[0] < 80 or close_bbox[3] - close_bbox[1] < 80:
        close_bbox = expand_bbox(bbox, image.width, image.height, 0.9)
    crop = image.convert("RGBA").crop(close_bbox)
    crop.thumbnail((target, target), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (target, target), fill)
    canvas.alpha_composite(crop, ((target - crop.width) // 2, (target - crop.height) // 2))
    return canvas.convert("RGB")


def save_views(source, clean_output, detail_output):
    image = Image.open(source)
    bbox = content_bbox(image)
    clean_output.parent.mkdir(parents=True, exist_ok=True)
    square_view(image, bbox).save(clean_output, "WEBP", quality=88, method=6)
    detail_view(image, bbox).save(detail_output, "WEBP", quality=88, method=6)


def main():
    products = json.loads(PIXEL_PRODUCTS.read_text(encoding="utf-8"))
    feed_dir = ROOT / "pixel-led" / "images" / "feed"
    for product in products:
        slug = product["slug"]
        source = ROOT / "pixel-led" / "images" / f"{slug}.webp"
        save_views(
            source,
            feed_dir / f"{slug}-clean.webp",
            feed_dir / f"{slug}-detail.webp",
        )

    save_views(
        ROOT / "led-dimmer-controller" / "main.webp",
        ROOT / "led-dimmer-controller" / "feed-clean.webp",
        ROOT / "led-dimmer-controller" / "feed-detail.webp",
    )
    save_views(
        ROOT / "rgb-pixel-led-controller" / "main.webp",
        ROOT / "rgb-pixel-led-controller" / "feed-clean.webp",
        ROOT / "rgb-pixel-led-controller" / "feed-detail.webp",
    )
    print(f"Generated extra Merchant Center images for {len(products) + 2} products.")


if __name__ == "__main__":
    main()
