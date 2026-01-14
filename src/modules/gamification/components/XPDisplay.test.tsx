import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { XPDisplay } from './XPDisplay'
import type { Level } from '../lib/xp-system'

const mockLevel: Level = {
  level: 2,
  xp: 150,
  title: 'Explorer',
  icon: '🌿',
  color: '#22C55E',
}

describe('XPDisplay', () => {
  const defaultProps = {
    currentXP: 200,
    nextLevelXP: 400,
    progressPercent: 33,
    xpToNextLevel: 200,
    currentLevel: mockLevel,
  }

  describe('full display mode', () => {
    it('renders current XP', () => {
      render(<XPDisplay {...defaultProps} />)
      expect(screen.getByText('200 XP')).toBeInTheDocument()
    })

    it('renders XP to next level', () => {
      render(<XPDisplay {...defaultProps} />)
      expect(screen.getByText('200 to Level 3')).toBeInTheDocument()
    })

    it('renders progress bar', () => {
      const { container } = render(<XPDisplay {...defaultProps} />)
      const progressBar = container.querySelector('.rounded-full.transition-all')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveStyle({ width: '33%' })
    })

    it('renders level indicators', () => {
      render(<XPDisplay {...defaultProps} />)
      expect(screen.getByText('Level 2')).toBeInTheDocument()
      expect(screen.getByText('400 XP')).toBeInTheDocument()
    })

    it('shows max level message when at max level', () => {
      render(
        <XPDisplay
          {...defaultProps}
          xpToNextLevel={0}
          progressPercent={100}
        />
      )
      expect(screen.getByText('Max Level!')).toBeInTheDocument()
    })

    it('formats large XP numbers with commas', () => {
      render(
        <XPDisplay
          {...defaultProps}
          currentXP={15000}
          nextLevelXP={20000}
          xpToNextLevel={5000}
        />
      )
      expect(screen.getByText('15,000 XP')).toBeInTheDocument()
      expect(screen.getByText('5,000 to Level 3')).toBeInTheDocument()
    })
  })

  describe('compact mode', () => {
    it('renders only XP in compact mode', () => {
      render(<XPDisplay {...defaultProps} compact />)
      expect(screen.getByText('200 XP')).toBeInTheDocument()
    })

    it('does not render progress bar in compact mode', () => {
      const { container } = render(<XPDisplay {...defaultProps} compact />)
      // Progress bar has specific classes
      expect(container.querySelector('.h-3')).not.toBeInTheDocument()
    })

    it('does not render level indicators in compact mode', () => {
      render(<XPDisplay {...defaultProps} compact />)
      expect(screen.queryByText('Level 2')).not.toBeInTheDocument()
      expect(screen.queryByText('200 to Level 3')).not.toBeInTheDocument()
    })
  })

  it('applies custom className', () => {
    const { container } = render(<XPDisplay {...defaultProps} className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('handles 0 XP correctly', () => {
    render(
      <XPDisplay
        currentXP={0}
        nextLevelXP={150}
        progressPercent={0}
        xpToNextLevel={150}
        currentLevel={{ ...mockLevel, level: 1 }}
      />
    )
    expect(screen.getByText('0 XP')).toBeInTheDocument()
    expect(screen.getByText('150 to Level 2')).toBeInTheDocument()
  })
})
