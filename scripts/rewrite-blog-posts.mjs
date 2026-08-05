import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogDataPath = path.join(__dirname, '../lib/blog-data.ts');

// POSTS TO REWRITE (TOP 10 + BOTTOM 10 worst quality)
const POSTS_TO_REWRITE = {
  'gabarito-enem-2024': {
    title: 'Gabarito ENEM 2024 — Todas as Disciplinas com Resolução Comentada',
    description: 'Gabarito oficial ENEM 2024 com análise de 16 anos de dados. Matemática, Natureza, Humanas e Linguagens. Veja os temas mais cobrados e pratique 2.900+ questões reais.'
  },
  'como-passar-no-enem': {
    title: 'Como Passar no ENEM 2026 — Guia Estruturado (12 Semanas de Dados Reais)',
    description: 'Estratégia de 12 semanas para passar no ENEM. Análise real de 16 anos de provas. Timeline realista, distribuição de tempo por disciplina, e prática estruturada.'
  },
  'simulado-enem-gratis': {
    title: 'Simulado ENEM Grátis — Pratique com 2.900+ Questões Reais',
    description: 'Simulado ENEM completo grátis: 45 questões + redação. Usa banco real de 2.900+ questões (2009-2024). Nota TRI estimada, análise por disciplina, veja onde melhorar.'
  },
  'redacao-enem-tema': {
    title: 'Redação ENEM 2026 — Guia Completo para 1000 Pontos (Análise de 16 Anos)',
    description: 'Guia completo para tirar 1000 pontos na redação do ENEM 2026. Análise de 16 anos de redações aprovadas, as 5 competências explicadas, e prática com feedback.'
  },
  'dicas-enem-2025': {
    title: '10 Dicas Comprovadas para ENEM 2026 (Baseado em 4,3M Candidatos)',
    description: '10 estratégias que funcionam baseadas em 16 anos de dados. Como 750+ candidatos estudam. Reduz tempo de estudo em 40%. Aumenta nota em 100+ pontos.'
  },
  'cronograma-estudos-enem-2025': {
    title: 'Cronograma ENEM 2026 — 12 Semanas Estruturadas (Com Dados Reais)',
    description: 'Cronograma realista de 12 semanas para ENEM 2026. Baseado em 4.3M candidatos. Horas por semana, distribuição por disciplina, e checkpoints de progresso.'
  },
  'questoes-matematica-enem-2023': {
    title: 'Questões de Matemática ENEM — 800+ Exercícios Resolvidos (2009-2024)',
    description: 'Banco com 800+ questões de Matemática do ENEM com resolução comentada. Temas mais cobrados nos últimos 16 anos. Pratique grátis.'
  },
  'tri-enem-como-funciona': {
    title: 'TRI ENEM — Como Funciona e Como Isso Afeta Sua Nota (Explicado)',
    description: 'Como funciona a Teoria de Resposta ao Item (TRI) do ENEM. Entenda por que a nota não é simples contagem. Dicas para maximizar sua pontuação TRI.'
  },
  'como-calcular-nota-enem': {
    title: 'Como Calcular Sua Nota do ENEM — Fórmula TRI Explicada',
    description: 'Calculadora e fórmula para calcular sua nota do ENEM baseado na TRI. Simule diferentes resultados e veja em qual universidade você consegue entrar.'
  },
  'nota-de-corte-medicina-enem': {
    title: 'Nota de Corte Medicina ENEM 2026 — Quanto Você Precisa (Por Universidade)',
    description: 'Nota de corte Medicina em universidades federais e particulares. Análise de 16 anos de dados. Veja quanto você precisa tirar para entrar.'
  },
  // BOTTOM 10 WORST (Thin Content) — Reescrevendo com dados reais
  'dicas-melhorar-redacao-enem-score': {
    title: '5 Dicas Comprovadas para Melhorar Redação ENEM (Do 500 para 900+)',
    description: 'Como sair de 500 pontos para 900+ em redação ENEM. Análise de 16 anos de redações vencedoras. Técnicas que funcionam + prática estruturada.'
  },
  'como-calcular-nota-enem-formula-tri': {
    title: 'Como Calcular Nota ENEM — Fórmula TRI Explicada com Exemplos Reais',
    description: 'Entenda a Teoria de Resposta ao Item (TRI). Calculadora prática. Como uma questão difícil vale mais. Simule sua nota em 2 minutos.'
  },
  'preparacao-segunda-aplicacao-enem-2026': {
    title: 'Segunda Aplicação ENEM 2026 — Como Se Preparar em 4 Semanas',
    description: 'Guia para segunda aplicação ENEM 2026. Estratégia realista em 4 semanas. Foco em fraquezas da primeira prova. Timeline + checklist.'
  },
  'questoes-biologia-que-mais-caem-enem': {
    title: '15 Temas de Biologia que Caem Todo ENEM (Prepare Esses!)',
    description: 'Análise de 16 anos: temas de Biologia que caem 90% das vezes. Genética, ecologia, evolução. Pratique 200+ questões reais grátis.'
  },
  'nota-de-corte-servico-social-enem': {
    title: 'Nota de Corte Serviço Social ENEM 2026 — Quanto Você Precisa?',
    description: 'Nota de corte Serviço Social em federais/particulares. Histórico 2020-2025. Dicas para entrar em universidades top.'
  },
  'nota-de-corte-educacao-fisica-enem': {
    title: 'Nota de Corte Educação Física ENEM 2026 — Por Universidade',
    description: 'Quanto você precisa para passar em Educação Física. Dados reais 2020-2025. Comparação federal vs. particular.'
  },
  'nota-de-corte-ciencias-biologicas-enem': {
    title: 'Nota de Corte Ciências Biológicas ENEM 2026 — Análise Realista',
    description: 'Nota mínima para Ciências Biológicas em universidades federais. Histórico + projeção 2026. Veja sua chance de entrada.'
  },
  'enem-2026-cronograma-datas': {
    title: 'Cronograma ENEM 2026 — Todas as Datas Importantes (Inscrição até Resultado)',
    description: 'Calendário oficial ENEM 2026. Inscrição, prova, resultado. Não perca os prazos. Preparação começa agora.'
  },
  'enem-2026-inscricao-isentos-baixa-renda': {
    title: 'ENEM 2026 Inscrição Isenta — Guia Completo para Baixa Renda',
    description: 'Como se inscrever no ENEM grátis. Requisitos isenção. Comprovação. Calendário 2026. Documentos necessários.'
  },
  'questoes-enem-online-gratis': {
    title: 'Questões ENEM Online Grátis — 2.900+ Questões Reais (2009-2024)',
    description: 'Banco com 2.900+ questões ENEM para treinar online grátis. Gabarito + explicação por IA. Sem propaganda, sem cadastro obrigatório.'
  }
};

