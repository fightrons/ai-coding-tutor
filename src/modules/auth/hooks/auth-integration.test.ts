/**
 * Integration tests for auth hooks working together.
 *
 * Unlike unit tests that mock each hook individually, these tests
 * mock only Supabase and verify the hooks integrate correctly.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

// Use vi.hoisted to define mocks that can be referenced in vi.mock
const { mockSupabaseAuth, mockSupabaseFrom } = vi.hoisted(() => ({
  mockSupabaseAuth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  },
  mockSupabaseFrom: vi.fn(),
}))

vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    auth: mockSupabaseAuth,
    from: mockSupabaseFrom,
  },
}))

// Import hooks after mocking
import { useIdentity } from './useIdentity'
import { useAccessCode } from './useAccessCode'

describe('Auth Integration', () => {
  let authStateCallback: ((event: string, session: unknown) => void) | null = null
  let localStorageMock: Record<string, string> = {}

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock = {}
    authStateCallback = null

    // Mock localStorage
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
      (key: string) => localStorageMock[key] ?? null
    )
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
      (key: string, value: string) => {
        localStorageMock[key] = value
      }
    )
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(
      (key: string) => {
        delete localStorageMock[key]
      }
    )

    // Default: no session
    mockSupabaseAuth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    // Capture auth state change callback
    mockSupabaseAuth.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback
      return {
        data: {
          subscription: { unsubscribe: vi.fn() },
        },
      }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Code-Based Access Flow', () => {
    it('should create profile and update identity to code_based', async () => {
      // Arrange
      const mockProfile = {
        id: 'test-uuid-123',
        access_code: 'SWIFT-BEAR-73',
        display_name: 'Swift Bear',
        avatar_emoji: '🐻',
        auth_user_id: null,
      }

      mockSupabaseFrom.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })

      // Act - render useAccessCode and create profile
      const { result: accessCodeResult } = renderHook(() => useAccessCode())

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(accessCodeResult.current.loading).toBe(false)
      })

      // Create a new profile
      let createResult: { accessCode: string | null; error: string | null }
      await act(async () => {
        createResult = await accessCodeResult.current.createProfile()
      })

      // Assert - profile created successfully
      expect(createResult!.error).toBeNull()
      expect(createResult!.accessCode).toBeTruthy()

      // Assert - localStorage was updated
      expect(localStorageMock['tutor_access_code']).toBeTruthy()

      // Assert - hook state updated
      expect(accessCodeResult.current.profile).toBeTruthy()
      expect(accessCodeResult.current.hasAccessCode).toBe(true)
    })

    it('should restore identity from localStorage on page reload', async () => {
      // Arrange - simulate existing access code in localStorage
      const storedCode = 'BRAVE-WOLF-42'
      const mockProfile = {
        id: 'existing-profile-id',
        access_code: storedCode,
        display_name: 'Brave Wolf',
        avatar_emoji: '🐺',
        auth_user_id: null,
      }

      localStorageMock['tutor_access_code'] = storedCode

      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })

      // Act - render useIdentity (simulates page load)
      const { result } = renderHook(() => useIdentity())

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Assert - identity restored from localStorage
      expect(result.current.type).toBe('code_based')
      expect(result.current.profileId).toBe('existing-profile-id')
      expect(result.current.displayName).toBe('Brave Wolf')
      expect(result.current.accessCode).toBe(storedCode)
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should clear invalid access code from localStorage', async () => {
      // Arrange - invalid code in localStorage
      localStorageMock['tutor_access_code'] = 'INVALID-CODE-99'

      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found', code: 'PGRST116' },
            }),
          }),
        }),
      })

      // Act
      const { result } = renderHook(() => useAccessCode())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Assert - invalid code cleared
      expect(result.current.accessCode).toBeNull()
      expect(result.current.profile).toBeNull()
      expect(localStorageMock['tutor_access_code']).toBeUndefined()
    })

    it('should validate and load profile from entered code', async () => {
      // Arrange
      const enteredCode = 'QUICK-FOX-88'
      const mockProfile = {
        id: 'validated-profile-id',
        access_code: enteredCode,
        display_name: 'Quick Fox',
        avatar_emoji: '🦊',
        auth_user_id: null,
      }

      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })

      // Act
      const { result } = renderHook(() => useAccessCode())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let isValid: boolean
      await act(async () => {
        isValid = await result.current.validateCode(enteredCode)
      })

      // Assert
      expect(isValid!).toBe(true)
      expect(result.current.accessCode).toBe(enteredCode)
      expect(result.current.profile?.display_name).toBe('Quick Fox')
      expect(localStorageMock['tutor_access_code']).toBe(enteredCode)
    })
  })

  describe('Identity Priority', () => {
    it('should return anonymous when no auth and no access code', async () => {
      // Arrange - no localStorage, no session
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      })

      // Act
      const { result } = renderHook(() => useIdentity())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Assert
      expect(result.current.type).toBe('anonymous')
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.profileId).toBeNull()
    })
  })

  describe('Access Code Lifecycle', () => {
    it('should clear access code when clearAccessCode is called', async () => {
      // Arrange - start with a valid code
      const storedCode = 'CLEAR-TEST-11'
      localStorageMock['tutor_access_code'] = storedCode

      const mockProfile = {
        id: 'profile-to-clear',
        access_code: storedCode,
        display_name: 'Test User',
        avatar_emoji: '🧪',
        auth_user_id: null,
      }

      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })

      // Act
      const { result } = renderHook(() => useAccessCode())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.accessCode).toBe(storedCode)
      })

      // Clear the access code
      act(() => {
        result.current.clearAccessCode()
      })

      // Assert
      expect(result.current.accessCode).toBeNull()
      expect(result.current.profile).toBeNull()
      expect(localStorageMock['tutor_access_code']).toBeUndefined()
    })
  })
})
