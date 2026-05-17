'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AdminPage() {
  const [secret, setSecret] = useState('')
  const [email, setEmail] = useState('')
  const [months, setMonths] = useState('1')
  const [result, setResult] = useState<{ ok?: boolean; error?: string; expires_at?: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [authed, setAuthed] = useState(false)

  async function handleUpgrade(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const res = await fetch('/api/admin/upgrade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': secret,
      },
      body: JSON.stringify({ email, months: parseInt(months) }),
    })

    const data = await res.json()
    setResult(data)
    setLoading(false)
    if (data.ok) {
      setEmail('')
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h1 className="text-xl font-bold mb-6 text-center">Admin — ENEM Pro</h1>
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <label className="block text-sm font-medium mb-1">Senha admin</label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full border border-zinc-300 rounded-lg px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="ADMIN_SECRET"
            />
            <button
              onClick={() => setAuthed(true)}
              disabled={!secret}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-40"
            >
              Entrar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold text-indigo-600">ENEM Pro — Admin</span>
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">Sair</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl border border-zinc-200 p-8">
          <h2 className="text-lg font-bold mb-6">Ativar plano Pro para um usuário</h2>

          <form onSubmit={handleUpgrade} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Email do usuário</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-zinc-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="usuario@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Meses de acesso</label>
              <select
                value={months}
                onChange={(e) => setMonths(e.target.value)}
                className="w-full border border-zinc-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="1">1 mês — R$14,90</option>
                <option value="3">3 meses — R$44,70</option>
                <option value="6">6 meses — R$89,40</option>
                <option value="12">12 meses — R$99,00 (anual)</option>
              </select>
            </div>

            {result && (
              <div className={`px-4 py-3 rounded-lg text-sm ${result.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {result.ok
                  ? `Pro ativado! Expira em: ${new Date(result.expires_at!).toLocaleDateString('pt-BR')}`
                  : `Erro: ${result.error}`}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Ativando...' : 'Ativar Pro'}
            </button>
          </form>
        </div>

        <div className="mt-6 bg-white rounded-2xl border border-zinc-200 p-6">
          <h3 className="font-semibold mb-3">Atalho via curl</h3>
          <pre className="bg-zinc-900 text-zinc-100 rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap">
{`curl -X POST https://enem-pro-eight.vercel.app/api/admin/upgrade \\
  -H "Content-Type: application/json" \\
  -H "x-admin-secret: SEU_ADMIN_SECRET" \\
  -d '{"email":"usuario@email.com","months":1}'`}
          </pre>
        </div>
      </main>
    </div>
  )
}
