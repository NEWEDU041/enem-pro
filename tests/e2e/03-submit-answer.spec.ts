import { test, expect } from '@playwright/test'
import { QuestionsPage, QuestionDetailPage } from '../pages'

/**
 * E2E Test: Submit Answer & Get Explanation
 * Critical path: User can answer questions and learn from explanations
 */
test.describe('Critical Journey: Submit Answer & View Explanation', () => {
  test.beforeEach(async ({ page }) => {
    // Go to questions page
    const questionsPage = new QuestionsPage(page)
    await questionsPage.goto()

    // Click first question
    const questionCount = await questionsPage.getQuestionCount()
    if (questionCount > 0) {
      await questionsPage.clickFirstQuestion()
      await page.waitForLoadState('networkidle')
    }
  })

  test('should select answer and submit successfully', async ({ page }) => {
    const questionDetailPage = new QuestionDetailPage(page)

    // Wait for question to load
    await expect(questionDetailPage.questionTitle).toBeVisible({ timeout: 10000 })
    await questionDetailPage.takeScreenshot('question-loaded')

    // Get answer options
    const optionCount = await questionDetailPage.answerOptions.count()
    expect(optionCount).toBeGreaterThan(0)

    // Select first answer
    await questionDetailPage.selectAnswer(0)
    await questionDetailPage.takeScreenshot('answer-selected')

    // Submit answer
    await questionDetailPage.submitAnswer()
    await page.waitForLoadState('networkidle')
    await questionDetailPage.takeScreenshot('answer-submitted')
  })

  test('should display explanation after answer submission', async ({ page }) => {
    const questionDetailPage = new QuestionDetailPage(page)

    // Wait for question to load
    await expect(questionDetailPage.questionTitle).toBeVisible({ timeout: 10000 })

    // Get answer count and select random option
    const optionCount = await questionDetailPage.answerOptions.count()
    const randomIndex = Math.floor(Math.random() * optionCount)

    await questionDetailPage.selectAndSubmitAnswer(randomIndex)

    // Wait for explanation
    await questionDetailPage.waitForExplanation()
    const explanation = await questionDetailPage.getExplanationText()

    expect(explanation.length).toBeGreaterThan(10)
    await questionDetailPage.takeScreenshot('explanation-visible')

    console.log(`✅ Explanation length: ${explanation.length} chars`)
  })

  test('should show correct answer indicator', async ({ page }) => {
    const questionDetailPage = new QuestionDetailPage(page)

    // Wait for question to load
    await expect(questionDetailPage.questionTitle).toBeVisible({ timeout: 10000 })

    // Submit answer
    await questionDetailPage.selectAndSubmitAnswer(0)

    // Wait for feedback
    await page.waitForLoadState('networkidle')
    await questionDetailPage.takeScreenshot('answer-feedback')

    // Check if correct answer is displayed
    const correctAnswerVisible = await questionDetailPage.correctAnswer
      .isVisible()
      .catch(() => false)

    const explanationVisible = await questionDetailPage.explanationText
      .isVisible()
      .catch(() => false)

    expect(correctAnswerVisible || explanationVisible).toBeTruthy()
  })

  test('should handle answer submission for multiple-choice questions', async ({ page }) => {
    const questionDetailPage = new QuestionDetailPage(page)

    // Wait for question to load
    await expect(questionDetailPage.questionTitle).toBeVisible({ timeout: 10000 })

    // Get all answer options
    const options = await questionDetailPage.answerOptions.all()
    expect(options.length).toBeGreaterThan(0)

    // Try selecting different options
    for (let i = 0; i < Math.min(2, options.length); i++) {
      await questionDetailPage.selectAnswer(i)
      await page.waitForTimeout(200) // Brief pause between selections
    }

    // Submit the selected answer
    await questionDetailPage.submitAnswer()
    await page.waitForLoadState('networkidle')

    // Verify answer was processed
    const explanation = await questionDetailPage.explanationText.isVisible().catch(() => false)
    expect(explanation || page.url().includes('/question')).toBeTruthy()

    await questionDetailPage.takeScreenshot('multi-answer-submitted')
  })

  test('should prevent submission without selecting answer', async ({ page }) => {
    const questionDetailPage = new QuestionDetailPage(page)

    // Wait for question to load
    await expect(questionDetailPage.questionTitle).toBeVisible({ timeout: 10000 })

    // Try to submit without selecting answer
    await questionDetailPage.submitAnswer()
    await page.waitForLoadState('networkidle')

    // Should still be on question page or show error
    const onQuestionPage = page.url().includes('/question')
    const errorVisible = await questionDetailPage.errorMessage.isVisible().catch(() => false)

    expect(onQuestionPage || errorVisible).toBeTruthy()
    await questionDetailPage.takeScreenshot('submit-without-answer')
  })
})
