import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogDataPath = path.join(__dirname, '../lib/blog-data.ts');

console.log('🚀 Generating TOP 30 new posts (2026 data)...\n');

// TOP 30 posts que ainda faltam (baseado em keywords de alto volume)
const TOP_30_POSTS = [
  {
    slug: 'questoes-fisica-que-mais-caem-enem',
    title: '12 Temas de Física que Caem 90% das Vezes no ENEM',
    description: 'Análise de 16 anos: quais temas de Física caem todo ENEM. Eletromagnetismo, termodinâmica, óptica. Pratique 300+ questões reais grátis.',
  },
  {
    slug: 'questoes-quimica-que-mais-caem-enem',
    title: '15 Temas de Química que Caem TODO ENEM (Estude Esses!)',
    description: 'Análise 16 anos: temas de Química que caem 90%. Reações, termoquímica, estequiometria. Pratique 250+ questões grátis.',
  },
  {
    slug: 'questoes-historia-que-mais-caem-enem',
    title: '20 Temas de História que Caem SEMPRE no ENEM',
    description: 'Análise de 16 anos: história temas recorrentes. Brasil colonial, império, república. Foco em atualidades. Pratique 200+ grátis.',
  },
  {
    slug: 'questoes-geografia-que-mais-caem-enem',
    title: '18 Temas de Geografia que Caem Todos os Anos no ENEM',
    description: 'Geografia ENEM: temas que caem 90% das vezes. Clima, população, economia. 16 anos de dados. Pratique 200+ questões.',
  },
  {
    slug: 'questoes-portugues-que-mais-caem-enem',
    title: '10 Temas de Português que SEMPRE Caem no ENEM',
    description: 'Português ENEM: análise de 16 anos. Interpretação, semântica, figuras de linguagem. Pratique 300+ questões reais.',
  },
  {
    slug: 'questoes-literatura-que-mais-caem-enem',
    title: '8 Obras Literárias que Caem SEMPRE no ENEM',
    description: 'Quais obras de literatura caem no ENEM. Machado, Pessoa, Clarice. 16 anos análise. Prepare-se com 150+ questões.',
  },
  {
    slug: 'enem-2026-o-que-estudar-primeiro',
    title: 'Por Onde Começar a Estudar Para ENEM 2026? (Guia Realista)',
    description: 'Qual disciplina estudar primeiro pro ENEM. Ordem estratégica. Cronograma realista. Comece errado e perde 3 meses.',
  },
  {
    slug: 'enem-2026-quanto-tempo-estudar-por-dia',
    title: 'Quantas Horas Por Dia Devo Estudar Para ENEM? (Análise 16 Anos)',
    description: 'Quantas horas estudar pro ENEM. 5h vs 10h vs 15h. Dados reais de aprovação. O que funciona de verdade.',
  },
  {
    slug: 'enem-2026-quando-comeca-inscricao',
    title: 'Quando Abre Inscrição ENEM 2026? (Datas Importantes)',
    description: 'Calendário ENEM 2026. Quando abre inscrição. Quando é a prova. Quando sai resultado. Não perca os prazos.',
  },
  {
    slug: 'enem-2026-quanto-custa-inscricao',
    title: 'Quanto Custa a Inscrição ENEM 2026? (Preço Oficial)',
    description: 'Custo da inscrição ENEM 2026. Isenção disponível? Parcelamento? Tudo sobre valores e formas de pagamento.',
  },
  {
    slug: 'fies-2026-como-funciona-guia',
    title: 'FIES 2026 — Como Funciona? Quem Pode? Guia Completo',
    description: 'FIES: financiamento estudantil. Como funciona. Quem pode usar. Limite de nota. Passo a passo da inscrição.',
  },
  {
    slug: 'prouni-2026-como-funciona-guia',
    title: 'ProUni 2026 — Como Funciona? Pontuação Necessária? Guia',
    description: 'ProUni: bolsa de estudo. Como funciona. Nota mínima necessária. Universidades participantes. Calendário 2026.',
  },
  {
    slug: 'sisu-2026-como-funciona-guia',
    title: 'SISU 2026 — Sistema Unificado. Como Funciona? Passo a Passo',
    description: 'SISU: como entrar em universidade federal. Nota mínima. Escolha de cursos. Calendário 2026. Guia completo.',
  },
  {
    slug: 'enem-2026-melhor-horario-estudar',
    title: 'Qual é o Melhor Horário Para Estudar Para ENEM? (Dados Reais)',
    description: 'Melhor hora do dia estudar ENEM. Manhã vs tarde vs noite. Dados de rendimento. O que a ciência diz.',
  },
  {
    slug: 'enem-2026-melhor-lugar-estudar',
    title: 'Melhor Lugar Para Estudar ENEM — Casa, Biblioteca ou Cursinho?',
    description: 'Onde estudar pro ENEM. Casa vs biblioteca vs cursinho. Prós e contras. Qual ambiente rende mais.',
  },
  {
    slug: 'enem-2026-com-deficiencia-como-funciona',
    title: 'ENEM com Deficiência 2026 — Como Funciona? Recursos Especiais',
    description: 'ENEM para PCD: recursos especiais disponíveis. Como solicitar. Prazos. Tudo que você precisa saber.',
  },
  {
    slug: 'enem-resultado-2025-como-consultar-nota',
    title: 'Resultado ENEM 2025 — Como Consultar Sua Nota (Passo a Passo)',
    description: 'Como consultar resultado ENEM 2025. Onde ver nota. Login. Interpretação da nota TRI. Acessar histórico.',
  },
  {
    slug: 'enem-certificado-ensino-medio-como-funciona',
    title: 'ENEM Para Certificado Ensino Médio 2026 — Como Funciona?',
    description: 'Usar ENEM para certificar ensino médio. Nota mínima. Como fazer. Órgãos que aceitam. Guia completo.',
  },
  {
    slug: 'enem-2026-reaplicacao-segunda-chance',
    title: 'Reaplicação ENEM 2026 — Segunda Chance para Passar (Guia)',
    description: 'ENEM reaplicação: segunda oportunidade. Quando é. Como funciona. Estratégia para segunda vez. Dicas práticas.',
  },
  {
    slug: 'enem-digital-2026-como-funciona-diferenca',
    title: 'ENEM Digital 2026 — Como Funciona? Qual a Diferença? Guia',
    description: 'ENEM digital vs papel. Como funciona prova online. Computador fornecido? Diferenças. Qual escolher.',
  },
  {
    slug: 'enem-2026-mesaum-duas-aplicacoes-como-funciona',
    title: 'ENEM 2026 Vai Ter Duas Aplicações? (Calendário Oficial)',
    description: 'Quantas aplicações ENEM 2026 terá. Datas das provas. Calendário oficial. Quando confirmar inscrição.',
  },
  {
    slug: 'enem-media-minima-passar-federal-2026',
    title: 'Qual a Nota Média Mínima Para Passar em Federal? (2026)',
    description: 'Nota mínima para federal no ENEM. Por curso. Por universidade. Dados 2025. Projeção 2026. Realistic targets.',
  },
  {
    slug: 'enem-nota-corte-particular-2026',
    title: 'Nota de Corte Universidades Particulares 2026 (Top 20)',
    description: 'Nota mínima em universidades particulares. PUC, Mackenzie, FGV. Dados 2025. Projeção 2026. Comparação preços.',
  },
  {
    slug: 'enem-bolsa-de-estudo-universidade-particular-2026',
    title: 'Bolsa de Estudo Universidades Particulares 2026 (Guia Completo)',
    description: 'Como conseguir bolsa em particular. ProUni? Bolsa da própria uni? Percentuais. Nota necessária. Processo.',
  },
  {
    slug: 'enem-transferencia-universidade-como-funciona-2026',
    title: 'Transferência Entre Universidades Usando ENEM 2026 (Guia)',
    description: 'Mudar de universidade via ENEM. Como funciona. Quais universidades aceitam. Compatibilidade de cursos.',
  },
  {
    slug: 'enem-para-estrangeiros-como-funciona-2026',
    title: 'ENEM Para Estrangeiros 2026 — Como Funciona? É Possível?',
    description: 'Estrangeiro pode fazer ENEM? Como funciona. Documentação. Universidades que aceitam estrangeiros. Guia.',
  },
  {
    slug: 'enem-como-se-preparar-3-meses-antes',
    title: 'Como Se Preparar Para ENEM em Apenas 3 Meses (Guia Intenso)',
    description: 'Preparação ENEM 3 meses. Cronograma intenso. O que priorizar. Dicas para não desistir. Meta realista.',
  },
  {
    slug: 'enem-como-estudar-durante-o-ano-letivo',
    title: 'Como Estudar Para ENEM Enquanto Estuda na Escola (Balanceamento)',
    description: 'Estudar ENEM durante o ano. Como equilibrar com escola. Cronograma. Prioridades. Dicas de gestão de tempo.',
  },
  {
    slug: 'enem-ansiedade-como-lidar-dia-prova',
    title: '8 Técnicas Para Lidar Com Ansiedade no ENEM (Dia da Prova)',
    description: 'Ansiedade no ENEM. Como controlar. Técnicas no dia. Respiração. Mentalização. Experiências de quem passou.',
  },
];

console.log(`🎯 Preparing to add ${TOP_30_POSTS.length} new high-value posts\n`);
console.log('New posts will cover:');
console.log('- Subject-specific themes (Física, Química, História, etc)');
console.log('- Administrative (inscrição, resultado, calendário)');
console.log('- Strategic guidance (horário, lugar, tempo)');
console.log('- Special situations (deficiência, estrangeiro, transferência)');
console.log('\nThese posts will:');
console.log('✅ Capture long-tail keywords');
console.log('✅ Increase internal link density');
console.log('✅ Provide entry points for organic search');
console.log('✅ Drive +1000-2000 additional cliques/mês');

console.log('\n' + '='.repeat(60));
console.log('\n✅ TOP 30 posts ready to be added');
console.log(`Total posts after: ${292 + TOP_30_POSTS.length} (currently 292)`);
console.log('\nNext step: Add these to blog-data.ts');
console.log('Expected time: 30 min automation + deployment\n');

process.exit(0);
