import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogDataPath = path.join(__dirname, '../lib/blog-data.ts');

// Template system for auto-generating titles/descriptions
const TEMPLATES = {
  'nota-de-corte-*': (course) => ({
    title: `Nota de Corte ${course} ENEM 2026 — Quanto Você Precisa?`,
    description: `Nota mínima para ${course} em universidades federais. Histórico 2020-2025 + projeção 2026. Veja sua chance de entrada.`
  }),
  'gabarito-*': (year) => ({
    title: `Gabarito ENEM ${year} — Todas as Disciplinas Oficial + Comentário`,
    description: `Gabarito oficial completo ENEM ${year}. Matemática, Natureza, Humanas e Linguagens com análise de temas cobrados.`
  }),
  'questoes-*-que-mais-caem': (subject) => ({
    title: `Top 15 Temas de ${subject} que Caem TODO ENEM (Estude Esses!)`,
    description: `Análise de 16 anos: quais temas de ${subject} caem 90% das vezes. Pratique 200+ questões reais grátis.`
  }),
  'como-estudar-*': (subject) => ({
    title: `Como Estudar ${subject} para ENEM 2026 — Guia Estratégico`,
    description: `Estratégia realista para estudar ${subject} pro ENEM. Cronograma 12 semanas + temas prioritários + prática estruturada.`
  }),
};

// Manual overrides for the most important posts
const PRIORITY_REWRITES = {
  'dicas-melhorar-redacao-enem-score': {
    title: '5 Dicas Comprovadas para Melhorar Redação ENEM (Do 500 para 900+)',
    description: 'Como sair de 500 para 900+ em redação ENEM. Análise de 16 anos de redações vencedoras. Técnicas + prática estruturada.'
  },
  'como-calcular-nota-enem-formula-tri': {
    title: 'Como Calcular Nota ENEM — Fórmula TRI Explicada com Exemplos',
    description: 'Entenda TRI (Teoria de Resposta ao Item). Por que acertar difícil vale mais. Calculadora prática + simulador.'
  },
  'preparacao-segunda-aplicacao-enem-2026': {
    title: 'Segunda Aplicação ENEM 2026 — Como Se Preparar em 4 Semanas',
    description: 'Guia para segunda aplicação 2026. 30% menos competição. Foco em fraquezas. Timeline realista + checklist.'
  },
  'alternativa-descomplica-gratuita': {
    title: 'Alternativas Grátis ao Descomplica para Estudar ENEM',
    description: 'Plataformas grátis similares ao Descomplica. Videoaulas + exercícios + chat. Comparação de 10 opções.'
  },
  'enem-treineiro': {
    title: 'ENEM Treineiro 2026 — Vale a Pena? Como Fazer? Guia Completo',
    description: 'O que é ENEM treineiro? Vale a pena? Como funciona. Benefícios + limitações. Treinar sem compromisso.'
  },
  'banco-de-questoes-enem-gratis': {
    title: 'Melhores Bancos de Questões ENEM Grátis — 2.900+ Questões Reais',
    description: 'Comparação: ENEM Pro vs similares. Qual tem melhor banco. Filtros por disciplina + nível. Teste grátis.'
  },
  'simulado-enem-online-completo-gratis': {
    title: 'Simulado ENEM Online Completo Grátis — 45Q + Redação (2h30)',
    description: 'Simulado realista online. 45 questões + redação. Cronômetro. Resultado TRI em tempo real. Feedback automático.'
  },
  'enem-2026-o-que-mudou': {
    title: 'ENEM 2026 — O Que Mudou? Novidades Importantes Explicadas',
    description: 'Quais mudanças para ENEM 2026 vs 2025? Formato, datas, provas. Tudo que você precisa saber agora.'
  },
  'resultado-enem-2025': {
    title: 'Resultado ENEM 2025 — Como Consultar, Data de Divulgação',
    description: 'Quando sai resultado ENEM 2025? Como consultar. Nota TRI. Acesso ao Diário Oficial. Passo a passo.'
  },
};

console.log('🔄 Upgrading all low-quality posts...\n');

try {
  let content = fs.readFileSync(blogDataPath, 'utf-8');
  let changedCount = 0;

  // First: Apply priority rewrites (manually curated)
  for (const [slug, rewrite] of Object.entries(PRIORITY_REWRITES)) {
    const titleRegex = new RegExp(
      `(slug:\\s*'${slug}',\\s*title:\\s*')([^']*?)(')`
    );
    const descRegex = new RegExp(
      `(slug:\\s*'${slug}',[^}]*?description:\\s*')([^']*?)(')`
    );

    if (titleRegex.test(content)) {
      content = content.replace(titleRegex, `$1${rewrite.title}$3`);
    }
    if (descRegex.test(content)) {
      content = content.replace(descRegex, `$1${rewrite.description}$3`);
      changedCount++;
      console.log(`✅ Priority: ${slug}`);
    }
  }

  // Second: Apply template-based rewrites
  // Find all "nota-de-corte-*" posts
  const courseRegex = /slug:\s*'nota-de-corte-([^']+)'/g;
  let courseMatch;
  while ((courseMatch = courseRegex.exec(content)) !== null) {
    const slug = `nota-de-corte-${courseMatch[1]}`;
    let course = courseMatch[1]
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    // Remove trailing "enem" if it exists (avoid "Medicine Enem ENEM")
    course = course.replace(/\s+Enem\s*$/i, '');

    const rewrite = TEMPLATES['nota-de-corte-*'](course);

    const titleRegex = new RegExp(
      `(slug:\\s*'${slug}',\\s*title:\\s*')([^']*?)(')`
    );
    const descRegex = new RegExp(
      `(slug:\\s*'${slug}',[^}]*?description:\\s*')([^']*?)(')`
    );

    if (titleRegex.test(content)) {
      content = content.replace(titleRegex, `$1${rewrite.title}$3`);
    }
    if (descRegex.test(content)) {
      content = content.replace(descRegex, `$1${rewrite.description}$3`);
      changedCount++;
    }
  }

  // Write back
  fs.writeFileSync(blogDataPath, content, 'utf-8');
  console.log(`\n✅ Done! Upgraded ${changedCount} posts`);

  process.exit(changedCount > 0 ? 0 : 1);

} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
