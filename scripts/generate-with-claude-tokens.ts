#!/usr/bin/env node
/**
 * Script para gerar explicações usando tokens do Claude
 * Salva diretamente no Supabase
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import Anthropic from '@anthropic-ai/sdk'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const sb = createClient(supabaseUrl, supabaseKey)

interface Question {
  id: string
  year: number
  discipline: string
  title: string
  context?: string
  alternatives: Array<{ letter: string; text: string }>
  correctAlternative: string
}

async function generateExplanation(question: Question, client: Anthropic): Promise<string> {
  const alternatives = question.alternatives
    .map((a) => `${a.letter}) ${a.text}`)
    .join('\n')

  const prompt = `Você é um professor de ENEM especializado. Gere uma explicação clara, concisa e educativa para a seguinte questão:

QUESTÃO: ${question.title}

CONTEXTO:
${question.context || 'N/A'}

ALTERNATIVAS:
${alternatives}

RESPOSTA CORRETA: ${question.correctAlternative}

Forneça uma explicação que:
1. Explique por que a alternativa ${question.correctAlternative} está CORRETA
2. Aponte os erros das outras alternativas
3. Ensine o conceito por trás da questão
4. Use linguagem clara e acessível
5. Tenha entre 150-250 palavras

Responda apenas com a explicação, sem prefixos.`

  const message = await client.messages.create({
    model: 'claude-opus-5',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  return message.content[0].type === 'text' ? message.content[0].text : ''
}

async function main() {
  console.log('🚀 Iniciando geração de explicações com Claude...\n')

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) {
    throw new Error('ANTHROPIC_API_KEY não configurada')
  }

  const client = new Anthropic({ apiKey: anthropicKey })

  // Load questions
  const data = JSON.parse(fs.readFileSync('./data/enem-2024.json', 'utf8'))
  const questions: Question[] = data

  console.log(`📋 Questões carregadas: ${questions.length}`)

  let generated = 0
  let errors = 0

  // Process in batches of 5 to avoid rate limits
  for (let i = 0; i < questions.length; i += 5) {
    const batch = questions.slice(i, i + 5)

    await Promise.all(
      batch.map(async (question) => {
        try {
          console.log(`⏳ Gerando explicação para ${question.id}...`)

          const explanation = await generateExplanation(question, client)

          // Save to database
          const { error } = await sb.from('question_explanations').upsert({
            question_id: question.id,
            explanation,
            model: 'claude-opus-5',
            created_at: new Date().toISOString(),
          })

          if (error) {
            console.error(`❌ Erro ao salvar ${question.id}:`, error.message)
            errors++
          } else {
            console.log(`✅ ${question.id} - Salvo com sucesso`)
            generated++
          }
        } catch (err) {
          console.error(`❌ Erro ao gerar ${question.id}:`, err)
          errors++
        }
      }),
    )

    // Small delay between batches
    await new Promise((r) => setTimeout(r, 1000))
  }

  console.log(`\n📊 Resultado Final:`)
  console.log(`✅ Explicações geradas: ${generated}`)
  console.log(`❌ Erros: ${errors}`)
  console.log(`📈 Taxa de sucesso: ${((generated / questions.length) * 100).toFixed(1)}%`)
}

main().catch(console.error)