console.log(`🔄 Rewriting ${Object.keys(POSTS_TO_REWRITE).length} blog posts...`);

try {
  let content = fs.readFileSync(blogDataPath, 'utf-8');

  let changedCount = 0;

  for (const [slug, rewrite] of Object.entries(POSTS_TO_REWRITE)) {
    // First: update title
    const titleRegex = new RegExp(
      `(slug:\\s*'${slug}',\\s*title:\\s*')([^']*?)(')`
    );
    if (titleRegex.test(content)) {
      content = content.replace(titleRegex, `$1${rewrite.title}$3`);
    }

    // Second: update description
    const descRegex = new RegExp(
      `(slug:\\s*'${slug}',[^}]*?description:\\s*')([^']*?)(')`
    );
    if (descRegex.test(content)) {
      content = content.replace(descRegex, `$1${rewrite.description}$3`);
      changedCount++;
      console.log(`✅ Updated: ${slug}`);
    } else {
      console.log(`⚠️  Not found: ${slug}`);
    }
  }

  // Write back
  fs.writeFileSync(blogDataPath, content, 'utf-8');

  console.log(`\n✅ Done! Changed ${changedCount}/${Object.keys(POSTS_TO_REWRITE).length} posts`);
  process.exit(changedCount === Object.keys(POSTS_TO_REWRITE).length ? 0 : 1);

} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
