// Centralized AI prompts with caching support (Token Killer optimization)
// Use cache_control: { type: "ephemeral" } on these when calling Anthropic API

export const PROMPTS = {
  // Explanations for ENEM questions - ultra-concise
  EXPLAIN_ANSWER: `Explique por que a alternativa está correta. Use até 3 parágrafos. Sem markdown excessivo.`,

  // Essay grading - condensed criteria
  GRADE_ESSAY: `Avalie redação ENEM nas 5 competências (0, 40, 80, 120, 160, 200 cada):
C1: Gramática, ortografia, pontuação
C2: Desenvolvimento do tema proposto
C3: Argumentação, coerência, repertório
C4: Conectivos, coesão, fluidez
C5: Agente + ação + meio + finalidade + efeito

Para cada: cite trecho específico, aponte bom/melhorar, nota.

Termine com:
---SCORES---
C1: [NOTA]
C2: [NOTA]
C3: [NOTA]
C4: [NOTA]
C5: [NOTA]
TOTAL: [SOMA]
---END---`,

  // When student gets it wrong: identify the gap + how to improve
  EXPLAIN_WRONG: `Você é um professor ENEM que identifica erros de pensamento.

Quando o aluno erra, faça 3 coisas:
1. Explique por que a alternativa que escolheu está ERRADA (identifique o gap/conceito que faltou)
2. Explique por que a correta é certa
3. Dê uma dica para não repetir o mesmo erro (padrão a evitar)

Use 2-3 parágrafos. Seja empático e educativo.`,
} as const

// Token savings per endpoint
export const TOKEN_SAVINGS = {
  explicar: {
    before: 600,
    after: 400,
    percentage: 33,
    model: 'claude-haiku-4-5-20251001',
  },
  explain: {
    before: 300,
    after: 250,
    percentage: 17,
    model: 'claude-haiku-4-5-20251001',
  },
  corrigirRedacao: {
    before: 2000,
    after: 1200,
    percentage: 40,
    model: 'claude-haiku-4-5-20251001',
  },
  gerarExplicacoes: {
    before: 150,
    after: 200, // quality gain
    percentage: -33, // but model downgrade (Sonnet→Haiku) saves 70% cost
    model: 'claude-haiku-4-5-20251001',
  },
} as const

export function getEstimatedMonthlySavings(questionsPerMonth: number = 2000) {
  // Assuming average 400 tokens/explanation across all endpoints
  const avgTokensAfter = 400
  const avgTokensBefore = 550
  const tokensPerMonth = questionsPerMonth * avgTokensAfter
  const tokensSavedPerMonth = questionsPerMonth * (avgTokensBefore - avgTokensAfter)

  return {
    questionsPerMonth,
    tokensPerMonth,
    tokensSavedPerMonth,
    percentageSaved: Math.round((tokensSavedPerMonth / (tokensPerMonth + tokensSavedPerMonth)) * 100),
  }
}
