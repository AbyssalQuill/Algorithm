"""
生成页面背景（铅笔涂鸦主题）：src/assets/bg-paper.svg（浅色·纸）、bg-board.svg（暗色·黑板）。
背景 = 淡淡的彩铅晕色 + 彩铅排线色块 + 随手涂鸦（星星、箭头、括号、树、链表、栈、柱状图……）。
涂鸦主要分布在页面两侧；中间区域只放很淡的几个，保证正文可读。
竖向可无缝平铺：所有元素都留在上下 100px 安全区内，接缝处是纸色接纸色。
用法：python tools/gen_bg.py
"""
import math
import os
import random

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'assets')
os.makedirs(OUT, exist_ok=True)
W, H = 1600, 2200

PALETTES = {
    'paper': dict(
        ink='#34373e', blue='#2f6fd8', green='#3a9a64', yellow='#e0a400', red='#e45e47',
        wash=0.085, hatch=0.34, doodle=0.5, ink_op=0.36, center=0.55, grain_hi=3, grain_lo=-0.4,
    ),
    'board': dict(
        ink='#e8eee9', blue='#7db1ff', green='#7fd6a0', yellow='#ffd95a', red='#ff8f78',
        wash=0.1, hatch=0.26, doodle=0.42, ink_op=0.3, center=0.55, grain_hi=3, grain_lo=-0.45,
    ),
}


def smooth(pts, closed=False):
    """Catmull-Rom → 三次贝塞尔：让折线变成手画的圆润曲线"""
    n = len(pts)
    if closed:
        pts = pts + pts[:3]
    d = f'M{pts[0][0]:.1f} {pts[0][1]:.1f}'
    m = len(pts)
    last = n if closed else m - 1
    for i in range(last):
        p0 = pts[i - 1] if i > 0 else (pts[-3] if closed else pts[i])
        p1, p2 = pts[i], pts[i + 1]
        p3 = pts[i + 2] if i + 2 < m else p2
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f'C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}'
    return d


def blob(r, cx, cy, rx, ry, n=12, jit=0.2, rot=0.0):
    pts = []
    for i in range(n):
        a = 2 * math.pi * i / n
        k = 1 + r.uniform(-jit, jit)
        x, y = rx * k * math.cos(a), ry * k * math.sin(a)
        c, s = math.cos(rot), math.sin(rot)
        pts.append((cx + x * c - y * s, cy + x * s + y * c))
    return smooth(pts, closed=True)


# ------------------------------------------------------------------ 涂鸦
def J(r, a):
    return r.uniform(-a, a)


def line(r, x1, y1, x2, y2, j=1.4):
    mx, my = (x1 + x2) / 2 + J(r, j * 2), (y1 + y2) / 2 + J(r, j * 2)
    return f'M{x1 + J(r, j):.1f} {y1 + J(r, j):.1f}Q{mx:.1f} {my:.1f} {x2 + J(r, j):.1f} {y2 + J(r, j):.1f}'


def circle(r, cx, cy, rad, over=1.12, n=18):
    a0 = r.uniform(0, 6.28)
    pts = []
    for i in range(int(n * over) + 1):
        a = a0 + 2 * math.pi * i / n
        rr = rad * (1 + 0.05 * math.sin(i * 0.8) + 0.07 * i / n) + J(r, rad * 0.02)
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    return smooth(pts)


def head(r, x, y, ang, L=11):
    out = ''
    for da in (2.5, -2.5):
        a = ang + math.pi + da * 0.22
        out += line(r, x, y, x + L * math.cos(a), y + L * math.sin(a), 0.6)
    return out


def d_star(r, s):
    R = s / 2
    pts = [(R * math.cos(-math.pi / 2 + 2 * math.pi * k / 5) + J(r, 1.5), R * math.sin(-math.pi / 2 + 2 * math.pi * k / 5) + J(r, 1.5)) for k in (0, 2, 4, 1, 3, 0)]
    return 'M' + 'L'.join(f'{x:.1f} {y:.1f}' for x, y in pts)


def d_sparkle(r, s):
    R = s / 2
    return line(r, 0, -R, 0, R) + line(r, -R, 0, R, 0) + line(r, -R * .6, -R * .6, R * .6, R * .6) + line(r, R * .6, -R * .6, -R * .6, R * .6)


def d_spiral(r, s):
    pts = []
    t = 0.0
    while t < 2.4 * 2 * math.pi:
        rr = s / 2 * t / (2.4 * 2 * math.pi)
        pts.append((rr * math.cos(t), rr * math.sin(t)))
        t += 0.4
    return smooth(pts)


