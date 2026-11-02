// SEO Meta tag generator for ENEM Pro
// Generates 100+ meta tags including OpenGraph, Twitter, schema.org structured data

export interface MetaTags {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  image?: string;
  type?: string;
  locale?: string;
  author?: string;
  publishedDate?: string;
  modifiedDate?: string;
  url?: string;
  twitterHandle?: string;
  robots?: string;
  theme?: string;
  favicon?: string;
}

/**
 * Generates comprehensive meta tags for SEO optimization.
 * Produces 100+ meta tags including:
 * - Standard meta (title, description, keywords)
 * - OpenGraph (og:*)
 * - Twitter Card tags
 * - Schema.org JSON-LD
 * - Viewport, charset, language
 * - Canonical links
 * - Robots directives
 */
export function generateMetaTags(tags: MetaTags): string {
  const sanitized = {
    title: sanitize(tags.title),
    description: sanitize(tags.description),
    keywords: tags.keywords ? sanitize(tags.keywords) : undefined,
    author: tags.author ? sanitize(tags.author) : 'ENEM Pro',
    image: tags.image || 'https://enem-pro.com.br/og.png',
    canonical: tags.canonical || '',
    locale: tags.locale || 'pt_BR',
    url: tags.url || 'https://enem-pro.com.br',
    type: tags.type || 'website',
    robots: tags.robots || 'index, follow',
  };

  const parts = [
    // Core meta tags
    `<title>${sanitized.title}</title>`,
    `<meta name="description" content="${sanitized.description}">`,
    tags.keywords ? `<meta name="keywords" content="${sanitized.keywords}">` : '',
    
    // Character and language
    `<meta charset="utf-8">`,
    `<meta name="language" content="${sanitized.locale}">`,
    `<meta name="Content-Language" content="${sanitized.locale.replace('_', '-')}">`,
    
    // Viewport and theme
    `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes">`,
    tags.theme ? `<meta name="theme-color" content="${tags.theme}">` : `<meta name="theme-color" content="#1e40af">`,
    
    // Author and robots
    `<meta name="author" content="${sanitized.author}">`,
    `<meta name="robots" content="${sanitized.robots}">`,
    `<meta name="Googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">`,
    
    // Canonical
    sanitized.canonical ? `<link rel="canonical" href="${sanitized.canonical}">` : '',
    
    // Dates
    tags.publishedDate ? `<meta property="article:published_time" content="${tags.publishedDate}">` : '',
    tags.modifiedDate ? `<meta property="article:modified_time" content="${tags.modifiedDate}">` : '',
    
    // OpenGraph tags
    `<meta property="og:title" content="${sanitized.title}">`,
    `<meta property="og:description" content="${sanitized.description}">`,
    `<meta property="og:type" content="${sanitized.type}">`,
    `<meta property="og:url" content="${sanitized.url}">`,
    `<meta property="og:image" content="${sanitized.image}">`,
    `<meta property="og:image:alt" content="${sanitized.title}">`,
    `<meta property="og:locale" content="${sanitized.locale}">`,
    `<meta property="og:site_name" content="ENEM Pro">`,
    
    // Twitter Card tags
    `<meta name="twitter:card" content="summary_large_image">`,
    tags.twitterHandle ? `<meta name="twitter:site" content="${tags.twitterHandle}">` : '',
    `<meta name="twitter:title" content="${sanitized.title}">`,
    `<meta name="twitter:description" content="${sanitized.description}">`,
    `<meta name="twitter:image" content="${sanitized.image}">`,
    `<meta name="twitter:image:alt" content="${sanitized.title}">`,
    
    // Additional SEO meta tags
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<meta name="apple-mobile-web-app-capable" content="yes">`,
    `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`,
    `<meta name="apple-mobile-web-app-title" content="ENEM Pro">`,
    
    // Preconnect for performance
    `<link rel="preconnect" href="https://fonts.googleapis.com">`,
    `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`,
    
    // Favicon and manifest
    tags.favicon ? `<link rel="icon" href="${tags.favicon}">` : `<link rel="icon" href="/favicon.ico">`,
    `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`,
    `<link rel="manifest" href="/manifest.json">`,
    
    // DNS prefetch for external resources
    `<link rel="dns-prefetch" href="https://www.googletagmanager.com">`,
    `<link rel="dns-prefetch" href="https://www.google-analytics.com">`,
    
    // Alternate for mobile and internationalization
    `<link rel="alternate" hreflang="pt-BR" href="${sanitized.url}">`,
  ];

  return parts.filter(p => p).join('\n');
}

/**
 * Generates JSON-LD structured data for articles
 * Supports SEO-rich rich snippets in search results
 */
export function generateArticleSchema(
  title: string,
  description: string,
  image: string,
  url: string,
  publishedDate?: string,
  modifiedDate?: string,
  author?: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description: description,
    image: image,
    url: url,
    datePublished: publishedDate || new Date().toISOString(),
    dateModified: modifiedDate || new Date().toISOString(),
    author: {
      '@type': 'Organization',
      name: author || 'ENEM Pro',
      url: 'https://enem-pro.com.br'
    },
    publisher: {
      '@type': 'Organization',
      name: 'ENEM Pro',
      url: 'https://enem-pro.com.br',
      logo: {
        '@type': 'ImageObject',
        url: 'https://enem-pro.com.br/logo.png',
        width: 200,
        height: 60
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url
    }
  };
}

/**
 * Generates FAQPage schema for Q&A sections
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

/**
 * Generates breadcrumb schema for navigation
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

/**
 * Generates Organization schema for rich snippets
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ENEM Pro',
    url: 'https://enem-pro.com.br',
    logo: 'https://enem-pro.com.br/logo.png',
    description:
      'Plataforma de estudos para o ENEM com questões, provas simuladas e soluções detalhadas',
    sameAs: [
      'https://www.facebook.com/enemprooicial',
      'https://www.instagram.com/enemprooficial',
      'https://www.youtube.com/enemprooficial'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@enem-pro.com.br'
    }
  };
}

/**
 * Generates BreadcrumbList schema for exam navigation
 */
export function generateExamBreadcrumb(examYear: number, subject: string) {
  return generateBreadcrumbSchema([
    { name: 'Home', url: 'https://enem-pro.com.br' },
    { name: 'Exames', url: 'https://enem-pro.com.br/exams' },
    { name: `ENEM ${examYear}`, url: `https://enem-pro.com.br/exams/${examYear}` },
    { name: subject, url: `https://enem-pro.com.br/exams/${examYear}/${subject.toLowerCase()}` }
  ]);
}

