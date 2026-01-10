import { useState, useCallback, useEffect, useRef } from 'react'
import type { ExecutionResult } from '@/modules/editor'
import type { Lesson } from '@/modules/lesson'
import { usePublish } from '@/shared/hooks'
import { useIdentity } from '@/modules/auth'
import { useTutorMessages } from './useTutorMessages'
import { useExerciseAttempts } from './useExerciseAttempts'
import { useTutorContext } from './useTutorContext'
import { getTutorService } from '../lib/tutor-service'

interface UseTutorChatOptions {
  lesson: Lesson | null
  currentCode: string
  lastResult: ExecutionResult | null
}

export function useTutorChat(options: UseTutorChatOptions) {
  const { lesson, currentCode, lastResult } = options
  const lessonId = lesson?.id

  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Get identity for event publishing
  const { profileId } = useIdentity()
  const publish = usePublish()

  // Track time spent on attempts
  const attemptStartTimeRef = useRef<number>(Date.now())
  const lastResultRef = useRef<ExecutionResult | null>(null)

  // Fetch and manage messages
  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    sendMessage: saveMessage,
  } = useTutorMessages(lessonId)

  // Track exercise attempts
  const {
    shouldPromptHelp,
    hintLevel,
    attemptCount,
    recordAttempt,
    dismissPrompt,
    incrementHintLevel,
    resetAttempts,
  } = useExerciseAttempts(lessonId)

  // Build context for AI
  const context = useTutorContext({
    lesson,
    currentCode,
    lastResult,
    messages,
    hintLevel,
    attemptCount,
  })

  // Reset attempts and timer when lesson changes
  useEffect(() => {
    resetAttempts()
    attemptStartTimeRef.current = Date.now()
    lastResultRef.current = null
  }, [lessonId, resetAttempts])

  // Record attempt when result changes and publish event
  useEffect(() => {
    if (lastResult && currentCode && lastResult !== lastResultRef.current) {
      // Update ref to prevent duplicate events
      lastResultRef.current = lastResult

      // Record in local state (for UI)
      recordAttempt(currentCode, lastResult)

      // Calculate time spent since last attempt or lesson start
      const timeSpentSeconds = Math.round(
        (Date.now() - attemptStartTimeRef.current) / 1000
      )

      // Reset timer for next attempt
      attemptStartTimeRef.current = Date.now()

      // Publish event for persistence (if we have a student profile)
      if (profileId && lessonId) {
        publish('exercise:attempt_recorded', {
          studentId: profileId,
          lessonId,
          exerciseId: lessonId, // Using lessonId as exerciseId (1 exercise per lesson)
          code: currentCode,
          passed: lastResult.allPassed,
          testResults: lastResult.testResults,
          errorMessage: lastResult.error,
          timeSpentSeconds,
          hintLevel,
          isFirstAttempt: attemptCount === 0,
        })
      }
    }
  }, [lastResult, currentCode, recordAttempt, publish, profileId, lessonId, hintLevel, attemptCount])

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!context || isLoading) return

      setIsLoading(true)

      try {
        // Save student message
        await saveMessage(userMessage, 'student', 'question')

        // Check if asking for hint - increment hint level
        const lowerMessage = userMessage.toLowerCase()
        if (
          lowerMessage.includes('hint') ||
          lowerMessage.includes('help') ||
          lowerMessage.includes('stuck')
        ) {
          incrementHintLevel()
        }

        // Get AI response
        const tutorService = getTutorService()
        const response = await tutorService.generateResponse({
          context,
          userMessage,
        })

        // Save tutor response
        await saveMessage(response.content, 'tutor', response.messageType)
      } catch (error) {
        console.error('Error sending message:', error)
      } finally {
        setIsLoading(false)
      }
    },
    [context, isLoading, saveMessage, incrementHintLevel]
  )

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const open = useCallback(() => {
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const openWithMessage = useCallback(
    async (message: string) => {
      setIsOpen(true)
      await sendMessage(message)
    },
    [sendMessage]
  )

  const handleDismissPrompt = useCallback(() => {
    dismissPrompt()
  }, [dismissPrompt])

  const handleAcceptPrompt = useCallback(() => {
    dismissPrompt()
    openWithMessage("I'm stuck and could use some help with this exercise.")
  }, [dismissPrompt, openWithMessage])

  return {
    // State
    messages,
    isOpen,
    isLoading: isLoading || messagesLoading,
    error: messagesError,
    shouldShowPrompt: shouldPromptHelp && !isOpen,

    // Actions
    sendMessage,
    toggle,
    open,
    close,
    openWithMessage,
    dismissPrompt: handleDismissPrompt,
    acceptPrompt: handleAcceptPrompt,
  }
}
