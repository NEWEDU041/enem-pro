'use client'

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function ExitIntentPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const hasShownRef = useRef(false)

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger once per session
      if (hasShownRef.current) return

      // Check if mouse is leaving from top
      if (e.clientY <= 0) {
        const hasSeenExitPopup = sessionStorage.getItem('enem-pro-exit-popup')
        if (!hasSeenExitPopup) {
          setIsOpen(true)
          hasShownRef.current = true
          sessionStorage.setItem('enem-pro-exit-popup', 'true')
        }
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    return () => document.removeEventListener('mouseleave', handleMouseLeave)
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Digite seu email para continuar')
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
          leadMagnet: 'plano_estudos_desconto',
          utmSource: 'exit_intent',
          utmMedium: 'popup',
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitted(true)
        setEmail('')
        setTimeout(() => {
          setIsOpen(false)
        }, 2000)
      } else if (response.status === 409) {
        // Email already exists, but still let them close
        setSubmitted(true)
        setTimeout(() => {
          setIsOpen(false)
        }, 2000)
      } else {
        setError(data.message || 'Erro ao processar inscrição')
      }
    } catch (error) {
      console.error('Exit intent form error:', error)
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 rounded-full p-1 text-zinc-400 transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-600"
          aria-label="Fechar popup"
        >
          <X size={24} />
        </button>

        {submitted ? (
          // Success state
          <div className="p-8 text-center">
            <div className="mb-4 text-4xl">🎓</div>
            <h3 className="text-2xl font-bold text-zinc-900 mb-3">
              Você é inteligente!
            </h3>
            <p className="text-base text-zinc-600 mb-4">
              Seu acesso foi confirmado. Verifique seu email para ativar o desconto.
            </p>
            <div className="rounded-lg bg-amber-50 p-4 border border-amber-200 text-sm text-amber-900">
              <p className="font-medium">50% de desconto no 1º mês</p>
              <p className="text-xs mt-1">Plano Pro completo com IA de resolução</p>
            </div>
          </div>
        ) : (
          // Form state
          <div className="p-8">
            <div className="mb-6">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                Oferta Especial
              </p>
              <h3 className="text-2xl font-bold text-zinc-900 mt-2">
                Saia sem levar seu cronograma?
              </h3>
              <p className="mt-3 text-zinc-600">
                Ganhe um plano de estudo de 90 dias + 50% de desconto no primeiro mês Pro
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  aria-label="Email"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-zinc-100 disabled:cursor-not-allowed"
                  required
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600" role="alert">
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:from-indigo-700 hover:to-indigo-800 disabled:from-zinc-400 disabled:to-zinc-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                aria-busy={loading}
              >
                {loading ? 'Confirmando...' : 'Desbloquear desconto →'}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-700 font-medium transition-colors duration-200 hover:bg-zinc-50"
              >
                Talvez depois
              </button>

              <p className="text-xs text-zinc-500 text-center">
                Sem compromisso • Cancelar a qualquer momento
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