def d_arrow(r, s):
    pts = [(-s / 2, 0), (-s / 6, -s * .26), (s / 6, -s * .2), (s / 2, s * .06)]
    end = pts[-1]
    ang = math.atan2(end[1] - pts[-2][1], end[0] - pts[-2][0])
    return smooth(pts) + head(r, end[0], end[1], ang)


def d_squiggle(r, s):
    pts = [(-s / 2 + i * s / 8, (-1) ** i * s * .09) for i in range(9)]
    return smooth(pts)


def d_circle(r, s):
    return circle(r, 0, 0, s / 2) + circle(r, 0, 0, s / 2 * 0.86, over=0.7)


def d_bars(r, s):
    n, w = 5, s / 6.2
    d = line(r, -s / 2 - 6, s / 2, s / 2 + 6, s / 2)
    for i in range(n):
        h = r.uniform(.3, 1) * s * .85
        x = -s / 2 + i * (w + s * .02) + 6
        d += f'M{x:.1f} {s/2:.1f}L{x + J(r,1):.1f} {s/2 - h:.1f}L{x + w:.1f} {s/2 - h + J(r,1.5):.1f}L{x + w:.1f} {s/2:.1f}'
    return d


def d_brace(r, s):
    h, w = s, s * .3
    one = (f'M{w} {-h/2}Q{w*.3} {-h/2} {w*.3} {-h*.36}L{w*.3} {-h*.08}Q{w*.3} 0 0 0Q{w*.3} 0 {w*.3} {h*.08}'
           f'L{w*.3} {h*.36}Q{w*.3} {h/2} {w} {h/2}')
    return f'<g transform="translate({-s*.5:.1f} 0)">{one}</g>' + f'<g transform="translate({s*.5:.1f} 0) scale(-1 1)">{one}</g>'


def d_bracket(r, s):
    h, w = s, s * .26
    one = f'M{w} {-h/2}L0 {-h/2}L{J(r,1.5):.1f} {h/2}L{w} {h/2}'
    return f'<g transform="translate({-s*.45:.1f} 0)">{one}</g>' + f'<g transform="translate({s*.45:.1f} 0) scale(-1 1)">{one}</g>'


def d_paren(r, s):
    h, w = s, s * .26
    one = f'M{w} {-h/2}Q{-w*.5} 0 {w} {h/2}'
    return f'<g transform="translate({-s*.45:.1f} 0)">{one}</g>' + f'<g transform="translate({s*.45:.1f} 0) scale(-1 1)">{one}</g>'


def d_angle(r, s):
    h, w = s * .8, s * .3
    left = f'M{w} {-h/2}L0 0L{w} {h/2}'
    return f'<g transform="translate({-s*.5:.1f} 0)">{left}</g>' + f'<g transform="translate({s*.5:.1f} 0) scale(-1 1)">{left}</g>' + line(r, s * .12, -h * .55, -s * .12, h * .55)


def d_tree(r, s):
    nodes = [(0, -s * .38), (-s * .3, -s * .03), (s * .3, -s * .03), (-s * .45, s * .34), (-s * .15, s * .34)]
    edges = [(0, 1), (0, 2), (1, 3), (1, 4)]
    rad = s * .075
    d = ''
    for a, b in edges:
        (x1, y1), (x2, y2) = nodes[a], nodes[b]
        ang = math.atan2(y2 - y1, x2 - x1)
        d += line(r, x1 + rad * math.cos(ang), y1 + rad * math.sin(ang), x2 - rad * math.cos(ang), y2 - rad * math.sin(ang))
    for x, y in nodes:
        d += circle(r, x, y, rad, over=1.08, n=10)
    return d


def d_list(r, s):
    w, h = s * .24, s * .2
    d = ''
    for i in range(3):
        x = -s * .5 + i * (w + s * .13)
        d += f'M{x:.1f} {-h/2:.1f}L{x + w:.1f} {-h/2 + J(r,1):.1f}L{x + w:.1f} {h/2:.1f}L{x:.1f} {h/2 + J(r,1):.1f}Z'
        d += line(r, x + w * .66, -h / 2, x + w * .66, h / 2, 0.8)
        if i < 2:
            x1, x2 = x + w, x + w + s * .13
            d += line(r, x1 + 2, 0, x2 - 1, 0) + head(r, x2, 0, 0, 7)
    return d


def d_stack(r, s):
    w, h = s * .5, s * .17
    d = ''
    for i in range(3):
        y = s * .3 - i * (h + 5)
        d += f'M{-w/2:.1f} {y:.1f}L{w/2:.1f} {y + J(r,1):.1f}L{w/2:.1f} {y - h:.1f}L{-w/2:.1f} {y - h + J(r,1):.1f}Z'
    d += line(r, 0, -s * .42, 0, -s * .2) + head(r, 0, -s * .2, math.pi / 2, 8)
    return d


