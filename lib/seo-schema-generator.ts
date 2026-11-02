
// lib/seo-schema-generator.ts
export interface BlogPostSchema {
  title: string;
  slug: string;
  description: string;
  image?: string;
  author?: string;
  datePublished?: string;
  dateModified?: string;
  category?: string;
}

export function generateBlogPostingSchema(post: BlogPostSchema) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': post.title,
    'description': post.description,
    'image': post.image || 'https://enem-pro.vercel.app/og-image.jpg',
    'author': {
      '@type': 'Organization',
      'name': post.author || 'ENEM-Pro',
    },
    'datePublished': post.datePublished || new Date().toISOString(),
    'dateModified': post.dateModified || new Date().toISOString(),
    'url': `https://enem-pro.vercel.app/blog/${post.slug}`,
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `https://enem-pro.vercel.app/blog/${post.slug}`
    },
    'isPartOf': {
      '@type': 'WebSite',
      'name': 'ENEM-Pro',
      'url': 'https://enem-pro.vercel.app'
    },
    'inLanguage': 'pt-BR'
  };
}

export function generateFAQSchema(questions: Array<{q: string, a: string}>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': questions.map(qa => ({
      '@type': 'Question',
      'name': qa.q,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': qa.a
      }
    }))
  };
}

export function generateBreadcrumbSchema(items: Array<{name: string, url: string}>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, idx) => ({
      '@type': 'ListItem',
      'position': idx + 1,
      'name': item.name,
      'item': item.url
    }))
  };
}
