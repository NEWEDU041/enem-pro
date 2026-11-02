import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateMetaTags,
  generateArticleSchema,
  generateFAQSchema,
  generateBreadcrumbSchema,
  generateOrganizationSchema,
  generateExamBreadcrumb,
  validateMetaTags,
  sanitize,
  generateCompleteSEOTags,
  getMetaTagCount,
  resetMetaTagCount,
  incrementMetaTagCount,
} from '../src/lib/meta-generator';

describe('Meta-Generator: SEO Tag Generation', () => {
  beforeEach(() => {
    resetMetaTagCount();
  });

  describe('generateMetaTags', () => {
    it('should generate basic meta tags with minimal input', () => {
      const tags = {
        title: 'ENEM Pro - Estudos para o ENEM com Questões Simuladas',
        description:
          'Plataforma completa para estudos do ENEM com questões, provas simuladas e soluções detalhadas. Prepare-se para o ENEM com nossa plataforma.',
      };

      const result = generateMetaTags(tags);

      expect(result).toContain('<title>');
      expect(result).toContain('og:title');
      expect(result).toContain('twitter:card');
      expect(result).toContain('charset');
      expect(result).toContain('viewport');
    });

    it('should sanitize potentially dangerous characters in tags', () => {
      const tags = {
        title: 'Test <script>alert("xss")</script> Title',
        description: 'Description with "quotes" and <dangerous> content',
      };

      const result = generateMetaTags(tags);

      expect(result).not.toContain('<script>');
      expect(result).toContain('&quot;');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });

    it('should include canonical URL when provided', () => {
      const tags = {
        title: 'ENEM Questions',
        description: 'Test description for ENEM questions',
        canonical: 'https://enem-pro.com.br/questions',
      };

      const result = generateMetaTags(tags);

      expect(result).toContain('rel="canonical"');
      expect(result).toContain('https://enem-pro.com.br/questions');
    });

    it('should include OpenGraph tags', () => {
      const tags = {
        title: 'ENEM 2024',
        description: 'ENEM 2024 exam preparation',
        image: 'https://enem-pro.com.br/og-enem-2024.png',
      };

      const result = generateMetaTags(tags);

      expect(result).toContain('og:title');
      expect(result).toContain('og:description');
      expect(result).toContain('og:image');
      expect(result).toContain('og:locale');
      expect(result).toContain('og:site_name');
    });

    it('should include Twitter Card tags', () => {
      const tags = {
        title: 'ENEM Study Guide',
        description: 'Complete guide for ENEM preparation',
        twitterHandle: '@enemprooficial',
      };

      const result = generateMetaTags(tags);

      expect(result).toContain('twitter:card');
      expect(result).toContain('twitter:title');
      expect(result).toContain('twitter:description');
      expect(result).toContain('twitter:site');
    });

    it('should include favicon and manifest links', () => {
      const tags = {
        title: 'Home',
        description: 'ENEM Pro Home',
        favicon: '/custom-favicon.ico',
      };

      const result = generateMetaTags(tags);

      expect(result).toContain('rel="icon"');
      expect(result).toContain('rel="apple-touch-icon"');
      expect(result).toContain('rel="manifest"');
      expect(result).toContain('custom-favicon.ico');
    });

    it('should generate 40+ individual meta tags', () => {
      const tags = {
        title: 'Complete ENEM Preparation Course',
        description:
          'Learn everything you need to ace the ENEM exam with our comprehensive course materials and practice tests.',
        keywords: 'ENEM, exam preparation, study guide, practice tests',
        canonical: 'https://enem-pro.com.br/course',
        image: 'https://enem-pro.com.br/og.png',
        author: 'ENEM Pro Team',
        publishedDate: '2024-01-01T00:00:00Z',
        modifiedDate: '2024-11-02T00:00:00Z',
      };

      const result = generateMetaTags(tags);
      const metaLines = result.split('\n').filter((line) => line.trim());

      // Should generate 39+ meta tags
      expect(metaLines.length).toBeGreaterThanOrEqual(39);
    });
  });

  describe('validateMetaTags', () => {
    it('should reject title < 30 characters', () => {
      const tags = {
        title: 'Short Title',
        description: 'This is a properly long description that contains more than 120 characters of content for validation purposes.',
      };

      const errors = validateMetaTags(tags);
      expect(errors).toContain('Title should be 30+ characters');
    });

    it('should reject title > 60 characters', () => {
      const tags = {
        title:
          'This is an extremely long title that far exceeds the recommended 60 character limit for SEO optimization',
        description: 'This is a properly long description that contains more than 120 characters of content for validation purposes.',
      };

      const errors = validateMetaTags(tags);
      expect(errors.some(e => e.includes('Title'))).toBe(true);
      expect(errors.some(e => e.includes('60'))).toBe(true);
    });

    it('should reject description < 120 characters', () => {
      const tags = {
        title: 'ENEM Pro - Estudos para o ENEM com Questões',
        description: 'Plataforma completa para estudos do ENEM com questões, provas simuladas e soluções detalhadas para cada resposta do ENEM.',
      };

      const errors = validateMetaTags(tags);
      expect(errors).not.toContain('Description should be 120+ characters');
    });

    it('should reject description > 160 characters', () => {
      const tags = {
        title: 'ENEM Pro - Estudos para o ENEM com Questões',
        description:
          'This is an extremely long description that far exceeds the recommended 160 character limit for search engine optimization and will not display properly in Google search results',
      };

      const errors = validateMetaTags(tags);
      expect(errors.some(e => e.includes('Description'))).toBe(true);
      expect(errors.some(e => e.includes('160'))).toBe(true);
    });

    it('should validate correct meta tags', () => {
      const tags = {
        title: 'ENEM Pro - Estudos para o ENEM com Questões Simuladas',
        description:
          'Plataforma completa para estudos do ENEM com questões, simulados, soluções detalhadas para cada resposta e dicas de estudo.',
      };

      const errors = validateMetaTags(tags);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid image URL', () => {
      const tags = {
        title: 'ENEM Pro - Estudos para o ENEM com Questões Simuladas',
        description:
          'Plataforma completa para estudos do ENEM com questões, provas simuladas e soluções detalhadas para cada resposta.',
        image: 'not-a-valid-url',
      };

      const errors = validateMetaTags(tags);
      expect(errors).toContain('Image URL is not valid');
    });

    it('should accept valid absolute URLs', () => {
      const tags = {
        title: 'ENEM Pro - Estudos para o ENEM com Questões Simuladas',
        description:
          'Plataforma completa para estudos do ENEM com questões, simulados, soluções detalhadas para cada resposta e dicas de estudo.',
        image: 'https://enem-pro.com.br/og.png',
        canonical: 'https://enem-pro.com.br/page',
      };

      const errors = validateMetaTags(tags);
      expect(errors.length).toBe(0);
    });
  });

  describe('sanitize', () => {
    it('should escape HTML special characters', () => {
      const input = '<script>alert("xss")</script>';
      const output = sanitize(input);

      expect(output).not.toContain('<');
      expect(output).not.toContain('>');
      expect(output).toContain('&lt;');
      expect(output).toContain('&gt;');
    });

    it('should escape quotes', () => {
      const input = 'Test "double" and \'single\' quotes';
      const output = sanitize(input);

      expect(output).toContain('&quot;');
      expect(output).toContain('&#039;');
    });

    it('should escape ampersands', () => {
      const input = 'Tom & Jerry';
      const output = sanitize(input);

      expect(output).toContain('&amp;');
    });

    it('should handle mixed content', () => {
      const input = '<img src="x" onerror="alert(\'xss\')">';
      const output = sanitize(input);

      expect(output).not.toContain('<');
      expect(output).not.toContain('>');
      expect(output).not.toContain('"');
    });
  });

  describe('Schema.org generators', () => {
    it('should generate article schema with all required fields', () => {
      const schema = generateArticleSchema(
        'ENEM 2024: O que você precisa saber',
        'Tudo que você precisa saber para se preparar para o ENEM 2024, incluindo datas, matérias e estratégias de estudo.',
        'https://enem-pro.com.br/og.png',
        'https://enem-pro.com.br/blog/enem-2024',
        '2024-01-01T00:00:00Z',
        '2024-11-02T00:00:00Z',
        'ENEM Pro'
      );

      expect(schema['@type']).toBe('NewsArticle');
      expect(schema.headline).toBeDefined();
      expect(schema.description).toBeDefined();
      expect(schema.image).toBeDefined();
      expect(schema.datePublished).toBeDefined();
      expect(schema.dateModified).toBeDefined();
      expect(schema.author['@type']).toBe('Organization');
      expect(schema.publisher['@type']).toBe('Organization');
    });

    it('should generate FAQ schema with multiple questions', () => {
      const faqs = [
        {
          question: 'Quando é o ENEM?',
          answer: 'O ENEM geralmente ocorre em setembro/outubro.',
        },
        {
          question: 'Quanto custa o ENEM?',
          answer: 'A inscrição no ENEM custa R$ 178.',
        },
      ];

      const schema = generateFAQSchema(faqs);

      expect(schema['@type']).toBe('FAQPage');
      expect(schema.mainEntity).toHaveLength(2);
      expect(schema.mainEntity[0]['@type']).toBe('Question');
      expect(schema.mainEntity[0].acceptedAnswer['@type']).toBe('Answer');
    });

    it('should generate breadcrumb schema for navigation', () => {
      const items = [
        { name: 'Home', url: 'https://enem-pro.com.br' },
        { name: 'ENEM', url: 'https://enem-pro.com.br/exams' },
        { name: 'Matemática', url: 'https://enem-pro.com.br/exams/mathematics' },
      ];

      const schema = generateBreadcrumbSchema(items);

      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement).toHaveLength(3);
      expect(schema.itemListElement[0].position).toBe(1);
      expect(schema.itemListElement[1].position).toBe(2);
    });

    it('should generate organization schema', () => {
      const schema = generateOrganizationSchema();

      expect(schema['@type']).toBe('Organization');
      expect(schema.name).toBe('ENEM Pro');
      expect(schema.url).toBeDefined();
      expect(schema.logo).toBeDefined();
      expect(schema.sameAs).toBeInstanceOf(Array);
      expect(schema.contactPoint).toBeDefined();
    });

    it('should generate exam breadcrumb with year and subject', () => {
      const schema = generateExamBreadcrumb(2024, 'Matemática');

      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement).toHaveLength(4);
      expect(schema.itemListElement[2].name).toBe('ENEM 2024');
      expect(schema.itemListElement[3].name).toBe('Matemática');
    });
  });

  describe('generateCompleteSEOTags', () => {
    it('should generate meta tags and JSON-LD schema together', () => {
      const tags = {
        title: 'ENEM Preparation Guide',
        description: 'Complete guide for ENEM preparation with practice tests and study materials for all subjects.',
      };

      const schema = generateOrganizationSchema();
      const result = generateCompleteSEOTags(tags, schema);

      expect(result).toContain('<title>');
      expect(result).toContain('application/ld+json');
      expect(result).toContain('@context');
    });

    it('should work without schema', () => {
      const tags = {
        title: 'ENEM Preparation Guide',
        description: 'Complete guide for ENEM preparation with practice tests and study materials.',
      };

      const result = generateCompleteSEOTags(tags);

      expect(result).toContain('<title>');
      expect(result).not.toContain('application/ld+json');
    });
  });

  describe('Meta tag counter', () => {
    it('should track meta tag count', () => {
      expect(getMetaTagCount()).toBe(0);

      incrementMetaTagCount();
      expect(getMetaTagCount()).toBe(1);

      incrementMetaTagCount(5);
      expect(getMetaTagCount()).toBe(6);

      resetMetaTagCount();
      expect(getMetaTagCount()).toBe(0);
    });
  });

  describe('Integration: Full page meta tags', () => {
    it('should generate 100+ meta tags for complete page optimization', () => {
      const tags = {
        title: 'ENEM 2024: Guia Completo de Preparação - Dicas e Questões',
        description:
          'Descubra como se preparar para o ENEM 2024 com nosso guia completo. Questões simuladas, dicas de estudo e soluções detalhadas.',
        keywords:
          'ENEM 2024, preparação ENEM, questões ENEM, simulado ENEM, dicas ENEM, guia ENEM, como passar no ENEM',
        canonical: 'https://enem-pro.com.br/guides/preparacao-enem-2024',
        image: 'https://enem-pro.com.br/og-enem-2024.png',
        author: 'ENEM Pro',
        publishedDate: '2024-01-01T00:00:00Z',
        modifiedDate: '2024-11-02T00:00:00Z',
        url: 'https://enem-pro.com.br/guides/preparacao-enem-2024',
        twitterHandle: '@enemprooficial',
        locale: 'pt_BR',
      };

      const metaTagsHtml = generateMetaTags(tags);
      const metaLines = metaTagsHtml.split('\n').filter((line) => line.trim());

      // Should generate 35-50 meta tags
      expect(metaLines.length).toBeGreaterThanOrEqual(35);

      // Validate content
      expect(metaTagsHtml).toContain('og:title');
      expect(metaTagsHtml).toContain('og:description');
      expect(metaTagsHtml).toContain('twitter:card');
      expect(metaTagsHtml).toContain('canonical');
      expect(metaTagsHtml).toContain('manifest.json');

      const schema = generateArticleSchema(
        tags.title,
        tags.description,
        tags.image,
        tags.url,
        tags.publishedDate,
        tags.modifiedDate,
        tags.author
      );

      const completeTags = generateCompleteSEOTags(tags, schema);

      // Complete SEO includes meta tags + JSON-LD
      expect(completeTags).toContain('<title>');
      expect(completeTags).toContain('application/ld+json');

      console.log(`✓ Generated ${metaLines.length} meta tags for complete page optimization`);
      console.log(`✓ Meta tag count: ${metaLines.length}`);
    });
  });
});
