import { useMemo } from 'react'
import { useIdentity, useStudentProfile } from '@/modules/auth'
import type { ExecutionResult } from '@/modules/editor'
import type { Lesson } from '@/modules/lesson'
import type { TutorContext, TutorMessage } from '../types'

interface UseTutorContextOptions {
  lesson: Lesson | null
  currentCode: string
  lastResult: ExecutionResult | null
  messages: TutorMessage[]
  hintLevel: number
  attemptCount: number
}

export function useTutorContext(
  options: UseTutorContextOptions
): TutorContext | null {
  const { displayName } = useIdentity()
  const { profile } = useStudentProfile()
  const { lesson, currentCode, lastResult, messages, hintLevel, attemptCount } =
    options

  const context = useMemo(() => {
    if (!lesson) return null

    // Summarize lesson content (first 500 chars of text sections)
    const lessonSummary = lesson.content.sections
      .filter((s) => s.type === 'explanation')
      .map((s) => s.text || '')
      .join(' ')
      .slice(0, 500)

    // Extract available hints from exercise
    const availableHints =
      lesson.exercise?.hints?.map((h) => h.text) || []

    // Format test results if available
    let testResultsSummary: string | null = null
    if (lastResult?.testResults && lastResult.testResults.length > 0) {
      const passed = lastResult.testResults.filter((t) => t.passed).length
      const total = lastResult.testResults.length
      const failing = lastResult.testResults
        .filter((t) => !t.passed)
        .map((t) => `${t.name}: expected "${t.expected}", got "${t.actual}"`)
        .join('; ')
      testResultsSummary = `${passed}/${total} passed${failing ? `. Failing: ${failing}` : ''}`
    }

    // Get last 10 messages for context
    const recentMessages = messages.slice(-10)

    return {
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      lessonContent: lessonSummary,
      exerciseDescription: lesson.exercise?.description || null,
      availableHints,

      studentName: displayName || 'Student',
      ageGroup: profile?.age_group || null,
      learningGoal: profile?.learning_goal || null,
      priorExperience: profile?.prior_experience || null,
      preferredStyle: profile?.preferred_style || null,

      currentCode,
      lastError: lastResult?.error || null,
      testResults: testResultsSummary,
      attemptCount,
      hintLevel,

      recentMessages,
    }
  }, [
    lesson,
    displayName,
    profile,
    currentCode,
    lastResult,
    messages,
    hintLevel,
    attemptCount,
  ])

  return context
}
