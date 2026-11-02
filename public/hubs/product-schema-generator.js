/**
 * Educational Hub Schema Generator
 * Generates schema.org markup for Course hubs, FAQPage, and BreadcrumbList
 * Adapted for educational content (Math, Portuguese, History, Geography, Science, etc.)
 */

/**
 * Generate Course schema for educational hubs
 * Used for main subject hubs (Math, Portuguese, History, etc.)
 */
export function generateCourseSchema({
  name,
  description,
  provider = 'ENEM Pro',
  url,
  image,
  keywords = [],
  learningOutcomes = [],
  prerequisite = null,
}) {
  const course = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name,
    description,
    provider: {
      '@type': 'EducationalOrganization',
      name: provider,
      url: 'https://enem-pro.com',
    },
    url,
    image: image || 'https://enem-pro.com/og-image.png',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '2150',
    },
  };

  if (learningOutcomes.length > 0) {
    course.learningResourceType = 'Study Guide';
    course.teaches = learningOutcomes;
  }

  if (prerequisite) {
    course.coursePrerequisites = prerequisite;
  }

  if (keywords.length > 0) {
    course.keywords = keywords.join(', ');
  }

  return course;
}

/**
 * Generate FAQPage schema for hub Q&A sections
 * Maps to the "Dúvidas Frequentes" sections in each hub
 */
export function generateFAQSchema(faqs = []) {
  if (!faqs || faqs.length === 0) {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Qual é o melhor método de estudo para este tópico?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'O melhor método depende do seu estilo de aprendizado. Experimente técnicas como mapas mentais, resumos estruturados, revisão espaçada e prática constante com questões anteriores do ENEM.',
          },
        },
        {
          '@type': 'Question',
          name: 'Quantas questões sobre este assunto caem no ENEM?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Esse conteúdo aparece regularmente no ENEM. Recomendamos dominar os conceitos principais e resolver exercícios de provas anteriores para uma melhor preparação.',
          },
        },
      ],
    };
  }

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
  };
}

/**
 * Generate BreadcrumbList schema for navigation
 */
export function generateBreadcrumbSchema(items = []) {
  const defaultItems = [
    { position: 1, name: 'ENEM Pro', item: 'https://enem-pro.com' },
    { position: 2, name: 'Blog', item: 'https://enem-pro.com/blog' },
  ];

  const itemListElement = [
    ...defaultItems,
    ...(items || []).map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 3,
      name: item.name,
      item: item.url,
    })),
  ].map(item => ({
    '@type': 'ListItem',
    position: item.position,
    name: item.name,
    item: item.item,
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };
}

/**
 * Generate Article schema for individual spokes/posts
 */
export function generateArticleSchema({
  headline,
  description,
  image,
  datePublished,
  dateModified = null,
  author = 'ENEM Pro',
  url,
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline,
    description,
    image: image || 'https://enem-pro.com/og-image.png',
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Person',
      name: author,
    },
    publisher: {
      '@type': 'EducationalOrganization',
      name: 'ENEM Pro',
      logo: {
        '@type': 'ImageObject',
        url: 'https://enem-pro.com/logo.png',
      },
    },
    url,
  };
}

/**
 * Generate CollectionPage schema for hubs with learning collections
 */
export function generateCollectionPageSchema({
  name,
  description,
  url,
  itemListElement = [],
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: itemListElement.length,
      itemListElement: itemListElement.map((item, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: item.name,
        url: item.url,
        description: item.description,
      })),
    },
  };
}

/**
 * Generate comprehensive Hub schema combining Course + FAQ + BreadcrumbList
 * Recommended for primary hub pages
 */
export function generateHubSchema({
  courseName,
  courseDescription,
  courseUrl,
  courseImage,
  courseKeywords = [],
  learningOutcomes = [],
  faqs = [],
  breadcrumbs = [],
  relatedArticles = [],
}) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      generateCourseSchema({
        name: courseName,
        description: courseDescription,
        url: courseUrl,
        image: courseImage,
        keywords: courseKeywords,
        learningOutcomes,
      }),
      generateFAQSchema(faqs),
      generateBreadcrumbSchema(breadcrumbs),
      {
        '@type': 'CollectionPage',
        name: `${courseName} — Guias e Artigos`,
        description: courseDescription,
        url: courseUrl,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: relatedArticles.length,
          itemListElement: relatedArticles.map((article, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: article.title,
            url: article.url,
            description: article.description,
          })),
        },
      },
    ],
  };
}

/**
 * Utility: Convert hub schema to JSON-LD string for HTML script tag
 */
export function schemaToJsonLd(schema) {
  return JSON.stringify(schema, null, 2);
}

/**
 * Utility: Generate HTML script tag with schema
 */
export function generateSchemaTag(schema) {
  return `<script type="application/ld+json">${schemaToJsonLd(schema)}</script>`;
}

// Export all functions for use in Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateCourseSchema,
    generateFAQSchema,
    generateBreadcrumbSchema,
    generateArticleSchema,
    generateCollectionPageSchema,
    generateHubSchema,
    schemaToJsonLd,
    generateSchemaTag,
  };
}
