# Testing Guide

A pragmatic approach to test-driven development for this project.

---

## Testing Stack

| Tool | Purpose |
|------|---------|
| **Vitest** | Unit and integration tests |
| **React Testing Library** | Component testing |
| **Playwright** | End-to-end tests |
| **Local Supabase** | Real database for integration tests |

---

## The Testing Pyramid

```
                    ┌─────────┐
                   /   E2E    \           Few, Slow, Expensive
                  /  (5-10%)   \          • Critical user journeys
                 /──────────────\         • Cross-page navigation
                /  Integration   \
               /    (15-25%)      \       Some, Medium Speed
              /────────────────────\      • Hook interactions
             /        Unit          \     • Service contracts
            /       (65-80%)         \
           /──────────────────────────\   Many, Fast, Cheap
                                          • Pure functions
                                          • Business logic
                                          • Utilities
```

| Layer | Scope | Speed | Isolation |
|-------|-------|-------|-----------|
| **Unit** | Single function/component | < 10ms | Full mocking |
| **Integration** | Multiple units together | < 500ms | Partial mocking |
| **E2E** | Full application flow | < 30s | No mocking |

---

## Coverage Targets

### Current Thresholds (CI Gate)

| Metric | Minimum | Current | Status |
|--------|---------|---------|--------|
| **Line Coverage** | 60% | 65% | ✅ |
| **Branch Coverage** | 50% | 89% | ✅ |
| **Function Coverage** | 70% | 72% | ✅ |
| **Statement Coverage** | 60% | 65% | ✅ |

### Coverage by Module Priority

| Priority | Module | Target | Reason |
|----------|--------|--------|--------|
| **Critical** | `editor/lib/sandbox.ts` | 90%+ | Security-critical code execution |
| **Critical** | `auth/lib/access-code.ts` | 90%+ | Code generation/validation |
| **High** | `tutor/hooks/` | 80%+ | Complex state orchestration |
| **High** | `lesson/hooks/` | 80%+ | Progress tracking logic |
| **Medium** | `auth/hooks/` | 70%+ | Integration with Supabase |
| **Medium** | `auth/components/` | 60%+ | Form handling and validation |
| **Lower** | `layout/components/` | 50%+ | Mostly presentational |
| **Lower** | UI components | 40%+ | Visual, changes often |

### Coverage Configuration

```typescript
// vitest.config.ts
coverage: {
  provider: 'v8',
  thresholds: {
    lines: 60,
    branches: 50,
    functions: 70,
    statements: 60,
  },
}
```

**CI will fail if coverage drops below minimum thresholds.**

---

## Test Commands

```bash
# Unit/Integration tests
npm run test          # Watch mode
npm run test:run      # Single run
npm run test:ui       # Vitest UI (visual)
npm run test:coverage # With coverage report

# E2E tests (requires local Supabase)
supabase start
npm run test:e2e          # Headless
npm run test:e2e:ui       # Playwright UI
npm run test:e2e:headed   # Watch browser

# Coverage report
npm run test:coverage
open coverage/index.html  # View HTML report
```

---

## TDD Workflow

### The Red-Green-Refactor Cycle

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│   1. RED          2. GREEN        3. REFACTOR         │
│   ─────────       ──────────      ────────────        │
│   Write a         Write the       Improve code        │
│   failing         minimum code    quality while       │
│   test first      to pass         keeping tests       │
│                                   green               │
│                                                        │
│   ┌───┐           ┌───┐           ┌───┐               │
│   │ ✗ │ ────────► │ ✓ │ ────────► │ ✓ │ ───► repeat  │
│   └───┘           └───┘           └───┘               │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### When to Write Tests First (TDD)

| Area | Examples | Why TDD Works |
|------|----------|---------------|
| **Utility functions** | `access-code.ts`, `sandbox.ts` | Pure logic, clear inputs/outputs |
| **Custom hooks with logic** | `useProgress.ts`, `useTutorContext.ts` | State machines, calculations |
| **Service layers** | `tutor-service.ts` | Request/response contracts |
| **Bug fixes** | Any bug | Reproduce with failing test, then fix |

