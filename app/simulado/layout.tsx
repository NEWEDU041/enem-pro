import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Simulado ENEM 2026 Grátis — Questões Reais do INEP | ENEM Pro',
  description: 'Faça um simulado do ENEM com questões reais do INEP. Escolha disciplina, quantidade de questões e receba sua nota estimada com curva TRI ao final.',
  alternates: { canonical: `${SITE_URL}/simulado` },
  openGraph: {
    title: 'Simulado ENEM 2026 — Questões Reais do INEP',
    description: 'Simulado grátis do ENEM com questões oficiais. Nota estimada com TRI.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Simulado ENEM 2026 Grátis',
    description: 'Questões reais do INEP. Nota estimada com TRI ao final.',
  },
}

export default function SimuladoLayout({ children }: { children: React.ReactNode }) {
  return children
}
