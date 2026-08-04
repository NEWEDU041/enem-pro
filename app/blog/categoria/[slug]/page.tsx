import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllPostsLight as getAllPosts } from '@/lib/blog-index'
import { SITE_URL } from '@/lib/site-config'
import { ALL_CATEGORIES, CATEGORY_COLORS, POST_ICON, CATEGORY_TO_SLUG, SLUG_TO_CATEGORY } from '@/lib/blog-categories'

export const revalidate = 86400

export async function generateStaticParams() {
  return ALL_CATEGORIES.map((cat) => ({ slug: CATEGORY_TO_SLUG[cat] }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const category = SLUG_TO_CATEGORY[slug]
  if (!category) return {}
  const count = getAllPosts().filter((p) => p.category === category).length
  return {
    title: `${category} — ${count} Artigos | Blog ENEM Pro`,
    description: `Todos os artigos sobre ${category} do Blog ENEM Pro: guias, dicas e estratégias para o ENEM 2026.`,
    alternates: { canonical: `${SITE_URL}/blog/categoria/${slug}` },
  }
}

export default async function CategoriaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const category = SLUG_TO_CATEGORY[slug]
  if (!category) notFound()

  const posts = getAllPosts()
    .filter((p) => p.category === category)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ENEM Pro', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: category, item: `${SITE_URL}/blog/categoria/${slug}` },
    ],
  }

  return (
    <div className="min-h-screen bg-zinc-50">
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
        <section className="bg-white border-b border-zinc-100 px-6 py-10">
          <div className="max-w-5xl mx-auto">
            <nav aria-label="Breadcrumb" className="text-xs text-zinc-500 mb-6 flex items-center gap-1.5">
              <Link href="/" className="hover:text-indigo-600 transition-colors">Início</Link>
              <span aria-hidden="true">/</span>
              <Link href="/blog" className="hover:text-indigo-600 transition-colors">Blog</Link>
              <span aria-hidden="true">/</span>
              <span className="text-zinc-900 font-medium">{category}</span>
            </nav>
            <div className="flex items-center gap-3 mb-2">
              <span aria-hidden="true" className="text-3xl">{POST_ICON[category]}</span>
              <h1 className="text-3xl font-bold text-zinc-900">{category}</h1>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[category]}`}>
                {posts.length} artigos
              </span>
            </div>
            <p className="text-zinc-600">Todos os artigos de {category.toLowerCase()} do Blog ENEM Pro.</p>
          </div>
        </section>

        <section className="px-6 py-10">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group bg-white rounded-2xl border border-zinc-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col"
                >
                  <h2 className="font-bold text-zinc-900 text-sm leading-snug mb-2 flex-1 group-hover:text-indigo-700 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 mb-3">{post.description}</p>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-100">
                    <time dateTime={post.date} className="text-xs text-zinc-500">
                      {new Date(post.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </time>
                    <span className="text-xs font-medium text-indigo-600 group-hover:underline" aria-hidden="true">
                      {post.readTime} min →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="bg-indigo-600 text-white rounded-2xl px-8 py-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Pratique com questões reais</h2>
              <p className="text-indigo-100 mb-6 text-sm">Leitura é ótimo. Prática é o que aprova. 10 questões/dia grátis.</p>
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
