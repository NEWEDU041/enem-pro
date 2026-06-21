#!/usr/bin/env python3
"""
Gap analysis — mostra exatamente o que cada post 85-89 precisa para chegar a 90.
Identifica fixes scriptáveis vs LLM.

Usage:
  python scripts/enem_gap.py            # posts 85-89
  python scripts/enem_gap.py --all      # todos os FAIL posts
  python scripts/enem_gap.py --scripts  # lista fixes scriptáveis disponíveis
"""

import re, sys
from pathlib import Path

BLOG_DATA = Path(__file__).parent.parent / "lib" / "blog-data.ts"

AI_TRIGGERS = [
    "além disso", "em conclusão", "é importante ressaltar", "vale mencionar",
    "é fundamental", "nesse sentido", "por outro lado", "em suma", "destaca-se",
    "é válido", "cabe mencionar", "por fim", "conclui-se", "tendo em vista",
    "dessa forma", "assim sendo", "é possível observar", "todavia", "outrossim",
    "ademais", "primordialmente", "indubitavelmente", "inequivocamente",
    "indubitável", "ressalta-se", "nota-se que", "percebe-se que",
]

EXP_SIGNALS = ["quando testamos", "na nossa análise", "analisamos", "nossos dados",
               "nossa experiência", "em nossa plataforma", "identificamos", "testamos",
               "observamos", "nosso time", "estudantes que usam"]


def parse_posts(filepath):
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
        def fv(name):
            m = re.search(rf"{name}:\s*['\"]([^'\"]*)['\"]", segment)
            return m.group(1) if m else ""
        def fi(name):
            m = re.search(rf"{name}:\s*(\d+)", segment)
            return int(m.group(1)) if m else 5
        posts.append({"slug": slug, "title": fv("title"), "description": fv("description"),
                      "content": text[body_start: ce.start()]})
    return posts


