import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Cronograma de Estudos ENEM 2026 — Monte Seu Plano Grátis',
  description: 'Crie seu cronograma personalizado de estudos para o ENEM 2026. Configure disciplinas, dias disponíveis e metas de questões. Plano semana a semana até a prova.',
  alternates: { canonical: `${SITE_URL}/cronograma` },
  openGraph: {
    title: 'Cronograma de Estudos ENEM 2026 | ENEM Pro',
    description: 'Monte seu plano de estudos personalizado para o ENEM com cronograma semana a semana.',
    type: 'website',
    url: `${SITE_URL}/cronograma`,
    siteName: 'ENEM Pro',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cronograma de Estudos ENEM 2026 | ENEM Pro',
    description: 'Monte seu plano de estudos personalizado para o ENEM.',
  },
}

export default function CronogramaLayout({ children }: { children: React.ReactNode }) {
  return children
}
