import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTutorContext } from './useTutorContext'
import type { Lesson } from '@/modules/lesson'
import type { ExecutionResult } from '@/modules/editor'
import type { TutorMessage } from '../types'

// Mock useIdentity and useStudentProfile
vi.mock('@/modules/auth', () => ({
  useIdentity: vi.fn().mockReturnValue({
    displayName: 'Test Student',
  }),
  useStudentProfile: vi.fn().mockReturnValue({
    profile: {
      id: 'profile-1',
      auth_user_id: 'user-1',
      display_name: 'Test Student',
      avatar_emoji: '🦊',
      age_group: '18-25',
      learning_goal: 'build_websites',
      prior_experience: 'some',
      preferred_style: 'examples',
    },
  }),
}))

// Helper to create a minimal lesson
function createLesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    id: 'lesson-1',
    title: 'Introduction to Variables',
    slug: 'intro-to-variables',
    module_id: 'module-1',
    sequence_order: 1,
    difficulty: null,
    estimated_minutes: null,
    prerequisites: null,
    content: {
      sections: [
        { type: 'explanation', text: 'Variables are containers for storing data.' },
        { type: 'code_example', code: 'let x = 5;', output: '5' },
      ],
    },
    exercise: {
      description: 'Create a variable named "name" and assign your name to it.',
      starterCode: '// Your code here',
      solution: 'let name = "Alice"',
      testCases: [
        { name: 'outputs name', expectedOutput: 'Alice' },
      ],
      hints: [
        { level: 1, text: 'Use let or const to declare a variable' },
        { level: 2, text: 'Try: let name = ...' },
      ],
    },
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

// Helper to create execution result
function createResult(overrides: Partial<ExecutionResult> = {}): ExecutionResult {
  return {
    output: 'test output',
    error: null,
    testResults: [],
    allPassed: true,
    ...overrides,
  }
}

// Helper to create a tutor message
function createMessage(overrides: Partial<TutorMessage> = {}): TutorMessage {
  return {
    id: 'msg-1',
    role: 'student',
    content: 'Hello',
    messageType: null,
    createdAt: new Date(),
    ...overrides,
  }
}

