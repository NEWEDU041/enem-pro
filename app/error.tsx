'use client'

import type { NextPage } from 'next'
import Link from 'next/link'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

const ErrorPage: NextPage<Props> = ({ error, reset }) => {
  return (
    <html lang="pt-BR">
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#f3f4f6',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '2rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '500px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h1 style={{ color: '#1f2937', marginTop: 0 }}>
              ⚠️ Algo deu errado
            </h1>
            <p style={{ color: '#6b7280' }}>
              Desculpe, ocorreu um erro inesperado. Nossa equipe foi notificada.
            </p>
            {error?.digest && (
              <p style={{ fontSize: '0.875rem', color: '#9ca3af', fontFamily: 'monospace' }}>
                ID do erro: {error.digest}
              </p>
            )}
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => reset()}
                style={{
                  flex: 1,
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 500
                }}
              >
                Tentar Novamente
              </button>
              <Link href="/"
                style={{
                  flex: 1,
                  padding: '0.5rem 1rem',
                  backgroundColor: '#e5e7eb',
                  color: '#1f2937',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 500,
                  textAlign: 'center',
                  textDecoration: 'none'
                }}
              >
                Voltar ao Início
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

export default ErrorPage
