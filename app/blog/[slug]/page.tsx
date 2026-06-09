import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPost, getAllSlugs, getAllPosts } from '@/lib/blog-data'
import { SITE_URL } from '@/lib/site-config'

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `${SITE_URL}/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
    },
  }
}

function renderContent(content: string) {
  const lines = content.trim().split('\n')
  const elements: ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('## ')) {
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

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-zinc-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  const related = getAllPosts().filter(p => p.slug !== slug).slice(0, 3)

  const postUrl = `${SITE_URL}/blog/${slug}`

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    url: postUrl,
    inLanguage: 'pt-BR',
    author: { '@type': 'Organization', name: 'ENEM Pro', url: SITE_URL },
    publisher: { '@type': 'EducationalOrganization', name: 'ENEM Pro', url: SITE_URL },
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
  }

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

        <div className="flex items-center gap-3 mb-6">
          <time dateTime={post.date} className="text-sm text-zinc-600">
            {new Date(post.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </time>
          <span aria-hidden="true" className="text-zinc-300">·</span>
          <span className="text-sm text-zinc-600">{post.readTime} min de leitura</span>
        </div>

        <h1 className="text-4xl font-bold text-zinc-900 leading-tight mb-6">{post.title}</h1>
        <p className="text-xl text-zinc-500 leading-relaxed mb-10 pb-8 border-b border-zinc-100">{post.description}</p>

        <article className="prose-custom">
          {renderContent(post.content)}
        </article>

        <div className="mt-12 bg-indigo-600 text-white rounded-2xl px-8 py-8 text-center">
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
