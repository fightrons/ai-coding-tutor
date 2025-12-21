# Frictionless Onboarding Design

> A design document for implementing zero-friction onboarding where learners can start immediately without registration.

## Implementation Status

✅ **Implemented** (All 3 Phases Complete)

| Feature | Status | Notes |
|---------|--------|-------|
| Profile creation on "Start Learning" | ✅ | Creates profile with access code, display name, avatar |
| Access code generation | ✅ | Format: `ADJECTIVE-NOUN-NN` (e.g., SWIFT-BEAR-73) |
| Code validation & session restore | ✅ | Via localStorage + manual code entry |
| Progress tracking | ✅ | Uses `useIdentity` hook with `profileId` |
| Registration upgrade | ✅ | `/signup` page links auth user to profile (unified flow) |
| Shared header with user info | ✅ | Same header across Dashboard and Lessons |
| Dashboard info banner | ✅ | Shows access code with copy button |
| Lesson completion prompt | ✅ | Inline registration prompt for code-based users |
| Database migration | ✅ | `003_frictionless_onboarding.sql` |
| Cleanup function | ✅ | `cleanup_inactive_profiles()` - needs pg_cron scheduling |

### Key Files

| File | Purpose |
|------|---------|
| `supabase/migrations/003_frictionless_onboarding.sql` | Schema changes, RLS, cleanup function |
| `src/modules/auth/lib/access-code.ts` | Code generation utilities |
| `src/modules/auth/hooks/useAccessCode.ts` | Code-based auth state |
| `src/modules/auth/hooks/useIdentity.ts` | Unified identity hook |
| `src/pages/Signup.tsx` | Signup page (handles both new signup and code-based upgrade) |
| `src/pages/Landing.tsx` | Start Learning flow |
| `src/modules/layout/components/Header.tsx` | Shared header with user menu |
| `src/modules/auth/components/AccountSettings.tsx` | Account settings (profile, email, password, preferences) |

---

## Core Principle

There are NO "users" unless someone explicitly registers.

- No auth user is created by default
- No email is stored
- No password exists
- Instead, the system creates a **Student Profile**
- A registered account is simply an upgrade of an existing student profile

---

## 1. Learner State Model

### State A: Anonymous Visitor
- No data exists for this person
- No localStorage token
- No profile in database
- Sees: Landing page with curriculum preview and "Start Learning" CTA

### State B: Student Profile (Code-Based)
- `student_profiles` row exists with:
  - Unique `access_code`
  - Random `display_name` (e.g., "Curious Panda")
  - Random `avatar` (emoji)
  - `auth_user_id` is **null**
- Progress tracked in `student_progress`
- Identity persisted via:
  - localStorage (primary)
  - Access code (backup/recovery)
- Can learn, complete lessons, resume sessions

### State C: Registered Learner
- Same `student_profiles` row, but:
  - `auth_user_id` now linked to Supabase auth user
  - `display_name` replaced with real full name
  - `email` stored (via auth, not profile)
- Identity persisted via:
  - Supabase session (primary)
  - Access code (secondary recovery)
- Can login across devices without code

**Key Insight:** States B and C share the same profile row. Registration is an *upgrade*, not a creation.

---

## 2. User Flows

### Flow 1: First-Time Learner

```
Landing Page
    │
    ├─ Sees: "Learn JavaScript" headline
    │        "No sign-up required. Start learning instantly."
    │        "Start Learning" button
    │
    └─ Clicks "Start Learning"
           │
           ├─ [Backend] Create student_profile:
           │     • Generate access_code: "SWIFT-BEAR-73"
           │     • Generate display_name: "Curious Panda"
           │     • Pick avatar: 🐼
           │
           ├─ [Frontend] Store access_code in localStorage
           │
           └─ Redirect to Dashboard (/learn)
                  │
                  └─ Dashboard shows info banner with:
                       • Access code (with copy button)
                       • 10-day inactivity warning
                       • Registration link
```

### Flow 2: Returning Learner (Code-Based)

```
Landing Page
    │
    ├─ [Frontend] Check localStorage for access_code
    │
    ├─ If found:
    │     │
    │     ├─ [Backend] Validate code
    │     │
    │     ├─ If valid → Redirect to dashboard (auto-resume)
    │     │
    │     └─ If invalid → Clear storage, show landing
    │
    └─ If not found:
          │
          ├─ Show landing with:
          │     • "Start Learning" (primary)
          │     • "Have a code? Continue here" (secondary link)
          │
          └─ If learner enters code:
                 │
                 ├─ [Backend] Validate code
                 │
                 ├─ If valid → Store in localStorage, resume
                 │
                 └─ If invalid → Show error, allow retry
```

