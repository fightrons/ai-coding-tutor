# Developer Onboarding Guide

Get the AI Coding Tutor running locally in under 15 minutes.

## Prerequisites

- **Node.js 18+** — [Download](https://nodejs.org/)
- **Docker Desktop** — [Download](https://www.docker.com/products/docker-desktop/) (required for local Supabase)
- **Supabase CLI** — Install via `npm install -g supabase`
- **OpenAI API Key** — [Get one here](https://platform.openai.com/api-keys)

## Step 1: Clone and Install

```bash
git clone https://github.com/fightrons/ai-coding-tutor.git
cd ai-coding-tutor
npm install
```

## Step 2: Set Up Supabase Project

### Option A: Use Supabase Cloud (Recommended for Production)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish provisioning (~2 minutes)
3. Go to **Settings > API** and copy:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - `anon` public key

4. Create your environment file:
   ```bash
   cp .env.example .env
   ```

5. Fill in `.env`:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### Option B: Use Local Supabase (For Development)

1. Make sure Docker Desktop is running
2. Start the local Supabase stack:
   ```bash
   supabase start
   ```
   This takes a few minutes on first run (downloads containers).

3. When complete, you'll see local credentials. Create `.env`:
   ```
   VITE_SUPABASE_URL=http://127.0.0.1:54321
   VITE_SUPABASE_ANON_KEY=<anon key from output>
   ```

## Step 3: Run Database Migrations

### For Supabase Cloud:

```bash
# Log in to Supabase CLI
npx supabase login

# Link to your project (find project ref in Supabase dashboard URL)
npx supabase link --project-ref YOUR_PROJECT_REF

# Push migrations to create tables and seed data
npx supabase db push
```

### For Local Supabase:

Migrations run automatically when you start Supabase locally.

## Step 4: Generate TypeScript Types

```bash
# For cloud project
npx supabase gen types typescript --project-id YOUR_PROJECT_REF > src/shared/types/database.ts

# For local project
npx supabase gen types typescript --local > src/shared/types/database.ts
```

## Step 5: Set Up the AI Tutor (Edge Function)

The tutor uses an OpenAI-powered Edge Function.

### For Local Development:

1. Create `supabase/.env.local`:
   ```
   OPENAI_API_KEY=sk-your-openai-key
   ```

2. In a separate terminal, serve the function:
   ```bash
   supabase functions serve --env-file supabase/.env.local
   ```

### For Production:

```bash
# Set your OpenAI key as a secret
supabase secrets set OPENAI_API_KEY=sk-your-openai-key

# Deploy the tutor function
supabase functions deploy tutor-chat --no-verify-jwt
```

## Step 6: Start the Dev Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Switching Between Local and Cloud

To switch between local Supabase and cloud:

1. **Use local**: Rename `.env` to `.env.cloud.bak`, create new `.env` with local credentials
2. **Use cloud**: Rename `.env.local.bak` back to `.env`
3. Restart the dev server after switching

## Verification Checklist

- [ ] Landing page loads at `localhost:5173`
- [ ] Can start learning (creates access code)
- [ ] Onboarding flow works (avatar, goal, experience, style)
- [ ] Dashboard shows modules and lessons
- [ ] Code editor runs JavaScript
- [ ] Tests pass/fail correctly
- [ ] AI tutor (Anu) responds to questions

## Common Issues

### "Cannot connect to Docker daemon"
Start Docker Desktop and wait for it to fully initialize.

### "Connection refused 127.0.0.1:54321"
Run `supabase start` to start the local Supabase stack.

### CORS errors when calling tutor
Make sure the Edge Function is deployed with `--no-verify-jwt` flag.

### 404 on page refresh (production)
Ensure your hosting platform has SPA rewrites configured. For Vercel, the `vercel.json` handles this.

## Project Structure Quick Reference

```
src/
├── modules/           # Feature modules (auth, lesson, editor, tutor)
├── pages/             # Route components (thin wrappers)
├── shared/            # Cross-cutting concerns (UI, utils, types)
└── App.tsx            # Router configuration

supabase/
├── functions/         # Edge Functions (tutor-chat)
└── migrations/        # Database schema and seed data
```

## Next Steps

- Read [CLAUDE.md](./CLAUDE.md) for architecture details
- Check out [README.md](./README.md) for feature overview
- Look at existing modules to understand patterns before adding new ones

---

**Questions?** Open an issue on GitHub or reach out to the maintainers.
