import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithRouter, userEvent } from '@/test/utils/render'
import { OnboardingForm } from './OnboardingForm'

// Mock useStudentProfile
const mockUpdateProfile = vi.fn()
vi.mock('../hooks/useStudentProfile', () => ({
  useStudentProfile: vi.fn(() => ({
    updateProfile: mockUpdateProfile,
  })),
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('OnboardingForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateProfile.mockResolvedValue({ error: null })
  })

  describe('initial state', () => {
    it('renders age group step initially', () => {
      renderWithRouter(<OnboardingForm />, { useMemoryRouter: true })

      expect(screen.getByText("What's your age group?")).toBeInTheDocument()
      expect(screen.getByText('This helps us present concepts in the best way for you')).toBeInTheDocument()
    })

    it('shows Continue button on age group step', () => {
      renderWithRouter(<OnboardingForm />, { useMemoryRouter: true })

      expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
    })

    it('does not show Back button on first step', () => {
      renderWithRouter(<OnboardingForm />, { useMemoryRouter: true })

      expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
    })

    it('shows progress dots for 5 steps', () => {
      renderWithRouter(<OnboardingForm />, { useMemoryRouter: true })

      // Progress dots have h-2 w-2 classes
      const dots = document.querySelectorAll('.h-2.w-2')
      expect(dots.length).toBe(5)
    })
  })

  describe('age group step', () => {
    it('renders age group options', () => {
      renderWithRouter(<OnboardingForm />, { useMemoryRouter: true })

      expect(screen.getByText('Under 13')).toBeInTheDocument()
      expect(screen.getByText('13-17')).toBeInTheDocument()
      expect(screen.getByText('18-25')).toBeInTheDocument()
      expect(screen.getByText('26-35')).toBeInTheDocument()
      expect(screen.getByText('36+')).toBeInTheDocument()
    })

    it('enables Continue when age group selected', async () => {
      const user = userEvent.setup()
      renderWithRouter(<OnboardingForm />, { useMemoryRouter: true })

      // Continue should be disabled initially
      expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()

      // Select an age group
      await user.click(screen.getByText('18-25'))

      expect(screen.getByRole('button', { name: 'Continue' })).not.toBeDisabled()
    })

    it('advances to avatar step when Continue clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter(<OnboardingForm />, { useMemoryRouter: true })

      await user.click(screen.getByText('18-25'))
      await user.click(screen.getByRole('button', { name: 'Continue' }))

      expect(screen.getByText('Choose your avatar')).toBeInTheDocument()
    })
  })

  describe('step navigation', () => {
    it('shows Back button on avatar step', async () => {
      const user = userEvent.setup()
      renderWithRouter(<OnboardingForm />, { useMemoryRouter: true })

      await user.click(screen.getByText('18-25'))
      await user.click(screen.getByRole('button', { name: 'Continue' }))

      expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument()
    })

    it('goes back to age group step when Back clicked on avatar step', async () => {
      const user = userEvent.setup()
      renderWithRouter(<OnboardingForm />, { useMemoryRouter: true })

      await user.click(screen.getByText('18-25'))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      await user.click(screen.getByRole('button', { name: 'Back' }))

      expect(screen.getByText("What's your age group?")).toBeInTheDocument()
    })

    it('advances through all steps', async () => {
      const user = userEvent.setup()
      renderWithRouter(<OnboardingForm />, { useMemoryRouter: true })

      // Age group -> Avatar
      await user.click(screen.getByText('18-25'))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      expect(screen.getByText('Choose your avatar')).toBeInTheDocument()

      // Avatar -> Goal
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      expect(screen.getByText("What's your goal?")).toBeInTheDocument()

      // Goal -> Experience
      await user.click(screen.getByText('Build websites'))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      expect(screen.getByText("What's your experience level?")).toBeInTheDocument()

      // Experience -> Style
      await user.click(screen.getByText('Complete beginner'))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      expect(screen.getByText('How do you learn best?')).toBeInTheDocument()
    })
  })

  describe('goal step', () => {
    it('renders goal options', async () => {
      const user = userEvent.setup()
      renderWithRouter(<OnboardingForm />, { useMemoryRouter: true })

      // Navigate to goal step
      await user.click(screen.getByText('18-25'))
      await user.click(screen.getByRole('button', { name: 'Continue' })) // age -> avatar
      await user.click(screen.getByRole('button', { name: 'Continue' })) // avatar -> goal

      expect(screen.getByText('Build websites')).toBeInTheDocument()
      expect(screen.getByText('Get a developer job')).toBeInTheDocument()
      expect(screen.getByText('Automate tasks')).toBeInTheDocument()
      expect(screen.getByText('Just for fun')).toBeInTheDocument()
    })
  })

  describe('experience step', () => {
    it('renders experience options', async () => {
      const user = userEvent.setup()
      renderWithRouter(<OnboardingForm />, { useMemoryRouter: true })

      // Navigate to experience step
      await user.click(screen.getByText('18-25'))
      await user.click(screen.getByRole('button', { name: 'Continue' })) // age -> avatar
      await user.click(screen.getByRole('button', { name: 'Continue' })) // avatar -> goal
      await user.click(screen.getByText('Build websites'))
      await user.click(screen.getByRole('button', { name: 'Continue' })) // goal -> experience

      expect(screen.getByText("What's your experience level?")).toBeInTheDocument()
      expect(screen.getByText('Complete beginner')).toBeInTheDocument()
      expect(screen.getByText('Some experience')).toBeInTheDocument()
      expect(screen.getByText('Know another language')).toBeInTheDocument()
    })
  })

  describe('style step', () => {
    it('renders style options and submit button', async () => {
      const user = userEvent.setup()
      renderWithRouter(<OnboardingForm />, { useMemoryRouter: true })

      // Navigate to style step
      await user.click(screen.getByText('18-25'))
      await user.click(screen.getByRole('button', { name: 'Continue' })) // age -> avatar
      await user.click(screen.getByRole('button', { name: 'Continue' })) // avatar -> goal
      await user.click(screen.getByText('Build websites'))
      await user.click(screen.getByRole('button', { name: 'Continue' })) // goal -> experience
      await user.click(screen.getByText('Complete beginner'))
      await user.click(screen.getByRole('button', { name: 'Continue' })) // experience -> style

      expect(screen.getByText('How do you learn best?')).toBeInTheDocument()
      expect(screen.getByText('Show me examples')).toBeInTheDocument()
      expect(screen.getByText('Use analogies')).toBeInTheDocument()
      expect(screen.getByText('Explain the theory')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Start Learning' })).toBeInTheDocument()
    })
  })

  describe('form submission', () => {
    it('calls updateProfile with correct data including age_group', async () => {
      const user = userEvent.setup()
      renderWithRouter(<OnboardingForm />, { useMemoryRouter: true })

      // Complete all steps
      await user.click(screen.getByText('18-25'))
      await user.click(screen.getByRole('button', { name: 'Continue' })) // age -> avatar
      await user.click(screen.getByRole('button', { name: 'Continue' })) // avatar (default emoji)
      await user.click(screen.getByText('Get a developer job'))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      await user.click(screen.getByText('Some experience'))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      await user.click(screen.getByText('Use analogies'))
      await user.click(screen.getByRole('button', { name: 'Start Learning' }))

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({
          age_group: '18-25',
          avatar_emoji: '😊', // default
          learning_goal: 'get_job',
          prior_experience: 'some',
          preferred_style: 'analogies',
          current_skill_level: 'beginner',
        })
      })
    })

    it('sets skill level to intermediate for experienced users', async () => {
      const user = userEvent.setup()
      renderWithRouter(<OnboardingForm />, { useMemoryRouter: true })

      // Complete all steps with "other_language" experience
      await user.click(screen.getByText('26-35'))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      await user.click(screen.getByText('Build websites'))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      await user.click(screen.getByText('Know another language'))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      await user.click(screen.getByRole('button', { name: 'Start Learning' }))

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            age_group: '26-35',
            prior_experience: 'other_language',
            current_skill_level: 'intermediate',
          })
        )
      })
    })

    it('navigates to /learn on successful submission', async () => {
      const user = userEvent.setup()
      renderWithRouter(<OnboardingForm />, { useMemoryRouter: true })

      // Complete all steps quickly
      await user.click(screen.getByText('13-17'))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      await user.click(screen.getByText('Just for fun'))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      await user.click(screen.getByText('Complete beginner'))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      await user.click(screen.getByRole('button', { name: 'Start Learning' }))

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/learn')
      })
    })
  })

  describe('error handling', () => {
    it('displays server error message', async () => {
      mockUpdateProfile.mockResolvedValue({ error: 'Failed to save profile' })

      const user = userEvent.setup()
      renderWithRouter(<OnboardingForm />, { useMemoryRouter: true })

      // Complete all steps
      await user.click(screen.getByText('18-25'))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      await user.click(screen.getByText('Build websites'))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      await user.click(screen.getByText('Complete beginner'))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      await user.click(screen.getByRole('button', { name: 'Start Learning' }))

      await waitFor(() => {
        expect(screen.getByText('Failed to save profile')).toBeInTheDocument()
      })
    })

    it('does not navigate on error', async () => {
      mockUpdateProfile.mockResolvedValue({ error: 'Server error' })

      const user = userEvent.setup()
      renderWithRouter(<OnboardingForm />, { useMemoryRouter: true })

      // Complete all steps
      await user.click(screen.getByText('18-25'))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      await user.click(screen.getByText('Build websites'))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      await user.click(screen.getByText('Complete beginner'))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      await user.click(screen.getByRole('button', { name: 'Start Learning' }))

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument()
      })

      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('submitting state', () => {
    it('shows "Saving..." while submitting', async () => {
      // Make updateProfile hang
      mockUpdateProfile.mockImplementation(() => new Promise(() => {}))

      const user = userEvent.setup()
      renderWithRouter(<OnboardingForm />, { useMemoryRouter: true })

      // Complete all steps
      await user.click(screen.getByText('18-25'))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      await user.click(screen.getByText('Build websites'))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      await user.click(screen.getByText('Complete beginner'))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      await user.click(screen.getByRole('button', { name: 'Start Learning' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Saving...' })).toBeInTheDocument()
      })
    })

    it('disables buttons while submitting', async () => {
      mockUpdateProfile.mockImplementation(() => new Promise(() => {}))

      const user = userEvent.setup()
      renderWithRouter(<OnboardingForm />, { useMemoryRouter: true })

      // Complete all steps
      await user.click(screen.getByText('18-25'))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      await user.click(screen.getByText('Build websites'))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      await user.click(screen.getByText('Complete beginner'))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      await user.click(screen.getByRole('button', { name: 'Start Learning' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
        expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled()
      })
    })
  })
})