### Flow 3: Registration Upgrade

```
Trigger: Lesson complete, or learner clicks "Save Progress"
    │
    ├─ Show inline prompt (not modal):
    │     "Register to sync across devices"
    │     [Full Name] [Email] [Password] [Register]
    │     [Skip for now]
    │
    └─ If learner submits:
           │
           ├─ [Backend] Create Supabase auth user
           │
           ├─ [Backend] Update student_profile:
           │     • Set auth_user_id
           │     • Replace display_name with full name
           │
           ├─ [Frontend] Store Supabase session
           │
           ├─ [Frontend] Hide access code UI (no longer needed)
           │
           └─ Continue learning seamlessly
```

---

## 3. Data Model

### Student Profile

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `access_code` | string | Unique, indexed. Format: `WORD-WORD-NN` |
| `display_name` | string | Random initially, replaced with full name on registration |
| `avatar` | string | Emoji (🐼) or identifier |
| `auth_user_id` | uuid (nullable) | FK to Supabase auth.users. Null until registration |
| `created_at` | timestamp | Profile creation time |
| `last_active_at` | timestamp | Updated on each session |

### Access Code Design

**Format:** `ADJECTIVE-NOUN-NN`
- Example: `SWIFT-BEAR-73`, `CALM-RIVER-42`
- Word lists: ~50 adjectives × ~50 nouns × 100 numbers = 250,000 combinations
- Human-readable, memorable, typeable
- Collision handling: retry on duplicate

**Storage:**
- Indexed column on `student_profiles`
- Validated server-side only (never trust client)

### Registration Linking

When a learner registers:
1. Supabase auth user created with email + password
2. `student_profiles.auth_user_id` set to new auth user ID
3. `student_profiles.display_name` updated to provided full name
4. Access code remains valid as recovery mechanism

### Full Name Handling

| State | display_name value |
|-------|-------------------|
| Pre-registration | "Curious Panda" (generated) |
| Post-registration | "Alice Chen" (from registration form) |

Full name is:
- Required during registration (validation: min 2 chars, not empty)
- Stored directly in `display_name` field (replaces random name)
- Not stored in auth.users metadata (single source of truth)

---

## 4. Frontend UX Logic

### Landing Page Behavior

```
On mount:
  1. Check localStorage for `access_code`
  2. Check Supabase session (auth user)

If authenticated (State C):
  → Redirect to /learn (dashboard)

If access_code exists (State B):
  → Validate code with backend
  → If valid: redirect to /learn
  → If invalid: clear storage, show landing

If neither (State A):
  → Show landing page
```

### Landing Page Layout (State A)

```
┌─────────────────────────────────────┐
│                                     │
│        Learn JavaScript             │
│                                     │
│  An adaptive AI tutor that teaches  │
│  you programming step-by-step.      │
│                                     │
│  No sign-up required. Start         │
│  learning instantly.                │
│                                     │
│  ┌─────────────────────────────┐   │
│  │      Start Learning         │   │
│  └─────────────────────────────┘   │
│                                     │
│  Already learning? Enter your code  │
│                                     │
│       Sign In  |  Create Account    │
│                                     │
│                        [logo] ──────│
└─────────────────────────────────────┘
```

### Access Code Visibility

| State | Code Input Visible? | Code Display Visible? |
|-------|--------------------|-----------------------|
| A (Visitor) | Yes (as secondary action) | No |
| B (Code-based) | Hidden | Yes (in settings/header) |
| C (Registered) | Hidden | Hidden (or in settings as "recovery code") |

### Header Behavior

| State | Header Shows |
|-------|--------------|
| A | Logo only |
| B | Logo, avatar (🐼), display name ("Curious Panda"), code reminder |
| C | Logo, avatar, full name ("Alice Chen"), dropdown menu |

### Registration Prompt Timing

Show **inline** (not modal) prompts at:
- After completing a lesson (below completion message)
  - Message: "Great progress! Register to skip entering your code and keep your profile active forever."
- On dashboard via the info banner (always visible for code-based users)

