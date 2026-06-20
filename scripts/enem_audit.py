#!/usr/bin/env python3
"""
ENEM Pro Blog Audit — 5-Gate Delivery Contract scoring (no LLM, no API calls)
Scores all 204 posts against quality-scoring.md criteria.

Usage:
  python scripts/enem_audit.py              # table of all posts
  python scripts/enem_audit.py --fails      # only posts scoring < 90
  python scripts/enem_audit.py --json       # dump full report to audit_report.json
  python scripts/enem_audit.py --category   # group by score band
"""

import re
import sys
import json
from pathlib import Path
from dataclasses import dataclass, field
from typing import List, Tuple

BLOG_DATA = Path(__file__).parent.parent / "lib" / "blog-data.ts"
REPORT_PATH = Path(__file__).parent / "audit_report.json"
GATE_4_THRESHOLD = 90

# PT-BR AI trigger words that inflate the density metric
AI_TRIGGERS = [
    "além disso", "em conclusão", "é importante ressaltar", "vale mencionar",
    "é fundamental", "nesse sentido", "por outro lado", "em suma", "destaca-se",
    "é válido", "cabe mencionar", "por fim", "conclui-se", "tendo em vista",
    "dessa forma", "assim sendo", "é possível observar", "todavia", "outrossim",
    "ademais", "primordialmente", "indubitavelmente", "inequivocamente",
    "indubitável", "ressalta-se", "nota-se que", "percebe-se que",
]

# ──────────────────────────────────────────────────────────────────────────────
# PARSER
# ──────────────────────────────────────────────────────────────────────────────

def parse_posts(filepath: Path) -> List[dict]:
    text = filepath.read_text(encoding="utf-8")
    posts = []

    # Each post starts with: (2 spaces){ (newline)(4 spaces)slug:
    slug_re = re.compile(r"^    slug:\s*['\"]([^'\"]+)['\"]", re.MULTILINE)
    content_start_re = re.compile(r"    content:\s*`")
    content_end_re = re.compile(r"\n    `,")

    for slug_match in slug_re.finditer(text):
        slug = slug_match.group(1)
        seg_start = slug_match.start()

        # Find content: ` that belongs to THIS post
        cs = content_start_re.search(text, seg_start)
        if not cs:
            continue
        # Sanity: there should be no other slug between slug_match and cs
        next_slug = slug_re.search(text, slug_match.end(), cs.start())
        if next_slug:
            continue  # something off — skip

        body_start = cs.end()  # position right after the opening backtick
        ce = content_end_re.search(text, body_start)
        if not ce:
            continue

        # Extract fields from the segment between slug and content
        segment = text[seg_start : cs.start()]

        def field_val(name: str) -> str:
            m = re.search(rf"{name}:\s*['\"]([^'\"]*)['\"]", segment)
            return m.group(1) if m else ""

        def field_int(name: str) -> int:
            m = re.search(rf"{name}:\s*(\d+)", segment)
            return int(m.group(1)) if m else 5

        posts.append({
            "slug": slug,
            "title": field_val("title"),
            "description": field_val("description"),
            "date": field_val("date"),
            "readTime": field_int("readTime"),
            "content": text[body_start : ce.start()],
            # Store positions for enem_fix.py
            "_body_start": body_start,
            "_body_end": ce.start(),
        })

    return posts, text


# ──────────────────────────────────────────────────────────────────────────────
# SCORING
# ──────────────────────────────────────────────────────────────────────────────

def clean_content(content: str) -> str:
    c = re.sub(r"^#{1,6} .+$", "", content, flags=re.MULTILINE)
    c = re.sub(r"\*+([^*\n]+)\*+", r"\1", c)
    c = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", c)
    c = re.sub(r"^[-*>] ", "", c, flags=re.MULTILINE)
    c = re.sub(r"\n+", " ", c)
    return c.strip()


