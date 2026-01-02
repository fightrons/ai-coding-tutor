import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useAuth } from './useAuth'

// Mock Supabase client
const mockUnsubscribe = vi.fn()
const mockOnAuthStateChange = vi.fn(() => ({
  data: { subscription: { unsubscribe: mockUnsubscribe } },
}))
const mockGetSession = vi.fn()
const mockSignUp = vi.fn()
const mockSignInWithPassword = vi.fn()
const mockSignOut = vi.fn()
const mockUpdateUser = vi.fn()

vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
        mockOnAuthStateChange()
        // Store callback for triggering state changes in tests
        ;(global as Record<string, unknown>).__authCallback = callback
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
      },
      signUp: (params: { email: string; password: string }) => mockSignUp(params),
      signInWithPassword: (params: { email: string; password: string }) =>
        mockSignInWithPassword(params),
      signOut: () => mockSignOut(),
      updateUser: (params: { password?: string; email?: string }) => mockUpdateUser(params),
    },
  },
}))

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete (global as Record<string, unknown>).__authCallback
  })

  describe('initial state', () => {
    it('should start with loading true and user null', async () => {
      // Arrange
      mockGetSession.mockResolvedValue({ data: { session: null } })

      // Act
      const { result } = renderHook(() => useAuth())

      // Assert
      expect(result.current.loading).toBe(true)
      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()

      // Wait for async session fetch to complete to avoid act() warning
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('should load session and set user on mount', async () => {
      // Arrange
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      const mockSession = { user: mockUser, access_token: 'token' }
      mockGetSession.mockResolvedValue({ data: { session: mockSession } })

      // Act
      const { result } = renderHook(() => useAuth())

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.session).toEqual(mockSession)
    })

    it('should set loading false with null user when no session exists', async () => {
      // Arrange
      mockGetSession.mockResolvedValue({ data: { session: null } })

      // Act
      const { result } = renderHook(() => useAuth())

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
    })
  })

  describe('auth state changes', () => {
    it('should update state when auth state changes', async () => {
      // Arrange
      mockGetSession.mockResolvedValue({ data: { session: null } })
      const { result } = renderHook(() => useAuth())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const newUser = { id: 'user-2', email: 'new@example.com' }
      const newSession = { user: newUser, access_token: 'new-token' }

      // Act
      act(() => {
        const callback = (global as unknown as Record<string, (e: string, s: unknown) => void>).__authCallback
        callback('SIGNED_IN', newSession)
      })

      // Assert
      expect(result.current.user).toEqual(newUser)
      expect(result.current.session).toEqual(newSession)
    })

    it('should unsubscribe from auth changes on unmount', async () => {
      // Arrange
      mockGetSession.mockResolvedValue({ data: { session: null } })

      // Act
      const { unmount } = renderHook(() => useAuth())
      unmount()

      // Assert
      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })

  describe('signUp', () => {
    it('should return data on successful signup', async () => {
      // Arrange
      mockGetSession.mockResolvedValue({ data: { session: null } })
      const mockData = { user: { id: 'new-user' }, session: null }
      mockSignUp.mockResolvedValue({ data: mockData, error: null })

      const { result } = renderHook(() => useAuth())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Act
      const response = await result.current.signUp('test@example.com', 'password123')

      // Assert
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(response.data).toEqual(mockData)
      expect(response.error).toBeNull()
    })

    it('should return error on failed signup', async () => {
      // Arrange
      mockGetSession.mockResolvedValue({ data: { session: null } })
      const mockError = { message: 'Email already exists' }
      mockSignUp.mockResolvedValue({ data: null, error: mockError })

      const { result } = renderHook(() => useAuth())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Act
      const response = await result.current.signUp('existing@example.com', 'password123')

      // Assert
      expect(response.error).toEqual(mockError)
    })
  })

  describe('signIn', () => {
    it('should return no error on successful sign in', async () => {
      // Arrange
      mockGetSession.mockResolvedValue({ data: { session: null } })
      mockSignInWithPassword.mockResolvedValue({ error: null })

      const { result } = renderHook(() => useAuth())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Act
      const response = await result.current.signIn('test@example.com', 'password123')

      // Assert
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(response.error).toBeNull()
    })

    it('should return error on invalid credentials', async () => {
      // Arrange
      mockGetSession.mockResolvedValue({ data: { session: null } })
      const mockError = { message: 'Invalid login credentials' }
      mockSignInWithPassword.mockResolvedValue({ error: mockError })

      const { result } = renderHook(() => useAuth())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Act
      const response = await result.current.signIn('wrong@example.com', 'wrongpassword')

      // Assert
      expect(response.error).toEqual(mockError)
    })
  })

  describe('signOut', () => {
    it('should return no error on successful sign out', async () => {
      // Arrange
      const mockUser = { id: 'user-1' }
      const mockSession = { user: mockUser }
      mockGetSession.mockResolvedValue({ data: { session: mockSession } })
      mockSignOut.mockResolvedValue({ error: null })

      const { result } = renderHook(() => useAuth())
      await waitFor(() => {
        expect(result.current.user).toBeTruthy()
      })

      // Act
      const response = await result.current.signOut()

      // Assert
      expect(mockSignOut).toHaveBeenCalled()
      expect(response.error).toBeNull()
    })

    it('should return error on failed sign out', async () => {
      // Arrange
      mockGetSession.mockResolvedValue({ data: { session: null } })
      const mockError = { message: 'Sign out failed' }
      mockSignOut.mockResolvedValue({ error: mockError })

      const { result } = renderHook(() => useAuth())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Act
      const response = await result.current.signOut()

      // Assert
      expect(response.error).toEqual(mockError)
    })
  })

  describe('updatePassword', () => {
    it('should return no error on successful password update', async () => {
      // Arrange
      mockGetSession.mockResolvedValue({ data: { session: null } })
      mockUpdateUser.mockResolvedValue({ error: null })

      const { result } = renderHook(() => useAuth())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Act
      const response = await result.current.updatePassword('newPassword123')

      // Assert
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newPassword123' })
      expect(response.error).toBeNull()
    })

    it('should return error on failed password update', async () => {
      // Arrange
      mockGetSession.mockResolvedValue({ data: { session: null } })
      const mockError = { message: 'Password too weak' }
      mockUpdateUser.mockResolvedValue({ error: mockError })

      const { result } = renderHook(() => useAuth())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Act
      const response = await result.current.updatePassword('weak')

      // Assert
      expect(response.error).toEqual(mockError)
    })
  })

  describe('updateEmail', () => {
    it('should return no error on successful email update', async () => {
      // Arrange
      mockGetSession.mockResolvedValue({ data: { session: null } })
      mockUpdateUser.mockResolvedValue({ error: null })

      const { result } = renderHook(() => useAuth())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Act
      const response = await result.current.updateEmail('newemail@example.com')

      // Assert
      expect(mockUpdateUser).toHaveBeenCalledWith({ email: 'newemail@example.com' })
      expect(response.error).toBeNull()
    })

    it('should return error on failed email update', async () => {
      // Arrange
      mockGetSession.mockResolvedValue({ data: { session: null } })
      const mockError = { message: 'Email already in use' }
      mockUpdateUser.mockResolvedValue({ error: mockError })

      const { result } = renderHook(() => useAuth())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Act
      const response = await result.current.updateEmail('existing@example.com')

      // Assert
      expect(response.error).toEqual(mockError)
    })
  })
})
