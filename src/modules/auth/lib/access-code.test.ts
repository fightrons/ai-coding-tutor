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
    it('should generate code in WORD-WORD-NN format', () => {
      // Act
      const code = generateAccessCode()

      // Assert
      expect(code).toMatch(/^[A-Z]+-[A-Z]+-\d{2}$/)
    })

    it('should generate unique codes on multiple calls', () => {
      // Arrange
      const numberOfCalls = 10

      // Act
      const codes = new Set(Array.from({ length: numberOfCalls }, () => generateAccessCode()))

      // Assert - Should have at least 5 unique codes out of 10 (statistically very likely)
      expect(codes.size).toBeGreaterThanOrEqual(5)
    })
  })

  describe('generateDisplayName', () => {
    it('should generate name in "Adjective Animal" format', () => {
      // Act
      const name = generateDisplayName()

      // Assert
      expect(name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/)
    })

    it('should generate two-word names', () => {
      // Act
      const name = generateDisplayName()
      const words = name.split(' ')

      // Assert
      expect(words).toHaveLength(2)
    })
  })

  describe('pickRandomAvatar', () => {
    it('should return a non-empty emoji string', () => {
      // Act
      const avatar = pickRandomAvatar()

      // Assert
      expect(avatar.length).toBeGreaterThan(0)
      expect(avatar.length).toBeLessThanOrEqual(4) // Most emojis are 1-2 chars (some with modifiers)
    })

    it('should return an avatar from the curated list', () => {
      // Arrange
      const validAvatars = [
        '🐼', '🦊', '🦉', '🐻', '🐺',
        '🐯', '🦅', '🦌', '🦁', '🐸',
        '🦄', '🐙', '🦋', '🌟', '🚀',
      ]

      // Act
      const avatar = pickRandomAvatar()

      // Assert
      expect(validAvatars).toContain(avatar)
    })
  })

  describe('normalizeAccessCode', () => {
    it('should convert lowercase to uppercase', () => {
      // Act
      const result = normalizeAccessCode('swift-bear-73')

      // Assert
      expect(result).toBe('SWIFT-BEAR-73')
    })

    it('should trim whitespace', () => {
      // Act
      const result = normalizeAccessCode('  SWIFT-BEAR-73  ')

      // Assert
      expect(result).toBe('SWIFT-BEAR-73')
    })

    it('should handle mixed case input', () => {
      // Act
      const result = normalizeAccessCode('Swift-Bear-73')

      // Assert
      expect(result).toBe('SWIFT-BEAR-73')
    })
  })

  describe('isValidAccessCodeFormat', () => {
    it('should return true for valid format', () => {
      // Act & Assert
      expect(isValidAccessCodeFormat('SWIFT-BEAR-73')).toBe(true)
      expect(isValidAccessCodeFormat('CALM-WOLF-00')).toBe(true)
      expect(isValidAccessCodeFormat('BRIGHT-OCEAN-99')).toBe(true)
    })

    it('should return true for lowercase input (auto-normalized)', () => {
      // Act
      const result = isValidAccessCodeFormat('swift-bear-73')

      // Assert
      expect(result).toBe(true)
    })

    it('should return false when number suffix is missing', () => {
      // Act
      const result = isValidAccessCodeFormat('SWIFT-BEAR')

      // Assert
      expect(result).toBe(false)
    })

    it('should return false when dashes are missing', () => {
      // Act
      const result = isValidAccessCodeFormat('SWIFTBEAR73')

      // Assert
      expect(result).toBe(false)
    })

    it('should return false when number has wrong digit count', () => {
      // Act & Assert
      expect(isValidAccessCodeFormat('SWIFT-BEAR-7')).toBe(false)   // Single digit
      expect(isValidAccessCodeFormat('SWIFT-BEAR-123')).toBe(false) // Three digits
    })

    it('should return false for empty string', () => {
      // Act
      const result = isValidAccessCodeFormat('')

      // Assert
      expect(result).toBe(false)
    })

    it('should return false when words are numbers', () => {
      // Act
      const result = isValidAccessCodeFormat('123-456-78')

      // Assert
      expect(result).toBe(false)
    })
  })
})
