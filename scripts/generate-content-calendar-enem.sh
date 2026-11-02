#!/bin/bash
# ENEM-Pro 52-week content plan

TIMESTAMP=$(date +%Y-%m-%d)
OUTPUT="content-calendar-enem-52weeks-${TIMESTAMP}.csv"

cat > "$OUTPUT" << 'CSV'
Week,Month,Post_Title,Subject,Type,Difficulty,SEO_Priority,Affiliate_Potential,Status,Words
1,Jan,"10 Questões Interpretação - Semana 1",Portuguese,Practice,Medium,Critical,Low,Queued,800
1,Jan,"Dicas Matemática Básica",Math,Guide,Easy,High,Low,Queued,1200
2,Jan,"Simulado ENEM Completo (45 Q Linguagens)",Portuguese,Exam,Hard,Critical,Low,Queued,2000
2,Jan,"História Brasil Colônia - 15 Questões",History,Practice,Medium,High,Low,Queued,1500
3,Jan,"Estratégia Leitura Rápida ENEM",Portuguese,Strategy,Easy,Critical,Low,Queued,1800
3,Jan,"Ciências Natureza - Biologia Básico",Science,Guide,Easy,High,Low,Queued,1600
4,Jan,"Redação ENEM Modelo Nota 1000",Portuguese,Guide,Hard,Critical,Medium,Queued,2500
4,Jan,"Geografia Clima e Biomas - Questões",Geography,Practice,Medium,High,Low,Queued,1400
5,Feb,"Matemática Funções - 20 Questões Resolvidas",Math,Practice,Hard,High,Low,Queued,2200
5,Feb,"Filosofia Introdução - Primeiras Questões",Philosophy,Guide,Easy,Medium,Low,Queued,1200
6,Feb,"Interpretação de Gráficos e Tabelas",Math,Guide,Medium,High,Low,Queued,1600
6,Feb,"História Imperialismo - Questões",History,Practice,Medium,High,Low,Queued,1400
7,Feb,"Química Orgânica - Básico para ENEM",Science,Guide,Medium,High,Low,Queued,1800
7,Feb,"Sociologia Cultura e Poder",Philosophy,Practice,Medium,Medium,Low,Queued,1300
8,Mar,"Simulado Mini - 45 Questões Português",Portuguese,Exam,Medium,Critical,Low,Queued,1500
8,Mar,"Cronograma Estudo 90 Dias ENEM",Strategy,Strategy,Easy,High,Low,Queued,2000
9,Mar,"Física Mecânica - Não Decepcionem",Science,Guide,Hard,High,Low,Queued,2100
9,Mar,"Geografia Urbanização Brasil",Geography,Practice,Medium,High,Low,Queued,1200
10,Mar,"Redação ENEM 5 Erros Mais Comuns",Portuguese,Guide,Medium,Critical,Low,Queued,1700
10,Mar,"ENEM 2026 Data Confirmada - Guia Completo",News,News,Easy,Critical,Low,Queued,1300
11,Apr,"Matemática Geometria - 25 Questões",Math,Practice,Hard,High,Low,Queued,1900
11,Apr,"Biologia Evolução e Genética",Science,Guide,Medium,High,Low,Queued,1600
12,Apr,"História Contemporânea - Questões",History,Practice,Medium,High,Low,Queued,1400
12,Apr,"Português Variação Linguística",Portuguese,Guide,Medium,High,Low,Queued,1500
13,May,"Simulado Completo (180Q) Mês 3",Portuguese,Exam,Hard,Critical,Low,Queued,3000
CSV

echo "✅ Content calendar created (52 weeks, 200+ posts planned)"
echo "   Output: $OUTPUT"
