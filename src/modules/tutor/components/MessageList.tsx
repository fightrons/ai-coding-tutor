import { useRef, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import type { TutorMessage } from '../types'
import { TUTOR_CONFIG } from '../lib/config'
import { MessageBubble } from './MessageBubble'

interface MessageListProps {
  messages: TutorMessage[]
  isLoading: boolean
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 text-center">
        <div className="text-muted-foreground text-sm">
          <p className="mb-2">Hi! I'm {TUTOR_CONFIG.name}, {TUTOR_CONFIG.tagline.toLowerCase()}.</p>
          <p>Ask me anything about this lesson or exercise.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-muted rounded-lg px-3 py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        </div>
      )}

      <div ref={scrollRef} />
    </div>
  )
}
