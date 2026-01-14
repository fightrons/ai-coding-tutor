import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AchievementCard } from './AchievementCard'
import type { Achievement } from '../types'

const mockAchievement: Achievement = {
  id: 'ach-1',
  slug: 'first-lesson',
  title: 'First Steps',
  description: 'Complete your first lesson',
  icon: '🎯',
  xp_reward: 50,
  criteria: { type: 'lessons_completed', threshold: 1 },
  category: 'general',
  created_at: '2024-01-01T00:00:00Z',
}

describe('AchievementCard', () => {
  describe('unlocked achievement', () => {
    it('renders achievement title', () => {
      render(<AchievementCard achievement={mockAchievement} isUnlocked />)
      expect(screen.getByText('First Steps')).toBeInTheDocument()
    })

    it('renders achievement description', () => {
      render(<AchievementCard achievement={mockAchievement} isUnlocked />)
      expect(screen.getByText('Complete your first lesson')).toBeInTheDocument()
    })

    it('renders achievement icon', () => {
      render(<AchievementCard achievement={mockAchievement} isUnlocked />)
      expect(screen.getByText('🎯')).toBeInTheDocument()
    })

    it('shows earned date when provided', () => {
      render(
        <AchievementCard
          achievement={mockAchievement}
          isUnlocked
          earnedAt="2024-06-15T10:30:00Z"
        />
      )
      expect(screen.getByText(/Earned/)).toBeInTheDocument()
    })

    it('shows checkmark for unlocked achievement', () => {
      render(<AchievementCard achievement={mockAchievement} isUnlocked />)
      expect(screen.getByText('✓')).toBeInTheDocument()
    })

    it('does not show XP reward when unlocked', () => {
      render(<AchievementCard achievement={mockAchievement} isUnlocked />)
      expect(screen.queryByText('+50 XP')).not.toBeInTheDocument()
    })

    it('does not apply grayscale when unlocked', () => {
      const { container } = render(
        <AchievementCard achievement={mockAchievement} isUnlocked />
      )
      expect(container.querySelector('.grayscale')).not.toBeInTheDocument()
    })
  })

  describe('locked achievement', () => {
    it('renders achievement title', () => {
      render(<AchievementCard achievement={mockAchievement} isUnlocked={false} />)
      expect(screen.getByText('First Steps')).toBeInTheDocument()
    })

    it('shows XP reward for locked achievement', () => {
      render(<AchievementCard achievement={mockAchievement} isUnlocked={false} />)
      expect(screen.getByText('+50 XP')).toBeInTheDocument()
    })

    it('does not show checkmark for locked achievement', () => {
      render(<AchievementCard achievement={mockAchievement} isUnlocked={false} />)
      expect(screen.queryByText('✓')).not.toBeInTheDocument()
    })

    it('applies grayscale and reduced opacity when locked', () => {
      const { container } = render(
        <AchievementCard achievement={mockAchievement} isUnlocked={false} />
      )
      expect(container.querySelector('.grayscale')).toBeInTheDocument()
      expect(container.querySelector('.opacity-60')).toBeInTheDocument()
    })

    it('does not show earned date when locked', () => {
      render(
        <AchievementCard
          achievement={mockAchievement}
          isUnlocked={false}
          earnedAt="2024-06-15T10:30:00Z"
        />
      )
      expect(screen.queryByText(/Earned/)).not.toBeInTheDocument()
    })
  })

  describe('sizes', () => {
    it('applies sm size classes', () => {
      const { container } = render(
        <AchievementCard achievement={mockAchievement} isUnlocked size="sm" />
      )
      expect(container.querySelector('.p-3')).toBeInTheDocument()
      expect(container.querySelector('.h-10')).toBeInTheDocument()
    })

    it('applies md size classes (default)', () => {
      const { container } = render(
        <AchievementCard achievement={mockAchievement} isUnlocked />
      )
      expect(container.querySelector('.p-4')).toBeInTheDocument()
      expect(container.querySelector('.h-12')).toBeInTheDocument()
    })
  })

  it('applies custom className', () => {
    const { container } = render(
      <AchievementCard achievement={mockAchievement} isUnlocked className="custom-class" />
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('handles achievement with 0 XP reward', () => {
    const noXpAchievement = { ...mockAchievement, xp_reward: 0 }
    render(<AchievementCard achievement={noXpAchievement} isUnlocked={false} />)
    expect(screen.queryByText('+0 XP')).not.toBeInTheDocument()
  })
})
