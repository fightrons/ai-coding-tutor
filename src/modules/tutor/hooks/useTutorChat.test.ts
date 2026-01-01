import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTutorChat } from './useTutorChat'
import type { Lesson } from '@/modules/lesson'
import type { ExecutionResult } from '@/modules/editor'

// Mock dependent hooks
const mockSendMessage = vi.fn()
const mockRecordAttempt = vi.fn()
const mockResetAttempts = vi.fn()
const mockDismissPrompt = vi.fn()
const mockIncrementHintLevel = vi.fn()

vi.mock('./useTutorMessages', () => ({
  useTutorMessages: vi.fn(() => ({
    messages: [],
    loading: false,
    error: null,
    sendMessage: mockSendMessage,
  })),
}))

vi.mock('./useExerciseAttempts', () => ({
  useExerciseAttempts: vi.fn(() => ({
    shouldPromptHelp: false,
    hintLevel: 0,
    attemptCount: 0,
    recordAttempt: mockRecordAttempt,
    dismissPrompt: mockDismissPrompt,
    incrementHintLevel: mockIncrementHintLevel,
    resetAttempts: mockResetAttempts,
  })),
}))

vi.mock('./useTutorContext', () => ({
  useTutorContext: vi.fn(() => ({
    lessonId: 'lesson-1',
    lessonTitle: 'Test Lesson',
    currentCode: 'console.log("hello")',
  })),
}))

const mockGenerateResponse = vi.fn()
vi.mock('../lib/tutor-service', () => ({
  getTutorService: vi.fn(() => ({
    generateResponse: mockGenerateResponse,
  })),
}))

import { useTutorMessages } from './useTutorMessages'
import { useExerciseAttempts } from './useExerciseAttempts'
import { useTutorContext } from './useTutorContext'

const mockUseTutorMessages = useTutorMessages as ReturnType<typeof vi.fn>
const mockUseExerciseAttempts = useExerciseAttempts as ReturnType<typeof vi.fn>
const mockUseTutorContext = useTutorContext as ReturnType<typeof vi.fn>

