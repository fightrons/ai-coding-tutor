import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useAccessCode } from './useAccessCode'

// Mock access-code lib
vi.mock('../lib/access-code', () => ({
  generateAccessCode: vi.fn(() => 'SWIFT-BEAR-73'),
  generateDisplayName: vi.fn(() => 'Swift Bear'),
  pickRandomAvatar: vi.fn(() => '🐻'),
  normalizeAccessCode: vi.fn((code: string) => code.toUpperCase()),
  isValidAccessCodeFormat: vi.fn((code: string) => /^[A-Z]+-[A-Z]+-\d{2}$/.test(code)),
}))

// Mock Supabase with chainable API
let mockSingleResult: ReturnType<typeof vi.fn>

const createMockChain = (singleFn: ReturnType<typeof vi.fn>) => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.select = vi.fn(() => chain)
  chain.insert = vi.fn(() => chain)
  chain.update = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.single = singleFn
  return chain
}

let mockChain: ReturnType<typeof createMockChain>

vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => mockChain),
  },
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => 'test-uuid-1234'),
})

import {
  generateAccessCode,
  generateDisplayName,
  pickRandomAvatar,
} from '../lib/access-code'

const mockGenerateAccessCode = generateAccessCode as ReturnType<typeof vi.fn>
const mockGenerateDisplayName = generateDisplayName as ReturnType<typeof vi.fn>
const mockPickRandomAvatar = pickRandomAvatar as ReturnType<typeof vi.fn>

