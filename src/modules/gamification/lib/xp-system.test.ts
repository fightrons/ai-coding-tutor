import { describe, it, expect } from 'vitest'
import {
  XP_REWARDS,
  LEVELS,
  calculateLevel,
  getLevelInfo,
  getLevelProgress,
  calculateLessonXP,
  getMaxLevel,
  isMaxLevel,
  ACHIEVEMENT_CATEGORIES,
  GAMIFICATION_COLORS,
} from './xp-system'

describe('xp-system', () => {
  describe('XP_REWARDS', () => {
    it('has all expected reward types', () => {
      expect(XP_REWARDS.FIRST_CODE_RUN_SESSION).toBe(5)
      expect(XP_REWARDS.ERROR_FIXED).toBe(10)
      expect(XP_REWARDS.HINT_USED).toBe(5)
      expect(XP_REWARDS.FIRST_TEST_PASS).toBe(15)
      expect(XP_REWARDS.ALL_TESTS_PASS).toBe(50)
      expect(XP_REWARDS.LESSON_COMPLETE).toBe(100)
      expect(XP_REWARDS.FIRST_ATTEMPT_BONUS).toBe(50)
      expect(XP_REWARDS.STREAK_DAILY_BONUS).toBe(25)
      expect(XP_REWARDS.FAST_COMPLETION_BONUS).toBe(25)
    })

    it('rewards asking for help (kid-friendly)', () => {
      // Hints should give positive XP, not penalize
      expect(XP_REWARDS.HINT_USED).toBeGreaterThan(0)
    })
  })

  describe('LEVELS', () => {
    it('has 10 levels', () => {
      expect(LEVELS).toHaveLength(10)
    })

    it('starts at level 1 with 0 XP', () => {
      expect(LEVELS[0].level).toBe(1)
      expect(LEVELS[0].xp).toBe(0)
    })

    it('ends at level 10', () => {
      expect(LEVELS[9].level).toBe(10)
    })

    it('has increasing XP thresholds', () => {
      for (let i = 1; i < LEVELS.length; i++) {
        expect(LEVELS[i].xp).toBeGreaterThan(LEVELS[i - 1].xp)
      }
    })

    it('each level has required properties', () => {
      for (const level of LEVELS) {
        expect(level).toHaveProperty('level')
        expect(level).toHaveProperty('xp')
        expect(level).toHaveProperty('title')
        expect(level).toHaveProperty('icon')
        expect(level).toHaveProperty('color')
      }
    })
  })

  describe('calculateLevel', () => {
    it('returns level 1 for 0 XP', () => {
      expect(calculateLevel(0)).toBe(1)
    })

    it('returns level 1 for XP below level 2 threshold', () => {
      expect(calculateLevel(100)).toBe(1)
      expect(calculateLevel(149)).toBe(1)
    })

    it('returns level 2 at exactly 150 XP', () => {
      expect(calculateLevel(150)).toBe(2)
    })

    it('returns level 2 for XP between level 2 and 3', () => {
      expect(calculateLevel(200)).toBe(2)
      expect(calculateLevel(399)).toBe(2)
    })

    it('returns correct level for each threshold', () => {
      expect(calculateLevel(0)).toBe(1)
      expect(calculateLevel(150)).toBe(2)
      expect(calculateLevel(400)).toBe(3)
      expect(calculateLevel(800)).toBe(4)
      expect(calculateLevel(1500)).toBe(5)
      expect(calculateLevel(2500)).toBe(6)
      expect(calculateLevel(4000)).toBe(7)
      expect(calculateLevel(6000)).toBe(8)
      expect(calculateLevel(9000)).toBe(9)
      expect(calculateLevel(15000)).toBe(10)
    })

    it('returns max level for very high XP', () => {
      expect(calculateLevel(100000)).toBe(10)
    })

    it('handles negative XP gracefully', () => {
      expect(calculateLevel(-100)).toBe(1)
    })
  })

  describe('getLevelInfo', () => {
    it('returns level 1 info for 0 XP', () => {
      const info = getLevelInfo(0)
      expect(info.level).toBe(1)
      expect(info.title).toBe('Starter')
      expect(info.icon).toBe('🌱')
    })

    it('returns correct level info for mid-level XP', () => {
      const info = getLevelInfo(1000)
      expect(info.level).toBe(4)
      expect(info.title).toBe('Builder')
    })

    it('returns max level info for high XP', () => {
      const info = getLevelInfo(20000)
      expect(info.level).toBe(10)
      expect(info.title).toBe('Wizard')
    })
  })

  describe('getLevelProgress', () => {
    it('returns 0% progress at start of level', () => {
      const progress = getLevelProgress(0)
      expect(progress.currentXP).toBe(0)
      expect(progress.progressPercent).toBe(0)
      expect(progress.xpToNextLevel).toBe(150)
    })

    it('returns correct progress mid-level', () => {
      const progress = getLevelProgress(75) // Half way to level 2
      expect(progress.currentXP).toBe(75)
      expect(progress.progressPercent).toBe(50)
      expect(progress.xpToNextLevel).toBe(75)
    })

    it('returns 100% progress at max level', () => {
      const progress = getLevelProgress(15000)
      expect(progress.progressPercent).toBe(100)
      expect(progress.xpToNextLevel).toBe(0)
    })

    it('returns correct next level XP threshold', () => {
      const progress = getLevelProgress(200) // Level 2
      expect(progress.nextLevelXP).toBe(400) // Level 3 threshold
    })
  })

  describe('calculateLessonXP', () => {
    it('returns 0 for failed lesson', () => {
      expect(calculateLessonXP({
        passed: false,
        isFirstAttempt: true,
        timeSpentSeconds: 60,
      })).toBe(0)
    })

    it('returns base XP for passed lesson', () => {
      expect(calculateLessonXP({
        passed: true,
        isFirstAttempt: false,
        timeSpentSeconds: 600,
      })).toBe(XP_REWARDS.LESSON_COMPLETE)
    })

    it('adds first attempt bonus', () => {
      const xp = calculateLessonXP({
        passed: true,
        isFirstAttempt: true,
        timeSpentSeconds: 600,
      })
      expect(xp).toBe(XP_REWARDS.LESSON_COMPLETE + XP_REWARDS.FIRST_ATTEMPT_BONUS)
    })

    it('adds speed bonus for fast completion', () => {
      const xp = calculateLessonXP({
        passed: true,
        isFirstAttempt: false,
        timeSpentSeconds: 180, // 3 minutes, under 5 minute threshold
      })
      expect(xp).toBe(XP_REWARDS.LESSON_COMPLETE + XP_REWARDS.FAST_COMPLETION_BONUS)
    })

    it('adds both bonuses when applicable', () => {
      const xp = calculateLessonXP({
        passed: true,
        isFirstAttempt: true,
        timeSpentSeconds: 120, // 2 minutes
      })
      expect(xp).toBe(
        XP_REWARDS.LESSON_COMPLETE +
        XP_REWARDS.FIRST_ATTEMPT_BONUS +
        XP_REWARDS.FAST_COMPLETION_BONUS
      )
    })

    it('does not add speed bonus at exactly 5 minutes', () => {
      const xp = calculateLessonXP({
        passed: true,
        isFirstAttempt: false,
        timeSpentSeconds: 300, // Exactly 5 minutes
      })
      expect(xp).toBe(XP_REWARDS.LESSON_COMPLETE) // No speed bonus
    })

    it('handles 0 time spent (no speed bonus)', () => {
      const xp = calculateLessonXP({
        passed: true,
        isFirstAttempt: false,
        timeSpentSeconds: 0,
      })
      expect(xp).toBe(XP_REWARDS.LESSON_COMPLETE)
    })
  })

  describe('getMaxLevel', () => {
    it('returns 10 as max level', () => {
      expect(getMaxLevel()).toBe(10)
    })
  })

  describe('isMaxLevel', () => {
    it('returns false for levels below max', () => {
      expect(isMaxLevel(1)).toBe(false)
      expect(isMaxLevel(5)).toBe(false)
      expect(isMaxLevel(9)).toBe(false)
    })

    it('returns true for max level', () => {
      expect(isMaxLevel(10)).toBe(true)
    })

    it('returns true for levels above max', () => {
      expect(isMaxLevel(11)).toBe(true)
    })
  })

  describe('ACHIEVEMENT_CATEGORIES', () => {
    it('has all expected categories', () => {
      expect(ACHIEVEMENT_CATEGORIES.general).toBeDefined()
      expect(ACHIEVEMENT_CATEGORIES.streak).toBeDefined()
      expect(ACHIEVEMENT_CATEGORIES.speed).toBeDefined()
      expect(ACHIEVEMENT_CATEGORIES.mastery).toBeDefined()
    })

    it('each category has label and icon', () => {
      for (const category of Object.values(ACHIEVEMENT_CATEGORIES)) {
        expect(category).toHaveProperty('label')
        expect(category).toHaveProperty('icon')
      }
    })
  })

  describe('GAMIFICATION_COLORS', () => {
    it('has all expected color keys', () => {
      expect(GAMIFICATION_COLORS.xp).toBeDefined()
      expect(GAMIFICATION_COLORS.streak).toBeDefined()
      expect(GAMIFICATION_COLORS.levelUp).toBeDefined()
      expect(GAMIFICATION_COLORS.success).toBeDefined()
      expect(GAMIFICATION_COLORS.achievement).toBeDefined()
    })

    it('colors are valid hex values', () => {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/
      for (const color of Object.values(GAMIFICATION_COLORS)) {
        expect(color).toMatch(hexRegex)
      }
    })
  })
})
