import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { EditorPanel, type ExecutionResult } from '@/modules/editor'
import { Header } from '@/modules/layout'
import { useIdentity } from '@/modules/auth'
import { TutorPanel, TutorToggle, ProactivePrompt, useTutorChat } from '@/modules/tutor'
import { useLesson } from '../hooks/useLesson'
import { useProgress } from '../hooks/useProgress'
import { LessonContent } from './LessonContent'
import { ExercisePanel } from './ExercisePanel'

interface LessonLayoutProps {
  slug: string
}

export function LessonLayout({ slug }: LessonLayoutProps) {
  const { type } = useIdentity()
  const { lesson, module, loading, error } = useLesson(slug)
  const { startLesson, completeLesson, getStatus } = useProgress()

  // Track code and results for tutor context
  const [currentCode, setCurrentCode] = useState('')
  const [lastResult, setLastResult] = useState<ExecutionResult | null>(null)

  // Tutor chat state
  const tutor = useTutorChat({
    lesson,
    currentCode,
    lastResult,
  })

  const status = lesson ? getStatus(lesson.id) : 'not_started'
  const isCompleted = status === 'completed'

  // Mark lesson as started when loaded
  useEffect(() => {
    if (lesson && getStatus(lesson.id) === 'not_started') {
      startLesson(lesson.id)
    }
  }, [lesson, getStatus, startLesson])

  const handleAllTestsPass = useCallback(async () => {
    if (!lesson || isCompleted) return
    await completeLesson(lesson.id)
  }, [lesson, isCompleted, completeLesson])

  if (loading) {
    return (
      <div className="min-h-screen flex">
        <div className="flex-1 p-6 border-r space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    )
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error || 'Lesson not found'}</p>
          <Button asChild variant="outline">
            <Link to="/learn">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header - fixed */}
      <Header />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel: Lesson content - scrollable */}
        <div className="flex-1 border-r overflow-y-auto">
          {/* Lesson title bar */}
          <div className="sticky top-0 bg-background border-b px-6 py-3 flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link to="/learn">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              {module && (
                <p className="text-xs text-muted-foreground">{module.title}</p>
              )}
              <h1 className="font-semibold">{lesson.title}</h1>
            </div>
          </div>

          <div className="p-6">
            <LessonContent content={lesson.content} />

            {/* Exercise description below content */}
            {lesson.exercise && (
              <div className="mt-8">
                <ExercisePanel exercise={lesson.exercise} />
              </div>
            )}

            {/* Completion indicator */}
            {isCompleted && (
              <div className="mt-8 pt-6 border-t space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Lesson Complete</span>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/learn">
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Back to Dashboard
                    </Link>
                  </Button>
                </div>

                {/* Registration prompt for code-based users */}
                {type === 'code_based' && (
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <p className="text-sm mb-3">
                      Great progress! Register to skip entering your code and keep your profile active forever.
                    </p>
                    <Button asChild size="sm">
                      <Link to="/register">Register for free</Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right panel: Code editor + Tutor sidebar */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Editor section */}
          <div className="flex-1 overflow-hidden">
            {lesson.exercise ? (
              <EditorPanel
                starterCode={lesson.exercise.starterCode}
                testCases={lesson.exercise.testCases}
                onAllTestsPass={handleAllTestsPass}
                onCodeChange={setCurrentCode}
                onResult={setLastResult}
                toolbarExtra={
                  <TutorToggle
                    isOpen={tutor.isOpen}
                    onClick={tutor.toggle}
                    hasNotification={tutor.shouldShowPrompt}
                  />
                }
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground bg-muted/30">
                <p>No exercise for this lesson</p>
              </div>
            )}
          </div>

          {/* Tutor sidebar */}
          <TutorPanel
            messages={tutor.messages}
            isOpen={tutor.isOpen}
            isLoading={tutor.isLoading}
            onClose={tutor.close}
            onSendMessage={tutor.sendMessage}
          />

          {/* Proactive help prompt */}
          {tutor.shouldShowPrompt && (
            <ProactivePrompt
              onAccept={tutor.acceptPrompt}
              onDismiss={tutor.dismissPrompt}
            />
          )}
        </div>
      </div>
    </div>
  )
}
