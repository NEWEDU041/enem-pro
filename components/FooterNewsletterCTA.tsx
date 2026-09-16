'use client'

import { useState } from 'react'
import { Mail, CheckCircle } from 'lucide-react'

export default function FooterNewsletterCTA() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Digite seu email')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          leadMagnet: 'newsletter_semanal',
          utmSource: 'footer',
          utmMedium: 'newsletter_cta',
        }),
      })

      const data = await response.json()

      if (response.ok || response.status === 409) {
        setSubmitted(true)
        setEmail('')
        // Reset form after 4 seconds
        setTimeout(() => {
          setSubmitted(false)
        }, 4000)
      } else {
        setError(data.message || 'Erro ao processar inscrição')
      }
    } catch (error) {
      console.error('Footer form error:', error)
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-900">Inscrição confirmada!</p>
            <p className="text-sm text-emerald-700 mt-1">
              Você receberá dicas ENEM toda semana. Obrigado por se juntar a nós.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 p-6">
      <div className="flex items-start gap-3 mb-4">
        <Mail className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-zinc-900">
            Dicas ENEM toda semana
          </h3>
          <p className="text-sm text-zinc-600 mt-1">
            Receba estratégias de estudo, questões comentadas e recursos gratuitos para sua preparação.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            aria-label="Email para newsletter"
            className="flex-1 rounded-md border border-indigo-300 bg-white px-4 py-2 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-zinc-100 disabled:cursor-not-allowed"
            required
          />
          <button
            type="submit"
            disabled={loading || !email}
            className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm transition-all duration-200 hover:bg-indigo-700 disabled:bg-zinc-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 whitespace-nowrap"
            aria-busy={loading}
          >
            {loading ? 'Inscrevendo...' : 'Inscrever'}
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <p className="text-xs text-zinc-600">
          ✓ Sem spam • ✓ Desinscrever quando quiser
        </p>
      </form>
    </div>
  )
}