def score_breakdown(post):
    content = post["content"]
    title = post["title"]
    description = post["description"]
    slug = post["slug"]
    cl = content.lower()

    def clean(c):
        c = re.sub(r"^#{1,6} .+$", "", c, flags=re.MULTILINE)
        c = re.sub(r"\*+([^*\n]+)\*+", r"\1", c)
        c = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", c)
        c = re.sub(r"^[-*>] ", "", c, flags=re.MULTILINE)
        c = re.sub(r"\n+", " ", c)
        return c.strip()

    cc = clean(content)
    words = cc.split()
    wc = len(words)

    # CQ
    if wc >= 1800:   depth = 7
    elif wc >= 1200: depth = 6
    elif wc >= 900:  depth = 5
    elif wc >= 600:  depth = 4
    elif wc >= 400:  depth = 3
    elif wc >= 200:  depth = 2
    else:            depth = 1

    sents = [s.strip() for s in re.split(r"[.!?]+", cc) if len(s.split()) > 3]
    avg_sent = (sum(len(s.split()) for s in sents) / len(sents)) if sents else 20
    if 12 <= avg_sent <= 20:   readability = 7
    elif 10 <= avg_sent <= 22: readability = 5
    elif avg_sent <= 25:       readability = 3
    else:                      readability = 1

    originality = 2

    h2s = re.findall(r"^## .+$", content, re.MULTILINE)
    paras = [p.strip() for p in content.split("\n\n")
             if p.strip() and not p.strip().startswith("#")]
    long_paras = [p for p in paras if len(p.split()) > 150]
    structure = (2 if len(h2s) >= 2 else 1 if len(h2s) == 1 else 0)
    structure += (2 if not long_paras else 1 if len(long_paras) <= 2 else 0)

    has_tldr = "TL;DR" in content or "tldr" in content.lower()
    has_bold = "**" in content
    has_list = bool(re.search(r"^[-*] ", content, re.MULTILINE))
    engagement = (2 if has_tldr else 0) + (1 if has_bold else 0) + (1 if has_list else 0)

    ai_hits = sum(1 for w in AI_TRIGGERS if w in cl)
    ai_density = ai_hits / max(1, wc / 1000)
    grammar = 3 if ai_density <= 3 else 2 if ai_density <= 6 else 1

    cq = depth + readability + originality + structure + engagement + grammar

    # SEO
    hlevels = [len(m.group(1)) for m in re.finditer(r"^(#{1,6}) ", content, re.MULTILINE)]
    hierarchy_ok = all(hlevels[i] <= hlevels[i-1] + 1 for i in range(1, len(hlevels)))
    slug_kw = slug.replace("-", " ").split()[:3]
    kw_in_headings = sum(1 for h in re.findall(r"^#{1,3} .+$", content, re.MULTILINE)
                         if any(w in h.lower() for w in slug_kw))
    h_seo = (3 if hierarchy_ok else 1) + (2 if kw_in_headings >= 2 else 1 if kw_in_headings else 0)

    tlen = len(title)
    t_seo = 4 if 40 <= tlen <= 60 else 2 if 35 <= tlen <= 65 else 1

    first100 = " ".join(words[:100]).lower()
    kw_in_intro = any(w in first100 for w in slug_kw)
    kw_freq = sum(cc.lower().count(w) for w in slug_kw) / max(1, wc / 100)
    kw_seo = (2 if kw_in_intro else 0) + (2 if 0.5 <= kw_freq <= 2 else 1 if kw_freq > 0 else 0)

    ilinks = len(re.findall(r"\]\(/", content))
    il_seo = 4 if ilinks >= 3 else 2 if ilinks >= 1 else 0

    url_seo = 3

    dlen = len(description)
    d_seo = 3 if 150 <= dlen <= 160 else 2 if 140 <= dlen <= 170 else 1

    elinks = len(re.findall(r"\]\(https?://", content))
    el_seo = 2 if elinks >= 3 else 1 if elinks >= 1 else 0

    seo = h_seo + t_seo + kw_seo + il_seo + url_seo + d_seo + el_seo

    # EEAT
    author_bio_re = re.compile(r"escrito por|por \*\*equipe|author:|autora?:", re.IGNORECASE)
    has_author = "equipe enem pro" in cl or "equipe enem" in cl
    author_pts = 4 if author_bio_re.search(cl) else 2 if has_author else 0

    url_cite_re = re.compile(r"\]\(https?://[^\)]*gov\.br[^\)]*\)", re.IGNORECASE)
    named_cite_re = re.compile(r"\[(?:[^\]]*(?:INEP|MEC|IBGE|SISU|BNCC)[^\]]*)\]\(https?://", re.IGNORECASE)
    url_cites = len(url_cite_re.findall(content))
    named_cites = len(named_cite_re.findall(content))
    cite_pts = 4 if url_cites >= 3 else 2 if url_cites >= 1 or named_cites >= 2 else 1 if named_cites >= 1 else 0

    trust_pts = 4

    exp_count = sum(1 for s in EXP_SIGNALS if s in cl)
    exp_pts = 3 if exp_count >= 2 else 2 if exp_count >= 1 else 0

    eeat = author_pts + cite_pts + trust_pts + exp_pts

    # TECH
    has_faq = bool(re.search(r"^## Perguntas|^## FAQ", content, re.MULTILINE | re.IGNORECASE))
    schema_pts = 3 if has_faq else 2
    imgs = len(re.findall(r"!\[", content)) + len(re.findall(r"<img", content, re.IGNORECASE))
    img_pts = min(3, imgs)
    has_table = bool(re.search(r"\|[-:]+\|", content))
    has_list2 = bool(re.search(r"^[-*] ", content, re.MULTILINE))
    struct_pts = (1 if has_table else 0) + (1 if has_list2 else 0)
    infra_pts = 6
    technical = schema_pts + img_pts + struct_pts + infra_pts

    # AIC
    sections = [s.strip() for s in re.split(r"^#{1,2} .+$", content, flags=re.MULTILINE) if s.strip()]
    avg_sec = (sum(len(s.split()) for s in sections) / len(sections)) if sections else 50
    passage_pts = 4 if 80 <= avg_sec <= 200 else 2 if 50 <= avg_sec <= 300 else 1

    h2s_all = re.findall(r"^## .+$", content, re.MULTILINE)
    h2s_q = [h for h in h2s_all if h.rstrip().endswith("?")]
    q_ratio = len(h2s_q) / max(1, len(h2s_all))
    qa_pts = 3 if q_ratio >= 0.6 else 2 if q_ratio >= 0.3 else 1

    faq_pts = 3 if has_faq else 0
    table_pts = 3 if has_table else 0
    crawler_pts = 2
    aic = passage_pts + qa_pts + faq_pts + table_pts + crawler_pts

    total = cq + seo + eeat + technical + aic

    return {
        "slug": slug, "wc": wc, "total": total,
        "cq": cq, "seo": seo, "eeat": eeat, "tech": technical, "aic": aic,
        # sub-scores for gap analysis
        "depth": depth, "readability": readability, "originality": originality,
        "structure": structure, "engagement": engagement, "grammar": grammar,
        "h_seo": h_seo, "t_seo": t_seo, "kw_seo": kw_seo, "il_seo": il_seo,
        "d_seo": d_seo, "el_seo": el_seo,
        "author_pts": author_pts, "cite_pts": cite_pts, "exp_pts": exp_pts,
        "img_pts": img_pts, "schema_pts": schema_pts,
        "passage_pts": passage_pts, "qa_pts": qa_pts, "faq_pts": faq_pts, "table_pts": table_pts,
        "elinks": elinks, "ilinks": ilinks, "url_cites": url_cites, "exp_count": exp_count,
        "has_faq": has_faq, "has_table": has_table,
    }


