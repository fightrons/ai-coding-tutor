import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SecuritySection } from './SecuritySection'

describe('SecuritySection', () => {
  const mockOnUpdatePassword = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mockOnUpdatePassword.mockResolvedValue({ error: null })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('display mode', () => {
    it('renders password placeholder', () => {
      render(<SecuritySection onUpdatePassword={mockOnUpdatePassword} />)

      expect(screen.getByText('••••••••')).toBeInTheDocument()
    })

    it('renders Change button', () => {
      render(<SecuritySection onUpdatePassword={mockOnUpdatePassword} />)

      expect(screen.getByRole('button', { name: /change/i })).toBeInTheDocument()
    })

    it('shows card title and description', () => {
      render(<SecuritySection onUpdatePassword={mockOnUpdatePassword} />)

      expect(screen.getByText('Security')).toBeInTheDocument()
      expect(screen.getByText('Manage your password')).toBeInTheDocument()
    })
  })

  describe('edit mode', () => {
    it('shows form when Change is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<SecuritySection onUpdatePassword={mockOnUpdatePassword} />)

      await user.click(screen.getByRole('button', { name: /change/i }))

      expect(screen.getByPlaceholderText('New password')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Confirm new password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument()
    })

    it('cancels editing when Cancel is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<SecuritySection onUpdatePassword={mockOnUpdatePassword} />)

      await user.click(screen.getByRole('button', { name: /change/i }))
      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(screen.queryByPlaceholderText(/new password/i)).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /change/i })).toBeInTheDocument()
    })
  })

  describe('form submission', () => {
    it('calls onUpdatePassword with new password', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<SecuritySection onUpdatePassword={mockOnUpdatePassword} />)

      await user.click(screen.getByRole('button', { name: /change/i }))
      await user.type(screen.getByPlaceholderText(/^new password/i), 'newpassword123')
      await user.type(screen.getByPlaceholderText(/confirm new password/i), 'newpassword123')
      await user.click(screen.getByRole('button', { name: /update password/i }))

      await waitFor(() => {
        expect(mockOnUpdatePassword).toHaveBeenCalledWith('newpassword123')
      })
    })

    it('shows success message on successful update', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<SecuritySection onUpdatePassword={mockOnUpdatePassword} />)

      await user.click(screen.getByRole('button', { name: /change/i }))
      await user.type(screen.getByPlaceholderText(/^new password/i), 'newpassword123')
      await user.type(screen.getByPlaceholderText(/confirm new password/i), 'newpassword123')
      await user.click(screen.getByRole('button', { name: /update password/i }))

      await waitFor(() => {
        expect(screen.getByText(/password updated/i)).toBeInTheDocument()
      })
    })

    it('auto-closes edit mode after success', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<SecuritySection onUpdatePassword={mockOnUpdatePassword} />)

      await user.click(screen.getByRole('button', { name: /change/i }))
      await user.type(screen.getByPlaceholderText(/^new password/i), 'newpassword123')
      await user.type(screen.getByPlaceholderText(/confirm new password/i), 'newpassword123')
      await user.click(screen.getByRole('button', { name: /update password/i }))

      await waitFor(() => {
        expect(screen.getByText(/password updated/i)).toBeInTheDocument()
      })

      // Advance timer past the auto-close delay - wrap in act() for state updates
      await act(async () => {
        vi.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /change/i })).toBeInTheDocument()
      })
    })

    it('handles update error', async () => {
      mockOnUpdatePassword.mockResolvedValue({ error: { message: 'Server error' } })
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<SecuritySection onUpdatePassword={mockOnUpdatePassword} />)

      await user.click(screen.getByRole('button', { name: /change/i }))
      await user.type(screen.getByPlaceholderText(/^new password/i), 'validpassword123')
      await user.type(screen.getByPlaceholderText(/confirm new password/i), 'validpassword123')
      await user.click(screen.getByRole('button', { name: /update password/i }))

      await waitFor(() => {
        expect(mockOnUpdatePassword).toHaveBeenCalled()
      })

      // Should stay in edit mode on error
      expect(screen.getByPlaceholderText(/^new password/i)).toBeInTheDocument()
    })
  })
})
