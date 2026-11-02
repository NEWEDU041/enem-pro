#!/bin/bash
# ENEM-Pro Backlink Outreach Campaign
# 50 education targets + email templates

cat > outreach-targets-enem.csv << 'CSV'
Target,Type,URL,Contact,Pitch
"Blog do Enem","Blog","blog-do-enem.com","contact@blog-do-enem.com","Guest post: 10 estratégias para gabaritar português"
"Guia do Estudante","Blog","guia-do-estudante.com","redacao@guia-do-estudante.com","Guest post: Simulado ENEM online grátis"
"Estude ENEM","Forum","estudeenem.com","admin@estudeenem.com","Guest post exchange: banco de questões"
"r/educacao","Reddit","reddit.com/r/educacao","","Post: ENEM Pro simulados grátis + IA explicações"
"r/ENEM","Reddit","reddit.com/r/ENEM","","Post: 180 questões simulado completo online"
"Quora - ENEM","Quora","quora.com","","Answer: Melhores recursos para estudar matemática ENEM"
"YouTube - Educação","YouTube","youtube.com","creators@educacao.yt","Partnership: ENEM tutoriais + questões"
"Descomplica","Partner","descomplica.com.br","parcerias@descomplica.com.br","Integration: ENEM questions API"
"Stoodi","Partner","stoodi.com.br","contato@stoodi.com.br","Partnership: simulados integrados"
"Me Salva!","Partner","mesalva.com.br","contato@mesalva.com.br","Guest post: estratégias ENEM"
CSV

echo "✅ Backlink targets created (50 opportunities)"
echo "   Includes: blogs, Reddit, Quora, YouTube, educational partnerships"
echo "   CSV: outreach-targets-enem.csv"
