#!/usr/bin/env python3
"""
ENEM Pro Blog Auto-Fixer — applies all rule-based fixes without LLM or API calls.

What it fixes (0 tokens):
  ✓ TL;DR block (after first paragraph)
  ✓ Internal links section — "Continue Estudando" (3-5 links, topic-aware)
  ✓ FAQ section (templated, when completely absent)
  ✓ Author signal footer
  ✓ Heading hierarchy skips (H2 → H4 → fixes to H3)
  ✓ Long paragraphs > 200 words (split at sentence boundary)

What it CAN'T fix (reported, left for LLM/generation):
  ✗ Content expansion (thin < 600 words)
  ✗ Real source citations (INEP/MEC URLs)
  ✗ Experience signals
  ✗ Images
  ✗ Comparison/data tables
  ✗ AI-phrase rewriting

Usage:
  python scripts/enem_fix.py --dry-run   # show what would change, no writes
  python scripts/enem_fix.py             # apply all fixes to lib/blog-data.ts
  python scripts/enem_fix.py --post SLUG # fix a single post only
"""

import re
import sys
import shutil
from pathlib import Path
from datetime import datetime

# Import audit logic from sibling module
sys.path.insert(0, str(Path(__file__).parent))
from enem_audit import parse_posts, score_post, GATE_4_THRESHOLD

BLOG_DATA = Path(__file__).parent.parent / "lib" / "blog-data.ts"
BACKUP_DIR = Path(__file__).parent / "backups"

# ──────────────────────────────────────────────────────────────────────────────
# INTERNAL LINK SETS  (topic-aware)
# ──────────────────────────────────────────────────────────────────────────────

BASE_LINKS = [
    ("/questoes", "Questões do ENEM por Disciplina", "Pratique com questões reais de todos os anos"),
    ("/simulado", "Simulado ENEM Completo", "Simule a prova com cronômetro e gabarito"),
    ("/cronograma", "Cronograma de Estudos", "Monte seu plano personalizado até o ENEM"),
]

TOPIC_LINKS = {
    "matematica":  ("/questoes?disciplina=matematica", "Questões de Matemática ENEM", "Todos os anos, por tópico"),
    "fisica":      ("/questoes?disciplina=fisica",     "Questões de Física ENEM",     "Eletromagnetismo, termodinâmica e mais"),
    "quimica":     ("/questoes?disciplina=quimica",    "Questões de Química ENEM",    "Estequiometria, orgânica e mais"),
    "biologia":    ("/questoes?disciplina=biologia",   "Questões de Biologia ENEM",   "Ecologia, genética, evolução"),
    "historia":    ("/questoes?disciplina=historia",   "Questões de História ENEM",   "Brasil, mundo e atualidades"),
    "geografia":   ("/questoes?disciplina=geografia",  "Questões de Geografia ENEM",  "Biomas, geopolítica e cartografia"),
    "filosofia":   ("/questoes?disciplina=filosofia",  "Questões de Filosofia ENEM",  "Pensadores e correntes filosóficas"),
    "sociologia":  ("/questoes?disciplina=sociologia", "Questões de Sociologia ENEM", "Conceitos e teorias sociais"),
    "linguagens":  ("/questoes?disciplina=linguagens", "Questões de Linguagens ENEM", "Português, literatura e inglês"),
    "redacao":     ("/redacao",   "Redação ENEM", "Temas, competências e correção por IA"),
    "temas":       ("/temas-redacao", "Temas de Redação ENEM", "Lista completa com análise"),
    "gabarito":    ("/calcular-nota", "Calcular Nota ENEM", "Estime sua pontuação pelo TRI"),
    "nota":        ("/calcular-nota", "Calculadora de Nota ENEM", "TRI + nota por área"),
    "sisu":        ("/calcular-nota", "Calcular Nota para o SISU", "Veja se sua nota é competitiva"),
    "prouni":      ("/calcular-nota", "Calcular Nota para o ProUni", "Bolsas parciais e integrais"),
    "cronograma":  ("/questao-do-dia", "Questão do Dia", "1 questão diária para manter o ritmo"),
}

def build_links_section(slug: str) -> str:
    links = list(BASE_LINKS)

    # Add one topic-specific link if slug matches
    for keyword, (path, label, desc) in TOPIC_LINKS.items():
        if keyword in slug and not any(p == path for p, _, _ in links):
            links.insert(0, (path, label, desc))
            break

    # Keep at most 5 links
    links = links[:5]

    lines = ["\n\n## Continue Estudando\n"]
    for path, label, desc in links:
        lines.append(f"- [{label}]({path}) — {desc}")
    return "\n".join(lines)


# ──────────────────────────────────────────────────────────────────────────────
# FAQ TEMPLATES  (generic ENEM, used only when post has NO FAQ at all)
# ──────────────────────────────────────────────────────────────────────────────

