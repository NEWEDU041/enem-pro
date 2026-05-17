import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ENEM Pro — Questões + IA que explica o porquê',
  description: 'Todas as questões do ENEM de 2009 a 2024 com explicação detalhada gerada por IA. Estude grátis ou assine o Pro por R$14,90/mês.',
  keywords: 'ENEM, questões ENEM, simulado ENEM, preparatório ENEM, ENEM 2026',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full bg-zinc-50 text-zinc-900 antialiased">
        {children}
      </body>
    </html>
  )
}
