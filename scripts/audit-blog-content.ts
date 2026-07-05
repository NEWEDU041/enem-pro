import * as fs from 'fs'
import * as path from 'path'
import { getAllPosts, getCategory } from '../lib/blog-data'

function parseFrontmatter(raw: string): { data: Record<string, string>; content: string } {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) return { data: {}, content: raw }
  const data: Record<string, string> = {}
  for (const line of m[1].split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let val = line.slice(idx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    data[key] = val
  }
  return { data, content: m[2] }
}

interface PostRow {
  slug: string
  title: string
  description: string
  date: string
  content: string
  source: 'blog-data' | 'markdown'
}

function loadMarkdownPosts(): PostRow[] {
  const dir = path.join(__dirname, '../app/blog/posts')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const raw = fs.readFileSync(path.join(dir, f), 'utf8')
      const { data, content } = parseFrontmatter(raw)
      return {
        slug: f.replace(/\.md$/, ''),
        title: data.title || '',
        description: data.description || '',
        date: data.date || '',
        content,
        source: 'markdown' as const,
      }
    })
}

function wordsOf(s: string) {
  return (s.match(/[\p{L}\p{N}'-]+/gu) || [])
}

function syllableEstimate(word: string) {
  const w = word.toLowerCase()
  const matches = w.match(/[aeiouáéíóúâêôãõà]+/g)
  return Math.max(1, matches ? matches.length : 1)
}

function fleschPtBr(text: string) {
  const sentences = (text.match(/[.!?]+/g) || []).length || 1
  const words = wordsOf(text)
  const wordCount = words.length || 1
  const syllables = words.reduce((acc, w) => acc + syllableEstimate(w), 0)
  // Standard Flesch Reading Ease formula (approximation, not the PT-adapted coefficients)
  return 206.835 - 1.015 * (wordCount / sentences) - 84.6 * (syllables / wordCount)
}

function paragraphs(content: string) {
  return content.split(/\n\s*\n/).map(p => p.trim()).filter(p => p && !p.startsWith('#') && !p.startsWith('!['))
}

function headings(content: string) {
  return (content.match(/^#{1,6}\s+.+$/gm) || [])
}

function internalLinks(content: string) {
  const matches = [...content.matchAll(/\]\(\/([a-z0-9\-\/]+)\)/gi)]
  return matches.map(m => m[1].replace(/\/$/, ''))
}

function externalLinks(content: string) {
  return (content.match(/\]\(https?:\/\/[^)]+\)/g) || []).length
}

function images(content: string) {
  return (content.match(/!\[[^\]]*\]\([^)]+\)/g) || []).length
}

function normalizeTitle(t: string) {
  // Years are NOT stopped: two posts differing only by year (e.g. gabarito
  // .../2024 vs .../2023) are intentionally distinct, not cannibalization.
  const stop = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'o', 'a', 'os', 'as', 'para', 'como', 'em', 'no', 'na', 'que', 'com'])
  return t.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stop.has(w))
}

function jaccard(a: string[], b: string[]) {
  const sa = new Set(a), sb = new Set(b)
  const inter = [...sa].filter(x => sb.has(x)).length
  const union = new Set([...sa, ...sb]).size
  return union === 0 ? 0 : inter / union
}

