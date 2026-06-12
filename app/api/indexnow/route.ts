import { NextResponse } from 'next/server'
import { getAllSlugs } from '@/lib/blog-data'
import { SITE_URL } from '@/lib/site-config'

const KEY = '6f7796920fdc4262ac71d91b405fc939'
const HOST = new URL(SITE_URL).hostname
const BASE = SITE_URL

const STATIC_URLS = [
  '/',
  '/calcular-nota',
  '/ferramentas',
  '/questao-do-dia',
  '/gabarito',
  '/temas-redacao',
  '/cronograma',
  '/simulado',
  '/blog',
  '/planos',
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
  '/disciplinas/matematica',
  '/disciplinas/linguagens',
  '/disciplinas/ciencias-humanas',
  '/disciplinas/ciencias-natureza',
  '/vs/descomplica',
  '/vs/stoodi',
  '/vs/estuda-com',
]

export async function GET() {
  const blogUrls = getAllSlugs().map(slug => `/blog/${slug}`)
  const allPaths = [...STATIC_URLS, ...blogUrls]
  const urlList = allPaths.map(path => `${BASE}${path}`)

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