Never:
- During a lesson
- As a blocking modal
- Before any learning happens

---

## 5. Backend Logic

### Profile Creation (on "Start Learning")

```
POST /api/start-learning

1. Generate access_code:
   - Pick random adjective from list
   - Pick random noun from list
   - Pick random 2-digit number
   - Format: "SWIFT-BEAR-73"
   - Check uniqueness, retry if collision

2. Generate display_name:
   - Pick random adjective + animal
   - "Curious Panda", "Swift Fox", etc.

3. Pick avatar:
   - Random emoji from curated list
   - 🐼 🦊 🐸 🦉 🐙 etc.

4. Insert into student_profiles:
   - access_code, display_name, avatar
   - auth_user_id = null

5. Return:
   { access_code, display_name, avatar, profile_id }

6. Frontend stores access_code in localStorage
```

### Code Validation

```
POST /api/validate-code
Body: { code: "SWIFT-BEAR-73" }

1. Normalize input (uppercase, trim)
2. Query: SELECT * FROM student_profiles WHERE access_code = $1
3. If found:
   - Update last_active_at
   - Return { valid: true, profile: {...} }
4. If not found:
   - Return { valid: false, error: "Code not recognized" }
```

### Registration Upgrade

```
POST /api/register
Body: { full_name, email, password }
Headers: { X-Access-Code: "SWIFT-BEAR-73" }

1. Validate access_code, get profile_id
2. Validate inputs:
   - full_name: required, min 2 chars
   - email: valid format, not already registered
   - password: min 6 chars

3. Begin transaction:
   a. Create Supabase auth user (email, password)
   b. Update student_profiles:
      - SET auth_user_id = new_auth_user_id
      - SET display_name = full_name
   c. Commit

4. Return Supabase session + updated profile

5. On failure: rollback, return error
```

### Name Replacement Safety

```sql
UPDATE student_profiles
SET
  display_name = $full_name,
  auth_user_id = $auth_user_id,
  updated_at = now()
WHERE id = $profile_id
  AND auth_user_id IS NULL  -- Prevent double-registration
RETURNING *;
```

The `auth_user_id IS NULL` check ensures:
- Can't re-register an already registered profile
- Atomic protection against race conditions

---

## 6. Edge Cases & Safeguards

### Lost Access Code

**Scenario:** Learner clears browser, forgets code, never registered.

**Handling:**
- Progress is lost (acceptable for MVP)
- Show empathetic message: "Without your code or a registered account, we can't restore your progress. Start fresh?"
- Future enhancement: "Contact support with lesson details for manual recovery"

**Prevention:**
- Prominent code display after creation
- Periodic reminders: "Your code: SWIFT-BEAR-73 — save it!"
- Encourage registration after completing first lesson

### Browser Storage Cleared

**Scenario:** localStorage wiped, but learner has code written down.

**Handling:**
- Landing page has "Enter your code" option
- Validates and restores session
- Stores code back in localStorage

**If learner doesn't have code:**
- Same as "Lost Access Code" — start fresh or register

### Multiple Devices (Pre-Registration)

**Scenario:** Started on laptop, wants to continue on phone.

**Handling:**
- Enter access code on new device
- Profile loaded, progress synced
- Both devices share same profile

**Conflict prevention:**
- Progress stored server-side, not locally
- No merge conflicts — single source of truth

### Multiple Devices (Post-Registration)

**Scenario:** Registered learner uses multiple devices.

**Handling:**
- Login with email/password on any device
- Supabase session handles auth
- Access code becomes backup (rarely needed)

### Partial Registration Failure

**Scenario:** Auth user created, but profile update fails.

**Handling (Transaction Approach):**
```
1. Create auth user
2. Update profile in same transaction
3. If step 2 fails → rollback step 1
4. Return clear error: "Registration failed, please try again"
```

**Alternative (Eventual Consistency):**
```
1. Create auth user
2. If profile update fails:
   - Queue retry
   - Return partial success
   - Background job completes linking
```

For MVP: Use transaction approach. Simpler, safer.

### Code Collision During Generation

**Scenario:** Generated code already exists.

**Handling:**
```
for attempt in 1..5:
  code = generate_code()
  if not exists(code):
    return code
raise "Failed to generate unique code"
```

With 250K combinations and modest user base, collisions are rare. Retry handles edge case.

### Registered Email Already Exists

