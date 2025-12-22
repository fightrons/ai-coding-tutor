import { MessageCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'
import { TUTOR_CONFIG } from '../lib/config'

interface TutorToggleProps {
  isOpen: boolean
  onClick: () => void
  hasNotification?: boolean
}

export function TutorToggle({
  isOpen,
  onClick,
  hasNotification,
}: TutorToggleProps) {
  return (
    <Button
      variant={isOpen ? 'secondary' : 'outline'}
      size="sm"
      onClick={onClick}
      className={cn('relative', isOpen && 'bg-secondary')}
    >
      <MessageCircle className="h-4 w-4 mr-2" />
      Ask {TUTOR_CONFIG.name}
      {hasNotification && (
        <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-primary rounded-full animate-pulse" />
      )}
    </Button>
  )
}
