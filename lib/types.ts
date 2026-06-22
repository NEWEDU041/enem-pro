export interface Alternative {
  letter: string
  text: string
  file?: string | null
  isCorrect?: boolean
}

export interface Question {
  id: string
  year: number
  discipline: string
  title: string
  context?: string
  alternativesIntroduction?: string
  alternatives: Alternative[]
  correctAlternative: string
}

export interface UserAnswer {
  id: string
  user_id: string
  question_id: string
  selected_alternative: string
  is_correct: boolean
  answered_at: string
}

export interface DailyUsage {
  user_id: string
  date: string
  count: number
}

export interface Subscription {
  user_id: string
  plan: 'free' | 'pro'
  expires_at: string | null
}
