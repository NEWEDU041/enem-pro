import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

const siteUrl = 'https://enem-pro-eight.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'ENEM Pro — Questões reais + IA que explica cada resposta',
    template: '%s | ENEM Pro',
  },
  description: 'Todas as questões do ENEM de 2009 a 2024. Responda, veja o gabarito e entenda o porquê com explicação gerada por IA. Grátis (10/dia) ou Pro R$14,90/mês.',
  keywords: ['ENEM', 'questões ENEM', 'simulado ENEM', 'gabarito ENEM', 'preparatório ENEM 2026', 'questões com resolução'],
  openGraph: {
    title: 'ENEM Pro — Questões reais + IA que explica cada resposta',
    description: 'Todas as questões do ENEM de 2009 a 2024 com explicação por IA. Grátis (10/dia) ou Pro R$14,90/mês.',
    url: siteUrl,
    siteName: 'ENEM Pro',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ENEM Pro — Questões reais + IA',
    description: 'Estude ENEM com questões reais de 2009 a 2024 e explicações geradas por IA.',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: siteUrl },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className={`${inter.className} min-h-full bg-zinc-50 text-zinc-900 antialiased`}>
        {children}
      </body>
    </html>
  )
}
