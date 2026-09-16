'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

const PRODUCT_ID = 'essay-template'
const PRODUCT_NAME = 'Essay Structure Template + 10 High-Scoring Examples'

export default function EssayTemplatePage() {
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
        link.download = `essay-template-enem.pdf`
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
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="text-sm text-green-600 hover:text-green-700 font-medium">
            ← Voltar
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <Badge variant="green">Premium Download</Badge>

            <h1 className="text-4xl font-bold text-gray-900 mt-6 mb-4">
              Essay Structure + 10 Examples
            </h1>

            <p className="text-xl text-gray-600 mb-8">
              Estrutura completa de redação + 10 exemplos de redações nota 1.000 do ENEM com análise anotada.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">O que você recebe:</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Estrutura Completa:</strong> Introdução, Desenvolvimento, Conclusão</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>10 Redações Anotadas:</strong> Exemplos nota 1.000 de 2024-2025</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Erros Comuns:</strong> 20 armadilhas que fazem você perder pontos</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Guia de Conectores:</strong> Palavras para fluir entre parágrafos</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Checklist Final:</strong> Revise sua redação em 60 segundos</span>
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Exemplos</div>
                <div className="font-semibold text-gray-900">10</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Páginas</div>
                <div className="font-semibold text-gray-900">36</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Formato</div>
                <div className="font-semibold text-gray-900">PDF + Docs</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Tamanho</div>
                <div className="font-semibold text-gray-900">5.7 MB</div>
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
                  Insira seu email para acessar a estrutura + 10 redações nota 1.000.
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
                      placeholder="Ana"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
                  >
                    {loading ? 'Processando...' : 'Baixar Estrutura + Exemplos'}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    Acesso grátis. Privacidade garantida. 📧
                  </p>
                </form>
              </div>
            ) : (
              <div className="bg-white border border-green-200 rounded-lg shadow-lg p-8 sticky top-20">
                <div className="text-center">
                  <div className="text-5xl mb-4">✓</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Pronto para Baixar!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Acesso liberado aos exemplos de redações nota 1.000.
                  </p>

                  <a
                    href={downloadUrl}
                    className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition mb-6"
                  >
                    Download Estrutura
                  </a>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-6">
                    <p className="text-sm font-semibold text-orange-900 mb-2">
                      🎁 Ganhe 50% OFF em um mês de ENEM Pro
                    </p>
                    <p className="text-xs text-orange-800 mb-3">
                      Seu código:
                    </p>
                    <div className="bg-white border border-orange-300 rounded px-3 py-2 font-mono text-sm font-bold text-center mb-3">
                      {offerCode}
                    </div>
                    <Link
                      href="/planos"
                      className="inline-block bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold py-2 px-4 rounded transition"
                    >
                      Usar Código
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
