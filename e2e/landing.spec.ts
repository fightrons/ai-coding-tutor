import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('should display the landing page', async ({ page }) => {
    await page.goto('/')

    // Wait for splash screen to complete and main content to appear
    await expect(page.getByRole('heading', { name: /learn programming/i })).toBeVisible({
      timeout: 5000,
    })
  })

  test('should have login and signup links', async ({ page }) => {
    await page.goto('/')

    // Wait for splash screen to complete
    await expect(page.getByRole('heading', { name: /learn programming/i })).toBeVisible({
      timeout: 5000,
    })

    // Look for authentication-related links (actual text: "Sign In" and "Create Account")
    const loginLink = page.getByRole('link', { name: /sign in/i })
    const signupLink = page.getByRole('link', { name: /create account/i })

    // Both should be visible
    await expect(loginLink).toBeVisible()
    await expect(signupLink).toBeVisible()
  })

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/')

    // Wait for splash screen to complete
    await expect(page.getByRole('heading', { name: /learn programming/i })).toBeVisible({
      timeout: 5000,
    })

    // Click login link
    await page.getByRole('link', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/')

    // Wait for splash screen to complete
    await expect(page.getByRole('heading', { name: /learn programming/i })).toBeVisible({
      timeout: 5000,
    })

    // Click signup link
    await page.getByRole('link', { name: /create account/i }).click()
    await expect(page).toHaveURL(/\/signup/)
  })
})
