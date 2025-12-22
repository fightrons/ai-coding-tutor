import { cn } from '@/shared/lib/utils'
import type { TutorMessage } from '../types'

interface MessageBubbleProps {
  message: TutorMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isStudent = message.role === 'student'

  return (
    <div
      className={cn('flex', isStudent ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-3 py-2 text-sm',
          isStudent
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  )
}
