/**
 * Utilitários de SEO - Meta tags, Schema, OpenGraph
 */

export interface SEOProps {
  title: string
  description: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product'
  author?: string
  publishedAt?: string
  updatedAt?: string
}

export function generateMetadata(props: SEOProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://enem-pro.com'

  return {
    title: `${props.title} — ENEM Pro`,
    description: props.description,
    keywords: props.keywords?.join(', '),
    openGraph: {
      title: props.title,
      description: props.description,
      url: props.url ? `${siteUrl}${props.url}` : siteUrl,
      siteName: 'ENEM Pro',
      images: [
        {
          url: props.image || `${siteUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: props.title,
        },
      ],
      type: props.type || 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: props.title,
      description: props.description,
      images: [props.image || `${siteUrl}/og-image.jpg`],
    },
  }
}

export function generateArticleSchema(props: SEOProps & { body: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: props.title,
    description: props.description,
    image: props.image,
    author: {
      '@type': 'Organization',
      name: props.author || 'ENEM Pro',
    },
    datePublished: props.publishedAt,
    dateModified: props.updatedAt || props.publishedAt,
  }
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
