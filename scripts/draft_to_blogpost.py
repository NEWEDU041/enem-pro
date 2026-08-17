#!/usr/bin/env python3
"""
Converte drafts (.blog-memory/drafts/*/article.md) para formato blog-data.ts
"""

import os
import json
import re
from pathlib import Path
from datetime import datetime

BASE_DIR = Path("/root/projetos/enem-pro")
DRAFTS_DIR = BASE_DIR / ".blog-memory" / "drafts"
BLOG_DATA_PATH = BASE_DIR / "lib" / "blog-data.ts"
BLOG_INDEX_PATH = BASE_DIR / "lib" / "blog-index.json"

def slugify(text: str) -> str:
    text = text.lower()
    text = text.encode('ascii', 'ignore').decode('ascii')
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def infer_category(slug: str, title: str) -> str:
    slug_lower = slug.lower()
    title_lower = title.lower()

    if any(kw in slug_lower for kw in ['gabarito', 'nota-de-corte', 'resultado']):
        return 'Gabarito'
    if any(kw in slug_lower for kw in ['redacao', 'repertorio', 'tema-enem']):
        return 'Redação'
    if any(kw in slug_lower for kw in ['sisu', 'prouni', 'universidade', 'vagas', 'carreira', 'ead']):
        return 'Universidades'
    if any(kw in slug_lower for kw in ['matematica', 'fisica', 'quimica', 'biologia', 'historia', 
                                        'geografia', 'filosofia', 'sociologia', 'portugues', 
                                        'literatura', 'ingles']):
        return 'Por Matéria'
    if any(kw in slug_lower for kw in ['estrategia', 'como-estudar', 'active-recall', 
                                        'memorizar', 'tempo', 'ansiedade']):
        return 'Estratégias'
    if any(kw in slug_lower for kw in ['tri', 'como-calcular', 'como-funciona', 'entender']):
        return 'Como Funciona'
    if any(kw in slug_lower for kw in ['cronograma', 'planejamento', 'revisao', 'checklist', 
                                        'preparar', 'ultimo-mes', '60-dias']):
        return 'Planejamento'
    if any(kw in slug_lower for kw in ['comparativo', 'comparacao', '-vs-', '-ou-']):
        return 'Comparativos'
    if any(kw in slug_lower for kw in ['questao', 'simulado', 'banco-de-questoes']):
        return 'Questões'

    return 'Estratégias'

def extract_read_time(content: str, frontmatter_read_time: int) -> int:
    words = len(content.split())
    calculated = max(1, (words + 199) // 200)
    return max(frontmatter_read_time, calculated)

def parse_frontmatter(content: str):
    if not content.startswith('---'):
        return {}, content
    
    parts = content.split('---', 2)
    if len(parts) < 3:
        return {}, content
    
    fm_text = parts[1].strip()
    body = parts[2].strip()
    
    data = {}
    for line in fm_text.split('\n'):
        if ':' in line:
            key, val = line.split(':', 1)
            key = key.strip()
            val = val.strip().strip('"\'')
            data[key] = val
    
    if 'readTime' in data:
        # Handle "7 min" or "7"
        read_time_str = data['readTime']
        if isinstance(read_time_str, str):
            # Extract just the number
            match = re.search(r'(\d+)', read_time_str)
            if match:
                data['readTime'] = int(match.group(1))
            else:
                data['readTime'] = 5
        else:
            data['readTime'] = int(read_time_str)
    if 'preload_fonts' in data:
        data['preload_fonts'] = data['preload_fonts'].lower() == 'true'
    
    return data, body

def process_drafts():
    folders = [d for d in DRAFTS_DIR.iterdir() if d.is_dir()]
    print(f"Encontrados {len(folders)} drafts")

    posts = []

    for folder in folders:
        article_path = folder / "article.md"
        if not article_path.exists():
            continue

        raw = article_path.read_text(encoding='utf-8')
        fm, content = parse_frontmatter(raw)

        if not fm.get('slug') or not fm.get('title'):
            print(f"AVISO: Draft sem slug/title: {folder.name}")
            continue

        read_time = extract_read_time(content, fm.get('readTime', 5))
        category = fm.get('category') or infer_category(fm['slug'], fm['title'])

        post = {
            'slug': fm['slug'],
            'title': fm['title'],
            'description': fm.get('metaDescription', content[:160].replace('#', '').replace('*', '').replace('`', '').strip()),
            'date': fm.get('publishDate') or fm.get('lastUpdated') or '2026-01-01',
            'readTime': read_time,
            'content': content.strip(),
            'noindex': False,
            'category': category
        }

        posts.append(post)
        print(f"OK: {fm['slug']} ({category}, {read_time}min)")

    return posts

def escape_js_string(s: str) -> str:
    return s.replace('\\', '\\\\').replace('`', '\\`').replace('"', '\\"').replace('\n', '\\n')

def generate_blog_data_ts(posts):
    header = f"""// Auto-gerado em {datetime.now().isoformat()}
// NAO EDITE MANUALMENTE — rode: python scripts/draft_to_blogpost.py

import type {{ BlogCategory }} from "./blog-data-types";

export interface BlogPost {{
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: number;
  content: string;
  cover_url?: string;
  noindex?: boolean;
  category: BlogCategory;
}}

export const BLOG_POSTS: BlogPost[] = [
"""

    posts_code = []
    for p in posts:
        posts_code.append(f'''  {{
    slug: "{p['slug']}",
    title: "{escape_js_string(p['title'])}",
    description: "{escape_js_string(p['description'])}",
    date: "{p['date']}",
    readTime: {p['readTime']},
    content: `{escape_js_string(p['content'])}`,
    noindex: {str(p['noindex']).lower()},
    category: "{p['category']}"
  }}''')

    footer = """
]

export function getAllPosts() {
  return BLOG_POSTS;
}

export function getPostBySlug(slug) {
  return BLOG_POSTS.find(p => p.slug === slug);
}
"""

    return header + ",\n".join(posts_code) + footer

def main():
    print("Convertendo drafts para blog-data.ts...\n")

    posts = process_drafts()
    print(f"\nTotal: {len(posts)} posts convertidos")

    ts_code = generate_blog_data_ts(posts)
    BLOG_DATA_PATH.write_text(ts_code, encoding='utf-8')
    print(f"Escrito em {BLOG_DATA_PATH}")

    index_data = [{
        'slug': p['slug'],
        'title': p['title'],
        'description': p['description'],
        'date': p['date'],
        'readTime': p['readTime'],
        'category': p['category']
    } for p in posts]
    BLOG_INDEX_PATH.write_text(json.dumps(index_data, indent=2, ensure_ascii=False))
    print(f"blog-index.json atualizado ({len(index_data)} posts)")

if __name__ == "__main__":
    main()