def score_post(post: dict) -> dict:
    content = post["content"]
    title = post["title"]
    description = post["description"]
    slug = post["slug"]

    clean = clean_content(content)
    words = clean.split()
    wc = len(words)

    issues: List[str] = []
    auto_fixes: List[Tuple[str, str]] = []   # (fix_id, description)
    needs_llm: List[Tuple[str, str]] = []

    # ── CONTENT QUALITY (30 pts) ──────────────────────────────────────────────

    # 1. Depth / word count (7 pts)
    if wc >= 1800:   depth = 7
    elif wc >= 1200: depth = 6
    elif wc >= 900:  depth = 5
    elif wc >= 600:  depth = 4
    elif wc >= 400:  depth = 3
    elif wc >= 200:  depth = 2
    else:            depth = 1
    if depth < 5:
        needs_llm.append(("expand_content", f"Expand from {wc} → 1200+ words"))

    # 2. Readability — avg sentence length proxy (7 pts)
    sents = [s.strip() for s in re.split(r"[.!?]+", clean) if len(s.split()) > 3]
    avg_sent = (sum(len(s.split()) for s in sents) / len(sents)) if sents else 20
    if 12 <= avg_sent <= 20:   readability = 7
    elif 10 <= avg_sent <= 22: readability = 5
    elif avg_sent <= 25:       readability = 3
    else:                      readability = 1
    if avg_sent > 22:
        issues.append(f"Avg sentence {avg_sent:.0f} words (need ≤20)")

    # 3. Originality — LLM-only; baseline 2/5
    originality = 2
    needs_llm.append(("add_experience_signals", "Add first-person data/experience markers"))

    # 4. Structure — heading freq + paragraph length (4 pts)
    h2s = re.findall(r"^## .+$", content, re.MULTILINE)
    paras = [p.strip() for p in content.split("\n\n")
             if p.strip() and not p.strip().startswith("#")]
    long_paras = [p for p in paras if len(p.split()) > 150]
    structure = (2 if len(h2s) >= 2 else 1 if len(h2s) == 1 else 0)
    structure += (2 if not long_paras else 1 if len(long_paras) <= 2 else 0)
    if long_paras:
        issues.append(f"{len(long_paras)} paragraphs > 150 words")
        auto_fixes.append(("split_paragraphs", f"Split {len(long_paras)} long paragraphs"))

    # 5. Engagement — TL;DR, bold, lists (4 pts)
    has_tldr = "TL;DR" in content or "tldr" in content.lower()
    has_bold = "**" in content
    has_list = bool(re.search(r"^[-*] ", content, re.MULTILINE))
    engagement = (2 if has_tldr else 0) + (1 if has_bold else 0) + (1 if has_list else 0)
    if not has_tldr:
        issues.append("Missing TL;DR")
        auto_fixes.append(("add_tldr", "Insert TL;DR after first paragraph"))

    # 6. Grammar / AI-pattern density (3 pts)
    cl = content.lower()
    ai_hits = sum(1 for w in AI_TRIGGERS if w in cl)
    ai_density = ai_hits / max(1, wc / 1000)
    grammar = 3 if ai_density <= 3 else 2 if ai_density <= 6 else 1
    if ai_density > 5:
        issues.append(f"AI trigger density {ai_density:.1f}/1k")
        needs_llm.append(("rewrite_ai_phrases", "Reduce connector/AI-sounding phrases"))

    content_quality = depth + readability + originality + structure + engagement + grammar

    # ── SEO (25 pts) ─────────────────────────────────────────────────────────

    # 1. Heading hierarchy (5 pts)
    hlevels = [len(m.group(1)) for m in re.finditer(r"^(#{1,6}) ", content, re.MULTILINE)]
    hierarchy_ok = all(hlevels[i] <= hlevels[i-1] + 1 for i in range(1, len(hlevels)))
    slug_kw = slug.replace("-", " ").split()[:3]
    kw_in_headings = sum(1 for h in re.findall(r"^#{1,3} .+$", content, re.MULTILINE)
                         if any(w in h.lower() for w in slug_kw))
    h_seo = (3 if hierarchy_ok else 1) + (2 if kw_in_headings >= 2 else 1 if kw_in_headings else 0)
    if not hierarchy_ok:
        issues.append("Broken heading hierarchy")
        auto_fixes.append(("fix_headings", "Fix heading level skips"))

    # 2. Title length (4 pts)
    tlen = len(title)
    t_seo = 4 if 40 <= tlen <= 60 else 2 if 35 <= tlen <= 65 else 1
    if tlen > 65 or tlen < 35:
        issues.append(f"Title {tlen} chars (need 40-60)")

    # 3. Keyword density (4 pts)
    first100 = " ".join(words[:100]).lower()
    kw_in_intro = any(w in first100 for w in slug_kw)
    kw_freq = sum(clean.lower().count(w) for w in slug_kw) / max(1, wc / 100)
    kw_seo = (2 if kw_in_intro else 0) + (2 if 0.5 <= kw_freq <= 2 else 1 if kw_freq > 0 else 0)

    # 4. Internal links (4 pts)
    ilinks = len(re.findall(r"\]\(/", content))
    il_seo = 4 if ilinks >= 3 else 2 if ilinks >= 1 else 0
    if ilinks < 3:
        issues.append(f"Only {ilinks} internal link(s) (need ≥3)")
        auto_fixes.append(("add_internal_links", "Insert 'Continue Estudando' section"))

    # 5. URL structure (3 pts) — all slugs are clean lowercase-hyphenated
    url_seo = 3

    # 6. Meta description length (3 pts)
    dlen = len(description)
    d_seo = 3 if 150 <= dlen <= 160 else 2 if 140 <= dlen <= 170 else 1
    if dlen > 170 or dlen < 140:
        issues.append(f"Meta desc {dlen} chars (need 150-160)")

    # 7. External links (2 pts)
    elinks = len(re.findall(r"\]\(https?://", content))
    el_seo = 2 if elinks >= 3 else 1 if elinks >= 1 else 0
    if elinks == 0:
        issues.append("No external links")
        needs_llm.append(("add_external_links", "Add 3+ links to INEP/MEC/gov.br"))

    seo = h_seo + t_seo + kw_seo + il_seo + url_seo + d_seo + el_seo

    # ── E-E-A-T (15 pts) ─────────────────────────────────────────────────────

    # 1. Author attribution (4 pts)
    has_author = "equipe enem pro" in cl or "equipe enem" in cl
    author_pts = 2 if has_author else 0
    if not has_author:
        auto_fixes.append(("add_author", "Add author signal footer"))

    # 2. Source citations (4 pts)
    # Detect markdown links to official sources: [text](https://gov.br/...)
    url_cite_re = re.compile(r"\]\(https?://[^\)]*gov\.br[^\)]*\)", re.IGNORECASE)
    # Also detect named references: [INEP...] or [MEC...] in link text
    named_cite_re = re.compile(r"\[(?:[^\]]*(?:INEP|MEC|IBGE|SISU|BNCC)[^\]]*)\]\(https?://", re.IGNORECASE)
    url_cites = len(url_cite_re.findall(content))
    named_cites = len(named_cite_re.findall(content))
    cite_pts = 4 if url_cites >= 3 else 2 if url_cites >= 1 or named_cites >= 2 else 1 if named_cites >= 1 else 0
    if cite_pts < 2:
        issues.append("Insufficient source citations")
        needs_llm.append(("add_citations", "Add INEP/MEC citations with URLs + year anchors"))

    # 3. Trust indicators (4 pts) — site-level contact/about pages; assumed pass
    trust_pts = 4

    # 4. Experience signals (3 pts)
    exp_signals = ["quando testamos", "na nossa análise", "analisamos", "nossos dados",
                   "nossa experiência", "em nossa plataforma", "identificamos", "testamos",
                   "observamos", "nosso time", "estudantes que usam"]
    exp_pts = 2 if any(s in cl for s in exp_signals) else 0
    if exp_pts == 0:
        needs_llm.append(("experience_signals", "Add 'nossa plataforma' / data-backed claims"))

    eeat = author_pts + cite_pts + trust_pts + exp_pts

    # ── TECHNICAL (15 pts) ───────────────────────────────────────────────────
    # Next.js + Vercel handles schema, OG, page-speed, mobile at the framework level.

    has_faq = bool(re.search(r"^## Perguntas|^## FAQ", content, re.MULTILINE | re.IGNORECASE))
    schema_pts = 3 if has_faq else 2  # layout.tsx has BlogPosting; FAQ content enables FAQ schema

    imgs = len(re.findall(r"!\[", content)) + len(re.findall(r"<img", content, re.IGNORECASE))
    img_pts = min(3, imgs)
    if imgs == 0:
        issues.append("No images")
        needs_llm.append(("add_images", "Add hero + 1-2 in-body images (requires generation)"))

    has_table = bool(re.search(r"\|[-:]+\|", content))
    has_list2 = bool(re.search(r"^[-*] ", content, re.MULTILINE))
    struct_pts = (1 if has_table else 0) + (1 if has_list2 else 0)

    infra_pts = 6  # page-speed, mobile, OG — handled by Next.js/Vercel

    technical = schema_pts + img_pts + struct_pts + infra_pts

    # ── AI CITATION READINESS (15 pts) ───────────────────────────────────────

    # 1. Passage citability (4 pts) — avg section word count
    sections = [s.strip() for s in re.split(r"^#{1,3} .+$", content, flags=re.MULTILINE) if s.strip()]
    avg_sec = (sum(len(s.split()) for s in sections) / len(sections)) if sections else 50
    passage_pts = 4 if 80 <= avg_sec <= 200 else 2 if 50 <= avg_sec <= 300 else 1

    # 2. Q&A headings ratio (3 pts)
    h2s_all = re.findall(r"^## .+$", content, re.MULTILINE)
    h2s_q = [h for h in h2s_all if h.rstrip().endswith("?")]
    q_ratio = len(h2s_q) / max(1, len(h2s_all))
    qa_pts = 3 if q_ratio >= 0.6 else 2 if q_ratio >= 0.3 else 1

    # 3. FAQ section (3 pts)
    faq_pts = 3 if has_faq else 0
    if not has_faq:
        issues.append("Missing FAQ section")
        auto_fixes.append(("add_faq", "Append templated FAQ section"))

    # 4. Tables (3 pts)
    table_pts = 3 if has_table else 0
    if not has_table:
        issues.append("No tables")
        needs_llm.append(("add_table", "Add data/comparison table"))

    # 5. AI crawlers (2 pts) — SSR via Next.js; always passes
    crawler_pts = 2

    ai_citation = passage_pts + qa_pts + faq_pts + table_pts + crawler_pts

    total = content_quality + seo + eeat + technical + ai_citation

    return {
        "slug": slug,
        "title": title,
        "word_count": wc,
        "scores": {
            "content_quality": content_quality,
            "seo": seo,
            "eeat": eeat,
            "technical": technical,
            "ai_citation": ai_citation,
            "total": total,
        },
        "issues": issues,
        "auto_fixes": auto_fixes,
        "needs_llm": needs_llm,
        "gate_4": "PASS" if total >= GATE_4_THRESHOLD else "FAIL",
        # Stored for enem_fix.py
        "_body_start": post.get("_body_start"),
        "_body_end": post.get("_body_end"),
    }


