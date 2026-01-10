# Future Enhancements

A planning and execution guide for upcoming features and improvements.

---

## Personalized Learning

### Contextual Video Resources
**Current**: Text-based lessons only
**Goal**: Curated video content that reinforces concepts

- Embed relevant tutorial videos within lesson content
- Match videos to specific coding problems/concepts
- Short clips (2-5 min) for quick reinforcement
- Full tutorials for deeper exploration
- Sources: YouTube educational channels, custom recordings

### Adaptive Topic Progression
**Current**: Fixed linear curriculum
**Goal**: Dynamic path based on learner readiness

- Start with ONE core concept per session
- Assess comprehension before introducing new material
- Detect mastery signals (speed, accuracy, confidence)
- Unlock next topic only when current is solid
- Avoid overwhelming with multiple concepts at once

### Interest-Based Next Steps
**Current**: Predetermined lesson order
**Goal**: Suggest what will engage the learner most

- Track which exercises sparked curiosity (time spent, re-attempts)
- Identify patterns: does learner prefer logic puzzles, visual output, real-world apps?
- Recommend next lesson based on interest signals
- "You might enjoy this next..." suggestions
- Balance interest with foundational requirements

---

## MVP Expansion Features

### Multi-Language Support
**Current**: JavaScript only
**Goal**: Add Python, TypeScript, and potentially Java

- Language selector in editor
- Language-specific sandbox execution (Worker-based for isolation)
- Curriculum content per language
- Syntax highlighting and IntelliSense per language

### Mobile Optimization
**Current**: Desktop-first
**Goal**: Responsive experience across devices

- Collapsible panels for lesson content, editor, and tutor
- Touch-friendly code editor controls
- Bottom sheet for tutor on mobile
- Swipe gestures for panel navigation

### Branching Lesson Paths
**Current**: Linear lesson flow
**Goal**: Adaptive, non-linear curriculum

- Prerequisite system for lessons
- Dynamic difficulty adjustment based on performance
- Optional challenge exercises
- "Choose your path" decision points

### Gamification
**Current**: Phase 1 (Data Collection) complete
**Goal**: Engagement and motivation features
**Spec**: See `docs/PERSONALIZED_LEARNING.md` for full implementation plan

**Progress**:
- [x] Event bus architecture for decoupled data flow
- [x] Exercise attempt persistence to database
- [x] Database triggers for progress aggregation
- [ ] XP/points system (Phase 2)
- [ ] Daily streak counter (Phase 2)
- [ ] Achievement badges (Phase 2)
- [ ] Dashboard redesign (Phase 3)

### Social Features
**Current**: None
**Goal**: Community and peer learning

- Share progress/solutions with privacy controls
- Study groups
- Per-lesson discussion threads
- Peer code review (optional)

---

## Technical Improvements

### Testing Infrastructure
**Current**: ✅ Implemented (400+ tests)
**Priority**: High (COMPLETE)
**Docs**: See `docs/TESTING.md` for full testing guide

#### Recommended Stack

**Unit/Integration Tests: Vitest + React Testing Library**
Vitest is the optimal choice for Vite + React projects:
- Native Vite integration (shares config, transforms, and plugins)
- Jest-compatible API (familiar syntax, easy migration paths)
- Fast HMR-based watch mode for rapid development
- Built-in TypeScript support without additional configuration
- First-class ESM support

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/coverage-v8
```

**E2E Tests: Playwright (recommended over Puppeteer)**
Playwright offers significant advantages:
- Multi-browser support (Chromium, Firefox, WebKit/Safari)
- Superior TypeScript integration
- Built-in auto-waiting (more reliable than manual waits)
- Excellent Vite integration via `@playwright/test`
- Parallel test execution out of the box
- Built-in test generator and trace viewer for debugging

```bash
npm install -D @playwright/test
npx playwright install
```

**Alternative: Puppeteer** (if Chrome-only or specific CI requirements)
- Chrome/Chromium-focused
- Lower-level API, more control
- Smaller bundle if only Chrome is needed

```bash
npm install -D puppeteer jest-puppeteer @types/puppeteer
```

#### Configuration Files

**vitest.config.ts**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**playwright.config.ts**
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
```

**src/test/setup.ts**
```typescript
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
```

#### Package.json Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

#### Priority Test Coverage

**High Priority - Unit Tests**
| Module | File | Why |
|--------|------|-----|
| Editor | `sandbox.ts` | Core code execution logic, security-critical |
| Auth | `access-code.ts` | Code generation, validation logic |
| Tutor | `useTutorChat.ts` | Complex state management, API orchestration |
| Tutor | `useTutorContext.ts` | Context building for AI prompts |
| Lesson | `useProgress.ts` | Progress tracking calculations |

