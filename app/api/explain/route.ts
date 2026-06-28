import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 30

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface ExplainRequest {
  questionTitle: string
  context: string
  alternatives: { letter: string; text: string }[]
  correctAlternative: string
  selectedAlternative: string
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const body = (await req.json()) as ExplainRequest
    const { questionTitle, context, alternatives, correctAlternative, selectedAlternative } = body

    const isCorrect = selectedAlternative === correctAlternative
    const correctText = alternatives.find(a => a.letter === correctAlternative)?.text || ''

    const prompt = isCorrect
      ? `Explique por que a alternativa ${correctAlternative} está correta para esta questão do ENEM:

Questão: ${questionTitle}
${context ? `Contexto: ${context}` : ''}

Alternativas:
${alternatives.map(a => `${a.letter}) ${a.text}`).join('\n')}

Resposta correta: ${correctAlternative} - ${correctText}

Faça uma explicação clara, concisa (máx 150 palavras) do raciocínio correto. Evite referências genéricas — seja específico sobre por que essa alternativa está certa.`
      : `Explique por que a alternativa ${selectedAlternative} está ERRADA e por que a correta é ${correctAlternative} para esta questão do ENEM:

Questão: ${questionTitle}
${context ? `Contexto: ${context}` : ''}

Alternativas:
${alternatives.map(a => `${a.letter}) ${a.text}`).join('\n')}

Você escolheu: ${selectedAlternative} - ${alternatives.find(a => a.letter === selectedAlternative)?.text || ''}
Resposta correta: ${correctAlternative} - ${correctText}

Explique: (1) Por que você errou (o que a alternativa ${selectedAlternative} não captura ou é falsa); (2) Por que ${correctAlternative} é a correta. Máx 200 palavras.`

    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const explanation = message.content[0].type === 'text' ? message.content[0].text : ''

    return NextResponse.json({
      isCorrect,
      explanation,
      correctAlternative,
    })
  } catch (error) {
    console.error('Explain error:', error)
    return NextResponse.json(
      { error: 'Falha ao gerar explicação', details: String(error) },
      { status: 500 }
    )
  }
}
