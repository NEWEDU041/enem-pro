#!/usr/bin/env python3
"""
Fix meta descriptions dos 7 posts questoes-[disciplina]-enem-[ano] para 150-160 chars.
"""
import sys, shutil, re
from pathlib import Path
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8') if hasattr(sys.stdout, 'reconfigure') else None

BLOG_DATA = Path(__file__).parent.parent / "lib" / "blog-data.ts"
BACKUP_DIR = Path(__file__).parent / "backups"

FIXES = {
    'questoes-ciencias-natureza-enem-2022': (
        'Questões de Ciências da Natureza do ENEM 2022 com gabarito. Análise de Física, Química e Biologia. Veja os temas mais cobrados e pratique grátis.',
        'Questões de Ciências da Natureza do ENEM 2022 com gabarito e resolução. Física, Química e Biologia: análise dos temas mais cobrados. Pratique grátis.',
    ),
    'questoes-ciencias-natureza-enem-2021': (
        'Questões de Ciências da Natureza do ENEM 2021 com gabarito e análise. Física, Química e Biologia com os temas mais cobrados. Pratique grátis agora.',
        'Questões de Ciências da Natureza do ENEM 2021 com gabarito e análise. Física, Química e Biologia: temas mais cobrados. Pratique online e grátis.',
    ),
    'questoes-ciencias-natureza-enem-2020': (
        'Questões de Ciências da Natureza do ENEM 2020 com gabarito e análise de Física, Química e Biologia. Veja os temas mais cobrados e pratique grátis.',
        'Questões de Ciências da Natureza do ENEM 2020 com gabarito. Análise completa de Física, Química e Biologia com os temas mais cobrados. Pratique já.',
    ),
    'questoes-humanas-enem-2022': (
        'Questões de Ciências Humanas do ENEM 2022 com gabarito. Análise de História, Geografia, Filosofia e Sociologia. Veja os temas mais cobrados.',
        'Questões de Ciências Humanas do ENEM 2022 com gabarito. Análise de História, Geografia, Filosofia e Sociologia com os temas mais cobrados. Pratique.',
    ),
    'questoes-humanas-enem-2020': (
        'Questões de Ciências Humanas do ENEM 2020 com gabarito e análise. Veja os temas de História, Geografia, Filosofia e Sociologia mais cobrados.',
        'Questões de Ciências Humanas do ENEM 2020 com gabarito e análise. Temas de História, Geografia, Filosofia e Sociologia mais cobrados. Pratique grátis.',
    ),
    'questoes-linguagens-enem-2021': (
        'Questões de Linguagens do ENEM 2021 com gabarito e análise. Português, Literatura e Artes com os temas mais cobrados. Pratique com resolução grátis.',
        'Questões de Linguagens do ENEM 2021 com gabarito e análise. Português, Literatura, Inglês e Artes com os temas mais cobrados. Pratique online grátis.',
    ),
}


def main():
    raw = BLOG_DATA.read_text(encoding='utf-8')

    print("Checking targets:")
    for slug, (old, new) in FIXES.items():
        old_len = len(old)
        new_len = len(new)
        status_old = "OK" if 150 <= old_len <= 160 else f"BAD({old_len})"
        status_new = "OK" if 150 <= new_len <= 160 else f"BAD({new_len})"
        print(f"  {slug[-30:]}: {status_old} -> {status_new}")
        if status_new.startswith("BAD"):
            print(f"    WARNING: new desc has {new_len} chars, need 150-160!")

    # Apply
    updated = raw
    fixed = 0

    # Also fix the one we accidentally broke earlier
    FIXES['questoes-ciencias-natureza-enem-2022'] = (
        'Questões de Ciências da Natureza do ENEM 2022 com gabarito. Análise de Física, Química e Biologia. Temas mais cobrados e resolução grátis.',  # current broken version
        'Questões de Ciências da Natureza do ENEM 2022 com gabarito e resolução. Física, Química e Biologia: análise dos temas mais cobrados. Pratique grátis.',
    )

    for slug, (old, new) in FIXES.items():
        if old in updated:
            updated = updated.replace(old, new, 1)
            fixed += 1
        else:
            # Try finding current description
            idx = updated.find(f"slug: '{slug}'")
            if idx != -1:
                ds = updated.find('description:', idx) + 12
                de = updated.find("',\n", ds) + 1
                current = updated[ds:de].strip().strip("'")
                if 150 <= len(current) <= 160:
                    print(f"  SKIP {slug[-25:]}: already {len(current)} chars")
                else:
                    print(f"  WARN {slug[-25:]}: current='{current[:60]}...' ({len(current)} chars)")

    BLOG_DATA.write_text(updated, encoding='utf-8')
    print(f"\nFixed {fixed} descriptions in {BLOG_DATA}")


if __name__ == '__main__':
    main()
