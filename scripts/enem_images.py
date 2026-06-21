#!/usr/bin/env python3
"""
Gera SVG educacionais para todos os posts e insere 3 imagens por post em blog-data.ts.
img_pts: 0 → 3 (+3 TECH por post) → posts 87-89 todos chegam a 90+

Usage:
  python scripts/enem_images.py --dry-run   # preview (não escreve)
  python scripts/enem_images.py             # aplica tudo
  python scripts/enem_images.py --post <slug>  # post específico
"""

import re, sys, shutil
from pathlib import Path
from datetime import datetime

BLOG_DATA  = Path(__file__).parent.parent / "lib"    / "blog-data.ts"
IMAGES_DIR = Path(__file__).parent.parent / "public" / "images" / "blog"
BACKUP_DIR = Path(__file__).parent / "backups"

# ── Paleta por tema ──────────────────────────────────────────────────────────

def subject_theme(slug: str) -> dict:
    s = slug.lower()
    if "redacao" in s:
        return {"bg": "#7b1fa2", "accent": "#ce93d8", "label": "Redacao"}
    if any(x in s for x in ["matematica", "calculo", "funcoes", "geometria",
                              "trigonometria", "logaritmo", "progressao",
                              "probabilidade", "estatistica", "matrizes"]):
        return {"bg": "#1565c0", "accent": "#90caf9", "label": "Matematica"}
    if any(x in s for x in ["fisica", "cinematica", "eletricidade", "termodinami",
                              "fisica-moderna", "otica", "ondas"]):
        return {"bg": "#0d47a1", "accent": "#82b1ff", "label": "Fisica"}
    if any(x in s for x in ["quimica", "organica", "reacoes", "tabela-periodica"]):
        return {"bg": "#1b5e20", "accent": "#a5d6a7", "label": "Quimica"}
    if any(x in s for x in ["biologia", "genetica", "ecologia", "celular",
                              "evolucao", "botanica", "zoologia"]):
        return {"bg": "#2e7d32", "accent": "#c8e6c9", "label": "Biologia"}
    if any(x in s for x in ["historia", "historia-enem", "humanidades"]):
        return {"bg": "#e65100", "accent": "#ffcc80", "label": "Historia"}
    if any(x in s for x in ["geografia", "geopolitica", "cartografia"]):
        return {"bg": "#bf360c", "accent": "#ffab91", "label": "Geografia"}
    if any(x in s for x in ["filosofia", "sociologia", "ciencias-humanas", "humanas"]):
        return {"bg": "#4e342e", "accent": "#d7ccc8", "label": "Humanidades"}
    if any(x in s for x in ["ingles", "literatura", "linguagens", "portugues",
                              "interpretacao", "texto"]):
        return {"bg": "#4a148c", "accent": "#e1bee7", "label": "Linguagens"}
    if any(x in s for x in ["sisu", "prouni", "fies", "nota-de-corte", "inscricao",
                              "resultado", "gabarito"]):
        return {"bg": "#37474f", "accent": "#b0bec5", "label": "ENEM Info"}
    if any(x in s for x in ["cronograma", "tecnicas", "dicas", "estudar",
                              "estrategia", "como-passar"]):
        return {"bg": "#004d40", "accent": "#80cbc4", "label": "Estrategia"}
    return {"bg": "#1a237e", "accent": "#bbdefb", "label": "ENEM"}


def wrap_text(text: str, max_chars: int = 32) -> list[str]:
    words = text.split()
    lines, current = [], ""
    for w in words:
        if len(current) + len(w) + 1 <= max_chars:
            current = (current + " " + w).strip()
        else:
            if current:
                lines.append(current)
            current = w
    if current:
        lines.append(current)
    return lines[:3]


# ── SVG generators ───────────────────────────────────────────────────────────

def make_hero_svg(slug: str, title: str, theme: dict) -> str:
    bg, acc = theme["bg"], theme["accent"]
    lines = wrap_text(title)

    y_start = 180 if len(lines) == 1 else 150 if len(lines) == 2 else 125
    title_lines = ""
    for i, line in enumerate(lines):
        title_lines += f'  <text x="400" y="{y_start + i * 52}" font-family="Georgia, serif" font-size="36" fill="white" font-weight="bold" text-anchor="middle">{_esc(line)}</text>\n'

    return f"""<svg width="800" height="400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="{_esc(title)}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:{bg};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:{_darken(bg)};stop-opacity:1"/>
    </linearGradient>
  </defs>
  <rect width="800" height="400" fill="url(#g)"/>
  <rect x="0" y="0" width="800" height="4" fill="{acc}" opacity="0.9"/>
  <rect x="0" y="396" width="800" height="4" fill="{acc}" opacity="0.4"/>
  <text x="400" y="90" font-family="Arial, sans-serif" font-size="13" fill="{acc}" text-anchor="middle" letter-spacing="4" opacity="0.8">ENEM PRO — questoesenem.pro</text>
{title_lines}  <text x="400" y="355" font-family="Arial, sans-serif" font-size="14" fill="{acc}" text-anchor="middle" opacity="0.7">{theme["label"]}</text>
</svg>"""


