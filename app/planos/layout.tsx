import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Planos e Preços — ENEM Pro | Questões Ilimitadas + IA',
  description: 'Assine o ENEM Pro e acesse questões ilimitadas do ENEM 2009–2024 com explicação por IA em cada resposta. Plano Pro por R$14,90/mês. Cancele quando quiser.',
  alternates: { canonical: `${SITE_URL}/planos` },
  openGraph: {
    title: 'Planos ENEM Pro — Pro R$14,90/mês',
    description: 'Questões ilimitadas + IA explica cada resposta errada. Cancele quando quiser.',
    type: 'website',
    url: `${SITE_URL}/planos`,
    siteName: 'ENEM Pro',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planos ENEM Pro — Pro R$14,90/mês',
    description: 'Questões ilimitadas + IA explica cada resposta errada.',
  },
}

export default function PlanosLayout({ children }: { children: React.ReactNode }) {
  return children
}