describe('useAccessCode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    // Default: localStorage returns null (no stored access code)
    localStorageMock.getItem.mockReturnValue(null)
    // Create fresh mock for single() with default return value
    mockSingleResult = vi.fn().mockResolvedValue({ data: null, error: null })
    mockChain = createMockChain(mockSingleResult)
  })

  describe('initial state', () => {
    it('starts with loading true and resolves to false', async () => {
      // Note: Because useEffect runs synchronously in tests, we test that
      // loading eventually becomes false after initialization
      localStorageMock.getItem.mockReturnValue(null)
      mockSingleResult.mockResolvedValue({ data: null, error: null })

      const { result } = renderHook(() => useAccessCode())

      // After effect runs, loading should be false
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      expect(result.current.accessCode).toBeNull()
      expect(result.current.profile).toBeNull()
    })

    it('loads without access code when localStorage is empty', async () => {
      const { result } = renderHook(() => useAccessCode())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.accessCode).toBeNull()
      expect(result.current.profile).toBeNull()
      expect(result.current.hasAccessCode).toBe(false)
    })
  })

  describe('loading from localStorage', () => {
    it('validates and loads profile from stored access code', async () => {
      const mockProfile = {
        id: 'profile-1',
        access_code: 'SWIFT-BEAR-73',
        display_name: 'Swift Bear',
        avatar_emoji: '🐻',
      }

      localStorageMock.getItem.mockReturnValue('SWIFT-BEAR-73')
      mockSingleResult.mockResolvedValue({ data: mockProfile, error: null })

      const { result } = renderHook(() => useAccessCode())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.accessCode).toBe('SWIFT-BEAR-73')
      expect(result.current.profile).toEqual(mockProfile)
      expect(result.current.hasAccessCode).toBe(true)
    })

    it('clears localStorage when stored code is invalid format', async () => {
      localStorageMock.getItem.mockReturnValue('invalid-code')

      const { result } = renderHook(() => useAccessCode())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.accessCode).toBeNull()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('tutor_access_code')
    })

    it('clears localStorage when stored code not found in database', async () => {
      localStorageMock.getItem.mockReturnValue('SWIFT-BEAR-73')
      mockSingleResult.mockResolvedValue({ data: null, error: { message: 'Not found' } })

      const { result } = renderHook(() => useAccessCode())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.accessCode).toBeNull()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('tutor_access_code')
    })
  })

  describe('createProfile', () => {
    it('creates profile successfully', async () => {
      const mockProfile = {
        id: 'test-uuid-1234',
        access_code: 'SWIFT-BEAR-73',
        display_name: 'Swift Bear',
        avatar_emoji: '🐻',
      }

      mockSingleResult.mockResolvedValue({ data: mockProfile, error: null })

      const { result } = renderHook(() => useAccessCode())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let response: { accessCode: string | null; error: string | null }
      await act(async () => {
        response = await result.current.createProfile()
      })

      expect(response!.accessCode).toBe('SWIFT-BEAR-73')
      expect(response!.error).toBeNull()
      expect(result.current.accessCode).toBe('SWIFT-BEAR-73')
      expect(result.current.profile).toEqual(mockProfile)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('tutor_access_code', 'SWIFT-BEAR-73')
    })

    it('retries on unique constraint violation (collision)', async () => {
      // Ensure localStorage is empty so no validation is triggered on mount
      localStorageMock.getItem.mockReturnValue(null)

      const collisionError = { code: '23505', message: 'Unique constraint violation' }
      const mockProfile = {
        id: 'test-uuid-1234',
        access_code: 'HAPPY-PANDA-99',
        display_name: 'Happy Panda',
        avatar_emoji: '🐼',
      }

      // First attempt fails with collision
      mockGenerateAccessCode.mockReturnValueOnce('SWIFT-BEAR-73')
      mockGenerateDisplayName.mockReturnValueOnce('Swift Bear')
      mockPickRandomAvatar.mockReturnValueOnce('🐻')

      // Second attempt succeeds
      mockGenerateAccessCode.mockReturnValueOnce('HAPPY-PANDA-99')
      mockGenerateDisplayName.mockReturnValueOnce('Happy Panda')
      mockPickRandomAvatar.mockReturnValueOnce('🐼')

      let createCallCount = 0
      mockSingleResult.mockImplementation(() => {
        createCallCount++
        if (createCallCount === 1) {
          return Promise.resolve({ data: null, error: collisionError })
        }
        return Promise.resolve({ data: mockProfile, error: null })
      })

      const { result } = renderHook(() => useAccessCode())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let response: { accessCode: string | null; error: string | null }
      await act(async () => {
        response = await result.current.createProfile()
      })

      expect(response!.accessCode).toBe('HAPPY-PANDA-99')
      expect(response!.error).toBeNull()
      expect(mockGenerateAccessCode).toHaveBeenCalledTimes(2)
    })

    it('fails after 5 collision attempts', async () => {
      // Ensure localStorage is empty so no validation is triggered on mount
      localStorageMock.getItem.mockReturnValue(null)

      const collisionError = { code: '23505', message: 'Unique constraint violation' }

      mockSingleResult.mockResolvedValue({ data: null, error: collisionError })

      const { result } = renderHook(() => useAccessCode())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let response: { accessCode: string | null; error: string | null }
      await act(async () => {
        response = await result.current.createProfile()
      })

      expect(response!.accessCode).toBeNull()
      expect(response!.error).toBe('Failed to generate unique access code after 5 attempts')
      expect(mockGenerateAccessCode).toHaveBeenCalledTimes(5)
    })

    it('returns error on database error (non-collision)', async () => {
      // Ensure localStorage is empty so no validation is triggered on mount
      localStorageMock.getItem.mockReturnValue(null)

      const dbError = { code: '42P01', message: 'Table does not exist' }

      mockSingleResult.mockResolvedValue({ data: null, error: dbError })

      const { result } = renderHook(() => useAccessCode())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let response: { accessCode: string | null; error: string | null }
      await act(async () => {
        response = await result.current.createProfile()
      })

      expect(response!.accessCode).toBeNull()
      expect(response!.error).toBe('Table does not exist')
      // Should not retry on non-collision errors
      expect(mockGenerateAccessCode).toHaveBeenCalledTimes(1)
    })
  })

  describe('validateCode', () => {
    it('returns true and updates state for valid code', async () => {
      const mockProfile = {
        id: 'profile-1',
        access_code: 'HAPPY-FOX-42',
        display_name: 'Happy Fox',
        avatar_emoji: '🦊',
      }

      mockSingleResult.mockResolvedValue({ data: mockProfile, error: null })

      const { result } = renderHook(() => useAccessCode())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let isValid: boolean
      await act(async () => {
        isValid = await result.current.validateCode('HAPPY-FOX-42')
      })

      expect(isValid!).toBe(true)
      expect(result.current.accessCode).toBe('HAPPY-FOX-42')
      expect(result.current.profile).toEqual(mockProfile)
    })

    it('returns false for invalid code format', async () => {
      const { result } = renderHook(() => useAccessCode())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let isValid: boolean
      await act(async () => {
        isValid = await result.current.validateCode('invalid')
      })

      expect(isValid!).toBe(false)
      expect(result.current.accessCode).toBeNull()
    })

    it('returns false when code not found in database', async () => {
      mockSingleResult.mockResolvedValue({ data: null, error: { message: 'Not found' } })

      const { result } = renderHook(() => useAccessCode())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let isValid: boolean
      await act(async () => {
        isValid = await result.current.validateCode('VALID-CODE-00')
      })

      expect(isValid!).toBe(false)
    })
  })

  describe('clearAccessCode', () => {
    it('clears localStorage and resets state', async () => {
      const mockProfile = {
        id: 'profile-1',
        access_code: 'SWIFT-BEAR-73',
        display_name: 'Swift Bear',
        avatar_emoji: '🐻',
      }

      localStorageMock.getItem.mockReturnValue('SWIFT-BEAR-73')
      mockSingleResult.mockResolvedValue({ data: mockProfile, error: null })

      const { result } = renderHook(() => useAccessCode())

      await waitFor(() => {
        expect(result.current.accessCode).toBe('SWIFT-BEAR-73')
      })

      act(() => {
        result.current.clearAccessCode()
      })

      expect(result.current.accessCode).toBeNull()
      expect(result.current.profile).toBeNull()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('tutor_access_code')
    })
  })

  describe('refreshProfile', () => {
    it('re-fetches profile from database', async () => {
      const mockProfile = {
        id: 'profile-1',
        access_code: 'SWIFT-BEAR-73',
        display_name: 'Swift Bear',
        avatar_emoji: '🐻',
      }

      const updatedProfile = {
        ...mockProfile,
        display_name: 'Updated Bear',
      }

      localStorageMock.getItem.mockReturnValue('SWIFT-BEAR-73')
      mockSingleResult
        .mockResolvedValueOnce({ data: mockProfile, error: null })
        .mockResolvedValueOnce({ data: updatedProfile, error: null })

      const { result } = renderHook(() => useAccessCode())

      await waitFor(() => {
        expect(result.current.profile?.display_name).toBe('Swift Bear')
      })

      await act(async () => {
        await result.current.refreshProfile()
      })

      expect(result.current.profile?.display_name).toBe('Updated Bear')
    })

    it('does nothing when no access code', async () => {
      const { result } = renderHook(() => useAccessCode())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.refreshProfile()
      })

      // Should not have called select (refreshProfile only runs if accessCode exists)
      expect(mockChain.select).not.toHaveBeenCalled()
    })
  })

  describe('hasAccessCode', () => {
    it('returns true when access code exists', async () => {
      const mockProfile = {
        id: 'profile-1',
        access_code: 'SWIFT-BEAR-73',
        display_name: 'Swift Bear',
        avatar_emoji: '🐻',
      }

      localStorageMock.getItem.mockReturnValue('SWIFT-BEAR-73')
      mockSingleResult.mockResolvedValue({ data: mockProfile, error: null })

      const { result } = renderHook(() => useAccessCode())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.hasAccessCode).toBe(true)
    })

    it('returns false when no access code', async () => {
      const { result } = renderHook(() => useAccessCode())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.hasAccessCode).toBe(false)
    })
  })
})
