# AI Programming Tutor - Project Context

## What This Is
An adaptive AI programming tutor that teaches JavaScript step-by-step. Curriculum-driven, not free-form chat. Feels like a patient human mentor.

## Tech Stack
- **Frontend**: React (Vite), TypeScript, Tailwind CSS v4, shadcn/ui, Monaco Editor
- **Backend**: Supabase (Auth, Postgres, RLS), Cloudflare Workers (AI orchestration)
- **AI**: LLM-based tutor with prompt-driven behavior

## Project Structure (Module-Based)
```
src/
├── modules/
│   ├── auth/                     # ✅ Implemented
│   │   ├── components/
│   │   │   ├── AuthGuard.tsx     # Protects routes, redirects to /login
│   │   │   ├── OnboardingGuard.tsx # Ensures onboarding complete
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   └── OnboardingForm.tsx # 4-step: avatar, goal, experience, style
│   │   ├── hooks/
│   │   │   ├── useAuth.ts        # user, session, signIn, signUp, signOut
│   │   │   └── useStudentProfile.ts # profile, updateProfile, isOnboardingComplete
│   │   └── index.ts
│   │
│   ├── layout/                   # ✅ Implemented
│   │   ├── components/
│   │   │   └── Header.tsx        # Logo, avatar, sign out
│   │   └── index.ts
│   │
│   ├── lesson/                   # 🔲 Not yet implemented
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── types/
│   │
│   ├── editor/                   # 🔲 Not yet implemented
│   │   ├── components/
│   │   ├── hooks/
│   │   └── lib/
│   │
│   └── tutor/                    # 🔲 Not yet implemented
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       └── types/
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
│   ├── lib/
│   │   ├── supabase.ts           # Typed Supabase client
│   │   ├── logger.ts             # Dev-only logging
│   │   └── utils.ts              # cn() helper
│   └── types/
│       └── database.ts           # Supabase generated types
│
├── App.tsx                       # Router with guards
├── main.tsx
└── index.css                     # Tailwind v4 + shadcn theme
```

## Database Schema
```
modules           # Lesson groups (Variables, Functions, etc.)
lessons           # Individual lessons with content + exercises
student_profiles  # User preferences, skill level, avatar
student_progress  # Completion status per lesson
exercise_attempts # Code submissions, pass/fail, timing
tutor_messages    # Chat history with AI tutor
```

## Routes
| Route | Auth | Onboarding | Description |
|-------|------|------------|-------------|
| `/` | - | - | Landing page |
| `/login` | - | - | Sign in |
| `/signup` | - | - | Create account |
| `/onboarding` | ✓ | - | 4-step profile setup |
| `/learn` | ✓ | ✓ | Dashboard |
| `/learn/:slug` | ✓ | ✓ | Lesson view |
| `/profile` | ✓ | - | Profile settings |

## Commands
```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # ESLint
npm run preview  # Preview production build

# Supabase
npx supabase login
npx supabase link --project-ref <PROJECT_ID>
npx supabase db push
npx supabase gen types typescript --project-id <PROJECT_ID> > src/shared/types/database.ts
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
- No gamification, social features, or user-generated content
