import { X } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

interface ProactivePromptProps {
  onAccept: () => void
  onDismiss: () => void
}

export function ProactivePrompt({ onAccept, onDismiss }: ProactivePromptProps) {
  return (
    <div className="absolute bottom-4 right-4 max-w-[280px] p-4 bg-background border rounded-lg shadow-lg animate-in slide-in-from-right-5 duration-300">
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <p className="text-sm mb-3 pr-4">
        It looks like you're working hard on this. Would you like a hint?
      </p>

      <div className="flex gap-2">
        <Button size="sm" onClick={onAccept}>
          Yes, help me
        </Button>
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          I'm okay
        </Button>
      </div>
    </div>
  )
}
