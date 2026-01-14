import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StreakCounter } from './StreakCounter'

describe('StreakCounter', () => {
  it('renders streak count', () => {
    render(<StreakCounter streak={5} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders fire emoji', () => {
    render(<StreakCounter streak={5} />)
    expect(screen.getByText('🔥')).toBeInTheDocument()
  })

  it('shows "day" for streak of 1', () => {
    render(<StreakCounter streak={1} />)
    expect(screen.getByText('day')).toBeInTheDocument()
  })

  it('shows "days" for streak > 1', () => {
    render(<StreakCounter streak={3} />)
    expect(screen.getByText('days')).toBeInTheDocument()
  })

  it('shows "days" for streak of 0', () => {
    render(<StreakCounter streak={0} />)
    expect(screen.getByText('days')).toBeInTheDocument()
  })

  describe('zero streak', () => {
    it('applies grayscale and reduced opacity for zero streak', () => {
      const { container } = render(<StreakCounter streak={0} />)
      const fireEmoji = container.querySelector('.grayscale')
      expect(fireEmoji).toBeInTheDocument()
      expect(fireEmoji).toHaveClass('opacity-50')
    })

    it('does not apply grayscale for non-zero streak', () => {
      const { container } = render(<StreakCounter streak={1} />)
      expect(container.querySelector('.grayscale')).not.toBeInTheDocument()
    })
  })

  describe('longest streak', () => {
    it('shows longest streak when showLongest is true and longest > current', () => {
      render(<StreakCounter streak={5} longestStreak={10} showLongest />)
      expect(screen.getByText('Best')).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument()
    })

    it('hides longest streak when showLongest is false', () => {
      render(<StreakCounter streak={5} longestStreak={10} showLongest={false} />)
      expect(screen.queryByText('Best')).not.toBeInTheDocument()
    })

    it('hides longest streak when longest equals current', () => {
      render(<StreakCounter streak={5} longestStreak={5} showLongest />)
      expect(screen.queryByText('Best')).not.toBeInTheDocument()
    })

    it('hides longest streak when longest is less than current', () => {
      render(<StreakCounter streak={5} longestStreak={3} showLongest />)
      expect(screen.queryByText('Best')).not.toBeInTheDocument()
    })
  })

  describe('sizes', () => {
    it('applies sm size classes', () => {
      const { container } = render(<StreakCounter streak={5} size="sm" />)
      expect(container.querySelector('.text-lg')).toBeInTheDocument()
      expect(container.querySelector('.text-sm')).toBeInTheDocument()
    })

    it('applies md size classes (default)', () => {
      const { container } = render(<StreakCounter streak={5} />)
      expect(container.querySelector('.text-2xl')).toBeInTheDocument()
      expect(container.querySelector('.text-lg')).toBeInTheDocument()
    })

    it('applies lg size classes', () => {
      const { container } = render(<StreakCounter streak={5} size="lg" />)
      expect(container.querySelector('.text-4xl')).toBeInTheDocument()
      expect(container.querySelector('.text-2xl')).toBeInTheDocument()
    })
  })

  it('applies custom className', () => {
    const { container } = render(<StreakCounter streak={5} className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