**High Priority - Integration Tests**
| Area | Scope |
|------|-------|
| Auth hooks | `useAuth`, `useAccessCode` with mocked Supabase |
| Lesson hooks | `useLesson`, `useModules` with mocked data |
| Tutor service | `tutor-service.ts` with mocked Edge Function |

**High Priority - E2E Tests**
| Flow | Steps |
|------|-------|
| Code-based access | Landing → Enter code → Dashboard |
| Full registration | Signup → Onboarding (4 steps) → Dashboard |
| Lesson completion | Dashboard → Lesson → Write code → Pass exercise → Next lesson |
| Tutor interaction | Open tutor → Ask question → Receive response |
| Account settings | Profile → Update avatar/name → Verify persistence |

#### Test File Structure
```
src/
├── modules/
│   ├── auth/
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useAuth.test.ts
│   │   └── lib/
│   │       ├── access-code.ts
│   │       └── access-code.test.ts
│   ├── editor/
│   │   └── lib/
│   │       ├── sandbox.ts
│   │       └── sandbox.test.ts
│   └── tutor/
│       └── hooks/
│           ├── useTutorChat.ts
│           └── useTutorChat.test.ts
├── test/
│   ├── setup.ts
│   ├── mocks/
│   │   ├── supabase.ts
│   │   └── handlers.ts (MSW)
│   └── utils/
│       └── render.tsx (custom render with providers)
e2e/
├── auth.spec.ts
├── lesson-flow.spec.ts
├── tutor.spec.ts
└── fixtures/
    └── test-user.json
```

#### Testing Strategy: Local Supabase vs Mocking

**Prefer Local Supabase** for integration and E2E tests:
```bash
supabase start   # Spins up local Postgres, Auth, Edge Functions
```

Benefits of local Supabase:
- Tests real RLS policies
- Tests actual auth flows
- Tests Edge Functions locally
- Catches bugs that mocks would miss
- Already part of the dev workflow

| Test Type | Approach |
|-----------|----------|
| Unit (pure logic) | No DB needed, or minimal mocking |
| Integration (hooks, queries) | Local Supabase |
| E2E (Playwright) | Local Supabase |
| CI pipeline | Local Supabase via `supabase start` |

**Mocking** — use sparingly, only for:
- Pure utility functions (e.g., `access-code.ts` string generation)
- Simulating specific error states (network failure, timeout)
- Component render tests that don't need real data

```typescript
// src/test/mocks/supabase.ts (for edge cases only)
import { vi } from 'vitest'

export const mockSupabaseError = {
  from: vi.fn(() => ({
    select: vi.fn().mockRejectedValue(new Error('Network error')),
  })),
}
```

#### Test Environment Setup

**Local development & CI test environment:**
```bash
# .env.test (points to local Supabase)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<local-anon-key-from-supabase-start>
```

**Seed data for tests:**
```bash
# supabase/seed.sql - runs automatically with supabase start
INSERT INTO modules (id, title, slug, order_index) VALUES
  ('test-module-1', 'Test Module', 'test-module', 1);

INSERT INTO lessons (id, module_id, title, slug, order_index) VALUES
  ('test-lesson-1', 'test-module-1', 'Test Lesson', 'test-lesson', 1);
```

#### CI Integration (GitHub Actions)
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - name: Start local Supabase
        run: npx supabase start
      - run: npm run test:run
      - run: npm run test:coverage
      - name: Stop Supabase
        if: always()
        run: npx supabase stop

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - name: Start local Supabase
        run: npx supabase start
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - name: Stop Supabase
        if: always()
        run: npx supabase stop
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### Caching & State Management
**Current**: Fresh fetches on every navigation
**Priority**: High

- Implement React Query or SWR for lesson/module data
- Background revalidation for stale data
- localStorage fallback for tutor messages (offline access)
- Optimistic updates for progress tracking

### Error Handling
**Current**: Basic try-catch with generic messages
**Priority**: High

- Categorize errors (syntax, runtime, network, auth)
- Retry logic with exponential backoff for API calls
- User-friendly error messages with recovery suggestions
- Structured error logging for debugging

### Security Hardening
**Current**: Basic validation
**Priority**: Medium

- Rate limiting on access code validation (prevent brute force)
- Worker-based code execution for true process isolation
- Input sanitization for user-submitted code
- Audit logging for sensitive actions

