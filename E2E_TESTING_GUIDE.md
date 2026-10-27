# E2E Testing Guide - enem-pro & site-clicks

Complete guide to Playwright E2E testing setup, Page Object Model (POM), best practices, and CI/CD integration.

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Setup Instructions](#setup-instructions)
4. [Page Object Model (POM)](#page-object-model-pom)
5. [Running Tests](#running-tests)
6. [Test Coverage](#test-coverage)
7. [Best Practices](#best-practices)
8. [CI/CD Integration](#cicd-integration)
9. [Troubleshooting](#troubleshooting)

---

## Overview

### What is E2E Testing?

End-to-End (E2E) testing simulates real user interactions with your application from start to finish. Using Playwright, we test complete user journeys like:
- User authentication (signup → login)
- Feature workflows (search → answer → checkout)
- Mobile responsiveness
- Admin operations

### Why Playwright?

- **Fast**: Parallel test execution
- **Reliable**: Built-in auto-waiting for elements
- **Cross-browser**: Chromium, Firefox, WebKit
- **Mobile**: Device emulation support
- **Debug**: Trace, video, and screenshot on failure

---

## Project Structure

### enem-pro

```
enem-pro/
├── playwright.config.ts          # Playwright configuration
├── tests/
│   ├── e2e/
│   │   ├── 01-auth-checkout.spec.ts       # Signup → Login → Checkout
│   │   ├── 02-search-questions.spec.ts    # Search & filter
│   │   ├── 03-submit-answer.spec.ts       # Answer questions
│   │   ├── 04-view-profile.spec.ts        # User profile
│   │   └── 05-admin-audit-logs.spec.ts    # Admin operations
│   └── pages/
│       └── index.ts                        # Page Object Models
├── artifacts/                    # Screenshots & videos
└── playwright-report/           # HTML test reports

```

### site-clicks

```
site-clicks/
├── playwright.config.ts          # Playwright configuration
├── tests/
│   ├── e2e/
│   │   ├── 01-landing-blog-navigation.spec.ts  # Landing → Blog
│   │   ├── 02-newsletter-signup.spec.ts        # Newsletter signup
│   │   └── 03-mobile-responsive.spec.ts        # Mobile testing
│   └── pages/
│       └── index.ts                            # Page Object Models
├── artifacts/                    # Screenshots & videos
└── playwright-report/           # HTML test reports
```

---

## Setup Instructions

### 1. Install Playwright

Both projects already have Playwright installed via npm. If you need to reinstall:

```bash
# enem-pro
cd /root/projetos/enem-pro
npm install --save-dev --legacy-peer-deps @playwright/test

# site-clicks
cd /root/projetos/site-clicks
npm install --save-dev @playwright/test
```

### 2. Install Browser Binaries

```bash
# Download Chromium, Firefox, and WebKit
npx playwright install

# For CI/CD (also installs system dependencies)
npx playwright install --with-deps
```

### 3. Verify Installation

```bash
# Check Playwright version
npx playwright --version

# Run a quick test
npx playwright test tests/e2e/01-auth-checkout.spec.ts --headed
```

---

## Page Object Model (POM)

### What is POM?

Page Object Model is a design pattern that creates an abstraction of your web page/UI to reduce duplication and make tests more maintainable.

### POM Structure

```typescript
// Bad: Direct selectors in tests (brittle)
test('login', () => {
  await page.fill('input[type="email"]', 'user@example.com')
  await page.fill('input[type="password"]', 'password')
  await page.click('button:has-text("Login")')
})

// Good: Page Object Model (maintainable)
const loginPage = new LoginPage(page)
await loginPage.login('user@example.com', 'password')
```

### Creating a Page Object

```typescript
import { Page, Locator } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly loginButton: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.locator('[data-testid="email-input"]')
    this.passwordInput = page.locator('[data-testid="password-input"]')
    this.loginButton = page.locator('[data-testid="login-button"]')
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.loginButton.click()
    await this.page.waitForLoadState('networkidle')
  }
}
```

### Using Page Objects

```typescript
import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages'

test('user can login', async ({ page }) => {
  const loginPage = new LoginPage(page)
  await loginPage.goto()
  await loginPage.login('user@example.com', 'password')
  
  // Verify login was successful
  expect(page.url()).toContain('/dashboard')
})
```

### Base Page Class

All page objects inherit from `BasePage`:

```typescript
export class BasePage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async goto(path: string = '/') {
    await this.page.goto(path)
    await this.page.waitForLoadState('networkidle')
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `artifacts/${name}.png`, 
      fullPage: true 
    })
  }
}
```

---

## Running Tests

### Run All Tests

```bash
# Chrome only
npx playwright test

# All browsers (chromium, firefox, webkit)
npx playwright test --config=playwright.config.ts

# Specific browser
npx playwright test --project=firefox
```

### Run Specific Tests

```bash
# Single test file
npx playwright test tests/e2e/01-auth-checkout.spec.ts

# Specific test by name
npx playwright test -g "should login"

# Single test with line number
npx playwright test tests/e2e/01-auth-checkout.spec.ts:10
```

### Run Tests in Different Modes

```bash
# Headed mode (see browser)
npx playwright test --headed

# Debug mode (step through)
npx playwright test --debug

# Watch mode (re-run on file changes)
npx playwright test --watch

# Repeat each test N times (for flakiness)
npx playwright test --repeat-each=5
```

### View Test Reports

```bash
# HTML Report
npx playwright show-report

# JSON Report
cat playwright-results.json | jq .

# JUnit Report (for CI integration)
cat junit-results.xml
```

---

## Test Coverage

### enem-pro (5 Tests)

#### 1. Auth & Checkout Journey
**File:** `01-auth-checkout.spec.ts`
- Signup with validation
- Login with error handling
- Complete onboarding flow
- Answer questions
- Checkout process

**Test Cases:**
- ✅ Complete user onboarding and upgrade flow
- ✅ Show validation errors on invalid signup
- ✅ Login with valid credentials
- ✅ Show error on invalid login

#### 2. Search Questions
**File:** `02-search-questions.spec.ts`
- Search by keyword
- Handle empty results
- Display all questions
- Navigate to detail page
- Filter and sort

**Test Cases:**
- ✅ Search questions by keyword
- ✅ Handle empty search results gracefully
- ✅ Display questions without search filter
- ✅ Navigate to question detail from list
- ✅ Search and filter questions by multiple criteria

#### 3. Submit Answer & Explanation
**File:** `03-submit-answer.spec.ts`
- Select multiple choice answer
- Submit answer
- Display explanation
- Show correct answer
- Validation

**Test Cases:**
- ✅ Select answer and submit successfully
- ✅ Display explanation after answer submission
- ✅ Show correct answer indicator
- ✅ Handle answer submission for multiple-choice questions
- ✅ Prevent submission without selecting answer

#### 4. View Profile
**File:** `04-view-profile.spec.ts`
- Load profile page
- Display user info
- Show statistics
- Recent answers
- Edit profile
- Logout

**Test Cases:**
- ✅ Load profile page successfully
- ✅ Display user profile information
- ✅ Display user statistics and answered questions
- ✅ Show recent answers section
- ✅ Allow user to edit profile if logged in
- ✅ Handle profile logout action

#### 5. Admin Audit Logs
**File:** `05-admin-audit-logs.spec.ts`
- Load admin dashboard
- Display audit logs
- Filter logs
- View log details
- Handle no logs state

**Test Cases:**
- ✅ Load admin audit logs page
- ✅ Display audit log entries
- ✅ Filter audit logs by query
- ✅ Display log details (user, action, timestamp)
- ✅ Handle no logs state gracefully
- ✅ Verify audit log structure and columns

### site-clicks (3 Tests)

#### 1. Landing → Blog Navigation
**File:** `01-landing-blog-navigation.spec.ts`
- Navigate landing to blog
- Display blog posts
- Open blog post
- View post content
- Navigate back

**Test Cases:**
- ✅ Navigate from landing page to blog
- ✅ Display blog posts list
- ✅ Open blog post from list
- ✅ Display blog post content with metadata
- ✅ Navigate back from blog post

#### 2. Newsletter Signup
**File:** `02-newsletter-signup.spec.ts`
- Access newsletter from landing
- Subscribe with email
- Validate email format
- Handle duplicates
- Complete E2E flow

**Test Cases:**
- ✅ Access newsletter signup from landing page
- ✅ Subscribe to newsletter with valid email
- ✅ Validate email format on newsletter signup
- ✅ Handle newsletter subscription flow end-to-end
- ✅ Prevent duplicate email subscription

#### 3. Mobile Responsive
**File:** `03-mobile-responsive.spec.ts`
- Load on mobile viewport
- Display mobile navigation
- Responsive blog page
- Touch interactions
- Readable text
- No horizontal scroll
- Responsive images
- Tablet viewport
- Multiple device sizes

**Test Cases:**
- ✅ Load landing page on mobile viewport
- ✅ Display mobile navigation menu
- ✅ Render blog page responsively on mobile
- ✅ Handle touch interactions on mobile
- ✅ Have readable text on mobile
- ✅ Not have horizontal scroll on mobile
- ✅ Display images responsively on mobile
- ✅ Work on tablet viewport
- ✅ Optimize layout for different mobile sizes

---

## Best Practices

### 1. Use Data Attributes for Selectors

```typescript
// Bad: Fragile selectors
page.locator('button:nth-child(3)')
page.locator('div.container > span')

// Good: Resilient selectors
page.locator('[data-testid="submit-button"]')
page.locator('[data-testid="user-name"]')
```

**HTML:**
```html
<button data-testid="submit-button">Submit</button>
<span data-testid="user-name">John Doe</span>
```

### 2. Auto-Waiting and Timeouts

```typescript
// Bad: Arbitrary waits
await page.waitForTimeout(5000)

// Good: Wait for specific conditions
await page.waitForSelector('[data-testid="success-message"]')
await page.waitForResponse(resp => resp.url().includes('/api/submit'))
await page.waitForLoadState('networkidle')
```

### 3. Locator vs Query Selector

```typescript
// Bad: Immediate query (no auto-wait)
await page.querySelector('[data-testid="button"]').click()

// Good: Locator with auto-wait
await page.locator('[data-testid="button"]').click()
```

### 4. Assertions

```typescript
// Bad: Multiple assertions
expect(await page.locator('button').isVisible()).toBe(true)

// Good: Single assertion
await expect(page.locator('button')).toBeVisible()

// Multiple assertions
await expect(page.locator('[data-testid="user-name"]')).toContainText('John')
await expect(page.locator('[data-testid="email"]')).toHaveValue('john@example.com')
```

### 5. Test Organization

```typescript
test.describe('Feature Group', () => {
  let page: Page
  let featurePage: FeaturePage

  test.beforeEach(async ({ browser }) => {
    // Setup before each test
    page = await browser.newPage()
    featurePage = new FeaturePage(page)
  })

  test.afterEach(async () => {
    // Cleanup after each test
    await page.close()
  })

  test('should do something', async () => {
    // Test implementation
  })
})
```

### 6. Screenshots and Videos

```typescript
// Screenshot on failure (automatic)
// Videos on failure (automatic)

// Manual screenshots
await page.screenshot({ path: 'artifacts/success-state.png' })
await page.screenshot({ path: 'artifacts/full-page.png', fullPage: true })
await page.locator('[data-testid="chart"]').screenshot({ path: 'artifacts/chart.png' })
```

### 7. Handling Flaky Tests

```typescript
// Skip unreliable test
test('flaky test', async ({ page }) => {
  test.skip(process.env.CI, 'Flaky in CI - Issue #123')
  // test implementation
})

// Mark as fixme
test('feature not yet implemented', async ({ page }) => {
  test.fixme(true, 'Waiting for backend API')
  // test implementation
})

// Retry specific test
test('network-dependent test', async ({ page }) => {
  test.slow() // Slow test - higher timeout
  // test implementation
})
```

### 8. Mobile Testing

```typescript
test('mobile responsive', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })
  const page = await context.newPage()
  // Test implementation
})
```

---

## CI/CD Integration

### GitHub Actions Workflow

Both projects have `.github/workflows/e2e-tests.yml` configured to:

1. **Run on:** Push to main/develop, Pull Requests
2. **Browsers:** Chromium, Firefox, WebKit (parallel)
3. **Reporting:** Upload artifacts, comment on PR
4. **Retention:** 30 days

### Workflow Features

✅ **Multi-browser testing**
- Tests run in parallel across browsers
- Fail fast mode for quick feedback

✅ **Artifact Management**
- HTML reports uploaded
- Screenshots on failure
- Videos on failure
- JUnit XML for CI integration

✅ **PR Comments**
- Automatic test results posted to PR
- Summary of pass/fail/flaky
- Link to full report

### Running in Vercel Preview

```bash
# In Vercel deployment preview environment
BASE_URL=https://enem-pro-pr123.vercel.app npx playwright test
```

---

## Troubleshooting

### Common Issues

#### 1. Tests timeout

```bash
# Increase timeout
npx playwright test --timeout 60000

# Or in playwright.config.ts
use: {
  actionTimeout: 15000,
  navigationTimeout: 45000,
}
```

#### 2. Element not found

```typescript
// Check if element exists with visible state
await expect(page.locator('[data-testid="button"]'))
  .toBeVisible({ timeout: 15000 })

// Wait for element explicitly
await page.waitForSelector('[data-testid="button"]')
```

#### 3. Network timeouts

```typescript
// Wait for network request
await page.waitForResponse(
  resp => resp.url().includes('/api/endpoint'),
  { timeout: 30000 }
)

// Or wait for network to be idle
await page.waitForLoadState('networkidle')
```

#### 4. Flaky tests

```bash
# Run test 10 times to identify flakiness
npx playwright test tests/flaky.spec.ts --repeat-each=10
```

#### 5. Debug mode

```bash
# Run single test with debugger
npx playwright test tests/e2e/01-auth-checkout.spec.ts --debug

# Or use Playwright Inspector
PWDEBUG=1 npx playwright test
```

### Debug Tools

```bash
# View test report
npx playwright show-report

# View trace file
npx playwright show-trace artifacts/trace.zip

# View video
open artifacts/videos/test-name.webm
```

---

## Maintenance

### Regular Tasks

- **Weekly:** Review flaky test reports
- **Monthly:** Update Playwright version
- **Per PR:** Run full test suite in CI

### Test Updates

When UI changes:
1. Run tests to identify failures
2. Update Page Objects with new selectors
3. Update test logic if needed
4. Run full test suite to verify

### Performance Monitoring

```bash
# Measure test execution time
npx playwright test --reporter=list

# Generate performance report
npx playwright test --reporter=json > results.json
```

---

## Resources

- **Playwright Docs:** https://playwright.dev
- **Best Practices:** https://playwright.dev/docs/best-practices
- **API Reference:** https://playwright.dev/docs/api/class-test
- **Debugging:** https://playwright.dev/docs/debug

---

## Support & Questions

For issues or questions:
1. Check the troubleshooting section
2. Review Playwright documentation
3. Check GitHub Actions logs
4. Open an issue with test failure details

---

**Last Updated:** 2026-10-26
