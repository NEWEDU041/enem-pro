'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

type Stats = {
  users: { total: number; new_week: number }
  answers: { total: number; today: number }
  pro: { active: number }
  emails_sent: number
  cache_last: string | null
  paywallHitsToday: number
  aiUsageRate: string
  conversionRate: string
}

type UpgradeResult = { ok?: boolean; error?: string; expires_at?: string }
type WarmResult = { warmed?: Record<string, string>; error?: string }

export default function AdminPage() {
  const [secret, setSecret] = useState('')
  const [email, setEmail] = useState('')
  const [months, setMonths] = useState('1')
  const [upgradeResult, setUpgradeResult] = useState<UpgradeResult | null>(null)
  const [warmResult, setWarmResult] = useState<WarmResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [warming, setWarming] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await fetch('/api/admin/stats', { headers: { 'x-admin-secret': secret } })
      if (res.ok) setStats(await res.json())
    } catch {
      // non-fatal
    }
    setStatsLoading(false)
  }, [secret])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loadStats fetches and syncs admin stats, the documented data-fetching effect pattern
    if (authed) loadStats()
  }, [authed, loadStats])

  async function handleUpgrade(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setUpgradeResult(null)
    const res = await fetch('/api/admin/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify({ email, months: parseInt(months) }),
    })
    const data = await res.json()
    setUpgradeResult(data)
    setLoading(false)
    if (data.ok) { setEmail(''); loadStats() }
  }

  async function handleWarmCache() {
    setWarming(true)
    setWarmResult(null)
    const res = await fetch('/api/admin/warm-cache', {
      method: 'POST',
      headers: { 'x-admin-secret': secret },
    })
    const data = await res.json()
    setWarmResult(data)
    setWarming(false)
    loadStats()
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h1 className="text-xl font-bold mb-6 text-center">Admin — ENEM Pro</h1>
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <label className="block text-sm font-medium mb-1">Senha admin (CRON_SECRET)</label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && secret && setAuthed(true)}
              className="w-full border border-zinc-300 rounded-lg px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
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
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold text-indigo-600">ENEM Pro — Admin</span>
          <div className="flex items-center gap-4">
            <button onClick={loadStats} disabled={statsLoading} className="text-sm text-zinc-400 hover:text-zinc-700">
              {statsLoading ? 'Atualizando...' : 'Atualizar stats'}
            </button>
            <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">Sair</Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        {/* Stats */}
        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox label="Usuários" value={stats.users.total} sub={`+${stats.users.new_week} semana`} />
              <StatBox label="Questões hoje" value={stats.answers.today} sub={`${stats.answers.total} total`} />
              <StatBox label="Pro ativos" value={stats.pro.active} color="indigo" />
              <StatBox
                label="Receita estimada"
                value={`R$${(stats.pro.active * 29.90).toFixed(0)}`}
                sub="mensal (R$29,90/Pro)"
                color="green"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox label="Conversão" value={stats.conversionRate} sub="usuários → Pro" color="indigo" />
              <StatBox label="Uso IA" value={stats.aiUsageRate} sub="questões com explicação" />
              <StatBox label="Paywall hoje" value={stats.paywallHitsToday} sub="limites atingidos" color={stats.paywallHitsToday > 0 ? 'amber' : undefined} />
              <StatBox
                label="Cache questões"
                value={stats.cache_last ? 'OK' : 'Vazio'}
                sub={stats.cache_last ? new Date(stats.cache_last).toLocaleDateString('pt-BR') : 'Executar warm-up'}
                color={stats.cache_last ? 'green' : 'amber'}
              />
            </div>
          </>
        )}

        {/* Warm cache */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-bold text-zinc-900">Cache de questões</h2>
              <p className="text-sm text-zinc-500 mt-0.5">Pré-carrega todos os 15 anos no Supabase. Leva ~2 min.</p>
            </div>
            <button
              onClick={handleWarmCache}
              disabled={warming}
              className="bg-zinc-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-zinc-700 disabled:opacity-50"
            >
              {warming ? 'Aquecendo...' : 'Warm-up cache'}
            </button>
          </div>
          {warmResult && (
            <div className="mt-3 bg-zinc-50 rounded-lg p-4">
              {warmResult.error
                ? <p className="text-red-600 text-sm">{warmResult.error}</p>
                : (
                  <div className="space-y-1">
                    {Object.entries(warmResult.warmed ?? {}).map(([year, status]) => (
                      <div key={year} className="flex justify-between text-xs text-zinc-600">
                        <span>{year}</span>
                        <span className={status.startsWith('ok') ? 'text-green-600' : 'text-red-500'}>{status}</span>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          )}
        </div>

        {/* Upgrade user */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-8">
          <h2 className="text-lg font-bold mb-6">Ativar plano Pro</h2>
          <form onSubmit={handleUpgrade} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium text-zinc-700 mb-1">Período</label>
                <select
                  value={months}
                  onChange={(e) => setMonths(e.target.value)}
                  className="w-full border border-zinc-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="1">1 mês — R$29,90</option>
                  <option value="3">3 meses — R$89,70</option>
                  <option value="6">6 meses — R$179,40</option>
                  <option value="12">12 meses — R$99,00 (anual)</option>
                </select>
              </div>
            </div>
            {upgradeResult && (
              <div className={`px-4 py-3 rounded-lg text-sm ${upgradeResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {upgradeResult.ok
                  ? `Pro ativado! Expira em: ${new Date(upgradeResult.expires_at!).toLocaleDateString('pt-BR')}`
                  : `Erro: ${upgradeResult.error}`}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Ativando...' : 'Ativar Pro'}
            </button>
          </form>
        </div>

        {/* curl reference */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <h3 className="font-semibold mb-3 text-zinc-700">Referência curl</h3>
          <pre className="bg-zinc-900 text-zinc-100 rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap">
{`# Upgrade
curl -X POST https://questoesenem.pro/api/admin/upgrade \\
  -H "Content-Type: application/json" \\
  -H "x-admin-secret: CRON_SECRET" \\
  -d '{"email":"user@email.com","months":1}'

# Stats
curl https://questoesenem.pro/api/admin/stats \\
  -H "x-admin-secret: CRON_SECRET"

# Warm cache
curl -X POST https://questoesenem.pro/api/admin/warm-cache \\
  -H "x-admin-secret: CRON_SECRET"`}
          </pre>
        </div>
      </main>
    </div>
  )
}

function StatBox({ label, value, sub, color }: {
  label: string
  value: string | number
  sub?: string
  color?: 'indigo' | 'green' | 'amber'
}) {
  const colors = {
    indigo: 'text-indigo-600',
    green: 'text-green-600',
    amber: 'text-amber-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-5 text-center">
      <div className={`text-2xl font-bold mb-1 ${color ? colors[color] : 'text-zinc-900'}`}>{value}</div>
      <div className="text-xs font-medium text-zinc-500">{label}</div>
      {sub && <div className="text-xs text-zinc-400 mt-0.5">{sub}</div>}
    </div>
  )
}
