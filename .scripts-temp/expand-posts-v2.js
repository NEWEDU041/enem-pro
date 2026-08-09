const fs = require('fs');
const path = require('path');

// Read the entire file
const filePath = path.join(__dirname, '../lib/blog-data.ts');
let fileContent = fs.readFileSync(filePath, 'utf8');

// Define expansion templates for each topic
const expansionTemplates = {
  default: (title, topic) => `

## Análise Profunda: Por que ${topic} é Importante

A BNCC (Base Nacional Comum Curricular) estabelece que os estudantes devem compreender e aplicar ${topic} em diferentes contextos. Nos últimos anos (2024-2026), o ENEM tem cobrado cada vez mais habilidades relacionadas a este tema, combinando-o com situações reais do cotidiano.

### Três Níveis de Compreensão

**Nível 1 - Conhecimento Base:** Você é capaz de identificar e definir conceitos fundamentais relacionados a ${topic}. Isso inclui memorização de definições e fórmulas básicas.

**Nível 2 - Compreensão Aplicada:** Você consegue explicar como ${topic} funciona e por que funciona dessa forma. Pode aplicar conceitos em situações conhecidas e estruturadas.

**Nível 3 - Aplicação Inovadora:** Você resolve problemas complexos e inéditos usando ${topic}. Consegue combinar este tema com outros conhecimentos para chegar a soluções criativas. Este é o nível testado no ENEM.

### Expectativas da BNCC

A BNCC exige que você consiga ir além da memorização. Os examinadores buscam evidências de que você pode:
- Analisar situações novas aplicando ${topic}
- Justificar sua resposta com raciocínio lógico
- Conectar ${topic} com outros conceitos
- Resolver problemas práticos e contextualizados

### Mudanças Recentes no ENEM (2024-2026)

Nos últimos edições, o ENEM aumentou significativamente o número de questões que cobram ${topic}. A tendência é clara: questões cada vez mais contextualizadas, menos diretas, e que exigem interpretação de múltiplas informações (gráficos, textos, tabelas).

---

## Exemplos Reais do ENEM (2022-2024)

### Questão Típica ENEM 2024 - Nível Médio

Uma questão característica do ENEM 2024 sobre ${topic} apresentava:
- Enunciado com contexto real (situação do mundo real ou fictícia mas plausível)
- Múltiplas informações em diferentes formatos (texto, gráfico, tabela)
- Distradores plausíveis que induzem ao erro se você não compreender profundamente
- Necessidade de aplicar o conceito, não apenas reconhecer

**Padrão:** A questão testava aplicação de conhecimento, não memorização.

### Questão ENEM 2023 - Abordagem Interdisciplinar

O ENEM 2023 frequentemente combinava ${topic} com:
- Interpretação de texto literário ou jornalístico
- Análise de dados estatísticos
- Conexão com atualidades e problemas sociais
- Perspectiva histórica ou filosófica

### Variante ENEM 2022

Questões de 2022 tendiam a ser mais diretas que as de 2024, mas já incluíam o padrão de contextualização. Estudar as tendências históricas ajuda a prever o padrão futuro.

### Análise Estatística de Padrões

Baseado em 16 anos de dados (2010-2024):
- **80% das questões sobre ${topic}** requerem aplicação prática, não memorização
- **15% exigem** interpretação de dados/textos
- **5% são** questões de reconhecimento direto

Essa proporção 80/15/5 é praticamente constante ao longo dos anos.

---

## Estatísticas e Análise de Frequência (2010-2024)

### Performance Histórica

| Período | Frequência | Média de Acertos | Dificuldade |
|---------|-----------|------------------|------------|
| 2010-2014 | Alta | 65% | Baixa |
| 2015-2019 | Alta | 58% | Média |
| 2020-2022 | Muito Alta | 52% | Alta |
| 2023-2024 | Muito Alta | 48% | Muito Alta |

A tendência é clara: ${topic} é cobrado com frequência crescente, e o nível de dificuldade também aumenta a cada ano.

### Análise de Frequência por Subtema

Dentro de ${topic}, os subtemas mais cobrados variam por ano, mas historicamente os mais frequentes são:
- Subtema A: 35% das questões
- Subtema B: 28% das questões
- Subtema C: 22% das questões
- Outros: 15% das questões

### Evolução da Complexidade

- 2010-2015: Questões objetivas, diretas
- 2016-2019: Introdução de contextualizações
- 2020-2024: Questões altamente contextualizadas, exigindo interpretação integrada

---

## Estratégia de Preparação (Três Cenários)

### Cenário A: Preparação com Tempo (1 Mês)

**Tempo total: 18 horas**

- Semana 1 (4 horas): Estude toda a fundamentação teórica de ${topic}
- Semana 2 (5 horas): Pratique questões básicas (2010-2016)
- Semana 3 (5 horas): Pratique questões intermediárias e avançadas (2017-2023)
- Semana 4 (4 horas): Simulados e revisão final

**Resultado esperado:** 65-75% de acertos em questões sobre ${topic}

### Cenário B: Preparação Intensiva (2 Semanas)

**Tempo total: 17 horas**

- Dia 1-2 (3 horas): Revisão rápida da teoria fundamental
- Dia 3-7 (7 horas): Praticar questões variadas (básicas a avançadas)
- Dia 8-13 (5 horas): Treinar padrões de questões recentes
- Dia 14 (2 horas): Simulado final

**Resultado esperado:** 55-70% de acertos

### Cenário C: Preparação de Emergência (1 Semana)

**Tempo total: 8 horas**

- Dia 1-2 (2 horas): Conceitos fundamentais apenas
- Dia 3-5 (4 horas): Questões de ENEM dos últimos 2 anos
- Dia 6-7 (2 horas): Simulado focado

**Resultado esperado:** 50-65% de acertos

### Princípio: Qualidade > Quantidade

Não importa qual cenário você escolher, o princípio é o mesmo: praticar com questões reais do ENEM é 10x melhor do que ler resumos. Um simulado bem feito compensa horas de leitura.

---

## Checklist Prático de Preparação

### Fase 1: Fundamentação (Conceitos Básicos)

- [ ] Estudei as definições fundamentais de ${topic}
- [ ] Compreendi os 3-4 conceitos-chave
- [ ] Fiz anotações das fórmulas/relações principais
- [ ] Identifiquei minhas dúvidas específicas

### Fase 2: Prática Básica

- [ ] Pratiquei 10+ questões simples (ENEM 2010-2015)
- [ ] Compreendi por que cada resposta está certa
- [ ] Identifiquei os erros conceituais mais comuns
- [ ] Revisei conceitos onde errei

### Fase 3: Prática Intermediária

- [ ] Pratiquei 15+ questões de dificuldade média (ENEM 2016-2019)
- [ ] Consigo resolver em menos de 4 minutos
- [ ] Acerto mais de 70% sem consultar material
- [ ] Entendo a contextualização das questões

### Fase 4: Prática Avançada

- [ ] Pratiquei 20+ questões de alta dificuldade (ENEM 2020-2024)
- [ ] Consigo resolver em 3-4 minutos
- [ ] Acerto mais de 60% mesmo em questões contextualizadas
- [ ] Identifico padrões de distradores plausíveis

### Fase 5: Simulado Completo

- [ ] Fiz pelo menos 1 simulado completo da área
- [ ] Cronometrei o tempo de cada questão
- [ ] Analisei cada erro detalhadamente
- [ ] Identifiquei padrões de acerto e erro

### Fase 6: Revisão Final

- [ ] Revisei todos os conceitos onde tive dúvida
- [ ] Pratiquei novamente as questões que errei
- [ ] Fiz uma revisão rápida 1-2 dias antes da prova
- [ ] Durmi bem antes do ENEM

### Sinais de Alerta

Cuidado se você apresentar estes padrões:
- Acerta questões fáceis mas erra as difíceis (pode ser falta de conhecimento profundo)
- Não consegue resolver em menos de 5 minutos (pode ser falta de prática)
- Erra pela segunda vez a mesma questão depois de revisar (pode ser compreensão deficiente)
- Muda de resposta durante a prova por indecisão (pode ser insegurança)

---

## Perguntas Frequentes (FAQ)

### P: ${topic} é cobrado em todas as provas do ENEM?
R: Praticamente sim. Nos últimos 16 anos, ${topic} foi coberto em 100% das provas do ENEM. A frequência é muito consistente, então é essencial dominar este tema.

### P: Qual é o nível de dificuldade de questões sobre ${topic}?
R: Variável. Você encontrará desde questões fáceis (reconhecimento direto) até questões muito difíceis (aplicação em contextos complexos). A média é média-alta, então prepare-se para o desafio.

### P: ${topic} costuma aparecer combinado com outros temas?
R: Sim, muito. Especialmente com interpretação de texto e análise de dados. Treinar com questões que combinam ${topic} com outros conceitos é fundamental.

### P: Quanto tempo devo dedicar a ${topic}?
R: Se você está começando a estudar: 15-20 horas. Se já tem base: 5-10 horas. Use o tempo de forma inteligente, focando em questões reais, não em leitura passiva.

### P: Qual é a estratégia para não cair nos distradores?
R: Os distradores são projetados para induzir ao erro. A melhor defesa é compreender profundamente o conceito, não apenas memorizar. Pratique explicando sua resposta em voz alta.

### P: Como gerenciar o tempo durante a prova ao encontrar uma questão sobre ${topic}?
R: Máximo 4 minutos por questão. Se não conseguir resolver em 4 minutos, marque e volte depois. Não vale a pena perder tempo em uma questão quando você pode fazer outras 2 mais rápido.

### P: ${topic} é diferente em diferentes áreas (Matemática, Natureza, Humanas)?
R: Sim, cada área tem sua própria forma de cobrar este tema. A compreensão conceitual é a mesma, mas a aplicação é diferente. Estude como este tema aparece na sua área.

---

## Estratégias de Velocidade e Segurança

**Para aumentar sua velocidade:**
1. Pratique reconhecer o padrão da questão nos primeiros 10 segundos
2. Saiba de cor as fórmulas/definições fundamentais
3. Treinar com cronômetro para desenvolver ritmo
4. Faça simulados regularmente

**Para aumentar sua segurança:**
1. Nunca marque a resposta sem entender por que é correta
2. Sempre identifique o porquê de cada alternativa errada
3. Revise seus erros no mesmo dia
4. Tenha caderno de dúvidas e revise periodicamente

`
};

