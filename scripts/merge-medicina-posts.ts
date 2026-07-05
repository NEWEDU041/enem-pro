import * as fs from 'fs'
import * as path from 'path'

function parseFrontmatter(raw: string): { data: Record<string, string>; content: string } {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) return { data: {}, content: raw }
  const data: Record<string, string> = {}
  for (const line of m[1].split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let val = line.slice(idx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    data[key] = val
  }
  return { data, content: m[2] }
}

function main() {
  const mdPath = path.join(__dirname, '../app/blog/posts/como-passar-medicina-federal-enem.md')
  const raw = fs.readFileSync(mdPath, 'utf8')
  const { data: mdData, content: mdContent } = parseFrontmatter(raw)

  const blogDataPath = path.join(__dirname, '../lib/blog-data.ts')
  let blogData = fs.readFileSync(blogDataPath, 'utf8')

  // Replace the weak stub with the rich markdown content
  // Target: the post object starting with slug: 'como-passar-em-medicina-federal-no-enem'
  // We'll escape the markdown properly for JavaScript backticks
  const escapedContent = mdContent.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')

  // Find the old post's end by looking for the next },
  // This is a bit fragile but should work
  const oldPostRegex = /\{\s*slug:\s*'como-passar-em-medicina-federal-no-enem'[^}]+content:\s*`[^`]*`[^}]*\}/
  const replacement = `{ slug: 'como-passar-em-medicina-federal-no-enem', title: ${JSON.stringify(mdData.title)}, description: ${JSON.stringify(mdData.description)}, date: '${mdData.date}', readTime: ${Math.ceil(mdContent.split(/\s+/).length / 200)}, content: \`${escapedContent}\` }`

  if (oldPostRegex.test(blogData)) {
    blogData = blogData.replace(oldPostRegex, replacement)
    fs.writeFileSync(blogDataPath, blogData)
    console.log('✅ Post fundido com sucesso. Removendo os 9 .md órfãos.')

    // Remove the shadowed markdown files
    const mdDir = path.join(__dirname, '../app/blog/posts')
    const shadowed = [
      'como-calcular-nota-enem-formula-tri.md',
      'como-resolver-questoes-fisica-cinematica.md',
      'cronograma-3-meses-estudos-enem.md',
      'dicas-melhorar-redacao-enem-score.md',
      'nota-corte-medicina-federal-2025.md',
      'preparacao-segunda-aplicacao-enem-2026.md',
      'questoes-biologia-que-mais-caem-enem.md',
      'questoes-historia-que-mais-caem.md',
      'simulado-enem-online-completo-gratis.md',
    ]

    for (const file of shadowed) {
      try {
        fs.unlinkSync(path.join(mdDir, file))
        console.log(`  ✓ removido ${file}`)
      } catch (e) {
        console.log(`  ✗ erro ao remover ${file}: ${e}`)
      }
    }
  } else {
    console.error('❌ Padrão não encontrado no blog-data.ts — verificar manualmente')
    process.exit(1)
  }
}

main()