def d_graph(r, s):
    nodes = [(-s * .35, -s * .2), (s * .1, -s * .38), (s * .38, s * .05), (-s * .05, s * .34), (-s * .42, s * .24)]
    edges = [(0, 1), (1, 2), (2, 3), (3, 4), (4, 0), (1, 3)]
    rad = s * .07
    d = ''
    for a, b in edges:
        (x1, y1), (x2, y2) = nodes[a], nodes[b]
        ang = math.atan2(y2 - y1, x2 - x1)
        d += line(r, x1 + rad * math.cos(ang), y1 + rad * math.sin(ang), x2 - rad * math.cos(ang), y2 - rad * math.sin(ang))
    for x, y in nodes:
        d += circle(r, x, y, rad, over=1.08, n=10)
    return d


def d_hash(r, s):
    R = s / 2
    return line(r, -R * .3, -R, -R * .45, R) + line(r, R * .45, -R, R * .3, R) + line(r, -R, -R * .35, R, -R * .42) + line(r, -R, R * .4, R, R * .34)


def d_plus(r, s):
    R = s / 2
    return line(r, 0, -R, 0, R) + line(r, -R, 0, R, 0)


def d_eq(r, s):
    R = s / 2
    return line(r, -R, -R * .28, R, -R * .3) + line(r, -R, R * .28, R, R * .3)


def d_dots(r, s):
    pts = [(-s / 2 + i * s / 9, math.sin(i * .7) * s * .18) for i in range(10)]
    d = ''
    for x, y in pts[:-1]:
        d += circle(r, x, y, 2.4, over=1.0, n=6)
    ex, ey = pts[-1]
    ang = math.atan2(ey - pts[-2][1], ex - pts[-2][0])
    return d + line(r, ex - 8, ey, ex, ey, .4) + head(r, ex + 4, ey, ang, 9)


KINDS = {
    # 名字: (函数, 默认大小, 是否可作彩色强调)
    'star': (d_star, 46, True), 'sparkle': (d_sparkle, 40, True), 'spiral': (d_spiral, 54, False),
    'arrow': (d_arrow, 100, False), 'squiggle': (d_squiggle, 90, True), 'circle': (d_circle, 56, True),
    'bars': (d_bars, 96, True), 'brace': (d_brace, 74, False), 'bracket': (d_bracket, 70, False),
    'paren': (d_paren, 70, False), 'angle': (d_angle, 70, False), 'tree': (d_tree, 120, True),
    'list': (d_list, 130, True), 'stack': (d_stack, 96, True), 'graph': (d_graph, 108, True),
    'hash': (d_hash, 40, False), 'plus': (d_plus, 34, True), 'eq': (d_eq, 40, False), 'dots': (d_dots, 110, False),
}
ORDER = ['tree', 'star', 'brace', 'sparkle', 'arrow', 'bars', 'paren', 'circle', 'list', 'hash', 'stack', 'squiggle',
         'graph', 'angle', 'spiral', 'plus', 'bracket', 'dots', 'star', 'eq', 'bars', 'tree', 'sparkle', 'brace',
         'arrow', 'list', 'stack', 'graph', 'circle', 'paren', 'star', 'squiggle', 'bracket', 'sparkle', 'angle', 'hash']


def doodles(P, seed):
    r = random.Random(seed)
    placed = []
    out = []
    accents = [P['blue'], P['red'], P['green'], P['yellow']]
    ai = 0
    for kind in ORDER:
        fn, base, can_color = KINDS[kind]
        center = r.random() > 0.84
        scale = (0.8 if center else 1) * r.uniform(0.85, 1.15)
        s = base * scale
        rad = s * 0.7
        for _ in range(500):
            if center:
                x = r.uniform(330, 1270)
            else:
                x = r.uniform(70, 280) if r.random() < 0.5 else r.uniform(1320, 1530)
            y = r.uniform(120, H - 120)
            if all(math.hypot(x - px, y - py) > (rad + pr) * 0.95 + 26 for px, py, pr in placed):
                placed.append((x, y, rad))
                break
        else:
            continue
        if can_color and r.random() < 0.7:
            col = accents[ai % 4]
            ai += 1
            op = P['doodle']
        else:
            col, op = P['ink'], P['ink_op']
        if center:
            op *= P['center']
        rot = r.uniform(-18, 18)
        body = fn(r, s)
        if not body.startswith('<g'):
            body = f'<path d="{body}"/>'
        elif '<g' in body and 'M' in body and '<path' not in body:
            # 括号 / 花括号：内部是 <g transform>d</g>，给里面的 d 套 path
            import re
            body = re.sub(r'(<g[^>]*>)(M[^<]*)(</g>)', r'\1<path d="\2"/>\3', body)
            body = re.sub(r'</g>(M[^<]*)$', r'</g>', body)
        # 部分图形（柱状图、树、图）里，随机挑一块用彩色排线涂实，像用彩铅涂了一格
        extra = ''
        if kind in ('bars', 'tree', 'graph', 'list', 'stack') and r.random() < 0.8:
            fc = accents[(ai + 1) % 4]
            ex = ''.join(line(r, -s * .22 + i * 5, s * .02 + J(r, 2), -s * .22 + i * 5 + s * .16, -s * .14 + J(r, 2), 1) for i in range(0, 9))
            extra = f'<g stroke="{fc}" stroke-width="1.6" opacity=".8"><path d="{ex}"/></g>'
        out.append(
            f'<g transform="translate({x:.0f} {y:.0f}) rotate({rot:.1f})" fill="none" stroke="{col}" stroke-width="2.2" '
            f'stroke-linecap="round" stroke-linejoin="round" opacity="{op:.2f}">{body}{extra}</g>'
        )
    return ''.join(out)


