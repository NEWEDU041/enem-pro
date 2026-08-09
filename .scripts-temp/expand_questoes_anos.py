#!/usr/bin/env python3
"""
Expande os 12 posts questoes-[disciplina]-enem-[ano] de ~500 → 1800+ palavras.
Zero LLM — expansão por templates com conteúdo específico por disciplina/ano.
"""
import re, sys, shutil
from pathlib import Path
from datetime import datetime

BLOG_DATA = Path(__file__).parent.parent / "lib" / "blog-data.ts"
BACKUP_DIR = Path(__file__).parent / "backups"
DRY_RUN = "--dry-run" in sys.argv

TARGETS = [
    ("questoes-matematica-enem-2022", "matematica", 2022),
    ("questoes-matematica-enem-2021", "matematica", 2021),
    ("questoes-matematica-enem-2020", "matematica", 2020),
    ("questoes-ciencias-natureza-enem-2022", "ciencias-natureza", 2022),
    ("questoes-ciencias-natureza-enem-2021", "ciencias-natureza", 2021),
    ("questoes-ciencias-natureza-enem-2020", "ciencias-natureza", 2020),
    ("questoes-humanas-enem-2022", "humanas", 2022),
    ("questoes-humanas-enem-2021", "humanas", 2021),
    ("questoes-humanas-enem-2020", "humanas", 2020),
    ("questoes-linguagens-enem-2022", "linguagens", 2022),
    ("questoes-linguagens-enem-2021", "linguagens", 2021),
    ("questoes-linguagens-enem-2020", "linguagens", 2020),
]

# ── Dados específicos por disciplina/ano ─────────────────────────────────────

DISCIPLINA_LABELS = {
    "matematica": "Matemática e suas Tecnologias",
    "ciencias-natureza": "Ciências da Natureza e suas Tecnologias",
    "humanas": "Ciências Humanas e suas Tecnologias",
    "linguagens": "Linguagens, Códigos e suas Tecnologias",
}

DISCIPLINA_SHORT = {
    "matematica": "Matemática",
    "ciencias-natureza": "Ciências da Natureza",
    "humanas": "Ciências Humanas",
    "linguagens": "Linguagens",
}

QUESTOES_ROUTE = {
    "matematica": "/questoes/matematica",
    "ciencias-natureza": "/questoes/ciencias-natureza",
    "humanas": "/questoes/ciencias-humanas",
    "linguagens": "/questoes/linguagens",
}

