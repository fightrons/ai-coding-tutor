# AI Programming Tutor - Project Context

## What This Is
An adaptive AI programming tutor that teaches JavaScript step-by-step. Curriculum-driven, not free-form chat. Feels like a patient human mentor.

## Tech Stack
- **Frontend**: React (Vite), TypeScript, Tailwind CSS v4, shadcn/ui, Monaco Editor
- **Backend**: Supabase (Auth, Postgres, RLS, Edge Functions)
- **AI**: OpenAI GPT-4o-mini via Supabase Edge Function

## Project Structure (Module-Based)
```
src/
├── modules/
│   ├── auth/                     # ✅ Implemented
│   │   ├── components/
│   │   │   ├── AuthGuard.tsx     # Protects routes (auth or code-based)
│   │   │   ├── OnboardingGuard.tsx # Ensures onboarding complete
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx    # Handles signup + code-based upgrade
│   │   │   ├── OnboardingForm.tsx # 4-step: avatar, goal, experience, style
│   │   │   ├── AccountSettings.tsx # Account settings container
│   │   │   ├── ProfileSection.tsx # Avatar + display name editing
│   │   │   ├── AccountSection.tsx # Email change
│   │   │   ├── SecuritySection.tsx # Password change
│   │   │   └── PreferencesSection.tsx # Learning preferences editing
│   │   ├── hooks/
│   │   │   ├── useAuth.ts        # user, session, signIn, signUp, signOut
│   │   │   ├── useStudentProfile.ts # profile, updateProfile, isOnboardingComplete
│   │   │   ├── useAccessCode.ts  # Code-based auth: accessCode, profile, createProfile, validateCode
│   │   │   └── useIdentity.ts    # Unified identity: type, profileId, displayName, avatar
│   │   ├── lib/
│   │   │   └── access-code.ts    # generateAccessCode, generateDisplayName, pickRandomAvatar
│   │   └── index.ts
│   │
│   ├── layout/                   # ✅ Implemented
│   │   ├── components/
│   │   │   └── Header.tsx        # Logo, avatar dropdown, sign out
│   │   └── index.ts
│   │
│   ├── lesson/                   # ✅ Implemented
│   │   ├── components/
│   │   │   ├── LessonContent.tsx # Renders explanation + code sections
│   │   │   ├── ExercisePanel.tsx # Exercise description + hints
│   │   │   ├── LessonLayout.tsx  # Two-panel lesson view (activates persistence listener)
│   │   │   └── ModuleCard.tsx    # Dashboard module cards
│   │   ├── hooks/
│   │   │   ├── useModules.ts     # Fetch all modules + lessons
│   │   │   ├── useLesson.ts      # Fetch single lesson by slug
│   │   │   ├── useProgress.ts    # Track student progress
│   │   │   └── useAttemptPersistence.ts # Persist exercise attempts via event bus
│   │   ├── types/
│   │   │   └── index.ts          # LessonContent, Exercise, etc.
│   │   └── index.ts
│   │
│   ├── editor/                   # ✅ Implemented
│   │   ├── components/
│   │   │   ├── CodeEditor.tsx    # Monaco editor wrapper
│   │   │   ├── OutputPanel.tsx   # Shows output + test results
│   │   │   └── EditorPanel.tsx   # Combined editor + output
│   │   ├── hooks/
│   │   │   └── useCodeRunner.ts  # Run code, get results
│   │   ├── lib/
│   │   │   └── sandbox.ts        # Execute JS, capture console.log
│   │   ├── types/
│   │   │   └── index.ts          # TestCase, ExecutionResult
│   │   └── index.ts
│   │
│   └── tutor/                    # ✅ Implemented
│       ├── components/
│       │   ├── TutorPanel.tsx    # Collapsible chat sidebar
│       │   ├── TutorToggle.tsx   # "Ask Anu" button
│       │   ├── MessageList.tsx   # Chat message display
│       │   ├── MessageBubble.tsx # Individual message styling
│       │   ├── MessageInput.tsx  # Chat input with auto-focus
│       │   └── ProactivePrompt.tsx # "Need help?" prompt
│       ├── hooks/
│       │   ├── useTutorMessages.ts # Fetch/save messages to Supabase
│       │   ├── useTutorContext.ts  # Build AI context from lesson/code
│       │   ├── useExerciseAttempts.ts # Track failures, trigger help (in-memory)
│       │   └── useTutorChat.ts   # Main orchestration hook (publishes events)
│       ├── lib/
│       │   ├── config.ts         # TUTOR_CONFIG (name: "Anu")
│       │   ├── tutor-service.ts  # Supabase Edge Function client
│       │   └── prompt-templates.ts # Mock response templates
│       ├── types/
│       │   └── index.ts          # TutorMessage, TutorContext, etc.
│       └── index.ts
│
├── pages/                        # Thin wrappers for routing
│   ├── Landing.tsx
│   ├── Login.tsx
│   ├── Signup.tsx
│   ├── Onboarding.tsx
│   ├── Dashboard.tsx
│   ├── Lesson.tsx
│   └── Profile.tsx
│
├── shared/
│   ├── components/
│   │   ├── ui/                   # shadcn/ui (button, card, input, label, etc.)
│   │   ├── Avatar.tsx            # Emoji avatar display
│   │   └── AvatarPicker.tsx      # Emoji selection grid
│   ├── hooks/
│   │   ├── useEventBus.tsx       # Type-safe pub/sub event bus (React Context)
│   │   ├── useBreakpoint.ts      # Responsive breakpoint detection
│   │   ├── useDebounce.ts        # Debounce hook
│   │   ├── useLocalStorage.ts    # LocalStorage hook
│   │   └── index.ts              # Export all hooks
│   ├── lib/
│   │   ├── supabase.ts           # Typed Supabase client
│   │   ├── logger.ts             # Dev-only logging
│   │   ├── timezone.ts           # Timezone detection utilities
│   │   └── utils.ts              # cn() helper
│   └── types/
│       ├── database.ts           # Supabase generated types
│       └── events.ts             # Event bus type definitions
│
├── App.tsx                       # Router with guards
├── main.tsx                      # Entry point (wraps with EventBusProvider)
└── index.css                     # Tailwind v4 + shadcn theme
```

