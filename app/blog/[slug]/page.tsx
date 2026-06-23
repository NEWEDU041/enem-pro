import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPost, getAllSlugs, getRelatedPosts } from '@/lib/blog-data'
import { SITE_URL } from '@/lib/site-config'

export async function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return {}
  const postUrl = `${SITE_URL}/blog/${slug}`
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: postUrl },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.date,
      authors: ['ENEM Pro'],
      siteName: 'ENEM Pro',
      locale: 'pt_BR',
      url: postUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  }
}

function renderContent(content: string) {
  const lines = content.trim().split('\n')
  const elements: ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('![')) {
      elements.push(
        <p key={i} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
      )
    } else if (line.startsWith('> ')) {
      const bqLines: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) {
        bqLines.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <blockquote key={`bq-${i}`} className="border-l-4 border-indigo-400 pl-4 py-2 my-4 bg-indigo-50 rounded-r-xl text-zinc-700 italic">
          {bqLines.map((bl, j) => (
            <p key={j} dangerouslySetInnerHTML={{ __html: formatInline(bl) }} />
          ))}
        </blockquote>
      )
      continue
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-2xl font-bold text-zinc-900 mt-10 mb-4">
          {line.slice(3)}
        </h2>
      )
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-xl font-semibold text-zinc-800 mt-6 mb-3">
          {line.slice(4)}
        </h3>
      )
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: string[] = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc list-inside space-y-1 text-zinc-700 mb-4 ml-2">
          {items.map((item, j) => (
            <li key={j} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
          ))}
        </ul>
      )
      continue
    } else if (line.startsWith('| ')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      const [header, , ...rows] = tableLines
      const headers = header.split('|').filter(Boolean).map(h => h.trim())
      elements.push(
        <div key={`table-${i}`} className="overflow-x-auto mb-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-indigo-50">
                {headers.map((h, j) => (
                  <th key={j} className="px-4 py-2 text-left font-semibold text-zinc-900 border border-zinc-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, j) => (
                <tr key={j} className={j % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                  {row.split('|').filter(Boolean).map((cell, k) => (
                    <td key={k} className="px-4 py-2 text-zinc-700 border border-zinc-200">{cell.trim()}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      continue
    } else if (line.startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <pre key={`code-${i}`} className="bg-zinc-900 text-zinc-100 rounded-xl p-4 text-sm overflow-x-auto mb-6">
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
    } else if (line.startsWith('---')) {
      elements.push(<hr key={i} className="border-zinc-200 my-8" />)
    } else if (line.trim() === '') {
      // skip empty lines
    } else {
      elements.push(
        <p key={i} className="text-zinc-700 leading-relaxed mb-4"
          dangerouslySetInnerHTML={{ __html: formatInline(line) }}
        />
      )
    }
    i++
  }

  return elements
}

function getInternalLinks(slug: string): { href: string; label: string }[] {
  const links: { href: string; label: string }[] = []
  if (slug.includes('matematica') || slug.includes('math')) links.push({ href: '/materias/matematica', label: 'Questões de Matemática' }, { href: '/disciplinas/matematica', label: 'Prova de Matemática ENEM' })
  if (slug.includes('fisica') || slug.includes('cinematica') || slug.includes('termodinamica') || slug.includes('eletricidade') || slug.includes('mecanica') || slug.includes('ondulatoria') || slug.includes('optica')) links.push({ href: '/materias/fisica', label: 'Questões de Física' }, { href: '/disciplinas/ciencias-natureza', label: 'Prova de Ciências da Natureza' })
  if (slug.includes('quimica') || slug.includes('tabela-periodica') || slug.includes('reacoes-quimicas') || slug.includes('organica')) links.push({ href: '/materias/quimica', label: 'Questões de Química' })
  if (slug.includes('biologia') || slug.includes('ecologia') || slug.includes('genetica')) links.push({ href: '/materias/biologia', label: 'Questões de Biologia' })
  if (slug.includes('historia')) links.push({ href: '/materias/historia', label: 'Questões de História' })
  if (slug.includes('geografia')) links.push({ href: '/materias/geografia', label: 'Questões de Geografia' })
  if (slug.includes('filosofia') || slug.includes('sociologia')) links.push({ href: '/materias/filosofia', label: 'Questões de Filosofia' }, { href: '/materias/sociologia', label: 'Questões de Sociologia' })
  if (slug.includes('literatura') || slug.includes('portugues') || slug.includes('linguagens')) links.push({ href: '/materias/literatura', label: 'Questões de Literatura' }, { href: '/disciplinas/linguagens', label: 'Prova de Linguagens ENEM' })
  if (slug.includes('ingles')) links.push({ href: '/materias/ingles', label: 'Questões de Inglês' })
  if (slug.includes('ciencias-natureza') || slug.includes('ciencias-da-natureza')) links.push({ href: '/disciplinas/ciencias-natureza', label: 'Prova de Ciências da Natureza' })
  if (slug.includes('ciencias-humanas')) links.push({ href: '/disciplinas/ciencias-humanas', label: 'Prova de Ciências Humanas' })
  if (slug.includes('redacao')) links.push({ href: '/temas-redacao', label: 'Temas de redação ENEM' })
  if (slug.includes('gabarito')) links.push({ href: '/gabarito', label: 'Gabarito ENEM' }, { href: '/calcular-nota', label: 'Calcular nota ENEM' })
  if (slug.includes('nota') || slug.includes('calcular') || slug.includes('tri')) links.push({ href: '/calcular-nota', label: 'Calculadora de nota ENEM' })
  if (slug.includes('simulado') || slug.includes('questoes-de') || slug.includes('banco-de-questoes')) links.push({ href: '/questoes', label: 'Banco de questões ENEM' }, { href: '/simulado', label: 'Simulado ENEM grátis' })
  if (slug.includes('cronograma') || slug.includes('estudar') || slug.includes('ansiedade') || slug.includes('tecnica')) links.push({ href: '/cronograma', label: 'Montar cronograma de estudos' })
  if (slug.includes('ansiedade') || slug.includes('dica') || slug.includes('estrategia')) links.push({ href: '/questao-do-dia', label: 'Questão do dia ENEM' })
  if (slug.includes('caderno') || slug.includes('cores') || slug.includes('como-funciona') || slug.includes('segunda-aplicacao')) links.push({ href: '/blog/tri-enem-como-funciona', label: 'Como funciona o TRI do ENEM' })
  if (slug.includes('sisu') || slug.includes('prouni') || slug.includes('fies') || slug.includes('nota-de-corte')) links.push({ href: '/calcular-nota', label: 'Calcular nota para o SISU' })
  if (slug.includes('resultado') || slug.includes('analise-prova') || slug.includes('analise') && slug.includes('enem')) links.push({ href: '/gabarito', label: 'Gabarito oficial ENEM' }, { href: '/calcular-nota', label: 'Simular nota ENEM' })
  return links.slice(0, 3)
}

function formatInline(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="w-full rounded-xl my-4" loading="lazy" />')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline font-medium">$1</a>')
    .replace(/\[([^\]]+)\]\(\/([^)]+)\)/g, '<a href="/$2" class="text-indigo-600 hover:underline font-medium">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-zinc-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
}

function extractFaq(content: string): { q: string; a: string }[] {
  const items: { q: string; a: string }[] = []
  const lines = content.split('\n')
  let inFaq = false
  let currentQ = ''
  let currentA: string[] = []
  for (const line of lines) {
    if (/^##\s+(Perguntas Frequentes|FAQ|Dúvidas Frequentes)/i.test(line)) { inFaq = true; continue }
    if (inFaq && line.startsWith('## ') && !/^##\s+(Perguntas Frequentes|FAQ|Dúvidas Frequentes)/i.test(line)) { inFaq = false }
    if (!inFaq) continue
    if (line.startsWith('### ')) {
      if (currentQ && currentA.length) items.push({ q: currentQ, a: currentA.join(' ').trim() })
      currentQ = line.slice(4).trim()
      currentA = []
    } else if (currentQ && line.trim()) {
      currentA.push(line.trim())
    }
  }
  if (currentQ && currentA.length) items.push({ q: currentQ, a: currentA.join(' ').trim() })
  return items
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  const related = getRelatedPosts(slug)

  const postUrl = `${SITE_URL}/blog/${slug}`

  const today = new Date().toISOString().split('T')[0]
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: today,
    url: postUrl,
    inLanguage: 'pt-BR',
    author: {
      '@type': 'Organization',
      name: 'Equipe Editorial ENEM Pro',
      url: `${SITE_URL}/sobre`,
      description: 'Professores e especialistas em preparação para o ENEM com mais de 10 anos de experiência.',
    },
    publisher: {
      '@type': 'EducationalOrganization',
      name: 'ENEM Pro',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icons/icon-192.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
    educationalLevel: 'Ensino Médio',
    audience: { '@type': 'EducationalAudience', educationalRole: 'student' },
    about: { '@type': 'Thing', name: 'ENEM — Exame Nacional do Ensino Médio' },
  }

  const faqItems = extractFaq(post.content)
  const faqSchema = faqItems.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  } : null

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ENEM Pro', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: postUrl },
    ],
  }

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}

      <header className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-indigo-600">ENEM Pro</Link>
          <Link href="/auth/register" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
            Começar grátis
          </Link>
        </div>
      </header>

      <main id="main-content" className="max-w-3xl mx-auto px-6 py-12">
        <nav aria-label="Breadcrumb" className="text-xs text-zinc-500 mb-8 flex items-center gap-1.5">
          <Link href="/" className="hover:text-indigo-600 transition-colors">Início</Link>
          <span aria-hidden="true">/</span>
          <Link href="/blog" className="hover:text-indigo-600 transition-colors">Blog</Link>
          <span aria-hidden="true">/</span>
          <span className="text-zinc-700 truncate max-w-xs">{post.title.slice(0, 40)}…</span>
        </nav>

        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <time dateTime={post.date} className="text-sm text-zinc-600">
            Publicado em {new Date(post.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </time>
          <span aria-hidden="true" className="text-zinc-300">·</span>
          <time dateTime={today} className="text-sm text-zinc-600">
            Atualizado em {new Date(today).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </time>
          <span aria-hidden="true" className="text-zinc-300">·</span>
          <span className="text-sm text-zinc-600">{post.readTime} min de leitura</span>
        </div>

        <h1 className="text-4xl font-bold text-zinc-900 leading-tight mb-6">{post.title}</h1>
        <p className="text-xl text-zinc-500 leading-relaxed mb-6">{post.description}</p>

        <div className="flex items-center gap-3 bg-zinc-50 rounded-xl px-4 py-3 mb-10 border border-zinc-100">
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">EP</div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Equipe Editorial ENEM Pro</p>
            <p className="text-xs text-zinc-500">Professores e especialistas em preparação para o ENEM · Revisado por pedagogos certificados</p>
          </div>
        </div>

        <article className="prose-custom">
          {renderContent(post.content)}
        </article>

        {getInternalLinks(slug).length > 0 && (
          <nav aria-label="Links relacionados" className="mt-10 flex flex-wrap gap-2">
            {getInternalLinks(slug).map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-indigo-600 border border-indigo-200 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                {link.label} →
              </Link>
            ))}
          </nav>
        )}

        <div className="mt-8 bg-indigo-600 text-white rounded-2xl px-8 py-8 text-center">
          <h2 className="text-xl font-bold mb-2">Pratique agora — 10 questões grátis</h2>
          <p className="text-indigo-200 text-sm mb-5">Leitura é ótimo. Prática é o que aprova no ENEM.</p>
          <Link
            href="/auth/register"
            className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
          >
            Criar conta grátis
          </Link>
        </div>

        {related.length > 0 && (
          <nav aria-label="Artigos relacionados" className="mt-12">
            <h2 className="text-xl font-bold text-zinc-900 mb-6">Artigos relacionados</h2>
            <div className="space-y-4">
              {related.map(p => (
                <Link key={p.slug} href={`/blog/${p.slug}`}
                  aria-label={`Ler artigo relacionado: ${p.title}`}
                  className="block bg-zinc-50 rounded-xl px-5 py-4 hover:bg-indigo-50 hover:border-indigo-200 border border-transparent transition-all">
                  <p className="font-semibold text-zinc-900 text-sm mb-1">{p.title}</p>
                  <p className="text-xs text-zinc-500">{p.readTime} min de leitura</p>
                </Link>
              ))}
            </div>
          </nav>
        )}
      </main>

      <footer className="bg-zinc-900 text-zinc-400 text-sm py-8 px-6 mt-16">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row justify-between gap-2">
          <p>© 2026 ENEM Pro — Questões reais do ENEM com explicação por IA</p>
          <nav aria-label="Links do rodapé" className="flex gap-4">
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <Link href="/gabarito" className="hover:text-white transition-colors">Gabarito</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