describe('useTutorChat', () => {
  const createLesson = (overrides = {}): Lesson => ({
    id: 'lesson-1',
    slug: 'test-lesson',
    title: 'Test Lesson',
    content: { sections: [] },
    exercise: null,
    module_id: 'module-1',
    sequence_order: 1,
    created_at: '2024-01-01T00:00:00Z',
    difficulty: null,
    estimated_minutes: null,
    prerequisites: null,
    ...overrides,
  })

  const createResult = (passed = true): ExecutionResult => ({
    output: 'test output',
    error: passed ? null : 'test error',
    testResults: passed ? [{ name: 'test', passed: true, expected: '', actual: '' }] : [],
    allPassed: passed,
  })

  beforeEach(() => {
    vi.clearAllMocks()

    mockUseTutorMessages.mockReturnValue({
      messages: [],
      loading: false,
      error: null,
      sendMessage: mockSendMessage,
    })

    mockUseExerciseAttempts.mockReturnValue({
      shouldPromptHelp: false,
      hintLevel: 0,
      attemptCount: 0,
      recordAttempt: mockRecordAttempt,
      dismissPrompt: mockDismissPrompt,
      incrementHintLevel: mockIncrementHintLevel,
      resetAttempts: mockResetAttempts,
    })

    mockUseTutorContext.mockReturnValue({
      lessonId: 'lesson-1',
      lessonTitle: 'Test Lesson',
      currentCode: 'console.log("hello")',
    })

    mockGenerateResponse.mockResolvedValue({
      content: 'AI response',
      messageType: 'explanation',
    })

    mockSendMessage.mockResolvedValue({ message: null, error: null })
  })

  describe('initial state', () => {
    it('starts with isOpen false', () => {
      const { result } = renderHook(() =>
        useTutorChat({
          lesson: createLesson(),
          currentCode: '',
          lastResult: null,
        })
      )

      expect(result.current.isOpen).toBe(false)
    })

    it('starts with isLoading false', () => {
      const { result } = renderHook(() =>
        useTutorChat({
          lesson: createLesson(),
          currentCode: '',
          lastResult: null,
        })
      )

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('toggle, open, close', () => {
    it('toggle toggles isOpen state', () => {
      const { result } = renderHook(() =>
        useTutorChat({
          lesson: createLesson(),
          currentCode: '',
          lastResult: null,
        })
      )

      expect(result.current.isOpen).toBe(false)

      act(() => {
        result.current.toggle()
      })

      expect(result.current.isOpen).toBe(true)

      act(() => {
        result.current.toggle()
      })

      expect(result.current.isOpen).toBe(false)
    })

    it('open sets isOpen to true', () => {
      const { result } = renderHook(() =>
        useTutorChat({
          lesson: createLesson(),
          currentCode: '',
          lastResult: null,
        })
      )

      act(() => {
        result.current.open()
      })

      expect(result.current.isOpen).toBe(true)
    })

    it('close sets isOpen to false', () => {
      const { result } = renderHook(() =>
        useTutorChat({
          lesson: createLesson(),
          currentCode: '',
          lastResult: null,
        })
      )

      act(() => {
        result.current.open()
      })

      act(() => {
        result.current.close()
      })

      expect(result.current.isOpen).toBe(false)
    })
  })

  describe('lesson change effects', () => {
    it('resets attempts when lesson changes', () => {
      const lesson1 = createLesson({ id: 'lesson-1' })
      const lesson2 = createLesson({ id: 'lesson-2' })

      const { rerender } = renderHook(
        ({ lesson }) =>
          useTutorChat({
            lesson,
            currentCode: '',
            lastResult: null,
          }),
        { initialProps: { lesson: lesson1 } }
      )

      expect(mockResetAttempts).toHaveBeenCalledTimes(1)

      rerender({ lesson: lesson2 })

      expect(mockResetAttempts).toHaveBeenCalledTimes(2)
    })
  })

  describe('result change effects', () => {
    it('records attempt when lastResult changes', () => {
      const { rerender } = renderHook(
        ({ lastResult, currentCode }: { lastResult: ExecutionResult | null; currentCode: string }) =>
          useTutorChat({
            lesson: createLesson(),
            currentCode,
            lastResult,
          }),
        { initialProps: { lastResult: null as ExecutionResult | null, currentCode: '' } }
      )

      const result = createResult(true)
      rerender({ lastResult: result, currentCode: 'console.log("hello")' })

      expect(mockRecordAttempt).toHaveBeenCalledWith('console.log("hello")', result)
    })

    it('does not record attempt when lastResult is null', () => {
      renderHook(() =>
        useTutorChat({
          lesson: createLesson(),
          currentCode: 'console.log("hello")',
          lastResult: null,
        })
      )

      expect(mockRecordAttempt).not.toHaveBeenCalled()
    })
  })

  describe('sendMessage', () => {
    it('does nothing without context', async () => {
      mockUseTutorContext.mockReturnValue(null)

      const { result } = renderHook(() =>
        useTutorChat({
          lesson: createLesson(),
          currentCode: '',
          lastResult: null,
        })
      )

      await act(async () => {
        await result.current.sendMessage('Hello')
      })

      expect(mockSendMessage).not.toHaveBeenCalled()
    })

    it('saves student message', async () => {
      const { result } = renderHook(() =>
        useTutorChat({
          lesson: createLesson(),
          currentCode: '',
          lastResult: null,
        })
      )

      await act(async () => {
        await result.current.sendMessage('Hello')
      })

      expect(mockSendMessage).toHaveBeenCalledWith('Hello', 'student', 'question')
    })

    it('detects "hint" keyword and increments hint level', async () => {
      const { result } = renderHook(() =>
        useTutorChat({
          lesson: createLesson(),
          currentCode: '',
          lastResult: null,
        })
      )

      await act(async () => {
        await result.current.sendMessage('Can I get a hint?')
      })

      expect(mockIncrementHintLevel).toHaveBeenCalled()
    })

    it('detects "help" keyword and increments hint level', async () => {
      const { result } = renderHook(() =>
        useTutorChat({
          lesson: createLesson(),
          currentCode: '',
          lastResult: null,
        })
      )

      await act(async () => {
        await result.current.sendMessage('I need help')
      })

      expect(mockIncrementHintLevel).toHaveBeenCalled()
    })

    it('detects "stuck" keyword and increments hint level', async () => {
      const { result } = renderHook(() =>
        useTutorChat({
          lesson: createLesson(),
          currentCode: '',
          lastResult: null,
        })
      )

      await act(async () => {
        await result.current.sendMessage("I'm stuck on this")
      })

      expect(mockIncrementHintLevel).toHaveBeenCalled()
    })

    it('does not increment hint level for regular messages', async () => {
      const { result } = renderHook(() =>
        useTutorChat({
          lesson: createLesson(),
          currentCode: '',
          lastResult: null,
        })
      )

      await act(async () => {
        await result.current.sendMessage('What does this function do?')
      })

      expect(mockIncrementHintLevel).not.toHaveBeenCalled()
    })

    it('calls tutor service and saves response', async () => {
      const { result } = renderHook(() =>
        useTutorChat({
          lesson: createLesson(),
          currentCode: '',
          lastResult: null,
        })
      )

      await act(async () => {
        await result.current.sendMessage('Hello')
      })

      expect(mockGenerateResponse).toHaveBeenCalled()
      expect(mockSendMessage).toHaveBeenCalledTimes(2)
      expect(mockSendMessage).toHaveBeenLastCalledWith('AI response', 'tutor', 'explanation')
    })

    it('sets isLoading during message send', async () => {
      let resolveResponse: (value: unknown) => void
      mockGenerateResponse.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveResponse = resolve
          })
      )

      const { result } = renderHook(() =>
        useTutorChat({
          lesson: createLesson(),
          currentCode: '',
          lastResult: null,
        })
      )

      act(() => {
        result.current.sendMessage('Hello')
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      await act(async () => {
        resolveResponse!({ content: 'Response', messageType: 'explanation' })
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('openWithMessage', () => {
    it('opens panel and sends message', async () => {
      const { result } = renderHook(() =>
        useTutorChat({
          lesson: createLesson(),
          currentCode: '',
          lastResult: null,
        })
      )

      await act(async () => {
        await result.current.openWithMessage('I need help')
      })

      expect(result.current.isOpen).toBe(true)
      expect(mockSendMessage).toHaveBeenCalledWith('I need help', 'student', 'question')
    })
  })

  describe('shouldShowPrompt', () => {
    it('shows prompt when shouldPromptHelp and not open', () => {
      mockUseExerciseAttempts.mockReturnValue({
        shouldPromptHelp: true,
        hintLevel: 0,
        attemptCount: 3,
        recordAttempt: mockRecordAttempt,
        dismissPrompt: mockDismissPrompt,
        incrementHintLevel: mockIncrementHintLevel,
        resetAttempts: mockResetAttempts,
      })

      const { result } = renderHook(() =>
        useTutorChat({
          lesson: createLesson(),
          currentCode: '',
          lastResult: null,
        })
      )

      expect(result.current.shouldShowPrompt).toBe(true)
    })

    it('hides prompt when panel is open', () => {
      mockUseExerciseAttempts.mockReturnValue({
        shouldPromptHelp: true,
        hintLevel: 0,
        attemptCount: 3,
        recordAttempt: mockRecordAttempt,
        dismissPrompt: mockDismissPrompt,
        incrementHintLevel: mockIncrementHintLevel,
        resetAttempts: mockResetAttempts,
      })

      const { result } = renderHook(() =>
        useTutorChat({
          lesson: createLesson(),
          currentCode: '',
          lastResult: null,
        })
      )

      act(() => {
        result.current.open()
      })

      expect(result.current.shouldShowPrompt).toBe(false)
    })
  })

  describe('dismissPrompt', () => {
    it('calls underlying dismissPrompt', () => {
      const { result } = renderHook(() =>
        useTutorChat({
          lesson: createLesson(),
          currentCode: '',
          lastResult: null,
        })
      )

      act(() => {
        result.current.dismissPrompt()
      })

      expect(mockDismissPrompt).toHaveBeenCalled()
    })
  })

  describe('acceptPrompt', () => {
    it('dismisses prompt and opens with help message', async () => {
      const { result } = renderHook(() =>
        useTutorChat({
          lesson: createLesson(),
          currentCode: '',
          lastResult: null,
        })
      )

      await act(async () => {
        await result.current.acceptPrompt()
      })

      expect(mockDismissPrompt).toHaveBeenCalled()
      expect(result.current.isOpen).toBe(true)
      expect(mockSendMessage).toHaveBeenCalledWith(
        "I'm stuck and could use some help with this exercise.",
        'student',
        'question'
      )
    })
  })

  describe('combined loading state', () => {
    it('combines isLoading with messagesLoading', () => {
      mockUseTutorMessages.mockReturnValue({
        messages: [],
        loading: true,
        error: null,
        sendMessage: mockSendMessage,
      })

      const { result } = renderHook(() =>
        useTutorChat({
          lesson: createLesson(),
          currentCode: '',
          lastResult: null,
        })
      )

      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('error propagation', () => {
    it('exposes messages error', () => {
      mockUseTutorMessages.mockReturnValue({
        messages: [],
        loading: false,
        error: 'Failed to load messages',
        sendMessage: mockSendMessage,
      })

      const { result } = renderHook(() =>
        useTutorChat({
          lesson: createLesson(),
          currentCode: '',
          lastResult: null,
        })
      )

      expect(result.current.error).toBe('Failed to load messages')
    })
  })
})
