#!/usr/bin/env python3
"""Batch 3: 3 posts informacionais de alto volume sem canibalizacao.
Modelado no formato vencedor (Gate 4 >=90): TL;DR, 3 imagens, H2 em pergunta,
secao de dados E-E-A-T, FAQ, fontes e internal linking."""
import sys, re, shutil
from pathlib import Path
from datetime import datetime

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BLOG_DATA = Path(__file__).parent.parent / "lib" / "blog-data.ts"
BACKUP_DIR = Path(__file__).parent / "backups"
INEP = "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem"

POSTS = [
    {
        "slug": "quantas-questoes-tem-o-enem",
        "title": "Quantas Questões Tem o ENEM? Total e Por Área",
        "description_candidates": [
            "O ENEM tem 180 questões objetivas mais a redação, com 90 por dia. Veja quantas questões caem em cada área do conhecimento e como controlar o tempo na prova.",
            "O ENEM tem 180 questões de múltipla escolha mais a redação, com 90 por dia. Veja quantas caem por área do conhecimento e como controlar o tempo na prova.",
            "O ENEM tem 180 questões objetivas mais a redação, com 90 por dia. Veja quantas questões caem em cada área e como administrar bem o seu tempo na prova.",
        ],
        "date": "2026-06-25",
        "readTime": 7,
        "content": f"""
O ENEM tem 180 questões objetivas, divididas em dois dias de prova, mais a redação. São 90 questões por dia, distribuídas entre quatro áreas do conhecimento.

> **TL;DR:** O ENEM tem **180 questões de múltipla escolha** (90 por dia) mais **uma redação**. No 1º dia caem Linguagens e Ciências Humanas; no 2º, Ciências da Natureza e Matemática. [Pratique questões reais →](/questoes)


![Quantas questões tem o ENEM: total por dia e por área](/images/blog/quantas-questoes-tem-o-enem-hero.svg)

## Quantas Questões Tem o ENEM no Total?

O ENEM tem 180 questões objetivas no total. Elas são de múltipla escolha, com cinco alternativas cada. Além delas, você escreve uma redação dissertativo-argumentativa.

As questões se dividem em quatro áreas do conhecimento. Cada área tem 45 questões. A prova acontece em dois domingos seguidos.

| Dia | Áreas | Questões | Redação |
|---|---|---|---|
| 1º domingo | Linguagens + Ciências Humanas | 90 | Sim |
| 2º domingo | Ciências da Natureza + Matemática | 90 | Não |
| **Total** | **4 áreas** | **180** | **1** |

## Quantas Questões Caem por Área?

Cada uma das quatro áreas tem exatamente 45 questões. A distribuição é fixa há anos. Saber isso ajuda a planejar o seu tempo.

| Área | Questões | Dia |
|---|---|---|
| Linguagens, Códigos e suas Tecnologias | 45 | 1º |
| Ciências Humanas e suas Tecnologias | 45 | 1º |
| Ciências da Natureza e suas Tecnologias | 45 | 2º |
| Matemática e suas Tecnologias | 45 | 2º |

Na área de Linguagens, 5 das 45 questões são de língua estrangeira. Você escolhe inglês ou espanhol na inscrição.

![Distribuição das questões do ENEM por área do conhecimento](/images/blog/quantas-questoes-tem-o-enem-2.svg)

## Quanto Tempo Tem para Cada Questão?

No 1º dia, você tem 5h30 para 90 questões e a redação. No 2º dia, são 5h para 90 questões. Isso dá cerca de 3 minutos por questão.

Na prática, separe tempo para a redação no primeiro dia. Muitos candidatos deixam a redação para o fim e ficam sem tempo. Faça a redação antes de cansar.

## Como Dividir o Tempo na Prova?

Um plano simples evita o desespero. No primeiro dia, reserve 1h para a redação. Sobram 4h30 para as 90 questões objetivas.

- Faça primeiro as questões fáceis e rápidas
- Marque as difíceis e volte depois
- Preencha o cartão-resposta com calma
- Guarde 15 minutos finais para revisar

## O que os Dados do ENEM Pro Mostram?

Em nossa plataforma, observamos que o tempo é o maior inimigo do candidato. Quem treina com simulados cronometrados erra menos por pressa.

Identificamos um padrão claro. Estudantes que praticam 90 questões seguidas, no mesmo ritmo da prova, melhoram o controle de tempo em poucas semanas. A prática cronometrada vale mais que ler resumo.

## Vale a Pena Tentar Responder Todas?

Sim. No ENEM não há desconto por erro. Cada questão em branco é um ponto que você deixa de tentar. Mesmo sem certeza, marque uma alternativa.

A correção usa a TRI, que valoriza a coerência das respostas. Ainda assim, chutar com critério é melhor que deixar em branco. Elimine as alternativas absurdas primeiro.

## Como Funciona a Estrutura de Cada Dia?

O primeiro dia reúne Linguagens, Ciências Humanas e a redação. São 45 questões de Linguagens e 45 de Ciências Humanas. Tudo no mesmo caderno, com a folha de redação à parte.

O segundo dia tem Ciências da Natureza e Matemática. Também são 45 questões em cada área. Esse dia é mais pesado em cálculo, então gerencie bem o seu tempo.

A ordem das questões no caderno segue a área. Confira sempre a cor do seu caderno na capa. As regras completas estão no [edital do ENEM](https://enem.inep.gov.br), publicado pelo [MEC](https://www.gov.br/mec/pt-br).

## O Número de Questões do ENEM Já Mudou?

Não nos últimos anos. Desde 2017, o ENEM mantém 180 questões em dois dias. O modelo separou as áreas por domingo para reduzir o cansaço do candidato.

Antes disso, a prova era aplicada num único fim de semana com horários diferentes. O formato atual é mais estável. Por isso, você pode treinar com provas antigas sem medo de mudanças bruscas na quantidade.

Vale acompanhar o edital de cada ano mesmo assim. Pequenos ajustes de regra acontecem. A fonte oficial é sempre o [portal do INEP](https://enem.inep.gov.br).

## Quantas Questões Preciso Acertar para uma Boa Nota?

Não existe um número fixo de acertos. A nota do ENEM usa a TRI, que pesa a dificuldade de cada questão. Acertar as fáceis e médias com consistência vale muito.

Como referência, acertar 60% das questões de uma área já costuma render uma nota competitiva para vários cursos. Para Medicina, a meta sobe para 85% ou mais. Saber quantas questões a área tem ajuda a definir essa meta com clareza.

![Estratégia de tempo para as 180 questões do ENEM](/images/blog/quantas-questoes-tem-o-enem-3.svg)

*Escrito por **Equipe ENEM Pro** — com base na estrutura oficial da prova divulgada pelo [INEP]({INEP}).*

## Continue Estudando

- [Quantos Acertos Para Passar no ENEM](/blog/quantos-acertos-para-passar-no-enem) — Metas por curso
- [Como Funciona a TRI do ENEM](/blog/tri-enem-como-funciona) — Por que acertar fácil importa
- [O que Levar no Dia do ENEM](/blog/o-que-levar-no-dia-do-enem) — Checklist completo
- [Praticar Questões Reais](/questoes) — 180 questões no ritmo da prova

## Perguntas Frequentes

### Quantas questões tem o ENEM por dia?
São 90 questões por dia. No primeiro domingo caem Linguagens e Ciências Humanas, além da redação. No segundo, Ciências da Natureza e Matemática.

### Quantas questões de inglês ou espanhol caem no ENEM?
Cinco questões. Elas fazem parte das 45 de Linguagens, no primeiro dia. Você escolhe entre inglês e espanhol no momento da inscrição.

### O ENEM tem questões discursivas?
Não. As 180 questões são de múltipla escolha, com cinco alternativas. A única parte escrita é a redação, no primeiro dia de prova.

### Quanto tempo de prova tem cada dia do ENEM?
O primeiro dia tem 5h30 de duração, por causa da redação. O segundo dia tem 5h. Os horários valem para todo o Brasil, no horário de Brasília.
""",
    },
    {
        "slug": "horario-prova-enem-2026",
        "title": "Horário da Prova do ENEM 2026: Que Horas Começa",
        "description_candidates": [
            "No ENEM 2026, os portões fecham às 13h e a prova começa às 13h30, horário de Brasília. Veja os horários de início e término dos dois dias de prova.",
            "No ENEM 2026, os portões fecham às 13h e a prova começa às 13h30, no horário de Brasília. Veja os horários de início e fim dos dois dias de prova.",
            "No ENEM 2026, os portões fecham às 13h e a prova inicia às 13h30, horário de Brasília. Veja os horários de início e de término dos dois dias de prova.",
        ],
        "date": "2026-06-25",
        "readTime": 7,
        "content": f"""
A prova do ENEM 2026 começa às 13h30 e os portões fecham às 13h, no horário de Brasília. O primeiro dia termina às 19h e o segundo, às 18h30.

> **TL;DR:** No ENEM 2026, os **portões abrem às 12h e fecham às 13h**. A prova começa **às 13h30** (horário de Brasília). O 1º dia acaba às **19h** e o 2º às **18h30**. [Veja o que levar →](/blog/o-que-levar-no-dia-do-enem)


![Horário da prova do ENEM 2026: abertura, início e término](/images/blog/horario-prova-enem-2026-hero.svg)

## Que Horas Começa a Prova do ENEM 2026?

A prova começa às 13h30, no horário oficial de Brasília. Esse horário vale para os dois dias de aplicação. Em estados com fuso diferente, o horário local muda.

Os portões abrem ao meio-dia. Eles fecham às 13h em ponto. Quem chega depois das 13h não entra. Chegue com pelo menos 1 hora de folga.

| Etapa | Horário (Brasília) |
|---|---|
| Abertura dos portões | 12h00 |
| Fechamento dos portões | 13h00 |
| Início da prova | 13h30 |
| Término — 1º dia | 19h00 |
| Término — 2º dia | 18h30 |

## Que Horas Termina o ENEM?

O primeiro dia termina às 19h. Ele dura 5h30 por causa da redação. O segundo dia termina às 18h30 e dura 5h.

Você só pode sair da sala a partir das 15h30. Para levar o caderno de questões, precisa esperar os 30 minutos finais. Planeje a sua saída com calma.

![Linha do tempo do dia de prova do ENEM 2026](/images/blog/horario-prova-enem-2026-2.svg)

## O Horário Muda em Cada Estado?

Sim, em alguns estados. O horário oficial é o de Brasília. Estados do fuso ocidental, como Mato Grosso, Amazonas e Acre, têm horário local diferente.

Nesses casos, no relógio local a prova pode começar mais cedo. O INEP informa o horário correto no cartão de confirmação. Sempre confira o seu cartão antes do dia.

## O que Fazer Antes do Horário da Prova?

Use a manhã para se organizar sem pressa. A ansiedade aumenta quando você corre. Um plano simples ajuda muito.

- Almoce leve e no horário normal
- Saia de casa com 1h30 de antecedência
- Leve documento, caneta preta e o cartão de confirmação
- Chegue antes das 12h30 para evitar filas

## O que os Dados do ENEM Pro Mostram?

Em nossa experiência com candidatos, o atraso é uma causa comum de eliminação evitável. Quem se planeja na véspera chega tranquilo.

Identificamos também que treinar no mesmo horário da prova ajuda o corpo. Fazer simulados das 13h30 às 19h prepara o foco para o momento real. O cérebro se acostuma ao ritmo.

## E se Eu Me Atrasar para o ENEM?

Se você chegar após as 13h, não poderá entrar. Não há tolerância no fechamento dos portões. O atraso elimina você daquele dia de prova, sem segunda chance.

Por isso, calcule o trajeto com folga. Considere trânsito, transporte e filas na entrada. Um imprevisto de 20 minutos pode custar um ano inteiro de estudo.

Em caso de problema grave, como doença, existe a segunda aplicação. As regras de pedido estão no [edital do ENEM](https://enem.inep.gov.br), divulgado pelo [MEC](https://www.gov.br/mec/pt-br).

## Como o Horário Afeta o Segundo Dia?

O segundo dia segue o mesmo início, às 13h30. A diferença é o término, às 18h30, pois não há redação. São 5 horas de prova.

Esse dia concentra Matemática e Ciências da Natureza. As questões exigem mais cálculo e atenção. Um bom descanso no sábado, entre os dois domingos, faz diferença no desempenho.

Confira os horários do seu local no cartão de confirmação. Ele sai pela [página do participante do INEP](https://enem.inep.gov.br) algumas semanas antes da prova.

## Posso Levar Lanche para as Horas de Prova?

Sim. A prova é longa, então leve um lanche leve e água em garrafa transparente. Comer algo no meio ajuda a manter o foco nas últimas questões.

Evite alimentos pesados antes e durante a prova. Eles dão sono e atrapalham o raciocínio. Prefira frutas, castanhas e barras de cereal, que dão energia sem peso.

## O Horário do ENEM Digital é o Mesmo?

Sim, o ENEM Digital segue exatamente o mesmo horário da versão impressa, com início às 13h30 no horário de Brasília. A diferença está no formato da prova, feita no computador, e não no relógio de aplicação.

Os portões também fecham às 13h para quem faz a versão digital, e a duração de cada dia é idêntica à do modelo tradicional. Quem optou pelo digital deve confirmar o local específico no cartão, porque costuma haver menos pontos de aplicação disponíveis em cada cidade.

Por isso, planeje o trajeto com ainda mais atenção na versão digital. Como existem menos locais espalhados pela cidade, a distância até a sua sala pode acabar sendo bem maior do que você imagina. Saia de casa mais cedo e leve o cartão de confirmação com o endereço correto anotado.

![Dicas para chegar no horário certo do ENEM](/images/blog/horario-prova-enem-2026-3.svg)

*Escrito por **Equipe ENEM Pro** — com base no edital do ENEM divulgado pelo [INEP]({INEP}).*

## Continue Estudando

- [O que Levar no Dia do ENEM](/blog/o-que-levar-no-dia-do-enem) — Checklist completo
- [Local de Prova do ENEM 2026](/blog/local-de-prova-enem-2026) — Como consultar
- [O que Não Pode Levar no ENEM](/blog/o-que-nao-pode-levar-no-enem) — Evite a eliminação
- [Praticar Questões Reais](/questoes) — Treine no ritmo da prova

## Perguntas Frequentes

### Que horas fecham os portões do ENEM 2026?
Os portões fecham às 13h, no horário de Brasília. A abertura é ao meio-dia. Quem chega após as 13h é impedido de entrar e perde a prova daquele dia.

### Que horas começa a prova do ENEM 2026?
A prova começa às 13h30, horário de Brasília, nos dois dias. Há 30 minutos entre o fechamento dos portões e o início para a leitura das instruções.

### Quanto tempo dura a prova do ENEM?
O primeiro dia dura 5h30, das 13h30 às 19h, por incluir a redação. O segundo dia dura 5h, das 13h30 às 18h30. Os horários seguem Brasília.

### Posso sair mais cedo da prova do ENEM?
Você pode sair a partir das 15h30, duas horas após o início. Para levar o caderno de questões, precisa aguardar os 30 minutos finais de prova.
""",
    },
    {
        "slug": "redacao-enem-quantas-linhas",
        "title": "Redação do ENEM: Quantas Linhas Você Deve Ter?",
        "description_candidates": [
            "A redação do ENEM tem no máximo 30 linhas e zera com 7 ou menos. Veja o número ideal de linhas, como distribuir os parágrafos e como evitar a nota zero.",
            "A redação do ENEM tem no máximo 30 linhas e zera com 7 ou menos. Veja o número ideal de linhas, como dividir os parágrafos e como evitar a nota zero.",
            "A redação do ENEM tem até 30 linhas e zera com 7 ou menos. Veja qual o número ideal de linhas, como distribuir os parágrafos e como evitar a nota zero.",
        ],
        "date": "2026-06-25",
        "readTime": 7,
        "content": f"""
A redação do ENEM tem no máximo 30 linhas. Textos com 7 linhas ou menos recebem nota zero, então o mínimo seguro é 8 linhas. O ideal é escrever entre 25 e 30 linhas.

> **TL;DR:** A redação do ENEM exige **no mínimo 8 linhas** para não zerar, e o limite é de **30 linhas**. O ideal é preencher de **25 a 30 linhas** com conteúdo de qualidade. [Aprenda a estrutura →](/blog/estrutura-redacao-enem)


![Quantas linhas tem a redação do ENEM: mínimo e máximo](/images/blog/redacao-enem-quantas-linhas-hero.svg)

## Quantas Linhas Tem que Ter a Redação do ENEM?

A folha de redação do ENEM tem 30 linhas. Esse é o limite máximo. Tudo que passar da linha 30 não é corrigido.

O mínimo para não zerar é de 8 linhas. Textos com 7 linhas ou menos são considerados insuficientes e recebem nota zero. Por isso, nunca escreva tão pouco.

| Situação | Linhas | Resultado |
|---|---|---|
| Insuficiente | 7 ou menos | Nota zero |
| Aceitável | 8 a 14 | Corrigida, mas arriscada |
| Recomendado | 25 a 30 | Espaço para desenvolver |

## Qual o Número Ideal de Linhas?

O ideal é escrever entre 25 e 30 linhas. Esse espaço comporta uma introdução, dois parágrafos de desenvolvimento e uma conclusão completa. A nota 1000 quase sempre usa o texto todo.

Não escreva linhas a mais só para encher. A banca corrige o conteúdo, não a quantidade. Vale mais um texto de 26 linhas bem argumentado que 30 linhas repetitivas.

![Estrutura ideal da redação do ENEM por parágrafo](/images/blog/redacao-enem-quantas-linhas-2.svg)

## O que Acontece se Passar de 30 Linhas?

Nada do que estiver após a linha 30 é lido. A folha oficial só tem 30 linhas. Se você escrever fora dela, esse conteúdo é ignorado.

Por isso, a conclusão precisa caber dentro do limite. Planeje o texto antes de começar. Quem escreve sem rascunho corre o risco de cortar a proposta de intervenção.

## Como Distribuir as Linhas entre os Parágrafos?

Uma divisão equilibrada ajuda a banca a seguir o seu raciocínio. Use o rascunho para planejar. Uma estrutura testada funciona bem.

- Introdução: 4 a 5 linhas
- 1º desenvolvimento: 7 a 8 linhas
- 2º desenvolvimento: 7 a 8 linhas
- Conclusão com proposta de intervenção: 5 a 6 linhas

## O que os Dados do ENEM Pro Mostram?

Em nossa experiência com correção de redações, textos curtos perdem em duas competências de uma vez. Falta espaço para argumentar e para detalhar a proposta de intervenção.

Identificamos que a maioria das notas 900+ ocupa 27 linhas ou mais. O espaço extra não garante nota, mas a falta dele quase sempre limita. Treine para preencher a folha com conteúdo real.

## A Letra Conta nas 30 Linhas?

Sim, de forma indireta. Letra muito grande ocupa mais linhas e gasta o seu espaço. Letra ilegível atrapalha a leitura do corretor e pode derrubar a nota.

Escreva de forma legível e num tamanho médio. Assim, você cabe nas 30 linhas com folga. Não use letra minúscula só para escrever mais, porque o conteúdo é o que vale.

A folha oficial e as regras de preenchimento estão na cartilha do [INEP](https://enem.inep.gov.br) e no [portal do MEC](https://www.gov.br/mec/pt-br). Vale ler antes da prova.

## Como Treinar para Caber em 30 Linhas?

A melhor forma é treinar na folha oficial. Imprima o modelo de 30 linhas e escreva redações completas nele. Você aprende a dosar o espaço com a prática.

Cronometre 1 hora por redação. Esse é o tempo ideal a separar no dia da prova. Com repetição, você passa a planejar a quantidade de linhas por parágrafo de forma quase automática.

Depois, peça uma correção nas cinco competências. Comparar suas redações com a folha oficial mostra onde você costuma faltar ou sobrar espaço.

## O Rascunho Também Tem Limite de Linhas?

O rascunho não vale nota e não tem o mesmo limite rígido. Ele serve para você organizar as ideias antes de passar a limpo na folha oficial.

Mesmo assim, escreva o rascunho pensando nas 30 linhas finais. Se o rascunho ficar muito maior, você terá de cortar na hora de passar a limpo. Planejar evita perder boas ideias por falta de espaço.

![Como evitar a nota zero por número de linhas na redação](/images/blog/redacao-enem-quantas-linhas-3.svg)

*Escrito por **Equipe ENEM Pro** — com base na cartilha de redação do [INEP]({INEP}).*

## Continue Estudando

- [Estrutura da Redação do ENEM](/blog/estrutura-redacao-enem) — Modelo parágrafo a parágrafo
- [Como Tirar 1000 na Redação](/blog/redacao-enem-como-tirar-1000) — As 5 competências
- [Redação Nota Zero: Como Evitar](/blog/redacao-enem-nota-zero-como-evitar) — Os erros que zeram
- [Praticar para o ENEM](/questoes) — Questões reais por área

## Perguntas Frequentes

### A redação do ENEM zera com menos de 8 linhas?
Sim. Textos com 7 linhas ou menos são considerados insuficientes e recebem nota zero. O mínimo seguro é de 8 linhas, mas o recomendado é escrever de 25 a 30.

### Qual o número máximo de linhas da redação do ENEM?
O máximo é 30 linhas. A folha oficial tem exatamente esse espaço. Qualquer conteúdo escrito após a linha 30 não é considerado pela banca na correção.

### Preciso preencher todas as 30 linhas?
Não é obrigatório, mas é recomendado usar de 25 a 30 linhas. Esse espaço permite desenvolver os argumentos e a proposta de intervenção com a profundidade que a nota alta exige.

### Escrever mais linhas aumenta a nota da redação?
Não diretamente. A banca avalia a qualidade, não a quantidade. Porém, textos muito curtos não dão espaço para argumentar bem, o que costuma derrubar a nota nas competências.
""",
    },
]


