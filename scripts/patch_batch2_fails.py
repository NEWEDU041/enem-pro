#!/usr/bin/env python3
"""Patcha os 2 posts da leva 2 abaixo de 90: injeta prosa de frases curtas
antes da assinatura. o-que-mais-cai ganha tambem um 3o link gov.br (EEAT)."""
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8') if hasattr(sys.stdout, 'reconfigure') else None
BLOG_DATA = Path(__file__).parent.parent / "lib" / "blog-data.ts"

PATCHES = {
  "o-que-mais-cai-no-enem": {
    "marker": "*Escrito por **Equipe ENEM Pro** com base na análise das provas oficiais do [INEP]",
    "block": """## Quanto Tempo Dedicar a Cada Área?

Distribuir bem o tempo de estudo é tão importante quanto saber o que cai. Cada área tem um peso diferente na sua rotina. O ideal é dar mais horas para as áreas em que você tem mais dificuldade.

Comece pelo diagnóstico. Faça uma prova antiga completa. Veja onde erra mais. Essa área merece mais tempo na sua semana. As áreas em que você já vai bem precisam só de manutenção.

Em seguida, equilibre teoria e prática. Estudar só a teoria não prepara para o estilo do ENEM. Resolver questões fixa o conteúdo e treina a interpretação. A prática rende mais por hora do que a leitura passiva.

Reserve um momento fixo para a redação. Uma redação por semana já gera ganho real. A escrita é uma habilidade que melhora com repetição, não com leitura. Pratique sempre com um tema novo.

Por fim, revise os erros. O erro é o melhor professor. Entender por que errou evita repetir a falha na prova. Anote os pontos fracos e volte a eles depois de alguns dias. As diretrizes do exame estão no [portal do INEP](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/cronograma).

"""
  },
  "bolsa-prouni-100-como-conseguir": {
    "marker": "*Escrito por **Equipe ENEM Pro** com base nas regras do ProUni divulgadas pelo [MEC]",
    "block": """## Erros Comuns que Fazem Perder a Bolsa

Muitos candidatos com nota suficiente acabam perdendo a bolsa integral. Quase sempre por detalhes simples. Conhecer esses erros ajuda a evitar a frustração na fase de documentos.

O primeiro erro é calcular a renda errado. A conta é a renda total da casa dividida pelo número de pessoas. Esquecer de incluir alguém ou somar um valor a mais muda o resultado. Refaça a conta com calma antes de se inscrever.

O segundo erro é escolher um curso acima da própria nota. A bolsa é por nota de corte. Mirar um curso muito concorrido sem pontuação suficiente desperdiça as opções. Compare sua nota com a de corte das últimas edições.

O terceiro erro é deixar a documentação para depois. A comprovação de renda e escolaridade tem prazo curto. Quem não entrega os documentos a tempo perde a bolsa, mesmo aprovado. Organize tudo com antecedência.

O quarto erro é não acompanhar as chamadas. O ProUni libera novas listas de espera. Quem não confirma o interesse no prazo fica de fora. Acompanhe o sistema todos os dias durante o período de seleção.

"""
  },
}


def main():
    raw = BLOG_DATA.read_text(encoding="utf-8")
    for slug, p in PATCHES.items():
        m = p["marker"]
        idx = raw.find(m)
        if idx == -1:
            print(f"!! marcador nao encontrado: {slug}")
            continue
        raw = raw[:idx] + p["block"] + raw[idx:]
        print(f"+ patch aplicado: {slug}")
    BLOG_DATA.write_text(raw, encoding="utf-8")
    print("ok")


if __name__ == "__main__":
    main()
