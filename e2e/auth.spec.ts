import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.describe('Code-Based Access', () => {
    test('should create new profile and redirect to dashboard when clicking Start Learning', async ({ page }) => {
      // Arrange
      await page.goto('/')

      // Wait for splash screen to complete (2s minimum)
      await expect(page.getByRole('heading', { name: /learn programming/i })).toBeVisible({
        timeout: 5000,
      })

      // Act
      await page.getByRole('button', { name: /start learning/i }).click()

      // Assert - should redirect to dashboard
      await expect(page).toHaveURL('/learn', { timeout: 10000 })
      await expect(page.getByRole('heading', { name: /your progress/i })).toBeVisible()

      // Should show access code banner for code-based users
      await expect(page.getByText(/your access code/i)).toBeVisible()
    })

    test('should show error for invalid access code', async ({ page }) => {
      // Arrange
      await page.goto('/')
      await expect(page.getByRole('heading', { name: /learn programming/i })).toBeVisible({
        timeout: 5000,
      })

      // Act - show code input
      await page.getByText(/already learning\? enter your code/i).click()
      await page.getByPlaceholder(/swift-bear/i).fill('INVALID-CODE-99')
      await page.getByRole('button', { name: /continue/i }).click()

      // Assert - should show error message
      await expect(page.getByText(/this code is not recognized/i)).toBeVisible()
    })

    test('should allow canceling code entry', async ({ page }) => {
      // Arrange
      await page.goto('/')
      await expect(page.getByRole('heading', { name: /learn programming/i })).toBeVisible({
        timeout: 5000,
      })

      // Act - show code input then cancel
      await page.getByText(/already learning\? enter your code/i).click()
      await expect(page.getByPlaceholder(/swift-bear/i)).toBeVisible()
      await page.getByRole('button', { name: /cancel/i }).click()

      // Assert - code input should be hidden
      await expect(page.getByPlaceholder(/swift-bear/i)).not.toBeVisible()
      await expect(page.getByText(/already learning\? enter your code/i)).toBeVisible()
    })
  })

  test.describe('Login Page', () => {
    test('should display login form with email and password fields', async ({ page }) => {
      // Arrange & Act
      await page.goto('/login')

      // Assert
      await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/password/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    })

    test('should show error for invalid credentials', async ({ page }) => {
      // Arrange
      await page.goto('/login')

      // Act - attempt login with non-existent user
      await page.getByLabel(/email/i).fill('nonexistent@example.com')
      await page.getByLabel(/password/i).fill('wrongpassword123')
      await page.getByRole('button', { name: /sign in/i }).click()

      // Assert - should show authentication error
      await expect(page.getByText(/invalid|credentials|error|failed/i)).toBeVisible({ timeout: 10000 })
    })

    test('should show validation error for empty password', async ({ page }) => {
      // Arrange
      await page.goto('/login')

      // Act
      await page.getByLabel(/email/i).fill('test@example.com')
      await page.getByRole('button', { name: /sign in/i }).click()

      // Assert
      await expect(page.getByText(/password is required/i)).toBeVisible()
    })

    test('should navigate to signup page', async ({ page }) => {
      // Arrange
      await page.goto('/login')

      // Act
      await page.getByRole('link', { name: /sign up/i }).click()

      // Assert
      await expect(page).toHaveURL('/signup')
    })

    test('should navigate back to home', async ({ page }) => {
      // Arrange
      await page.goto('/login')

      // Act
      await page.getByRole('link', { name: /back to home/i }).click()

      // Assert
      await expect(page).toHaveURL('/')
    })
  })

  test.describe('Signup Page', () => {
    test('should display signup form with all required fields', async ({ page }) => {
      // Arrange & Act
      await page.goto('/signup')

      // Assert
      await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible()
      await expect(page.getByLabel('Full Name')).toBeVisible()
      await expect(page.getByLabel('Email')).toBeVisible()
      await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
      await expect(page.getByLabel('Confirm Password')).toBeVisible()
      await expect(page.getByRole('button', { name: /create account/i })).toBeVisible()
    })

    test('should show validation errors for empty form submission', async ({ page }) => {
      // Arrange
      await page.goto('/signup')

      // Act - submit empty form
      await page.getByRole('button', { name: /create account/i }).click()

      // Assert - should show validation errors
      await expect(page.getByText(/enter your full name/i)).toBeVisible()
    })

    test('should navigate to login page', async ({ page }) => {
      // Arrange
      await page.goto('/signup')

      // Act
      await page.getByRole('link', { name: /sign in/i }).click()

      // Assert
      await expect(page).toHaveURL('/login')
    })

    test('should navigate back to home', async ({ page }) => {
      // Arrange
      await page.goto('/signup')

      // Act
      await page.getByRole('link', { name: /back to home/i }).click()

      // Assert
      await expect(page).toHaveURL('/')
    })
  })

  test.describe('Auth Navigation Flow', () => {
    test('should allow navigation between landing, login, and signup', async ({ page }) => {
      // Start at landing
      await page.goto('/')
      await expect(page.getByRole('heading', { name: /learn programming/i })).toBeVisible({
        timeout: 5000,
      })

      // Go to login
      await page.getByRole('link', { name: /sign in/i }).click()
      await expect(page).toHaveURL('/login')

      // Go to signup from login
      await page.getByRole('link', { name: /sign up/i }).click()
      await expect(page).toHaveURL('/signup')

      // Go back to login from signup
      await page.getByRole('link', { name: /sign in/i }).click()
      await expect(page).toHaveURL('/login')

      // Go back to landing
      await page.getByRole('link', { name: /back to home/i }).click()
      await expect(page).toHaveURL('/')
    })
  })

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users from /learn to landing', async ({ page }) => {
      // Arrange & Act - try to access protected route directly
      await page.goto('/learn')

      // Assert - should redirect to landing (after splash)
      // The app checks auth and redirects if not authenticated
      await expect(page).toHaveURL('/', { timeout: 10000 })
    })
  })
})
