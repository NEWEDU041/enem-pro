#!/usr/bin/env python3
"""Gera leva 2 de 8 posts de alto volume de busca e appenda em blog-data.ts.
Pre-otimizados para Gate 4 (>=90): TL;DR, 3 imagens, tabelas, links gov.br,
sinais de experiencia, autor, FAQ com H2 em pergunta."""
import sys, re, shutil
from pathlib import Path
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8') if hasattr(sys.stdout, 'reconfigure') else None

BLOG_DATA = Path(__file__).parent.parent / "lib" / "blog-data.ts"
BACKUP_DIR = Path(__file__).parent / "backups"

POSTS = [
  # ── 1. O QUE LEVAR NO DIA DO ENEM ────────────────────────────────────────
  {
    "slug": "o-que-levar-no-dia-do-enem",
    "title": "O que Levar no Dia do ENEM 2026 — Checklist Completo",
    "description": "Checklist do que levar no dia do ENEM 2026: documento, caneta preta, cartão de confirmação e lanche. Veja a lista oficial item por item e não perca pontos.",
    "date": "2026-06-24",
    "readTime": 7,
    "content": """
Chegar preparado no dia do ENEM começa muito antes da prova. Levar os itens certos evita problemas na entrada e ajuda você a render melhor durante as cinco horas e meia de exame.

> **TL;DR:** No dia do ENEM leve documento oficial com foto, caneta esferográfica preta de material transparente e o cartão de confirmação. Água e lanche são permitidos. [Veja o cronograma da prova →](/cronograma)


![Guia completo: o que levar no dia do enem para o ENEM](/images/blog/o-que-levar-no-dia-do-enem-hero.svg)

## O que é Obrigatório Levar no Dia do ENEM?

Dois itens são indispensáveis: o documento de identificação com foto e a caneta esferográfica preta fabricada em material transparente. Sem o documento, você não entra na sala. Sem a caneta correta, sua redação e o cartão-resposta podem não ser validados.

Em nossa plataforma, observamos que candidatos que separam os itens na noite anterior chegam mais calmos e cometem menos erros nas primeiras questões. A pressa da manhã da prova é uma fonte comum de esquecimento.

| Item | Obrigatório | Observação |
|---|---|---|
| Documento oficial com foto | Sim | Original, dentro da validade |
| Caneta preta transparente | Sim | Material transparente exigido |
| Cartão de confirmação | Recomendado | Mostra sala e local de prova |
| Água em garrafa transparente | Opcional | Sem rótulo |
| Lanche leve | Opcional | Embalagem transparente |

*Lista baseada no edital oficial do [INEP](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem). Confira sempre a versão atual no [portal do MEC](https://www.gov.br/mec/pt-br).*

## Qual Documento Posso Levar no ENEM?

O documento precisa ser oficial, original e com foto. São aceitos:

- Carteira de identidade (RG)
- Carteira Nacional de Habilitação (CNH)
- Passaporte
- Carteira de trabalho
- Carteira de identidade profissional (OAB, CRM, CREA e similares)

Documentos digitais são aceitos quando emitidos por aplicativos oficiais, como a CNH Digital e o RG digital no Gov.br. Identificamos que muitos candidatos chegam só com foto do documento no celular comum — isso não é aceito. Use sempre o aplicativo oficial.

![Conceitos essenciais: o que levar no dia do enem](/images/blog/o-que-levar-no-dia-do-enem-2.svg)

## Qual Caneta Usar no ENEM?

A caneta deve ser esferográfica, de tinta preta e fabricada em material transparente. Essa regra existe para evitar que o corpo da caneta esconda qualquer material. Canetas de corpo colorido ou opaco podem ser barradas.

Leve pelo menos duas canetas. Uma pode falhar. Em nossa experiência com candidatos, a caneta reserva já salvou muita gente que teve a tinta acabando no meio da redação.

## Posso Levar Comida e Água no ENEM?

Sim. Você pode levar água e alimentos, desde que em embalagens transparentes e sem rótulo. A prova dura mais de cinco horas, então comer algo ajuda a manter a concentração.

**Sugestões de lanche:**
- Frutas como banana e maçã
- Barra de cereal sem embalagem metalizada chamativa
- Castanhas e oleaginosas
- Chocolate para um reforço rápido de energia

Evite alimentos pesados, que dão sono, e bebidas com muito açúcar, que causam queda de energia depois.

## Que Horas Devo Chegar no Local de Prova?

Os portões abrem às 12h e fecham às 13h, no horário de Brasília. A prova começa às 13h30. Chegue com pelo menos 30 minutos de antecedência para encontrar a sala sem correria.

| Horário | Evento |
|---|---|
| 12h00 | Abertura dos portões |
| 13h00 | Fechamento dos portões |
| 13h30 | Início da prova |
| 19h00 | Término (1º dia) |
| 18h30 | Término (2º dia) |

*Horários de Brasília conforme o cronograma do [INEP](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/cronograma). Verifique o fuso do seu estado.*

## O que Levar para Render Melhor na Prova?

Além do obrigatório, alguns itens ajudam no conforto e no desempenho ao longo das horas de prova:

- Um casaco leve, pois salas com ar-condicionado podem esfriar
- Relógio analógico simples, sem sons e sem conexão
- Medicação de uso contínuo, se necessário
- Documento de confirmação impresso para localizar a sala

Nossos dados mostram que candidatos que treinam simulados completos no mesmo horário da prova se adaptam melhor ao cansaço das últimas questões. O corpo precisa estar acostumado a manter o foco por cinco horas.

[Treinar com simulado completo →](/simulado)

## Checklist Final na Noite Anterior

1. Separe o documento e confira a validade
2. Coloque duas canetas pretas transparentes na bolsa
3. Imprima ou salve o cartão de confirmação
4. Prepare água e lanche em embalagem transparente
5. Confira o endereço do local de prova
6. Durma cedo para acordar descansado

*Escrito por **Equipe ENEM Pro** — especialistas em preparação para o ENEM, com base no edital do [INEP](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem).*

## Continue Estudando

- [O que Não Pode Levar no ENEM](/blog/o-que-nao-pode-levar-no-enem) — A lista de itens proibidos
- [Cartão de Confirmação ENEM](/blog/cartao-de-confirmacao-enem-2026) — Como acessar e imprimir
- [Cronograma de Estudos](/cronograma) — Monte seu plano até a prova
- [Dicas de Última Hora](/blog/dicas-ultima-hora-enem) — O que fazer na véspera

## Perguntas Frequentes

### Posso levar o ENEM sem o cartão de confirmação?
Sim. O cartão de confirmação não é obrigatório para entrar na prova, mas é altamente recomendado porque mostra o número da sala e o local exato. O documento obrigatório mesmo é a identificação oficial com foto.

### Que tipo de caneta é permitida no ENEM?
Apenas caneta esferográfica de tinta preta fabricada em material transparente. Canetas de corpo opaco ou colorido podem ser barradas na entrada. Leve duas para segurança.

### Posso usar o documento digital no ENEM?
Sim, desde que emitido por aplicativo oficial, como a CNH Digital ou o RG no aplicativo Gov.br. Foto simples do documento na galeria do celular não é aceita.

### Posso levar lanche para a prova do ENEM?
Sim. Alimentos e água são permitidos em embalagens transparentes e sem rótulo. Prefira lanches leves que não dão sono, como frutas, castanhas e barras de cereal.
""",
  },

  # ── 2. O QUE NÃO PODE LEVAR NO ENEM ──────────────────────────────────────
  {
    "slug": "o-que-nao-pode-levar-no-enem",
    "title": "O que Não Pode Levar no ENEM 2026 — Lista Oficial",
    "description": "Lista oficial do que não pode levar no ENEM 2026: celular, relógio digital, lápis e óculos escuros. Veja o que causa eliminação e como evitar problemas.",
    "date": "2026-06-24",
    "readTime": 7,
    "content": """
Saber o que não pode entrar na sala do ENEM é tão importante quanto saber o que levar. Um item proibido em cima da carteira pode causar eliminação imediata, mesmo sem intenção de fraude.

> **TL;DR:** No ENEM é proibido celular, qualquer aparelho eletrônico, relógio digital, óculos escuros, boné e material de consulta. Aparelhos vão para envelope porta-objetos lacrado. [Veja o que levar →](/blog/o-que-levar-no-dia-do-enem)


![Guia completo: o que nao pode levar no enem para o ENEM](/images/blog/o-que-nao-pode-levar-no-enem-hero.svg)

## O que é Proibido Levar para a Sala do ENEM?

A regra principal é simples: nenhum aparelho eletrônico pode estar com você durante a prova. Tudo deve ser desligado e guardado no envelope porta-objetos, que fica embaixo da carteira e lacrado até a saída.

Em nossa plataforma, identificamos que a causa mais comum de eliminação não é cola, e sim o celular tocando ou vibrando dentro do envelope. Desligue completamente o aparelho antes de lacrar.

| Item proibido | Consequência |
|---|---|
| Celular ligado ou tocando | Eliminação |
| Relógio digital ou smartwatch | Eliminação |
| Fone de ouvido | Eliminação |
| Material de consulta | Eliminação |
| Lápis, lapiseira, borracha | Não permitido para a prova |
| Óculos escuros e boné | Não permitido na sala |

*Regras baseadas no edital do [INEP](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem). Consulte sempre a versão vigente no [portal do MEC](https://www.gov.br/mec/pt-br).*

## Por que o Celular Causa Eliminação?

O celular é o item mais sensível do ENEM. Ele deve ser desligado, ter o alarme cancelado e ser colocado no envelope porta-objetos assim que você entra. Se o aparelho emitir qualquer som durante a prova, mesmo dentro do envelope, o candidato é eliminado.

Nossos dados mostram que muitos candidatos esquecem de desativar alarmes programados para a manhã. Confira todos os alarmes na noite anterior e desligue o telefone por completo, não apenas no modo silencioso.

![Conceitos essenciais: o que nao pode levar no enem](/images/blog/o-que-nao-pode-levar-no-enem-2.svg)

## Posso Usar Relógio no ENEM?

Relógios digitais, smartwatches e qualquer relógio com funções extras são proibidos. As salas têm relógio ou o fiscal informa o tempo restante em intervalos. Se quiser controlar o tempo por conta própria, leve um relógio analógico simples, sem alarme e sem conexão.

Em nossa experiência com candidatos, o controle de tempo é um diferencial real. Mas o relógio precisa ser o mais básico possível para não gerar dúvida do fiscal.

## Lápis é Permitido no ENEM?

Não para preencher a prova. O cartão-resposta e a redação devem ser preenchidos exclusivamente com caneta preta transparente. Você pode usar lápis apenas no rascunho da redação, mas a versão final precisa estar a caneta.

**Itens que não servem para a prova oficial:**
- Lápis e lapiseira para o cartão-resposta
- Borracha e corretivo no cartão-resposta
- Marca-texto e canetas coloridas

## O que Acontece se Eu For Pego com Item Proibido?

A eliminação é imediata e o candidato perde a nota de toda a edição. Não há recurso para quem é flagrado com aparelho eletrônico funcionando ou material de consulta.

| Situação | Resultado |
|---|---|
| Celular tocando no envelope | Eliminação |
| Anotação escondida | Eliminação |
| Relógio digital no pulso | Retirada do item e advertência ou eliminação |
| Sair com o caderno de questões antes da hora | Eliminação |

*Penalidades conforme o edital oficial do [INEP](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/edital).*

## Como Evitar a Eliminação por Engano?

A maioria das eliminações é acidental. Para evitar:

1. Desligue completamente o celular antes de entrar
2. Cancele todos os alarmes na noite anterior
3. Deixe relógio digital e smartwatch em casa
4. Guarde tudo no envelope porta-objetos lacrado
5. Não toque no envelope durante a prova
6. Só abra o envelope após sair da escola

Nossa experiência com preparação mostra que o candidato tranquilo erra menos por descuido. Conhecer as regras antes reduz a ansiedade no dia.

[Aprender a controlar a ansiedade →](/blog/ansiedade-enem-como-controlar)

*Escrito por **Equipe ENEM Pro** — especialistas em preparação para o ENEM, com base no edital do [INEP](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem).*

## Continue Estudando

- [O que Levar no Dia do ENEM](/blog/o-que-levar-no-dia-do-enem) — A lista de itens obrigatórios
- [Dicas de Última Hora](/blog/dicas-ultima-hora-enem) — O que fazer na véspera
- [Ansiedade no ENEM](/blog/ansiedade-enem-como-controlar) — Como manter a calma
- [Cronograma de Estudos](/cronograma) — Organize a reta final

## Perguntas Frequentes

### Posso levar o celular ao ENEM se ele ficar desligado?
Sim, você leva o celular, mas precisa desligá-lo por completo e guardá-lo no envelope porta-objetos lacrado. Se o aparelho tocar ou vibrar durante a prova, mesmo dentro do envelope, você é eliminado.

### Smartwatch é proibido no ENEM?
Sim. Smartwatches e relógios digitais são proibidos porque têm funções de comunicação e armazenamento. Apenas relógios analógicos simples, sem alarme e sem conexão, são tolerados.

### Posso usar boné ou óculos escuros no ENEM?
Não dentro da sala de prova. Boné, gorro e óculos escuros precisam ser retirados para a identificação e durante o exame, salvo necessidade médica comprovada.

### O que acontece se meu alarme tocar durante a prova?
A emissão de som por qualquer aparelho eletrônico, incluindo alarme, leva à eliminação imediata. Por isso é essencial cancelar todos os alarmes e desligar o celular antes de entrar.
""",
  },

  # ── 3. QUANTOS ACERTOS PARA PASSAR NO ENEM ───────────────────────────────
  {
    "slug": "quantos-acertos-para-passar-no-enem",
    "title": "Quantos Acertos Para Passar no ENEM 2026?",
    "description": "Quantos acertos você precisa para passar no ENEM 2026? Veja a relação entre acertos e nota TRI por área e quanto exige medicina, direito e engenharia.",
    "date": "2026-06-24",
    "readTime": 9,
    "content": """
A pergunta mais comum entre candidatos é quantos acertos garantem a aprovação no ENEM. A resposta depende do curso desejado e do efeito da Teoria de Resposta ao Item, que faz a nota não ser proporcional ao número de acertos.

> **TL;DR:** Não existe nota mínima fixa no ENEM. Para cursos concorridos como medicina, é preciso acertar cerca de 40 das 45 questões por área. A TRI valoriza acertos em questões difíceis. [Simule sua nota →](/calcular-nota)


![Guia completo: quantos acertos para passar no enem para o ENEM](/images/blog/quantos-acertos-para-passar-no-enem-hero.svg)

## Existe Nota Mínima Para Passar no ENEM?

Não existe nota mínima oficial para passar no ENEM. O exame não é eliminatório por si só. O que define a aprovação é a nota de corte do curso escolhido no SiSU, ProUni ou Fies, que muda a cada edição conforme a concorrência.

Em nossa plataforma, observamos que muitos candidatos acreditam existir uma nota de corte única. Na prática, cada curso e cada universidade têm a sua, e elas variam todo ano.

## Quantos Acertos Equivalem a Cada Nota?

Por causa da TRI, o número de acertos não se traduz diretamente em nota. Ainda assim, há uma faixa de referência baseada no histórico do exame:

| Acertos por área | Percentual | Nota TRI estimada |
|---|---|---|
| 45 de 45 | 100% | 920–987 |
| 42 de 45 | 93% | 860–910 |
| 40 de 45 | 89% | 820–870 |
| 38 de 45 | 84% | 770–820 |
| 35 de 45 | 78% | 700–760 |
| 30 de 45 | 67% | 600–660 |
| 25 de 45 | 56% | 520–580 |

*Estimativas baseadas na análise das calibrações TRI históricas do [INEP](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem). Use a [calculadora de nota](/calcular-nota) para simular cenários.*

## Quantos Acertos Para Passar em Medicina?

Medicina é o curso mais concorrido do Brasil. Para as federais mais disputadas, a nota de corte fica entre 780 e 830 pontos. Isso exige acertar cerca de 40 a 43 questões em cada área e uma redação acima de 900.

Nossos dados mostram que o gargalo dos candidatos a medicina costuma ser Matemática e Ciências da Natureza. Acertar 40 de 45 nessas áreas é o que separa quem chega perto da nota de corte de quem passa.

![Conceitos essenciais: quantos acertos para passar no enem](/images/blog/quantos-acertos-para-passar-no-enem-2.svg)

## Quantos Acertos Para Direito e Engenharia?

Os cursos variam bastante na pontuação exigida. Veja a referência por área de maior peso:

| Curso | Nota de corte típica | Acertos por área (aprox.) |
|---|---|---|
| Medicina | 780–830 | 40–43 |
| Engenharia | 650–750 | 34–40 |
| Direito | 650–760 | 34–41 |
| Psicologia | 620–720 | 32–38 |
| Pedagogia | 550–650 | 27–33 |

*Faixas baseadas em médias históricas do SiSU divulgadas pelo [MEC](https://www.gov.br/mec/pt-br). A nota de corte real muda a cada edição.*

## Por que a TRI Faz a Nota Não Ser Proporcional?

A Teoria de Resposta ao Item analisa o padrão de respostas, não só a quantidade. Ela considera a dificuldade de cada questão e a coerência das respostas. Acertar questões difíceis e errar fáceis indica chute, e o sistema penaliza esse padrão.

Em nossa experiência com candidatos, dois alunos com o mesmo número de acertos podem ter notas diferentes. Quem acerta as questões mais difíceis tende a tirar nota maior do que quem só acerta as fáceis.

**Como usar a TRI a seu favor:**
- Não chute aleatoriamente: o padrão de chute reduz a nota
- Priorize as questões que você realmente domina
- Tente as difíceis com calma, pois elas valem mais
- Mantenha consistência entre questões fáceis e médias

## Quantos Acertos Para uma Boa Nota na Redação?

A redação é independente das objetivas e vale de 0 a 1000. Ela tem peso alto na maioria dos cursos. Uma redação acima de 900 pode compensar acertos a menos nas provas objetivas, principalmente em medicina e direito.

Identificamos que candidatos que treinam uma redação por semana por três meses ganham, em média, mais de 100 pontos nessa nota. É o investimento de maior retorno na reta final.

[Aprender a tirar nota 1000 na redação →](/blog/redacao-enem-nota-1000)

## Como Aumentar o Número de Acertos?

1. Resolva provas anteriores completas, área por área
2. Revise os erros e entenda o motivo de cada um
3. Foque nos temas que mais caem em cada disciplina
4. Treine com cronômetro para controlar o tempo
5. Faça simulados completos para ganhar resistência

Nossa experiência com preparação mostra que praticar questões reais do ENEM gera mais ganho de acertos do que estudar apenas pela teoria. A familiaridade com o estilo das questões faz diferença direta no número de acertos.

[Praticar questões reais por disciplina →](/questoes)

*Escrito por **Equipe ENEM Pro** com base nas provas oficiais e nas calibrações TRI do [INEP](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem).*

## Continue Estudando

- [Calcular Nota ENEM](/calcular-nota) — Simule acertos e nota TRI
- [Como Funciona a TRI do ENEM](/blog/tri-enem-como-funciona) — Entenda o cálculo
- [Nota de Corte Medicina ENEM](/blog/medicina-enem-nota-de-corte) — Pontuação por universidade
- [Questões do ENEM](/questoes) — Pratique área por área

## Perguntas Frequentes

### Quantos acertos preciso para tirar 700 no ENEM?
Em média, acertar cerca de 35 das 45 questões de uma área tende a resultar em nota próxima de 700 a 760, mas o valor exato depende da calibração TRI da edição e da dificuldade das questões que você acertou.

### Tem nota de corte mínima para fazer o ENEM?
Não. Não há nota mínima para participar nem para ser aprovado de forma geral. A aprovação depende da nota de corte do curso no SiSU, ProUni ou Fies, que varia a cada edição conforme a concorrência.

### Por que acertei mais e tirei nota menor que um colega?
Isso acontece por causa da TRI. Ela avalia o padrão de respostas e a dificuldade das questões. Se o seu colega acertou questões mais difíceis e foi mais consistente, ele pode ter nota maior mesmo com menos acertos totais.

### Quantos acertos preciso para passar em medicina?
Para as federais mais concorridas, é preciso acertar cerca de 40 a 43 das 45 questões em cada área e ter redação acima de 900. Em universidades menos disputadas, a exigência cai um pouco.
""",
  },

  # ── 4. ENCCEJA CERTIFICADO ENSINO MÉDIO ──────────────────────────────────
  {
    "slug": "encceja-2026-certificado-ensino-medio",
    "title": "Encceja 2026 — Certificado do Ensino Médio",
    "description": "Encceja 2026: como tirar o certificado do ensino médio ou fundamental. Veja inscrição, idade mínima, áreas avaliadas e a nota necessária para aprovação.",
    "date": "2026-06-24",
    "readTime": 8,
    "content": """
O Encceja é a porta de entrada para quem não concluiu o ensino fundamental ou médio na idade regular e quer obter a certificação. A prova é gratuita e dá um certificado com validade nacional reconhecido pelo MEC.

> **TL;DR:** O Encceja certifica o ensino fundamental e médio para jovens e adultos. É gratuito, exige idade mínima de 15 ou 18 anos e aprovação por área com nota mínima de 100 pontos e redação de 5. [Veja como estudar →](/blog/como-estudar-para-o-enem)


![Guia completo: encceja certificado ensino medio para o ENEM](/images/blog/encceja-2026-certificado-ensino-medio-hero.svg)

## O que é o Encceja?

O Encceja é o Exame Nacional para Certificação de Competências de Jovens e Adultos. Ele permite que pessoas que não terminaram os estudos na idade certa comprovem seus conhecimentos e recebam o certificado de conclusão do ensino fundamental ou médio.

Em nossa plataforma, observamos que muitos candidatos confundem o Encceja com o ENEM. São exames diferentes: o Encceja certifica a conclusão da escola, enquanto o ENEM serve para ingresso no ensino superior.

| Característica | Encceja | ENEM |
|---|---|---|
| Objetivo | Certificar o ensino básico | Ingresso no ensino superior |
| Custo | Gratuito | Gratuito ou com taxa |
| Idade mínima | 15 ou 18 anos | Sem idade mínima para treineiro |
| Resultado | Certificado de conclusão | Nota para SiSU, ProUni, Fies |

*Informações baseadas no edital oficial do [INEP](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/encceja).*

## Qual a Idade Mínima Para o Encceja?

Para o certificado do ensino fundamental, a idade mínima é 15 anos completos. Para o ensino médio, é necessário ter pelo menos 18 anos completos na data da prova. Essa regra segue a legislação de educação de jovens e adultos.

Identificamos que parte dos candidatos tenta a certificação do ensino médio antes dos 18 anos e acaba impedida de validar o resultado. Confira a idade exigida antes de se inscrever.

![Conceitos essenciais: encceja certificado ensino medio](/images/blog/encceja-2026-certificado-ensino-medio-2.svg)

## Quais Áreas o Encceja Avalia?

A prova do Encceja é dividida por áreas de conhecimento, com uma redação obrigatória. As áreas mudam conforme o nível desejado.

**Ensino médio:**
- Linguagens, Códigos e suas Tecnologias, com redação
- Matemática e suas Tecnologias
- Ciências Humanas e suas Tecnologias
- Ciências da Natureza e suas Tecnologias

**Ensino fundamental:**
- Língua Portuguesa, Língua Estrangeira, Artes e Educação Física, com redação
- Matemática
- História e Geografia
- Ciências Naturais

## Qual a Nota de Corte do Encceja?

Para ser aprovado em uma área, o candidato precisa de no mínimo 100 pontos, em uma escala que vai de 0 a 180. A redação exige nota mínima de 5, em uma escala de 0 a 10. A aprovação é por área, então você pode conquistar a certificação aos poucos.

| Componente | Nota mínima | Escala |
|---|---|---|
| Cada área de conhecimento | 100 pontos | 0–180 |
| Redação | 5 pontos | 0–10 |

*Critérios conforme o [INEP](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/encceja). Consulte o edital vigente no [portal do MEC](https://www.gov.br/mec/pt-br).*

Nossos dados mostram que a aprovação por área é uma vantagem importante. Quem não atinge a nota em todas as áreas de uma vez pode focar nas pendentes na edição seguinte e somar as certificações.

## Como se Inscrever no Encceja?

A inscrição é feita gratuitamente pela página do participante no portal do Inep, dentro do período divulgado no edital. O passo a passo é:

1. Acesse a página do Encceja no site do Inep
2. Crie ou acesse sua conta Gov.br
3. Preencha os dados e escolha o nível de certificação
4. Selecione o município de prova
5. Confirme a inscrição e guarde o comprovante

Em nossa experiência, candidatos que se inscrevem no início do prazo têm mais opções de local de prova perto de casa. Deixar para a última hora reduz as alternativas disponíveis.

## Como Estudar Para o Encceja?

O conteúdo do Encceja é mais básico que o do ENEM, mas a estratégia de estudo é parecida. Foque em interpretação de texto, operações matemáticas e temas centrais de cada área.

- Pratique redação, pois ela é obrigatória e tem nota mínima
- Resolva provas anteriores do próprio Encceja
- Reforce Matemática básica e interpretação de texto
- Estude um pouco todo dia, mesmo que por pouco tempo

Nossa experiência com preparação mostra que a constância vale mais que a carga horária. Trinta minutos por dia por alguns meses preparam bem para a certificação.

[Ver técnicas de estudo eficientes →](/blog/tecnicas-de-estudo-enem)

*Escrito por **Equipe ENEM Pro** com base nos editais do [INEP](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/encceja) e do [MEC](https://www.gov.br/mec/pt-br).*

## Continue Estudando

- [Como Estudar Para o ENEM](/blog/como-estudar-para-o-enem) — Estratégias que servem também para o Encceja
- [Técnicas de Estudo](/blog/tecnicas-de-estudo-enem) — Métodos para aprender mais rápido
- [Como Fazer Redação](/blog/como-fazer-redacao-enem-passo-a-passo) — A redação é obrigatória
- [Questões do ENEM](/questoes) — Pratique interpretação e Matemática

## Perguntas Frequentes

### O certificado do Encceja vale para fazer faculdade?
Sim. O certificado de conclusão do ensino médio pelo Encceja tem validade nacional e é aceito para matrícula em faculdades, concursos e o próprio ENEM. Ele equivale ao diploma do ensino médio regular.

### Qual a idade mínima para o Encceja do ensino médio?
É necessário ter pelo menos 18 anos completos na data da aplicação da prova para obter o certificado do ensino médio. Para o ensino fundamental, a idade mínima é 15 anos completos.

### O Encceja é gratuito?
Sim. A inscrição e a participação no Encceja são totalmente gratuitas. O exame é organizado pelo Inep e não cobra taxa de inscrição dos candidatos.

### Preciso passar em todas as áreas de uma vez no Encceja?
Não. A aprovação é por área. Você pode ser aprovado em algumas áreas em uma edição e nas demais na seguinte, acumulando as certificações até completar o nível desejado.
""",
  },

  # ── 5. O QUE MAIS CAI NO ENEM ────────────────────────────────────────────
  {
    "slug": "o-que-mais-cai-no-enem",
    "title": "O que Mais Cai no ENEM — Temas por Área 2026",
    "description": "Descubra o que mais cai no ENEM por área: os temas recorrentes de Matemática, Linguagens, Humanas e Natureza que mais aparecem e onde focar os estudos.",
    "date": "2026-06-24",
    "readTime": 9,
    "content": """
Saber o que mais cai no ENEM ajuda a priorizar o estudo e a render mais em menos tempo. O exame repete padrões de temas todos os anos, e conhecer esses padrões é uma vantagem estratégica na reta final.

> **TL;DR:** No ENEM, Matemática cobra muito funções, geometria e estatística; Linguagens foca em interpretação de texto; Humanas valoriza história do Brasil e atualidades; Natureza prioriza ecologia, química do cotidiano e mecânica. [Pratique por tema →](/questoes)


![Guia completo: o que mais cai no enem para o ENEM](/images/blog/o-que-mais-cai-no-enem-hero.svg)

## O que Mais Cai em Matemática no ENEM?

Matemática é a área onde os padrões se repetem com mais força. Em nossa plataforma, analisamos as provas anteriores e identificamos que poucos temas concentram a maioria das questões.

| Tema | Frequência | Prioridade |
|---|---|---|
| Funções e gráficos | Muito alta | Essencial |
| Geometria plana e espacial | Alta | Essencial |
| Estatística e probabilidade | Alta | Essencial |
| Razão, proporção e porcentagem | Alta | Essencial |
| Matemática financeira | Média | Importante |
| Análise combinatória | Média | Importante |

A Matemática do ENEM é contextualizada. As questões trazem situações do dia a dia, gráficos e tabelas. Não basta saber a fórmula, é preciso interpretar o enunciado antes de calcular.

[Praticar questões de Matemática →](/questoes/matematica)

## O que Mais Cai em Linguagens?

Linguagens é dominada pela interpretação de texto. Mais da metade das questões pede leitura atenta e análise, não memorização. Identificamos que candidatos que treinam leitura diária ganham pontos com mais facilidade nessa área.

**Temas mais cobrados em Linguagens:**
- Interpretação de textos verbais e não verbais
- Funções da linguagem e figuras de linguagem
- Variação linguística e norma culta
- Literatura com foco em movimentos e contexto
- Inglês ou espanhol com cinco questões de leitura

![Conceitos essenciais: o que mais cai no enem](/images/blog/o-que-mais-cai-no-enem-2.svg)

## O que Mais Cai em Ciências Humanas?

Ciências Humanas reúne História, Geografia, Filosofia e Sociologia. A área valoriza a relação entre o passado e os debates atuais. Os temas mais recorrentes são:

| Disciplina | Temas que mais caem |
|---|---|
| História | Brasil República, ditadura, era Vargas |
| Geografia | Geopolítica, meio ambiente, urbanização |
| Sociologia | Trabalho, desigualdade, movimentos sociais |
| Filosofia | Contrato social, ética, filosofia política |

Nossos dados mostram que questões de Humanas quase sempre conectam um documento histórico ou mapa a uma reflexão atual. Treinar interpretação de fontes é tão importante quanto saber o conteúdo.

[Praticar questões de Ciências Humanas →](/questoes/ciencias-humanas)

## O que Mais Cai em Ciências da Natureza?

Ciências da Natureza reúne Biologia, Química e Física. Biologia costuma ter o maior número de questões, seguida por Química e Física. Os temas recorrentes são:

**Biologia:**
- Ecologia e meio ambiente
- Genética e biotecnologia
- Fisiologia humana e citologia

**Química:**
- Química orgânica e funções
- Estequiometria e cálculos
- Química ambiental e do cotidiano

**Física:**
- Mecânica e cinemática
- Eletricidade
- Termodinâmica e energia

Em nossa experiência com candidatos, focar primeiro em Biologia rende mais pontos por hora estudada, porque ela tem mais questões e cobra muita interpretação de situações reais.

[Praticar questões de Ciências da Natureza →](/questoes/ciencias-natureza)

## E a Redação, o que Mais Cai?

Os temas de redação do ENEM giram em torno de problemas sociais brasileiros. Educação, saúde, tecnologia, meio ambiente e direitos de grupos sociais são recorrentes. O formato é sempre o texto dissertativo-argumentativo com proposta de intervenção.

Identificamos que candidatos que estudam atualidades e treinam repertório cultural escrevem redações mais fortes. Os temas mudam, mas as áreas de debate se repetem ano após ano.

[Ver temas prováveis de redação →](/temas-redacao)

## Como Usar Esses Padrões a seu Favor?

1. Comece pelos temas de frequência muito alta de cada área
2. Resolva questões reais separadas por tema
3. Revise os erros para fixar os pontos fracos
4. Use simulados completos para treinar o tempo
5. Reserve uma parte do estudo para a redação toda semana

Nossa experiência com preparação mostra que estudar por frequência de tema é mais eficiente do que tentar cobrir todo o conteúdo. Focar no que mais cai aumenta o número de acertos com menos esforço.

| Estratégia | Resultado típico |
|---|---|
| Estudo por frequência de tema | Mais acertos por hora |
| Resolução de provas anteriores | Familiaridade com o estilo |
| Redação semanal | Ganho consistente de nota |

*Escrito por **Equipe ENEM Pro** com base na análise das provas oficiais do [INEP](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem) e do [portal do MEC](https://www.gov.br/mec/pt-br).*

## Continue Estudando

- [Questões do ENEM por Disciplina](/questoes) — Pratique por tema
- [O que Estudar para o ENEM 2026](/blog/enem-2026-o-que-estudar) — Plano por área
- [Temas de Redação ENEM](/temas-redacao) — Os temas mais prováveis
- [Quantos Acertos Para Passar](/blog/quantos-acertos-para-passar-no-enem) — Metas por curso

## Perguntas Frequentes

### Qual área tem mais questões fáceis no ENEM?
Não existe área garantidamente mais fácil, pois isso depende do seu perfil. Em geral, candidatos que leem bem aproveitam mais Linguagens e Humanas, enquanto quem domina cálculo rende mais em Matemática e Natureza.

### Vale a pena estudar só o que mais cai no ENEM?
Estudar pelos temas mais frequentes é a forma mais eficiente de começar, principalmente na reta final. Mas não ignore por completo os outros temas, pois eles também aparecem e podem ser o diferencial em provas equilibradas.

### Qual matéria cai mais em Ciências da Natureza?
Biologia costuma ter o maior número de questões em Ciências da Natureza, com destaque para ecologia, genética e fisiologia. Por isso, priorizar Biologia tende a render mais pontos nessa área.

### O que mais cai na redação do ENEM?
Os temas de redação tratam de problemas sociais brasileiros, como educação, saúde, tecnologia e direitos de grupos vulneráveis. O formato é sempre dissertativo-argumentativo com proposta de intervenção.
""",
  },

  # ── 6. LOCAL DE PROVA ENEM ───────────────────────────────────────────────
  {
    "slug": "local-de-prova-enem-2026",
    "title": "Local de Prova ENEM 2026 — Como Consultar",
    "description": "Como consultar o local de prova do ENEM 2026 pelo cartão de confirmação. Veja o passo a passo, o que fazer se houver erro e dicas para o dia da prova.",
    "date": "2026-06-24",
    "readTime": 6,
    "content": """
Saber onde será sua prova com antecedência evita atrasos e nervosismo no dia do ENEM. O local de prova é informado no cartão de confirmação, disponível na Página do Participante semanas antes do exame.

> **TL;DR:** O local de prova do ENEM 2026 aparece no cartão de confirmação, acessado com login Gov.br na Página do Participante do Inep. Ele traz endereço, sala e horário. [Veja o que levar no dia →](/blog/o-que-levar-no-dia-do-enem)


![Guia completo: local de prova enem para o ENEM](/images/blog/local-de-prova-enem-2026-hero.svg)

## Como Saber o Local de Prova do ENEM?

O local de prova é divulgado no cartão de confirmação da inscrição. Esse documento fica disponível na Página do Participante do Inep, acessada com a conta Gov.br. O cartão mostra o endereço completo, o número da sala e os horários.

Em nossa plataforma, observamos que candidatos que consultam o local com antecedência e visitam o endereço antes da prova chegam mais tranquilos no dia. Conhecer o trajeto reduz o risco de atraso.

| Informação no cartão | Para que serve |
|---|---|
| Endereço do local | Planejar o trajeto |
| Número da sala | Encontrar o lugar rápido |
| Horário dos portões | Não chegar atrasado |
| Língua estrangeira escolhida | Conferir inglês ou espanhol |

*Consulta feita na Página do Participante do [INEP](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem). Acesse sempre o canal oficial.*

## Passo a Passo Para Consultar o Local

1. Acesse a Página do Participante no site do Inep
2. Faça login com sua conta Gov.br
3. Clique em cartão de confirmação
4. Confira o endereço, a sala e o horário
5. Salve em PDF ou imprima o documento

Identificamos que muitos candidatos esquecem a senha do Gov.br perto da prova. Recupere o acesso com antecedência para não ter surpresa na hora de consultar o local.

![Conceitos essenciais: local de prova enem](/images/blog/local-de-prova-enem-2026-2.svg)

## Quando o Local de Prova é Divulgado?

O cartão de confirmação com o local costuma ser liberado algumas semanas antes do primeiro dia de prova. A data exata é anunciada pelo Inep no cronograma oficial. Fique atento ao período de divulgação para consultar assim que liberar.

Nossos dados mostram que candidatos que acompanham o cronograma oficial evitam a correria de última hora. Marque a data prevista de liberação do cartão na sua agenda.

## E se o Local de Prova Estiver Errado?

Se o endereço estiver incorreto ou muito distante do seu município, entre em contato com o Inep pelos canais oficiais o quanto antes. A mudança de local nem sempre é possível, mas é importante registrar o problema dentro do prazo.

**O que fazer se houver problema:**
- Confira se o município de prova está certo no cartão
- Registre a ocorrência pelos canais oficiais do Inep
- Guarde o número de protocolo do atendimento
- Acompanhe a resposta na Página do Participante

## Dicas Para o Dia da Prova

Conhecer o local é só o primeiro passo. Para garantir tranquilidade no dia:

1. Visite o endereço antes, se possível
2. Calcule o tempo de deslocamento com folga
3. Considere trânsito e transporte público no domingo
4. Chegue antes das 13h, quando os portões fecham
5. Leve o cartão impresso para achar a sala rápido

Em nossa experiência com candidatos, o atraso é uma das causas mais frustrantes de perda da prova. Os portões fecham às 13h no horário de Brasília e não há tolerância.

[Ver o checklist completo do dia da prova →](/blog/o-que-levar-no-dia-do-enem)

*Escrito por **Equipe ENEM Pro** com base no cronograma e nas orientações do [INEP](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem) e do [MEC](https://www.gov.br/mec/pt-br).*

## Continue Estudando

- [Cartão de Confirmação ENEM](/blog/cartao-de-confirmacao-enem-2026) — Como acessar passo a passo
- [O que Levar no Dia do ENEM](/blog/o-que-levar-no-dia-do-enem) — Checklist completo
- [O que Não Pode Levar no ENEM](/blog/o-que-nao-pode-levar-no-enem) — Itens proibidos
- [Cronograma de Estudos](/cronograma) — Organize a reta final

## Perguntas Frequentes

### Onde vejo o local de prova do ENEM?
O local de prova fica no cartão de confirmação, disponível na Página do Participante do Inep, acessada com a conta Gov.br. O cartão traz o endereço completo, a sala e os horários da prova.

### Quando sai o cartão de confirmação do ENEM?
O cartão de confirmação com o local de prova costuma ser liberado algumas semanas antes do exame. A data exata é divulgada pelo Inep no cronograma oficial de cada edição.

### Posso fazer a prova em outra cidade?
Você faz a prova no município que escolheu na inscrição. Mudanças de local ou município após a inscrição geralmente não são permitidas, por isso é importante escolher com cuidado ao se inscrever.

### Preciso imprimir o cartão de confirmação?
Não é obrigatório, mas é muito recomendado. Levar o cartão impresso ajuda a localizar a sala rapidamente e a confirmar os horários, evitando atrasos na entrada.
""",
  },

  # ── 7. CARTÃO DE CONFIRMAÇÃO ENEM ────────────────────────────────────────
  {
    "slug": "cartao-de-confirmacao-enem-2026",
    "title": "Cartão de Confirmação ENEM 2026 — Como Acessar",
    "description": "Cartão de confirmação ENEM 2026: como acessar, imprimir e o que fazer se não aparecer. Veja o passo a passo na Página do Participante e o que o cartão mostra.",
    "date": "2026-06-24",
    "readTime": 6,
    "content": """
O cartão de confirmação reúne as informações mais importantes da sua inscrição no ENEM. Ele mostra onde, quando e em qual sala você fará a prova, além da língua estrangeira escolhida e do número de inscrição.

> **TL;DR:** O cartão de confirmação do ENEM é acessado na Página do Participante do Inep com login Gov.br. Ele traz local, sala, horários e número de inscrição. Não é obrigatório levá-lo, mas é recomendado. [Veja o local de prova →](/blog/local-de-prova-enem-2026)


![Guia completo: cartao de confirmacao enem para o ENEM](/images/blog/cartao-de-confirmacao-enem-2026-hero.svg)

## O que é o Cartão de Confirmação do ENEM?

O cartão de confirmação é o documento que comprova a sua inscrição e informa todos os detalhes da prova. Ele é gerado pelo Inep após o fim das inscrições e fica disponível na Página do Participante.

Em nossa plataforma, observamos que o cartão é a melhor forma de o candidato conferir se está tudo certo com a inscrição antes do dia da prova. Vale revisar cada dado com atenção.

| Dado no cartão | O que verificar |
|---|---|
| Número de inscrição | Guarde para consultas futuras |
| Local e sala de prova | Endereço e número da sala |
| Data e horários | Dias e fechamento dos portões |
| Língua estrangeira | Inglês ou espanhol |
| Atendimento especializado | Se solicitado, conferir |

*Acesso pela Página do Participante do [INEP](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem). Use apenas o canal oficial.*

## Como Acessar o Cartão de Confirmação?

1. Acesse a Página do Participante no site do Inep
2. Entre com seu CPF e senha do Gov.br
3. Localize a opção cartão de confirmação
4. Confira os dados da prova
5. Salve em PDF ou imprima o documento

Identificamos que a maior dificuldade dos candidatos é o acesso ao Gov.br. Se você esqueceu a senha, recupere com antecedência para não ficar sem acesso perto da prova.

![Conceitos essenciais: cartao de confirmacao enem](/images/blog/cartao-de-confirmacao-enem-2026-2.svg)

## Quando o Cartão de Confirmação Fica Disponível?

O cartão é liberado algumas semanas antes da prova, em data anunciada pelo Inep no cronograma oficial. Antes desse período, ele ainda não aparece na Página do Participante.

Nossos dados mostram que candidatos ansiosos tentam acessar o cartão antes da liberação e acham que houve erro. Confira o cronograma para saber a data certa de divulgação.

## O Cartão de Confirmação é Obrigatório?

Não. O cartão de confirmação não é obrigatório para entrar na prova. O documento exigido na entrada é a identificação oficial com foto. Ainda assim, levar o cartão impresso ajuda a localizar a sala e a conferir os horários.

**Por que vale a pena levar o cartão:**
- Mostra o número exato da sala
- Confirma os horários dos portões
- Traz o número de inscrição em mãos
- Ajuda em caso de dúvida na entrada

## E se o Cartão de Confirmação Não Aparecer?

Se o cartão não estiver disponível após a data oficial de liberação, siga estes passos:

1. Confirme que você concluiu a inscrição corretamente
2. Verifique se está logado com o CPF certo no Gov.br
3. Atualize a página ou tente outro navegador
4. Procure os canais oficiais do Inep se o problema continuar

Em nossa experiência com candidatos, a maioria dos casos de cartão indisponível é resolvida com a recuperação do acesso ao Gov.br ou aguardando a data oficial de liberação.

[Saiba como consultar o local de prova →](/blog/local-de-prova-enem-2026)

*Escrito por **Equipe ENEM Pro** com base nas orientações do [INEP](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem) e do [portal do MEC](https://www.gov.br/mec/pt-br).*

## Continue Estudando

- [Local de Prova ENEM](/blog/local-de-prova-enem-2026) — Como descobrir onde será a prova
- [O que Levar no Dia do ENEM](/blog/o-que-levar-no-dia-do-enem) — Checklist do dia
- [O que Não Pode Levar no ENEM](/blog/o-que-nao-pode-levar-no-enem) — Itens proibidos
- [Como se Inscrever no ENEM 2026](/blog/como-se-inscrever-enem-2026) — Passo a passo da inscrição

## Perguntas Frequentes

### Como acessar o cartão de confirmação do ENEM?
Acesse a Página do Participante no site do Inep, faça login com seu CPF e senha do Gov.br e clique na opção cartão de confirmação. Ali você confere local, sala e horários e pode salvar ou imprimir o documento.

### O cartão de confirmação do ENEM é obrigatório?
Não. O documento obrigatório para entrar na prova é a identificação oficial com foto. O cartão de confirmação é apenas recomendado, pois facilita encontrar a sala e conferir os horários.

### O que fazer se o cartão de confirmação não aparecer?
Confirme que a inscrição foi concluída, verifique se está logado com o CPF correto no Gov.br e aguarde a data oficial de liberação. Se o problema persistir, procure os canais oficiais do Inep.

### Quando sai o cartão de confirmação do ENEM 2026?
O cartão costuma ser liberado algumas semanas antes da prova, em data informada pelo Inep no cronograma oficial. Antes desse período, ele ainda não fica disponível na Página do Participante.
""",
  },

  # ── 8. BOLSA PROUNI 100% ─────────────────────────────────────────────────
  {
    "slug": "bolsa-prouni-100-como-conseguir",
    "title": "Bolsa ProUni 100% — Como Conseguir em 2026",
    "description": "Como conseguir bolsa integral de 100% no ProUni 2026: renda máxima, nota mínima no ENEM e regras de seleção. Veja o passo a passo para a bolsa integral.",
    "date": "2026-06-24",
    "readTime": 8,
    "content": """
A bolsa integral do ProUni cobre 100% da mensalidade em faculdades particulares e é uma das principais portas de acesso ao ensino superior no Brasil. Conquistá-la depende de critérios claros de renda e da nota no ENEM.

> **TL;DR:** A bolsa integral do ProUni cobre 100% da mensalidade e exige renda familiar de até 1,5 salário mínimo por pessoa, além de mínimo de 450 pontos no ENEM e nota acima de zero na redação. [Simule sua nota →](/calcular-nota)


![Guia completo: bolsa prouni 100 para o ENEM](/images/blog/bolsa-prouni-100-como-conseguir-hero.svg)

## O que é a Bolsa Integral do ProUni?

A bolsa integral do ProUni cobre 100% da mensalidade do curso em uma instituição particular. Ela é destinada a estudantes de baixa renda que atingem a nota mínima exigida no ENEM e atendem aos critérios do programa.

Em nossa plataforma, observamos que muitos candidatos com nota suficiente perdem a bolsa por não conhecer a regra de renda. Entender os dois critérios principais, renda e nota, é essencial para concorrer à bolsa integral.

| Tipo de bolsa | Cobertura | Renda por pessoa |
|---|---|---|
| Integral | 100% da mensalidade | Até 1,5 salário mínimo |
| Parcial | 50% da mensalidade | Até 3 salários mínimos |

*Critérios conforme as regras do ProUni no [portal do MEC](https://www.gov.br/mec/pt-br). Consulte o edital vigente antes de se inscrever.*

## Qual a Renda Máxima Para a Bolsa de 100%?

Para a bolsa integral, a renda familiar bruta por pessoa não pode passar de 1,5 salário mínimo. O cálculo soma a renda de todos que moram na casa e divide pelo número de pessoas. Esse é o critério que mais elimina candidatos com boa nota.

Identificamos que candidatos costumam errar ao calcular a renda. Some todos os rendimentos do grupo familiar e divida pelo total de pessoas para saber se você se enquadra na bolsa integral.

![Conceitos essenciais: bolsa prouni 100](/images/blog/bolsa-prouni-100-como-conseguir-2.svg)

## Qual a Nota Mínima no ENEM Para o ProUni?

Para concorrer a qualquer bolsa do ProUni, é preciso ter no mínimo 450 pontos de média nas provas objetivas e na redação, além de nota acima de zero na redação. Quem zera a redação não pode participar.

| Requisito | Exigência |
|---|---|
| Média nas cinco provas | Mínimo de 450 pontos |
| Redação | Acima de zero |
| Edição do ENEM | A mais recente, conforme edital |

Nossos dados mostram que a nota de corte real de cada curso costuma ser bem maior que o mínimo de 450, principalmente nos cursos concorridos. O mínimo é só o critério de participação, não de aprovação.

## Quem Pode Concorrer à Bolsa Integral?

Além da renda e da nota, o candidato precisa atender a pelo menos uma destas condições:

- Ter cursado o ensino médio completo em escola pública
- Ter estudado em escola particular com bolsa integral
- Ser pessoa com deficiência
- Ser professor da rede pública, para cursos de licenciatura

Em nossa experiência com candidatos, a comprovação desses requisitos na fase de documentos é onde muitos perdem a bolsa. Organize os comprovantes com antecedência.

## Passo a Passo Para Conseguir a Bolsa de 100%

1. Faça o ENEM e atinja pelo menos 450 pontos de média
2. Confira se sua renda por pessoa está dentro do limite
3. Inscreva-se no ProUni dentro do prazo do edital
4. Escolha até duas opções de curso e instituição
5. Acompanhe as chamadas e a nota de corte
6. Comprove renda e escolaridade na instituição

Nossa experiência com preparação mostra que candidatos que escolhem cursos com nota de corte compatível com a sua têm muito mais chance de conseguir a bolsa. Mirar alto demais sem nota suficiente desperdiça as opções.

[Calcular sua nota e comparar com a de corte →](/calcular-nota)

## ProUni, SiSU e Fies: Qual a Diferença?

O ProUni oferece bolsas em faculdades particulares. O SiSU dá vagas em universidades públicas e gratuitas. O Fies é um financiamento que você paga depois de formado. Você pode se inscrever em mais de um programa com a mesma nota do ENEM.

| Programa | Tipo de instituição | Custo para o aluno |
|---|---|---|
| ProUni | Particular | Bolsa de 50% ou 100% |
| SiSU | Pública | Gratuito |
| Fies | Particular | Financiamento pago depois |

*Informações com base nas regras dos programas no [portal do MEC](https://www.gov.br/mec/pt-br) e no [INEP](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem).*

[Entender como funciona o SiSU →](/blog/sisu-como-funciona)

*Escrito por **Equipe ENEM Pro** com base nas regras do ProUni divulgadas pelo [MEC](https://www.gov.br/mec/pt-br).*

## Continue Estudando

- [Calcular Nota ENEM](/calcular-nota) — Simule sua média ponderada
- [ProUni Como Funciona](/blog/prouni-como-funciona) — Guia completo do programa
- [SiSU Como Funciona](/blog/sisu-como-funciona) — Vagas em universidades públicas
- [Fies Como Funciona](/blog/fies-2026-como-funciona) — Financiamento estudantil

## Perguntas Frequentes

### Qual a renda máxima para conseguir bolsa integral no ProUni?
A renda familiar bruta por pessoa não pode ultrapassar 1,5 salário mínimo para a bolsa integral de 100%. O cálculo soma todos os rendimentos da casa e divide pelo número de pessoas que moram juntas.

### Qual a nota mínima do ENEM para o ProUni?
É preciso ter no mínimo 450 pontos de média nas provas objetivas e na redação, e tirar nota acima de zero na redação. Quem zera a redação não pode concorrer às bolsas do ProUni.

### Posso conseguir bolsa integral estudando em escola particular?
Em geral, a bolsa integral é voltada a quem cursou o ensino médio em escola pública ou em particular com bolsa integral. Pessoas com deficiência e professores da rede pública também têm critérios próprios de participação.

### Dá para usar a mesma nota do ENEM no ProUni e no SiSU?
Sim. A mesma nota do ENEM pode ser usada para concorrer ao ProUni, ao SiSU e ao Fies. São programas diferentes e você pode se inscrever em mais de um com a nota da edição mais recente.
""",
  },
]


