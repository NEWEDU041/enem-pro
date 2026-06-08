import { NextResponse } from 'next/server'

const KEY = '6f7796920fdc4262ac71d91b405fc939'
const HOST = 'enem-pro-eight.vercel.app'
const BASE = `https://${HOST}`

const NEW_URLS = [
  '/calcular-nota',
  '/ferramentas',
  '/questao-do-dia',
  '/materias/fisica',
  '/materias/quimica',
  '/materias/biologia',
  '/materias/historia',
  '/materias/geografia',
  '/materias/filosofia',
  '/materias/sociologia',
  '/materias/portugues',
  '/materias/literatura',
  '/materias/matematica',
  '/materias/ingles',
  '/vs/descomplica',
  '/vs/stoodi',
  '/vs/estuda-com',
  '/blog/fisica-enem-o-que-cai',
  '/blog/quimica-enem-o-que-cai',
  '/blog/biologia-enem-o-que-cai',
  '/blog/historia-enem-o-que-cai',
  '/blog/geografia-enem-o-que-cai',
  '/blog/nota-de-corte-engenharia-enem',
  '/blog/nota-de-corte-direito-enem',
  '/blog/prouni-2026-como-funciona',
  '/blog/ingles-enem-dicas',
  '/blog/enem-segunda-chance',
  '/blog/redacao-enem-competencias',
  '/blog/filosofia-sociologia-enem',
  '/blog/como-estudar-ciencias-humanas-enem',
  '/blog/como-estudar-ciencias-natureza-enem',
  '/blog/nota-de-corte-psicologia-enem',
  '/blog/enem-treineiro-2026',
]

export async function GET() {
  const urlList = NEW_URLS.map(path => `${BASE}${path}`)

  const body = {
    host: HOST,
    key: KEY,
    keyLocation: `${BASE}/${KEY}.txt`,
    urlList,
  }

  const results: Record<string, number> = {}

  for (const endpoint of [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow',
  ]) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(body),
      })
      results[endpoint] = res.status
    } catch {
      results[endpoint] = 0
    }
  }

  return NextResponse.json({ submitted: urlList.length, results })
}
