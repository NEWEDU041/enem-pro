const STORAGE_KEY = 'enem_favoritos'

export type Favorito = {
  id: string
  year: number
  discipline: string
  title: string
  savedAt: string
}

export function getFavoritos(): Favorito[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function toggleFavorito(fav: Omit<Favorito, 'savedAt'>): boolean {
  const list = getFavoritos()
  const idx = list.findIndex((f) => f.id === fav.id)
  if (idx >= 0) {
    list.splice(idx, 1)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    return false
  }
  list.unshift({ ...fav, savedAt: new Date().toISOString() })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 200)))
  return true
}

export function isFavorito(id: string): boolean {
  return getFavoritos().some((f) => f.id === id)
}

export function removeFavorito(id: string): void {
  const list = getFavoritos().filter((f) => f.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function clearFavoritos(): void {
  localStorage.removeItem(STORAGE_KEY)
}
