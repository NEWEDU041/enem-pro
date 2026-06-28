'use client'

import type { Question } from '@/lib/types'

interface QuestionViewerProps {
  question: Question
  showAnswer?: boolean
}

export default function QuestionViewer({ question, showAnswer = false }: QuestionViewerProps) {
  const hasAnswer = question.correctAlternative && question.correctAlternative.trim()

  return (
    <div className="space-y-6">
      {/* Context/Enunciado */}
      {question.context && (
        <div className="text-zinc-700 bg-white p-4 rounded-lg border border-zinc-200 prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{question.context}</p>
        </div>
      )}

      {/* Alternatives Introduction */}
      {question.alternativesIntroduction && (
        <div className="text-zinc-700 font-medium">
          {question.alternativesIntroduction}
        </div>
      )}

      {/* Alternatives */}
      <div className="space-y-2">
        {question.alternatives.map((alt) => (
          <div
            key={alt.letter}
            className={`p-4 border-2 rounded-lg transition-all ${
              showAnswer && alt.isCorrect
                ? 'border-green-500 bg-green-50'
                : showAnswer && hasAnswer && !alt.isCorrect
                ? 'border-zinc-200 bg-zinc-50 opacity-60'
                : 'border-zinc-200 hover:border-indigo-300 bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className={`font-bold w-6 h-6 flex items-center justify-center rounded ${
                showAnswer && alt.isCorrect
                  ? 'bg-green-500 text-white'
                  : 'bg-zinc-100 text-zinc-700'
              }`}>
                {alt.letter}
              </span>
              <div className="flex-1">
                <p className="text-zinc-700 text-sm">{alt.text}</p>
                {showAnswer && alt.isCorrect && (
                  <p className="text-green-700 font-semibold mt-2">✓ Resposta correta</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Answer Display */}
      {showAnswer && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          {hasAnswer ? (
            <p className="text-blue-900">
              <strong>Gabarito:</strong> <span className="text-lg font-bold">{question.correctAlternative}</span>
            </p>
          ) : (
            <p className="text-amber-900 bg-amber-50 border border-amber-200 p-3 rounded">
              ⚠️ Gabarito não disponível para esta questão.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function fixImageUrl(url: string): string {
  if (!url) return ''

  // Se a URL está quebrada ou é placeholder do enem.dev, retorna vazio (img não será exibida)
  if (url.includes('broken-image') || url.includes('placeholder')) {
    return ''
  }

  // Se já é URL completa com https, mantém
  if (url.startsWith('http')) return url

  // Se é relativa, assume que vem do servidor de imagens do ENEM
  return `https://api.enem.dev${url.startsWith('/') ? '' : '/'}${url}`
}
