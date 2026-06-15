import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Questões ENEM 2009–2024 — Todas as Disciplinas | ENEM Pro',
  description: 'Pratique com mais de 3.600 questões reais do ENEM de 2009 a 2024. Filtre por ano e disciplina. Gabarito imediato e explicação por IA no Plano Pro.',
  alternates: { canonical: `${SITE_URL}/questoes` },
  openGraph: {
    title: 'Questões ENEM 2009–2024 | ENEM Pro',
    description: '3.600+ questões oficiais do INEP por ano e disciplina. Com gabarito e IA.',
    type: 'website',
    url: `${SITE_URL}/questoes`,
    siteName: 'ENEM Pro',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Questões ENEM 2009–2024 | ENEM Pro',
    description: '3.600+ questões oficiais do INEP por ano e disciplina.',
  },
}

export default function QuestoesLayout({ children }: { children: React.ReactNode }) {
  return children
}