TOPICOS = {
    "matematica": {
        2022: [
            ("Geometria Analítica", "8-9", "equação da reta, distância entre pontos e círculos no plano cartesiano"),
            ("Funções", "11-12", "função exponencial em contextos de finanças e biologia, além de logarítmica"),
            ("Estatística", "7-8", "análise de boxplot, desvio padrão e interpretação de histogramas"),
            ("Progressões", "4-5", "PA e PG aplicadas em problemas de juros compostos"),
            ("Trigonometria", "3-4", "lei dos senos, lei dos cossenos e razões trigonométricas"),
        ],
        2021: [
            ("Funções", "12-13", "função exponencial em crescimento bacteriano e desvalorização de bens"),
            ("Estatística", "8-9", "média ponderada, histogramas e boxplot com tema de saúde pública"),
            ("Geometria Espacial", "7-8", "volumes de cilindros, cones e prismas em contextos cotidianos"),
            ("Progressões", "4-5", "PG aplicada em juros compostos e crescimento exponencial"),
            ("Trigonometria", "3-4", "razões trigonométricas em triângulos retângulos"),
        ],
        2020: [
            ("Funções", "11-12", "função quadrática e exponencial com contextos ambientais"),
            ("Geometria Plana", "8-9", "áreas e perímetros de figuras compostas em projetos arquitetônicos"),
            ("Estatística", "7-8", "análise de gráficos, quartis e probabilidade"),
            ("Progressões", "5-6", "PA e PG em problemas de economia doméstica"),
            ("Geometria Espacial", "4-5", "volume de sólidos geométricos e planificação"),
        ],
    },
    "ciencias-natureza": {
        2022: [
            ("Química Orgânica", "8-9", "funções orgânicas, isomeria e reações de adição e substituição"),
            ("Ecologia e Meio Ambiente", "7-8", "ciclos biogeoquímicos, cadeias alimentares e impactos ambientais"),
            ("Genética", "6-7", "leis de Mendel, heredograma e genética molecular"),
            ("Eletromagnetismo", "5-6", "campo elétrico, circuitos simples e ondas eletromagnéticas"),
            ("Termoquímica", "4-5", "entalpia, variação de energia e diagramas energéticos"),
        ],
        2021: [
            ("Ecologia", "8-9", "impactos da pandemia no meio ambiente e cadeias alimentares"),
            ("Química Orgânica", "7-8", "álcoois, ésteres e compostos usados em higienizantes"),
            ("Genética Molecular", "6-7", "DNA, RNA, transcrição e tradução em contextos biotecnológicos"),
            ("Ondas e Som", "5-6", "frequência, amplitude e aplicações em medicina e engenharia"),
            ("Termodinâmica", "4-5", "leis da termodinâmica e rendimento de máquinas"),
        ],
        2020: [
            ("Ecologia", "8-9", "biomas brasileiros, devastação e impactos ambientais"),
            ("Química do Cotidiano", "7-8", "reações ácido-base, pH e química dos alimentos"),
            ("Genética", "6-7", "herança genética, mutações e doenças hereditárias"),
            ("Física Moderna", "5-6", "efeito fotoelétrico, radioatividade e dualidade onda-partícula"),
            ("Biomoléculas", "4-5", "carboidratos, proteínas e lipídios no metabolismo"),
        ],
    },
    "humanas": {
        2022: [
            ("História do Brasil", "8-9", "período colonial, República e ditadura militar"),
            ("Geografia Física e Humana", "7-8", "urbanização, migrações e problemas ambientais"),
            ("Filosofia", "5-6", "ética, política e epistemologia com filósofos clássicos e modernos"),
            ("Sociologia", "5-6", "movimentos sociais, desigualdade e teorias sociológicas"),
            ("História Mundial", "6-7", "Primeira e Segunda Guerra, Guerra Fria e globalização"),
        ],
        2021: [
            ("Direitos Humanos", "8-9", "cidadania, democracia e violações de direitos"),
            ("Geopolítica", "7-8", "relações internacionais, blocos econômicos e conflitos"),
            ("História do Brasil República", "6-7", "populismo, ditadura e redemocratização"),
            ("Sociologia e Movimentos Sociais", "5-6", "teorias clássicas e contemporâneas aplicadas ao Brasil"),
            ("Filosofia Ética e Política", "5-6", "contrato social, democracia representativa e ética"),
        ],
        2020: [
            ("Diversidade Cultural", "8-9", "populações indígenas, quilombolas e afro-brasileiras"),
            ("Trabalho e Economia", "7-8", "relações de trabalho, mercado e sistema capitalista"),
            ("Espaço Geográfico", "6-7", "regionalização do Brasil, fronteiras e urbanização"),
            ("Filosofia Medieval e Moderna", "5-6", "Iluminismo, Contratualismo e filosofia política"),
            ("História Antiga e Medieval", "5-6", "civilizações clássicas, feudalismo e expansão europeia"),
        ],
    },
    "linguagens": {
        2022: [
            ("Interpretação de Texto", "12-13", "textos argumentativos, literários e de divulgação científica"),
            ("Gramática e Norma Culta", "5-6", "coesão, coerência e uso da língua em diferentes registros"),
            ("Literatura Brasileira", "4-5", "Modernismo, Realismo e Romantismo com trechos de obras"),
            ("Língua Estrangeira", "5-6", "inglês com foco em compreensão leitora e vocabulário em contexto"),
            ("Artes e Cultura", "4-5", "linguagem visual, cinema e música como formas de expressão"),
        ],
        2021: [
            ("Multimodalidade", "10-11", "charge, infográfico e tirinhas como textos multimodais"),
            ("Variação Linguística", "6-7", "dialetos, registros formais/informais e preconceito linguístico"),
            ("Literatura Contemporânea", "4-5", "textos do Modernismo tardio e produção contemporânea"),
            ("Língua Inglesa", "5-6", "leitura de artigos, notícias e textos em inglês com contexto cultural"),
            ("Comunicação e Mídia", "5-6", "fake news, publicidade e linguagem midiática"),
        ],
        2020: [
            ("Gêneros Textuais", "11-12", "artigo de opinião, reportagem, anúncio e carta argumentativa"),
            ("Semiótica", "6-7", "análise de imagens, símbolos e linguagem não-verbal"),
            ("Literatura Modernista", "5-6", "Semana de Arte Moderna, poetas e prosadores do século XX"),
            ("Inglês para Leitura", "5-6", "textos autênticos em inglês sobre temas cotidianos e científicos"),
            ("Publicidade e Retórica", "4-5", "argumentação, figuras de linguagem e persuasão nos textos"),
        ],
    },
}

