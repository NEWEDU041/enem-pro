'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Show popup after 3 seconds on first visit
    const timer = setTimeout(() => {
      const hasSeenPopup = localStorage.getItem('enem-pro-popup')
      if (!hasSeenPopup) {
        setIsOpen(true)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      // Send to Brevo API (você vai configurar depois)
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setSubmitted(true)
        localStorage.setItem('enem-pro-popup', 'true')
        setTimeout(() => {
          setIsOpen(false)
        }, 2000)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        {submitted ? (
          <div className="text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">
              Bem-vindo!
            </h3>
            <p className="text-zinc-600">
              Verifique seu email para confirmar a inscrição
            </p>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-bold text-zinc-900 mb-2">
              📚 Receba Dicas ENEM Diárias
            </h3>
            <p className="text-zinc-600 mb-6">
              Suba sua nota com dicas de estudo que realmente funcionam. Grátis, sem spam.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Seu email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Inscrevendo...' : 'Sim, quero receber dicas! →'}
              </button>

              <p className="text-xs text-zinc-400 text-center">
                ✓ Sem spam • ✓ Cancelar a qualquer momento • ✓ Grátis
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
