import type { Database } from '@/shared/types/database'
import type { ExecutionResult } from '@/modules/editor'

// Database row types
export type TutorMessageRow = Database['public']['Tables']['tutor_messages']['Row']
export type TutorMessageInsert = Database['public']['Tables']['tutor_messages']['Insert']

// Message roles
export type MessageRole = 'student' | 'tutor'

// Message types for different tutor behaviors
export type MessageType =
  | 'question'
  | 'hint'
  | 'explanation'
  | 'encouragement'
  | 'proactive'

// Parsed message for UI
export interface TutorMessage {
  id: string
  role: MessageRole
  content: string
  messageType: MessageType | null
  createdAt: Date
}

// Context passed to AI for generating responses
export interface TutorContext {
  // Lesson info
  lessonId: string
  lessonTitle: string
  lessonContent: string
  exerciseDescription: string | null
  availableHints: string[]

  // Student info
  studentName: string
  learningGoal: string | null
  priorExperience: string | null
  preferredStyle: string | null

  // Current state
  currentCode: string
  lastError: string | null
  testResults: string | null
  attemptCount: number
  hintLevel: number

  // Conversation history
  recentMessages: TutorMessage[]
}

// AI service request/response
export interface TutorRequest {
  context: TutorContext
  userMessage: string
}

export interface TutorResponse {
  content: string
  messageType: MessageType
}

// Attempt tracking for proactive engagement
export interface AttemptState {
  attemptCount: number
  consecutiveFailures: number
  lastError: string | null
  lastCode: string | null
  lastResult: ExecutionResult | null
  shouldPromptHelp: boolean
  hintLevel: number
}

// Helper to convert database row to TutorMessage
export function toTutorMessage(row: TutorMessageRow): TutorMessage {
  return {
    id: row.id,
    role: row.role as MessageRole,
    content: row.content,
    messageType: row.message_type as MessageType | null,
    createdAt: new Date(row.created_at || Date.now()),
  }
}
