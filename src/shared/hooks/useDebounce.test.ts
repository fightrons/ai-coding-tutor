import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from './useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return initial value immediately', () => {
    // Act
    const { result } = renderHook(() => useDebounce('initial', 500))

    // Assert
    expect(result.current).toBe('initial')
  })

  it('should debounce value changes until delay passes', () => {
    // Arrange
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'first' } }
    )
    expect(result.current).toBe('first')

    // Act - Update value
    rerender({ value: 'second' })

    // Assert - Still old value before delay
    expect(result.current).toBe('first')

    // Act - Fast forward 499ms
    act(() => {
      vi.advanceTimersByTime(499)
    })

    // Assert - Still old value
    expect(result.current).toBe('first')

    // Act - Fast forward 1 more ms
    act(() => {
      vi.advanceTimersByTime(1)
    })

    // Assert - Now updated
    expect(result.current).toBe('second')
  })

  it('should use default delay of 500ms', () => {
    // Arrange
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'initial' } }
    )

    // Act
    rerender({ value: 'updated' })
    act(() => {
      vi.advanceTimersByTime(499)
    })

    // Assert - Not yet updated
    expect(result.current).toBe('initial')

    // Act
    act(() => {
      vi.advanceTimersByTime(1)
    })

    // Assert - Now updated
    expect(result.current).toBe('updated')
  })

  it('should reset timer on rapid value changes', () => {
    // Arrange
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } }
    )

    // Act - Rapid updates
    rerender({ value: 'b' })
    act(() => {
      vi.advanceTimersByTime(100)
    })

    rerender({ value: 'c' })
    act(() => {
      vi.advanceTimersByTime(100)
    })

    rerender({ value: 'd' })

    // Assert - Value should still be 'a' because timer keeps resetting
    expect(result.current).toBe('a')

    // Act - Wait full delay after last update
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Assert - Now shows final value
    expect(result.current).toBe('d')
  })

  it('should work with objects', () => {
    // Arrange
    const obj1 = { name: 'first' }
    const obj2 = { name: 'second' }

    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: obj1 } }
    )

    // Assert - Initial value
    expect(result.current).toBe(obj1)

    // Act
    rerender({ value: obj2 })
    act(() => {
      vi.advanceTimersByTime(500)
    })

    // Assert
    expect(result.current).toBe(obj2)
  })
})
