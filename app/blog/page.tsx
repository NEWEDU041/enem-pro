import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts, getCategory, type BlogCategory } from '@/lib/blog-data'
import { SITE_URL } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Blog ENEM Pro — Guias, Estratégias e Gabaritos',
  description: 'Artigos sobre ENEM: estratégias de estudo, gabaritos comentados, dicas por disciplina e tudo que você precisa para passar no ENEM 2026.',
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: 'Blog ENEM Pro — Guias, Estratégias e Gabaritos',
    description: 'Artigos sobre ENEM: estratégias de estudo, gabaritos comentados, dicas por disciplina.',
    type: 'website',
  },
}

const CATEGORY_COLORS: Record<BlogCategory, string> = {
  'Gabarito':      'bg-emerald-100 text-emerald-700',
  'Questões':      'bg-indigo-100 text-indigo-700',
  'Redação':       'bg-violet-100 text-violet-700',
  'Universidades': 'bg-amber-100 text-amber-700',
  'Por Matéria':   'bg-sky-100 text-sky-700',
  'Estratégias':   'bg-rose-100 text-rose-700',
  'Como Funciona': 'bg-zinc-100 text-zinc-700',
  'Planejamento':  'bg-teal-100 text-teal-700',
  'Comparativos':  'bg-orange-100 text-orange-700',
}

const ALL_CATEGORIES: BlogCategory[] = [
  'Gabarito', 'Questões', 'Redação', 'Universidades',
  'Por Matéria', 'Estratégias', 'Como Funciona', 'Planejamento', 'Comparativos',
]

const POST_ICON: Record<BlogCategory, string> = {
  'Gabarito': '📋', 'Questões': '📝', 'Redação': '✍️',
  'Universidades': '🎓', 'Por Matéria': '📚', 'Estratégias': '🎯',
  'Como Funciona': '🔍', 'Planejamento': '📅', 'Comparativos': '⚖️',
}

const FEATURED_SLUG = 'gabarito-enem-2024'

