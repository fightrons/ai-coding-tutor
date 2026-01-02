import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignupForm } from './SignupForm'

// Hoisted mocks - these are hoisted to the top of the file by vitest
const mockNavigate = vi.hoisted(() => vi.fn())
const mockSignUp = vi.hoisted(() => vi.fn())
const mockInsert = vi.hoisted(() => vi.fn())
const mockRpc = vi.hoisted(() => vi.fn())
const mockClearAccessCode = vi.hoisted(() => vi.fn())
const mockUseAccessCode = vi.hoisted(() => vi.fn())

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

// Mock supabase
vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: (params: { email: string; password: string }) => mockSignUp(params),
    },
    from: () => ({
      insert: (data: unknown) => mockInsert(data),
    }),
    rpc: mockRpc,
  },
}))

vi.mock('../hooks/useAccessCode', () => ({
  useAccessCode: () => mockUseAccessCode(),
}))

describe('SignupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAccessCode.mockReturnValue({
      accessCode: null,
      profile: null,
      clearAccessCode: mockClearAccessCode,
    })
  })

  describe('rendering', () => {
    it('renders all form fields', () => {
      render(<SignupForm />)

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    })

    it('renders create account button', () => {
      render(<SignupForm />)

      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })

    it('shows upgrade message when user has access code', () => {
      mockUseAccessCode.mockReturnValue({
        accessCode: 'ABC123',
        profile: { id: 'profile-1' },
        clearAccessCode: mockClearAccessCode,
      })

      render(<SignupForm />)

      expect(screen.getByText(/your progress with code/i)).toBeInTheDocument()
      expect(screen.getByText('ABC123')).toBeInTheDocument()
    })
  })

  describe('validation', () => {
    it('does not submit form with empty fields', async () => {
      const user = userEvent.setup()
      render(<SignupForm />)

      await user.click(screen.getByRole('button', { name: /create account/i }))

      // Wait a tick for any potential async operations
      await waitFor(() => {
        expect(mockSignUp).not.toHaveBeenCalled()
      })
    })
  })

  describe('new user signup', () => {
    it('creates user and profile on successful signup', async () => {
      const user = userEvent.setup()
      mockSignUp.mockResolvedValue({
        data: {
          user: { id: 'new-user-1' },
          session: { access_token: 'token' },
        },
        error: null,
      })
      mockInsert.mockResolvedValue({ error: null })

      render(<SignupForm />)

      await user.type(screen.getByLabelText(/full name/i), 'Test User')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        })
      })

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith({
          id: 'new-user-1',
          auth_user_id: 'new-user-1',
          display_name: 'Test User',
        })
      })
    })

    it('navigates to /learn after successful signup with session', async () => {
      const user = userEvent.setup()
      mockSignUp.mockResolvedValue({
        data: {
          user: { id: 'new-user-1' },
          session: { access_token: 'token' },
        },
        error: null,
      })
      mockInsert.mockResolvedValue({ error: null })

      render(<SignupForm />)

      await user.type(screen.getByLabelText(/full name/i), 'Test User')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/learn')
      })
    })

    it('calls onPendingConfirmation when email confirmation required', async () => {
      const user = userEvent.setup()
      const onPendingConfirmation = vi.fn()
      mockSignUp.mockResolvedValue({
        data: {
          user: { id: 'new-user-1' },
          session: null, // No session = email confirmation required
        },
        error: null,
      })
      mockInsert.mockResolvedValue({ error: null })

      render(<SignupForm onPendingConfirmation={onPendingConfirmation} />)

      await user.type(screen.getByLabelText(/full name/i), 'Test User')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(onPendingConfirmation).toHaveBeenCalledWith('test@example.com')
      })
    })
  })

  describe('code-based upgrade', () => {
    it('calls upgrade RPC for code-based users', async () => {
      const user = userEvent.setup()
      mockUseAccessCode.mockReturnValue({
        accessCode: 'ABC123',
        profile: { id: 'profile-1' },
        clearAccessCode: mockClearAccessCode,
      })
      mockSignUp.mockResolvedValue({
        data: {
          user: { id: 'new-user-1' },
          session: { access_token: 'token' },
        },
        error: null,
      })
      mockRpc.mockResolvedValue({ data: true, error: null })

      render(<SignupForm />)

      await user.type(screen.getByLabelText(/full name/i), 'Test User')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(mockRpc).toHaveBeenCalledWith('upgrade_profile_to_registered', {
          p_profile_id: 'profile-1',
          p_access_code: 'ABC123',
          p_auth_user_id: 'new-user-1',
          p_display_name: 'Test User',
        })
      })
    })

    it('clears access code after successful upgrade', async () => {
      const user = userEvent.setup()
      mockUseAccessCode.mockReturnValue({
        accessCode: 'ABC123',
        profile: { id: 'profile-1' },
        clearAccessCode: mockClearAccessCode,
      })
      mockSignUp.mockResolvedValue({
        data: {
          user: { id: 'new-user-1' },
          session: { access_token: 'token' },
        },
        error: null,
      })
      mockRpc.mockResolvedValue({ data: true, error: null })

      render(<SignupForm />)

      await user.type(screen.getByLabelText(/full name/i), 'Test User')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(mockClearAccessCode).toHaveBeenCalled()
      })
    })
  })

  describe('error handling', () => {
    it('displays signup error', async () => {
      const user = userEvent.setup()
      const error = new Error('Email already registered')
      mockSignUp.mockResolvedValue({
        data: { user: null },
        error,
      })

      render(<SignupForm />)

      await user.type(screen.getByLabelText(/full name/i), 'Test User')
      await user.type(screen.getByLabelText(/email/i), 'existing@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(screen.getByText('Email already registered')).toBeInTheDocument()
      })
    })

    it('does not navigate on signup error', async () => {
      const user = userEvent.setup()
      const error = new Error('Email already registered')
      mockSignUp.mockResolvedValue({
        data: { user: null },
        error,
      })

      render(<SignupForm />)

      await user.type(screen.getByLabelText(/full name/i), 'Test User')
      await user.type(screen.getByLabelText(/email/i), 'existing@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalled()
      })

      // Navigation should not occur on error
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('loading state', () => {
    it('shows loading state while submitting', async () => {
      const user = userEvent.setup()
      let resolveSignUp: (value: { data: { user: { id: string }; session: null }; error: null }) => void
      mockSignUp.mockImplementation(() => new Promise((resolve) => {
        resolveSignUp = resolve
      }))

      render(<SignupForm />)

      await user.type(screen.getByLabelText(/full name/i), 'Test User')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /creating account/i })).toBeInTheDocument()
      })
      expect(screen.getByRole('button')).toBeDisabled()

      // Cleanup
      mockInsert.mockResolvedValue({ error: null })
      resolveSignUp!({ data: { user: { id: 'u1' }, session: null }, error: null })
    })
  })
})