describe('useTutorContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('null lesson', () => {
    it('returns null when lesson is null', () => {
      const { result } = renderHook(() =>
        useTutorContext({
          lesson: null,
          currentCode: '',
          lastResult: null,
          messages: [],
          hintLevel: 0,
          attemptCount: 0,
        })
      )

      expect(result.current).toBeNull()
    })
  })

  describe('context building', () => {
    it('includes lesson info in context', () => {
      const lesson = createLesson()

      const { result } = renderHook(() =>
        useTutorContext({
          lesson,
          currentCode: '',
          lastResult: null,
          messages: [],
          hintLevel: 0,
          attemptCount: 0,
        })
      )

      expect(result.current).not.toBeNull()
      expect(result.current?.lessonId).toBe('lesson-1')
      expect(result.current?.lessonTitle).toBe('Introduction to Variables')
    })

    it('extracts lesson content summary from explanation sections', () => {
      const lesson = createLesson({
        content: {
          sections: [
            { type: 'explanation', text: 'This is the first explanation.' },
            { type: 'code_example', code: 'const x = 1;' },
            { type: 'explanation', text: 'This is the second explanation.' },
          ],
        },
      })

      const { result } = renderHook(() =>
        useTutorContext({
          lesson,
          currentCode: '',
          lastResult: null,
          messages: [],
          hintLevel: 0,
          attemptCount: 0,
        })
      )

      expect(result.current?.lessonContent).toContain('first explanation')
      expect(result.current?.lessonContent).toContain('second explanation')
      expect(result.current?.lessonContent).not.toContain('const x')
    })

    it('truncates lesson content to 500 chars', () => {
      const longText = 'A'.repeat(1000)
      const lesson = createLesson({
        content: {
          sections: [{ type: 'explanation', text: longText }],
        },
      })

      const { result } = renderHook(() =>
        useTutorContext({
          lesson,
          currentCode: '',
          lastResult: null,
          messages: [],
          hintLevel: 0,
          attemptCount: 0,
        })
      )

      expect(result.current?.lessonContent.length).toBe(500)
    })

    it('includes exercise description', () => {
      const lesson = createLesson({
        exercise: {
          description: 'Create a greeting function.',
          starterCode: '',
          solution: '',
          testCases: [],
          hints: [],
        },
      })

      const { result } = renderHook(() =>
        useTutorContext({
          lesson,
          currentCode: '',
          lastResult: null,
          messages: [],
          hintLevel: 0,
          attemptCount: 0,
        })
      )

      expect(result.current?.exerciseDescription).toBe('Create a greeting function.')
    })

    it('handles null exercise', () => {
      const lesson = createLesson({ exercise: null })

      const { result } = renderHook(() =>
        useTutorContext({
          lesson,
          currentCode: '',
          lastResult: null,
          messages: [],
          hintLevel: 0,
          attemptCount: 0,
        })
      )

      expect(result.current?.exerciseDescription).toBeNull()
      expect(result.current?.availableHints).toEqual([])
    })

    it('extracts available hints', () => {
      const lesson = createLesson({
        exercise: {
          description: 'Test',
          starterCode: '',
          solution: '',
          testCases: [],
          hints: [
            { level: 1, text: 'Hint 1' },
            { level: 2, text: 'Hint 2' },
          ],
        },
      })

      const { result } = renderHook(() =>
        useTutorContext({
          lesson,
          currentCode: '',
          lastResult: null,
          messages: [],
          hintLevel: 0,
          attemptCount: 0,
        })
      )

      expect(result.current?.availableHints).toEqual(['Hint 1', 'Hint 2'])
    })
  })

  describe('student info', () => {
    it('includes student name from identity', () => {
      const { result } = renderHook(() =>
        useTutorContext({
          lesson: createLesson(),
          currentCode: '',
          lastResult: null,
          messages: [],
          hintLevel: 0,
          attemptCount: 0,
        })
      )

      expect(result.current?.studentName).toBe('Test Student')
    })

    it('includes age group from profile', () => {
      const { result } = renderHook(() =>
        useTutorContext({
          lesson: createLesson(),
          currentCode: '',
          lastResult: null,
          messages: [],
          hintLevel: 0,
          attemptCount: 0,
        })
      )

      expect(result.current?.ageGroup).toBe('18-25')
    })

    it('includes learning goal from profile', () => {
      const { result } = renderHook(() =>
        useTutorContext({
          lesson: createLesson(),
          currentCode: '',
          lastResult: null,
          messages: [],
          hintLevel: 0,
          attemptCount: 0,
        })
      )

      expect(result.current?.learningGoal).toBe('build_websites')
    })

    it('includes prior experience from profile', () => {
      const { result } = renderHook(() =>
        useTutorContext({
          lesson: createLesson(),
          currentCode: '',
          lastResult: null,
          messages: [],
          hintLevel: 0,
          attemptCount: 0,
        })
      )

      expect(result.current?.priorExperience).toBe('some')
    })

    it('includes preferred style from profile', () => {
      const { result } = renderHook(() =>
        useTutorContext({
          lesson: createLesson(),
          currentCode: '',
          lastResult: null,
          messages: [],
          hintLevel: 0,
          attemptCount: 0,
        })
      )

      expect(result.current?.preferredStyle).toBe('examples')
    })
  })

  describe('current state', () => {
    it('includes current code', () => {
      const code = 'let x = 5;\nconsole.log(x);'

      const { result } = renderHook(() =>
        useTutorContext({
          lesson: createLesson(),
          currentCode: code,
          lastResult: null,
          messages: [],
          hintLevel: 0,
          attemptCount: 0,
        })
      )

      expect(result.current?.currentCode).toBe(code)
    })

    it('includes last error from result', () => {
      const { result } = renderHook(() =>
        useTutorContext({
          lesson: createLesson(),
          currentCode: '',
          lastResult: createResult({ error: 'SyntaxError: Unexpected token' }),
          messages: [],
          hintLevel: 0,
          attemptCount: 0,
        })
      )

      expect(result.current?.lastError).toBe('SyntaxError: Unexpected token')
    })

    it('includes attempt count and hint level', () => {
      const { result } = renderHook(() =>
        useTutorContext({
          lesson: createLesson(),
          currentCode: '',
          lastResult: null,
          messages: [],
          hintLevel: 2,
          attemptCount: 5,
        })
      )

      expect(result.current?.attemptCount).toBe(5)
      expect(result.current?.hintLevel).toBe(2)
    })
  })

  describe('test results formatting', () => {
    it('formats test results summary', () => {
      const { result } = renderHook(() =>
        useTutorContext({
          lesson: createLesson(),
          currentCode: '',
          lastResult: createResult({
            testResults: [
              { name: 'test1', passed: true, expected: '5', actual: '5' },
              { name: 'test2', passed: false, expected: 'hello', actual: 'world' },
            ],
          }),
          messages: [],
          hintLevel: 0,
          attemptCount: 0,
        })
      )

      expect(result.current?.testResults).toContain('1/2 passed')
      expect(result.current?.testResults).toContain('test2')
      expect(result.current?.testResults).toContain('expected "hello"')
      expect(result.current?.testResults).toContain('got "world"')
    })

    it('shows all passed when all tests pass', () => {
      const { result } = renderHook(() =>
        useTutorContext({
          lesson: createLesson(),
          currentCode: '',
          lastResult: createResult({
            testResults: [
              { name: 'test1', passed: true, expected: '5', actual: '5' },
              { name: 'test2', passed: true, expected: 'hello', actual: 'hello' },
            ],
          }),
          messages: [],
          hintLevel: 0,
          attemptCount: 0,
        })
      )

      expect(result.current?.testResults).toBe('2/2 passed')
    })

    it('returns null test results when no test results', () => {
      const { result } = renderHook(() =>
        useTutorContext({
          lesson: createLesson(),
          currentCode: '',
          lastResult: createResult({ testResults: [] }),
          messages: [],
          hintLevel: 0,
          attemptCount: 0,
        })
      )

      expect(result.current?.testResults).toBeNull()
    })

    it('returns null test results when lastResult is null', () => {
      const { result } = renderHook(() =>
        useTutorContext({
          lesson: createLesson(),
          currentCode: '',
          lastResult: null,
          messages: [],
          hintLevel: 0,
          attemptCount: 0,
        })
      )

      expect(result.current?.testResults).toBeNull()
    })
  })

  describe('recent messages', () => {
    it('includes recent messages', () => {
      const messages = [
        createMessage({ id: 'msg-1', content: 'Hello' }),
        createMessage({ id: 'msg-2', content: 'How are you?' }),
      ]

      const { result } = renderHook(() =>
        useTutorContext({
          lesson: createLesson(),
          currentCode: '',
          lastResult: null,
          messages,
          hintLevel: 0,
          attemptCount: 0,
        })
      )

      expect(result.current?.recentMessages).toHaveLength(2)
      expect(result.current?.recentMessages[0].content).toBe('Hello')
    })

    it('limits to last 10 messages', () => {
      const messages = Array.from({ length: 15 }, (_, i) =>
        createMessage({ id: `msg-${i}`, content: `Message ${i}` })
      )

      const { result } = renderHook(() =>
        useTutorContext({
          lesson: createLesson(),
          currentCode: '',
          lastResult: null,
          messages,
          hintLevel: 0,
          attemptCount: 0,
        })
      )

      expect(result.current?.recentMessages).toHaveLength(10)
      // Should have the last 10 (5-14)
      expect(result.current?.recentMessages[0].content).toBe('Message 5')
      expect(result.current?.recentMessages[9].content).toBe('Message 14')
    })
  })

  describe('memoization', () => {
    it('returns same context reference when inputs unchanged', () => {
      const lesson = createLesson()
      const messages: TutorMessage[] = []

      const { result, rerender } = renderHook(
        (props) => useTutorContext(props),
        {
          initialProps: {
            lesson,
            currentCode: 'code',
            lastResult: null,
            messages,
            hintLevel: 0,
            attemptCount: 0,
          },
        }
      )

      const firstContext = result.current

      // Rerender with same inputs
      rerender({
        lesson,
        currentCode: 'code',
        lastResult: null,
        messages,
        hintLevel: 0,
        attemptCount: 0,
      })

      // Should be the same object reference (memoized)
      expect(result.current).toBe(firstContext)
    })

    it('returns new context when code changes', () => {
      const lesson = createLesson()
      const messages: TutorMessage[] = []

      const { result, rerender } = renderHook(
        (props) => useTutorContext(props),
        {
          initialProps: {
            lesson,
            currentCode: 'code1',
            lastResult: null,
            messages,
            hintLevel: 0,
            attemptCount: 0,
          },
        }
      )

      const firstContext = result.current

      // Rerender with different code
      rerender({
        lesson,
        currentCode: 'code2',
        lastResult: null,
        messages,
        hintLevel: 0,
        attemptCount: 0,
      })

      // Should be a different object
      expect(result.current).not.toBe(firstContext)
      expect(result.current?.currentCode).toBe('code2')
    })
  })
})
