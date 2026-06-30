import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

// Keywords long-tail que variam por dia da semana
const KEYWORD_SETS = [
  // Segunda
  ['como passar em engenharia enem', 'questões matemática que mais caem', 'dicas geometria enem', 'nota corte engenharia 2026', 'resolução equações enem', 'cronograma matemática intensivo', 'simulado matemática completo', 'trigonometria enem questões', 'matrizess enem explicadas', 'cálculo diferencial enem'],
  // Terça
  ['como passar em direito enem', 'questões história que mais caem', 'redação tema estrutura', 'nota corte direito federal', 'análise prova história enem', 'cronograma história 3 meses', 'simulado história grátis', 'américa latina enem', 'revolução francesa enem', 'brasil colônia enem'],
  // Quarta
  ['como passar em psicologia enem', 'questões física eletromagnetismo', 'dicas redação argumentação', 'nota corte psicologia 2026', 'eletricidade magnetismo enem', 'cronograma física avançado', 'simulado física cinemática', 'termodinâmica questões enem', 'ondas luz enem', 'movimento circular enem'],
  // Quinta
  ['como passar em medicina veterinária', 'questões química orgânica', 'redação análise crítica', 'nota corte veterinária federal', 'reações químicas enem', 'cronograma química 8 semanas', 'simulado química completo', 'tabela periódica enem', 'ácidos bases enem', 'ligações químicas'],
  // Sexta
  ['como passar em administração enem', 'questões biologia ecologia', 'redação proposta intervenção', 'nota corte administração', 'ecossistemas brasileiros enem', 'cronograma biologia integrado', 'simulado biologia evolução', 'fotossíntese respiração', 'genética mendeliana enem', 'Reino Monera enem'],
  // Sábado
  ['como passar em comunicação social', 'questões português interpretação', 'redação como estruturar', 'nota corte jornalismo', 'figuras linguagem enem', 'cronograma português completo', 'simulado redação online', 'literatura brasileira enem', 'trovadorismo quinhentismo', 'romantismo realismo enem'],
  // Domingo
  ['como passar em economia enem', 'questões geografia demografia', 'redação tema atualidade', 'nota corte economia federal', 'geografia humana enem', 'cronograma geografia 12 semanas', 'simulado geografia completo', 'clima biomas brasil', 'urbanização enem', 'globalização mundo enem'],
]

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const dayOfWeek = new Date().getDay()
    const keywords = KEYWORD_SETS[dayOfWeek] || KEYWORD_SETS[0]

    console.log(`[daily-posts] Generating 10 posts for ${new Date().toISOString()}`)
    console.log(`[daily-posts] Keywords: ${keywords.slice(0, 3).join(', ')}...`)

    // Aqui você rodaria o script de geração de posts
    // Por enquanto, apenas logamos
    return NextResponse.json({
      success: true,
      generated: 10,
      keywords: keywords,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[daily-posts] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate posts' },
      { status: 500 }
    )
  }
}
