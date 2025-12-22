import { useState, type KeyboardEvent } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'

interface MessageInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export function MessageInput({
  onSend,
  disabled,
  placeholder = 'Ask a question...',
}: MessageInputProps) {
  const [value, setValue] = useState('')

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (trimmed && !disabled) {
      onSend(trimmed)
      setValue('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="border-t p-3">
      <div className="flex gap-2">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[44px] max-h-[120px] resize-none text-sm"
          rows={1}
        />
        <Button
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          size="icon"
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  )
}