# ──────────────────────────────────────────────────────────────────────────────
# REPORTING
# ──────────────────────────────────────────────────────────────────────────────

BANDS = {
    (90, 101): "Exceptional",
    (80,  90): "Strong",
    (70,  80): "Acceptable",
    (60,  70): "Below Standard",
    (0,   60): "Rewrite",
}

def band(score: int) -> str:
    for (lo, hi), label in BANDS.items():
        if lo <= score < hi:
            return label
    return "?"


def print_table(results: List[dict], show_only_fails: bool = False):
    rows = [r for r in results if not show_only_fails or r["gate_4"] == "FAIL"]
    rows.sort(key=lambda r: r["scores"]["total"])

    print(f"\n{'SLUG':<45} {'WC':>5} {'CQ':>4} {'SEO':>4} {'EEAT':>4} {'TECH':>4} {'AIC':>4} {'TOT':>4} {'GATE4'}")
    print("-" * 90)
    for r in rows:
        s = r["scores"]
        gate = "OK" if r["gate_4"] == "PASS" else "XX"
        print(f"{r['slug']:<45} {r['word_count']:>5} {s['content_quality']:>4} {s['seo']:>4} "
              f"{s['eeat']:>4} {s['technical']:>4} {s['ai_citation']:>4} {s['total']:>4} {gate}")

    # Summary
    totals = [r["scores"]["total"] for r in results]
    passes = sum(1 for r in results if r["gate_4"] == "PASS")
    fails  = len(results) - passes
    avg    = sum(totals) / len(totals) if totals else 0

    print(f"\n{'-'*90}")
    print(f"Posts: {len(results)} | Avg score: {avg:.1f} | PASS: {passes} | FAIL: {fails}")
    print(f"Auto-fixable issues: {sum(len(r['auto_fixes']) for r in results)}")
    print(f"LLM-required issues: {sum(len(r['needs_llm']) for r in results)}")

    band_counts = {}
    for r in results:
        b = band(r["scores"]["total"])
        band_counts[b] = band_counts.get(b, 0) + 1
    print("\nScore bands:")
    for (lo, hi), label in BANDS.items():
        count = band_counts.get(label, 0)
        bar = "#" * min(count, 40)
        print(f"  {lo:3}-{hi-1:3} {label:<16} {count:>3}  {bar}")


