import { supabase } from '@/shared/lib/supabase'
import type { TutorRequest, TutorResponse, MessageType } from '../types'
import { getRandomResponse } from './prompt-templates'

// Service interface for AI tutor
export interface TutorService {
  generateResponse(request: TutorRequest): Promise<TutorResponse>
}

// Supabase Edge Function implementation
export class SupabaseTutorService implements TutorService {
  async generateResponse(request: TutorRequest): Promise<TutorResponse> {
    const { data, error } = await supabase.functions.invoke('tutor-chat', {
      body: request,
    })

    if (error) {
      console.error('Tutor function error:', error)
      throw new Error(`Tutor API error: ${error.message}`)
    }

    return data as TutorResponse
  }
}

// Mock implementation for development
export class MockTutorService implements TutorService {
  async generateResponse(request: TutorRequest): Promise<TutorResponse> {
    // Simulate network delay (500-1500ms)
    const delay = 500 + Math.random() * 1000
    await new Promise((resolve) => setTimeout(resolve, delay))

    const { context, userMessage } = request
    const lowerMessage = userMessage.toLowerCase()

    // Determine response type based on context and message
    let content: string
    let messageType: MessageType

    // Check if there's an error in the code
    if (context.lastError) {
      if (context.lastError.includes('SyntaxError')) {
        content = getRandomResponse('syntaxError')
        messageType = 'hint'
      } else {
        content = getRandomResponse('testFailing')
        messageType = 'hint'
      }
    }
    // Check if tests are failing
    else if (context.testResults && !context.testResults.includes('passed')) {
      content = getRandomResponse('testFailing')
      messageType = 'hint'
    }
    // Check message intent for hints
    else if (
      lowerMessage.includes('hint') ||
      lowerMessage.includes('help') ||
      lowerMessage.includes('stuck')
    ) {
      // Progressive hints based on hint level
      if (context.hintLevel >= 2) {
        content = getRandomResponse('hintLevel3')
      } else if (context.hintLevel >= 1) {
        content = getRandomResponse('hintLevel2')
      } else {
        content = getRandomResponse('hintLevel1')
      }
      messageType = 'hint'
    }
    // Check for encouragement requests
    else if (
      lowerMessage.includes('frustrated') ||
      lowerMessage.includes("can't") ||
      lowerMessage.includes('hard')
    ) {
      content = getRandomResponse('encouragement')
      messageType = 'encouragement'
    }
    // Default to general help
    else {
      content = getRandomResponse('generalHelp')
      messageType = 'explanation'
    }

    return { content, messageType }
  }
}

// Factory function - uses Supabase by default, mock when VITE_USE_MOCK_TUTOR is set
export function createTutorService(): TutorService {
  const useMock = import.meta.env.VITE_USE_MOCK_TUTOR === 'true'
  if (useMock) {
    console.log('Using mock tutor service')
    return new MockTutorService()
  }
  return new SupabaseTutorService()
}

// Singleton instance
let tutorServiceInstance: TutorService | null = null

export function getTutorService(): TutorService {
  if (!tutorServiceInstance) {
    tutorServiceInstance = createTutorService()
  }
  return tutorServiceInstance
}
