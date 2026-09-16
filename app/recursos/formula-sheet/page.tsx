'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

const PRODUCT_ID = 'formula-sheet'
const PRODUCT_NAME = 'ENEM 2026 Formula Sheet — All 5 Subjects'

export default function FormulaSheetPage() {
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

      // Trigger download
      setTimeout(() => {
        const link = document.createElement('a')
        link.href = data.downloadUrl
        link.download = `formula-sheet-enem-2026.pdf`
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            ← Voltar
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Product Info */}
          <div>
            <Badge variant="blue">Premium Download</Badge>

            <h1 className="text-4xl font-bold text-gray-900 mt-6 mb-4">
              ENEM 2026 Formula Sheet
            </h1>

            <p className="text-xl text-gray-600 mb-8">
              Todas as fórmulas essenciais dos 5 eixos do ENEM em um único documento.
              Pronto para imprimir, revisar e memorizar.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">O que você recebe:</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span><strong>Matemática:</strong> Álgebra, Geometria, Trigonometria (18 fórmulas)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span><strong>Física:</strong> Mecânica, Termodinâmica, Ondas (22 fórmulas)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span><strong>Química:</strong> Tabela Periódica, Reações, Estequiometria (15 fórmulas)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span><strong>Biologia:</strong> Processos, Ciclos, Taxonomia (12 conceitos)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span><strong>Português:</strong> Termos Literários, Gramática, Retórica (8 categorias)</span>
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Formato</div>
                <div className="font-semibold text-gray-900">PDF (5 páginas)</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Tamanho</div>
                <div className="font-semibold text-gray-900">2.1 MB</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Pronto para</div>
                <div className="font-semibold text-gray-900">Imprimir</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Atualização</div>
                <div className="font-semibold text-gray-900">2026</div>
              </div>
            </div>
          </div>

          {/* Right: Email Form */}
          <div>
            {!submitted ? (
              <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-8 sticky top-20">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Baixe Agora
                </h2>
                <p className="text-gray-600 mb-6">
                  Insira seu email para receber o PDF e outros recursos exclusivos.
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
                      placeholder="João"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
                  >
                    {loading ? 'Processando...' : 'Baixar PDF Agora'}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    Prometemos não enviar spam. 📧
                  </p>
                </form>
              </div>
            ) : (
              <div className="bg-white border border-green-200 rounded-lg shadow-lg p-8 sticky top-20">
                <div className="text-center">
                  <div className="text-5xl mb-4">✓</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Download Iniciado!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Seu PDF está sendo baixado agora. Se não começar, clique no link abaixo.
                  </p>

                  <a
                    href={downloadUrl}
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition mb-6"
                  >
                    Download Manual
                  </a>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-6">
                    <p className="text-sm font-semibold text-orange-900 mb-2">
                      🎁 Aproveite 50% OFF no ENEM Pro
                    </p>
                    <p className="text-xs text-orange-800 mb-3">
                      Seu código exclusivo:
                    </p>
                    <div className="bg-white border border-orange-300 rounded px-3 py-2 font-mono text-sm font-bold text-center mb-3">
                      {offerCode}
                    </div>
                    <Link
                      href="/planos"
                      className="inline-block bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold py-2 px-4 rounded transition"
                    >
                      Usar Código → Assinar Pro
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

        {/* FAQ */}
        <div className="mt-20 border-t border-gray-200 pt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Perguntas Frequentes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Posso imprimir o PDF?
              </h3>
              <p className="text-gray-600 text-sm">
                Sim! O PDF foi otimizado para impressão. Recomendamos imprimir em preto e branco para economizar tinta.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Quando recebo o arquivo?
              </h3>
              <p className="text-gray-600 text-sm">
                Imediatamente após enviar seu email. O arquivo começa a baixar automaticamente.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Preciso pagar algo?
              </h3>
              <p className="text-gray-600 text-sm">
                Não! O PDF é 100% gratuito. Oferecemos apenas como forma de agradecer seu contato.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Qual versão do ENEM?
              </h3>
              <p className="text-gray-600 text-sm">
                Atualizado para ENEM 2026. Válido para todos os anos, pois as fórmulas fundamentais não mudam.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
