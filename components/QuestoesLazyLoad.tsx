'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronDown } from 'lucide-react'

const BATCH_SIZE = 50

interface Question {
  id: string
  year: number
  discipline: string
  difficulty: number
}

interface QuestoesLazyLoadProps {
  allQuestions: Question[]
  onQuestionSelect: (question: Question) => void
}

export default function QuestoesLazyLoad({
  allQuestions,
  onQuestionSelect,
}: QuestoesLazyLoadProps) {
  const [displayedQuestions, setDisplayedQuestions] = useState<Question[]>(
    allQuestions.slice(0, BATCH_SIZE)
  )
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const observerTarget = useRef<HTMLDivElement>(null)

  // Lazy load mais questões ao scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayedQuestions.length < allQuestions.length) {
          setIsLoadingMore(true)

          // Simular delay de load (fade effect)
          setTimeout(() => {
            const nextBatch = allQuestions.slice(
              displayedQuestions.length,
              displayedQuestions.length + BATCH_SIZE
            )
            setDisplayedQuestions((prev) => [...prev, ...nextBatch])
            setIsLoadingMore(false)
          }, 300)
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [displayedQuestions, allQuestions])

  const handleFilter = useCallback((discipline?: string, year?: number) => {
    const filtered = allQuestions.filter((q) => {
      if (discipline && q.discipline !== discipline) return false
      if (year && q.year !== year) return false
      return true
    })

    // Reset e carregar primeira batch
    setDisplayedQuestions(filtered.slice(0, BATCH_SIZE))
  }, [allQuestions])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <select
          onChange={(e) => handleFilter(e.target.value || undefined)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">Todas disciplinas</option>
          <option value="Matemática">Matemática</option>
          <option value="Português">Português</option>
          <option value="Química">Química</option>
        </select>
        <select
          onChange={(e) => handleFilter(undefined, e.target.value ? parseInt(e.target.value) : undefined)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">Todos anos</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
        </select>
      </div>

      {/* Questions Grid */}
      <div className="grid gap-3">
        {displayedQuestions.map((question) => (
          <div
            key={question.id}
            onClick={() => onQuestionSelect(question)}
            className="p-4 border rounded-lg cursor-pointer hover:border-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{question.discipline} ({question.year})</p>
                <p className="text-sm text-zinc-600">Questão {question.id}</p>
              </div>
              <span className="text-xs bg-zinc-100 px-2 py-1 rounded">
                Dificuldade: {question.difficulty}/5
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Loading indicator */}
      <div ref={observerTarget} className="py-4 text-center">
        {isLoadingMore && (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
            <span className="text-sm text-zinc-600">Carregando mais questões...</span>
          </div>
        )}
        {displayedQuestions.length === allQuestions.length && (
          <p className="text-sm text-zinc-600">
            Todas as {allQuestions.length} questões carregadas
          </p>
        )}
        {displayedQuestions.length < allQuestions.length && !isLoadingMore && (
          <button
            onClick={() => {
              const nextBatch = allQuestions.slice(
                displayedQuestions.length,
                displayedQuestions.length + BATCH_SIZE
              )
              setDisplayedQuestions((prev) => [...prev, ...nextBatch])
            }}
            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mx-auto"
          >
            Ver mais questões
            <ChevronDown size={16} />
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="text-center text-sm text-zinc-600 py-4 border-t">
        Exibindo {displayedQuestions.length} de {allQuestions.length} questões
      </div>
    </div>
  )
}