**Scenario:** Learner tries to register with email already in use.

**Handling:**
- Show error: "This email is already registered. Log in instead?"
- Offer login flow
- Do NOT reveal if email exists for security (optional: use same message for all email errors)

---

## 7. Inactive Profile Cleanup

### Policy

Unregistered profiles (code-based only) that have no activity for **10 days** are automatically deleted.

**What counts as activity:**
- Starting a lesson
- Completing a lesson
- Running code / attempting exercises
- Any action that updates `last_active_at`

**What is NOT deleted:**
- Registered profiles (have `auth_user_id`) — these are permanent
- Profiles with activity within the last 10 days

### Why This Matters

- Prevents database bloat from abandoned profiles
- Reduces storage of orphaned progress data
- Encourages registration for serious learners
- Keeps access code namespace clean

### User Messaging

Users must be informed about this policy. Show the message at these moments:

**1. When access code is first displayed (toast or inline):**
```
Your code: SWIFT-BEAR-73
Save this code to continue later.
Dormant profiles are deleted after 10 days. Come back before then or register for permanent access.
```

**2. On the dashboard (for code-based users):**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ℹ️  Your access code: SWIFT-BEAR-73  [📋]                                    │
│                                                                              │
│    Save this code to continue on another device. Inactive profiles are      │
│    deleted after 10 days. Keep learning to stay active, or register for     │
│    seamless access.                                                          │
└──────────────────────────────────────────────────────────────────────────────┘
```
Note: The [📋] is a copy button that copies the code to clipboard.

**3. In the header dropdown (for code-based users):**
```
🐼 Curious Panda
Code: SWIFT-BEAR-73
────────────────────
Dormant profiles are deleted after 10 days.
[Register for permanent access]
```

### Supabase Implementation Options

#### Option A: pg_cron Extension (Recommended)

Supabase supports the `pg_cron` extension for scheduled jobs.

**Enable pg_cron:**
```sql
-- Run in Supabase SQL Editor (requires admin)
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

**Create the cleanup function:**
```sql
CREATE OR REPLACE FUNCTION cleanup_inactive_profiles()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete unregistered profiles inactive for 10+ days
  -- Also deletes related data via CASCADE
  WITH deleted AS (
    DELETE FROM student_profiles
    WHERE auth_user_id IS NULL
      AND last_active_at < NOW() - INTERVAL '10 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  -- Log the cleanup
  RAISE NOTICE 'Cleaned up % inactive profiles', deleted_count;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Schedule the job (runs daily at 3 AM UTC):**
```sql
SELECT cron.schedule(
  'cleanup-inactive-profiles',  -- job name
  '0 3 * * *',                  -- cron expression: daily at 3 AM
  'SELECT cleanup_inactive_profiles()'
);
```

**View scheduled jobs:**
```sql
SELECT * FROM cron.job;
```

**Remove job if needed:**
```sql
SELECT cron.unschedule('cleanup-inactive-profiles');
```

#### Option B: Supabase Edge Function + External Cron

If pg_cron is not available, use an Edge Function triggered by an external cron service.

**Edge Function (`supabase/functions/cleanup-profiles/index.ts`):**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Delete inactive unregistered profiles
  const { data, error } = await supabaseAdmin
    .from('student_profiles')
    .delete()
    .is('auth_user_id', null)
    .lt('last_active_at', new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString())
    .select('id')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({
    message: `Deleted ${data?.length ?? 0} inactive profiles`,
    deleted_ids: data?.map(p => p.id)
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

**Trigger with external cron (e.g., cron-job.org, GitHub Actions):**
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/cleanup-profiles \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Example: GitHub Actions (`.github/workflows/cleanup.yml`):**
```yaml
name: Cleanup Inactive Profiles

on:
  schedule:
    - cron: '0 3 * * *'  # Daily at 3 AM UTC

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger cleanup
        run: |
          curl -X POST \
            "${{ secrets.SUPABASE_URL }}/functions/v1/cleanup-profiles" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

#### Option C: Cloudflare Workers Cron Trigger

Since the project uses Cloudflare, you can use Workers with built-in cron triggers.

