import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LevelBadge } from './LevelBadge'
import type { Level } from '../lib/xp-system'

const mockLevel: Level = {
  level: 3,
  xp: 400,
  title: 'Coder',
  icon: '⭐',
  color: '#3B82F6',
}

describe('LevelBadge', () => {
  it('renders the level icon', () => {
    render(<LevelBadge level={mockLevel} />)
    expect(screen.getByText('⭐')).toBeInTheDocument()
  })

  it('shows title when showTitle is true', () => {
    render(<LevelBadge level={mockLevel} showTitle />)
    expect(screen.getByText('Coder')).toBeInTheDocument()
    expect(screen.getByText('Level 3')).toBeInTheDocument()
  })

  it('hides title when showTitle is false', () => {
    render(<LevelBadge level={mockLevel} showTitle={false} />)
    expect(screen.queryByText('Coder')).not.toBeInTheDocument()
    expect(screen.queryByText('Level 3')).not.toBeInTheDocument()
  })

  it('applies correct size class for sm', () => {
    const { container } = render(<LevelBadge level={mockLevel} size="sm" />)
    expect(container.querySelector('.text-lg')).toBeInTheDocument()
  })

  it('applies correct size class for md (default)', () => {
    const { container } = render(<LevelBadge level={mockLevel} />)
    expect(container.querySelector('.text-2xl')).toBeInTheDocument()
  })

  it('applies correct size class for lg', () => {
    const { container } = render(<LevelBadge level={mockLevel} size="lg" />)
    expect(container.querySelector('.text-4xl')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<LevelBadge level={mockLevel} className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('renders different levels correctly', () => {
    const level1: Level = {
      level: 1,
      xp: 0,
      title: 'Starter',
      icon: '🌱',
      color: '#94A3B8',
    }

    const level10: Level = {
      level: 10,
      xp: 15000,
      title: 'Wizard',
      icon: '🧙',
      color: '#8B5CF6',
    }

    const { rerender } = render(<LevelBadge level={level1} showTitle />)
    expect(screen.getByText('🌱')).toBeInTheDocument()
    expect(screen.getByText('Starter')).toBeInTheDocument()

    rerender(<LevelBadge level={level10} showTitle />)
    expect(screen.getByText('🧙')).toBeInTheDocument()
    expect(screen.getByText('Wizard')).toBeInTheDocument()
  })
})
