import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from './useLocalStorage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.clearAllMocks()
  })

  it('should return initial value when localStorage is empty', () => {
    // Act
    const { result } = renderHook(() => useLocalStorage('key', 'default'))

    // Assert
    expect(result.current[0]).toBe('default')
  })

  it('should return stored value from localStorage when it exists', () => {
    // Arrange
    window.localStorage.setItem('key', JSON.stringify('stored'))

    // Act
    const { result } = renderHook(() => useLocalStorage('key', 'default'))

    // Assert
    expect(result.current[0]).toBe('stored')
  })

  it('should update localStorage when setValue is called', () => {
    // Arrange
    const { result } = renderHook(() => useLocalStorage('key', 'initial'))

    // Act
    act(() => {
      result.current[1]('updated')
    })

    // Assert
    expect(result.current[0]).toBe('updated')
    expect(JSON.parse(window.localStorage.getItem('key')!)).toBe('updated')
  })

  it('should support functional updates', () => {
    // Arrange
    const { result } = renderHook(() => useLocalStorage('count', 0))

    // Act
    act(() => {
      result.current[1]((prev) => prev + 1)
    })

    // Assert
    expect(result.current[0]).toBe(1)

    // Act
    act(() => {
      result.current[1]((prev) => prev + 1)
    })

    // Assert
    expect(result.current[0]).toBe(2)
  })

  it('should remove value from localStorage and reset to default', () => {
    // Arrange
    window.localStorage.setItem('key', JSON.stringify('value'))
    const { result } = renderHook(() => useLocalStorage('key', 'default'))
    expect(result.current[0]).toBe('value')

    // Act
    act(() => {
      result.current[2]() // removeValue
    })

    // Assert
    expect(result.current[0]).toBe('default')
    expect(window.localStorage.getItem('key')).toBeNull()
  })

  it('should work with objects', () => {
    // Arrange
    const initial = { name: 'test', count: 0 }
    const { result } = renderHook(() => useLocalStorage('obj', initial))
    expect(result.current[0]).toEqual(initial)

    // Act
    act(() => {
      result.current[1]({ name: 'updated', count: 5 })
    })

    // Assert
    expect(result.current[0]).toEqual({ name: 'updated', count: 5 })
  })

  it('should work with arrays', () => {
    // Arrange
    const { result } = renderHook(() => useLocalStorage<string[]>('items', []))

    // Act
    act(() => {
      result.current[1](['a', 'b', 'c'])
    })

    // Assert
    expect(result.current[0]).toEqual(['a', 'b', 'c'])
  })

  it('should handle invalid JSON in localStorage gracefully', () => {
    // Arrange
    window.localStorage.setItem('key', 'not valid json')
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    // Act
    const { result } = renderHook(() => useLocalStorage('key', 'default'))

    // Assert
    expect(result.current[0]).toBe('default')
    expect(consoleSpy).toHaveBeenCalled()

    // Cleanup
    consoleSpy.mockRestore()
  })

  it('should use different keys independently', () => {
    // Arrange
    const { result: result1 } = renderHook(() =>
      useLocalStorage('key1', 'default1')
    )
    const { result: result2 } = renderHook(() =>
      useLocalStorage('key2', 'default2')
    )

    // Act
    act(() => {
      result1.current[1]('value1')
      result2.current[1]('value2')
    })

    // Assert
    expect(result1.current[0]).toBe('value1')
    expect(result2.current[0]).toBe('value2')
  })
})