## Database Schema
```
modules           # Lesson groups (Variables, Functions, etc.)
lessons           # Individual lessons with content + exercises
student_profiles  # User preferences, skill level, avatar, access_code, auth_user_id
student_progress  # Completion status per lesson
exercise_attempts # Code submissions, pass/fail, timing
tutor_messages    # Chat history with AI tutor
```

### Learner States
- **Anonymous Visitor** — No profile exists, sees landing page
- **Code-Based Student** — Profile with access_code, auth_user_id is null
- **Registered Learner** — Profile with auth_user_id linked to Supabase auth

## Routes
| Route | Auth | Onboarding | Description |
|-------|------|------------|-------------|
| `/` | - | - | Landing page (auto-redirects if authenticated) |
| `/login` | - | - | Sign in (registered users) |
| `/signup` | - | - | Create account (or upgrade from code-based) |
| `/onboarding` | ✓ | - | 4-step profile setup (registered users only) |
| `/learn` | ✓* | ✓ | Dashboard |
| `/learn/:slug` | ✓* | ✓ | Lesson view |
| `/profile` | ✓* | - | Account settings |

*Auth = code-based OR registered user

## Commands
```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # ESLint
npm run preview  # Preview production build

# Testing
npm run test          # Unit/integration tests (watch mode)
npm run test:run      # Unit/integration tests (single run)
npm run test:coverage # With coverage report
npm run e2e           # E2E tests (all browsers) - uses production Supabase
npm run e2e:ui        # E2E with Playwright UI
npm run e2e:local     # E2E tests against LOCAL Supabase (recommended)
npm run e2e:local:ui  # E2E with UI against local Supabase
npm run dev:local     # Dev server with local Supabase

# Supabase
npx supabase login
npx supabase link --project-ref <PROJECT_ID>
npx supabase db push
npx supabase gen types typescript --project-id <PROJECT_ID> > src/shared/types/database.ts

# Edge Functions (local development)
supabase start                                    # Start local Supabase stack
supabase functions serve --env-file supabase/.env.local  # Serve functions locally

# Edge Functions (production)
supabase secrets set OPENAI_API_KEY=sk-xxx        # Set OpenAI key
supabase functions deploy tutor-chat --no-verify-jwt  # Deploy tutor function
```

