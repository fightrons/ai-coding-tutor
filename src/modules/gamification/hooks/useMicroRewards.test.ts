import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMicroRewards } from './useMicroRewards'
import type { Achievement } from '../types'

describe('useMicroRewards', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('rewards queue', () => {
    it('starts with empty rewards array', () => {
      const { result } = renderHook(() => useMicroRewards())
      expect(result.current.rewards).toEqual([])
    })

    it('adds reward to queue', () => {
      const { result } = renderHook(() => useMicroRewards())

      act(() => {
        result.current.addReward(50, 'Exercise passed', '✨')
      })

      expect(result.current.rewards).toHaveLength(1)
      expect(result.current.rewards[0].xp).toBe(50)
      expect(result.current.rewards[0].message).toBe('Exercise passed')
      expect(result.current.rewards[0].icon).toBe('✨')
    })

    it('generates unique IDs for rewards', () => {
      const { result } = renderHook(() => useMicroRewards())

      act(() => {
        result.current.addReward(50, 'First reward')
        result.current.addReward(25, 'Second reward')
      })

      expect(result.current.rewards[0].id).not.toBe(result.current.rewards[1].id)
    })

    it('auto-dismisses reward after 3 seconds', () => {
      const { result } = renderHook(() => useMicroRewards())

      act(() => {
        result.current.addReward(50, 'Auto dismiss test')
      })

      expect(result.current.rewards).toHaveLength(1)

      act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(result.current.rewards).toHaveLength(0)
    })

    it('dismisses specific reward manually', () => {
      const { result } = renderHook(() => useMicroRewards())

      act(() => {
        result.current.addReward(50, 'First')
        result.current.addReward(25, 'Second')
      })

      const firstRewardId = result.current.rewards[0].id

      act(() => {
        result.current.dismissReward(firstRewardId)
      })

      expect(result.current.rewards).toHaveLength(1)
      expect(result.current.rewards[0].message).toBe('Second')
    })

    it('handles multiple rewards with staggered auto-dismiss', () => {
      const { result } = renderHook(() => useMicroRewards())

      act(() => {
        result.current.addReward(50, 'First')
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      act(() => {
        result.current.addReward(25, 'Second')
      })

      expect(result.current.rewards).toHaveLength(2)

      // First reward should dismiss at 3000ms from its creation
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(result.current.rewards).toHaveLength(1)
      expect(result.current.rewards[0].message).toBe('Second')

      // Second reward should dismiss 1000ms later
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.rewards).toHaveLength(0)
    })
  })

  describe('level up', () => {
    it('starts with null levelUpData', () => {
      const { result } = renderHook(() => useMicroRewards())
      expect(result.current.levelUpData).toBeNull()
    })

    it('shows level up data', () => {
      const { result } = renderHook(() => useMicroRewards())

      act(() => {
        result.current.showLevelUp(1, 2, 'Explorer', '🌿')
      })

      expect(result.current.levelUpData).toEqual({
        oldLevel: 1,
        newLevel: 2,
        newTitle: 'Explorer',
        newIcon: '🌿',
      })
    })

    it('dismisses level up', () => {
      const { result } = renderHook(() => useMicroRewards())

      act(() => {
        result.current.showLevelUp(1, 2, 'Explorer', '🌿')
      })

      act(() => {
        result.current.dismissLevelUp()
      })

      expect(result.current.levelUpData).toBeNull()
    })

    it('replaces existing level up data', () => {
      const { result } = renderHook(() => useMicroRewards())

      act(() => {
        result.current.showLevelUp(1, 2, 'Explorer', '🌿')
      })

      act(() => {
        result.current.showLevelUp(2, 3, 'Coder', '⭐')
      })

      expect(result.current.levelUpData?.newLevel).toBe(3)
    })
  })

  describe('achievement notification', () => {
    const mockAchievement: Achievement = {
      id: 'ach-1',
      slug: 'first-lesson',
      title: 'First Steps',
      description: 'Complete your first lesson',
      icon: '🎯',
      xp_reward: 50,
      criteria: { type: 'lessons_completed', threshold: 1 },
      category: 'general',
      created_at: new Date().toISOString(),
    }

    it('starts with null achievement notification', () => {
      const { result } = renderHook(() => useMicroRewards())
      expect(result.current.achievementNotification).toBeNull()
    })

    it('shows achievement notification', () => {
      const { result } = renderHook(() => useMicroRewards())

      act(() => {
        result.current.showAchievement(mockAchievement)
      })

      expect(result.current.achievementNotification).not.toBeNull()
      expect(result.current.achievementNotification?.achievement.slug).toBe('first-lesson')
      expect(result.current.achievementNotification?.isNew).toBe(true)
    })

    it('auto-dismisses achievement after 5 seconds', () => {
      const { result } = renderHook(() => useMicroRewards())

      act(() => {
        result.current.showAchievement(mockAchievement)
      })

      expect(result.current.achievementNotification).not.toBeNull()

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(result.current.achievementNotification).toBeNull()
    })

    it('dismisses achievement manually', () => {
      const { result } = renderHook(() => useMicroRewards())

      act(() => {
        result.current.showAchievement(mockAchievement)
      })

      act(() => {
        result.current.dismissAchievement()
      })

      expect(result.current.achievementNotification).toBeNull()
    })
  })

  describe('combined usage', () => {
    it('can show reward, level up, and achievement simultaneously', () => {
      const { result } = renderHook(() => useMicroRewards())

      const mockAchievement: Achievement = {
        id: 'ach-1',
        slug: 'test',
        title: 'Test',
        description: 'Test achievement',
        icon: '🏆',
        xp_reward: 100,
        criteria: { type: 'lessons_completed', threshold: 1 },
        category: 'general',
        created_at: new Date().toISOString(),
      }

      act(() => {
        result.current.addReward(100, 'Big reward!')
        result.current.showLevelUp(4, 5, 'Creator', '💫')
        result.current.showAchievement(mockAchievement)
      })

      expect(result.current.rewards).toHaveLength(1)
      expect(result.current.levelUpData).not.toBeNull()
      expect(result.current.achievementNotification).not.toBeNull()
    })
  })
})
