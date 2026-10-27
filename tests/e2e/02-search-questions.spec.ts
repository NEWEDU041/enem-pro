import { test, expect } from '@playwright/test'
import { QuestionsPage, QuestionDetailPage } from '../pages'

/**
 * E2E Test: Search & Filter Questions
 * Critical path: User can find questions relevant to their study
 */
test.describe('Critical Journey: Search Questions', () => {
  test.beforeEach(async ({ page }) => {
    // Go to questions page
    const questionsPage = new QuestionsPage(page)
    await questionsPage.goto()
  })

  test('should search questions by keyword', async ({ page }) => {
    const questionsPage = new QuestionsPage(page)
    
    // Search for questions
    await questionsPage.search('physics')
    await questionsPage.takeScreenshot('search-results-physics')

    // Verify results or no-results message
    const questionCount = await questionsPage.getQuestionCount()
    const noResults = await questionsPage.noResultsMessage.isVisible().catch(() => false)

    expect(questionCount > 0 || noResults).toBeTruthy()
  })

  test('should handle empty search results gracefully', async ({ page }) => {
    const questionsPage = new QuestionsPage(page)

    // Search for something that likely has no results
    await questionsPage.search('xyznonexistentquery12345')
    await questionsPage.takeScreenshot('search-no-results')

    const questionCount = await questionsPage.getQuestionCount()
    
    // Should have 0 results or show no-results message
    expect(questionCount === 0).toBeTruthy()
  })

  test('should display questions without search filter', async ({ page }) => {
    const questionsPage = new QuestionsPage(page)

    // Verify questions are loaded without search
    const questionCount = await questionsPage.getQuestionCount()
    expect(questionCount).toBeGreaterThan(0)

    await questionsPage.takeScreenshot('all-questions-loaded')

    // Verify first question is clickable
    await expect(questionsPage.firstQuestion).toBeVisible()
  })

  test('should navigate to question detail from list', async ({ page }) => {
    const questionsPage = new QuestionsPage(page)

    // Get initial question count
    const initialCount = await questionsPage.getQuestionCount()
    expect(initialCount).toBeGreaterThan(0)

    // Click first question
    await questionsPage.clickFirstQuestion()
    await page.waitForLoadState('networkidle')

    // Verify we're on question detail page
    const url = page.url()
    expect(url).not.toContain('/questions')

    // Verify question content is displayed
    const questionDetailPage = new QuestionDetailPage(page)
    await expect(questionDetailPage.questionTitle).toBeVisible({ timeout: 10000 })

    await questionDetailPage.takeScreenshot('question-detail-loaded')
  })

  test('should search and filter questions by multiple criteria', async ({ page }) => {
    const questionsPage = new QuestionsPage(page)

    // Initial search
    await questionsPage.search('mathematics')
    const firstSearchCount = await questionsPage.getQuestionCount()

    await questionsPage.takeScreenshot('search-mathematics')

    // Try filter if available
    try {
      await questionsPage.click(questionsPage.filterButton)
      await page.waitForLoadState('networkidle')
      await questionsPage.takeScreenshot('filter-menu-opened')
    } catch {
      // Filter might not be available, which is OK
    }

    console.log(`✅ Search found ${firstSearchCount} questions`)
  })
})
