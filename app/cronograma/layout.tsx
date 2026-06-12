import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Cronograma de Estudos ENEM 2026 — Monte o Seu Grátis | ENEM Pro',
  description: 'Crie seu cronograma personalizado de estudos para o ENEM 2026. Escolha disciplinas, dias da semana e intensidade. Gerado automaticamente com base na data da prova.',
  alternates: { canonical: `${SITE_URL}/cronograma` },
  openGraph: {
    title: 'Cronograma de Estudos ENEM 2026 — Monte o Seu Grátis',
    description: 'Cronograma personalizado para o ENEM 2026. Configure disciplinas e disponibilidade.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cronograma de Estudos ENEM 2026',
    description: 'Monte seu cronograma personalizado de estudos para o ENEM.',
  },
}

export default function CronogramaLayout({ children }: { children: React.ReactNode }) {
  return children
}