# ------------------------------------------------------------------ 彩铅排线色块 + 晕色
def hatch_patches(P, seed):
    r = random.Random(seed)
    spec = [
        (170, 420, 210, 170, 'blue', 58), (1450, 300, 200, 150, 'yellow', 125), (1460, 840, 180, 230, 'green', 62),
        (150, 1160, 200, 190, 'red', 120), (1440, 1470, 220, 170, 'blue', 55), (170, 1790, 220, 160, 'yellow', 118),
        (1450, 1990, 190, 120, 'green', 60), (130, 160, 150, 80, 'green', 64), (1480, 1130, 120, 100, 'red', 130),
    ]
    clips, patches, washes = [], [], []
    for i, (cx, cy, rx, ry, cname, ang_deg) in enumerate(spec):
        col = P[cname]
        rot = r.uniform(-0.5, 0.5)
        shape = blob(r, cx, cy, rx, ry, n=11, jit=0.18, rot=rot)
        core = blob(r, cx + rx * .05, cy, rx * .58, ry * .56, n=9, jit=0.2, rot=rot)
        clips.append(f'<clipPath id="c{i}"><path d="{shape}"/></clipPath><clipPath id="k{i}"><path d="{core}"/></clipPath>')
        washes.append(f'<path d="{shape}" fill="{col}" fill-opacity="{P["wash"]}"/>')
        for tag, gap, a_off, op in (('c', 7.5, 0, P['hatch']), ('k', 12, 62, P['hatch'] * .85)):
            a = math.radians(ang_deg + a_off)
            dx, dy = math.cos(a), math.sin(a)
            nx, ny = -dy, dx
            R = max(rx, ry) * 1.5
            t = -R
            ls = ''
            while t < R:
                o = r.uniform(.55, 1) * op
                j = r.uniform(-1.2, 1.2)
                x1, y1 = cx + nx * t - dx * R + j, cy + ny * t - dy * R
                x2, y2 = cx + nx * t + dx * R, cy + ny * t + dy * R + j
                ls += f'<path d="{line(r, x1, y1, x2, y2, 1.6)}" stroke-opacity="{o:.2f}" stroke-width="{r.uniform(1.2, 2):.1f}"/>'
                t += gap * r.uniform(.85, 1.2)
            patches.append(f'<g clip-path="url(#{tag}{i})" stroke="{col}" fill="none" stroke-linecap="round">{ls}</g>')
    return ''.join(clips), ''.join(washes), ''.join(patches)


def build(name, P, bg, seed):
    clips, washes, patches = hatch_patches(P, seed)
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs>
<filter id="soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="16"/></filter>
<filter id="pf" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
<feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="3" result="warp"/>
<feDisplacementMap in="SourceGraphic" in2="warp" scale="3" xChannelSelector="R" yChannelSelector="G" result="w"/>
<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="8" result="n"/>
<feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  {P['grain_hi']} 0 0 0 {P['grain_lo']}" result="g"/>
<feComposite in="w" in2="g" operator="in"/>
</filter>
{clips}
</defs>
<rect width="{W}" height="{H}" fill="{bg}" opacity="0"/>
<g filter="url(#soft)">{washes}</g>
<g filter="url(#pf)">{patches}{doodles(P, seed + 1)}</g>
</svg>'''
    path = os.path.join(OUT, name)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(svg)
    print(name, round(os.path.getsize(path) / 1024, 1), 'KB')


if __name__ == '__main__':
    build('bg-paper.svg', PALETTES['paper'], '#f8f5ee', 11)
    build('bg-board.svg', PALETTES['board'], '#1b2321', 11)
