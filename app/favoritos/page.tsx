'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { getFavoritos, clearFavoritos, removeFavorito, type Favorito } from '@/lib/favoritos'

const supabase = createBrowserClient()

function FavoritosContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [favs, setFavs] = useState<Favorito[]>([])
  const [filter, setFilter] = useState('')

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setFavs(getFavoritos())
      setLoading(false)
    }
    check()
  }, [router])

  function remove(id: string) {
    removeFavorito(id)
    setFavs(getFavoritos())
  }

  function clearAll() {
    if (!confirm('Remover todos os favoritos?')) return
    clearFavoritos()
    setFavs([])
  }

  const filtered = filter
    ? favs.filter((f) => f.discipline.toLowerCase().includes(filter.toLowerCase()))
    : favs

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-zinc-400">Carregando...</div>

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-indigo-600">ENEM Pro</Link>
          <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-900">← Dashboard</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-1">Questões salvas</h1>
            <p className="text-zinc-500 text-sm">{favs.length} questão{favs.length !== 1 ? 'ões' : ''} marcada{favs.length !== 1 ? 's' : ''} como favorita</p>
          </div>
          {favs.length > 0 && (
            <button onClick={clearAll} className="text-xs text-red-400 hover:text-red-600 underline">
              Limpar tudo
            </button>
          )}
        </div>

        {favs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
            <div className="text-4xl mb-4">⭐</div>
            <h2 className="text-lg font-bold mb-2">Nenhuma questão salva ainda</h2>
            <p className="text-zinc-500 text-sm mb-6">Clique na estrela em qualquer questão para salvá-la aqui.</p>
            <Link href="/questoes" className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700">
              Ir para questões →
            </Link>
          </div>
        ) : (
          <>
            {/* Filtro */}
            <div className="mb-5">
              <input
                type="text"
                placeholder="Filtrar por disciplina..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full sm:w-72 border border-zinc-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden mb-6">
              <div className="px-6 py-3 border-b border-zinc-100 bg-zinc-50">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
                </span>
              </div>
              {filtered.length === 0 ? (
                <div className="px-6 py-10 text-center text-zinc-400 text-sm">Nenhum favorito com esse filtro.</div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {filtered.map((f) => {
                    const shortDisc = f.discipline.split(',')[0].replace('e suas Tecnologias', '').trim()
                    const realTitle = f.title && !/^Questão \d+ - ENEM \d+$/.test(f.title) ? f.title : ''
                    return (
                      <div key={f.id} className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50 transition-colors">
                        <div className="text-amber-400 text-lg shrink-0">⭐</div>
                        <Link
                          href={`/questoes/${f.id}?year=${f.year}`}
                          className="flex-1 min-w-0 group"
                        >
                          <div className="text-sm font-medium text-zinc-900 group-hover:text-indigo-600 truncate">
                            {realTitle ? realTitle.slice(0, 80) + (realTitle.length > 80 ? '…' : '') : `${shortDisc} — ENEM ${f.year}`}
                          </div>
                          <div className="text-xs text-zinc-400 mt-0.5">
                            {shortDisc} · ENEM {f.year} · Salvo em {formatDate(f.savedAt)}
                          </div>
                        </Link>
                        <div className="flex items-center gap-3 shrink-0">
                          <Link href={`/questoes/${f.id}?year=${f.year}`} className="text-xs text-indigo-500 font-semibold hover:underline">
                            Abrir
                          </Link>
                          <button
                            onClick={() => remove(f.id)}
                            className="text-xs text-zinc-300 hover:text-red-400 transition-colors"
                            title="Remover"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default function FavoritosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-zinc-400">Carregando...</div>}>
      <FavoritosContent />
    </Suspense>
  )
}
