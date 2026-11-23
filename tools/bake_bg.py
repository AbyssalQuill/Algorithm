"""
把 tools/svg 里的背景矢量图烘焙成 WebP（带透明通道）放进 src/assets，并生成纸张颗粒小图块。
为什么要烘焙：背景 SVG 里有 feTurbulence / 位移等滤镜，让浏览器在页面上实时画会很重；
烘焙成位图后，浏览器只需要解码一次，之后滚动、动画都不再为背景花任何计算。
用法：python tools/bake_bg.py   （需要 playwright + Pillow；先运行 gen_bg.py）
"""
import io
import os
import pathlib

from PIL import Image
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
SVG = os.path.join(HERE, 'svg')
OUT = os.path.join(HERE, '..', 'src', 'assets')
os.makedirs(OUT, exist_ok=True)
SCALE = 1.0  # 1600×2200：解码后约 14MB。更大的图在高分屏更清晰，但解码和显存占用翻倍，卡顿风险更大，所以取 1x

GRAIN = {
    # 浅色：暗褐色的细颗粒（等价于原来的 multiply 叠层）；暗色：偏亮的细颗粒（等价于 screen 叠层）
    'grain-light': "0 0 0 0 .35  0 0 0 0 .3  0 0 0 0 .22  0 0 0 .3 0",
    'grain-dark': "0 0 0 0 .82  0 0 0 0 .88  0 0 0 0 .85  0 0 0 .16 0",
}


def grain_svg(matrix):
    return (
        "<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>"
        "<filter id='n' x='0' y='0' width='100%' height='100%'>"
        "<feTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='3' stitchTiles='stitch'/>"
        f"<feColorMatrix values='{matrix}'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>"
    )


with sync_playwright() as pw:
    try:
        browser = pw.chromium.launch()
    except Exception:
        browser = pw.chromium.launch(channel='chrome')
    for name in ('bg-paper', 'bg-board'):
        ctx = browser.new_context(viewport={'width': 1600, 'height': 2200}, device_scale_factor=SCALE)
        page = ctx.new_page()
        page.goto(pathlib.Path(os.path.join(SVG, name + '.svg')).resolve().as_uri())
        page.wait_for_timeout(800)
        png = page.screenshot(omit_background=True)
        ctx.close()
        im = Image.open(io.BytesIO(png)).convert('RGBA')
        path = os.path.join(OUT, name + '.webp')
        im.save(path, 'WEBP', quality=74, alpha_quality=80, method=6)
        print(name, im.size, round(os.path.getsize(path) / 1024), 'KB')
    for name, matrix in GRAIN.items():
        ctx = browser.new_context(viewport={'width': 200, 'height': 200}, device_scale_factor=1)
        page = ctx.new_page()
        page.set_content('<body style="margin:0;background:transparent">' + grain_svg(matrix) + '</body>')
        page.wait_for_timeout(300)
        png = page.screenshot(omit_background=True)
        ctx.close()
        im = Image.open(io.BytesIO(png)).convert('RGBA')
        path = os.path.join(OUT, name + '.webp')
        im.save(path, 'WEBP', quality=75, alpha_quality=80, method=6)
        print(name, im.size, round(os.path.getsize(path) / 1024), 'KB')
    browser.close()