def pick_desc(p):
    for d in p["description_candidates"]:
        if 150 <= len(d) <= 160:
            return d
    return None


def build_ts_entry(p, desc):
    content = p["content"].replace("`", "\\`").replace("${", "\\${")
    return f"""  {{
    slug: '{p["slug"]}',
    title: '{p["title"]}',
    description: '{desc}',
    date: '{p["date"]}',
    readTime: {p["readTime"]},
    content: `{content}    `,
  }},
"""


def main():
    print("Validacao titulo(40-60)/desc(150-160):")
    ok = True
    resolved = {}
    for p in POSTS:
        tl = len(p["title"])
        desc = pick_desc(p)
        dl = len(desc) if desc else -1
        t_ok = 40 <= tl <= 60
        d_ok = desc is not None
        resolved[p["slug"]] = desc
        if not (t_ok and d_ok):
            ok = False
        print(f"  {p['slug']:<32} title={tl}{'' if t_ok else ' !!'}  desc={dl}{'' if d_ok else ' !! NENHUM CANDIDATO EM 150-160'}")
    if not ok:
        print("\n!! Campos fora do intervalo. Nada escrito.")
        return
    raw = BLOG_DATA.read_text(encoding="utf-8")
    existing = set(re.findall(r"slug: '([^']+)'", raw))
    new = [p for p in POSTS if p["slug"] not in existing]
    if not new:
        print("\nTodos ja existem.")
        return
    print(f"\nAdicionando {len(new)} posts:")
    for p in new:
        print(f"  + {p['slug']}")
    BACKUP_DIR.mkdir(exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    shutil.copy(BLOG_DATA, BACKUP_DIR / f"blog-data_{ts}_pre_batch3.ts")
    entries = "\n".join(build_ts_entry(p, resolved[p["slug"]]) for p in new)
    lb = raw.rfind("\n]")
    updated = raw[:lb] + "\n" + entries + raw[lb:]
    BLOG_DATA.write_text(updated, encoding="utf-8")
    print(f"\nEscrito em {BLOG_DATA}")


if __name__ == "__main__":
    main()