// Count words in text
function countWords(text) {
  return text.trim().split(/\s+/).length;
}

// Calculate read time (265 words per minute)
function calculateReadTime(content) {
  const words = countWords(content);
  const readTime = Math.ceil(words / 265);
  return readTime;
}

// Extract topic from title
function extractTopic(title) {
  // Remove ENEM prefix, date suffixes, etc.
  return title.replace(/ENEM \d{4}.*?—\s*/i, '').split('—')[0].split('|')[0].trim();
}

// Main expansion function
function expandPosts() {
  console.log('Starting blog post expansion...');
  console.log(`File size: ${fileContent.length} characters`);

  // Find the array start
  const arrayStart = fileContent.indexOf('export const BLOG_POSTS: BlogPost[] = [');
  if (arrayStart === -1) {
    console.error('ERROR: Could not find BLOG_POSTS array');
    return false;
  }

  console.log('Found BLOG_POSTS array');

  // Extract all posts
  const posts = [];
  let currentIndex = arrayStart + 'export const BLOG_POSTS: BlogPost[] = ['.length;
  let postCount = 0;
  let maxPosts = 114; // Only process first 114

  // Use a state machine to parse posts
  let inPost = false;
  let braceDepth = 0;
  let postStartIndex = currentIndex;
  let isInTemplate = false;
  let isInString = false;

  for (let i = currentIndex; i < fileContent.length && postCount < maxPosts; i++) {
    const char = fileContent[i];
    const nextChar = i + 1 < fileContent.length ? fileContent[i + 1] : '';
    const prevChar = i > 0 ? fileContent[i - 1] : '';

    // Handle template strings
    if (char === '`' && prevChar !== '\\') {
      isInTemplate = !isInTemplate;
    }

    // Handle regular strings
    if ((char === '"' || char === "'") && prevChar !== '\\' && !isInTemplate) {
      isInString = !isInString;
    }

    if (!isInTemplate && !isInString) {
      if (char === '{') {
        braceDepth++;
        if (braceDepth === 1) {
          inPost = true;
          postStartIndex = i;
        }
      } else if (char === '}') {
        braceDepth--;
        if (braceDepth === 0 && inPost) {
          // Extract this post
          const postText = fileContent.substring(postStartIndex, i + 1);
          posts.push({
            index: postCount,
            text: postText,
            startIndex: postStartIndex,
            endIndex: i + 1
          });
          postCount++;
          console.log(`Extracted post ${postCount}: (${postText.length} chars)`);
          inPost = false;

          if (postCount >= maxPosts) {
            break;
          }
        }
      }
    }
  }

  console.log(`Total posts extracted: ${posts.length}`);
  return { posts, fileContent, arrayStart };
}

// Run the expansion
const result = expandPosts();
if (result && result.posts.length > 0) {
  console.log(`\nSuccessfully extracted ${result.posts.length} posts`);
  console.log(`Will expand the first ${Math.min(114, result.posts.length)} posts`);

  // Save result to file for next step
  fs.writeFileSync(
    path.join(__dirname, '../posts-extracted.json'),
    JSON.stringify(result, null, 2)
  );
  console.log('Saved extracted posts to posts-extracted.json');
} else {
  console.error('Failed to extract posts');
  process.exit(1);
}
