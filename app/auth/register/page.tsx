'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { Suspense } from 'react'

const supabase = createBrowserClient()

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-zinc-400">Carregando...</div>}>
      <RegisterForm />
    </Suspense>
  )
}

function RegisterForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  // Store referral code in localStorage so dashboard can process it after login
  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) localStorage.setItem('enem_ref', ref)
  }, [searchParams])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres.')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <Link href="/" className="block text-2xl font-bold text-indigo-600 mb-8">ENEM Pro</Link>
          <div className="bg-white rounded-2xl border border-zinc-200 p-8">
            <div className="text-5xl mb-4">📧</div>
            <h1 className="text-2xl font-bold mb-3">Confirme seu email</h1>
            <p className="text-zinc-500 text-sm mb-6">
              Enviamos um link de confirmação para <strong>{email}</strong>. Clique no link para ativar sua conta.
            </p>
            <Link href="/auth/login" className="text-indigo-600 text-sm hover:underline">
              Já confirmou? Entrar →
            </Link>
          </div>
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
          <h1 className="text-2xl font-bold mb-2">Criar conta grátis</h1>
          <p className="text-zinc-500 text-sm mb-8">
            Já tem conta?{' '}
            <Link href="/auth/login" className="text-indigo-600 hover:underline">
              Entrar
            </Link>
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-zinc-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Seu nome"
              />
            </div>
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
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-zinc-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Criando conta...' : 'Criar conta grátis'}
            </button>
          </form>

          <p className="text-xs text-zinc-400 text-center mt-6">
            10 questões/dia grátis para sempre. Sem cartão de crédito.
          </p>
        </div>
      </div>
    </div>
  )
}