## Environment Variables
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

## Architecture Rules
1. **Pages are thin** — Only routing, layout composition, and passing props down
2. **Modules are self-contained** — Each module owns its components, hooks, libs, types
3. **Shared is global** — Only truly cross-cutting concerns (supabase client, ui components)
4. **No cross-module imports of internal files** — Export from module index if needed
5. **Dev-only logging** — Use `logger` from `@/shared/lib/logger`
6. **Event-driven for cross-module data** — Use event bus for decoupled communication

## Event Bus Architecture
The app uses a type-safe pub/sub event bus (`src/shared/hooks/useEventBus.tsx`) for decoupled cross-module communication.

### When to Use
- Cross-module data flow (e.g., tutor → lesson persistence)
- Fire-and-forget operations (don't block UI)
- Multiple subscribers need same data (e.g., persistence + future gamification)

### Usage Pattern
```typescript
// Publishing (in tutor module)
import { usePublish } from '@/shared/hooks'
const publish = usePublish()
publish('exercise:attempt_recorded', { studentId, lessonId, passed, ... })

// Subscribing (in lesson module)
import { useSubscribe } from '@/shared/hooks'
useSubscribe('exercise:attempt_recorded', (data) => {
  // Handle event (e.g., persist to database)
})
```

### Available Events
| Event | Publisher | Subscribers | Purpose |
|-------|-----------|-------------|---------|
| `exercise:attempt_recorded` | `useTutorChat` | `useAttemptPersistence` | Persist attempts to DB |
| `lesson:completed` | (future) | (future) | Track lesson completion |
| `code:run_executed` | (future) | (future) | Track code runs |

### Testing with Event Bus
Components/hooks using the event bus must be wrapped in `EventBusProvider`:
```typescript
import { EventBusProvider } from '@/shared/hooks'
function Wrapper({ children }) {
  return <EventBusProvider>{children}</EventBusProvider>
}
const { result } = renderHook(() => useMyHook(), { wrapper: Wrapper })
```

## Key Design Principles
1. **Curriculum controls AI** — Lessons define what tutor can teach
2. **Data drives adaptation** — Track attempts, errors, time to adjust difficulty
3. **One concept at a time** — No knowledge dumping
4. **Ask before advancing** — Verify understanding with check questions
5. **Hints, not answers** — Unless explicitly requested

## Coding Conventions
- Use TypeScript strict mode
- Prefer named exports
- Use `import type` for type-only imports
- Path alias: `@/` maps to `src/`
- shadcn/ui components: `@/shared/components/ui`
- Each module exports via `index.ts`
- Keep page components thin (<50 lines ideal)
- Business logic in hooks/libs, not components

## MVP Constraints
- JavaScript only (no other languages)
- Linear lesson flow (no branching)
- Desktop-first (no mobile optimization)
- No social features or user-generated content
- Gamification in progress (see `docs/PERSONALIZED_LEARNING.md`)

## Documentation
- `docs/ONBOARDING.md` — Getting started guide
- `docs/TESTING.md` — Testing strategy and TDD approach
- `docs/FRICTIONLESS_ONBOARDING.md` — Access code system design
- `docs/PERSONALIZED_LEARNING.md` — Gamification & data collection spec (Phase 1 complete)
- `docs/FUTURE_ENHANCEMENTS.md` — Roadmap and planned features
- `docs/SCAFFOLD_PROMPT.md` — Reusable project scaffold template
