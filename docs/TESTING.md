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

## Coverage Targets

### Benchmarks

| Metric | Minimum | Target | Stretch |
|--------|---------|--------|---------|
| **Line Coverage** | 60% | 80% | 90% |
| **Branch Coverage** | 50% | 70% | 85% |
| **Function Coverage** | 70% | 85% | 95% |
| **Statement Coverage** | 60% | 80% | 90% |

### Coverage by Module Priority

| Priority | Module | Target Coverage |
|----------|--------|-----------------|
| **Critical** | `editor/lib/` (sandbox) | 90%+ |
| **Critical** | `auth/lib/` (access-code) | 90%+ |
| **High** | `tutor/hooks/` | 80%+ |
| **High** | `lesson/hooks/` | 80%+ |
| **Medium** | `auth/hooks/` | 70%+ |
| **Medium** | `auth/components/` | 60%+ |
| **Lower** | `layout/components/` | 50%+ |
| **Lower** | UI components (presentational) | 40%+ |

### Why These Numbers?

- **90%+ for critical paths**: Code execution (`sandbox.ts`) and authentication (`access-code.ts`) are security-sensitive. High coverage catches edge cases.
- **80% for business logic**: Hooks contain core application logic. Most branches should be tested.
- **60-70% for integrations**: Auth and API calls have external dependencies. Test happy paths and key error states.
- **40-50% for UI**: Presentational components change often. Test interactions, not visuals.

### Coverage Commands

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html
```

### CI Enforcement

Coverage thresholds in `vitest.config.ts`:

```typescript
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
```

---

## TDD Approach

### When to Write Tests First (Strict TDD)

| Area | Examples | Why TDD Works |
|------|----------|---------------|
| **Utility functions** | `access-code.ts`, `sandbox.ts` | Pure logic, clear inputs/outputs |
| **Custom hooks with logic** | `useProgress.ts`, `useTutorContext.ts` | State machines, calculations |
| **Service layers** | `tutor-service.ts` | Request/response contracts |
| **Bug fixes** | Any bug | Reproduce with failing test, then fix |

**Workflow:**
```
1. Write failing test that describes expected behavior
2. Run test → confirm it fails
3. Write minimal code to pass
4. Run test → confirm it passes
5. Refactor if needed
6. Repeat
```

### When to Write Tests After (Test-After)

| Area | Examples | Why Test-After Works |
|------|----------|----------------------|
| **UI components** | `MessageBubble.tsx`, `LessonContent.tsx` | Build visually first, then test interactions |
| **Layouts/styling** | `LessonLayout.tsx`, `Header.tsx` | No meaningful tests to write upfront |
| **Exploratory work** | New features with unclear requirements | Prototype first, test once API stabilizes |
| **E2E flows** | `auth.spec.ts`, `lesson-flow.spec.ts` | Write after feature is working |

**Workflow:**
```
1. Build the component/feature
2. Verify it works manually
3. Write tests for critical interactions
4. Write tests for edge cases
```

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
│       └── useAuth.test.ts        ← Hook test
├── editor/
│   └── lib/
│       ├── sandbox.ts
│       └── sandbox.test.ts
└── tutor/
    └── hooks/
        ├── useTutorChat.ts
        └── useTutorChat.test.ts

e2e/                               ← E2E tests (separate)
├── landing.spec.ts
├── auth.spec.ts
└── lesson-flow.spec.ts
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

### Naming Convention

```typescript
describe('moduleName', () => {
  describe('functionName', () => {
    it('should [expected behavior] when [condition]', () => {
      // ...
    })
  })
})
```

### AAA Pattern

```typescript
it('should validate access code format', () => {
  // Arrange
  const validCode = 'SWIFT-BEAR-73'
  const invalidCode = 'invalid'

  // Act
  const validResult = isValidAccessCodeFormat(validCode)
  const invalidResult = isValidAccessCodeFormat(invalidCode)

  // Assert
  expect(validResult).toBe(true)
  expect(invalidResult).toBe(false)
})
```

### Testing Hooks

```typescript
import { renderHook, act } from '@testing-library/react'

it('should increment counter', () => {
  const { result } = renderHook(() => useCounter())

  act(() => {
    result.current.increment()
  })

  expect(result.current.count).toBe(1)
})
```

### Testing Components

```typescript
import { renderWithRouter, screen, userEvent } from '@/test/utils/render'

it('should submit form on button click', async () => {
  const user = userEvent.setup()
  renderWithRouter(<LoginForm />)

  await user.type(screen.getByLabelText(/email/i), 'test@example.com')
  await user.type(screen.getByLabelText(/password/i), 'password123')
  await user.click(screen.getByRole('button', { name: /sign in/i }))

  expect(await screen.findByText(/welcome/i)).toBeInTheDocument()
})
```

---

## Test Priority by Module

### High Priority (TDD Required)

| Module | File | Reason |
|--------|------|--------|
| Editor | `sandbox.ts` | Security-critical code execution |
| Auth | `access-code.ts` | Code generation/validation |
| Tutor | `useTutorChat.ts` | Complex state orchestration |
| Tutor | `useTutorContext.ts` | AI prompt building |
| Lesson | `useProgress.ts` | Progress calculations |

### Medium Priority (Test-After)

| Module | File | Reason |
|--------|------|--------|
| Auth | `useAuth.ts` | Integration with Supabase |
| Lesson | `useLesson.ts` | Data fetching |
| Tutor | `tutor-service.ts` | Edge Function calls |

### Lower Priority (E2E Coverage)

| Flow | Test |
|------|------|
| Landing → Login → Dashboard | `auth.spec.ts` |
| Code-based access | `auth.spec.ts` |
| Lesson completion | `lesson-flow.spec.ts` |
| Tutor interaction | `tutor.spec.ts` |

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

*Last updated: December 2024*