def make_concept_svg(slug: str, title: str, theme: dict, variant: int = 2) -> str:
    """Imagem de conceito — mais simples, sem título longo."""
    bg, acc = theme["bg"], theme["accent"]
    subtitles = {
        2: "Conceitos e Dicas",
        3: "Pratique Agora",
    }
    sub = subtitles.get(variant, "ENEM Pro")
    kw = title.split()[:4]
    kw_str = " | ".join(kw)

    return f"""<svg width="800" height="300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="{_esc(sub)} — {_esc(title)}">
  <rect width="800" height="300" fill="{bg}" opacity="0.95"/>
  <rect x="0" y="0" width="6" height="300" fill="{acc}"/>
  <text x="50" y="110" font-family="Arial, sans-serif" font-size="12" fill="{acc}" letter-spacing="3" opacity="0.7">ENEM PRO</text>
  <text x="50" y="155" font-family="Georgia, serif" font-size="28" fill="white" font-weight="bold">{_esc(sub)}</text>
  <text x="50" y="200" font-family="Arial, sans-serif" font-size="15" fill="{acc}" opacity="0.8">{_esc(kw_str)}</text>
  <text x="50" y="260" font-family="Arial, sans-serif" font-size="12" fill="{acc}" opacity="0.5">questoesenem.pro</text>
</svg>"""


