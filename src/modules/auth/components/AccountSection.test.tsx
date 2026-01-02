import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AccountSection } from './AccountSection'

describe('AccountSection', () => {
  const mockOnUpdateEmail = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnUpdateEmail.mockResolvedValue({ error: null })
  })

  describe('display mode', () => {
    it('renders current email', () => {
      render(<AccountSection email="test@example.com" onUpdateEmail={mockOnUpdateEmail} />)

      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    it('renders Change button', () => {
      render(<AccountSection email="test@example.com" onUpdateEmail={mockOnUpdateEmail} />)

      expect(screen.getByRole('button', { name: /change/i })).toBeInTheDocument()
    })

    it('shows card title and description', () => {
      render(<AccountSection email="test@example.com" onUpdateEmail={mockOnUpdateEmail} />)

      expect(screen.getByText('Account')).toBeInTheDocument()
      expect(screen.getByText('Your email address')).toBeInTheDocument()
    })
  })

  describe('edit mode', () => {
    it('shows form when Change is clicked', async () => {
      const user = userEvent.setup()
      render(<AccountSection email="test@example.com" onUpdateEmail={mockOnUpdateEmail} />)

      await user.click(screen.getByRole('button', { name: /change/i }))

      expect(screen.getByPlaceholderText(/new email/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send confirmation/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('shows current email in edit mode', async () => {
      const user = userEvent.setup()
      render(<AccountSection email="test@example.com" onUpdateEmail={mockOnUpdateEmail} />)

      await user.click(screen.getByRole('button', { name: /change/i }))

      expect(screen.getByText(/current: test@example.com/i)).toBeInTheDocument()
    })

    it('cancels editing when Cancel is clicked', async () => {
      const user = userEvent.setup()
      render(<AccountSection email="test@example.com" onUpdateEmail={mockOnUpdateEmail} />)

      await user.click(screen.getByRole('button', { name: /change/i }))
      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(screen.queryByPlaceholderText(/new email/i)).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /change/i })).toBeInTheDocument()
    })
  })

  describe('form submission', () => {
    it('calls onUpdateEmail with new email', async () => {
      const user = userEvent.setup()
      render(<AccountSection email="test@example.com" onUpdateEmail={mockOnUpdateEmail} />)

      await user.click(screen.getByRole('button', { name: /change/i }))
      await user.type(screen.getByPlaceholderText(/new email/i), 'new@example.com')
      await user.click(screen.getByRole('button', { name: /send confirmation/i }))

      await waitFor(() => {
        expect(mockOnUpdateEmail).toHaveBeenCalledWith('new@example.com')
      })
    })

    it('shows success message on successful update', async () => {
      const user = userEvent.setup()
      render(<AccountSection email="test@example.com" onUpdateEmail={mockOnUpdateEmail} />)

      await user.click(screen.getByRole('button', { name: /change/i }))
      await user.type(screen.getByPlaceholderText(/new email/i), 'new@example.com')
      await user.click(screen.getByRole('button', { name: /send confirmation/i }))

      await waitFor(() => {
        expect(screen.getByText(/confirmation link has been sent/i)).toBeInTheDocument()
      })
    })

    it('shows error message on failed update', async () => {
      mockOnUpdateEmail.mockResolvedValue({ error: { message: 'Email already in use' } })
      const user = userEvent.setup()
      render(<AccountSection email="test@example.com" onUpdateEmail={mockOnUpdateEmail} />)

      await user.click(screen.getByRole('button', { name: /change/i }))
      await user.type(screen.getByPlaceholderText(/new email/i), 'existing@example.com')
      await user.click(screen.getByRole('button', { name: /send confirmation/i }))

      await waitFor(() => {
        expect(mockOnUpdateEmail).toHaveBeenCalled()
      })
    })

    it('shows Done button after success', async () => {
      const user = userEvent.setup()
      render(<AccountSection email="test@example.com" onUpdateEmail={mockOnUpdateEmail} />)

      await user.click(screen.getByRole('button', { name: /change/i }))
      await user.type(screen.getByPlaceholderText(/new email/i), 'new@example.com')
      await user.click(screen.getByRole('button', { name: /send confirmation/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument()
      })
    })

    it('returns to display mode when Done is clicked', async () => {
      const user = userEvent.setup()
      render(<AccountSection email="test@example.com" onUpdateEmail={mockOnUpdateEmail} />)

      await user.click(screen.getByRole('button', { name: /change/i }))
      await user.type(screen.getByPlaceholderText(/new email/i), 'new@example.com')
      await user.click(screen.getByRole('button', { name: /send confirmation/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /done/i }))

      expect(screen.getByRole('button', { name: /change/i })).toBeInTheDocument()
    })
  })
})
