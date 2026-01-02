import { describe, it, expect } from 'vitest'
import { executeCode } from './sandbox'
import type { TestCase } from '../types'

describe('sandbox', () => {
  describe('executeCode', () => {
    describe('basic execution', () => {
      it('should capture console.log output when executing simple code', () => {
        // Act
        const result = executeCode('console.log("Hello, World!")')

        // Assert
        expect(result.output).toBe('Hello, World!')
        expect(result.error).toBeNull()
        expect(result.allPassed).toBe(true)
      })

      it('should capture multiple console.log calls with newline separation', () => {
        // Arrange
        const code = `
          console.log("Line 1")
          console.log("Line 2")
          console.log("Line 3")
        `

        // Act
        const result = executeCode(code)

        // Assert
        expect(result.output).toBe('Line 1\nLine 2\nLine 3')
        expect(result.error).toBeNull()
      })

      it('should prefix console.error output with "Error:"', () => {
        // Act
        const result = executeCode('console.error("Something went wrong")')

        // Assert
        expect(result.output).toBe('Error: Something went wrong')
        expect(result.error).toBeNull()
      })

      it('should prefix console.warn output with "Warning:"', () => {
        // Act
        const result = executeCode('console.warn("Be careful")')

        // Assert
        expect(result.output).toBe('Warning: Be careful')
        expect(result.error).toBeNull()
      })

      it('should join multiple arguments with spaces', () => {
        // Act
        const result = executeCode('console.log("Count:", 42, "items")')

        // Assert
        expect(result.output).toBe('Count: 42 items')
      })

      it('should return empty output when code is empty', () => {
        // Act
        const result = executeCode('')

        // Assert
        expect(result.output).toBe('')
        expect(result.error).toBeNull()
        expect(result.allPassed).toBe(true)
      })

      it('should return empty output when code has no console calls', () => {
        // Act
        const result = executeCode('const x = 5; const y = x + 10;')

        // Assert
        expect(result.output).toBe('')
        expect(result.error).toBeNull()
      })
    })

    describe('error handling', () => {
      it('should catch and report syntax errors', () => {
        // Act
        const result = executeCode('const x =')

        // Assert
        expect(result.error).not.toBeNull()
        expect(result.allPassed).toBe(false)
      })

      it('should catch and report reference errors', () => {
        // Act
        const result = executeCode('console.log(undefinedVariable)')

        // Assert
        expect(result.error).toContain('undefinedVariable')
        expect(result.allPassed).toBe(false)
      })

      it('should catch and report type errors', () => {
        // Act
        const result = executeCode('null.toString()')

        // Assert
        expect(result.error).not.toBeNull()
        expect(result.allPassed).toBe(false)
      })

      it('should preserve output captured before an error occurs', () => {
        // Arrange
        const code = `
          console.log("Before error")
          throw new Error("Test error")
        `

        // Act
        const result = executeCode(code)

        // Assert
        expect(result.output).toBe('Before error')
        expect(result.error).toBe('Test error')
        expect(result.allPassed).toBe(false)
      })

      it('should handle non-Error throws gracefully', () => {
        // Act
        const result = executeCode('throw "string error"')

        // Assert
        expect(result.error).toBe('string error')
      })
    })

    describe('test cases', () => {
      it('should pass when output matches expected output', () => {
        // Arrange
        const testCases: TestCase[] = [
          { name: 'prints hello', expectedOutput: 'Hello' },
        ]

        // Act
        const result = executeCode('console.log("Hello")', testCases)

        // Assert
        expect(result.testResults).toHaveLength(1)
        expect(result.testResults[0].passed).toBe(true)
        expect(result.testResults[0].name).toBe('prints hello')
        expect(result.allPassed).toBe(true)
      })

      it('should fail when output does not match expected output', () => {
        // Arrange
        const testCases: TestCase[] = [
          { name: 'prints hello', expectedOutput: 'Goodbye' },
        ]

        // Act
        const result = executeCode('console.log("Hello")', testCases)

        // Assert
        expect(result.testResults[0].passed).toBe(false)
        expect(result.testResults[0].expected).toBe('Goodbye')
        expect(result.testResults[0].actual).toBe('Hello')
        expect(result.allPassed).toBe(false)
      })

      it('should handle multiple test cases independently', () => {
        // Arrange
        const testCases: TestCase[] = [
          { name: 'contains foo', expectedOutput: 'foo' },
          { name: 'contains bar', expectedOutput: 'bar' },
          { name: 'contains baz', expectedOutput: 'baz' },
        ]

        // Act
        const result = executeCode('console.log("foo bar")', testCases)

        // Assert
        expect(result.testResults).toHaveLength(3)
        expect(result.testResults[0].passed).toBe(true)  // foo found
        expect(result.testResults[1].passed).toBe(true)  // bar found
        expect(result.testResults[2].passed).toBe(false) // baz not found
        expect(result.allPassed).toBe(false)
      })

      it('should match multiline expected output correctly', () => {
        // Arrange
        const testCases: TestCase[] = [
          { name: 'prints both lines', expectedOutput: 'Line 1\nLine 2' },
        ]
        const code = `
          console.log("Line 1")
          console.log("Line 2")
        `

        // Act
        const result = executeCode(code, testCases)

        // Assert
        expect(result.testResults[0].passed).toBe(true)
      })

      it('should fail all tests when code throws an error', () => {
        // Arrange
        const testCases: TestCase[] = [
          { name: 'test 1', expectedOutput: 'anything' },
          { name: 'test 2', expectedOutput: 'anything' },
        ]

        // Act
        const result = executeCode('throw new Error("crash")', testCases)

        // Assert
        expect(result.testResults.every(t => !t.passed)).toBe(true)
        expect(result.allPassed).toBe(false)
      })

      it('should pass when test cases array is empty', () => {
        // Act
        const result = executeCode('console.log("test")', [])

        // Assert
        expect(result.testResults).toHaveLength(0)
        expect(result.allPassed).toBe(true)
      })

      it('should pass when expectedOutput is empty string', () => {
        // Arrange
        const testCases: TestCase[] = [
          { name: 'empty expectation', expectedOutput: '' },
        ]

        // Act
        const result = executeCode('console.log("output")', testCases)

        // Assert
        expect(result.testResults[0].passed).toBe(true)
      })

      it('should use contains matching for partial output matches', () => {
        // Arrange
        const testCases: TestCase[] = [
          { name: 'contains partial', expectedOutput: 'middle' },
        ]

        // Act
        const result = executeCode('console.log("start middle end")', testCases)

        // Assert
        expect(result.testResults[0].passed).toBe(true)
      })
    })

    describe('JavaScript features', () => {
      it('should support let, const, and var declarations', () => {
        // Arrange
        const code = `
          let x = 5
          const y = 10
          var z = x + y
          console.log(z)
        `

        // Act
        const result = executeCode(code)

        // Assert
        expect(result.output).toBe('15')
        expect(result.error).toBeNull()
      })

      it('should support function declarations', () => {
        // Arrange
        const code = `
          function add(a, b) {
            return a + b
          }
          console.log(add(2, 3))
        `

        // Act
        const result = executeCode(code)

        // Assert
        expect(result.output).toBe('5')
      })

      it('should support arrow functions', () => {
        // Arrange
        const code = `
          const multiply = (a, b) => a * b
          console.log(multiply(4, 5))
        `

        // Act
        const result = executeCode(code)

        // Assert
        expect(result.output).toBe('20')
      })

      it('should support arrays and array methods', () => {
        // Arrange
        const code = `
          const arr = [1, 2, 3, 4, 5]
          console.log(arr.length)
          console.log(arr.map(x => x * 2).join(","))
        `

        // Act
        const result = executeCode(code)

        // Assert
        expect(result.output).toContain('5')
        expect(result.output).toContain('2,4,6,8,10')
      })

      it('should support objects and property access', () => {
        // Arrange
        const code = `
          const person = { name: "Alice", age: 30 }
          console.log(person.name)
          console.log(person.age)
        `

        // Act
        const result = executeCode(code)

        // Assert
        expect(result.output).toContain('Alice')
        expect(result.output).toContain('30')
      })

      it('should support for loops', () => {
        // Arrange
        const code = `
          for (let i = 0; i < 3; i++) {
            console.log(i)
          }
        `

        // Act
        const result = executeCode(code)

        // Assert
        expect(result.output).toBe('0\n1\n2')
      })

      it('should support if/else conditionals', () => {
        // Arrange
        const code = `
          const x = 10
          if (x > 5) {
            console.log("big")
          } else {
            console.log("small")
          }
        `

        // Act
        const result = executeCode(code)

        // Assert
        expect(result.output).toBe('big')
      })

      it('should support template literals', () => {
        // Arrange
        const code = `
          const name = "World"
          console.log(\`Hello, \${name}!\`)
        `

        // Act
        const result = executeCode(code)

        // Assert
        expect(result.output).toBe('Hello, World!')
      })

      it('should support destructuring assignment', () => {
        // Arrange
        const code = `
          const [a, b] = [1, 2]
          const { x, y } = { x: 3, y: 4 }
          console.log(a, b, x, y)
        `

        // Act
        const result = executeCode(code)

        // Assert
        expect(result.output).toBe('1 2 3 4')
      })

      it('should support spread operator', () => {
        // Arrange
        const code = `
          const arr1 = [1, 2]
          const arr2 = [...arr1, 3, 4]
          console.log(arr2.join(","))
        `

        // Act
        const result = executeCode(code)

        // Assert
        expect(result.output).toBe('1,2,3,4')
      })
    })

    describe('edge cases', () => {
      it('should handle undefined values', () => {
        // Act
        const result = executeCode('console.log(undefined)')

        // Assert
        expect(result.output).toBe('undefined')
      })

      it('should handle null values', () => {
        // Act
        const result = executeCode('console.log(null)')

        // Assert
        expect(result.output).toBe('null')
      })

      it('should handle boolean values', () => {
        // Act
        const result = executeCode('console.log(true, false)')

        // Assert
        expect(result.output).toBe('true false')
      })

      it('should convert objects to [object Object]', () => {
        // Act
        const result = executeCode('console.log({a: 1})')

        // Assert
        expect(result.output).toBe('[object Object]')
      })

      it('should convert arrays to comma-separated values', () => {
        // Act
        const result = executeCode('console.log([1, 2, 3])')

        // Assert
        expect(result.output).toBe('1,2,3')
      })
    })
  })
})
