#!/usr/bin/env python3
"""
Auditoria detalhada de posts ENEM Pro
Extrai métricas de cada post:
- readTime
- wordCount
- BlogPosting schema
- FAQPage schema
- Internal links
- OG images
- Score (se disponível)
"""

import re
import json
from pathlib import Path
from typing import Dict, List, Any

def extract_posts_from_ts():
    """Extrai posts do arquivo lib/blog-data.ts"""
    blog_data_path = Path(__file__).parent.parent / 'lib' / 'blog-data.ts'

    with open(blog_data_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Padrão: procura por cada post { slug: "...", title: "...", ... }
    # Usar regex para encontrar blocos de posts
    posts = []

    # Estratégia: encontrar cada { slug: "..." até o próximo { ou fim do array
    # Simplificado: split por "},\n  {" e processar cada um

    # Remover o "export const BLOG_POSTS: BlogPost[] = [" e o "]" final
    posts_section = re.sub(
        r'export const BLOG_POSTS: BlogPost\[\] = \[',
        '',
        content,
        count=1
    )
    posts_section = re.sub(r'\n\]$', '', posts_section)

    # Dividir por posts (aproximado)
    # Cada post começa com "    {" e termina com "    }," ou "    }"
    # Para evitar complexidade, vamos usar um regex mais simples

    post_blocks = re.findall(
        r'\{\s*slug:\s*"([^"]+)"[^}]*?readTime:\s*(\d+)[^}]*?(?:noindex:\s*(true|false))?[^}]*?\}',
        posts_section,
        re.DOTALL
    )

    # Extrair dados de cada post de forma mais robusta
    for match in re.finditer(
        r'{\s*slug:\s*"([^"]+)"\s*,\s*title:\s*"([^"]+)".*?readTime:\s*(\d+)[^}]*?}',
        posts_section,
        re.DOTALL
    ):
        slug = match.group(1)
        title = match.group(2)
        readTime = int(match.group(3))

        # Encontrar o bloco completo do post para extrair content
        post_block_start = match.start()
        # Procurar o content dentro deste post
        post_block = match.group(0)

        # Extrair content
        content_match = re.search(r'content:\s*`([^`]+)`', post_block, re.DOTALL)
        content = content_match.group(1) if content_match else ''

        # Contar palavras
        word_count = len(content.split())

        # Procurar BlogPosting schema
        has_blog_posting = '"@type": "BlogPosting"' in content

        # Procurar FAQPage schema
        has_faq = '"@type": "FAQPage"' in content

        # Procurar internal links (contendo /blog/)
        internal_links = len(re.findall(r'href=["\']?/blog/[^"\'\s>]+', content))

        # Procurar OG image
        has_og_image = 'og:image' in content or 'image' in post_block

        posts.append({
            'slug': slug,
            'title': title,
            'readTime': readTime,
            'wordCount': word_count,
            'has_blog_posting': has_blog_posting,
            'has_faq': has_faq,
            'internal_links': internal_links,
            'has_og_image': has_og_image,
            'noindex': 'noindex: true' in post_block,
        })

    return posts

def analyze_posts(posts: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analisa posts e gera estatísticas"""

    stats = {
        'total': len(posts),
        'readTime_7_plus': 0,
        'wordCount_1500_plus': 0,
        'with_blog_posting': 0,
        'with_faq': 0,
        'with_internal_links_3_plus': 0,
        'with_og_image': 0,
        'noindex': 0,
    }

    issues = {
        'below_7_min': [],
        'below_1500_words': [],
        'without_blog_posting': [],
        'without_faq': [],
        'without_internal_links': [],
        'without_og_image': [],
    }

    for post in posts:
        if post['readTime'] >= 7:
            stats['readTime_7_plus'] += 1
        else:
            issues['below_7_min'].append(post)

        if post['wordCount'] >= 1500:
            stats['wordCount_1500_plus'] += 1
        else:
            issues['below_1500_words'].append(post)

        if post['has_blog_posting']:
            stats['with_blog_posting'] += 1
        else:
            issues['without_blog_posting'].append(post)

        if post['has_faq']:
            stats['with_faq'] += 1
        else:
            issues['without_faq'].append(post)

        if post['internal_links'] >= 3:
            stats['with_internal_links_3_plus'] += 1
        else:
            issues['without_internal_links'].append(post)

        if post['has_og_image']:
            stats['with_og_image'] += 1
        else:
            issues['without_og_image'].append(post)

        if post['noindex']:
            stats['noindex'] += 1

    return {'stats': stats, 'issues': issues}

def print_report(posts, analysis):
    """Imprime relatório formatado"""
    stats = analysis['stats']
    issues = analysis['issues']

    print('\n📊 AUDITORIA DETALHADA ENEM PRO')
    print('=' * 50)

    print(f'\n✅ SUMÁRIO:')
    print(f'   Total de posts: {stats["total"]}')
    print(f'   Com readTime >= 7: {stats["readTime_7_plus"]}/{stats["total"]} ({100*stats["readTime_7_plus"]//stats["total"]}%)')
    print(f'   Com >= 1500 palavras: {stats["wordCount_1500_plus"]}/{stats["total"]} ({100*stats["wordCount_1500_plus"]//stats["total"]}%)')
    print(f'   Com BlogPosting schema: {stats["with_blog_posting"]}/{stats["total"]} ({100*stats["with_blog_posting"]//stats["total"]}%)')
    print(f'   Com FAQPage schema: {stats["with_faq"]}/{stats["total"]} ({100*stats["with_faq"]//stats["total"]}%)')
    print(f'   Com >= 3 internal links: {stats["with_internal_links_3_plus"]}/{stats["total"]} ({100*stats["with_internal_links_3_plus"]//stats["total"]}%)')
    print(f'   Com OG image: {stats["with_og_image"]}/{stats["total"]} ({100*stats["with_og_image"]//stats["total"]}%)')
    print(f'   Marcados noindex: {stats["noindex"]}')

    print(f'\n🔴 PROBLEMAS A CORRIGIR:')
    print(f'   Posts com readTime < 7: {len(issues["below_7_min"])}')
    print(f'   Posts com < 1500 palavras: {len(issues["below_1500_words"])}')
    print(f'   Posts sem BlogPosting: {len(issues["without_blog_posting"])}')
    print(f'   Posts sem FAQPage: {len(issues["without_faq"])}')
    print(f'   Posts sem >= 3 internal links: {len(issues["without_internal_links"])}')
    print(f'   Posts sem OG image: {len(issues["without_og_image"])}')

    # Detalhes dos principais problemas
    if issues['below_7_min']:
        print(f'\n⚠️  POSTS COM READTIME < 7 (top 10):')
        for p in issues['below_7_min'][:10]:
            print(f'   {p["slug"]}: {p["readTime"]} min')

    if issues['below_1500_words']:
        print(f'\n⚠️  POSTS COM < 1500 PALAVRAS (top 10):')
        for p in issues['below_1500_words'][:10]:
            print(f'   {p["slug"]}: {p["wordCount"]} palavras')

    if issues['without_internal_links']:
        print(f'\n⚠️  POSTS SEM >= 3 INTERNAL LINKS (top 10):')
        for p in issues['without_internal_links'][:10]:
            print(f'   {p["slug"]}: {p["internal_links"]} links')

def main():
    try:
        print('🔍 Extraindo posts...')
        posts = extract_posts_from_ts()
        print(f'✅ {len(posts)} posts encontrados\n')

        print('📊 Analisando...')
        analysis = analyze_posts(posts)

        print_report(posts, analysis)

        # Salvar em JSON
        output = {
            'timestamp': __import__('datetime').datetime.now().isoformat(),
            'posts': posts,
            'analysis': analysis,
        }

        output_path = Path(__file__).parent.parent / 'audit-results.json'
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)

        print(f'\n💾 Relatório salvo em: audit-results.json')

    except Exception as e:
        print(f'❌ Erro: {e}')
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