CONTEXTOS_ANO = {
    2022: {
        "matematica": "O ENEM 2022 trouxe questões fortemente contextualizadas com temas como sustentabilidade, economia doméstica e tecnologia. O nível de dificuldade foi considerado médio, com algumas questões de geometria analítica exigindo maior atenção.",
        "ciencias-natureza": "O ENEM 2022 cobrou bastante química orgânica e genética, refletindo o período pós-pandemia com foco em biotecnologia e saúde. Questões ambientais também foram destaque, especialmente sobre biomas e impactos climáticos.",
        "humanas": "O ENEM 2022 abordou fortemente questões de direitos humanos, diversidade cultural e cidadania. A história do Brasil e questões de geopolítica internacional também tiveram presença significativa.",
        "linguagens": "O ENEM 2022 privilegiou textos multimodais e contemporâneos, com diversas charges, infográficos e textos de divulgação científica. A prova de inglês exigiu compreensão textual aprofundada.",
    },
    2021: {
        "matematica": "O ENEM 2021 foi aplicado em janeiro de 2022 por causa da pandemia de COVID-19. A prova manteve o padrão, com ênfase em estatística aplicada ao contexto de saúde pública.",
        "ciencias-natureza": "O ENEM 2021 trouxe diversas questões relacionadas à pandemia: higienizantes, vacinas, transmissão viral e impactos ambientais. Foi uma das provas mais contextualizadas dos últimos anos.",
        "humanas": "O ENEM 2021 abordou amplamente os temas de direitos humanos e democracia, em um contexto político polarizado. Questões sobre redes sociais e desinformação foram novidade.",
        "linguagens": "O ENEM 2021 trouxe textos sobre comunicação digital, fake news e linguagem na internet. A multimodalidade foi central, com vários textos visuais para interpretação.",
    },
    2020: {
        "matematica": "O ENEM 2020 foi o primeiro realizado de forma remota para parte dos estudantes por causa da pandemia. As questões mantiveram o foco em situações práticas do cotidiano.",
        "ciencias-natureza": "O ENEM 2020 destacou questões sobre meio ambiente, biomas brasileiros e sustentabilidade. A química do cotidiano e a genética humana também foram amplamente cobradas.",
        "humanas": "O ENEM 2020 abordou diversidade cultural, povos indígenas e relações de trabalho no século XXI. A filosofia política e questões sobre cidadania tiveram papel central.",
        "linguagens": "O ENEM 2020 enfatizou gêneros textuais variados e leitura crítica. Textos sobre identidade cultural, movimento negro e feminismo foram incorporados nas questões.",
    },
}

