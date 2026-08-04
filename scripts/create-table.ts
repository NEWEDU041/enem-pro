#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lxlwajmzwvqwimuvvsrb.supabase.co'
const supabaseServiceKey = 'SUPABASE_SERVICE_ROLE_KEY_REMOVED'

const client = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔨 Verificando se tabela existe...\n')

async function checkAndCreateTable() {
  try {
    // Tentar ler para verificar se existe
    const { data, error } = await client
      .from('question_explanations')
      .select('count(*)', { count: 'exact', head: true })

    if (error && (error.code === 'PGRST116' || error.message?.includes('not found'))) {
      console.log('❌ Tabela não existe no Supabase')
      console.log('\n⚠️ Você precisa criá-la manualmente no painel:\n')
      console.log('1. Acesse: https://app.supabase.com/project/lxlwajmzwvqwimuvvsrb/editor')
      console.log('2. Clique em "SQL Editor"')
      console.log('3. Cole este código:\n')

      const sql = `CREATE TABLE IF NOT EXISTS public.question_explanations (
  question_id TEXT PRIMARY KEY,
  explanation TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`

      console.log(sql)
      console.log('\n4. Clique "Run"')
      console.log('5. Retorne aqui e rode: npm run generate-all-explanations\n')
      process.exit(1)
    } else if (error) {
      console.error('❌ Erro ao verificar:', error.message)
      console.log('\nTente criar manualmente em: https://app.supabase.com/project/lxlwajmzwvqwimuvvsrb/editor\n')
      process.exit(1)
    } else {
      console.log('✅ Tabela já existe!')
      console.log('✅ Pronto para gerar explicações\n')
      console.log('Execute: npm run generate-all-explanations\n')
    }
  } catch (err: any) {
    console.error('❌ Erro na conexão:', err?.message || err)
    console.log('\nTente criar manualmente em: https://app.supabase.com/project/lxlwajmzwvqwimuvvsrb/editor\n')
    process.exit(1)
  }
}

checkAndCreateTable()
