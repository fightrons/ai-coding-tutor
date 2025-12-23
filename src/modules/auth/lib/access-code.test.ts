import { describe, it, expect } from 'vitest'
import {
  generateAccessCode,
  generateDisplayName,
  pickRandomAvatar,
  normalizeAccessCode,
  isValidAccessCodeFormat,
} from './access-code'

describe('access-code', () => {
  describe('generateAccessCode', () => {
    it('generates code in WORD-WORD-NN format', () => {
      const code = generateAccessCode()
      expect(code).toMatch(/^[A-Z]+-[A-Z]+-\d{2}$/)
    })

    it('generates different codes on multiple calls', () => {
      const codes = new Set(Array.from({ length: 10 }, () => generateAccessCode()))
      // Should have at least 5 unique codes out of 10 (statistically very likely)
      expect(codes.size).toBeGreaterThanOrEqual(5)
    })
  })

  describe('generateDisplayName', () => {
    it('generates name in "Adjective Animal" format', () => {
      const name = generateDisplayName()
      expect(name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/)
    })

    it('generates two-word names', () => {
      const name = generateDisplayName()
      const words = name.split(' ')
      expect(words).toHaveLength(2)
    })
  })

  describe('pickRandomAvatar', () => {
    it('returns an emoji', () => {
      const avatar = pickRandomAvatar()
      // Emoji regex - checks for common emoji patterns
      expect(avatar.length).toBeGreaterThan(0)
      expect(avatar.length).toBeLessThanOrEqual(4) // Most emojis are 1-2 chars (some with modifiers)
    })

    it('returns a valid avatar emoji from the curated list', () => {
      const validAvatars = [
        '🐼', '🦊', '🦉', '🐻', '🐺',
        '🐯', '🦅', '🦌', '🦁', '🐸',
        '🦄', '🐙', '🦋', '🌟', '🚀',
      ]
      const avatar = pickRandomAvatar()
      expect(validAvatars).toContain(avatar)
    })
  })

  describe('normalizeAccessCode', () => {
    it('converts to uppercase', () => {
      expect(normalizeAccessCode('swift-bear-73')).toBe('SWIFT-BEAR-73')
    })

    it('trims whitespace', () => {
      expect(normalizeAccessCode('  SWIFT-BEAR-73  ')).toBe('SWIFT-BEAR-73')
    })

    it('handles mixed case', () => {
      expect(normalizeAccessCode('Swift-Bear-73')).toBe('SWIFT-BEAR-73')
    })
  })

  describe('isValidAccessCodeFormat', () => {
    it('returns true for valid format', () => {
      expect(isValidAccessCodeFormat('SWIFT-BEAR-73')).toBe(true)
      expect(isValidAccessCodeFormat('CALM-WOLF-00')).toBe(true)
      expect(isValidAccessCodeFormat('BRIGHT-OCEAN-99')).toBe(true)
    })

    it('returns true for lowercase input (auto-normalized)', () => {
      expect(isValidAccessCodeFormat('swift-bear-73')).toBe(true)
    })

    it('returns false for invalid formats', () => {
      expect(isValidAccessCodeFormat('SWIFT-BEAR')).toBe(false) // Missing number
      expect(isValidAccessCodeFormat('SWIFTBEAR73')).toBe(false) // Missing dashes
      expect(isValidAccessCodeFormat('SWIFT-BEAR-7')).toBe(false) // Single digit
      expect(isValidAccessCodeFormat('SWIFT-BEAR-123')).toBe(false) // Three digits
      expect(isValidAccessCodeFormat('')).toBe(false) // Empty
      expect(isValidAccessCodeFormat('123-456-78')).toBe(false) // Numbers as words
    })
  })
})
