import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'
import { SITE_URL } from '@/lib/site-config'

const inter = Inter({ subsets: ['latin'], display: 'optional' })

const siteUrl = SITE_URL

const educationalOrgSchema = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'ENEM Pro',
  url: siteUrl,
  description: 'Plataforma de preparação para o ENEM com questões reais do INEP e explicações geradas por IA.',
  sameAs: [siteUrl],
  offers: [
    { '@type': 'Offer', price: '0', priceCurrency: 'BRL', name: 'Plano Grátis — 10 questões/dia' },
    { '@type': 'Offer', price: '14.90', priceCurrency: 'BRL', name: 'Plano Pro — questões ilimitadas + IA' },
  ],
}

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
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'ENEM Pro — Questões reais do ENEM com IA' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ENEM Pro — Questões reais + IA',
    description: 'Estude ENEM com questões reais de 2009 a 2024 e explicações geradas por IA.',
    images: ['/opengraph-image'],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
  alternates: { canonical: siteUrl },
}

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <head>
        <link rel="preconnect" href="https://api.enem.dev" />
        <link rel="preconnect" href="https://lxlwajmzwvqwimuvvsrb.supabase.co" />
        <link rel="dns-prefetch" href="https://api.enem.dev" />
      </head>
      <body className={`${inter.className} min-h-full bg-zinc-50 text-zinc-900 antialiased`}>
        <Script
          id="educational-org-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(educationalOrgSchema) }}
        />
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  )
}
