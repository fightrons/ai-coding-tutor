import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createElement } from 'react'
import { EventBusProvider, usePublish } from '@/shared/hooks'
import { useAttemptPersistenceListener } from './useAttemptPersistence'
import type { AttemptData } from '@/shared/types/events'

// Mock Supabase
const mockInsert = vi.fn()
vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    from: () => ({
      insert: mockInsert,
    }),
  },
}))

// Mock logger to avoid console noise in tests
vi.mock('@/shared/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

function Wrapper({ children }: { children: ReactNode }) {
  return createElement(EventBusProvider, null, children)
}

const createTestAttemptData = (overrides?: Partial<AttemptData>): AttemptData => ({
  studentId: 'student-123',
  lessonId: 'lesson-456',
  exerciseId: 'exercise-789',
  code: 'console.log("test")',
  passed: true,
  testResults: [{ name: 'test1', passed: true }],
  errorMessage: null,
  timeSpentSeconds: 45,
  hintLevel: 0,
  isFirstAttempt: true,
  ...overrides,
})

describe('useAttemptPersistenceListener', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should persist attempt when event is published', async () => {
    mockInsert.mockResolvedValueOnce({ error: null })

    // Render both hooks in same provider to share context
    const { result } = renderHook(
      () => {
        useAttemptPersistenceListener()
        return usePublish()
      },
      { wrapper: Wrapper }
    )

    const testData = createTestAttemptData()

    await act(async () => {
      result.current('exercise:attempt_recorded', testData)
      // Let the async persist complete
      await vi.runAllTimersAsync()
    })

    expect(mockInsert).toHaveBeenCalledTimes(1)
    expect(mockInsert).toHaveBeenCalledWith({
      student_id: testData.studentId,
      lesson_id: testData.lessonId,
      code_submitted: testData.code,
      passed: testData.passed,
      test_results: testData.testResults,
      error_message: testData.errorMessage,
      time_spent_seconds: testData.timeSpentSeconds,
      hint_level: testData.hintLevel,
      hint_requested: false,
    })
  })

  it('should set hint_requested to true when hintLevel > 0', async () => {
    mockInsert.mockResolvedValueOnce({ error: null })

    const { result } = renderHook(
      () => {
        useAttemptPersistenceListener()
        return usePublish()
      },
      { wrapper: Wrapper }
    )

    const testData = createTestAttemptData({ hintLevel: 2 })

    await act(async () => {
      result.current('exercise:attempt_recorded', testData)
      await vi.runAllTimersAsync()
    })

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        hint_level: 2,
        hint_requested: true,
      })
    )
  })

  it('should retry on failure up to MAX_RETRIES times', async () => {
    const error = new Error('Network error')
    mockInsert
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({ error: null })

    const { result } = renderHook(
      () => {
        useAttemptPersistenceListener()
        return usePublish()
      },
      { wrapper: Wrapper }
    )

    const testData = createTestAttemptData()

    await act(async () => {
      result.current('exercise:attempt_recorded', testData)
      // Advance through retry delays
      await vi.runAllTimersAsync()
    })

    // Should have tried 3 times (2 failures + 1 success)
    expect(mockInsert).toHaveBeenCalledTimes(3)
  })

  it('should stop retrying after MAX_RETRIES failures', async () => {
    const error = new Error('Persistent error')
    mockInsert.mockRejectedValue(error)

    const { result } = renderHook(
      () => {
        useAttemptPersistenceListener()
        return usePublish()
      },
      { wrapper: Wrapper }
    )

    const testData = createTestAttemptData()

    await act(async () => {
      result.current('exercise:attempt_recorded', testData)
      await vi.runAllTimersAsync()
    })

    // Should have tried 4 times (initial + 3 retries)
    expect(mockInsert).toHaveBeenCalledTimes(4)
  })

  it('should handle Supabase error response', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'RLS violation' } })

    const { result } = renderHook(
      () => {
        useAttemptPersistenceListener()
        return usePublish()
      },
      { wrapper: Wrapper }
    )

    const testData = createTestAttemptData()

    await act(async () => {
      result.current('exercise:attempt_recorded', testData)
      await vi.runAllTimersAsync()
    })

    // Should retry on Supabase error response
    expect(mockInsert).toHaveBeenCalledTimes(4)
  })

  it('should persist failed attempts with error message', async () => {
    mockInsert.mockResolvedValueOnce({ error: null })

    const { result } = renderHook(
      () => {
        useAttemptPersistenceListener()
        return usePublish()
      },
      { wrapper: Wrapper }
    )

    const testData = createTestAttemptData({
      passed: false,
      errorMessage: 'TypeError: undefined is not a function',
    })

    await act(async () => {
      result.current('exercise:attempt_recorded', testData)
      await vi.runAllTimersAsync()
    })

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        passed: false,
        error_message: 'TypeError: undefined is not a function',
      })
    )
  })
})
