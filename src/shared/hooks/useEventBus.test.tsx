import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { EventBusProvider, usePublish, useSubscribe, useEventBus } from './useEventBus'

// Wrapper component for tests
function Wrapper({ children }: { children: ReactNode }) {
  return <EventBusProvider>{children}</EventBusProvider>
}

describe('useEventBus', () => {
  describe('usePublish', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => usePublish())
      }).toThrow('usePublish must be used within an EventBusProvider')
    })

    it('should return publish function when used within provider', () => {
      const { result } = renderHook(() => usePublish(), { wrapper: Wrapper })
      expect(typeof result.current).toBe('function')
    })
  })

  describe('useSubscribe', () => {
    it('should throw error when used outside provider', () => {
      const callback = vi.fn()
      expect(() => {
        renderHook(() => useSubscribe('exercise:attempt_recorded', callback))
      }).toThrow('useSubscribe must be used within an EventBusProvider')
    })

    it('should call subscriber when event is published', () => {
      const callback = vi.fn()

      // Create a combined hook to test both in same context
      const { result } = renderHook(
        () => {
          useSubscribe('exercise:attempt_recorded', callback)
          return usePublish()
        },
        { wrapper: Wrapper }
      )

      const testData = {
        studentId: 'student-1',
        lessonId: 'lesson-1',
        exerciseId: 'exercise-1',
        code: 'console.log("hello")',
        passed: true,
        testResults: [],
        errorMessage: null,
        timeSpentSeconds: 30,
        hintLevel: 0,
        isFirstAttempt: true,
      }

      act(() => {
        result.current('exercise:attempt_recorded', testData)
      })

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(testData)
    })

    it('should not call subscriber for different events', () => {
      const attemptCallback = vi.fn()
      const lessonCallback = vi.fn()

      const { result } = renderHook(
        () => {
          useSubscribe('exercise:attempt_recorded', attemptCallback)
          useSubscribe('lesson:completed', lessonCallback)
          return usePublish()
        },
        { wrapper: Wrapper }
      )

      const lessonData = {
        studentId: 'student-1',
        lessonId: 'lesson-1',
        timeSeconds: 120,
      }

      act(() => {
        result.current('lesson:completed', lessonData)
      })

      expect(attemptCallback).not.toHaveBeenCalled()
      expect(lessonCallback).toHaveBeenCalledTimes(1)
      expect(lessonCallback).toHaveBeenCalledWith(lessonData)
    })

    it('should support multiple subscribers for same event', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      const { result } = renderHook(
        () => {
          useSubscribe('exercise:attempt_recorded', callback1)
          useSubscribe('exercise:attempt_recorded', callback2)
          return usePublish()
        },
        { wrapper: Wrapper }
      )

      const testData = {
        studentId: 'student-1',
        lessonId: 'lesson-1',
        exerciseId: 'exercise-1',
        code: 'test',
        passed: false,
        testResults: [],
        errorMessage: 'Error',
        timeSpentSeconds: 10,
        hintLevel: 1,
        isFirstAttempt: false,
      }

      act(() => {
        result.current('exercise:attempt_recorded', testData)
      })

      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)
    })

    it('should unsubscribe when component unmounts', () => {
      const callback = vi.fn()

      const { result, unmount } = renderHook(
        () => {
          useSubscribe('exercise:attempt_recorded', callback)
          return usePublish()
        },
        { wrapper: Wrapper }
      )

      const testData = {
        studentId: 'student-1',
        lessonId: 'lesson-1',
        exerciseId: 'exercise-1',
        code: 'test',
        passed: true,
        testResults: [],
        errorMessage: null,
        timeSpentSeconds: 5,
        hintLevel: 0,
        isFirstAttempt: true,
      }

      // Publish before unmount
      act(() => {
        result.current('exercise:attempt_recorded', testData)
      })
      expect(callback).toHaveBeenCalledTimes(1)

      // Unmount and publish again
      unmount()

      // Need a new publisher since the old one unmounted
      const { result: newPublishResult } = renderHook(() => usePublish(), {
        wrapper: Wrapper,
      })

      act(() => {
        newPublishResult.current('exercise:attempt_recorded', testData)
      })

      // Callback should not be called again since subscriber unmounted
      expect(callback).toHaveBeenCalledTimes(1)
    })
  })

  describe('useEventBus', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useEventBus())
      }).toThrow('useEventBus must be used within an EventBusProvider')
    })

    it('should return both subscribe and publish functions', () => {
      const { result } = renderHook(() => useEventBus(), { wrapper: Wrapper })

      expect(typeof result.current.subscribe).toBe('function')
      expect(typeof result.current.publish).toBe('function')
    })

    it('should allow manual subscription and unsubscription', () => {
      const callback = vi.fn()

      const { result } = renderHook(() => useEventBus(), { wrapper: Wrapper })

      let unsubscribe: () => void

      act(() => {
        unsubscribe = result.current.subscribe('code:run_executed', callback)
      })

      const testData = {
        studentId: 'student-1',
        lessonId: 'lesson-1',
        hasErrors: false,
      }

      act(() => {
        result.current.publish('code:run_executed', testData)
      })
      expect(callback).toHaveBeenCalledTimes(1)

      act(() => {
        unsubscribe()
      })

      act(() => {
        result.current.publish('code:run_executed', testData)
      })
      expect(callback).toHaveBeenCalledTimes(1) // Still 1, not called again
    })
  })
})
