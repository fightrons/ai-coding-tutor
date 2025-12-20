import { cn } from '@/shared/lib/utils'
import { AVATAR_EMOJIS } from './Avatar'

interface AvatarPickerProps {
  value: string
  onChange: (emoji: string) => void
}

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {AVATAR_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onChange(emoji)}
          className={cn(
            'h-12 w-12 rounded-lg text-2xl flex items-center justify-center transition-all',
            'hover:bg-muted hover:scale-110',
            value === emoji
              ? 'bg-primary/10 ring-2 ring-primary'
              : 'bg-background border'
          )}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
