"""
生成站点图标：纸张背景（和网站同一套点阵、彩铅色块）+ 一支铅笔。
输出到 public/：
    favicon.svg            浏览器标签页上的图标（矢量，圆角）
    icon-192.png / icon-512.png   安装为应用时使用的图标（圆角）
    icon-maskable-512.png  “可遮罩”图标：整张铺满，铅笔缩在中间的安全区里，系统会按自己的形状裁切（圆形、圆角方形等）
    apple-touch-icon.png   iOS 主屏幕图标（铺满，系统自己加圆角）
用法：python tools/gen_icons.py   （需要 playwright）
"""
import os

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'public')

PENCIL = '#34373e'


def pencil_group(scale=1.0):
    """铅笔：笔尖朝左下，橡皮朝右上。先在水平方向上画好，再整体旋转"""
    return f"""
<g transform="translate(256 256) rotate(-45) scale({scale}) translate(-165 0)" filter="url(#wob)" stroke="{PENCIL}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round">
  <!-- 木头削出来的锥形 -->
  <path d="M0 0 L88 -40 L88 40 Z" fill="#f6d5aa"/>
  <path d="M30 -13 L30 13" stroke="none"/>
  <!-- 石墨笔芯 -->
  <path d="M0 0 L30 -14 L30 14 Z" fill="{PENCIL}"/>
  <!-- 笔杆：中间亮，两边暗，像六棱柱 -->
  <rect x="88" y="-40" width="176" height="80" fill="#f3b72b"/>
  <rect x="88" y="-14" width="176" height="28" fill="#ffe27a" stroke="none"/>
  <path d="M88 -14 H264 M88 14 H264" fill="none" stroke-width="5"/>
  <!-- 金属箍 -->
  <rect x="264" y="-40" width="34" height="80" fill="#c3cad2"/>
  <path d="M273 -40 V40 M282 -40 V40 M291 -40 V40" fill="none" stroke-width="4"/>
  <!-- 橡皮 -->
  <path d="M298 -40 H322 Q342 -40 342 -20 V20 Q342 40 322 40 H298 Z" fill="#f08d84"/>
</g>"""


def scribble():
    """笔尖后面拖出的一小段线条"""
    return f"""
<path d="M140 380 C116 404 96 366 74 392 S50 428 92 428 L170 430" fill="none" stroke="{PENCIL}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" filter="url(#wob)"/>"""


def svg(kind):
    """kind: round = 圆角（标签页 / 普通图标）；bleed = 铺满（可遮罩 / iOS）"""
    maskable = kind == 'bleed'
    bg_clip = '' if maskable else '<clipPath id="clip"><rect width="512" height="512" rx="112"/></clipPath>'
    clip_attr = '' if maskable else ' clip-path="url(#clip)"'
    pencil_scale = 0.88 if maskable else 1.08
    dots = ''.join(f'<circle cx="{x}" cy="{y}" r="3.4"/>' for x in range(40, 512, 44) for y in range(40, 512, 44))
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<defs>
  {bg_clip}
  <filter id="wob" x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="7"/>
  </filter>
  <pattern id="hb" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><path d="M0 7H14" stroke="#2f6fd8" stroke-opacity="0.45" stroke-width="3.4"/></pattern>
  <pattern id="hg" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><path d="M0 7H14" stroke="#3a9a64" stroke-opacity="0.42" stroke-width="3.4"/></pattern>
  <pattern id="hy" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><path d="M0 7H14" stroke="#e8a800" stroke-opacity="0.6" stroke-width="3.4"/></pattern>
</defs>
<g{clip_attr}>
  <rect width="512" height="512" fill="#f8f5ee"/>
  <g fill="#2f6fd8" fill-opacity="0.22">{dots}</g>
  <!-- 彩铅涂出来的色块：左上蓝、右下黄绿，和网站背景呼应 -->
  <path d="M-20 -20 H200 Q160 100 -20 160 Z" fill="url(#hb)"/>
  <path d="M532 320 Q440 350 410 532 H532 Z" fill="url(#hg)"/>
  <path d="M350 -20 H532 V130 Q430 120 350 -20 Z" fill="url(#hy)"/>
  {'' if maskable else scribble()}
  {pencil_group(pencil_scale)}
</g>
</svg>"""


def render(page, svg_text, size, path, transparent):
    html = f'<html><body style="margin:0;background:transparent">{svg_text.replace("width=\"512\" height=\"512\"", f"width=\"{size}\" height=\"{size}\"")}</body></html>'
    page.set_viewport_size({'width': size, 'height': size})
    page.set_content(html)
    page.wait_for_timeout(150)
    page.screenshot(path=path, omit_background=transparent)


if __name__ == '__main__':
    round_svg = svg('round')
    bleed_svg = svg('bleed')
    with open(os.path.join(OUT, 'favicon.svg'), 'w', encoding='utf-8') as f:
        f.write(round_svg)
    with sync_playwright() as pw:
        try:
            browser = pw.chromium.launch()
        except Exception:
            browser = pw.chromium.launch(channel='chrome')
        page = browser.new_page()
        render(page, round_svg, 192, os.path.join(OUT, 'icon-192.png'), True)
        render(page, round_svg, 512, os.path.join(OUT, 'icon-512.png'), True)
        render(page, bleed_svg, 512, os.path.join(OUT, 'icon-maskable-512.png'), False)
        render(page, bleed_svg, 180, os.path.join(OUT, 'apple-touch-icon.png'), False)
        browser.close()
    print('图标已生成')