### When to Write Tests After

| Area | Examples | Why Test-After Works |
|------|----------|----------------------|
| **UI components** | `MessageBubble.tsx`, `LessonContent.tsx` | Build visually first, test interactions after |
| **Layouts/styling** | `LessonLayout.tsx`, `Header.tsx` | No meaningful tests to write upfront |
| **Exploratory work** | New features with unclear requirements | Prototype first, test once API stabilizes |
| **E2E flows** | `auth.spec.ts`, `lesson-flow.spec.ts` | Write after feature is working |

---

## File Structure

Tests live **next to source files** (co-located):

```
src/modules/
├── auth/
│   ├── lib/
│   │   ├── access-code.ts
│   │   └── access-code.test.ts    ← Unit test
│   └── hooks/
│       ├── useAuth.ts
│       ├── useAuth.test.ts        ← Hook test
│       └── auth-integration.test.ts ← Integration test
├── editor/
│   └── lib/
│       ├── sandbox.ts
│       └── sandbox.test.ts
└── tutor/
    └── hooks/
        ├── useTutorChat.ts
        └── useTutorChat.test.ts

e2e/                               ← E2E tests (separate)
├── landing.spec.ts                # Landing page navigation
├── auth.spec.ts                   # Auth flows (14 tests)
└── lesson-flow.spec.ts.wip        # Parked for UI changes
```

---

## What to Test

### Unit Tests (Vitest)

**DO test:**
- Input/output transformations
- Edge cases and error handling
- State transitions in hooks
- Validation logic

**DON'T test:**
- Implementation details
- Private functions (test through public API)
- Simple pass-through functions
- Styling/CSS

### Component Tests (React Testing Library)

**DO test:**
- User interactions (clicks, typing)
- Conditional rendering
- Form submissions
- Error states

**DON'T test:**
- Snapshot tests (brittle, low value)
- Internal state (test behavior, not state)
- Third-party library behavior

### E2E Tests (Playwright)

**DO test:**
- Critical user flows (auth, lesson completion)
- Cross-page navigation
- Real API interactions

**DON'T test:**
- Every edge case (use unit tests)
- Visual styling
- Performance (use dedicated tools)

---

## Writing Good Tests

### The FIRST Principles

| Principle | Description |
|-----------|-------------|
| **F**ast | Tests should run in milliseconds |
| **I**ndependent | Tests shouldn't depend on each other |
| **R**epeatable | Same result every time, any environment |
| **S**elf-validating | Pass or fail, no manual interpretation |
| **T**imely | Written before or with the code |

### AAA Pattern (Arrange-Act-Assert)

```typescript
it('should validate access code format', () => {
  // Arrange - Set up test data
  const validCode = 'SWIFT-BEAR-73'
  const invalidCode = 'invalid'

  // Act - Execute the code under test
  const validResult = isValidAccessCodeFormat(validCode)
  const invalidResult = isValidAccessCodeFormat(invalidCode)

  // Assert - Verify the result
  expect(validResult).toBe(true)
  expect(invalidResult).toBe(false)
})
```

### Naming Convention

```typescript
describe('moduleName', () => {
  describe('functionName', () => {
    it('should [expected behavior] when [condition]', () => {
      // ...
    })
  })
})

// Naming formulas:
// it('[does something] when [condition]')
// it('[expected behavior] given [input/state]')
// it('returns [output] for [input]')
// it('throws [error] when [condition]')
```

### Testing Hooks

```typescript
import { renderHook, act, waitFor } from '@testing-library/react'

it('should increment counter', () => {
  const { result } = renderHook(() => useCounter())

  act(() => {
    result.current.increment()
  })

  expect(result.current.count).toBe(1)
})

// For async hooks
it('should fetch data', async () => {
  const { result } = renderHook(() => useData())

  await waitFor(() => {
    expect(result.current.loading).toBe(false)
  })

  expect(result.current.data).toBeDefined()
})
```

### Testing with Context Providers

