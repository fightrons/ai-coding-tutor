import { useState, useCallback } from 'react'
import type { ExecutionResult } from '@/modules/editor'
import type { AttemptState } from '../types'

const FAILURE_THRESHOLD = 3 // Show help prompt after 3 consecutive failures

const initialState: AttemptState = {
  attemptCount: 0,
  consecutiveFailures: 0,
  lastError: null,
  lastCode: null,
  lastResult: null,
  shouldPromptHelp: false,
  hintLevel: 0,
}

export function useExerciseAttempts(lessonId: string | undefined) {
  const [state, setState] = useState<AttemptState>(initialState)

  const recordAttempt = useCallback(
    (code: string, result: ExecutionResult) => {
      setState((prev) => {
        const isFailure = !result.allPassed
        const newConsecutiveFailures = isFailure
          ? prev.consecutiveFailures + 1
          : 0

        return {
          attemptCount: prev.attemptCount + 1,
          consecutiveFailures: newConsecutiveFailures,
          lastError: result.error,
          lastCode: code,
          lastResult: result,
          shouldPromptHelp:
            newConsecutiveFailures >= FAILURE_THRESHOLD &&
            !prev.shouldPromptHelp,
          hintLevel: prev.hintLevel,
        }
      })
    },
    []
  )

  const dismissPrompt = useCallback(() => {
    setState((prev) => ({
      ...prev,
      shouldPromptHelp: false,
    }))
  }, [])

  const incrementHintLevel = useCallback(() => {
    setState((prev) => ({
      ...prev,
      hintLevel: prev.hintLevel + 1,
    }))
  }, [])

  const resetAttempts = useCallback(() => {
    setState(initialState)
  }, [])

  // Reset when lesson changes
  const resetForLesson = useCallback(
    (newLessonId: string | undefined) => {
      if (newLessonId !== lessonId) {
        resetAttempts()
      }
    },
    [lessonId, resetAttempts]
  )

  return {
    ...state,
    recordAttempt,
    dismissPrompt,
    incrementHintLevel,
    resetAttempts,
    resetForLesson,
  }
}