FAQ_GENERIC = """

## Perguntas Frequentes

### Quando é o ENEM?
O ENEM é aplicado geralmente em novembro. As datas exatas são divulgadas pelo INEP no início do ano no site oficial gov.br/inep.

### Como me inscrever no ENEM?
A inscrição é feita exclusivamente no site do INEP durante o período de inscrições (normalmente maio-junho). O valor da taxa pode ser isento para estudantes de escola pública ou de baixa renda.

### Como o ENEM Pro pode me ajudar?
O ENEM Pro oferece questões reais organizadas por disciplina e ano, com gabarito e explicação gerada por IA para cada resposta. São 10 questões por dia gratuitas, sem cartão de crédito.

### O que é o TRI do ENEM?
O ENEM usa a Teoria de Resposta ao Item (TRI) para calcular notas. Ela leva em conta a dificuldade de cada questão, não apenas o número de acertos. Use a [calculadora de nota](/calcular-nota) do ENEM Pro para estimar sua pontuação."""

AUTHOR_SIGNAL = """\n\n---\n*Conteúdo produzido pela Equipe ENEM Pro — especialistas em preparação para o ENEM com dados de desempenho de milhares de estudantes em nossa plataforma.*"""


# ──────────────────────────────────────────────────────────────────────────────
# INDIVIDUAL FIXERS
# ──────────────────────────────────────────────────────────────────────────────

def add_tldr(content: str, description: str) -> str:
    """Insert TL;DR block after the first non-empty paragraph."""
    if "TL;DR" in content:
        return content

    # Find end of first paragraph (first double newline)
    idx = content.find("\n\n")
    if idx == -1:
        return content

    short_desc = description[:200] if len(description) > 200 else description
    tldr = f"\n\n> **TL;DR:** {short_desc} [Pratique no ENEM Pro →](/questoes)"
    return content[:idx] + tldr + content[idx:]


def add_internal_links(content: str, slug: str) -> str:
    """Add 'Continue Estudando' section before the FAQ or at the end."""
    ilinks = len(re.findall(r"\]\(/", content))
    if ilinks >= 3:
        return content  # already enough

    section = build_links_section(slug)

    # Insert BEFORE the FAQ section if it exists
    faq_match = re.search(r"\n## Perguntas", content, re.IGNORECASE)
    if faq_match:
        return content[:faq_match.start()] + section + content[faq_match.start():]

    return content.rstrip() + section


def add_faq(content: str, slug: str) -> str:
    """Append generic FAQ if no FAQ section exists at all."""
    if re.search(r"## Perguntas|## FAQ", content, re.IGNORECASE):
        return content
    return content.rstrip() + FAQ_GENERIC


def add_author(content: str) -> str:
    """Append author signal if not already present."""
    if "Equipe ENEM Pro" in content and "plataforma" in content.lower():
        return content
    return content.rstrip() + AUTHOR_SIGNAL


def fix_heading_hierarchy(content: str) -> str:
    """Correct heading level skips (e.g. H2 → H4 becomes H2 → H3)."""
    lines = content.split("\n")
    result = []
    prev_level = 1  # Assume H1 exists outside (page title)

    for line in lines:
        m = re.match(r"^(#{1,6}) (.+)$", line)
        if m:
            level = len(m.group(1))
            text = m.group(2)
            # If this heading skips more than 1 level down, cap it
            if level > prev_level + 1:
                level = prev_level + 1
            prev_level = level
            result.append("#" * level + " " + text)
        else:
            result.append(line)

    return "\n".join(result)


def split_long_paragraphs(content: str, max_words: int = 200) -> str:
    """Split paragraphs exceeding max_words at a sentence boundary near the midpoint."""
    blocks = content.split("\n\n")
    result = []

    for block in blocks:
        if block.startswith("#") or block.startswith(">") or block.startswith("|"):
            result.append(block)
            continue

        words = block.split()
        if len(words) <= max_words:
            result.append(block)
            continue

        # Find sentence boundary near the middle
        sentences = re.split(r"(?<=[.!?])\s+", block)
        mid = len(words) // 2
        cursor = 0
        split_at = len(sentences) // 2  # fallback

        for i, sent in enumerate(sentences):
            cursor += len(sent.split())
            if cursor >= mid:
                split_at = i + 1
                break

        first  = " ".join(sentences[:split_at]).strip()
        second = " ".join(sentences[split_at:]).strip()
        if first and second:
            result.append(first)
            result.append(second)
        else:
            result.append(block)

    return "\n\n".join(result)


# ──────────────────────────────────────────────────────────────────────────────
# APPLY ALL FIXES TO A SINGLE POST
# ──────────────────────────────────────────────────────────────────────────────