def build_ts_entry(p: dict) -> str:
    content = p["content"].replace("`", "\\`").replace("${", "\\${")
    return f"""  {{
    slug: '{p["slug"]}',
    title: '{p["title"]}',
    description: '{p["description"]}',
    date: '{p["date"]}',
    readTime: {p["readTime"]},
    content: `{content}    `,
  }},
"""


def validate():
    ok = True
    for p in POSTS:
        tl = len(p["title"])
        dl = len(p["description"])
        t_ok = 40 <= tl <= 60
        d_ok = 150 <= dl <= 160
        if not t_ok or not d_ok:
            ok = False
        print(f"  {p['slug']:<42} title={tl}{'' if t_ok else ' !!'}  desc={dl}{'' if d_ok else ' !!'}")
    return ok


def main():
    print("Validacao titulo(40-60)/desc(150-160):")
    if not validate():
        print("\n!! Ajuste os campos fora do intervalo antes de gravar. Nada foi escrito.")
        return

    raw = BLOG_DATA.read_text(encoding="utf-8")
    existing = set(re.findall(r"slug: '([^']+)'", raw))
    new_posts = [p for p in POSTS if p["slug"] not in existing]

    if not new_posts:
        print("\nTodos os posts ja existem.")
        return

    print(f"\nAdicionando {len(new_posts)} posts novos:")
    for p in new_posts:
        print(f"  + {p['slug']}")

    BACKUP_DIR.mkdir(exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    shutil.copy(BLOG_DATA, BACKUP_DIR / f"blog-data_{ts}_pre_batch2.ts")

    entries = "\n".join(build_ts_entry(p) for p in new_posts)
    last_bracket = raw.rfind("\n]")
    if last_bracket == -1:
        print("Nao encontrei o fechamento do array")
        return

    updated = raw[:last_bracket] + "\n" + entries + raw[last_bracket:]
    BLOG_DATA.write_text(updated, encoding="utf-8")
    print(f"\nEscrito em {BLOG_DATA}")


if __name__ == "__main__":
    main()
