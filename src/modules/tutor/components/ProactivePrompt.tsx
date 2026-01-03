import { X } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

interface ProactivePromptProps {
  onAccept: () => void
  onDismiss: () => void
  /** Position variant: bottom-right (desktop) or bottom-center (mobile) */
  position?: 'bottom-right' | 'bottom-center'
}

export function ProactivePrompt({ onAccept, onDismiss, position = 'bottom-right' }: ProactivePromptProps) {
  return (
    <div
      className={cn(
        'absolute max-w-[280px] p-4 bg-background border rounded-lg shadow-lg animate-in duration-300',
        position === 'bottom-center'
          ? 'bottom-20 left-1/2 -translate-x-1/2 slide-in-from-bottom-5'
          : 'bottom-4 right-4 slide-in-from-right-5'
      )}
    >
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
