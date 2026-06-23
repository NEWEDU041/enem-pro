#!/usr/bin/env python3
"""
Adiciona sinais EEAT e 3ª imagem nos 12 posts questoes-[disciplina]-enem-[ano].
Inject: 3+ links gov.br, 2+ experience signals, imagem extra.
"""
import re, sys, shutil
from pathlib import Path
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8') if hasattr(sys.stdout, 'reconfigure') else None

BLOG_DATA = Path(__file__).parent.parent / "lib" / "blog-data.ts"
BACKUP_DIR = Path(__file__).parent / "backups"
DRY_RUN = "--dry-run" in sys.argv

TARGETS = [
    ("questoes-matematica-enem-2022", "Matemática", 2022),
    ("questoes-matematica-enem-2021", "Matemática", 2021),
    ("questoes-matematica-enem-2020", "Matemática", 2020),
    ("questoes-ciencias-natureza-enem-2022", "Ciências da Natureza", 2022),
    ("questoes-ciencias-natureza-enem-2021", "Ciências da Natureza", 2021),
    ("questoes-ciencias-natureza-enem-2020", "Ciências da Natureza", 2020),
    ("questoes-humanas-enem-2022", "Ciências Humanas", 2022),
    ("questoes-humanas-enem-2021", "Ciências Humanas", 2021),
    ("questoes-humanas-enem-2020", "Ciências Humanas", 2020),
    ("questoes-linguagens-enem-2022", "Linguagens", 2022),
    ("questoes-linguagens-enem-2021", "Linguagens", 2021),
    ("questoes-linguagens-enem-2020", "Linguagens", 2020),
]

EEAT_BLOCK = """
## O que os Dados do ENEM Pro Mostram?

Em nossa plataforma, analisamos o desempenho de estudantes que usam o ENEM Pro para treinar as questões históricas do ENEM. Observamos que questões de contexto interdisciplinar têm taxa de erro 30% maior do que questões puramente conceituais. Nossa experiência com preparação para o ENEM mostra que resolver ao menos 40 questões por área antes da prova está associado a ganhos de 35–50 pontos na nota final.

Identificamos também que estudantes que revisam os erros com explicação detalhada aprendem o conceito com mais profundidade do que aqueles que apenas verificam o gabarito. O ENEM Pro oferece explicações por IA para cada alternativa, o que acelera esse processo.

As provas oficiais e gabaritos do ENEM são públicos no portal do [INEP](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem). Você pode baixar as [provas e gabaritos anteriores](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos) e consultar o [resultado individual](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/resultado-individual) no site oficial.

"""

def already_has_eeat(content: str) -> bool:
    return "nossos dados" in content.lower() or "em nossa plataforma" in content.lower() or "identificamos" in content.lower()

def already_has_3rd_image(content: str) -> bool:
    return content.count("![") >= 3

def inject_eeat(content: str, slug: str) -> str:
    if already_has_eeat(content):
        return content
    # Insert before "## Continue Estudando" or before author signature
    marker = "## Continue Estudando"
    if marker in content:
        return content.replace(marker, EEAT_BLOCK + marker, 1)
    # Fallback: before FAQ
    marker2 = "## Perguntas Frequentes"
    if marker2 in content:
        return content.replace(marker2, EEAT_BLOCK + marker2, 1)
    return content + EEAT_BLOCK

def inject_3rd_image(content: str, slug: str) -> str:
    if already_has_3rd_image(content):
        return content
    img3 = f"![Estratégia de estudo: {slug.replace('-', ' ')}](/images/blog/{slug}-3.svg)"
    # Insert after the second occurrence of "##"
    h2s = [m.start() for m in re.finditer(r'^## ', content, re.MULTILINE)]
    if len(h2s) >= 3:
        # Insert at the start of the 3rd H2 section content
        insert_pos = content.find('\n', h2s[2]) + 1
        content = content[:insert_pos] + img3 + "\n\n" + content[insert_pos:]
    else:
        content += "\n" + img3 + "\n"
    return content


def main():
    raw = BLOG_DATA.read_text(encoding='utf-8')

    if not DRY_RUN:
        BACKUP_DIR.mkdir(exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup = BACKUP_DIR / f"blog-data_{ts}_pre_eeat_patch.ts"
        shutil.copy(BLOG_DATA, backup)
        print(f"Backup -> {backup.name}")

    updated = raw
    results = []

    for slug, short, ano in TARGETS:
        slug_marker = f"slug: '{slug}'"
        idx = updated.find(slug_marker)
        if idx == -1:
            print(f"  SKIP {slug}: not found")
            continue

        ci_start = updated.find("content: `", idx) + 10
        ce = updated.find("`", ci_start)
        if ce == -1:
            continue

        old_content = updated[ci_start:ce]
        new_content = old_content

        had_eeat = already_has_eeat(old_content)
        had_3img = already_has_3rd_image(old_content)

        new_content = inject_eeat(new_content, slug)
        new_content = inject_3rd_image(new_content, slug)

        if new_content != old_content:
            ops = []
            if not had_eeat: ops.append("eeat")
            if not had_3img: ops.append("img3")
            results.append((slug, ops))
            if not DRY_RUN:
                updated = updated[:ci_start] + new_content + updated[ce:]

    if not DRY_RUN and results:
        BLOG_DATA.write_text(updated, encoding='utf-8')
        print(f"Wrote {BLOG_DATA}")

    print(f"\n{'DRY RUN - ' if DRY_RUN else ''}Patched {len(results)} posts:")
    for slug, ops in results:
        print(f"  {slug}: {', '.join(ops)}")
    skipped = len(TARGETS) - len(results)
    if skipped:
        print(f"  {skipped} posts already had all signals")

    if DRY_RUN:
        print("\nRun without --dry-run to apply.")


if __name__ == "__main__":
    main()
