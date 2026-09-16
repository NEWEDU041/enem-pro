'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

const PRODUCT_ID = 'study-checklist'
const PRODUCT_NAME = 'ENEM 2026 Study Checklist — 90-Day Countdown'

export default function StudyChecklistPage() {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState('')
  const [offerCode, setOfferCode] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/products/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName,
          productId: PRODUCT_ID,
          productName: PRODUCT_NAME,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error?.email?.[0] || data.error || 'Erro ao processar')
        return
      }

      setDownloadUrl(data.downloadUrl)
      setOfferCode(data.offerCode)
      setSubmitted(true)

      setTimeout(() => {
        const link = document.createElement('a')
        link.href = data.downloadUrl
        link.download = `study-checklist-enem-90days.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }, 500)
    } catch (err) {
      setError('Erro ao processar sua solicitação. Tente novamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="text-sm text-rose-600 hover:text-rose-700 font-medium">
            ← Voltar
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <Badge variant="rose">Premium Download</Badge>

            <h1 className="text-4xl font-bold text-gray-900 mt-6 mb-4">
              90-Day Study Checklist
            </h1>

            <p className="text-xl text-gray-600 mb-8">
              Cronograma dia-a-dia para os próximos 3 meses. Versão PDF (impressa) + Google Sheets (editável).
            </p>

            <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">O que você recebe:</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-rose-600 font-bold">✓</span>
                  <span><strong>90 Dias de Cronograma:</strong> Do dia de hoje até o ENEM</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-600 font-bold">✓</span>
                  <span><strong>Foco Diário:</strong> 1 disciplina por dia, rotação estratégica</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-600 font-bold">✓</span>
                  <span><strong>Checkboxes:</strong> Marque o que você fez cada dia</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-600 font-bold">✓</span>
                  <span><strong>Rastreador de Progresso:</strong> Veja seu avanço visualmente</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-600 font-bold">✓</span>
                  <span><strong>Google Sheets Editável:</strong> Customize para seus objetivos</span>
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Dias</div>
                <div className="font-semibold text-gray-900">90</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Páginas</div>
                <div className="font-semibold text-gray-900">22</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Formato</div>
                <div className="font-semibold text-gray-900">PDF + Sheets</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Tamanho</div>
                <div className="font-semibold text-gray-900">3.2 MB</div>
              </div>
            </div>
          </div>

          <div>
            {!submitted ? (
              <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-8 sticky top-20">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Baixe Agora
                </h2>
                <p className="text-gray-600 mb-6">
                  Insira seu email para receber o cronograma dos próximos 90 dias.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primeiro Nome (opcional)
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Lucas"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="seu@email.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
                  >
                    {loading ? 'Processando...' : 'Baixar Cronograma 90 Dias'}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    Sem compromisso. Grátis. 📧
                  </p>
                </form>
              </div>
            ) : (
              <div className="bg-white border border-green-200 rounded-lg shadow-lg p-8 sticky top-20">
                <div className="text-center">
                  <div className="text-5xl mb-4">✓</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Cronograma Liberado!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Seu plano de estudo para os próximos 90 dias está pronto.
                  </p>

                  <a
                    href={downloadUrl}
                    className="inline-block bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2 px-4 rounded-lg transition mb-6"
                  >
                    Download Cronograma
                  </a>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-6">
                    <p className="text-sm font-semibold text-orange-900 mb-2">
                      🎁 Ganhe 50% OFF no ENEM Pro
                    </p>
                    <p className="text-xs text-orange-800 mb-3">
                      Use seu código:
                    </p>
                    <div className="bg-white border border-orange-300 rounded px-3 py-2 font-mono text-sm font-bold text-center mb-3">
                      {offerCode}
                    </div>
                    <Link
                      href="/planos"
                      className="inline-block bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold py-2 px-4 rounded transition"
                    >
                      Ativar Desconto
                    </Link>
                    <p className="text-xs text-orange-700 mt-3">
                      Válido por 7 dias
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
