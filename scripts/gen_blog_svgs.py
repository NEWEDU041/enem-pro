#!/usr/bin/env python3
"""Gera os SVGs (hero, -2, -3) para todo post do blog que estiver sem imagem.
Replica o estilo dos SVGs existentes em public/images/blog/."""
import sys, re, html
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8') if hasattr(sys.stdout, 'reconfigure') else None

ROOT = Path(__file__).parent.parent
BLOG_DATA = ROOT / "lib" / "blog-data.ts"
IMG_DIR = ROOT / "public" / "images" / "blog"


def parse_posts():
    text = BLOG_DATA.read_text(encoding="utf-8")
    posts = []
    for m in re.finditer(r"slug: '([^']+)',\s*\n\s*title: '([^']*)'", text):
        posts.append((m.group(1), m.group(2)))
    return posts


def wrap(title, maxlen=24, maxlines=4):
    words = title.split()
    lines, cur = [], ""
    for w in words:
        if len(cur) + len(w) + (1 if cur else 0) <= maxlen:
            cur = (cur + " " + w).strip()
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    if len(lines) > maxlines:
        lines = lines[:maxlines]
        lines[-1] = lines[-1] + "…"
    return lines


def esc(s):
    return html.escape(s, quote=True)


def hero_svg(title):
    lines = wrap(title)
    y0, step = 125, 52
    tlines = "\n".join(
        f'  <text x="400" y="{y0 + i*step}" font-family="Georgia, serif" font-size="36" '
        f'fill="white" font-weight="bold" text-anchor="middle">{esc(ln)}</text>'
        for i, ln in enumerate(lines)
    )
    return f"""<svg width="800" height="400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="{esc(title)}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a237e;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#000056;stop-opacity:1"/>
    </linearGradient>
  </defs>
  <rect width="800" height="400" fill="url(#g)"/>
  <rect x="0" y="0" width="800" height="4" fill="#bbdefb" opacity="0.9"/>
  <rect x="0" y="396" width="800" height="4" fill="#bbdefb" opacity="0.4"/>
  <text x="400" y="90" font-family="Arial, sans-serif" font-size="13" fill="#bbdefb" text-anchor="middle" letter-spacing="4" opacity="0.8">ENEM PRO — questoesenem.pro</text>
{tlines}
  <text x="400" y="355" font-family="Arial, sans-serif" font-size="14" fill="#bbdefb" text-anchor="middle" opacity="0.7">ENEM</text>
</svg>
"""


def panel_svg(title, label):
    sub = " | ".join(title.split()[:4])
    return f"""<svg width="800" height="300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="{esc(label)} — {esc(title)}">
  <rect width="800" height="300" fill="#1a237e" opacity="0.95"/>
  <rect x="0" y="0" width="6" height="300" fill="#bbdefb"/>
  <text x="50" y="110" font-family="Arial, sans-serif" font-size="12" fill="#bbdefb" letter-spacing="3" opacity="0.7">ENEM PRO</text>
  <text x="50" y="155" font-family="Georgia, serif" font-size="28" fill="white" font-weight="bold">{esc(label)}</text>
  <text x="50" y="200" font-family="Arial, sans-serif" font-size="15" fill="#bbdefb" opacity="0.8">{esc(sub)}</text>
  <text x="50" y="260" font-family="Arial, sans-serif" font-size="12" fill="#bbdefb" opacity="0.5">questoesenem.pro</text>
</svg>
"""


def main():
    force = "--all" in sys.argv
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    posts = parse_posts()
    created = 0
    fixed_slugs = []
    for slug, title in posts:
        targets = {
            f"{slug}-hero.svg": hero_svg(title),
            f"{slug}-2.svg": panel_svg(title, "Conceitos e Dicas"),
            f"{slug}-3.svg": panel_svg(title, "Pratique Agora"),
        }
        missing = [f for f in targets if not (IMG_DIR / f).exists()]
        if not missing and not force:
            continue
        fixed_slugs.append(slug)
        for fname, content in targets.items():
            if force or not (IMG_DIR / fname).exists():
                (IMG_DIR / fname).write_text(content, encoding="utf-8")
                created += 1
    print(f"Posts processados: {len(posts)}")
    print(f"SVGs criados: {created}")
    print(f"Slugs corrigidos: {len(fixed_slugs)}")
    for s in fixed_slugs[:40]:
        print(f"  + {s}")
    if len(fixed_slugs) > 40:
        print(f"  ... +{len(fixed_slugs)-40}")


if __name__ == "__main__":
    main()
