import { Page, Locator } from '@playwright/test'

/**
 * Base page class with common utilities
 */
export class BasePage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async goto(path: string = '/') {
    await this.page.goto(path)
    await this.page.waitForLoadState('networkidle')
  }

  async waitForSelector(selector: string, timeout = 10000) {
    await this.page.waitForSelector(selector, { timeout })
  }

  async click(locator: Locator) {
    await locator.waitFor({ state: 'visible' })
    await locator.click()
  }

  async fill(locator: Locator, text: string) {
    await locator.waitFor({ state: 'visible' })
    await locator.fill(text)
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `artifacts/${name}.png`, fullPage: true })
  }
}

/**
 * Login/Auth Page Object
 */
export class LoginPage extends BasePage {
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly loginButton: Locator
  readonly errorMessage: Locator
  readonly signupLink: Locator

  constructor(page: Page) {
    super(page)
    this.emailInput = page.locator('[data-testid="email-input"], input[type="email"]').first()
    this.passwordInput = page.locator('[data-testid="password-input"], input[type="password"]').first()
    this.loginButton = page.locator('[data-testid="login-button"], button:has-text("Login"), button:has-text("Sign In")').first()
    this.errorMessage = page.locator('[data-testid="error-message"]')
    this.signupLink = page.locator('a:has-text("Sign up"), a:has-text("Register")')
  }

  async goto() {
    await super.goto('/login')
  }

  async login(email: string, password: string) {
    await this.fill(this.emailInput, email)
    await this.fill(this.passwordInput, password)
    await this.click(this.loginButton)
    await this.page.waitForLoadState('networkidle')
  }

  async loginAndWaitForNavigation(email: string, password: string, waitPath = '/') {
    await this.login(email, password)
    await this.page.waitForURL(`**${waitPath}**`, { timeout: 15000 })
  }
}

/**
 * Signup Page Object
 */
export class SignupPage extends BasePage {
  readonly nameInput: Locator
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly confirmPasswordInput: Locator
  readonly signupButton: Locator
  readonly errorMessage: Locator
  readonly loginLink: Locator

  constructor(page: Page) {
    super(page)
    this.nameInput = page.locator('[data-testid="name-input"], input[placeholder*="Name"]').first()
    this.emailInput = page.locator('[data-testid="email-input"], input[type="email"]').first()
    this.passwordInput = page.locator('[data-testid="password-input"], input[type="password"]').first()
    this.confirmPasswordInput = page.locator('[data-testid="confirm-password"], input[placeholder*="Confirm"]').first()
    this.signupButton = page.locator('[data-testid="signup-button"], button:has-text("Sign Up"), button:has-text("Register")').first()
    this.errorMessage = page.locator('[data-testid="error-message"]')
    this.loginLink = page.locator('a:has-text("Log in"), a:has-text("Sign in")')
  }

  async goto() {
    await super.goto('/signup')
  }

  async signup(name: string, email: string, password: string) {
    await this.fill(this.nameInput, name)
    await this.fill(this.emailInput, email)
    await this.fill(this.passwordInput, password)
    await this.fill(this.confirmPasswordInput, password)
    await this.click(this.signupButton)
    await this.page.waitForLoadState('networkidle')
  }
}

/**
 * Questions/Search Page Object
 */
export class QuestionsPage extends BasePage {
  readonly searchInput: Locator
  readonly searchButton: Locator
  readonly questionCards: Locator
  readonly firstQuestion: Locator
  readonly filterButton: Locator
  readonly noResultsMessage: Locator

  constructor(page: Page) {
    super(page)
    this.searchInput = page.locator('[data-testid="search-input"], input[placeholder*="Search"]').first()
    this.searchButton = page.locator('[data-testid="search-button"], button:has-text("Search")').first()
    this.questionCards = page.locator('[data-testid="question-card"], article')
    this.firstQuestion = this.questionCards.first()
    this.filterButton = page.locator('[data-testid="filter-button"], button:has-text("Filter")')
    this.noResultsMessage = page.locator('[data-testid="no-results"], text=/no results/i')
  }

  async goto() {
    await super.goto('/questions')
  }

  async search(query: string) {
    await this.fill(this.searchInput, query)
    await this.click(this.searchButton)
    await this.page.waitForLoadState('networkidle')
  }

  async getQuestionCount(): Promise<number> {
    return await this.questionCards.count()
  }

  async clickFirstQuestion() {
    await this.click(this.firstQuestion)
    await this.page.waitForLoadState('networkidle')
  }
}

/**
 * Question Detail & Answer Submission Page Object
 */
export class QuestionDetailPage extends BasePage {
  readonly questionTitle: Locator
  readonly questionText: Locator
  readonly answerOptions: Locator
  readonly submitAnswerButton: Locator
  readonly explanationText: Locator
  readonly correctAnswer: Locator
  readonly successMessage: Locator

  constructor(page: Page) {
    super(page)
    this.questionTitle = page.locator('[data-testid="question-title"], h1')
    this.questionText = page.locator('[data-testid="question-text"]')
    this.answerOptions = page.locator('[data-testid="answer-option"], label')
    this.submitAnswerButton = page.locator('[data-testid="submit-button"], button:has-text("Submit"), button:has-text("Check")')
    this.explanationText = page.locator('[data-testid="explanation"]')
    this.correctAnswer = page.locator('[data-testid="correct-answer"]')
    this.successMessage = page.locator('[data-testid="success-message"]')
  }

  async selectAnswer(optionIndex: number) {
    const options = await this.answerOptions.all()
    if (options.length > optionIndex) {
      await this.click(options[optionIndex])
    }
  }

