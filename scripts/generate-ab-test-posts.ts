#!/usr/bin/env tsx
/**
 * Generate A/B test posts for a project
 * Creates 50 posts with 3 tone variants each (baseline, professional, casual)
 * 
 * Usage: npx tsx scripts/generate-ab-test-posts.ts
 */

import { promises as fs } from 'fs';
import path from 'path';

const VARIANTS = ['baseline', 'professional', 'casual'];

interface TestPost {
  id: string;
  slug: string;
  title: {
    baseline: string;
    professional: string;
    casual: string;
  };
  excerpt: {
    baseline: string;
    professional: string;
    casual: string;
  };
  content: {
    baseline: string;
    professional: string;
    casual: string;
  };
  testId: string;
  createdAt: string;
}

// Sample post templates with tone variants
const postTemplates = [
  {
    topic: 'Estratégias de estudo para ENEM',
    baselineTitle: 'Como estudar para o ENEM',
    professionalTitle: 'Estratégias Comprovadas de Estudo para o ENEM',
    casualTitle: 'Dicas incríveis pra estudar pra prova do ENEM',
    baselineExcerpt: 'Aprenda técnicas eficazes para melhorar seu desempenho no ENEM.',
    professionalExcerpt: 'Metodologia científica para otimizar seu tempo de estudo e maximizar resultados no ENEM.',
    casualExcerpt: 'Vem ver como ficar craque no ENEM com essas estratégias maneiras.',
  },
  {
    topic: 'Dicas de redação para ENEM',
    baselineTitle: 'Melhorando sua redação para o ENEM',
    professionalTitle: 'Redação ENEM: Estrutura e Técnicas de Argumentação',
    casualTitle: 'Escreva uma redação bomba pro ENEM em 5 passos',
    baselineExcerpt: 'Dicas práticas para melhorar a qualidade da sua redação no ENEM.',
    professionalExcerpt: 'Análise profunda das competências e critérios de avaliação da redação no ENEM.',
    casualExcerpt: 'Descubra como mandar bem na redação e bombar sua nota!',
  },
  {
    topic: 'Gerenciamento de tempo no ENEM',
    baselineTitle: 'Organize seu tempo no ENEM',
    professionalTitle: 'Otimização de Tempo: Estratégia Comprovada para o ENEM',
    casualTitle: 'Não perca tempo: administre as horas da prova do ENEM como um pro',
    baselineExcerpt: 'Saiba como distribuir seu tempo adequadamente durante a prova.',
    professionalExcerpt: 'Análise estatística de distribuição de tempo dos melhores candidatos do ENEM.',
    casualExcerpt: 'Aprenda o truque secreto dos candidatos top do ENEM sobre tempo!',
  },
];

function generatePostContent(variant: string, topic: string): string {
  if (variant === 'baseline') {
    return `Este é um artigo sobre ${topic}. Contém informações relevantes e úteis para estudantes do ENEM.`;
  } else if (variant === 'professional') {
    return `Análise detalhada e baseada em dados sobre ${topic}. Este artigo apresenta metodologias comprovadas e citações acadêmicas. Esperamos que este conteúdo especializado contribua significativamente para sua preparação.`;
  } else {
    return `Ó cara, aqui tá tudo sobre ${topic}. Separamos as melhores dicas que vão ajudar você a arrasar no ENEM. Vem ver!`;
  }
}

async function generateABTestPosts() {
  const postsDir = path.join(process.cwd(), 'src/posts');
  const testId = `ab_test_tone_variants_${Date.now()}`;
  const posts: TestPost[] = [];

  console.log('📝 Generating 50 A/B test posts with 3 tone variants each...');

  // Generate 50 posts
  for (let i = 1; i <= 50; i++) {
    const template = postTemplates[i % postTemplates.length];
    const postId = `post_${i.toString().padStart(3, '0')}`;
    const slug = `${postId}-ab-test`;

    const post: TestPost = {
      id: postId,
      slug,
      title: {
        baseline: `${template.baselineTitle} - Post ${i}`,
        professional: `${template.professionalTitle} - Post ${i}`,
        casual: `${template.casualTitle} - Post ${i}`,
      },
      excerpt: {
        baseline: template.baselineExcerpt,
        professional: template.professionalExcerpt,
        casual: template.casualExcerpt,
      },
      content: {
        baseline: generatePostContent('baseline', template.topic),
        professional: generatePostContent('professional', template.topic),
        casual: generatePostContent('casual', template.topic),
      },
      testId,
      createdAt: new Date().toISOString(),
    };

    posts.push(post);

    // Create frontmatter markdown for each variant
    for (const variant of VARIANTS) {
      const fileName = `${slug}_${variant}.mdx`;
      const filePath = path.join(postsDir, fileName);

      const frontmatter = `---
title: "${post.title[variant as keyof typeof post.title]}"
slug: "${slug}_${variant}"
excerpt: "${post.excerpt[variant as keyof typeof post.excerpt]}"
category: "ENEM"
abTest:
  testId: "${testId}"
  variant: "${variant}"
  postId: "${postId}"
date: "${new Date().toISOString()}"
author: "AB Test Generator"
---

${post.content[variant as keyof typeof post.content]}
`;

      try {
        await fs.writeFile(filePath, frontmatter);
        console.log(`✅ Created: ${fileName}`);
      } catch (error) {
        console.error(`❌ Error creating ${fileName}:`, error);
      }
    }

    if (i % 10 === 0) {
      console.log(`📊 Generated ${i}/50 posts...`);
    }
  }

  // Save test metadata
  const metadataPath = path.join(process.cwd(), 'src/data', 'ab-test-metadata.json');
  const metadata = {
    testId,
    name: 'Tone Variants Test (Baseline vs Professional vs Casual)',
    description: '120 posts (50×3 variants) testing tone impact on engagement',
    variants: VARIANTS,
    postsCount: 50,
    totalVariants: 150,
    createdAt: new Date().toISOString(),
    posts: posts.map((p) => ({
      id: p.id,
      slug: p.slug,
      testId: p.testId,
    })),
  };

  try {
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`\n✅ Test metadata saved to: ${metadataPath}`);
  } catch (error) {
    console.error('Error saving metadata:', error);
  }

  console.log(`\n🎉 Generated ${posts.length * 3} post variants for test: ${testId}`);
  console.log(`📌 Test ID: ${testId}`);
  console.log(`📊 Variants: ${VARIANTS.join(', ')}`);
  console.log(`📈 Total posts in test: ${posts.length * VARIANTS.length}`);

  return { testId, postsCount: posts.length, variantsCount: VARIANTS.length };
}

// Run the generator
generateABTestPosts().catch(console.error);
