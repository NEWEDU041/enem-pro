import * as fs from 'fs'
import * as path from 'path'

const dir = path.join(__dirname, '../.audit-extract')

const fixes: [string, [RegExp | string, string][]][] = [
  ['cinematica-enem-o-que-cai.md', [
    ['Aparece em 2 a 6 questões por edição.', 'Aparece com frequência nas edições do ENEM.'],
  ]],
  ['como-estudar-ciencias-natureza-enem.md', [
    [' 1–2 questões por prova. Investimento baixo, bom retorno.', ' Investimento baixo, bom retorno.'],
  ]],
  ['como-estudar-biologia-enem.md', [
    ['Biologia representa em média **15–17 questões por prova**.', 'Biologia costuma representar boa parte das questões de Ciências da Natureza.'],
  ]],
  ['como-estudar-historia-enem.md', [
    ['História representa em média **12–15 questões por prova**.', 'História costuma representar boa parte das questões de Ciências Humanas.'],
  ]],
  ['como-estudar-fisica-enem.md', [
    ['Física representa em média **15–18 questões por prova**.', 'Física costuma representar boa parte das questões de Ciências da Natureza.'],
  ]],
  ['como-estudar-quimica-enem.md', [
    ['Química representa em média **14–16 questões por prova**.', 'Química costuma representar boa parte das questões de Ciências da Natureza.'],
  ]],
  ['direito-nota-de-corte-enem.md', [
    ['Direitos humanos e movimentos sociais aparecem em 4 a 6 questões por prova.', 'Direitos humanos e movimentos sociais aparecem com frequência nas provas.'],
  ]],
  ['ecologia-enem-o-que-cai.md', [
    ['Ecologia representa entre 5 e 8 das 45 questões de Ciências da Natureza (dentro das questões de Biologia).', 'Ecologia aparece com frequência entre as questões de Ciências da Natureza (dentro das questões de Biologia).'],
  ]],
  ['enem-2026-o-que-estudar.md', [
    ['Funções do 1º e 2º grau: mínimo 6 questões por prova', 'Funções do 1º e 2º grau: presença consistente na prova'],
  ]],
  ['engenharia-nota-de-corte-enem.md', [
    ['Funções lineares e quadráticas aparecem em 5 a 8 questões por prova. Geometria espacial — volume e área de sólidos — aparece em 3 a 5 questões. Estatística básica — média, mediana e moda — aparece em 2 a 4 questões.',
     'Funções lineares e quadráticas aparecem com frequência na prova. Geometria espacial — volume e área de sólidos — também é recorrente. Estatística básica — média, mediana e moda — aparece com regularidade.'],
  ]],
  ['funcoes-matematica-enem.md', [
    ['costumam representar 3–5 questões por prova.', 'costumam ter presença consistente na prova.'],
  ]],
  ['geometria-enem-o-que-cai.md', [
    ['Geometria plana aparece em 3–5 questões por prova.', 'Geometria plana aparece com frequência na prova.'],
  ]],
  ['logaritmos-matematica-enem.md', [
    ['Logaritmos aparecem em 1–2 questões por prova do ENEM e costumam ser questões acessíveis', 'Logaritmos aparecem com frequência moderada nas provas do ENEM e costumam ser questões acessíveis'],
  ]],
  ['matematica-financeira-enem.md', [
    ['Geralmente aparecem 2 a 4 questões envolvendo porcentagem, juros ou financiamentos.', 'Geralmente aparecem questões envolvendo porcentagem, juros ou financiamentos.'],
  ]],
  ['probabilidade-combinatoria-enem.md', [
    ['costumam aparecer juntas em 2–3 questões por prova do ENEM.', 'costumam aparecer juntas com frequência nas provas do ENEM.'],
  ]],
  ['progressoes-matematica-enem.md', [
    ['Aparecem em 1–2 questões por prova e costumam ser acessíveis', 'Aparecem com frequência moderada e costumam ser acessíveis'],
  ]],
  ['questoes-de-fisica-enem.md', [
    ['Embora apareçam cerca de 15 questões de Física por prova, o impacto na nota é significativo.', 'Física tem presença relevante nas questões de Ciências da Natureza, e o impacto na nota é significativo.'],
  ]],
  ['questoes-de-quimica-enem.md', [
    ['Química representa aproximadamente 15 das 45 questões de Ciências da Natureza.', 'Química representa boa parte das questões de Ciências da Natureza.'],
  ]],
  ['quimica-organica-enem.md', [
    ['Química Orgânica é a área com maior concentração de questões em Química no ENEM, com 4 a 6 questões por prova.', 'Química Orgânica é a área com maior concentração de questões em Química no ENEM.'],
  ]],
  ['trigonometria-enem-o-que-cai.md', [
    ['Trigonometria no ENEM aparece de forma consistente. 2 a 3 questões por prova.', 'Trigonometria no ENEM aparece de forma consistente.'],
  ]],
  ['preparacao-segunda-aplicacao-enem-2026.md', [
    ['A segunda aplicação tem **30% menos candidatos**. Se você não passou na primeira, tem mais chances agora.',
     'A segunda aplicação costuma ter menos candidatos que a primeira. Se você não passou na primeira, tem mais chances agora.'],
    ['> - Segunda aplicação: 30% menos competição (dado Inep, 2025)', '> - Segunda aplicação costuma ter menos concorrência que a primeira'],
    ['description: "Segunda chamada tem 30% menos competição. Estude 6h/dia e chegue aos 700+."',
     'description: "Segunda chamada tem menos concorrência que a primeira. Estude 6h/dia e chegue aos 700+."'],
  ]],
  ['questoes-matematica-enem-2022.md', [
    ['Funções aparecem em 12 a 14 questões a cada edição do ENEM, segundo dados históricos do INEP.',
     'Funções aparecem com bastante frequência a cada edição do ENEM.'],
  ]],
]

let totalFixed = 0
for (const [file, replacements] of fixes) {
  const filePath = path.join(dir, file)
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  não encontrado: ${file}`)
    continue
  }
  let content = fs.readFileSync(filePath, 'utf8')
  let fileChanged = 0
  for (const [search, replace] of replacements) {
    const before = content
    content = typeof search === 'string' ? content.split(search).join(replace) : content.replace(search, replace)
    if (content !== before) fileChanged++
  }
  if (fileChanged > 0) {
    fs.writeFileSync(filePath, content)
    totalFixed += fileChanged
    console.log(`✅ ${file}: ${fileChanged} substituição(ões)`)
  } else {
    console.log(`⚠️  ${file}: nenhuma substituição bateu — checar manualmente`)
  }
}
console.log(`\nTotal: ${totalFixed} substituições em ${fixes.length} arquivos`)
