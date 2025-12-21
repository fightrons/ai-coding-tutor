import { useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { EditorPanel } from '@/modules/editor'
import { useLesson } from '../hooks/useLesson'
import { useProgress } from '../hooks/useProgress'
import { LessonContent } from './LessonContent'
import { ExercisePanel } from './ExercisePanel'
import logo from '@/assets/logo.png'

interface LessonLayoutProps {
  slug: string
}

export function LessonLayout({ slug }: LessonLayoutProps) {
  const { lesson, module, loading, error } = useLesson(slug)
  const { startLesson, completeLesson, getStatus } = useProgress()

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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b px-6 py-3 flex items-center gap-4">
        <Link to="/learn" className="flex items-center gap-1 shrink-0">
          <img src={logo} alt="AI Coding Tutor" className="h-4 w-auto" />
        </Link>
        <div className="h-6 w-px bg-border" />
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
      </header>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Left panel: Lesson content */}
        <div className="flex-1 p-6 border-r overflow-y-auto">
          <LessonContent content={lesson.content} />

          {/* Exercise description below content */}
          {lesson.exercise && (
            <div className="mt-8">
              <ExercisePanel exercise={lesson.exercise} />
            </div>
          )}

          {/* Completion indicator */}
          {isCompleted && (
            <div className="mt-8 pt-6 border-t">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Lesson Complete</span>
              </div>
            </div>
          )}
        </div>

        {/* Right panel: Code editor */}
        <div className="flex-1">
          {lesson.exercise ? (
            <EditorPanel
              starterCode={lesson.exercise.starterCode}
              testCases={lesson.exercise.testCases}
              onAllTestsPass={handleAllTestsPass}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground bg-muted/30">
              <p>No exercise for this lesson</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