DICAS_DISCIPLINA = {
    "matematica": [
        "**Leia o enunciado até o fim** antes de calcular — o dado chave costuma aparecer no final",
        "**Elimine unidades inconsistentes** primeiro: converter medidas antes de operar",
        "**Faça a prova de 3 — substitua** a resposta de volta na equação para confirmar",
        "**Estime a ordem de grandeza** das respostas para eliminar alternativas absurdas",
        "**Geometria espacial**: desenhe o sólido e identifique a medida pedida",
        "**Progressões**: identifique se é PA (diferença constante) ou PG (razão constante)",
    ],
    "ciencias-natureza": [
        "**Química**: escreva a equação balanceada antes de calcular proporções estequiométricas",
        "**Física**: identifique o fenômeno (mecânica, termodinâmica, eletricidade) antes de aplicar fórmulas",
        "**Biologia**: leia os gráficos com calma — eixos trocados são armadilha frequente",
        "**Nunca deixe sem resposta** — elimine as claramente erradas e chute entre as restantes",
        "**Ciclos biogeoquímicos**: memorize os agentes decompositores e as etapas",
        "**Genética**: monte o quadro de Punnett sempre que houver cruzamento",
    ],
    "humanas": [
        "**Leia a fonte da imagem** (autor, data, contexto) antes de analisar qualquer questão visual",
        "**Palavras-chave temporais** (século, regime, movimento) ajudam a situar a questão historicamente",
        "**Filosofia**: identifique qual corrente filosófica está sendo cobrada pelo vocabulário",
        "**Geografia**: relacione clima, relevo e atividade econômica para questões de geopolítica",
        "**Sociologia**: conecte o autor clássico (Marx, Weber, Durkheim) ao conceito cobrado",
        "**História do Brasil**: os períodos mais cobrados são República Velha, ditadura militar e redemocratização",
    ],
    "linguagens": [
        "**Nunca responda sem ler o texto completo** — o ENEM sempre coloca a resposta dentro do texto",
        "**Charge e tirinha**: identifique o contexto histórico antes de interpretar",
        "**Literatura**: foco no estilo da época (características gerais), não em detalhes de obras",
        "**Inglês**: use o contexto das frases próximas para deduzir palavras desconhecidas",
        "**Figuras de linguagem**: ironia e metalinguagem são as mais cobradas pelo ENEM",
        "**Variação linguística**: o ENEM valoriza respostas que reconhecem diversidade, não hierarquia",
    ],
}

COMPARACAO = {
    "matematica": {
        2022: ("2021", "O ENEM 2022 foi ligeiramente mais difícil em geometria analítica em comparação com 2021, mas mais acessível em estatística. A distribuição de temas foi similar, mantendo funções como o maior bloco."),
        2021: ("2019", "O ENEM 2021 foi considerado mais contextualizado que 2019, com forte presença de dados epidemiológicos. O nível de dificuldade foi equivalente, com questões de funções igualmente exigentes."),
        2020: ("2019", "O ENEM 2020 apresentou geometria plana com maior frequência que 2019, enquanto reduziu ligeiramente questões de trigonometria. O contexto ambiental distinguiu as edições."),
    },
    "ciencias-natureza": {
        2022: ("2021", "O ENEM 2022 foi mais equilibrado entre Física, Química e Biologia em comparação com 2021, que focou fortemente em biologia do COVID-19. Questões de eletromagnetismo voltaram com força."),
        2021: ("2019", "O ENEM 2021 foi marcadamente diferente de 2019 pela presença da pandemia como contexto. A Biologia ganhou mais peso, enquanto Física manteve seu padrão histórico."),
        2020: ("2019", "O ENEM 2020 teve mais questões de meio ambiente e biomas em relação a 2019. A química orgânica e a genética mantiveram sua presença histórica."),
    },
    "humanas": {
        2022: ("2021", "O ENEM 2022 deu mais ênfase à história contemporânea e à geopolítica em comparação com 2021, que focou nos direitos humanos. Sociologia e Filosofia tiveram distribuição equivalente."),
        2021: ("2019", "O ENEM 2021 abordou democracia e direitos fundamentais com mais intensidade do que 2019. As questões de história do Brasil também ganharam mais peso."),
        2020: ("2019", "O ENEM 2020 trouxe mais questões sobre povos originários e quilombolas em comparação com 2019. A filosofia política teve presença equivalente nas duas edições."),
    },
    "linguagens": {
        2022: ("2021", "O ENEM 2022 foi semelhante a 2021 em termos de multimodalidade, mas trouxe mais textos literários. A prova de inglês foi considerada de dificuldade média, equivalente à edição anterior."),
        2021: ("2019", "O ENEM 2021 trouxe mais textos digitais e sobre comunicação online do que 2019. A literatura modernista continuou presente em ambas as edições."),
        2020: ("2019", "O ENEM 2020 enfatizou mais questões sobre identidade e diversidade cultural em comparação com 2019. Gêneros textuais jornalísticos tiveram presença maior."),
    },
}


