import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MockTutorService } from './tutor-service'
import type { TutorContext, TutorRequest } from '../types'

// Helper to create a minimal TutorContext
function createContext(overrides: Partial<TutorContext> = {}): TutorContext {
  return {
    lessonId: 'lesson-1',
    lessonTitle: 'Variables',
    lessonContent: 'Learn about variables in JavaScript',
    exerciseDescription: 'Create a variable and print it',
    availableHints: ['Think about var, let, const', 'Use console.log'],
    studentName: 'Test Student',
    ageGroup: null,
    learningGoal: null,
    priorExperience: null,
    preferredStyle: null,
    currentCode: 'let x = 5',
    lastError: null,
    testResults: null,
    attemptCount: 0,
    hintLevel: 0,
    recentMessages: [],
    ...overrides,
  }
}

// Helper to create a TutorRequest
function createRequest(
  userMessage: string,
  contextOverrides: Partial<TutorContext> = {}
): TutorRequest {
  return {
    context: createContext(contextOverrides),
    userMessage,
  }
}

describe('MockTutorService', () => {
  let service: MockTutorService

  beforeEach(() => {
    service = new MockTutorService()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('generateResponse', () => {
    it('returns a response with content and messageType', async () => {
      const request = createRequest('Can you help me?')

      const promise = service.generateResponse(request)
      vi.advanceTimersByTime(1500) // Max delay
      const response = await promise

      expect(response.content).toBeDefined()
      expect(response.content.length).toBeGreaterThan(0)
      expect(response.messageType).toBeDefined()
    })

    describe('syntax error detection', () => {
      it('provides syntax error help when lastError contains SyntaxError', async () => {
        const request = createRequest('Help me', {
          lastError: 'SyntaxError: Unexpected token',
        })

        const promise = service.generateResponse(request)
        vi.advanceTimersByTime(1500)
        const response = await promise

        expect(response.messageType).toBe('hint')
        expect(response.content.toLowerCase()).toContain('syntax')
      })

      it('provides generic error help for other errors', async () => {
        const request = createRequest('Help', {
          lastError: 'ReferenceError: x is not defined',
        })

        const promise = service.generateResponse(request)
        vi.advanceTimersByTime(1500)
        const response = await promise

        expect(response.messageType).toBe('hint')
      })
    })

    describe('test failure detection', () => {
      it('provides help when tests are failing', async () => {
        // Note: The service checks if testResults doesn't include 'passed'
        // So we use a string that doesn't contain that word
        const request = createRequest('What am I doing wrong?', {
          testResults: '0/3 tests. Failing: expected "5", got "undefined"',
        })

        const promise = service.generateResponse(request)
        vi.advanceTimersByTime(1500)
        const response = await promise

        expect(response.messageType).toBe('hint')
      })

      it('does not trigger test help when tests are passing', async () => {
        const request = createRequest('What next?', {
          testResults: '3/3 passed',
        })

        const promise = service.generateResponse(request)
        vi.advanceTimersByTime(1500)
        const response = await promise

        // Should get general help, not test failure help
        expect(response.messageType).toBe('explanation')
      })
    })

    describe('hint requests', () => {
      it('provides hint when message contains "hint"', async () => {
        const request = createRequest('Can I get a hint?')

        const promise = service.generateResponse(request)
        vi.advanceTimersByTime(1500)
        const response = await promise

        expect(response.messageType).toBe('hint')
      })

      it('provides hint when message contains "help"', async () => {
        const request = createRequest('I need help')

        const promise = service.generateResponse(request)
        vi.advanceTimersByTime(1500)
        const response = await promise

        expect(response.messageType).toBe('hint')
      })

      it('provides hint when message contains "stuck"', async () => {
        const request = createRequest("I'm stuck on this problem")

        const promise = service.generateResponse(request)
        vi.advanceTimersByTime(1500)
        const response = await promise

        expect(response.messageType).toBe('hint')
      })

      describe('progressive hints based on hintLevel', () => {
        it('provides level 1 hint when hintLevel is 0', async () => {
          const request = createRequest('hint please', { hintLevel: 0 })

          const promise = service.generateResponse(request)
          vi.advanceTimersByTime(1500)
          const response = await promise

          expect(response.messageType).toBe('hint')
          // Level 1 hints are more vague
          expect(response.content).toBeDefined()
        })

        it('provides level 2 hint when hintLevel is 1', async () => {
          const request = createRequest('another hint', { hintLevel: 1 })

          const promise = service.generateResponse(request)
          vi.advanceTimersByTime(1500)
          const response = await promise

          expect(response.messageType).toBe('hint')
        })

        it('provides level 3 hint when hintLevel is 2 or more', async () => {
          const request = createRequest('one more hint', { hintLevel: 2 })

          const promise = service.generateResponse(request)
          vi.advanceTimersByTime(1500)
          const response = await promise

          expect(response.messageType).toBe('hint')
        })
      })
    })

    describe('encouragement detection', () => {
      it('provides encouragement when message contains "frustrated"', async () => {
        const request = createRequest("I'm so frustrated with this!")

        const promise = service.generateResponse(request)
        vi.advanceTimersByTime(1500)
        const response = await promise

        expect(response.messageType).toBe('encouragement')
      })

      it('provides encouragement when message contains "can\'t"', async () => {
        const request = createRequest("I can't figure this out")

        const promise = service.generateResponse(request)
        vi.advanceTimersByTime(1500)
        const response = await promise

        expect(response.messageType).toBe('encouragement')
      })

      it('provides encouragement when message contains "hard"', async () => {
        const request = createRequest('This is really hard')

        const promise = service.generateResponse(request)
        vi.advanceTimersByTime(1500)
        const response = await promise

        expect(response.messageType).toBe('encouragement')
      })
    })

    describe('default response', () => {
      it('provides general help for neutral messages', async () => {
        const request = createRequest('Tell me about this exercise')

        const promise = service.generateResponse(request)
        vi.advanceTimersByTime(1500)
        const response = await promise

        expect(response.messageType).toBe('explanation')
      })
    })

    describe('priority order', () => {
      it('prioritizes error over hint request', async () => {
        // If there's an error AND user asks for hint, error handling takes priority
        const request = createRequest('Can I get a hint?', {
          lastError: 'SyntaxError: Unexpected end',
        })

        const promise = service.generateResponse(request)
        vi.advanceTimersByTime(1500)
        const response = await promise

        // Should respond to the error first
        expect(response.messageType).toBe('hint')
        expect(response.content.toLowerCase()).toContain('syntax')
      })
    })
  })
})
