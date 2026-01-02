import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OnboardingGuard } from './OnboardingGuard'

// Mock react-router-dom Navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  Navigate: ({ to, replace }: { to: string; replace?: boolean }) => {
    mockNavigate(to, replace)
    return <div data-testid="navigate">Redirecting to {to}</div>
  },
}))

// Mock hooks
const mockUseIdentity = vi.fn()
const mockUseStudentProfile = vi.fn()

vi.mock('../hooks/useIdentity', () => ({
  useIdentity: () => mockUseIdentity(),
}))

vi.mock('../hooks/useStudentProfile', () => ({
  useStudentProfile: () => mockUseStudentProfile(),
}))

describe('OnboardingGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseIdentity.mockReturnValue({ type: 'registered', loading: false })
    mockUseStudentProfile.mockReturnValue({ isOnboardingComplete: true, loading: false })
  })

  describe('loading state', () => {
    it('shows loading skeleton when identity is loading', () => {
      mockUseIdentity.mockReturnValue({ type: null, loading: true })
      mockUseStudentProfile.mockReturnValue({ isOnboardingComplete: false, loading: false })

      render(
        <OnboardingGuard>
          <div>Protected Content</div>
        </OnboardingGuard>
      )

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
      // Skeleton is rendered via className
    })

    it('shows loading skeleton when profile is loading for registered user', () => {
      mockUseIdentity.mockReturnValue({ type: 'registered', loading: false })
      mockUseStudentProfile.mockReturnValue({ isOnboardingComplete: false, loading: true })

      render(
        <OnboardingGuard>
          <div>Protected Content</div>
        </OnboardingGuard>
      )

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('does not wait for profile loading for code_based users', () => {
      mockUseIdentity.mockReturnValue({ type: 'code_based', loading: false })
      mockUseStudentProfile.mockReturnValue({ isOnboardingComplete: false, loading: true })

      render(
        <OnboardingGuard>
          <div>Protected Content</div>
        </OnboardingGuard>
      )

      // Code-based users skip onboarding, so content should render
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  describe('code-based users', () => {
    it('renders children directly for code_based users', () => {
      mockUseIdentity.mockReturnValue({ type: 'code_based', loading: false })
      mockUseStudentProfile.mockReturnValue({ isOnboardingComplete: false, loading: false })

      render(
        <OnboardingGuard>
          <div>Protected Content</div>
        </OnboardingGuard>
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    it('does not redirect code_based users regardless of onboarding status', () => {
      mockUseIdentity.mockReturnValue({ type: 'code_based', loading: false })
      mockUseStudentProfile.mockReturnValue({ isOnboardingComplete: false, loading: false })

      render(
        <OnboardingGuard>
          <div>Protected Content</div>
        </OnboardingGuard>
      )

      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument()
    })
  })

  describe('registered users', () => {
    it('redirects to /onboarding when onboarding is incomplete', () => {
      mockUseIdentity.mockReturnValue({ type: 'registered', loading: false })
      mockUseStudentProfile.mockReturnValue({ isOnboardingComplete: false, loading: false })

      render(
        <OnboardingGuard>
          <div>Protected Content</div>
        </OnboardingGuard>
      )

      expect(screen.getByTestId('navigate')).toBeInTheDocument()
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding', true)
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('renders children when onboarding is complete', () => {
      mockUseIdentity.mockReturnValue({ type: 'registered', loading: false })
      mockUseStudentProfile.mockReturnValue({ isOnboardingComplete: true, loading: false })

      render(
        <OnboardingGuard>
          <div>Protected Content</div>
        </OnboardingGuard>
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('handles anonymous/null type by rendering children', () => {
      mockUseIdentity.mockReturnValue({ type: null, loading: false })
      mockUseStudentProfile.mockReturnValue({ isOnboardingComplete: false, loading: false })

      render(
        <OnboardingGuard>
          <div>Protected Content</div>
        </OnboardingGuard>
      )

      // For null type (anonymous), should render children
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })
})
