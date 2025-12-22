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
│   │   │   ├── LessonLayout.tsx  # Two-panel lesson view
│   │   │   └── ModuleCard.tsx    # Dashboard module cards
│   │   ├── hooks/
│   │   │   ├── useModules.ts     # Fetch all modules + lessons
│   │   │   ├── useLesson.ts      # Fetch single lesson by slug
│   │   │   └── useProgress.ts    # Track student progress
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
│       │   ├── useExerciseAttempts.ts # Track failures, trigger help
│       │   └── useTutorChat.ts   # Main orchestration hook
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
