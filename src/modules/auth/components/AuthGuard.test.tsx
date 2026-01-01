import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithRouter } from '@/test/utils/render'
import { AuthGuard } from './AuthGuard'

// Mock useIdentity hook
vi.mock('../hooks/useIdentity', () => ({
  useIdentity: vi.fn(),
}))

import { useIdentity } from '../hooks/useIdentity'

const mockUseIdentity = useIdentity as ReturnType<typeof vi.fn>

// Mock react-router-dom Navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Navigate: ({ to, state, replace }: { to: string; state?: unknown; replace?: boolean }) => {
      mockNavigate({ to, state, replace })
      return null
    },
    useLocation: () => ({ pathname: '/learn', search: '', hash: '', state: null, key: 'default' }),
  }
})

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading state', () => {
    it('shows loading skeleton when loading', () => {
      mockUseIdentity.mockReturnValue({
        isAuthenticated: false,
        loading: true,
      })

      renderWithRouter(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>,
        { useMemoryRouter: true }
      )

      // Should show skeleton elements, not the protected content
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()

      // Check for the loading container with skeleton styling
      // The Skeleton component renders with animate-pulse class
      const loadingContainer = document.querySelector('.min-h-screen')
      expect(loadingContainer).toBeInTheDocument()
    })
  })

  describe('unauthenticated state', () => {
    it('redirects to "/" when not authenticated', () => {
      mockUseIdentity.mockReturnValue({
        isAuthenticated: false,
        loading: false,
      })

      renderWithRouter(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>,
        { useMemoryRouter: true }
      )

      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/',
        state: expect.objectContaining({ from: expect.any(Object) }),
        replace: true,
      })
    })

    it('does not render children when not authenticated', () => {
      mockUseIdentity.mockReturnValue({
        isAuthenticated: false,
        loading: false,
      })

      renderWithRouter(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>,
        { useMemoryRouter: true }
      )

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })
  })

  describe('authenticated state', () => {
    it('renders children when authenticated', () => {
      mockUseIdentity.mockReturnValue({
        isAuthenticated: true,
        loading: false,
      })

      renderWithRouter(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>,
        { useMemoryRouter: true }
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    it('does not redirect when authenticated', () => {
      mockUseIdentity.mockReturnValue({
        isAuthenticated: true,
        loading: false,
      })

      renderWithRouter(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>,
        { useMemoryRouter: true }
      )

      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('renders nested children correctly', () => {
      mockUseIdentity.mockReturnValue({
        isAuthenticated: true,
        loading: false,
      })

      renderWithRouter(
        <AuthGuard>
          <div>
            <h1>Title</h1>
            <p>Description</p>
          </div>
        </AuthGuard>,
        { useMemoryRouter: true }
      )

      expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
    })
  })

  describe('transition from loading to authenticated', () => {
    it('shows children after loading completes with authentication', () => {
      // Start loading
      mockUseIdentity.mockReturnValue({
        isAuthenticated: false,
        loading: true,
      })

      const { rerender } = renderWithRouter(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>,
        { useMemoryRouter: true }
      )

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()

      // Finish loading, authenticated
      mockUseIdentity.mockReturnValue({
        isAuthenticated: true,
        loading: false,
      })

      rerender(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })
})
