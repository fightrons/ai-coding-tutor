# AI Coding Tutor

An adaptive AI programming tutor that teaches JavaScript step-by-step with personalized pacing and explanations.

## Features

- **Adaptive Learning** — Adjusts difficulty based on student performance
- **Curriculum-Driven** — Structured lessons, not free-form chat
- **Personalized Onboarding** — Tailors experience to learning goals and style
- **Real-time Code Execution** — Write and run JavaScript in the browser
- **AI Tutor** — Patient mentor that gives hints, not answers

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
├── modules/          # Feature modules (auth, lesson, editor, tutor)
├── pages/            # Route components (thin wrappers)
├── shared/           # Shared components, utilities, types
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
