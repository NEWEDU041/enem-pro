import type { BlogCategory } from './blog-data'

export const ALL_CATEGORIES: BlogCategory[] = [
  'Gabarito', 'Questões', 'Redação', 'Universidades',
  'Por Matéria', 'Estratégias', 'Como Funciona', 'Planejamento', 'Comparativos',
]

export const CATEGORY_COLORS: Record<BlogCategory, string> = {
  'Gabarito':      'bg-emerald-100 text-emerald-700',
  'Questões':      'bg-indigo-100 text-indigo-700',
  'Redação':       'bg-violet-100 text-violet-700',
  'Universidades': 'bg-amber-100 text-amber-700',
  'Por Matéria':   'bg-sky-100 text-sky-700',
  'Estratégias':   'bg-rose-100 text-rose-700',
  'Como Funciona': 'bg-zinc-100 text-zinc-700',
  'Planejamento':  'bg-teal-100 text-teal-700',
  'Comparativos':  'bg-orange-100 text-orange-700',
}

export const POST_ICON: Record<BlogCategory, string> = {
  'Gabarito': '📋', 'Questões': '📝', 'Redação': '✍️',
  'Universidades': '🎓', 'Por Matéria': '📚', 'Estratégias': '🎯',
  'Como Funciona': '🔍', 'Planejamento': '📅', 'Comparativos': '⚖️',
}

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const CATEGORY_TO_SLUG: Record<BlogCategory, string> = ALL_CATEGORIES.reduce(
  (acc, cat) => { acc[cat] = slugify(cat); return acc },
  {} as Record<BlogCategory, string>,
)

export const SLUG_TO_CATEGORY: Record<string, BlogCategory> = ALL_CATEGORIES.reduce(
  (acc, cat) => { acc[CATEGORY_TO_SLUG[cat]] = cat; return acc },
  {} as Record<string, BlogCategory>,
)
