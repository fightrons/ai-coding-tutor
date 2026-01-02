import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from './LoginForm'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

// Mock useAuth
const mockSignIn = vi.fn()
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
  }),
}))

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render email and password fields', () => {
      // Act
      render(<LoginForm />)

      // Assert
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    })

    it('should render sign in button', () => {
      // Act
      render(<LoginForm />)

      // Assert
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('should have correct input types for email and password', () => {
      // Act
      render(<LoginForm />)

      // Assert
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email')
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password')
    })
  })

  describe('validation', () => {
    it('should not submit form when fields are empty', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<LoginForm />)

      // Act
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      // Assert
      await waitFor(() => {
        expect(mockSignIn).not.toHaveBeenCalled()
      })
    })
  })

  describe('form submission', () => {
    it('should call signIn with email and password on valid submission', async () => {
      // Arrange
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ error: null })
      render(<LoginForm />)

      // Act
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      // Assert
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
      })
    })

    it('should navigate to /learn on successful sign in', async () => {
      // Arrange
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ error: null })
      render(<LoginForm />)

      // Act
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      // Assert
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/learn')
      })
    })

    it('should display error message on sign in failure', async () => {
      // Arrange
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ error: { message: 'Invalid login credentials' } })
      render(<LoginForm />)

      // Act
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Invalid login credentials')).toBeInTheDocument()
      })
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should show loading state while submitting', async () => {
      // Arrange
      const user = userEvent.setup()
      let resolveSignIn: (value: { error: null }) => void
      mockSignIn.mockImplementation(
        () => new Promise((resolve) => {
          resolveSignIn = resolve
        })
      )
      render(<LoginForm />)

      // Act
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      // Assert - Loading state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument()
      })
      expect(screen.getByRole('button')).toBeDisabled()

      // Cleanup - Resolve the promise
      resolveSignIn!({ error: null })
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
      })
    })
  })
})