### Performance Optimization
**Current**: Sequential queries, some artificial delays
**Priority**: Medium

- Batch/RPC calls to reduce database round trips
- React 19 `useTransition` for non-blocking UI updates
- Code splitting for lesson content
- Image optimization with lazy loading

---

## AI Tutor Enhancements

### Improved Response Quality
- Few-shot examples in system prompt for consistency
- Include learning style preference from onboarding in context
- Confidence scoring for AI responses
- Track hint effectiveness for strategy adjustment

### Contextual Awareness
- Use exercise attempt history to inform hints
- Detect common error patterns and proactively address them
- Reference previous successful solutions for encouragement
- Adapt verbosity based on student frustration signals

### Conversation Features
- Follow-up question suggestions
- "Explain like I'm 5" mode toggle
- Code annotation (AI highlights specific lines)
- Voice input/output (accessibility)

---

## Accessibility

### Keyboard Navigation
- `Ctrl+Enter` to run code
- `Ctrl+R` to reset editor
- `Escape` to close tutor panel
- Tab navigation through all interactive elements

### Screen Reader Support
- ARIA labels for code output and errors
- Live regions for dynamic content updates
- Semantic HTML for lesson content

### Visual Accessibility
- High contrast mode toggle
- Configurable font size in editor
- Reduced motion mode
- Focus indicators for all interactive elements

---

## Analytics & Monitoring

### Activity Definition
**Current**: Exercise attempts tracked (Phase 1 complete)
**Goal**: Define and track user activity for engagement metrics
**Note**: `exercise_attempts` table now populated via event bus; `student_progress` aggregates auto-updated

#### What Counts as Activity?
Need to decide which actions constitute "activity" for tracking purposes:

| Action | Counts? | Notes |
|--------|---------|-------|
| **Page Load (Authenticated)** | ❓ | Minimum bar - user opened the app |
| **Click "Continue" to current lesson** | ❓ | Shows intent to resume learning |
| **View lesson content** | ❓ | Passive engagement |
| **Run code in editor** | ❓ | Active coding practice |
| **Submit exercise attempt** | ❓ | Explicit learning action |
| **Ask tutor a question** | ❓ | Active engagement with AI |
| **Complete a lesson** | ❓ | Milestone achievement |
| **Idle time on lesson page** | ❓ | May indicate reading/thinking |

#### Proposed Activity Tiers

**Tier 1: Passive Activity** (updates "last seen")
- Loading any authenticated page
- Navigating between lessons
- Opening tutor panel

**Tier 2: Active Engagement** (counts toward daily activity)
- Running code in editor
- Submitting exercise attempts
- Asking tutor questions
- Clicking hints

**Tier 3: Learning Milestones** (achievements/streaks)
- Completing a lesson
- Passing an exercise on first attempt
- Multiple correct submissions in a session

#### Implementation Considerations
- Store `last_activity_at` timestamp on `student_profiles`
- Separate `last_active_date` for daily streak calculation
- Consider debouncing (e.g., multiple code runs within 1 min = 1 activity)
- Decide: Does opening app count for streak, or must user complete something?

#### Open Questions
1. Should page load alone maintain a streak?
2. Minimum engagement time per session?
3. Track per-lesson activity vs global activity?
4. Privacy: How long to retain detailed activity logs?

### Learning Analytics
- Event tracking: lesson start, code execution, hint requests, completion
- Time-to-completion metrics
- Failure pattern analysis
- Hint usage correlation to success rates

### Observability
- Structured logging (JSON format) for production
- Error tracking integration (Sentry/LogRocket)
- Core Web Vitals monitoring
- OpenAI API cost tracking and usage alerts

---

## DevOps & Infrastructure

### CI/CD
- GitHub Actions for lint, test, build on PR
- Automated deployment to Vercel on merge
- Database migration automation
- Environment-specific configs (staging/production)

### Developer Experience
- Pre-commit hooks (lint, type-check)
- Storybook for component documentation
- API mocking (MSW) for local development
- Constants file for magic numbers

---

## How to Use This Document

### Adding a New Enhancement
1. Add it under the appropriate category
2. Include: current state, goal, and bullet points for scope
3. Mark priority if known (High/Medium/Low)

### Planning Implementation
When picking up an enhancement:
1. Create a detailed implementation plan
2. Break into discrete tasks
3. Identify affected files and dependencies
4. Consider backward compatibility

### Tracking Progress
- [ ] Not started
- [x] Completed
- 🚧 In progress

---

*Last updated: January 2026*
*Testing section expanded: December 2024*
*Gamification Phase 1 complete: January 2026*