Some hooks require React Context providers (e.g., EventBusProvider). Create a wrapper:

```typescript
import { createElement, type ReactNode } from 'react'
import { EventBusProvider } from '@/shared/hooks'

function Wrapper({ children }: { children: ReactNode }) {
  return createElement(EventBusProvider, null, children)
}

// Use wrapper in renderHook
const { result } = renderHook(() => useMyHook(), { wrapper: Wrapper })

// For multiple providers, nest them
function MultiWrapper({ children }: { children: ReactNode }) {
  return createElement(
    EventBusProvider,
    null,
    createElement(OtherProvider, null, children)
  )
}
```

**Hooks that require EventBusProvider:**
- `usePublish()` - Publishes events
- `useSubscribe()` - Subscribes to events
- `useTutorChat()` - Uses event publishing internally
- `useAttemptPersistenceListener()` - Uses event subscription

### Testing Components

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

it('should submit form on button click', async () => {
  const user = userEvent.setup()
  render(<LoginForm />)

  await user.type(screen.getByLabelText(/email/i), 'test@example.com')
  await user.type(screen.getByLabelText(/password/i), 'password123')
  await user.click(screen.getByRole('button', { name: /sign in/i }))

  expect(await screen.findByText(/welcome/i)).toBeInTheDocument()
})
```

### Edge Cases Checklist

Always consider testing:

```typescript
describe('Edge Cases', () => {
  // Boundary values
  it('handles minimum valid value', () => {})
  it('handles maximum valid value', () => {})

  // Empty/null/undefined
  it('handles empty string', () => {})
  it('handles null', () => {})
  it('handles undefined', () => {})

  // Type coercion
  it('handles string number "123"', () => {})

  // Special values
  it('handles NaN', () => {})

  // Collections
  it('handles empty array', () => {})
  it('handles single element', () => {})
})
```

---

## Mocking Strategy

### When to Mock

| Mock | Don't Mock |
|------|------------|
| External APIs (Supabase) | Pure functions |
| Browser APIs (localStorage) | Utility functions |
| Time-dependent code | Simple data transformations |
| Random/non-deterministic | Business logic |
| Expensive operations | State reducers |

### Test Doubles Reference

| Type | Purpose | Example |
|------|---------|---------|
| **Stub** | Returns canned data | `vi.fn().mockReturnValue(42)` |
| **Mock** | Verifies interactions | `expect(mock).toHaveBeenCalledWith(x)` |
| **Spy** | Wraps real implementation | `vi.spyOn(obj, 'method')` |
| **Fake** | Working implementation | In-memory database |

### Common Mocking Patterns

```typescript
// Mocking Supabase
vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: { id: '123' }, error: null }),
    })),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
}))

// Mocking time (for debounce, setTimeout, etc.)
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

// Advancing timers with state updates
await act(async () => {
  vi.advanceTimersByTime(2000)
})
```

---

## Local Supabase for Tests

Prefer local Supabase over mocking for integration tests:

```bash
# Start local Supabase
supabase start

# Run tests against local database
npm run test:run

# Stop when done
supabase stop
```

**Why local Supabase:**
- Tests real RLS policies
- Tests actual auth flows
- Catches bugs mocks would miss

**When to mock:**
- Simulating network errors
- Testing timeout handling
- Pure unit tests with no DB dependency

---

## CI Pipeline

Tests run automatically on every PR:

```yaml
# Unit tests
- supabase start
- npm run test:run
- npm run test:coverage

# E2E tests
- supabase start
- npx playwright install
- npm run test:e2e
```

**CI blocks merge if:**
- Any test fails
- Coverage drops below minimum thresholds
- E2E critical flows fail

---

## Quick Reference

| Situation | Approach |
|-----------|----------|
| New utility function | TDD (test first) |
| New hook with logic | TDD (test first) |
| New UI component | Build first, test interactions after |
| Bug fix | TDD (reproduce with test, then fix) |
| Refactoring | Ensure tests exist, then refactor |
| New E2E flow | Write after feature works |

---

*Last updated: January 2026*
