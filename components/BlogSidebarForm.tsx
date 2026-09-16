'use client'

import { useState } from 'react'
import { Mail, CheckCircle } from 'lucide-react'

interface BlogSidebarFormProps {
  leadMagnet?: string
}

export default function BlogSidebarForm({ leadMagnet = 'cronograma_enem' }: BlogSidebarFormProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Por favor, digite seu email')
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
          leadMagnet,
          utmSource: 'blog_sidebar',
          utmMedium: 'lead_form',
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitted(true)
        setEmail('')
        // Reset form after 3 seconds
        setTimeout(() => {
          setSubmitted(false)
        }, 3000)
      } else {
        setError(data.message || 'Erro ao processar inscrição. Tente novamente.')
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50 p-4 text-center">
        <CheckCircle className="mx-auto mb-2 h-8 w-8 text-emerald-600" />
        <h4 className="font-semibold text-emerald-900 mb-1">Inscrição confirmada!</h4>
        <p className="text-sm text-emerald-700">
          Verifique seu email para acessar o cronograma.
        </p>
      </div>
    )
  }

  return (
    <aside className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="font-semibold text-zinc-900 flex items-center gap-2 mb-2">
          <Mail className="h-4 w-4 text-indigo-600" />
          Cronograma 2026
        </h3>
        <p className="text-sm text-zinc-600">
          Receba um plano de estudo de 90 dias para o ENEM, direto no seu email.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            aria-label="Email para inscrição"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-zinc-100 disabled:cursor-not-allowed"
            required
          />
          {error && (
            <p className="mt-1 text-xs text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-indigo-700 disabled:bg-zinc-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          aria-busy={loading}
        >
          {loading ? 'Inscrevendo...' : 'Receber cronograma'}
        </button>

        <p className="text-xs text-zinc-500 text-center">
          Sem spam • Desinscrever a qualquer momento
        </p>
      </form>
    </aside>
  )
}
