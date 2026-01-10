// Event data types for the application event bus

export type AttemptData = {
  studentId: string
  lessonId: string
  exerciseId: string
  code: string
  passed: boolean
  testResults: unknown
  errorMessage: string | null
  timeSpentSeconds: number
  hintLevel: number
  isFirstAttempt: boolean
}

export type LessonCompletedData = {
  studentId: string
  lessonId: string
  timeSeconds: number
}

export type CodeRunData = {
  studentId: string
  lessonId: string
  hasErrors: boolean
}

export type ErrorFixedData = {
  studentId: string
  lessonId: string
  errorType: string
}

export type HintUsedData = {
  studentId: string
  lessonId: string
  hintLevel: number
}

// Union type for all application events
export type AppEvent =
  | { name: 'exercise:attempt_recorded'; data: AttemptData }
  | { name: 'lesson:completed'; data: LessonCompletedData }
  | { name: 'code:run_executed'; data: CodeRunData }
  | { name: 'error:fixed'; data: ErrorFixedData }
  | { name: 'hint:used'; data: HintUsedData }

// Extract event names and data types
export type EventName = AppEvent['name']
export type EventData<T extends EventName> = Extract<AppEvent, { name: T }>['data']

// Callback type for subscribers
export type EventCallback<T extends EventName> = (data: EventData<T>) => void
