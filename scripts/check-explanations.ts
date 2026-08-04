#!/usr/bin/env node
/**
 * Script para verificar quantas explicações faltam no banco
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const sb = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('🔍 Verificando explicações...\n')

  try {
    // Contar explicações totais
    const { count: totalExplanations } = await sb
      .from('question_explanations')
      .select('*', { count: 'exact', head: true })

    console.log(`✅ Explicações no banco: ${totalExplanations || 0}`)

    // Contar questões únicas
    const { data: uniqueQuestions } = await sb
      .from('question_explanations')
      .select('question_id')
      .limit(1000)

    const unique = new Set(uniqueQuestions?.map(q => q.question_id) || [])
    console.log(`📌 Questões com explicação: ${unique.size}`)

    // Estimar total de questões (180 por ano, 5 anos = 900)
    const estimatedTotal = 180 * 5
    const missing = estimatedTotal - unique.size

    console.log(`❌ Questões sem explicação (est.): ${missing}`)
    console.log(`📊 Cobertura: ${((unique.size / estimatedTotal) * 100).toFixed(1)}%\n`)

    if (missing > 0) {
      console.log('💡 Próximas ações:')
      console.log('   1. npm run bulk-generate-explanations-v2')
      console.log('   2. npm run validate-explanations')
      console.log('   3. npm run regenerate-poor-explanations (opcional)')
    }

  } catch (e) {
    console.error('❌ Erro ao conectar Supabase:', (e as Error).message)
    console.log('\n⚠️  Certifique-se que SUPABASE_SERVICE_ROLE_KEY está configurada')
  }
}

main()
