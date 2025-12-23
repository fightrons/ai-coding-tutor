import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('should display the landing page', async ({ page }) => {
    await page.goto('/')

    // Check that the page loads
    await expect(page).toHaveTitle(/AI Programming Tutor|Coding Tutor/i)
  })

  test('should have login and signup links', async ({ page }) => {
    await page.goto('/')

    // Look for authentication-related links or buttons
    const loginLink = page.getByRole('link', { name: /log\s*in|sign\s*in/i })
    const signupLink = page.getByRole('link', { name: /sign\s*up|get\s*started|register/i })

    // At least one of these should be visible
    const hasLoginOrSignup = await loginLink.isVisible() || await signupLink.isVisible()
    expect(hasLoginOrSignup).toBe(true)
  })

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/')

    // Click login link
    const loginLink = page.getByRole('link', { name: /log\s*in|sign\s*in/i })
    if (await loginLink.isVisible()) {
      await loginLink.click()
      await expect(page).toHaveURL(/\/login/)
    }
  })

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/')

    // Click signup link
    const signupLink = page.getByRole('link', { name: /sign\s*up|get\s*started|register/i })
    if (await signupLink.isVisible()) {
      await signupLink.click()
      await expect(page).toHaveURL(/\/signup/)
    }
  })
})
