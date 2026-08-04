#!/usr/bin/env node
/**
 * Script para gerar TODAS as explicações faltando
 * Executa em paralelo com rate limiting
 */

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const anthropicKey = process.env.ANTHROPIC_API_KEY!

const sb = createClient(supabaseUrl, supabaseKey)
const anthropic = new Anthropic({ apiKey: anthropicKey })

const BATCH_SIZE = 3 // Parallelism
const RATE_LIMIT_DELAY = 500 // ms entre requisições
let totalGenerated = 0
let totalErrors = 0

interface Question {
  id: string
  year: number
  discipline: string
  title: string
  context?: string
  alternatives: Array<{ letter: string; text: string }>
  correctAlternative: string
}

async function generateExplanation(question: Question): Promise<string | null> {
  try {
    const prompt = `Você é um professor de ENEM experiente. Analise esta questão e forneça uma explicação clara e concisa.

**Questão:** ${question.title}
**Disciplina:** ${question.discipline}
**Ano:** ${question.year}

**Contexto:**
${question.context || '(Sem contexto adicional)'}

**Alternativas:**
${question.alternatives.map(a => `${a.letter}) ${a.text}`).join('\n')}

**Resposta correta:** ${question.correctAlternative}

Forneça:
1. Uma explicação clara de por que a alternativa ${question.correctAlternative} está correta
2. Por que as outras alternativas estão erradas (breve)
3. Conceitos importantes envolvidos
4. Dicas para não cair nessa pegadinha

Mantenha a resposta com até 300 palavras.`

    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type === 'text') {
      return content.text
    }
  } catch (e) {
    console.error(`❌ Erro ao gerar Q${question.id}:`, (e as Error).message)
    totalErrors++
  }
  return null
}

async function checkIfExplanationExists(questionId: string): Promise<boolean> {
  const { data } = await sb
    .from('question_explanations')
    .select('id')
    .eq('question_id', questionId)
    .limit(1)
  return (data?.length || 0) > 0
}

async function saveExplanation(questionId: string, explanation: string): Promise<boolean> {
  const { error } = await sb.from('question_explanations').upsert(
    {
      question_id: questionId,
      explanation,
      created_at: new Date().toISOString(),
    },
    { onConflict: 'question_id' }
  )

  if (error) {
    console.error(`❌ Erro ao salvar Q${questionId}:`, error.message)
    totalErrors++
    return false
  }

  return true
}

async function main() {
  console.log('🚀 Iniciando geração de explicações...\n')

  // Carregar questões
  const questionsPath = 'data/enem-2024.json'
  if (!fs.existsSync(questionsPath)) {
    console.error('❌ Arquivo data/enem-2024.json não encontrado')
    process.exit(1)
  }

  const questions: Question[] = JSON.parse(fs.readFileSync(questionsPath, 'utf8'))
  console.log(`📋 Questões carregadas: ${questions.length}`)

  // Filtrar questões sem explicação
  const questionsToProcess = []
  for (const q of questions) {
    const exists = await checkIfExplanationExists(q.id)
    if (!exists) {
      questionsToProcess.push(q)
    }
  }

  console.log(`❌ Questões sem explicação: ${questionsToProcess.length}`)
  console.log(`✅ Questões já com explicação: ${questions.length - questionsToProcess.length}`)
  console.log(`📊 Cobertura atual: ${(((questions.length - questionsToProcess.length) / questions.length) * 100).toFixed(1)}%\n`)

  if (questionsToProcess.length === 0) {
    console.log('✅ Todas as questões já têm explicações!')
    return
  }

  console.log(`🔄 Gerando ${questionsToProcess.length} explicações...\n`)

  // Processar em batches
  let processed = 0
  for (let i = 0; i < questionsToProcess.length; i += BATCH_SIZE) {
    const batch = questionsToProcess.slice(i, i + BATCH_SIZE)

    const promises = batch.map(async q => {
      const explanation = await generateExplanation(q)
      if (explanation) {
        const saved = await saveExplanation(q.id, explanation)
        if (saved) {
          totalGenerated++
          processed++
          const percent = ((processed / questionsToProcess.length) * 100).toFixed(0)
          process.stdout.write(
            `\r✅ ${processed}/${questionsToProcess.length} (${percent}%) | Erros: ${totalErrors}`
          )
        }
      }
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY))
    })

    await Promise.all(promises)
  }

  console.log(
    `\n\n📊 Resultado Final:\n` +
    `✅ Explicações geradas: ${totalGenerated}\n` +
    `❌ Erros: ${totalErrors}\n` +
    `📈 Nova cobertura: ${(((questions.length - questionsToProcess.length + totalGenerated) / questions.length) * 100).toFixed(1)}%`
  )
}

main().catch(console.error)
