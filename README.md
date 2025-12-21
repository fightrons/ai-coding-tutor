# AI Coding Tutor

An adaptive AI programming tutor that teaches JavaScript step-by-step with personalized pacing and explanations.

## Features

### Implemented
- **Frictionless Onboarding** — Start learning instantly without registration
- **Access Code System** — Resume your progress on any device with a memorable code (e.g., SWIFT-BEAR-73)
- **Optional Registration** — Upgrade to a permanent account anytime
- **Curriculum-Driven Learning** — Structured lessons covering JavaScript fundamentals
- **Personalized Onboarding** — Choose avatar, learning goal, experience level, and style
- **Interactive Code Editor** — Monaco-powered editor with syntax highlighting
- **Real-time Code Execution** — Run JavaScript and see output instantly
- **Automated Testing** — Test cases validate your solutions
- **Progress Tracking** — Auto-completion when tests pass

### Coming Soon
- **AI Tutor** — Patient mentor that gives hints, not answers
- **Adaptive Difficulty** — Adjusts based on student performance

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend**: Supabase (Auth, Postgres, RLS)
- **AI**: Cloudflare Workers + LLM
- **Editor**: Monaco Editor

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account

### Setup

1. **Clone and install**
   ```bash
   git clone https://github.com/veliyat/ai-coding-tutor.git
   cd ai-coding-tutor
   npm install
   ```

2. **Create Supabase project**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Copy the Project URL and anon key

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Run database migrations**
   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```

5. **Generate types**
   ```bash
   npx supabase gen types typescript --project-id YOUR_PROJECT_REF > src/shared/types/database.ts
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── modules/
│   ├── auth/         # Authentication, onboarding, profiles
│   ├── layout/       # Header, navigation
│   ├── lesson/       # Curriculum display, progress tracking
│   ├── editor/       # Monaco editor, code execution, testing
│   └── tutor/        # AI tutor (coming soon)
├── pages/            # Route components (thin wrappers)
├── shared/           # UI components, utilities, types
└── App.tsx           # Router configuration
```

See [CLAUDE.md](./CLAUDE.md) for detailed architecture documentation.

## Scripts

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

## License

MIT