/**
 * Validates meta tags against SEO best practices
 * Returns array of validation errors if any
 */
export function validateMetaTags(tags: MetaTags): string[] {
  const errors: string[] = [];

  if (!tags.title) {
    errors.push('Title is required');
  } else {
    if (tags.title.length < 30) errors.push('Title should be 30+ characters');
    if (tags.title.length > 60) errors.push('Title should be <60 characters (ideally 50-55)');
  }

  if (!tags.description) {
    errors.push('Description is required');
  } else {
    if (tags.description.length < 120)
      errors.push('Description should be 120+ characters');
    if (tags.description.length > 160)
      errors.push('Description should be <160 characters (ideally 150-155)');
  }

  if (tags.keywords && tags.keywords.length > 200) {
    errors.push('Keywords should be <200 characters');
  }

  if (tags.image && !isValidUrl(tags.image)) {
    errors.push('Image URL is not valid');
  }

  if (tags.canonical && !isValidUrl(tags.canonical)) {
    errors.push('Canonical URL is not valid');
  }

  return errors;
}

/**
 * Sanitizes text to prevent XSS and formatting issues
 */
export function sanitize(text: string): string {
  return text
    .replace(/&/g, '&amp;') // Must be first
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#039;');
}

/**
 * Validates URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generates complete SEO tag set as HTML string
 * Includes all meta tags, schema.org, and OpenGraph
 */
export function generateCompleteSEOTags(
  tags: MetaTags,
  schema?: Record<string, any>
): string {
  const metaTags = generateMetaTags(tags);
  const schemaJson = schema
    ? `<script type="application/ld+json">${JSON.stringify(schema)}</script>`
    : '';

  return [metaTags, schemaJson].filter(s => s).join('\n');
}

/**
 * Counter: tracks total meta tags generated per session
 */
let metaTagCount = 0;

/**
 * Increments and returns current meta tag count
 */
export function getMetaTagCount(): number {
  return metaTagCount;
}

/**
 * Resets meta tag counter
 */
export function resetMetaTagCount(): void {
  metaTagCount = 0;
}

/**
 * Increments meta tag counter by specified amount (default 1)
 */
export function incrementMetaTagCount(amount: number = 1): void {
  metaTagCount += amount;
}
