# Architecture Decisions

This document captures key architectural decisions for the AI Programming Tutor project.

## Overview

The application is a curriculum-driven AI programming tutor that teaches JavaScript through step-by-step lessons. The architecture prioritizes:

- **Modularity** — Self-contained feature modules
- **Testability** — Clear boundaries for unit and e2e testing
- **Maintainability** — Thin pages, fat modules pattern

## Tech Stack Rationale

| Technology | Choice | Rationale |
|------------|--------|-----------|
| Build Tool | Vite | Fast HMR, native ESM, excellent DX |
| UI Framework | React 19 | Ecosystem maturity, hooks-first patterns |
| Language | TypeScript (strict) | Catch bugs at compile time |
| Styling | Tailwind CSS v4 | Utility-first, design system consistency |
| Components | shadcn/ui | Accessible, customizable, not a dependency |
| Routing | React Router v7 | De facto standard, nested routes |
| Backend | Supabase | Auth, Postgres, Edge Functions, RLS |
| AI | OpenAI GPT-4o-mini | Cost-effective for educational use |
| Forms | React Hook Form + Zod | Type-safe validation, minimal re-renders |

## Module Architecture

```
src/modules/[feature]/
├── components/       # UI components specific to this feature
├── hooks/            # Data fetching and state management
├── lib/              # Business logic, services, validation
│   └── *.test.ts     # Co-located unit tests
├── types/            # Feature-specific TypeScript types
└── index.ts          # Barrel export (public API)
```

### Key Principles

1. **Barrel Exports Only** — External code imports from `index.ts`, never internal paths
2. **Pages are Thin** — Route components handle routing/composition only (<100 lines)
3. **Hooks-First State** — `useState`/`useCallback` by default, Context when truly needed
4. **Guard Composition** — Protect routes with composable wrapper components
5. **Event-Driven Cross-Module Communication** — Use pub/sub event bus for decoupled data flow

### Current Modules

| Module | Responsibility |
|--------|----------------|
| `auth` | Authentication, profile management, access codes |
| `layout` | App shell, header, navigation |
| `lesson` | Curriculum content, module/lesson data |
| `editor` | Monaco code editor, execution sandbox |
| `tutor` | AI chat interface, context building |

## Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Pages     │────▶│   Modules    │────▶│  Supabase   │
│  (routing)  │     │(hooks/logic) │     │  (backend)  │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Edge Function│
                    │  (AI tutor)  │
                    └──────────────┘
```

### Event-Driven Architecture

Cross-module communication uses a type-safe pub/sub event bus (`src/shared/hooks/useEventBus.tsx`):

```
┌─────────────┐   publish()   ┌─────────────┐   subscribe()   ┌─────────────┐
│   Tutor     │──────────────▶│  Event Bus  │◀────────────────│   Lesson    │
│  Module     │               │  (Context)  │                 │   Module    │
└─────────────┘               └─────────────┘                 └─────────────┘
                                    │
                                    ▼
                              ┌─────────────┐
                              │  Supabase   │
                              │ (persist)   │
                              └─────────────┘
```

**When to use Event Bus:**
- Cross-module data flow (e.g., tutor → lesson persistence)
- Fire-and-forget operations (never block UI)
- Multiple subscribers need same data (e.g., persistence + gamification)

**Current Events:**
| Event | Publisher | Subscriber | Purpose |
|-------|-----------|------------|---------|
| `exercise:attempt_recorded` | `useTutorChat` | `useAttemptPersistence` | Persist attempts |

## Authentication Strategy

The app supports two learner states:

1. **Code-Based Student** — Quick start with access code, no email required
2. **Registered Learner** — Full account with email/password via Supabase Auth

This dual approach reduces friction for beginners while allowing progression to full accounts.

## Database Design

Row Level Security (RLS) is enabled on all tables. Key tables:

- `student_profiles` — User preferences, avatar, skill level
- `modules` / `lessons` — Curriculum content (read-only for students)
- `student_progress` — Completion tracking per lesson
- `exercise_attempts` — Code submissions with pass/fail status
- `tutor_messages` — Persistent chat history

## AI Integration

The tutor AI is constrained by:

1. **Curriculum Context** — Only teaches concepts from current lesson
2. **Socratic Method** — Asks questions, gives hints, not direct answers
3. **Attempt Tracking** — Proactively offers help after repeated failures

Edge Function (`tutor-chat`) handles:
- Building context from lesson + student code
- Rate limiting and token management
- Response streaming (future)

## Testing Strategy

| Layer | Tool | Location |
|-------|------|----------|
| Unit | Vitest | `src/modules/*/lib/*.test.ts` |
| Component | React Testing Library | `src/modules/*/components/*.test.tsx` |
| E2E | Playwright | `e2e/*.spec.ts` |

Coverage thresholds: 60% lines, 50% branches, 70% functions.

See `docs/TESTING.md` for detailed testing guide.

## Future Considerations

- **Code Execution Security** — Currently client-side sandbox; may need server-side
- **Real-time Collaboration** — Supabase Realtime for pair programming
- **Mobile Support** — Desktop-first MVP, responsive design later
- **Multiple Languages** — Currently JavaScript only; architecture supports extension

## Related Documentation

- `CLAUDE.md` — AI assistant context, coding conventions, event bus reference
- `docs/TESTING.md` — Testing strategy and TDD approach
- `docs/ONBOARDING.md` — Getting started guide
- `docs/FRICTIONLESS_ONBOARDING.md` — Access code system design
- `docs/PERSONALIZED_LEARNING.md` — Gamification & data collection implementation
- `docs/FUTURE_ENHANCEMENTS.md` — Roadmap and planned features
