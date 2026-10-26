import re

# Ler o arquivo
with open('lib/blog-data.ts', 'r', encoding='utf-8') as f:
    content = f.read()

original_size = len(content)
stats = {'removed_count': 0, 'char_removed': 0}

# Lista de padrões a remover (false authority claims)
patterns = [
    r'> Com base em anos acompanhando o processo seletivo do ENEM, as informações apresentadas aqui refletem os dados mais atualizados\.\n\n',
    r'> Segundo acompanhamento de nossa equipe pedagógica, as informações sobre quando sai resultado enem refletem os dados mais recentes disponíveis\.\n\n',
    r'> Com base em nossa análise dos dados do INEP, as informações sobre quando sai resultado enem refletem os dados mais recentes disponíveis\.\n\n',
    r'> De acordo com dados que nossa equipe monitorou junto ao INEP, as informações apresentadas aqui refletem os dados mais atualizados\.\n\n',
    r'> Com base em anos acompanhando o ENEM, nossa equipe compilou estas informações diretamente das divulgações oficiais do INEP\.\n\n',
]

for pattern in patterns:
    count = len(re.findall(pattern, content))
    if count > 0:
        content = re.sub(pattern, '', content)
        stats['removed_count'] += count

# Substituição de "Analisamos" por "Ao comparar"
old_phrase = 'Analisamos 8 apps populares de preparação ENEM'
new_phrase = 'Ao comparar 8 apps populares de preparação ENEM'
if old_phrase in content:
    content = content.replace(old_phrase, new_phrase)
    stats['replaced_claim'] = 1

final_size = len(content)
chars_removed = original_size - final_size

# Salvar arquivo
with open('lib/blog-data.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"✅ AUDITORIA E LIMPEZA CONCLUÍDA")
print(f"{'='*70}")
print(f"Trechos false authority removidos: {stats['removed_count']}")
print(f"Caracteres removidos: {chars_removed:,}")
print(f"Tamanho original: {original_size:,} bytes")
print(f"Tamanho final: {final_size:,} bytes")
print(f"{'='*70}")
print(f"✅ Arquivo salvo em lib/blog-data.ts")
