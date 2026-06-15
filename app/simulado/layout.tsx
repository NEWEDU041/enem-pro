import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Simulado ENEM 2026 Grátis — Questões Reais do INEP | ENEM Pro',
  description: 'Faça um simulado do ENEM 2026 com questões reais do INEP. Escolha disciplina e quantidade de questões, responda com timer e receba sua nota estimada no final.',
  alternates: { canonical: `${SITE_URL}/simulado` },
  openGraph: {
    title: 'Simulado ENEM 2026 Grátis | ENEM Pro',
    description: 'Questões reais do INEP no formato simulado. Nota estimada com TRI ao final. Grátis.',
    type: 'website',
    url: `${SITE_URL}/simulado`,
    siteName: 'ENEM Pro',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Simulado ENEM 2026 Grátis | ENEM Pro',
    description: 'Questões reais do INEP no formato simulado. Nota estimada ao final.',
  },
}

export default function SimuladoLayout({ children }: { children: React.ReactNode }) {
  return children
}
