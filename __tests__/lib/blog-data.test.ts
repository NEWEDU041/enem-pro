import { describe, it, expect } from 'vitest'
import { getCategory, getPostsByDiscipline, getAllPosts, getPostBySlug } from '../../lib/blog-data'

describe('getCategory', () => {
  it('should return Gabarito for gabarito-related slugs', () => {
    expect(getCategory('gabarito-enem-2024')).toBe('Gabarito')
    expect(getCategory('nota-de-corte-sisu')).toBe('Gabarito')
    expect(getCategory('resultado-enem-quando')).toBe('Gabarito')
  })

  it('should return Redação for redacao-related slugs', () => {
    expect(getCategory('como-escrever-redacao-enem')).toBe('Redação')
    expect(getCategory('repertorio-enem')).toBe('Redação')
    expect(getCategory('tema-enem-2024')).toBe('Redação')
  })

  it('should return Universidades for university-related slugs', () => {
    expect(getCategory('sisu-2024')).toBe('Universidades')
    expect(getCategory('prouni-como-funciona')).toBe('Universidades')
    expect(getCategory('vagas-universitarias')).toBe('Universidades')
  })

  it('should return Por Matéria for subject-related slugs', () => {
    expect(getCategory('matematica-enem')).toBe('Por Matéria')
    expect(getCategory('fisica-mecanica')).toBe('Por Matéria')
    expect(getCategory('quimica-equilibrio')).toBe('Por Matéria')
    expect(getCategory('guia-completo-historia')).toBe('Por Matéria')
  })

  it('should return Estratégias for strategy-related slugs', () => {
    expect(getCategory('estrategia-estudo-enem')).toBe('Estratégias')
    expect(getCategory('como-estudar-eficaz')).toBe('Estratégias')
    expect(getCategory('active-recall-tecnica')).toBe('Estratégias')
    expect(getCategory('default-slug')).toBe('Estratégias')
  })

  it('should return Como Funciona for system-related slugs', () => {
    expect(getCategory('como-funciona-tri')).toBe('Como Funciona')
    expect(getCategory('matriz-referencia-enem')).toBe('Como Funciona')
  })

  it('should return Planejamento for planning-related slugs', () => {
    expect(getCategory('cronograma-enem-2024')).toBe('Planejamento')
    expect(getCategory('planejamento-60-dias')).toBe('Planejamento')
  })

  it('should return Comparativos for comparison slugs', () => {
    expect(getCategory('comparativo-enem-vs-vestibular')).toBe('Comparativos')
    expect(getCategory('prouni-ou-fies')).toBe('Comparativos')
  })

  it('should return Questões for question-related slugs', () => {
    expect(getCategory('questao-do-dia')).toBe('Questões')
    expect(getCategory('simulado-completo')).toBe('Questões')
  })

  it('should be case insensitive', () => {
    expect(getCategory('GABARITO-ENEM')).toBe('Gabarito')
    expect(getCategory('MaTeMaTiCa-EneM')).toBe('Por Matéria')
  })
})

describe('getPostsByDiscipline', () => {
  it('should return an empty array for empty discipline', () => {
    expect(getPostsByDiscipline('')).toEqual([])
    expect(getPostsByDiscipline(undefined as any)).toEqual([])
  })

  it('should filter posts by discipline name in category', () => {
    const results = getPostsByDiscipline('Matemática')
    expect(Array.isArray(results)).toBe(true)
    results.forEach(post => {
      expect(
        post.category.toLowerCase().includes('matéria') ||
        post.title.toLowerCase().includes('matemática') ||
        post.slug.toLowerCase().includes('matemática')
      ).toBe(true)
    })
  })

  it('should filter posts by discipline name in title', () => {
    const results = getPostsByDiscipline('Física')
    expect(Array.isArray(results)).toBe(true)
    if (results.length > 0) {
      results.forEach(post => {
        const normalized = (s: string) =>
          (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
        const searchTerm = normalized('Física')
        expect(
          normalized(post.title).includes(searchTerm) ||
          normalized(post.category).includes(searchTerm) ||
          normalized(post.slug).includes(searchTerm)
        ).toBe(true)
      })
    }
  })

  it('should be case insensitive', () => {
    const result1 = getPostsByDiscipline('PORTUGUÊS')
    const result2 = getPostsByDiscipline('português')
    expect(result1.length).toBe(result2.length)
  })

  it('should handle accents in search terms', () => {
    const result = getPostsByDiscipline('História')
    expect(Array.isArray(result)).toBe(true)
  })
})

describe('getAllPosts and getPostBySlug', () => {
  it('should return all posts', () => {
    const allPosts = getAllPosts()
    expect(Array.isArray(allPosts)).toBe(true)
    expect(allPosts.length).toBeGreaterThan(0)
  })

  it('should find a post by slug', () => {
    const allPosts = getAllPosts()
    if (allPosts.length > 0) {
      const firstPost = allPosts[0]
      const found = getPostBySlug(firstPost.slug)
      expect(found).toEqual(firstPost)
    }
  })

  it('should return undefined for non-existent slug', () => {
    const found = getPostBySlug('this-slug-does-not-exist-xyz-123')
    expect(found).toBeUndefined()
  })
})
