import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useTutorMessages } from './useTutorMessages'

// Mock useIdentity
vi.mock('@/modules/auth', () => ({
  useIdentity: vi.fn(),
}))

// Mock Supabase with chainable API
let mockOrderResult: ReturnType<typeof vi.fn>
let mockSingleResult: ReturnType<typeof vi.fn>
let mockDeleteResult: ReturnType<typeof vi.fn>

const createMockChain = () => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.select = vi.fn(() => chain)
  chain.insert = vi.fn(() => chain)
  chain.delete = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.order = mockOrderResult
  chain.single = mockSingleResult
  return chain
}

let mockChain: ReturnType<typeof createMockChain>

vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => mockChain),
  },
}))

import { useIdentity } from '@/modules/auth'

const mockUseIdentity = useIdentity as ReturnType<typeof vi.fn>

describe('useTutorMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Create fresh mocks with default return values
    mockOrderResult = vi.fn().mockResolvedValue({ data: [], error: null })
    mockSingleResult = vi.fn().mockResolvedValue({ data: null, error: null })
    mockDeleteResult = vi.fn().mockResolvedValue({ error: null })
    mockChain = createMockChain()
  })

  describe('loading state', () => {
    it('returns loading when identity is loading', () => {
      mockUseIdentity.mockReturnValue({
        profileId: null,
        loading: true,
      })

      const { result } = renderHook(() => useTutorMessages('lesson-1'))

      expect(result.current.loading).toBe(true)
    })

    it('combines identity loading with own loading', async () => {
      mockUseIdentity.mockReturnValue({
        profileId: 'profile-1',
        loading: true,
      })

      const { result } = renderHook(() => useTutorMessages('lesson-1'))

      expect(result.current.loading).toBe(true)
    })
  })

  describe('empty state', () => {
    it('returns empty messages when no profileId', async () => {
      mockUseIdentity.mockReturnValue({
        profileId: null,
        loading: false,
      })

      const { result } = renderHook(() => useTutorMessages('lesson-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.messages).toEqual([])
      expect(result.current.error).toBeNull()
    })

    it('returns empty messages when no lessonId', async () => {
      mockUseIdentity.mockReturnValue({
        profileId: 'profile-1',
        loading: false,
      })

      const { result } = renderHook(() => useTutorMessages(undefined))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.messages).toEqual([])
    })
  })

  describe('fetching messages', () => {
    it('fetches messages successfully', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          student_id: 'profile-1',
          lesson_id: 'lesson-1',
          role: 'student',
          content: 'Hello',
          message_type: 'question',
          created_at: '2024-01-01T10:00:00Z',
        },
        {
          id: 'msg-2',
          student_id: 'profile-1',
          lesson_id: 'lesson-1',
          role: 'tutor',
          content: 'Hi there!',
          message_type: 'explanation',
          created_at: '2024-01-01T10:01:00Z',
        },
      ]

      mockUseIdentity.mockReturnValue({
        profileId: 'profile-1',
        loading: false,
      })
      mockOrderResult.mockResolvedValue({ data: mockMessages, error: null })

      const { result } = renderHook(() => useTutorMessages('lesson-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.messages).toHaveLength(2)
      expect(result.current.messages[0].id).toBe('msg-1')
      expect(result.current.messages[0].role).toBe('student')
      expect(result.current.messages[1].id).toBe('msg-2')
      expect(result.current.messages[1].role).toBe('tutor')
    })

    it('handles fetch error', async () => {
      mockUseIdentity.mockReturnValue({
        profileId: 'profile-1',
        loading: false,
      })
      mockOrderResult.mockResolvedValue({ data: null, error: { message: 'Database error' } })

      const { result } = renderHook(() => useTutorMessages('lesson-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.messages).toEqual([])
      expect(result.current.error).toBe('Database error')
    })
  })

  describe('sendMessage', () => {
    it('returns error when not authenticated', async () => {
      mockUseIdentity.mockReturnValue({
        profileId: null,
        loading: false,
      })

      const { result } = renderHook(() => useTutorMessages('lesson-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const response = await result.current.sendMessage('Hello', 'student', 'question')

      expect(response.error).toBe('Not authenticated or no lesson selected')
      expect(response.message).toBeNull()
    })

    it('returns error when no lesson selected', async () => {
      mockUseIdentity.mockReturnValue({
        profileId: 'profile-1',
        loading: false,
      })

      const { result } = renderHook(() => useTutorMessages(undefined))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const response = await result.current.sendMessage('Hello', 'student', 'question')

      expect(response.error).toBe('Not authenticated or no lesson selected')
    })

    it('adds optimistic message immediately', async () => {
      mockUseIdentity.mockReturnValue({
        profileId: 'profile-1',
        loading: false,
      })
      mockOrderResult.mockResolvedValue({ data: [], error: null })

      // Delay the database response
      const savedMessage = {
        id: 'real-msg-1',
        role: 'student',
        content: 'Hello',
        message_type: 'question',
        created_at: '2024-01-01T10:00:00Z',
      }
      mockSingleResult.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: savedMessage, error: null }), 100)
          )
      )

      const { result } = renderHook(() => useTutorMessages('lesson-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Start sending message (don't await)
      act(() => {
        result.current.sendMessage('Hello', 'student', 'question')
      })

      // Optimistic message should appear immediately
      expect(result.current.messages).toHaveLength(1)
      expect(result.current.messages[0].content).toBe('Hello')
      expect(result.current.messages[0].id).toMatch(/^temp-/)
    })

    it('replaces temp message with real message on success', async () => {
      mockUseIdentity.mockReturnValue({
        profileId: 'profile-1',
        loading: false,
      })
      mockOrderResult.mockResolvedValue({ data: [], error: null })

      const savedMessage = {
        id: 'real-msg-1',
        role: 'student',
        content: 'Hello',
        message_type: 'question',
        created_at: '2024-01-01T10:00:00Z',
      }
      mockSingleResult.mockResolvedValue({ data: savedMessage, error: null })

      const { result } = renderHook(() => useTutorMessages('lesson-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        const response = await result.current.sendMessage('Hello', 'student', 'question')
        expect(response.message?.id).toBe('real-msg-1')
        expect(response.error).toBeNull()
      })

      expect(result.current.messages).toHaveLength(1)
      expect(result.current.messages[0].id).toBe('real-msg-1')
    })

    it('rolls back optimistic update on error', async () => {
      mockUseIdentity.mockReturnValue({
        profileId: 'profile-1',
        loading: false,
      })
      mockOrderResult.mockResolvedValue({ data: [], error: null })
      mockSingleResult.mockResolvedValue({ data: null, error: { message: 'Insert failed' } })

      const { result } = renderHook(() => useTutorMessages('lesson-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        const response = await result.current.sendMessage('Hello', 'student', 'question')
        expect(response.error).toBe('Insert failed')
      })

      // Message should be removed on error
      expect(result.current.messages).toHaveLength(0)
      expect(result.current.error).toBe('Insert failed')
    })
  })

  describe('clearMessages', () => {
    it('deletes and clears messages', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          role: 'student',
          content: 'Hello',
          message_type: 'question',
          created_at: '2024-01-01T10:00:00Z',
        },
      ]

      mockUseIdentity.mockReturnValue({
        profileId: 'profile-1',
        loading: false,
      })
      mockOrderResult.mockResolvedValue({ data: mockMessages, error: null })

      const { result } = renderHook(() => useTutorMessages('lesson-1'))

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(1)
      })

      await act(async () => {
        const response = await result.current.clearMessages()
        expect(response.error).toBeNull()
      })

      expect(result.current.messages).toHaveLength(0)
    })

    it('returns error when not authenticated', async () => {
      mockUseIdentity.mockReturnValue({
        profileId: null,
        loading: false,
      })

      const { result } = renderHook(() => useTutorMessages('lesson-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const response = await result.current.clearMessages()

      expect(response.error).toBe('Not authenticated or no lesson selected')
    })

    it('returns error on delete failure', async () => {
      mockUseIdentity.mockReturnValue({
        profileId: 'profile-1',
        loading: false,
      })
      mockOrderResult.mockResolvedValue({ data: [], error: null })

      // Track eq call count to distinguish between fetch and delete operations
      let eqCallCount = 0
      mockChain.eq = vi.fn(() => {
        eqCallCount++
        // For fetch: first 2 eq calls lead to order
        if (eqCallCount <= 2) {
          return { eq: mockChain.eq, order: mockOrderResult }
        }
        // For delete: next eq calls (3rd and 4th) - return another eq that returns error
        if (eqCallCount === 3) {
          return { eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }) }
        }
        return Promise.resolve({ error: { message: 'Delete failed' } })
      })

      const { result } = renderHook(() => useTutorMessages('lesson-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const response = await result.current.clearMessages()

      expect(response.error).toBe('Delete failed')
    })
  })

  describe('refetch', () => {
    it('reloads messages from database', async () => {
      const initialMessages = [
        {
          id: 'msg-1',
          role: 'student',
          content: 'Hello',
          message_type: 'question',
          created_at: '2024-01-01T10:00:00Z',
        },
      ]

      const updatedMessages = [
        ...initialMessages,
        {
          id: 'msg-2',
          role: 'tutor',
          content: 'Hi!',
          message_type: 'explanation',
          created_at: '2024-01-01T10:01:00Z',
        },
      ]

      mockUseIdentity.mockReturnValue({
        profileId: 'profile-1',
        loading: false,
      })
      mockOrderResult.mockResolvedValueOnce({ data: initialMessages, error: null })

      const { result } = renderHook(() => useTutorMessages('lesson-1'))

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(1)
      })

      mockOrderResult.mockResolvedValueOnce({ data: updatedMessages, error: null })

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.messages).toHaveLength(2)
    })
  })
})
