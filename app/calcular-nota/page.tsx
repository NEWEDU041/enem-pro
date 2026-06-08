'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'

// TRI approximation table: acertos → score (45-question areas)
function triScore(acertos: number, total: number): number {
  const pct = acertos / total
  if (pct <= 0.10) return Math.round(300 + pct * 10 * 80)
  if (pct <= 0.25) return Math.round(380 + (pct - 0.10) / 0.15 * 80)
  if (pct <= 0.40) return Math.round(460 + (pct - 0.25) / 0.15 * 70)
  if (pct <= 0.55) return Math.round(530 + (pct - 0.40) / 0.15 * 80)
  if (pct <= 0.70) return Math.round(610 + (pct - 0.55) / 0.15 * 90)
  if (pct <= 0.82) return Math.round(700 + (pct - 0.70) / 0.12 * 70)
  if (pct <= 0.91) return Math.round(770 + (pct - 0.82) / 0.09 * 60)
  return Math.round(830 + (pct - 0.91) / 0.09 * 70)
}

const AREAS = [
  { key: 'linguagens', label: 'Linguagens e Códigos', total: 45, color: 'violet' },
  { key: 'humanas', label: 'Ciências Humanas', total: 45, color: 'amber' },
  { key: 'natureza', label: 'Ciências da Natureza', total: 45, color: 'emerald' },
  { key: 'matematica', label: 'Matemática', total: 45, color: 'indigo' },
] as const

type AreaKey = typeof AREAS[number]['key']

const COLOR: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  violet: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', bar: 'bg-violet-500' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', bar: 'bg-amber-500' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', bar: 'bg-emerald-500' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', bar: 'bg-indigo-500' },
}

const CURSOS = [
  { nome: 'Medicina — UFMG', media: 780 },
  { nome: 'Medicina — UFPE', media: 760 },
  { nome: 'Direito — USP', media: 720 },
  { nome: 'Engenharia Civil — UFRJ', media: 680 },
  { nome: 'Administração — UFMG', media: 640 },
  { nome: 'Pedagogia — UFPE', media: 570 },
  { nome: 'ProUni parcial (bolsa 50%)', media: 450 },
  { nome: 'ProUni integral (bolsa 100%)', media: 510 },
]