def apply_fixes(post: dict, audit: dict) -> tuple[str, list[str]]:
    """Return (new_content, list_of_applied_fixes)."""
    content = post["content"]
    applied = []

    fix_ids = {f[0] for f in audit["auto_fixes"]}

    if "add_tldr" in fix_ids:
        new = add_tldr(content, post["description"])
        if new != content:
            content = new
            applied.append("tldr")

    if "fix_headings" in fix_ids:
        new = fix_heading_hierarchy(content)
        if new != content:
            content = new
            applied.append("headings")

    if "split_paragraphs" in fix_ids:
        new = split_long_paragraphs(content)
        if new != content:
            content = new
            applied.append("split_paragraphs")

    if "add_internal_links" in fix_ids:
        new = add_internal_links(content, post["slug"])
        if new != content:
            content = new
            applied.append("internal_links")

    if "add_faq" in fix_ids:
        new = add_faq(content, post["slug"])
        if new != content:
            content = new
            applied.append("faq")

    if "add_author" in fix_ids:
        new = add_author(content)
        if new != content:
            content = new
            applied.append("author")

    return content, applied


# ──────────────────────────────────────────────────────────────────────────────
# FILE WRITE-BACK
# ──────────────────────────────────────────────────────────────────────────────

def write_back(file_text: str, patches: list[tuple[int, int, str]]) -> str:
    """Apply (start, end, replacement) patches from end to start (safe ordering)."""
    patches_sorted = sorted(patches, key=lambda p: p[0], reverse=True)
    for start, end, replacement in patches_sorted:
        file_text = file_text[:start] + replacement + file_text[end:]
    return file_text


# ──────────────────────────────────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────────────────────────────────

def main():
    args = sys.argv[1:]
    dry_run  = "--dry-run" in args
    only_slug = None
    if "--post" in args:
        idx = args.index("--post")
        only_slug = args[idx + 1] if idx + 1 < len(args) else None

    print(f"Parsing {BLOG_DATA} …", end=" ", flush=True)
    posts, file_text = parse_posts(BLOG_DATA)
    print(f"{len(posts)} posts")

    # Filter by slug if --post flag given
    if only_slug:
        posts = [p for p in posts if p["slug"] == only_slug]
        if not posts:
            print(f"Slug '{only_slug}' not found.")
            sys.exit(1)

    patches = []
    summary = {"fixed": 0, "skipped": 0, "total_ops": 0, "by_fix": {}}

    for post in posts:
        audit = score_post(post)

        if not audit["auto_fixes"]:
            summary["skipped"] += 1
            continue

        new_content, applied = apply_fixes(post, audit)

        if not applied:
            summary["skipped"] += 1
            continue

        summary["fixed"] += 1
        summary["total_ops"] += len(applied)
        for fix in applied:
            summary["by_fix"][fix] = summary["by_fix"].get(fix, 0) + 1

        score_before = audit["scores"]["total"]

        if dry_run:
            re_audit = score_post({**post, "content": new_content})
            score_after = re_audit["scores"]["total"]
            delta = score_after - score_before
            print(f"  [{score_before:>3}->{score_after:>3} +{delta}] {post['slug'][:45]}  fixes={applied}")
        else:
            # Schedule the patch
            patches.append((post["_body_start"], post["_body_end"], new_content))

    if dry_run:
        print(f"\n-- DRY RUN --------------------------------------------------")
        print(f"Would fix {summary['fixed']} posts ({summary['total_ops']} total operations)")
        print(f"Operations breakdown: {summary['by_fix']}")
        print(f"Skipped (no auto-fixes needed): {summary['skipped']}")
        print(f"\nRun without --dry-run to apply.")
        return

    if not patches:
        print("Nothing to fix.")
        return

    # Backup before writing
    BACKUP_DIR.mkdir(exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup = BACKUP_DIR / f"blog-data_{ts}.ts"
    shutil.copy(BLOG_DATA, backup)
    print(f"Backup -> {backup}")

    # Apply patches
    new_text = write_back(file_text, patches)
    BLOG_DATA.write_text(new_text, encoding="utf-8")

    print(f"\nFixed {summary['fixed']} posts ({summary['total_ops']} operations)")
    print(f"  Operations: {summary['by_fix']}")
    print(f"  Skipped:    {summary['skipped']}")

    # LLM backlog
    all_audits = [score_post(p) for p in posts]
    llm_needed = [(a["slug"], a["scores"]["total"], a["needs_llm"])
                  for a in all_audits if a["needs_llm"]]
    still_failing = [a for a in all_audits if a["scores"]["total"] < GATE_4_THRESHOLD]

    print(f"\n  Still failing Gate 4 after auto-fixes: {len(still_failing)} posts")
    print(f"  Require LLM work (content expansion, citations, images):")
    by_op: dict = {}
    for _, _, ops in llm_needed:
        for op_id, op_desc in ops:
            by_op[op_id] = by_op.get(op_id, 0) + 1
    for op_id, count in sorted(by_op.items(), key=lambda x: -x[1]):
        print(f"    {op_id:<30} {count} posts")

    print(f"\nNext step: run '/blog rewrite' on posts scoring < 70 (see audit_report.json)")
    print("           python scripts/enem_audit.py --json")


if __name__ == "__main__":
    main()
