"""
把霞鹜文楷裁成“站点实际用到的字”，每个字重只有一个 woff2 文件。

为什么要自己裁：npm 上的 lxgw-wenkai-webfont 为了通用，把整套字库切成了近百个小文件（按 unicode-range）。
一个页面通常要同时下载三四十个，每到一个，浏览器就把用到它的文字重新排版一遍，首次打开时会反复重排、字形闪烁。
这里把站点真正用到的字合并成一个文件（再加上预加载），文字只排一次版。

用法（课文、界面文字改动后重新运行即可）：
    python tools/subset_fonts.py
依赖：fonttools、brotli、node_modules 里的 lxgw-wenkai-webfont（只用来取字形，不会打进网站）。
"""
import glob
import os
import re
import sys

from fontTools import merge, subset
from fontTools.ttLib import TTFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FILES = os.path.join(ROOT, 'node_modules', 'lxgw-wenkai-webfont', 'files')
OUT = os.path.join(ROOT, 'src', 'assets', 'fonts')
os.makedirs(OUT, exist_ok=True)


def read(path):
    try:
        return open(path, encoding='utf-8').read()
    except UnicodeDecodeError:
        return ''


def source_files(exts):
    out = []
    for base, _dirs, names in os.walk(os.path.join(ROOT, 'src')):
        for n in names:
            if os.path.splitext(n)[1] in exts:
                out.append(os.path.join(base, n))
    return out


ASCII = {chr(c) for c in range(0x20, 0x7F)}
# 常见的中英文标点与符号，课文里会用到，哪怕当前没出现也一并带上
EXTRA = set('，。、；：？！“”‘’（）【】《》—…·～×÷±≤≥≠→←↑↓▸▲✓✗√°²³¹⁰¹⁸⁹ⁿ₂') | set('0123456789')


def chars_of(text):
    return {c for c in text if ord(c) >= 0x20 and c not in '\r\n\t'}


all_text = ''.join(read(p) for p in source_files({'.ts', '.tsx', '.md', '.css', '.html'}) ) + read(os.path.join(ROOT, 'index.html'))
regular = ASCII | EXTRA | chars_of(all_text)

# 粗体：界面文字（tsx / ts）、课文里的标题与加粗内容
ui_text = ''.join(read(p) for p in source_files({'.ts', '.tsx', '.css'})) + read(os.path.join(ROOT, 'index.html'))
bold_text = ''
for p in source_files({'.md'}):
    t = read(p)
    bold_text += ''.join(re.findall(r'^#{1,4} .*$', t, flags=re.M)) + ''.join(re.findall(r'\*\*(.+?)\*\*', t)) + ''.join(re.findall(r'^> \[!\S+\] ?(.*)$', t, flags=re.M))
bold = ASCII | EXTRA | chars_of(ui_text) | chars_of(bold_text)

# 等宽（代码区）：代码块里的字、算法演示的源码与讲解
code_text = ''
for p in source_files({'.md'}):
    code_text += ''.join(re.findall(r'```[^\n]*\n(.*?)```', read(p), flags=re.S))
for p in glob.glob(os.path.join(ROOT, 'src', 'algos', '*.tsx')):
    code_text += read(p)
mono = ASCII | EXTRA | chars_of(code_text)

SETS = {
    'wenkai-regular': ('lxgwwenkai-regular-subset-*.woff2', regular),
    'wenkai-bold': ('lxgwwenkai-bold-subset-*.woff2', bold),
    'wenkaimono-regular': ('lxgwwenkaimono-regular-subset-*.woff2', mono),
}

DROP = ['GSUB', 'GPOS', 'GDEF', 'morx', 'feat', 'bsln', 'vhea', 'vmtx', 'FFTM', 'gasp', 'kern', 'MATH', 'STAT', 'meta']

for name, (pattern, chars) in SETS.items():
    paths = sorted(glob.glob(os.path.join(FILES, pattern)))
    # 只合并真正含有所需字符的那几个小文件
    need = {ord(c) for c in chars}
    pick = []
    covered = set()
    for p in paths:
        f = TTFont(p, lazy=True)
        cm = set(f.getBestCmap().keys())
        hit = cm & need
        if hit:
            pick.append(p)
            covered |= hit
        f.close()
    missing = sorted(need - covered)
    merger = merge.Merger(options=merge.Options(drop_tables=DROP))
    font = merger.merge(pick)
    opts = subset.Options()
    opts.layout_features = []
    opts.name_IDs = [1, 2, 3, 4, 6]
    opts.notdef_outline = True
    opts.hinting = False
    opts.drop_tables += DROP
    opts.flavor = 'woff2'
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=sorted(need & covered))
    sub.subset(font)
    font.flavor = 'woff2'
    dst = os.path.join(OUT, name + '.woff2')
    font.save(dst)
    kept = sorted(font.getBestCmap().keys())
    with open(os.path.join(OUT, name + '.chars.txt'), 'w', encoding='utf-8') as fh:
        fh.write(''.join(chr(c) for c in kept))
    print(f'{name}: 用到 {len(need)} 个字，字库里有 {len(need & covered)} 个，文件 {os.path.getsize(dst) // 1024} KB（合并了 {len(pick)} 个小文件）',
          '缺字：' + ''.join(chr(c) for c in missing[:40]) if missing else '', file=sys.stdout)

css = '''/* 由 tools/subset_fonts.py 生成的字体（霞鹜文楷，只含站点用到的字）。文字改动后请重新运行该脚本。 */
@font-face {
  font-family: 'LXGW WenKai';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('../assets/fonts/wenkai-regular.woff2') format('woff2');
}
@font-face {
  font-family: 'LXGW WenKai';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('../assets/fonts/wenkai-bold.woff2') format('woff2');
}
@font-face {
  font-family: 'LXGW WenKai Mono';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('../assets/fonts/wenkaimono-regular.woff2') format('woff2');
}
'''
open(os.path.join(ROOT, 'src', 'styles', 'fonts.css'), 'w', encoding='utf-8').write(css)
print('已生成 src/styles/fonts.css')
