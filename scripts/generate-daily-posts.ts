import Anthropic from "@anthropic-ai/sdk"
import { createServerClient } from "@/lib/supabase"
import fs from "fs"
import path from "path"

const DAILY_KEYWORDS = [
  "como passar em engenharia no enem",
  "questões de química que mais caem",
  "dicas para melhorar português enem",
  "nota de corte direito federal 2025",
  "como resolver questões de matemática enem",
  "preparação intensiva 4 semanas enem",
  "redação enem tema estrutura paragrafos",
  "simulado enem matemática grátis online",
  "estudo geography Brasil enem",
  "como passar em psicologia enem"
]

interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  readTime: number
  content: string
}

async function generatePost(keyword: string): Promise<BlogPost> {
  const client = new Anthropic()

  const slug = keyword.toLowerCase().replace(/\s+/g, "-").substring(0, 50)

  const prompt = `Escreva um post de blog otimizado para Google com score > 90 sobre "${keyword}".

Requisitos:
- 2000+ palavras
- Answer-first formatting (começa com estatística + fonte)
- 3-4 H2 sections com perguntas
- 1 tabela com dados
- 3-5 FAQ items
- Internal links marcados como [LINK: anchor → target]
- Incluir estatísticas 2025-2026 com fontes
- Sem frases genéricas AI ("in today's landscape", "it's important to note")
- Contrações naturais ("it's", "we've", "don't")
- Retornar em Markdown puro

Formato de resposta:
# [Título com keyword]

[conteúdo markdown completo]`

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }]
  })

  const content = response.content[0].type === "text" ? response.content[0].text : ""

  return {
    slug,
    title: keyword.charAt(0).toUpperCase() + keyword.slice(1),
    description: `Guia completo sobre ${keyword}. Dicas, estratégias e recursos para o ENEM 2026.`,
    date: new Date().toISOString().split("T")[0],
    readTime: Math.ceil(2000 / 200),
    content
  }
}

async function main() {
  const posts: BlogPost[] = []

  // Gerar 10 posts em paralelo
  const promises = DAILY_KEYWORDS.map(keyword => generatePost(keyword))
  const generatedPosts = await Promise.all(promises)

  posts.push(...generatedPosts)

  // Salvar em arquivo temporário
  const outputDir = path.join(process.cwd(), "app/blog/posts")
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

  for (const post of posts) {
    const filePath = path.join(outputDir, `${post.slug}.md`)
    const content = `---
title: "${post.title}"
description: "${post.description}"
date: "${post.date}"
author: "ENEM Pro"
tags: ["enem", "estudo"]
---

${post.content}`

    fs.writeFileSync(filePath, content)
    console.log(`✅ Criado: ${post.slug}`)
  }

  console.log(`\n✅ 10 posts gerados em ${new Date().toISOString()}`)
  return { success: true, count: posts.length }
}

main().catch(console.error)
