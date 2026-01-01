import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useStudentProfile } from './useStudentProfile'

// Mock useAuth
vi.mock('./useAuth', () => ({
  useAuth: vi.fn(),
}))

// Mock Supabase with chainable API
let mockMaybeSingleResult: ReturnType<typeof vi.fn>
let mockSingleResult: ReturnType<typeof vi.fn>
let mockUpdateResult: ReturnType<typeof vi.fn>

const createMockChain = () => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.select = vi.fn(() => chain)
  chain.update = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.maybeSingle = mockMaybeSingleResult
  chain.single = mockSingleResult
  return chain
}

let mockChain: ReturnType<typeof createMockChain>

vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => mockChain),
  },
}))

import { useAuth } from './useAuth'

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>

describe('useStudentProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Create fresh mocks with default return values
    mockMaybeSingleResult = vi.fn().mockResolvedValue({ data: null, error: null })
    mockSingleResult = vi.fn().mockResolvedValue({ data: null, error: null })
    mockUpdateResult = vi.fn().mockResolvedValue({ error: null })
    mockChain = createMockChain()
  })

  describe('loading state', () => {
    it('returns loading when auth is still loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
      })

      const { result } = renderHook(() => useStudentProfile())

      expect(result.current.loading).toBe(true)
    })

    it('combines auth loading with own loading state', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1' },
        loading: true,
      })

      const { result } = renderHook(() => useStudentProfile())

      // loading = own loading (true) || authLoading (true)
      expect(result.current.loading).toBe(true)
    })
  })

  describe('no user', () => {
    it('returns null profile when no user after auth loads', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      })

      const { result } = renderHook(() => useStudentProfile())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.profile).toBeNull()
      expect(result.current.error).toBeNull()
    })
  })

  describe('profile fetching', () => {
    it('fetches profile when user exists', async () => {
      const mockProfile = {
        id: 'profile-1',
        auth_user_id: 'user-1',
        display_name: 'Test User',
        avatar_emoji: '🦊',
        learning_goal: 'build_websites',
        prior_experience: 'some',
      }

      mockUseAuth.mockReturnValue({
        user: { id: 'user-1' },
        loading: false,
      })
      mockMaybeSingleResult.mockResolvedValue({ data: mockProfile, error: null })

      const { result } = renderHook(() => useStudentProfile())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.profile).toEqual(mockProfile)
      expect(result.current.error).toBeNull()
    })

    it('handles profile fetch error', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1' },
        loading: false,
      })
      mockMaybeSingleResult.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const { result } = renderHook(() => useStudentProfile())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.profile).toBeNull()
      expect(result.current.error).toBe('Database error')
    })

    it('returns null profile when no profile found (needs onboarding)', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1' },
        loading: false,
      })
      mockMaybeSingleResult.mockResolvedValue({ data: null, error: null })

      const { result } = renderHook(() => useStudentProfile())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.profile).toBeNull()
      expect(result.current.error).toBeNull()
    })
  })

  describe('updateProfile', () => {
    it('returns error when not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      })

      const { result } = renderHook(() => useStudentProfile())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const response = await result.current.updateProfile({ display_name: 'New Name' })

      expect(response.error).toBe('Not authenticated')
    })

    it('updates profile successfully', async () => {
      const mockProfile = {
        id: 'profile-1',
        auth_user_id: 'user-1',
        display_name: 'Test User',
        avatar_emoji: '🦊',
        learning_goal: 'build_websites',
        prior_experience: 'some',
      }

      const updatedProfile = {
        ...mockProfile,
        display_name: 'New Name',
      }

      mockUseAuth.mockReturnValue({
        user: { id: 'user-1' },
        loading: false,
      })

      // Initial fetch returns profile, then refetch returns updated
      mockMaybeSingleResult.mockResolvedValueOnce({ data: mockProfile, error: null })
      mockSingleResult.mockResolvedValue({ data: updatedProfile, error: null })

      const { result } = renderHook(() => useStudentProfile())

      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile)
      })

      await act(async () => {
        const response = await result.current.updateProfile({ display_name: 'New Name' })
        expect(response.error).toBeNull()
      })

      await waitFor(() => {
        expect(result.current.profile?.display_name).toBe('New Name')
      })
    })

    it('returns error message on update failure', async () => {
      const mockProfile = {
        id: 'profile-1',
        auth_user_id: 'user-1',
        display_name: 'Test User',
        avatar_emoji: '🦊',
      }

      mockUseAuth.mockReturnValue({
        user: { id: 'user-1' },
        loading: false,
      })

      mockMaybeSingleResult.mockResolvedValueOnce({ data: mockProfile, error: null })

      // For update error, we need eq to return the error directly (update().eq() returns result)
      // But we still need the chain to work for maybeSingle calls
      // Create a new chain that returns error only for the update path
      let eqCallCount = 0
      mockChain.eq = vi.fn(() => {
        eqCallCount++
        // First eq call is for initial fetch (needs to return chain with maybeSingle)
        if (eqCallCount === 1) {
          return { maybeSingle: mockMaybeSingleResult }
        }
        // Second eq call is for update (returns error directly)
        return Promise.resolve({ error: { message: 'Update failed' } })
      })

      const { result } = renderHook(() => useStudentProfile())

      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile)
      })

      const response = await result.current.updateProfile({ display_name: 'New Name' })

      expect(response.error).toBe('Update failed')
    })
  })

  describe('isOnboardingComplete', () => {
    it('returns true when age_group, learning_goal and prior_experience are set', async () => {
      const mockProfile = {
        id: 'profile-1',
        auth_user_id: 'user-1',
        display_name: 'Test User',
        avatar_emoji: '🦊',
        age_group: '18-25',
        learning_goal: 'build_websites',
        prior_experience: 'some',
      }

      mockUseAuth.mockReturnValue({
        user: { id: 'user-1' },
        loading: false,
      })
      mockMaybeSingleResult.mockResolvedValue({ data: mockProfile, error: null })

      const { result } = renderHook(() => useStudentProfile())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.isOnboardingComplete).toBe(true)
    })

    it('returns false when age_group is missing', async () => {
      const mockProfile = {
        id: 'profile-1',
        auth_user_id: 'user-1',
        display_name: 'Test User',
        avatar_emoji: '🦊',
        age_group: null,
        learning_goal: 'build_websites',
        prior_experience: 'some',
      }

      mockUseAuth.mockReturnValue({
        user: { id: 'user-1' },
        loading: false,
      })
      mockMaybeSingleResult.mockResolvedValue({ data: mockProfile, error: null })

      const { result } = renderHook(() => useStudentProfile())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.isOnboardingComplete).toBe(false)
    })

    it('returns false when learning_goal is missing', async () => {
      const mockProfile = {
        id: 'profile-1',
        auth_user_id: 'user-1',
        display_name: 'Test User',
        avatar_emoji: '🦊',
        age_group: '18-25',
        learning_goal: null,
        prior_experience: 'some',
      }

      mockUseAuth.mockReturnValue({
        user: { id: 'user-1' },
        loading: false,
      })
      mockMaybeSingleResult.mockResolvedValue({ data: mockProfile, error: null })

      const { result } = renderHook(() => useStudentProfile())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.isOnboardingComplete).toBe(false)
    })

    it('returns false when prior_experience is missing', async () => {
      const mockProfile = {
        id: 'profile-1',
        auth_user_id: 'user-1',
        display_name: 'Test User',
        avatar_emoji: '🦊',
        age_group: '18-25',
        learning_goal: 'build_websites',
        prior_experience: null,
      }

      mockUseAuth.mockReturnValue({
        user: { id: 'user-1' },
        loading: false,
      })
      mockMaybeSingleResult.mockResolvedValue({ data: mockProfile, error: null })

      const { result } = renderHook(() => useStudentProfile())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.isOnboardingComplete).toBe(false)
    })

    it('returns false when profile is null', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      })

      const { result } = renderHook(() => useStudentProfile())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.isOnboardingComplete).toBe(false)
    })
  })
})
