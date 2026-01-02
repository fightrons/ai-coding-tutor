import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileSection } from './ProfileSection'

const mockProfile = {
  id: 'profile-1',
  auth_user_id: 'user-1',
  display_name: 'Test User',
  avatar_emoji: '🦊',
  learning_goal: 'build_websites',
  prior_experience: 'some' as const,
  preferred_style: 'examples' as const,
  current_skill_level: 'beginner' as const,
  access_code: null,
  age_group: null,
  created_at: new Date().toISOString(),
  last_active_at: null,
  updated_at: null,
}

describe('ProfileSection', () => {
  const mockOnUpdate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mockOnUpdate.mockResolvedValue({ error: null })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('display mode', () => {
    it('renders avatar', () => {
      render(<ProfileSection profile={mockProfile} isRegistered={true} onUpdate={mockOnUpdate} />)

      expect(screen.getByText('🦊')).toBeInTheDocument()
    })

    it('renders display name for registered users', () => {
      render(<ProfileSection profile={mockProfile} isRegistered={true} onUpdate={mockOnUpdate} />)

      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    it('shows card title and description', () => {
      render(<ProfileSection profile={mockProfile} isRegistered={true} onUpdate={mockOnUpdate} />)

      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.getByText('Your avatar and display name')).toBeInTheDocument()
    })

    it('does not show display name section for non-registered users', () => {
      render(<ProfileSection profile={mockProfile} isRegistered={false} onUpdate={mockOnUpdate} />)

      // Should only have the avatar Change button, not an Edit button for display name
      const buttons = screen.getAllByRole('button', { name: /change/i })
      expect(buttons.length).toBe(1)
    })

    it('shows "Not set" when display name is null', () => {
      const profileWithoutName = { ...mockProfile, display_name: null }
      render(<ProfileSection profile={profileWithoutName} isRegistered={true} onUpdate={mockOnUpdate} />)

      expect(screen.getByText('Not set')).toBeInTheDocument()
    })
  })

  describe('avatar editing', () => {
    it('shows avatar picker when Change is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<ProfileSection profile={mockProfile} isRegistered={true} onUpdate={mockOnUpdate} />)

      await user.click(screen.getAllByRole('button', { name: /change/i })[0])

      // AvatarPicker should be visible with Cancel button
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('cancels avatar editing when Cancel is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<ProfileSection profile={mockProfile} isRegistered={true} onUpdate={mockOnUpdate} />)

      await user.click(screen.getAllByRole('button', { name: /change/i })[0])
      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument()
    })
  })

  describe('display name editing', () => {
    it('shows form when Edit is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<ProfileSection profile={mockProfile} isRegistered={true} onUpdate={mockOnUpdate} />)

      await user.click(screen.getByRole('button', { name: /edit/i }))

      expect(screen.getByPlaceholderText(/your name/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    })

    it('pre-fills the form with current display name', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<ProfileSection profile={mockProfile} isRegistered={true} onUpdate={mockOnUpdate} />)

      await user.click(screen.getByRole('button', { name: /edit/i }))

      expect(screen.getByPlaceholderText(/your name/i)).toHaveValue('Test User')
    })

    it('cancels name editing when Cancel is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<ProfileSection profile={mockProfile} isRegistered={true} onUpdate={mockOnUpdate} />)

      await user.click(screen.getByRole('button', { name: /edit/i }))
      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(screen.queryByPlaceholderText(/your name/i)).not.toBeInTheDocument()
    })

    it('calls onUpdate with new display name', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<ProfileSection profile={mockProfile} isRegistered={true} onUpdate={mockOnUpdate} />)

      await user.click(screen.getByRole('button', { name: /edit/i }))
      await user.clear(screen.getByPlaceholderText(/your name/i))
      await user.type(screen.getByPlaceholderText(/your name/i), 'New Name')
      await user.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith({ display_name: 'New Name' })
      })
    })

    it('shows success message on successful update', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<ProfileSection profile={mockProfile} isRegistered={true} onUpdate={mockOnUpdate} />)

      await user.click(screen.getByRole('button', { name: /edit/i }))
      await user.clear(screen.getByPlaceholderText(/your name/i))
      await user.type(screen.getByPlaceholderText(/your name/i), 'New Name')
      await user.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() => {
        expect(screen.getByText(/name updated/i)).toBeInTheDocument()
      })
    })

    it('auto-closes edit mode after success', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<ProfileSection profile={mockProfile} isRegistered={true} onUpdate={mockOnUpdate} />)

      await user.click(screen.getByRole('button', { name: /edit/i }))
      await user.clear(screen.getByPlaceholderText(/your name/i))
      await user.type(screen.getByPlaceholderText(/your name/i), 'New Name')
      await user.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() => {
        expect(screen.getByText(/name updated/i)).toBeInTheDocument()
      })

      await act(async () => {
        vi.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
      })
    })

    it('handles update error', async () => {
      mockOnUpdate.mockResolvedValue({ error: 'Update failed' })
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<ProfileSection profile={mockProfile} isRegistered={true} onUpdate={mockOnUpdate} />)

      await user.click(screen.getByRole('button', { name: /edit/i }))
      await user.clear(screen.getByPlaceholderText(/your name/i))
      await user.type(screen.getByPlaceholderText(/your name/i), 'New Name')
      await user.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled()
      })

      // Should stay in edit mode on error
      expect(screen.getByPlaceholderText(/your name/i)).toBeInTheDocument()
    })
  })
})
