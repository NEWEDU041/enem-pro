
// lib/seo-batch-updates.ts
/**
 * SEO Batch Update System for 411 existing blog posts
 * Automates schema markup, meta tags, internal linking
 */

export interface SEOUpdateBatch {
  postId: string;
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  category: string;
  updates: {
    schema: object;
    metaTags: Record<string, string>;
    internalLinks: Array<{url: string, anchor: string}>;
    canonicalUrl: string;
    ogTags: Record<string, string>;
  };
}

export async function generateSEOBatch(post: any): Promise<SEOUpdateBatch> {
  return {
    postId: post.id,
    slug: post.slug,
    title: post.title,
    description: post.description || `Aprenda sobre ${post.title} para o ENEM`,
    keywords: extractKeywords(post.title, post.category),
    category: post.category,
    updates: {
      schema: generateBlogSchema(post),
      metaTags: generateMetaTags(post),
      internalLinks: generateInternalLinks(post),
      canonicalUrl: `https://enem-pro.vercel.app/blog/${post.slug}`,
      ogTags: {
        'og:title': post.title,
        'og:description': post.description || `Aprenda ${post.title}`,
        'og:type': 'article',
        'og:url': `https://enem-pro.vercel.app/blog/${post.slug}`,
        'og:image': post.image || 'https://enem-pro.vercel.app/og-image.jpg',
        'twitter:card': 'summary_large_image',
        'twitter:title': post.title,
        'twitter:description': post.description || `Aprenda ${post.title}`,
        'twitter:image': post.image || 'https://enem-pro.vercel.app/og-image.jpg'
      }
    }
  };
}

function extractKeywords(title: string, category: string): string[] {
  const categoryKeywords = {
    'Biologia': ['biologia', 'células', 'evolução', 'corpo humano'],
    'História': ['história', 'brasil', 'política'],
    'Física': ['física', 'movimento', 'energia'],
    'Química': ['química', 'átomos', 'reações'],
    'Matemática': ['matemática', 'cálculo', 'geometria'],
    'Português': ['português', 'literatura', 'linguagem'],
    'Redação': ['redação', 'escrita', 'argumentação'],
  };
  
  const words = title.toLowerCase().split(' ');
  const keywords = [...(categoryKeywords[category] || []), ...words];
  return [...new Set(keywords)].slice(0, 10);
}

function generateBlogSchema(post: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': post.title,
    'description': post.description,
    'image': post.image || 'https://enem-pro.vercel.app/og-image.jpg',
    'author': {
      '@type': 'Organization',
      'name': 'ENEM-Pro',
      'url': 'https://enem-pro.vercel.app'
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'ENEM-Pro',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://enem-pro.vercel.app/logo.png'
      }
    },
    'datePublished': post.datePublished || new Date().toISOString(),
    'dateModified': new Date().toISOString(),
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `https://enem-pro.vercel.app/blog/${post.slug}`
    },
    'inLanguage': 'pt-BR',
    'keywords': extractKeywords(post.title, post.category).join(', ')
  };
}

function generateMetaTags(post: any) {
  return {
    'title': `${post.title} | ENEM-Pro`,
    'description': post.description || `Aprenda sobre ${post.title}. Prepare-se para o ENEM com conteúdo completo e exercícios.`,
    'keywords': extractKeywords(post.title, post.category).join(', '),
    'author': 'ENEM-Pro',
    'viewport': 'width=device-width, initial-scale=1.0',
    'charset': 'UTF-8',
    'robots': 'index, follow'
  };
}

function generateInternalLinks(post: any): Array<{url: string, anchor: string}> {
  // Generate 3-5 internal links based on category
  const relatedTopics = {
    'Biologia': ['genética', 'evolução', 'ecologia', 'corpo humano'],
    'História': ['brasil', 'política', 'sociedade', 'independência'],
    'Física': ['mecânica', 'energia', 'movimento', 'ondas'],
    'Química': ['átomos', 'reações', 'ligações', 'soluções'],
    'Matemática': ['cálculo', 'geometria', 'álgebra', 'funções'],
    'Português': ['literatura', 'gramática', 'leitura', 'escrita'],
    'Redação': ['argumentação', 'estrutura', 'coesão', 'tese'],
  };
  
  const topics = relatedTopics[post.category] || [];
  return topics.slice(0, 3).map(topic => ({
    url: `/blog/${topic.replace(/\s+/g, '-')}-enem`,
    anchor: `${topic} no ENEM`
  }));
}

export async function applyBatchUpdates(posts: any[], delay: number = 100) {
  const results = [];
  
  for (const post of posts) {
    const batch = await generateSEOBatch(post);
    results.push(batch);
    
    // Stagger requests
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  return results;
}
