// Components
export { TutorPanel } from './components/TutorPanel'
export { TutorBottomSheet } from './components/TutorBottomSheet'
export { TutorToggle } from './components/TutorToggle'
export { ProactivePrompt } from './components/ProactivePrompt'
export { MessageList } from './components/MessageList'
export { MessageBubble } from './components/MessageBubble'
export { MessageInput } from './components/MessageInput'

// Hooks
export { useTutorMessages } from './hooks/useTutorMessages'
export { useTutorContext } from './hooks/useTutorContext'
export { useExerciseAttempts } from './hooks/useExerciseAttempts'
export { useTutorChat } from './hooks/useTutorChat'

// Lib
export { getTutorService, createTutorService } from './lib/tutor-service'
export type { TutorService } from './lib/tutor-service'
export { TUTOR_CONFIG } from './lib/config'

// Types
export type {
  TutorMessage,
  TutorMessageRow,
  TutorContext,
  TutorRequest,
  TutorResponse,
  MessageRole,
  MessageType,
  AttemptState,
} from './types'