export default function BlogPage() {
  const posts = getAllPosts()
  const featuredPost = posts.find(p => p.slug === FEATURED_SLUG) ?? posts[0]
  const restPosts = posts.filter(p => p.slug !== featuredPost.slug)

  const countByCategory = ALL_CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = posts.filter(p => getCategory(p.slug) === cat).length
    return acc
  }, {})

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Blog ENEM Pro',
    description: 'Artigos sobre ENEM: gabaritos, questões, redação, dicas e estratégias.',
    url: `${SITE_URL}/blog`,
    publisher: { '@type': 'EducationalOrganization', name: 'ENEM Pro', url: SITE_URL },
    blogPost: posts.slice(0, 10).map(p => ({
      '@type': 'BlogPosting',
      headline: p.title,
      description: p.description,
      url: `${SITE_URL}/blog/${p.slug}`,
      datePublished: p.date,
    })),
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ENEM Pro', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
    ],
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <header className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-indigo-600">ENEM Pro</Link>
          <nav aria-label="Navegação principal" className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-zinc-600 hover:text-zinc-900">Entrar</Link>
            <Link href="/auth/register" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              Começar grátis
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content">
        {/* Hero */}
        <section className="bg-white border-b border-zinc-100 px-6 py-14">
          <div className="max-w-5xl mx-auto">
            <nav aria-label="Breadcrumb" className="text-xs text-zinc-500 mb-6 flex items-center gap-1.5">
              <Link href="/" className="hover:text-indigo-600 transition-colors">Início</Link>
              <span aria-hidden="true">/</span>
              <span className="text-zinc-900 font-medium">Blog</span>
            </nav>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-4xl font-bold text-zinc-900 mb-2">Blog ENEM Pro</h1>
                <p className="text-zinc-600 text-lg max-w-xl">Guias, gabaritos e estratégias para passar no ENEM 2026.</p>
              </div>
              <div className="flex items-center gap-6 text-center shrink-0">
                <div>
                  <p className="text-2xl font-bold text-indigo-600">{posts.length}</p>
                  <p className="text-xs text-zinc-500">artigos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-indigo-600">{ALL_CATEGORIES.length}</p>
                  <p className="text-xs text-zinc-500">categorias</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2" role="list" aria-label="Categorias do blog">
              {ALL_CATEGORIES.filter(c => (countByCategory[c] ?? 0) > 0).map(cat => (
                <Link
                  key={cat}
                  href={`#cat-${cat.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
                  role="listitem"
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity ${CATEGORY_COLORS[cat]}`}
                >
                  {POST_ICON[cat]} {cat}
                  <span className="opacity-60">({countByCategory[cat]})</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Destaque */}
        {featuredPost && (
          <section className="px-6 py-10 bg-white border-b border-zinc-100">
            <div className="max-w-5xl mx-auto">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4">Destaque</p>
              <Link
                href={`/blog/${featuredPost.slug}`}
                aria-label={`Ler artigo em destaque: ${featuredPost.title}`}
                className="group block bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-2xl p-8 md:p-10 hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-200"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex-1">
                    <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4 bg-white/20 text-white">
                      {getCategory(featuredPost.slug)}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold mb-3 leading-tight group-hover:underline decoration-white/50">
                      {featuredPost.title}
                    </h2>
                    <p className="text-indigo-200 leading-relaxed mb-4 max-w-2xl">{featuredPost.description}</p>
                    <div className="flex items-center gap-3 text-xs text-indigo-300">
                      <time dateTime={featuredPost.date}>
                        {new Date(featuredPost.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </time>
                      <span aria-hidden="true">·</span>
                      <span>{featuredPost.readTime} min de leitura</span>
                    </div>
                  </div>
                  <div aria-hidden="true" className="shrink-0 hidden md:flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 text-4xl">
                    {POST_ICON[getCategory(featuredPost.slug)]}
                  </div>
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* Categorias com posts */}
        {ALL_CATEGORIES.filter(cat => (countByCategory[cat] ?? 0) > 0).map(cat => {
          const allCatPosts = restPosts.filter(p => getCategory(p.slug) === cat)
          const catPosts = allCatPosts.slice(0, 9)
          if (catPosts.length === 0) return null
          const hasMore = allCatPosts.length > 9
          return (
            <section key={cat} id={`cat-${cat.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`} className="px-6 py-10 border-b border-zinc-100">
              <div className="max-w-5xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                  <span aria-hidden="true" className="text-2xl">{POST_ICON[cat]}</span>
                  <h2 className="text-lg font-bold text-zinc-900">{cat}</h2>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[cat]}`}>
                    {countByCategory[cat]} artigos
                  </span>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {catPosts.map(post => (
                    <Link
                      key={post.slug}
                      href={`/blog/${post.slug}`}
                      aria-label={`Ler: ${post.title}`}
                      className="group bg-white rounded-2xl border border-zinc-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col"
                    >
                      <h3 className="font-bold text-zinc-900 text-sm leading-snug mb-2 flex-1 group-hover:text-indigo-700 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 mb-3">{post.description}</p>
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-100">
                        <time dateTime={post.date} className="text-xs text-zinc-400">
                          {new Date(post.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </time>
                        <span className="text-xs font-medium text-indigo-600 group-hover:underline" aria-hidden="true">
                          {post.readTime} min →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
                {hasMore && (
                  <div className="mt-6 text-sm text-zinc-500 text-center">
                    + {allCatPosts.length - 9} artigos em <strong>{cat}</strong> — use o filtro de categorias acima para ver todos
                  </div>
                )}
              </div>
            </section>
          )
        })}

        {/* CTA */}
        <section className="px-6 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="bg-indigo-600 text-white rounded-2xl px-8 py-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Pratique com questões reais</h2>
              <p className="text-indigo-200 mb-6 text-sm">Leitura é ótimo. Prática é o que aprova. 10 questões/dia grátis.</p>
              <Link href="/auth/register" className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors">
                Criar conta grátis
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-zinc-900 text-zinc-400 text-sm py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between gap-2">
          <p>© 2026 ENEM Pro — Questões reais do ENEM com explicação por IA</p>
          <nav aria-label="Links do rodapé" className="flex gap-4">
            <Link href="/gabarito" className="hover:text-white transition-colors">Gabarito ENEM</Link>
            <Link href="/calcular-nota" className="hover:text-white transition-colors">Calcular nota</Link>
            <Link href="/planos" className="hover:text-white transition-colors">Planos</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
