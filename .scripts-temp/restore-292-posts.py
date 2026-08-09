#!/usr/bin/env python3
"""Restaurar 292 posts do backup git"""

import json
import re
from pathlib import Path

# Ler arquivo de backup
backup_file = Path('blog-data-292posts-backup.ts')
content = backup_file.read_text(encoding='utf-8')

# Extrair array BLOG_POSTS usando regex
# Procura por { slug: '...' até o próximo {
pattern = r'\{\s*slug:\s*[\'"]([^\'"]*)[\'"],\s*title:\s*[\'"]([^\'"]*)[\'"],\s*description:\s*[\'"]([^\'"]*)[\'"],\s*date:\s*[\'"]([^\'"]*)[\'"],\s*readTime:\s*(\d+),\s*content:\s*`([^`]*)`\s*\}'

matches = re.findall(pattern, content, re.DOTALL)
print(f"Posts extraídos: {len(matches)}")

if len(matches) == 0:
    print("❌ Nenhum post encontrado com regex. Tentando parsing alternativo...")
    # Tenta extraction mais flexível
    lines = content.split('\n')
    posts = []
    current_post = None

    for line in lines:
        if "slug: '" in line:
            if current_post:
                posts.append(current_post)
            current_post = {}

        if current_post is not None:
            if "slug: '" in line:
                current_post['slug'] = re.search(r"slug: ['\"]([^'\"]*)['\"]", line).group(1)
            elif "title: '" in line:
                current_post['title'] = re.search(r"title: ['\"]([^'\"]*)['\"]", line).group(1)

    if len(posts) > 0:
        print(f"Posts extraídos (método alternativo): {len(posts)}")
        matches = posts
else:
    print(f"✅ {len(matches)} posts extraídos com sucesso")

    # Converter para estrutura
    posts_dict = {}
    for slug, title, description, date, readtime, content_text in matches:
        posts_dict[slug] = {
            'slug': slug,
            'title': title,
            'description': description,
            'date': date,
            'readTime': int(readtime),
            'content': content_text.strip()
        }

    # Salvar JSON
    output_file = Path('restored-292-posts.json')
    output_file.write_text(json.dumps(posts_dict, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f"✅ Salvo em: {output_file}")

    # Listar alguns posts
    print("\nPrimeiros 5 posts:")
    for i, (slug, data) in enumerate(list(posts_dict.items())[:5]):
        print(f"  {i+1}. {slug}: {data['title'][:50]}...")