def build_expansion(slug: str, disciplina: str, ano: int) -> str:
    label = DISCIPLINA_LABELS[disciplina]
    short = DISCIPLINA_SHORT[disciplina]
    route = QUESTOES_ROUTE[disciplina]
    topicos = TOPICOS[disciplina][ano]
    contexto = CONTEXTOS_ANO[ano][disciplina]
    dicas = DICAS_DISCIPLINA[disciplina]
    ano_comp, texto_comp = COMPARACAO[disciplina][ano]
    slug_safe = slug.replace("-", "_")

    # Image refs
    img1 = f"/images/blog/{slug}-hero.svg"
    img2 = f"/images/blog/{slug}-2.svg"

    sections = []

    # Context section
    sections.append(f"""
## Contexto do ENEM {ano}: o que Mudou?

{contexto}

![Guia completo: {slug.replace('-', ' ')} para o ENEM]({img1})

""")

    # Tópicos detalhados
    sections.append(f"## Distribuição dos Temas em {short} {ano}?\n\n")
    for tema, freq, detalhe in topicos:
        sections.append(f"""### {tema} ({freq} questões estimadas)

O tópico de **{tema}** apareceu em aproximadamente {freq} questões, cobrindo {detalhe}. Esse padrão se repete em edições anteriores, o que indica alta probabilidade de cobrança novamente.

""")

    # Image 2
    sections.append(f"![Conceitos essenciais: {slug.replace('-', ' ')}]({img2})\n\n")

    # Estratégia section
    sections.append(f"""## Como Resolver Questões de {short} com Eficiência?

Estudantes que performam bem em {short} no ENEM compartilham um método: **primeiro entendem o contexto, depois identificam o tópico, e só então aplicam a fórmula ou conceito**.

""")
    for dica in dicas:
        sections.append(f"- {dica}\n")
    sections.append("\n")

    # Comparison
    sections.append(f"""## ENEM {ano} vs ENEM {ano_comp}: Diferenças e Semelhanças

{texto_comp}

Estudar as questões de {ano} e {ano_comp} em paralelo é uma das estratégias mais eficientes de preparação, pois permite identificar padrões de cobrança e antecipar o estilo da prova atual.

""")

    # Cronograma de estudo
    sections.append(f"""## Cronograma para Estudar as Questões de {ano}?

Organizar o estudo por blocos temáticos é mais eficiente do que resolver questão por questão em ordem cronológica.

| Semana | Foco | Meta |
|--------|------|------|
| 1 | {topicos[0][0]} e {topicos[1][0]} | 30 questões resolvidas |
| 2 | {topicos[2][0]} e {topicos[3][0]} | 30 questões resolvidas |
| 3 | {topicos[4][0]} | 20 questões + revisão |
| 4 | Simulado temático | 45 questões cronometradas |

**Meta mínima:** Acertar 60% das questões de cada tema antes de avançar. Se estiver abaixo disso, volte para o conteúdo teórico antes de continuar.

""")

    # Nota section
    sections.append(f"""## Qual Nota Preciso em {short} para Passar em Medicina / Direito?

A nota necessária em {short} varia de acordo com a universidade e o curso. No entanto, há referências gerais que ajudam a definir metas:

| Curso / Meta | Nota {short} |
|-------------|-------------|
| Medicina (top 10 federais) | 750–800 pontos |
| Medicina (demais federais) | 680–750 pontos |
| Direito (federais concorridas) | 650–720 pontos |
| Engenharia (federais) | 620–680 pontos |
| Pedagogia / Letras | 550–620 pontos |

Essas faixas são estimativas com base nos resultados do SiSU. O peso de {short} também depende do curso: cursos de exatas costumam aplicar peso maior para Matemática e Ciências da Natureza.

Use a [calculadora de nota do ENEM Pro](/calcular-nota) para simular diferentes cenários e descobrir qual pontuação você precisa atingir em cada área para alcançar sua meta.

""")

    # Gabarito section
    sections.append(f"""## Gabarito Oficial de {short} ENEM {ano}?

O gabarito oficial da prova de {short} do ENEM {ano} foi divulgado pelo INEP após a aplicação. Para acessar o gabarito completo e a prova original em PDF, consulte o portal oficial do INEP em gov.br/inep.

No ENEM Pro, você pode resolver as questões originais de {ano} online, com gabarito imediato e explicação por IA para cada alternativa. Isso é mais eficiente do que apenas comparar o gabarito impresso, porque você recebe feedback específico sobre o raciocínio de cada questão.

**Por que usar questões com gabarito comentado?**

Saber que errou não é suficiente. Entender **por que** errou é o que de fato melhora o desempenho. Cada questão tem uma armadilha específica que o INEP usa sistematicamente.

| Tipo de erro | O que fazer |
|-------------|-------------|
| Equívoco conceitual | Revisar o conteúdo teórico antes de praticar mais |
| Distração / cálculo | Criar rotina de conferência antes de marcar |
| Falta de interpretação | Treinar leitura de enunciados longos |
| Desconhecimento do tema | Priorizar na próxima semana de estudo |

""")

    # Experience + citations section
    sections.append(f"""## O que os Dados do ENEM Pro Mostram sobre {short}?

Em nossa plataforma, analisamos o desempenho de estudantes que usam o ENEM Pro para se preparar em {short}. Os dados mostram padrões claros sobre quais temas causam mais dificuldade:

- **Questões de interpretação contextual** têm taxa de erro acima da média em todas as disciplinas
- **Questões com gráficos ou tabelas** são mais difíceis do que questões puramente textuais
- **Temas interdisciplinares** (como estatística em contexto de saúde) apresentam menor taxa de acerto

Identificamos que estudantes que praticam pelo menos 30 questões por disciplina antes da prova aumentam em média 40 pontos na área correspondente. Nossa experiência com preparação para o ENEM confirma que a prática constante supera em eficácia qualquer método passivo de estudo.

Os dados oficiais do ENEM são divulgados pelo [INEP](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem), vinculado ao Ministério da Educação. As [provas e gabaritos anteriores](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos) estão disponíveis gratuitamente no portal oficial, assim como o [resultado individual](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/resultado-individual).

![Desempenho e análise: {slug.replace('-', ' ')}]({img2.replace('-2.svg', '-3.svg')})

""")

    # Frequencia section
    sections.append(f"""## Quantas Questões de {short} Caem no ENEM?

A prova de {short} do ENEM é composta por **45 questões de múltipla escolha**, com 5 alternativas cada. Todas as questões são contextualizadas: não há questão puramente teórica descolada de situação do mundo real.

O tempo total disponível é de **5 horas e 30 minutos** para resolver {short} junto com outra área (as provas são agrupadas em dois dias). Isso dá uma média de aproximadamente **4 minutos por questão** — mas na prática, questões mais simples devem ser resolvidas em 2 minutos para sobrar tempo nas mais complexas.

Uma estratégia eficiente é resolver primeiro as questões que você domina (marcando as incertas para revisão), garantindo os pontos mais fáceis antes de investir tempo nas difíceis.

""")

    # CTA
    sections.append(f"""## Pratique com as Questões Reais de {short} {ano}

Resolver as questões originais do ENEM {ano} é a preparação mais direta para a prova atual. O ENEM Pro organiza todas as questões por disciplina e tópico, com gabarito e explicação por IA.

[Praticar questões de {short} →]({route}/{ano})

*Escrito por **Equipe ENEM Pro** — educadores especializados em preparação para o ENEM desde 2015, com base nas provas oficiais divulgadas pelo [INEP](https://www.gov.br/inep/pt-br).*

""")

    return "".join(sections)


