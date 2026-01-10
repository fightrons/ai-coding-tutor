// Components
export { LessonContent } from './components/LessonContent'
export { ExercisePanel } from './components/ExercisePanel'
export { LessonLayout } from './components/LessonLayout'
export { LessonTabs, type LessonTabType } from './components/LessonTabs'
export { ModuleCard } from './components/ModuleCard'

// Hooks
export { useModules } from './hooks/useModules'
export { useLesson } from './hooks/useLesson'
export { useProgress } from './hooks/useProgress'
export { useAttemptPersistenceListener } from './hooks/useAttemptPersistence'

// Types
export type {
  ModuleRow,
  LessonRow,
  ProgressRow,
  ContentSection,
  LessonContent as LessonContentType,
  TestCase,
  Hint,
  Exercise,
  Lesson,
  ModuleWithLessons,
  ProgressStatus,
} from './types'
