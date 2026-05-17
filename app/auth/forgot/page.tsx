'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase'

const supabase = createBrowserClient()

export default function ForgotPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    })
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-5xl mb-6">📧</div>
          <h1 className="text-2xl font-bold mb-3">Verifique seu email</h1>
          <p className="text-zinc-500 mb-8">
            Enviamos um link para <strong>{email}</strong>. Clique nele para redefinir sua senha.
          </p>
          <Link href="/auth/login" className="text-indigo-600 text-sm hover:underline">← Voltar ao login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="block text-center text-2xl font-bold text-indigo-600 mb-8">
          ENEM Pro
        </Link>
        <div className="bg-white rounded-2xl border border-zinc-200 p-8">
          <h1 className="text-2xl font-bold mb-2">Esqueci minha senha</h1>
          <p className="text-zinc-500 text-sm mb-8">
            Informe seu email e enviaremos um link para redefinir a senha.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-zinc-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="seu@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar link'}
            </button>
          </form>

          <p className="text-center mt-6">
            <Link href="/auth/login" className="text-sm text-zinc-500 hover:text-zinc-900">← Voltar ao login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
