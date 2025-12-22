import { useState, useCallback, useEffect } from 'react'
import type { ExecutionResult } from '@/modules/editor'
import type { Lesson } from '@/modules/lesson'
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

  // Reset attempts when lesson changes
  useEffect(() => {
    resetAttempts()
  }, [lessonId, resetAttempts])

  // Record attempt when result changes
  useEffect(() => {
    if (lastResult && currentCode) {
      recordAttempt(currentCode, lastResult)
    }
  }, [lastResult, currentCode, recordAttempt])

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
