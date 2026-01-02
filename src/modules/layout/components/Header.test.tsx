import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Header } from './Header'

// Hoisted mocks
const mockNavigate = vi.hoisted(() => vi.fn())
const mockSignOut = vi.hoisted(() => vi.fn())
const mockClearAccessCode = vi.hoisted(() => vi.fn())
const mockUseIdentity = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/modules/auth', () => ({
  useAuth: () => ({
    signOut: mockSignOut,
  }),
  useAccessCode: () => ({
    clearAccessCode: mockClearAccessCode,
  }),
  useIdentity: () => mockUseIdentity(),
}))

function renderHeader() {
  return render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  )
}

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSignOut.mockResolvedValue({ error: null })
    mockUseIdentity.mockReturnValue({
      type: 'registered',
      displayName: 'Test User',
      avatar: '🦊',
      accessCode: null,
    })
  })

  describe('rendering', () => {
    it('renders logo link', () => {
      renderHeader()

      expect(screen.getByRole('link', { name: /ai coding tutor/i })).toBeInTheDocument()
    })

    it('renders avatar', () => {
      renderHeader()

      expect(screen.getByText('🦊')).toBeInTheDocument()
    })

    it('renders display name for larger screens', () => {
      renderHeader()

      expect(screen.getByText('Test User')).toBeInTheDocument()
    })
  })

  describe('registered user menu', () => {
    it('shows Account Settings link', async () => {
      const user = userEvent.setup()
      renderHeader()

      // Open dropdown
      await user.click(screen.getByText('🦊'))

      expect(screen.getByRole('menuitem', { name: /account settings/i })).toBeInTheDocument()
    })

    it('shows display name in dropdown label', async () => {
      const user = userEvent.setup()
      renderHeader()

      // Open dropdown
      await user.click(screen.getByText('🦊'))

      // Display name appears in dropdown
      const labels = screen.getAllByText('Test User')
      expect(labels.length).toBeGreaterThan(0)
    })

    it('calls signOut and navigates on sign out click', async () => {
      const user = userEvent.setup()
      renderHeader()

      // Open dropdown
      await user.click(screen.getByText('🦊'))

      // Click sign out
      await user.click(screen.getByRole('menuitem', { name: /sign out/i }))

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/')
      })
    })
  })

  describe('code-based user menu', () => {
    beforeEach(() => {
      mockUseIdentity.mockReturnValue({
        type: 'code_based',
        displayName: 'QuickFox123',
        avatar: '🦊',
        accessCode: 'ABC123',
      })
    })

    it('shows access code in dropdown', async () => {
      const user = userEvent.setup()
      renderHeader()

      // Open dropdown
      await user.click(screen.getByText('🦊'))

      expect(screen.getByText(/code: abc123/i)).toBeInTheDocument()
    })

    it('shows register link', async () => {
      const user = userEvent.setup()
      renderHeader()

      // Open dropdown
      await user.click(screen.getByText('🦊'))

      expect(screen.getByRole('menuitem', { name: /register for permanent access/i })).toBeInTheDocument()
    })

    it('shows warning about profile deletion', async () => {
      const user = userEvent.setup()
      renderHeader()

      // Open dropdown
      await user.click(screen.getByText('🦊'))

      expect(screen.getByText(/inactive profiles are deleted/i)).toBeInTheDocument()
    })

    it('calls clearAccessCode and navigates on sign out', async () => {
      const user = userEvent.setup()
      renderHeader()

      // Open dropdown
      await user.click(screen.getByText('🦊'))

      // Click sign out
      await user.click(screen.getByRole('menuitem', { name: /sign out/i }))

      await waitFor(() => {
        expect(mockClearAccessCode).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/')
      })
    })

    it('does not call signOut for code-based users', async () => {
      const user = userEvent.setup()
      renderHeader()

      // Open dropdown
      await user.click(screen.getByText('🦊'))

      // Click sign out
      await user.click(screen.getByRole('menuitem', { name: /sign out/i }))

      await waitFor(() => {
        expect(mockClearAccessCode).toHaveBeenCalled()
      })

      expect(mockSignOut).not.toHaveBeenCalled()
    })
  })

  describe('no display name', () => {
    it('does not render display name when null', () => {
      mockUseIdentity.mockReturnValue({
        type: 'registered',
        displayName: null,
        avatar: '🦊',
        accessCode: null,
      })

      renderHeader()

      // Should not find any elements with text that would be display name
      const spans = document.querySelectorAll('span.text-sm.text-muted-foreground')
      expect(spans.length).toBe(0)
    })
  })
})