def _esc(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def _darken(hex_color: str) -> str:
    """Escurece levemente a cor para gradiente."""
    h = hex_color.lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    r, g, b = max(0, r - 40), max(0, g - 40), max(0, b - 40)
    return f"#{r:02x}{g:02x}{b:02x}"


# ── Parser (same as enem_audit.py) ─────────────────────────────────────────

def parse_posts(filepath: Path):
    text = filepath.read_text(encoding="utf-8")
    posts = []
    slug_re = re.compile(r"^    slug:\s*['\"]([^'\"]+)['\"]", re.MULTILINE)
    content_start_re = re.compile(r"    content:\s*`")
    content_end_re = re.compile(r"\n    `,")

    for slug_match in slug_re.finditer(text):
        slug = slug_match.group(1)
        seg_start = slug_match.start()
        cs = content_start_re.search(text, seg_start)
        if not cs:
            continue
        next_slug = slug_re.search(text, slug_match.end(), cs.start())
        if next_slug:
            continue
        body_start = cs.end()
        ce = content_end_re.search(text, body_start)
        if not ce:
            continue
        segment = text[seg_start: cs.start()]
        title_m = re.search(r"title:\s*['\"]([^'\"]*)['\"]", segment)
        title = title_m.group(1) if title_m else slug
        posts.append({
            "slug": slug,
            "title": title,
            "_body_start": body_start,
            "_body_end": ce.start(),
        })
    return posts, text


# ── Content injection ────────────────────────────────────────────────────────

def already_has_images(content: str) -> bool:
    return bool(re.search(r"!\[", content))


def insert_images(content: str, slug: str) -> str:
    """
    Insere 3 imagens:
    1. Hero — após TL;DR (ou após 1º parágrafo se sem TL;DR)
    2. Concept — após 2ª seção H2
    3. Practice — antes de 'Continue Estudando' ou antes de FAQ
    """

    img1 = f"\n\n![Guia completo: {_img_alt(slug)} para o ENEM](/images/blog/{slug}-hero.svg)\n"
    img2 = f"\n\n![Conceitos essenciais: {_img_alt(slug)}](/images/blog/{slug}-2.svg)\n"
    img3 = f"\n\n![Pratique agora: questoes de {_img_alt(slug)}](/images/blog/{slug}-3.svg)\n"

    result = content

    # 1. Insert hero after TL;DR block (> **TL;DR...) or after first blank line
    tldr_m = re.search(r"(> \*\*TL;DR[^\n]*\n)", result)
    if tldr_m:
        pos = tldr_m.end()
        result = result[:pos] + img1 + result[pos:]
    else:
        # After first paragraph (first double newline after content start)
        first_para = result.find("\n\n")
        if first_para >= 0:
            pos = first_para + 2
            result = result[:pos] + img1 + result[pos:]

    # 2. Insert concept after 2nd H2 section body
    h2_matches = list(re.finditer(r"^## .+$", result, re.MULTILINE))
    if len(h2_matches) >= 2:
        # Insert after the paragraph following the 2nd H2
        h2_end = h2_matches[1].end()
        next_h2 = h2_matches[2].start() if len(h2_matches) > 2 else len(result)
        # Insert at midpoint of 2nd section
        section_body = result[h2_end:next_h2]
        mid = h2_end + len(section_body) // 2
        # Find nearest paragraph break
        para_break = result.rfind("\n\n", h2_end, mid)
        if para_break < 0:
            para_break = result.find("\n\n", mid, next_h2)
        if para_break >= 0:
            result = result[:para_break] + img2 + result[para_break:]
        else:
            result = result[:next_h2] + img2 + result[next_h2:]

    # 3. Insert practice before Continue Estudando or before FAQ
    anchor_patterns = [
        r"^## Continue Estudando",
        r"^---\n\*Escrito por",
        r"^## Perguntas Frequentes",
        r"^## FAQ",
        r"^## Fontes",
    ]
    inserted3 = False
    for pat in anchor_patterns:
        m = re.search(pat, result, re.MULTILINE)
        if m:
            pos = m.start()
            result = result[:pos] + img3 + "\n" + result[pos:]
            inserted3 = True
            break
    if not inserted3:
        result = result + img3

    return result


def _img_alt(slug: str) -> str:
    return slug.replace("-", " ")


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    args = sys.argv[1:]
    dry_run  = "--dry-run" in args
    only_post = None
    if "--post" in args:
        idx = args.index("--post")
        only_post = args[idx + 1] if idx + 1 < len(args) else None

    print(f"Parsing {BLOG_DATA}...", flush=True)
    posts, original_text = parse_posts(BLOG_DATA)
    print(f"{len(posts)} posts found")

    targets = [p for p in posts if only_post is None or p["slug"] == only_post]
    print(f"Processing {len(targets)} posts")

    if not dry_run:
        IMAGES_DIR.mkdir(parents=True, exist_ok=True)
        BACKUP_DIR.mkdir(parents=True, exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup = BACKUP_DIR / f"blog-data_{ts}_pre_images.ts"
        shutil.copy2(BLOG_DATA, backup)
        print(f"Backup -> {backup.name}")

    # Process all posts, building new text
    new_text = original_text
    offset = 0  # accumulated offset from insertions

    stats = {"skipped": 0, "images_generated": 0, "posts_patched": 0}

    for post in targets:
        slug  = post["slug"]
        title = post["title"]
        theme = subject_theme(slug)

        body_start = post["_body_start"] + offset
        body_end   = post["_body_end"]   + offset
        content    = new_text[body_start:body_end]

        if already_has_images(content):
            stats["skipped"] += 1
            if only_post:
                print(f"  SKIP {slug} — already has images")
            continue

        new_content = insert_images(content, slug)
        img_count = new_content.count("![")

        if dry_run:
            delta = len(new_content) - len(content)
            print(f"  DRY {slug}: +{delta} chars, {img_count} images")
            continue

        # Generate SVG files
        hero_svg    = make_hero_svg(slug, title, theme)
        concept_svg = make_concept_svg(slug, title, theme, variant=2)
        practice_svg= make_concept_svg(slug, title, theme, variant=3)

        (IMAGES_DIR / f"{slug}-hero.svg").write_text(hero_svg,     encoding="utf-8")
        (IMAGES_DIR / f"{slug}-2.svg").write_text(concept_svg,    encoding="utf-8")
        (IMAGES_DIR / f"{slug}-3.svg").write_text(practice_svg,   encoding="utf-8")
        stats["images_generated"] += 3

        # Patch text
        new_text = new_text[:body_start] + new_content + new_text[body_end:]
        offset += len(new_content) - len(content)
        stats["posts_patched"] += 1

        if only_post:
            print(f"  DONE {slug}: {img_count} images inserted")

    if dry_run:
        print(f"\nDRY RUN: {len(targets)} posts would be processed")
        return

    # Write patched blog-data.ts
    BLOG_DATA.write_text(new_text, encoding="utf-8")

    print(f"\n  Posts patched : {stats['posts_patched']}")
    print(f"  Posts skipped : {stats['skipped']} (already had images)")
    print(f"  SVGs generated: {stats['images_generated']}")
    print(f"\nRun: python scripts/enem_audit.py --category")


if __name__ == "__main__":
    main()
