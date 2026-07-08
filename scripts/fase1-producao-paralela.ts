/**
 * FASE 1: Produção paralela de 50-100 posts cauda longa (4 semanas)
 *
 * Estrutura:
 * 1. Blog-researcher encontra 100+ keywords (background)
 * 2. Este script valida keywords contra 237 posts existentes
 * 3. Agrupa keywords por tema (5-10 temas)
 * 4. Dispara 5 blog-writers em paralelo (1 tema cada)
 * 5. Cada writer produz 10-20 posts do tema (todos 90+)
 * 6. Audit automático antes de publicar
 * 7. Deploy gradual (não tudo de uma vez)
 */

import { execSync } from 'child_process'
import { getAllPosts } from '../lib/blog-data'
import fs from 'fs'
import path from 'path'

interface Keyword {
  keyword: string
  volume: 'baixo' | 'médio' | 'alto'
  difficulty: 'fácil' | 'média' | 'difícil'
  category: string
  priority: number
}

interface PostPlan {
  theme: string
  keywords: Keyword[]
  targetCount: number
  writer: string
  startDate: string
  endDate: string
}

// 1. Validar keywords contra 237 posts existentes (remover duplicação semântica)
export function validateKeywords(keywords: Keyword[]): Keyword[] {
  const existingPosts = getAllPosts()
  const existingSlugs = new Set(existingPosts.map(p => p.slug))

  const filtered = keywords.filter(kw => {
    // Rejeitar se slug derivado do keyword já existe
    const slug = kw.keyword
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')

    if (existingSlugs.has(slug)) return false

    // Rejeitar se keyword é muito similar (semântica) a um post existente
    const kwTerms = kw.keyword.split(/\s+/).filter(t => t.length > 3)
    const hasSimilar = existingPosts.some(p => {
      const titleTerms = p.title.split(/\s+/).map(t => t.toLowerCase())
      const match = kwTerms.filter(t => titleTerms.some(tt => tt.includes(t.toLowerCase())))
      return match.length >= 2 // Se 2+ palavras coincidem, é duplicado
    })

    return !hasSimilar
  })

  return filtered
}

// 2. Agrupar keywords por tema (5-10 temas)
export function groupKeywordsByTheme(keywords: Keyword[]): Map<string, Keyword[]> {
  const themes = new Map<string, Keyword[]>()

  keywords.forEach(kw => {
    const theme = kw.category // ou detectar via LLM
    if (!themes.has(theme)) {
      themes.set(theme, [])
    }
    themes.get(theme)!.push(kw)
  })

  return themes
}

// 3. Gerar plano de produção (5 writers paralelos, 1 tema cada)
export function generateProductionPlan(themes: Map<string, Keyword[]>): PostPlan[] {
  const writers = ['writer1', 'writer2', 'writer3', 'writer4', 'writer5']
  const plans: PostPlan[] = []

  let writerIndex = 0
  let currentDate = new Date('2026-07-08')

  themes.forEach((keywords, theme) => {
    const targetCount = Math.min(keywords.length, 20) // Max 20 posts por tema
    const endDate = new Date(currentDate)
    endDate.setDate(endDate.getDate() + 7) // 1 semana por tema

    plans.push({
      theme,
      keywords,
      targetCount,
      writer: writers[writerIndex % writers.length],
      startDate: currentDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    })

    writerIndex++
    currentDate = new Date(endDate)
  })

  return plans
}

// 4. Output plano pra arquivo
export function savePlan(plans: PostPlan[], outputPath: string) {
  fs.writeFileSync(
    outputPath,
    JSON.stringify(plans, null, 2)
  )
  console.log(`✅ Plano salvo: ${outputPath}`)
  console.log(`📊 ${plans.length} temas, ${plans.reduce((s, p) => s + p.targetCount, 0)} posts totais`)
  plans.forEach(p => {
    console.log(`  → ${p.theme}: ${p.targetCount} posts (${p.writer}) [${p.startDate} a ${p.endDate}]`)
  })
}

// Entry point (quando rodado via CLI)
if (require.main === module) {
  console.log('⏳ Aguardando keywords do blog-researcher...')
  console.log('(Salve keywords em: scripts/keywords-batch-1.json)')
  console.log('Depois rode: npx tsx scripts/fase1-producao-paralela.ts')
}

export default { validateKeywords, groupKeywordsByTheme, generateProductionPlan, savePlan }
