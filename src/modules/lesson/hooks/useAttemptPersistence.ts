import { useCallback } from 'react'
import { useSubscribe } from '@/shared/hooks'
import { supabase } from '@/shared/lib/supabase'
import { logger } from '@/shared/lib/logger'
import type { AttemptData } from '@/shared/types/events'
import type { Json } from '@/shared/types/database'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

/**
 * Persists an attempt to Supabase with retry logic.
 * Fire-and-forget pattern - never blocks UI.
 */
async function persistAttempt(data: AttemptData, retryCount = 0): Promise<void> {
  try {
    const { error } = await supabase.from('exercise_attempts').insert({
      student_id: data.studentId,
      lesson_id: data.lessonId,
      code_submitted: data.code,
      passed: data.passed,
      test_results: data.testResults as Json,
      error_message: data.errorMessage,
      time_spent_seconds: data.timeSpentSeconds,
      hint_level: data.hintLevel,
      hint_requested: data.hintLevel > 0,
    })

    if (error) {
      throw error
    }

    logger.debug('[AttemptPersistence] Attempt saved successfully', {
      lessonId: data.lessonId,
      passed: data.passed,
    })
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      logger.warn(
        `[AttemptPersistence] Failed to save attempt, retrying (${retryCount + 1}/${MAX_RETRIES})...`,
        error
      )
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
      return persistAttempt(data, retryCount + 1)
    }

    // All retries exhausted - log and move on (don't block user)
    logger.error('[AttemptPersistence] Failed to save attempt after retries:', error)
  }
}

/**
 * Hook that subscribes to exercise attempt events and persists them to Supabase.
 * Uses fire-and-forget pattern - persistence failures never block the UI.
 *
 * This hook should be called once at the lesson layout level to activate
 * the persistence listener.
 */
export function useAttemptPersistenceListener() {
  const handleAttempt = useCallback((data: AttemptData) => {
    // Fire and forget - don't await
    persistAttempt(data)
  }, [])

  useSubscribe('exercise:attempt_recorded', handleAttempt)
}