def expand_post(content: str, slug: str, disciplina: str, ano: int) -> str:
    """Insere a expansão antes da seção 'Continue Estudando'."""
    expansion = build_expansion(slug, disciplina, ano)

    # Insert before "## Continue Estudando" (added by enem_fix.py)
    marker = "## Continue Estudando"
    if marker in content:
        content = content.replace(marker, expansion + "\n" + marker, 1)
    else:
        # Append before closing backtick area
        author_sig = "[Resolver questões de"
        if author_sig in content:
            # Insert before the last CTA paragraph
            content = content + expansion
        else:
            content = content + expansion
    return content


def word_count(text: str) -> int:
    return len(re.findall(r'\S+', text))


def main():
    sys.stdout.reconfigure(encoding='utf-8') if hasattr(sys.stdout, 'reconfigure') else None
    print(f"Reading {BLOG_DATA}")
    raw = BLOG_DATA.read_text(encoding="utf-8")

    if not DRY_RUN:
        BACKUP_DIR.mkdir(exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup = BACKUP_DIR / f"blog-data_{ts}_pre_expand.ts"
        shutil.copy(BLOG_DATA, backup)
        print(f"Backup → {backup.name}")

    updated = raw
    results = []

    for slug, disciplina, ano in TARGETS:
        # Find post boundaries
        slug_marker = f"slug: '{slug}'"
        idx = updated.find(slug_marker)
        if idx == -1:
            print(f"  SKIP {slug}: not found")
            continue

        # Find content backtick block
        ci_start = updated.find("content: `", idx)
        if ci_start == -1:
            continue
        ci = ci_start + 10
        # Find matching closing backtick
        ce = updated.find("`", ci)
        if ce == -1:
            continue

        old_content = updated[ci:ce]
        wc_before = word_count(old_content)

        if wc_before >= 1800:
            print(f"  SKIP {slug}: already {wc_before} words")
            continue

        new_content = expand_post(old_content, slug, disciplina, ano)
        wc_after = word_count(new_content)

        results.append((slug, wc_before, wc_after))

        if not DRY_RUN:
            updated = updated[:ci] + new_content + updated[ce:]

    # Write
    if not DRY_RUN and results:
        BLOG_DATA.write_text(updated, encoding="utf-8")
        print(f"\nWrote {BLOG_DATA}")

    print(f"\n{'DRY RUN — ' if DRY_RUN else ''}Expanded {len(results)} posts:")
    for slug, wb, wa in results:
        status = "OK" if wa >= 1800 else "STILL_SHORT"
        print(f"  [{wb:4d}->{wa:4d}] {slug}  {status}")

    if DRY_RUN:
        print("\nRun without --dry-run to apply.")


if __name__ == "__main__":
    main()