function main() {
  const fromData: PostRow[] = getAllPosts().map(p => ({
    slug: p.slug, title: p.title, description: p.description, date: p.date,
    content: p.content, source: 'blog-data' as const,
  }))
  const fromMd = loadMarkdownPosts()

  // app/blog/[slug]/page.tsx only ever calls getPost() from lib/blog-data.ts —
  // the standalone .md files are never read by any route. Where a slug exists
  // in both, the .md version is dead content; keep the live (blog-data) row
  // for scoring and report the shadow duplicates separately.
  const dataSlugs = new Set(fromData.map(p => p.slug))
  const shadowedMd = fromMd.filter(p => dataSlugs.has(p.slug))
  const liveOnlyMd = fromMd.filter(p => !dataSlugs.has(p.slug))
  const all = [...fromData, ...liveOnlyMd]

  const slugSet = new Set(all.map(p => p.slug))
  const now = Date.now()

  const rows = all.map(p => {
    const wc = wordsOf(p.content).length
    const paras = paragraphs(p.content)
    const longParas = paras.filter(par => wordsOf(par).length > 150).length
    const heads = headings(p.content)
    const links = internalLinks(p.content).filter(l => slugSet.has(l.replace(/^blog\//, '')) || l.startsWith('blog/'))
    const rawLinks = internalLinks(p.content)
    const ext = externalLinks(p.content)
    const imgs = images(p.content)
    const flesch = Math.round(fleschPtBr(p.content))
    const days = p.date ? Math.round((now - new Date(p.date).getTime()) / 86400000) : null
    const titleLen = p.title.length
    const descLen = p.description.length
    const hasTldr = /TL;DR|Key Takeaways|Resumo/i.test(p.content)
    const category = (() => { try { return getCategory(p.slug) } catch { return 'unknown' } })()

    return {
      slug: p.slug, source: p.source, category,
      wordCount: wc, longParagraphs: longParas, totalParagraphs: paras.length,
      headingCount: heads.length,
      internalLinkTargets: rawLinks,
      externalLinkCount: ext, imageCount: imgs,
      flesch, daysSinceUpdate: days,
      titleLen, descLen, hasTldr,
      titleTooLong: titleLen > 60, titleTooShort: titleLen > 0 && titleLen < 30,
      descTooLong: descLen > 160, descTooShort: descLen > 0 && descLen < 120,
    }
  })

  // orphan / dead-end detection
  const inbound: Record<string, number> = {}
  for (const r of rows) inbound[r.slug] = 0
  for (const r of rows) {
    for (const target of r.internalLinkTargets) {
      const cleanTarget = target.replace(/^blog\//, '')
      if (inbound[cleanTarget] !== undefined && cleanTarget !== r.slug) inbound[cleanTarget]++
    }
  }
  const orphans = rows.filter(r => (inbound[r.slug] || 0) === 0).map(r => r.slug)
  const deadEnds = rows.filter(r => r.internalLinkTargets.filter(t => slugSet.has(t.replace(/^blog\//, ''))).length === 0).map(r => r.slug)

  // cannibalization: pairwise jaccard on title keywords within same category (cap pairs to avoid O(n^2) blowup reporting)
  const byCat: Record<string, typeof rows> = {}
  const titles = new Map(all.map(p => [p.slug, p.title]))
  for (const r of rows) {
    byCat[r.category] = byCat[r.category] || []
    byCat[r.category].push(r)
  }
  const cannibalization: { a: string; b: string; score: number }[] = []
  for (const cat of Object.keys(byCat)) {
    const list = byCat[cat]
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const score = jaccard(normalizeTitle(titles.get(list[i].slug) || ''), normalizeTitle(titles.get(list[j].slug) || ''))
        if (score >= 0.75) cannibalization.push({ a: list[i].slug, b: list[j].slug, score: Math.round(score * 100) / 100 })
      }
    }
  }

  // freshness buckets
  const stale = rows.filter(r => (r.daysSinceUpdate ?? 0) > 180)
  const noDate = rows.filter(r => r.daysSinceUpdate === null)

  // structural red flags -> composite heuristic score (not the full 100-pt rubric, just a triage signal)
  const scored = rows.map(r => {
    let penalty = 0
    if (r.longParagraphs > 0) penalty += Math.min(15, r.longParagraphs * 3)
    if (!r.hasTldr) penalty += 8
    if (r.headingCount < 3) penalty += 10
    if (r.wordCount < 600) penalty += 15
    if (r.titleTooLong || r.titleTooShort) penalty += 5
    if (r.descTooLong || r.descTooShort || r.descLen === 0) penalty += 8
    if (r.imageCount === 0) penalty += 6
    if (r.flesch < 30 || r.flesch > 90) penalty += 5
    if ((inbound[r.slug] || 0) === 0) penalty += 10
    if (r.internalLinkTargets.length === 0) penalty += 8
    if ((r.daysSinceUpdate ?? 0) > 180) penalty += 10
    return { ...r, inboundLinks: inbound[r.slug] || 0, triageScore: Math.max(0, 100 - penalty) }
  }).sort((a, b) => a.triageScore - b.triageScore)

  const summary = {
    totalPosts: rows.length,
    bySource: { blogData: fromData.length, liveMarkdown: liveOnlyMd.length, shadowedMarkdown: shadowedMd.length },
    avgWordCount: Math.round(rows.reduce((a, r) => a + r.wordCount, 0) / rows.length),
    avgFlesch: Math.round(rows.reduce((a, r) => a + r.flesch, 0) / rows.length),
    postsWithLongParagraphs: rows.filter(r => r.longParagraphs > 0).length,
    postsWithoutTldr: rows.filter(r => !r.hasTldr).length,
    postsWithNoImages: rows.filter(r => r.imageCount === 0).length,
    postsWithNoInternalLinks: rows.filter(r => r.internalLinkTargets.length === 0).length,
    orphanCount: orphans.length,
    deadEndCount: deadEnds.length,
    cannibalizationPairs: cannibalization.length,
    staleCount: stale.length,
    noDateCount: noDate.length,
    triageBands: {
      excellent90plus: scored.filter(r => r.triageScore >= 90).length,
      good70to89: scored.filter(r => r.triageScore >= 70 && r.triageScore < 90).length,
      needsWork50to69: scored.filter(r => r.triageScore >= 50 && r.triageScore < 70).length,
      poorUnder50: scored.filter(r => r.triageScore < 50).length,
    },
  }

  const out = {
    summary,
    shadowedMdFiles: shadowedMd.map(p => ({
      slug: p.slug,
      mdWordCount: wordsOf(p.content).length,
      liveWordCount: rows.find(r => r.slug === p.slug)?.wordCount ?? null,
    })),
    worst30: scored.slice(0, 30).map(r => ({
      slug: r.slug, triageScore: r.triageScore, wordCount: r.wordCount,
      longParagraphs: r.longParagraphs, headingCount: r.headingCount, hasTldr: r.hasTldr,
      imageCount: r.imageCount, inboundLinks: r.inboundLinks, internalLinkTargets: r.internalLinkTargets.length,
      flesch: r.flesch, daysSinceUpdate: r.daysSinceUpdate, category: r.category,
    })),
    orphans,
    deadEnds: deadEnds.slice(0, 40),
    cannibalization: cannibalization.sort((a, b) => b.score - a.score).slice(0, 30),
    staleTop20: stale.sort((a, b) => (b.daysSinceUpdate ?? 0) - (a.daysSinceUpdate ?? 0)).slice(0, 20)
      .map(r => ({ slug: r.slug, daysSinceUpdate: r.daysSinceUpdate })),
  }

  fs.writeFileSync(path.join(__dirname, '../blog-audit-raw.json'), JSON.stringify(out, null, 2))
  console.log(JSON.stringify(summary, null, 2))
}

main()