def gap_analysis(s):
    """What scriptable fixes could push score to 90?"""
    gap = 90 - s["total"]
    if gap <= 0:
        return []

    fixes = []

    # 1. External links: el_seo 0→2 = +2 SEO, 1→2 = +1 SEO (SCRIPT)
    if s["el_seo"] < 2:
        gain = 2 - s["el_seo"]
        fixes.append(("SCRIPT", f"ext_links: +{gain} SEO (currently {s['elinks']} ext links, need ≥3)"))

    # 2. Experience signals: exp 0→3 = +3 EEAT, 1→3 = +1 EEAT (SCRIPT)
    if s["exp_pts"] < 3:
        gain = 3 - s["exp_pts"]
        fixes.append(("SCRIPT", f"exp_signal: +{gain} EEAT (found {s['exp_count']} signals, need 2)"))

    # 3. WC expansion: if wc < 900 → depth +1 (LLM)
    if s["wc"] < 900:
        fixes.append(("LLM", f"expand_wc: +1 CQ depth (wc={s['wc']}, need 900+)"))
    if s["wc"] < 1200:
        fixes.append(("LLM", f"expand_wc_1200: +1 CQ depth (wc={s['wc']}, need 1200+)"))

    # 4. Images: 0 imgs → +1-3 TECH (ASSET/LLM)
    if s["img_pts"] == 0:
        fixes.append(("ASSET", "add_images: +1 to +3 TECH (0 images in post)"))

    # 5. QA headings: qa_pts < 3 → +1-2 AIC (SCRIPT)
    if s["qa_pts"] < 3:
        gain = 3 - s["qa_pts"]
        fixes.append(("SCRIPT", f"qa_headings: +{gain} AIC (ratio < 0.6)"))

    # 6. Desc length: d_seo < 3 → +1 SEO (SCRIPT)
    if s["d_seo"] < 3:
        gain = 3 - s["d_seo"]
        fixes.append(("SCRIPT", f"desc_len: +{gain} SEO (check meta description length)"))

    # 7. Citation gov.br links: cite_pts < 4 → +1-4 EEAT (SCRIPT)
    if s["cite_pts"] < 4:
        gain = 4 - s["cite_pts"]
        fixes.append(("SCRIPT", f"gov_links: +{gain} EEAT (need 3+ gov.br links, have {s['url_cites']})"))

    # 8. Internal links: il_seo < 4 → +2 SEO (SCRIPT)
    if s["il_seo"] < 4:
        gain = 4 - s["il_seo"]
        fixes.append(("SCRIPT", f"int_links: +{gain} SEO (have {s['ilinks']} int links, need 3+)"))

    return fixes


def main():
    args = set(sys.argv[1:])
    show_all = "--all" in args
    show_scripts = "--scripts" in args

    posts = parse_posts(BLOG_DATA)
    scores = [score_breakdown(p) for p in posts]

    # Filter by band
    if show_all:
        targets = [s for s in scores if s["total"] < 90]
    else:
        targets = [s for s in scores if 85 <= s["total"] <= 89]

    targets.sort(key=lambda s: s["total"], reverse=True)

    print(f"\n{'SLUG':<48} {'WC':>5} {'CQ':>3}/{25} {'SEO':>3}/{25} {'EEAT':>4}/{15} {'TECH':>4}/{15} {'AIC':>3}/{15} {'TOT':>4}  GAP  SCRIPTABLE_GAIN")
    print("=" * 130)

    # Track scriptable categories
    script_gains = {}

    for s in targets:
        gap = 90 - s["total"]
        fixes = gap_analysis(s)
        script_fixes = [f for t, f in fixes if t == "SCRIPT"]
        script_gain = sum(
            int(f.split("+")[1].split()[0]) for f in script_fixes
        )
        llm_fixes = [f for t, f in fixes if t == "LLM"]
        asset_fixes = [f for t, f in fixes if t == "ASSET"]

        reachable = "✓ CAN REACH 90" if script_gain >= gap else f"needs +{gap}, script+{script_gain}"

        for _, fix in fixes:
            key = fix.split(":")[0]
            script_gains[key] = script_gains.get(key, 0) + 1

        print(f"{s['slug']:<48} {s['wc']:>5} {s['cq']:>3}    {s['seo']:>3}    {s['eeat']:>4}     {s['tech']:>4}     {s['aic']:>3}    {s['total']:>4}  +{gap:<3}  {reachable}")
        if show_scripts:
            for t, f in fixes:
                print(f"  [{t}] {f}")

    print(f"\n\nPOSTS IN 85-89: {len(targets)}")
    print(f"\nMOST COMMON SCRIPT FIXES NEEDED:")
    for fix, count in sorted(script_gains.items(), key=lambda x: -x[1]):
        print(f"  {count:>4}x  {fix}")

    # Summary by what CAN reach 90 via script alone
    reachable_count = 0
    for s in targets:
        gap = 90 - s["total"]
        fixes = gap_analysis(s)
        script_gain = sum(int(f.split("+")[1].split()[0]) for t, f in fixes if t == "SCRIPT")
        if script_gain >= gap:
            reachable_count += 1

    print(f"\nPosts that CAN reach 90 via script alone: {reachable_count}/{len(targets)}")
    print(f"Posts needing LLM/assets: {len(targets) - reachable_count}/{len(targets)}")


if __name__ == "__main__":
    main()
