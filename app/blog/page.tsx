import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts } from '@/lib/blog-data'

export const metadata: Metadata = {
  title: 'Blog ENEM Pro — Guias, Estratégias e Gabaritos',
  description: 'Artigos sobre ENEM: estratégias de estudo, gabaritos comentados, dicas por disciplina e tudo que você precisa para passar no ENEM 2026.',
  alternates: { canonical: 'https://enem-pro-eight.vercel.app/blog' },
}

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-indigo-600">ENEM Pro</Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-zinc-500 hover:text-zinc-900">Entrar</Link>
            <Link href="/auth/register" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-zinc-900 mb-3">Blog ENEM Pro</h1>
          <p className="text-zinc-500 text-lg">Estratégias, gabaritos e guias para passar no ENEM 2026.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {getAllPosts().map(post => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="bg-white rounded-2xl border border-zinc-200 p-6 hover:border-indigo-400 hover:shadow-sm transition-all block"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-zinc-400">
                  {new Date(post.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
                <span className="text-zinc-200">·</span>
                <span className="text-xs text-zinc-400">{post.readTime} min de leitura</span>
              </div>
              <h2 className="font-bold text-zinc-900 mb-2 leading-snug">{post.title}</h2>
              <p className="text-sm text-zinc-500 leading-relaxed line-clamp-2">{post.description}</p>
              <span className="inline-block mt-4 text-sm text-indigo-600 font-medium">Ler artigo →</span>
            </Link>
          ))}
        </div>

        <div className="mt-12 bg-indigo-600 text-white rounded-2xl px-8 py-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Pratique com questões reais</h2>
          <p className="text-indigo-200 mb-6">Leitura é ótimo. Prática é o que aprova. 10 questões/dia grátis.</p>
          <Link
            href="/auth/register"
            className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
          >
            Criar conta grátis
          </Link>
        </div>
      </main>

      <footer className="bg-zinc-900 text-zinc-500 text-sm py-8 px-6 text-center mt-16">
        <p>© 2026 ENEM Pro — Questões reais do ENEM com explicação por IA</p>
      </footer>
    </div>
  )
}