**Worker (`workers/cleanup-profiles.ts`):**
```typescript
import { createClient } from '@supabase/supabase-js'

interface Env {
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string
}

export default {
  async scheduled(event: ScheduledEvent, env: Env) {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)

    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)

    const { error } = await supabase
      .from('student_profiles')
      .delete()
      .is('auth_user_id', null)
      .lt('last_active_at', tenDaysAgo.toISOString())

    if (error) {
      console.error('Cleanup failed:', error.message)
    }
  }
}
```

**`wrangler.toml`:**
```toml
name = "cleanup-profiles"

[triggers]
crons = ["0 3 * * *"]  # Daily at 3 AM UTC

[vars]
SUPABASE_URL = "https://xxx.supabase.co"

# Set secret via: wrangler secret put SUPABASE_SERVICE_KEY
```

**Deploy:**
```bash
wrangler deploy
```

### Which Option to Choose?

| Option | Best For | Pros | Cons |
|--------|----------|------|------|
| **A: pg_cron** | MVP, simple setup | No external deps, reliable, free | SQL only, harder to debug |
| **B: Edge Function** | Complex logic needed | Full TypeScript, easy logging | Needs external trigger |
| **C: Cloudflare Workers** | Already using CF | Native cron, in your stack | Another service to manage |

**Recommendation:** Start with **pg_cron** for MVP. Migrate to Edge Functions or Cloudflare Workers if you need features like email notifications before deletion.

### Cascade Deletion

Ensure related data is deleted when a profile is removed:

```sql
-- student_progress should cascade
ALTER TABLE student_progress
DROP CONSTRAINT IF EXISTS student_progress_student_id_fkey,
ADD CONSTRAINT student_progress_student_id_fkey
  FOREIGN KEY (student_id)
  REFERENCES student_profiles(id)
  ON DELETE CASCADE;

-- exercise_attempts should cascade
ALTER TABLE exercise_attempts
DROP CONSTRAINT IF EXISTS exercise_attempts_student_id_fkey,
ADD CONSTRAINT exercise_attempts_student_id_fkey
  FOREIGN KEY (student_id)
  REFERENCES student_profiles(id)
  ON DELETE CASCADE;

-- tutor_messages should cascade
ALTER TABLE tutor_messages
DROP CONSTRAINT IF EXISTS tutor_messages_student_id_fkey,
ADD CONSTRAINT tutor_messages_student_id_fkey
  FOREIGN KEY (student_id)
  REFERENCES student_profiles(id)
  ON DELETE CASCADE;
```

### Activity Tracking

Update `last_active_at` on meaningful actions:

```sql
-- Function to update activity timestamp
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE student_profiles
  SET last_active_at = NOW()
  WHERE id = NEW.student_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on student_progress changes
CREATE TRIGGER update_activity_on_progress
AFTER INSERT OR UPDATE ON student_progress
FOR EACH ROW EXECUTE FUNCTION update_last_active();

-- Trigger on exercise_attempts
CREATE TRIGGER update_activity_on_attempt
AFTER INSERT ON exercise_attempts
FOR EACH ROW EXECUTE FUNCTION update_last_active();
```

### Frontend: Static Policy Message

Since any activity resets the 10-day timer, showing a countdown is misleading. Instead, show a static message explaining the policy and giving users a choice:

**Message copy:**
```
Dormant profiles are deleted after 10 days. Come back before then or register for permanent access.
```

**Implementation:**
```typescript
// Show policy message for unregistered users only
function shouldShowRetentionPolicy(profile: StudentProfile): boolean {
  return profile.auth_user_id === null
}

// Usage in component
if (shouldShowRetentionPolicy(profile)) {
  showPolicyBanner({
    message: "Dormant profiles are deleted after 10 days. Come back before then or register for permanent access.",
    action: { label: "Register", onClick: openRegistration }
  })
}
```

**Key points:**
- No countdown (misleading since activity resets it)
- Clear explanation: dormant profiles get deleted
- Two options: come back before 10 days OR register
- Non-blocking, informational tone

### Edge Case: User Returns After Deletion

**Scenario:** User had code `SWIFT-BEAR-73`, didn't use it for 10 days, profile deleted, now tries to use code.

**Handling:**
```
Code validation fails → Show message:

"This code is no longer active. Inactive profiles are automatically
deleted after 10 days.

You can start fresh with a new profile, or if you previously
registered, log in with your email."

[Start Fresh]  [Log In]
```

---

## 8. Implementation Priority (MVP)

### Phase 1: Core Flow
- Profile creation on "Start Learning"
- Access code generation and storage
- Code validation and session restore
- Progress tracking against profile