  async submitAnswer() {
    await this.click(this.submitAnswerButton)
    await this.page.waitForLoadState('networkidle')
  }

  async selectAndSubmitAnswer(optionIndex: number) {
    await this.selectAnswer(optionIndex)
    await this.submitAnswer()
  }

  async waitForExplanation() {
    await this.explanationText.waitFor({ state: 'visible', timeout: 10000 })
  }

  async getExplanationText(): Promise<string> {
    return await this.explanationText.textContent() || ''
  }
}

/**
 * Checkout Page Object
 */
export class CheckoutPage extends BasePage {
  readonly planSelector: Locator
  readonly priceDisplay: Locator
  readonly cardNumberInput: Locator
  readonly cardExpiryInput: Locator
  readonly cardCvcInput: Locator
  readonly cardNameInput: Locator
  readonly checkoutButton: Locator
  readonly successMessage: Locator
  readonly errorMessage: Locator

  constructor(page: Page) {
    super(page)
    this.planSelector = page.locator('[data-testid="plan-selector"], select, [role="combobox"]').first()
    this.priceDisplay = page.locator('[data-testid="price"], span:has-text("$")')
    this.cardNumberInput = page.locator('[data-testid="card-number"], input[placeholder*="card"]').first()
    this.cardExpiryInput = page.locator('[data-testid="card-expiry"], input[placeholder*="MM/YY"]').first()
    this.cardCvcInput = page.locator('[data-testid="card-cvc"], input[placeholder*="CVC"]').first()
    this.cardNameInput = page.locator('[data-testid="card-name"], input[placeholder*="Name"]').first()
    this.checkoutButton = page.locator('[data-testid="checkout-button"], button:has-text("Pay"), button:has-text("Checkout")').first()
    this.successMessage = page.locator('[data-testid="success-message"]')
    this.errorMessage = page.locator('[data-testid="error-message"]')
  }

  async goto() {
    await super.goto('/checkout')
  }

  async selectPlan(planName: string) {
    const planButton = this.page.locator(`[data-testid="plan-${planName.toLowerCase()}"], button:has-text("${planName}")`)
    await this.click(planButton)
  }

  async fillCardDetails(cardNumber = '4242424242424242', expiry = '12/25', cvc = '123', name = 'Test User') {
    await this.fill(this.cardNameInput, name)
    await this.fill(this.cardNumberInput, cardNumber)
    await this.fill(this.cardExpiryInput, expiry)
    await this.fill(this.cardCvcInput, cvc)
  }

  async checkout() {
    await this.click(this.checkoutButton)
    await this.page.waitForLoadState('networkidle')
  }
}

/**
 * Profile Page Object
 */
export class ProfilePage extends BasePage {
  readonly profileName: Locator
  readonly profileEmail: Locator
  readonly statsSection: Locator
  readonly answeredCount: Locator
  readonly correctCount: Locator
  readonly recentAnswers: Locator
  readonly editButton: Locator
  readonly logoutButton: Locator

  constructor(page: Page) {
    super(page)
    this.profileName = page.locator('[data-testid="profile-name"], h1')
    this.profileEmail = page.locator('[data-testid="profile-email"]')
    this.statsSection = page.locator('[data-testid="stats"]')
    this.answeredCount = page.locator('[data-testid="answered-count"]')
    this.correctCount = page.locator('[data-testid="correct-count"]')
    this.recentAnswers = page.locator('[data-testid="recent-answers"]')
    this.editButton = page.locator('[data-testid="edit-button"], button:has-text("Edit")')
    this.logoutButton = page.locator('[data-testid="logout-button"], button:has-text("Logout"), button:has-text("Sign out")')
  }

  async goto() {
    await super.goto('/profile')
  }

  async getStats(): Promise<{ answered: string; correct: string }> {
    return {
      answered: (await this.answeredCount.textContent()) || '0',
      correct: (await this.correctCount.textContent()) || '0',
    }
  }

  async logout() {
    await this.click(this.logoutButton)
    await this.page.waitForURL('**/login**', { timeout: 10000 })
  }
}

/**
 * Admin Dashboard Page Object
 */
export class AdminDashboardPage extends BasePage {
  readonly auditLogsTable: Locator
  readonly auditLogRows: Locator
  readonly filterInput: Locator
  readonly dateRangeInput: Locator
  readonly userColumn: Locator
  readonly actionColumn: Locator
  readonly timestampColumn: Locator
  readonly noLogsMessage: Locator

  constructor(page: Page) {
    super(page)
    this.auditLogsTable = page.locator('[data-testid="audit-logs-table"], table')
    this.auditLogRows = page.locator('[data-testid="audit-log-row"], tbody tr')
    this.filterInput = page.locator('[data-testid="filter-input"], input[placeholder*="Filter"]').first()
    this.dateRangeInput = page.locator('[data-testid="date-range"]')
    this.userColumn = page.locator('[data-testid="user-column"]')
    this.actionColumn = page.locator('[data-testid="action-column"]')
    this.timestampColumn = page.locator('[data-testid="timestamp-column"]')
    this.noLogsMessage = page.locator('[data-testid="no-logs-message"]')
  }

  async goto() {
    await super.goto('/admin/audit-logs')
  }

  async getLogCount(): Promise<number> {
    return await this.auditLogRows.count()
  }

  async filterLogs(query: string) {
    await this.fill(this.filterInput, query)
    await this.page.waitForLoadState('networkidle')
  }

  async getFirstLogAction(): Promise<string> {
    const firstRow = this.auditLogRows.first()
    return (await firstRow.textContent()) || ''
  }
}