export default function CalcularNotaPage() {
  const [acertos, setAcertos] = useState<Record<AreaKey, number>>({
    linguagens: 0, humanas: 0, natureza: 0, matematica: 0,
  })
  const [redacao, setRedacao] = useState(0)
  const [calculou, setCalculou] = useState(false)

  const scores = AREAS.map(a => ({ ...a, score: triScore(acertos[a.key], a.total) }))
  const media = scores.reduce((s, a) => s + a.score, 0) / 4
  const mediaComRedacao = (scores.reduce((s, a) => s + a.score, 0) + redacao) / 5

  function handleCalc() {
    setCalculou(true)
    setTimeout(() => {
      document.getElementById('resultado')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-indigo-600">ENEM Pro</Link>
        <Link href="/auth/register" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          Criar conta grátis
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-zinc-900 mb-3">Calculadora de Nota ENEM</h1>
          <p className="text-zinc-600 text-lg">
            Insira seus acertos em cada área e veja sua nota estimada com base na <strong>curva TRI</strong>.
          </p>
          <p className="text-xs text-zinc-400 mt-2">Estimativa baseada na distribuição histórica da TRI — não é o cálculo oficial do INEP.</p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6 space-y-5">
          {AREAS.map(area => {
            const c = COLOR[area.color]
            return (
              <div key={area.key}>
                <div className="flex items-center justify-between mb-2">
                  <label className={`font-semibold text-sm ${c.text}`}>{area.label}</label>
                  <span className="text-xs text-zinc-500">{acertos[area.key]} de {area.total} questões</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={area.total}
                  value={acertos[area.key]}
                  onChange={e => {
                    setAcertos(prev => ({ ...prev, [area.key]: Number(e.target.value) }))
                    setCalculou(false)
                  }}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-zinc-400 mt-1">
                  <span>0</span>
                  <span>{area.total}</span>
                </div>
              </div>
            )
          })}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-sm text-rose-700">Redação</label>
              <span className="text-xs text-zinc-500">{redacao} pontos</span>
            </div>
            <input
              type="range"
              min={0}
              max={1000}
              step={40}
              value={redacao}
              onChange={e => { setRedacao(Number(e.target.value)); setCalculou(false) }}
              className="w-full accent-rose-600"
            />
            <div className="flex justify-between text-xs text-zinc-400 mt-1">
              <span>0</span>
              <span>1000</span>
            </div>
          </div>

          <button
            onClick={handleCalc}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Calcular minha nota
          </button>
        </div>

        {calculou && (
          <div id="resultado" className="space-y-4">
            <div className="bg-indigo-600 text-white rounded-2xl p-6 text-center">
              <p className="text-sm font-medium opacity-80 mb-1">Média das 5 notas (SISU)</p>
              <p className="text-6xl font-bold mb-1">{mediaComRedacao.toFixed(0)}</p>
              <p className="text-sm opacity-70">pontos</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {scores.map(a => {
                const c = COLOR[a.color]
                return (
                  <div key={a.key} className={`${c.bg} border ${c.border} rounded-xl p-4`}>
                    <p className={`text-xs font-semibold ${c.text} mb-1`}>{a.label}</p>
                    <p className={`text-3xl font-bold ${c.text}`}>{a.score}</p>
                    <div className="mt-2 h-1.5 bg-white rounded-full overflow-hidden">
                      <div className={`h-full ${c.bar} rounded-full`} style={{ width: `${(a.score / 1000) * 100}%` }} />
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">{acertos[a.key]}/{a.total} acertos</p>
                  </div>
                )
              })}
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-rose-700 mb-1">Redação</p>
                <p className="text-3xl font-bold text-rose-700">{redacao}</p>
                <div className="mt-2 h-1.5 bg-white rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(redacao / 1000) * 100}%` }} />
                </div>
                <p className="text-xs text-zinc-500 mt-1">0–1000 pts</p>
              </div>
              <div className="bg-zinc-100 border border-zinc-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-zinc-600 mb-1">Média Objetiva</p>
                <p className="text-3xl font-bold text-zinc-800">{media.toFixed(0)}</p>
                <p className="text-xs text-zinc-500 mt-3">sem redação</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 p-5">
              <h2 className="font-bold text-zinc-900 mb-4">Comparativo com Notas de Corte</h2>
              <div className="space-y-3">
                {CURSOS.map(c => {
                  const passa = mediaComRedacao >= c.media
                  return (
                    <div key={c.nome} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg ${passa ? 'text-green-500' : 'text-zinc-300'}`}>
                          {passa ? '✓' : '○'}
                        </span>
                        <span className="text-sm text-zinc-700">{c.nome}</span>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${passa ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>
                        {c.media}+
                      </span>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-zinc-400 mt-4">Médias históricas do SISU — consulte o edital oficial para valores exatos.</p>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 text-center">
              <p className="text-indigo-900 font-bold text-lg mb-2">Quer melhorar essa nota?</p>
              <p className="text-indigo-700 text-sm mb-4">
                Pratique questões reais do ENEM com explicação da IA para cada erro. <strong>10 questões por dia grátis.</strong>
              </p>
              <Link href="/auth/register" className="inline-block bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-indigo-700">
                Começar grátis →
              </Link>
            </div>
          </div>
        )}

        <div className="mt-10 bg-white rounded-2xl border border-zinc-200 p-6">
          <h2 className="font-bold text-zinc-900 mb-3">Como funciona a Nota do ENEM?</h2>
          <div className="space-y-3 text-sm text-zinc-600">
            <p>O ENEM usa a <strong>TRI (Teoria de Resposta ao Item)</strong> para calcular as notas. Diferente de uma simples porcentagem de acertos, a TRI considera a dificuldade de cada questão.</p>
            <p>Acertar questões difíceis vale mais. E acertar uma questão difícil mas errar a fácil do mesmo tema pode reduzir sua nota — a TRI detecta padrões inconsistentes de resposta.</p>
            <p>A nota vai de <strong>0 a 1000</strong> em cada área. A média histórica dos candidatos fica em torno de <strong>450–550 pontos</strong>.</p>
            <p>O <strong>SISU</strong> usa a média aritmética das 5 notas (4 objetivas + redação), podendo aplicar pesos diferentes por curso.</p>
          </div>
          <Link href="/blog/tri-enem-como-funciona" className="inline-block mt-4 text-indigo-600 text-sm font-semibold hover:underline">
            Entender a TRI em detalhes →
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href="/blog/sisu-2026-como-funciona" className="text-indigo-600 hover:underline">SISU 2026 →</Link>
          <Link href="/blog/nota-de-corte-medicina-enem" className="text-indigo-600 hover:underline">Notas de corte Medicina →</Link>
          <Link href="/blog/como-calcular-nota-enem" className="text-indigo-600 hover:underline">Guia completo TRI →</Link>
          <Link href="/cronograma" className="text-indigo-600 hover:underline">Criar cronograma →</Link>
        </div>
      </main>
    </div>
  )
}
