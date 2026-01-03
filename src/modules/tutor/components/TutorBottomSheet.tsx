import { X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { TutorMessage } from '../types'
import { TUTOR_CONFIG } from '../lib/config'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'

interface TutorBottomSheetProps {
  messages: TutorMessage[]
  isOpen: boolean
  isLoading: boolean
  onClose: () => void
  onSendMessage: (message: string) => void
}

export function TutorBottomSheet({
  messages,
  isOpen,
  isLoading,
  onClose,
  onSendMessage,
}: TutorBottomSheetProps) {
  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-xl shadow-lg',
          'flex flex-col max-h-[70vh] transition-transform duration-200 ease-out',
          isOpen ? 'translate-y-0' : 'translate-y-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label={`Chat with ${TUTOR_CONFIG.name}`}
      >
        {/* Drag handle indicator */}
        <div className="flex justify-center py-2">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <div>
            <h3 className="font-medium text-sm">{TUTOR_CONFIG.name}</h3>
            <p className="text-xs text-muted-foreground">{TUTOR_CONFIG.tagline}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-2"
            aria-label="Close tutor"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <MessageList messages={messages} isLoading={isLoading} />
        </div>

        {/* Input */}
        <MessageInput onSend={onSendMessage} disabled={isLoading} />
      </div>
    </>
  )
}
