import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PreferencesSection } from './PreferencesSection'

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

describe('PreferencesSection', () => {
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
    it('renders current preferences', () => {
      render(<PreferencesSection profile={mockProfile} onUpdate={mockOnUpdate} />)

      expect(screen.getByText('Build websites')).toBeInTheDocument()
      expect(screen.getByText('Some experience')).toBeInTheDocument()
      expect(screen.getByText('Show me examples')).toBeInTheDocument()
    })

    it('shows card title and description', () => {
      render(<PreferencesSection profile={mockProfile} onUpdate={mockOnUpdate} />)

      expect(screen.getByText('Learning Preferences')).toBeInTheDocument()
      expect(screen.getByText('Your learning style and goals')).toBeInTheDocument()
    })

    it('shows Edit Preferences button', () => {
      render(<PreferencesSection profile={mockProfile} onUpdate={mockOnUpdate} />)

      expect(screen.getByRole('button', { name: /edit preferences/i })).toBeInTheDocument()
    })

    it('shows "Not set" for null preferences', () => {
      const profileWithoutPrefs = {
        ...mockProfile,
        learning_goal: null,
        prior_experience: null,
        preferred_style: null,
      }
      render(<PreferencesSection profile={profileWithoutPrefs} onUpdate={mockOnUpdate} />)

      const notSetElements = screen.getAllByText('Not set')
      expect(notSetElements.length).toBe(3)
    })
  })

  describe('edit mode', () => {
    it('shows form when Edit Preferences is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<PreferencesSection profile={mockProfile} onUpdate={mockOnUpdate} />)

      await user.click(screen.getByRole('button', { name: /edit preferences/i }))

      expect(screen.getByText("What's your goal?")).toBeInTheDocument()
      expect(screen.getByText("What's your experience level?")).toBeInTheDocument()
      expect(screen.getByText('How do you learn best?')).toBeInTheDocument()
    })

    it('pre-selects current preferences', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<PreferencesSection profile={mockProfile} onUpdate={mockOnUpdate} />)

      await user.click(screen.getByRole('button', { name: /edit preferences/i }))

      const goalRadio = screen.getByRole('radio', { name: /build websites/i })
      expect(goalRadio).toBeChecked()
    })

    it('cancels editing when Cancel is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<PreferencesSection profile={mockProfile} onUpdate={mockOnUpdate} />)

      await user.click(screen.getByRole('button', { name: /edit preferences/i }))
      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(screen.getByRole('button', { name: /edit preferences/i })).toBeInTheDocument()
    })

    it('disables Save button until all options are selected', async () => {
      const profileWithoutPrefs = {
        ...mockProfile,
        learning_goal: null,
        prior_experience: null,
        preferred_style: null,
      }
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<PreferencesSection profile={profileWithoutPrefs} onUpdate={mockOnUpdate} />)

      await user.click(screen.getByRole('button', { name: /edit preferences/i }))

      expect(screen.getByRole('button', { name: /^save$/i })).toBeDisabled()
    })
  })

  describe('form submission', () => {
    it('calls onUpdate with new preferences', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<PreferencesSection profile={mockProfile} onUpdate={mockOnUpdate} />)

      await user.click(screen.getByRole('button', { name: /edit preferences/i }))

      // Change goal
      await user.click(screen.getByRole('radio', { name: /get a developer job/i }))

      await user.click(screen.getByRole('button', { name: /^save$/i }))

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith({
          learning_goal: 'get_job',
          prior_experience: 'some',
          preferred_style: 'examples',
          current_skill_level: 'beginner',
        })
      })
    })

    it('sets skill level to intermediate for other_language experience', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<PreferencesSection profile={mockProfile} onUpdate={mockOnUpdate} />)

      await user.click(screen.getByRole('button', { name: /edit preferences/i }))

      // Change experience to "know another language"
      await user.click(screen.getByRole('radio', { name: /know another language/i }))

      await user.click(screen.getByRole('button', { name: /^save$/i }))

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            current_skill_level: 'intermediate',
          })
        )
      })
    })

    it('shows success message on successful update', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<PreferencesSection profile={mockProfile} onUpdate={mockOnUpdate} />)

      await user.click(screen.getByRole('button', { name: /edit preferences/i }))
      await user.click(screen.getByRole('button', { name: /^save$/i }))

      await waitFor(() => {
        expect(screen.getByText(/preferences updated/i)).toBeInTheDocument()
      })
    })

    it('auto-closes edit mode after success', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<PreferencesSection profile={mockProfile} onUpdate={mockOnUpdate} />)

      await user.click(screen.getByRole('button', { name: /edit preferences/i }))
      await user.click(screen.getByRole('button', { name: /^save$/i }))

      await waitFor(() => {
        expect(screen.getByText(/preferences updated/i)).toBeInTheDocument()
      })

      vi.advanceTimersByTime(2000)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit preferences/i })).toBeInTheDocument()
      })
    })
  })
})
