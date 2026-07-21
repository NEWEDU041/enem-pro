import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'
import { SITE_URL } from '@/lib/site-config'

const inter = Inter({ subsets: ['latin'], display: 'optional' })
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'optional',
  variable: '--font-space-grotesk',
  weight: ['500', '600', '700'],
})

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
    { '@type': 'Offer', price: '29.90', priceCurrency: 'BRL', name: 'Plano Pro — questões ilimitadas + IA' },
  ],
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'ENEM Pro',
  url: siteUrl,
  description: 'Todas as questões do ENEM de 2009 a 2024 com gabarito e explicação por IA.',
  inLanguage: 'pt-BR',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${siteUrl}/questoes?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'ENEM Pro — Questões reais + IA que explica cada resposta',
    template: '%s | ENEM Pro',
  },
  description: 'Todas as questões do ENEM de 2009 a 2024. Responda, veja o gabarito e entenda o porquê com explicação gerada por IA. Grátis (10/dia) ou Pro R$29,90/mês.',
  keywords: ['ENEM', 'questões ENEM', 'simulado ENEM', 'gabarito ENEM', 'preparatório ENEM 2026', 'questões com resolução'],
  openGraph: {
    title: 'ENEM Pro — Questões reais + IA que explica cada resposta',
    description: 'Todas as questões do ENEM de 2009 a 2024 com explicação por IA. Grátis (10/dia) ou Pro R$29,90/mês.',
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
  verification: { google: 'ILUISrN9vOLJmh_XVEaBC1WXTiOCVh_4laEFxk7v6Eg' },
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

        {/* Google Analytics 4 */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', { page_path: window.location.pathname });
            ` }} />
          </>
        )}

        {/* Meta Pixel */}
        {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
          <Script id="meta-pixel" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
            fbq('track', 'PageView');
          ` }} />
        )}

        {/* Microsoft Clarity */}
        {process.env.NEXT_PUBLIC_CLARITY_ID && (
          <Script id="ms-clarity" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `
            (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","${process.env.NEXT_PUBLIC_CLARITY_ID}");
          ` }} />
        )}
      </head>
      <body className={`${inter.className} ${spaceGrotesk.variable} min-h-full bg-zinc-50 text-zinc-900 antialiased`}>
        <Script
          id="educational-org-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(educationalOrgSchema) }}
        />
        <Script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  )
}
