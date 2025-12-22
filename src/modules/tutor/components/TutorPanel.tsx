import { X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { TutorMessage } from '../types'
import { TUTOR_CONFIG } from '../lib/config'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'

interface TutorPanelProps {
  messages: TutorMessage[]
  isOpen: boolean
  isLoading: boolean
  onClose: () => void
  onSendMessage: (message: string) => void
}

export function TutorPanel({
  messages,
  isOpen,
  isLoading,
  onClose,
  onSendMessage,
}: TutorPanelProps) {
  return (
    <div
      className={cn(
        'border-l bg-background flex flex-col transition-all duration-200 ease-in-out',
        isOpen ? 'w-[350px]' : 'w-0 overflow-hidden'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div>
          <h3 className="font-medium text-sm">{TUTOR_CONFIG.name}</h3>
          <p className="text-xs text-muted-foreground">{TUTOR_CONFIG.tagline}</p>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground p-1"
          aria-label="Close tutor panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Input */}
      <MessageInput onSend={onSendMessage} disabled={isLoading} />
    </div>
  )
}
