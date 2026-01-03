import { Link } from 'react-router-dom'
import { ArrowLeft, BookOpen, Code } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export type LessonTabType = 'learn' | 'code'

interface LessonTabsProps {
  activeTab: LessonTabType
  onTabChange: (tab: LessonTabType) => void
}

const tabs = [
  { id: 'learn' as const, label: 'Learn', icon: BookOpen },
  { id: 'code' as const, label: 'Code', icon: Code },
]

export function LessonTabs({ activeTab, onTabChange }: LessonTabsProps) {
  return (
    <div className="flex border-b bg-background">
      {/* Back button */}
      <Link
        to="/learn"
        className="flex items-center justify-center px-3 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Back to dashboard"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      {/* Tabs */}
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
            activeTab === tab.id
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <tab.icon className="h-4 w-4" />
          {tab.label}
        </button>
      ))}
    </div>
  )
}
