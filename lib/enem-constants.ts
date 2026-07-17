// Client-safe constants and helpers split out of enem-api.ts so client
// components never pull in that file's Node-only (fs/path) local-dataset code.

export const DISCIPLINES = [
  'Matemática',
  'Linguagens, Códigos e suas Tecnologias',
  'Ciências Humanas e suas Tecnologias',
  'Ciências da Natureza e suas Tecnologias',
]

// API returns years only up to 2023 — 2024 is served from a local dataset (see enem-api.ts)
export const YEARS = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009]

export const SLUG_TO_DISCIPLINE: Record<string, string> = {
  'matematica': 'Matemática',
  'linguagens': 'Linguagens, Códigos e suas Tecnologias',
  'ciencias-humanas': 'Ciências Humanas e suas Tecnologias',
  'ciencias-natureza': 'Ciências da Natureza e suas Tecnologias',
}

export function disciplineToSlug(discipline: string): string | null {
  const entry = Object.entries(SLUG_TO_DISCIPLINE).find(([, name]) => name === discipline)
  return entry ? entry[0] : null
}