### Phase 2: Registration
- Registration form (name, email, password)
- Auth user creation and profile linking
- Session-based auth for registered users

### Phase 3: Cleanup & Polish
- Inactive profile cleanup job (pg_cron)
- Deletion warning UI for code-based users
- Registration prompts at natural moments
- Code reminder notifications
- Multi-device experience improvements

---

## 9. Summary

| Concern | Solution |
|---------|----------|
| No login wall | Profile created silently on "Start Learning" |
| Identity without email | Access code (SWIFT-BEAR-73) |
| Progress persistence | Server-side, keyed to profile ID |
| Optional registration | Upgrades existing profile, replaces random name with full name |
| Cross-device before registration | Enter access code |
| Cross-device after registration | Login with email |
| Lost code, no registration | Progress lost (acceptable MVP tradeoff) |
| Database bloat from abandoned profiles | Auto-delete after 10 days of inactivity (unregistered only) |
| User awareness of deletion | Static policy message: come back before 10 days or register |

---

## 10. Schema Changes Required

The current `student_profiles` table needs modifications. See `supabase/migrations/003_frictionless_onboarding.sql` for the complete migration.

```sql
-- IMPORTANT: Remove FK constraint on id to allow anonymous profiles
-- The original table has id REFERENCES auth.users(id), which prevents
-- creating profiles without an auth user
ALTER TABLE student_profiles
DROP CONSTRAINT IF EXISTS student_profiles_id_fkey;

-- Add access_code column
ALTER TABLE student_profiles
ADD COLUMN access_code TEXT UNIQUE;

-- Add auth_user_id for linking to auth users (nullable for anonymous)
ALTER TABLE student_profiles
ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add last_active_at for session tracking
ALTER TABLE student_profiles
ADD COLUMN last_active_at TIMESTAMPTZ DEFAULT now();

-- Add indexes for fast lookups
CREATE INDEX idx_student_profiles_access_code
ON student_profiles(access_code) WHERE access_code IS NOT NULL;

CREATE INDEX idx_student_profiles_auth_user_id
ON student_profiles(auth_user_id) WHERE auth_user_id IS NOT NULL;
```

### RLS Policy Updates

```sql
-- Allow reading profile by access_code (for code-based auth)
CREATE POLICY "Allow access by code" ON student_profiles
FOR SELECT USING (
  access_code = current_setting('app.current_access_code', true)
);

-- Allow anonymous profile creation
CREATE POLICY "Allow anonymous profile creation" ON student_profiles
FOR INSERT WITH CHECK (auth_user_id IS NULL);
```

---

## 11. Word Lists for Code Generation

### Adjectives (50)
```
SWIFT, CALM, BOLD, WISE, KEEN,
BRAVE, QUICK, WARM, COOL, FAIR,
BRIGHT, CLEAR, FRESH, GRAND, GREAT,
HAPPY, JOLLY, KIND, NOBLE, PROUD,
QUIET, RAPID, SHARP, SMART, SOFT,
STEADY, STRONG, TRUE, VIVID, WILD,
AGILE, CLEVER, COSMIC, DARING, EAGER,
FIERCE, GENTLE, HIDDEN, HUMBLE, LIVELY,
LUCKY, MIGHTY, NIMBLE, PATIENT, PEACEFUL,
PLAYFUL, RADIANT, SERENE, SILENT, SIMPLE
```

### Nouns (50)
```
BEAR, WOLF, HAWK, DEER, LION,
TIGER, EAGLE, RIVER, OCEAN, STORM,
CLOUD, FLAME, FROST, STONE, CORAL,
CEDAR, MAPLE, LOTUS, BROOK, CANYON,
COMET, EMBER, FORGE, GROVE, HAVEN,
KNIGHT, LARK, MEADOW, NEBULA, ORBIT,
PEARL, QUARTZ, RAVEN, SAGE, SPARK,
SUMMIT, THUNDER, TRAIL, VAPOR, WILLOW,
AURORA, BREEZE, CREST, DAWN, FERN,
GLACIER, HARBOR, ISLAND, JADE, PEAK
```

### Generation Example
```javascript
function generateAccessCode() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = String(Math.floor(Math.random() * 100)).padStart(2, '0');
  return `${adj}-${noun}-${num}`;
}
// Output: "SWIFT-BEAR-73"
```