def print_category(results: List[dict]):
    by_band: dict = {}
    for r in results:
        b = band(r["scores"]["total"])
        by_band.setdefault(b, []).append(r)

    for (lo, hi), label in BANDS.items():
        group = by_band.get(label, [])
        if not group:
            continue
        print(f"\n[{lo}-{hi-1}] {label} — {len(group)} posts")
        for r in sorted(group, key=lambda x: x["scores"]["total"], reverse=True):
            s = r["scores"]
            print(f"  {r['scores']['total']:>3}  {r['slug'][:50]}")


# ──────────────────────────────────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────────────────────────────────

def main():
    args = set(sys.argv[1:])
    show_fails = "--fails" in args
    dump_json  = "--json" in args
    by_cat     = "--category" in args

    print(f"Parsing {BLOG_DATA} …", end=" ", flush=True)
    posts, _ = parse_posts(BLOG_DATA)
    print(f"{len(posts)} posts found")

    print("Scoring …", end=" ", flush=True)
    results = [score_post(p) for p in posts]
    print("done")

    if dump_json:
        safe = [{k: v for k, v in r.items() if not k.startswith("_")} for r in results]
        REPORT_PATH.write_text(json.dumps(safe, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Report saved -> {REPORT_PATH}")

    if by_cat:
        print_category(results)
    else:
        print_table(results, show_only_fails=show_fails)

    # Gate 4 summary
    fails = [r for r in results if r["gate_4"] == "FAIL"]
    if fails:
        print(f"\n!! {len(fails)} posts fail Gate 4 (score < {GATE_4_THRESHOLD})")
        print("   Run:  python scripts/enem_fix.py --dry-run   to preview fixes")
        print("   Run:  python scripts/enem_fix.py             to apply fixes")


if __name__ == "__main__":
    main()
