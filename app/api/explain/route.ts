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

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 250,
      system: 'Explique por que a alternativa está correta/errada. Máx 2 parágrafos, sem markdown.',
      messages: [
        {
          role: 'user',
          content: isCorrect
            ? `${questionTitle}\n\nCorreto: ${correctAlternative} - ${correctText}`
            : `${questionTitle}\n\nVocê escolheu: ${selectedAlternative}\nCorreto: ${correctAlternative} - ${correctText}`,
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
