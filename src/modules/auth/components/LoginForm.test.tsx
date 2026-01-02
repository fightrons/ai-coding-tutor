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
    it('renders email and password fields', () => {
      render(<LoginForm />)

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    })

    it('renders sign in button', () => {
      render(<LoginForm />)

      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('has correct input types', () => {
      render(<LoginForm />)

      expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email')
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password')
    })
  })

  describe('validation', () => {
    it('does not submit form with empty fields', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      await user.click(screen.getByRole('button', { name: /sign in/i }))

      // Wait a tick for any potential async operations
      await waitFor(() => {
        expect(mockSignIn).not.toHaveBeenCalled()
      })
    })
  })

  describe('form submission', () => {
    it('calls signIn with email and password on valid submission', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ error: null })

      render(<LoginForm />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
      })
    })

    it('navigates to /learn on successful sign in', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ error: null })

      render(<LoginForm />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/learn')
      })
    })

    it('displays server error on sign in failure', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ error: { message: 'Invalid login credentials' } })

      render(<LoginForm />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText('Invalid login credentials')).toBeInTheDocument()
      })

      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('shows loading state while submitting', async () => {
      const user = userEvent.setup()
      let resolveSignIn: (value: { error: null }) => void
      mockSignIn.mockImplementation(
        () => new Promise((resolve) => {
          resolveSignIn = resolve
        })
      )

      render(<LoginForm />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument()
      })
      expect(screen.getByRole('button')).toBeDisabled()

      // Resolve the promise
      resolveSignIn!({ error: null })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
      })
    })
  })
})
