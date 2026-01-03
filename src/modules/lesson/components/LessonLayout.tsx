import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, MessageCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useBreakpoint } from '@/shared/hooks'
import { EditorPanel, type ExecutionResult } from '@/modules/editor'
import { Header } from '@/modules/layout'
import { useIdentity } from '@/modules/auth'
import { TutorPanel, TutorToggle, ProactivePrompt, TutorBottomSheet, useTutorChat } from '@/modules/tutor'
import { useLesson } from '../hooks/useLesson'
import { useProgress } from '../hooks/useProgress'
import { LessonContent } from './LessonContent'
import { ExercisePanel } from './ExercisePanel'
import { LessonTabs, type LessonTabType } from './LessonTabs'

interface LessonLayoutProps {
  slug: string
}

export function LessonLayout({ slug }: LessonLayoutProps) {
  const { type } = useIdentity()
  const { lesson, module, loading, error } = useLesson(slug)
  const { startLesson, completeLesson, getStatus } = useProgress()
  const { isMobile, isTablet, isDesktop } = useBreakpoint()

  // Track if component has mounted (to avoid rendering editor before breakpoint is stable)
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Mobile tab state
  const [activeTab, setActiveTab] = useState<LessonTabType>('learn')

  // Track code and results for tutor context (lifted state for tab persistence)
  const [currentCode, setCurrentCode] = useState('')
  const [lastResult, setLastResult] = useState<ExecutionResult | null>(null)

  // Track which lesson's starter code we've initialized
  const initializedLessonRef = useRef<string | null>(null)

  // Initialize code when lesson changes - using layout effect to run synchronously
  // before paint to avoid flash of empty editor
  useEffect(() => {
    if (lesson?.exercise?.starterCode && initializedLessonRef.current !== lesson.id) {
      initializedLessonRef.current = lesson.id
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentCode(lesson.exercise.starterCode)
    }
  }, [lesson?.id, lesson?.exercise?.starterCode])

  // Prevent keyboard from appearing on mobile by intercepting focus events
  useEffect(() => {
    if (!isMobile && !isTablet) return

    // Blur immediately
    ;(document.activeElement as HTMLElement)?.blur()

    // Intercept any focus events on input-like elements for a short period
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      const tagName = target.tagName?.toLowerCase()

      // Only blur if it's an input-like element (would trigger keyboard)
      // Also check for Monaco's hidden textarea (has class 'inputarea')
      if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        target.isContentEditable ||
        target.classList?.contains('inputarea')
      ) {
        e.preventDefault()
        e.stopPropagation()
        target.blur()
      }
    }

    // Add listener in capture phase to catch focus early
    document.addEventListener('focus', handleFocus, true)

    // Remove after a longer delay (allow user-initiated focus later)
    const timer = setTimeout(() => {
      document.removeEventListener('focus', handleFocus, true)
    }, 2000)

    return () => {
      document.removeEventListener('focus', handleFocus, true)
      clearTimeout(timer)
    }
  }, [isMobile, isTablet])

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

  // Shared lesson content panel
  const lessonContentPanel = (
    <>
      {/* Lesson title bar */}
      <div className="sticky top-0 bg-background border-b px-6 py-3 flex items-center gap-4">
        {/* Back button - hidden on mobile (back is in tabs) */}
        {!isMobile && (
          <Button asChild variant="ghost" size="sm">
            <Link to="/learn">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        )}
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
              <Button asChild variant="ghost" size="sm">
                <Link to="/learn">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Dashboard
                </Link>
              </Button>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Lesson Complete</span>
              </div>
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
    </>
  )

  // Shared editor panel - only render after mount to prevent keyboard on mobile
  const editorPanel = lesson.exercise && mounted ? (
    <EditorPanel
      starterCode={lesson.exercise.starterCode}
      code={currentCode}
      testCases={lesson.exercise.testCases}
      onAllTestsPass={handleAllTestsPass}
      onCodeChange={setCurrentCode}
      onResult={setLastResult}
      minEditorHeight={isMobile ? '300px' : undefined}
      preventAutoFocus={isMobile || isTablet}
      toolbarExtra={
        // Hide tutor toggle from toolbar on mobile (it's at the bottom instead)
        !isMobile ? (
          <TutorToggle
            isOpen={tutor.isOpen}
            onClick={tutor.toggle}
            hasNotification={tutor.shouldShowPrompt}
          />
        ) : undefined
      }
    />
  ) : (
    <div className="h-full flex items-center justify-center text-muted-foreground bg-muted/30">
      <p>No exercise for this lesson</p>
    </div>
  )

  // Tutor props shared across layouts
  const tutorProps = {
    messages: tutor.messages,
    isOpen: tutor.isOpen,
    isLoading: tutor.isLoading,
    onClose: tutor.close,
    onSendMessage: tutor.sendMessage,
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header - fixed */}
      <Header />

      {/* Mobile layout: tabbed navigation */}
      {isMobile && (
        <>
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <LessonTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {activeTab === 'learn' && (
              <div className="flex-1 min-h-0 overflow-y-auto">
                {lessonContentPanel}
              </div>
            )}

            {activeTab === 'code' && (
              <div className="flex-1 min-h-0 overflow-hidden relative">
                {editorPanel}
                {/* Proactive help prompt */}
                {tutor.shouldShowPrompt && (
                  <ProactivePrompt
                    onAccept={tutor.acceptPrompt}
                    onDismiss={tutor.dismissPrompt}
                    position="bottom-center"
                  />
                )}
              </div>
            )}
          </div>

          {/* Floating Ask Anu button - fixed at bottom right */}
          <Button
            onClick={tutor.toggle}
            variant={tutor.isOpen ? 'secondary' : 'default'}
            size="lg"
            className="fixed bottom-4 right-4 z-30 rounded-full h-14 w-14 p-0 shadow-lg"
          >
            <MessageCircle className="h-6 w-6" />
            {tutor.shouldShowPrompt && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full animate-pulse" />
            )}
          </Button>

          {/* Tutor bottom sheet for mobile */}
          <TutorBottomSheet {...tutorProps} />
        </>
      )}

      {/* Tablet layout: 40/60 split with bottom sheet */}
      {isTablet && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left panel: 40% */}
          <div className="w-2/5 border-r overflow-y-auto">
            {lessonContentPanel}
          </div>

          {/* Right panel: 60% */}
          <div className="w-3/5 overflow-hidden relative">
            {editorPanel}
            {/* Proactive help prompt */}
            {tutor.shouldShowPrompt && (
              <ProactivePrompt
                onAccept={tutor.acceptPrompt}
                onDismiss={tutor.dismissPrompt}
              />
            )}
          </div>

          {/* Tutor bottom sheet for tablet */}
          <TutorBottomSheet {...tutorProps} />
        </div>
      )}

      {/* Desktop layout: 50/50 split with sidebar */}
      {isDesktop && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left panel: Lesson content */}
          <div className="flex-1 border-r overflow-y-auto">
            {lessonContentPanel}
          </div>

          {/* Right panel: Code editor + Tutor sidebar */}
          <div className="flex-1 flex overflow-hidden relative">
            <div className="flex-1 overflow-hidden">
              {editorPanel}
            </div>

            {/* Tutor sidebar */}
            <TutorPanel {...tutorProps} />

            {/* Proactive help prompt */}
            {tutor.shouldShowPrompt && (
              <ProactivePrompt
                onAccept={tutor.acceptPrompt}
                onDismiss={tutor.dismissPrompt}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
