# Personalized Learning Feature

> Implementation plan for data collection, gamification, and dashboard redesign - designed for kids 7+.

**Status**: Planning Complete | Implementation Not Started
**Target Audience**: Kids 7+ (with age-adaptive experience)
**Last Updated**: January 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Success Metrics (KPIs)](#success-metrics-kpis)
3. [A/B Testing & Rollout Strategy](#ab-testing--rollout-strategy)
4. [Event-Driven Architecture](#event-driven-architecture)
5. [Phase 1: Data Collection](#phase-1-data-collection)
6. [Phase 2: Gamification System](#phase-2-gamification-system)
7. [Phase 3: Dashboard Redesign](#phase-3-dashboard-redesign)
8. [Detailed UI/UX Specifications](#detailed-uiux-specifications)
9. [Kid-Friendly Design Specifications](#kid-friendly-design-specifications)
10. [Future Extensibility](#future-extensibility)
11. [Design Decisions](#design-decisions)
12. [Files Summary](#files-summary)
13. [Implementation Checklist](#implementation-checklist)
14. [Verification](#verification)
15. [Open Questions & Loose Ends](#open-questions--loose-ends)
16. [Dependencies](#dependencies)
17. [Design Asset Production Workflow](#design-asset-production-workflow)
18. [Testing Strategy](#testing-strategy)
19. [Achievement Criteria Evaluation](#achievement-criteria-evaluation)
20. [Error Handling](#error-handling)
21. [Mobile Responsive Details](#mobile-responsive-details)
22. [Changelog](#changelog)

---

## Overview

### Goals

Create a focused, engaging learning experience that:
- Tracks learner progress with detailed metrics
- Motivates through playful gamification (XP, levels, achievements)
- Reduces overwhelm with a simplified, focused dashboard
- Adapts to different age groups (7+ kids to adults)

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA COLLECTION                          │
│  exercise_attempts → student_progress aggregates            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    GAMIFICATION                             │
│  Micro-rewards → XP System → Levels → Achievements → Streaks│
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    DASHBOARD                                │
│  Metrics Bar → Current Module → Next Preview → Achievements │
└─────────────────────────────────────────────────────────────┘
```

---

## Success Metrics (KPIs)

Before implementation begins, define measurable targets to evaluate the feature's impact.

### User Engagement (Primary)

| Metric | Target | Measurement |
|--------|--------|-------------|
| 7-Day Retention | +15% within first quarter | Compare pre/post gamification cohorts |
| Daily Active Users (DAU) | +10% sustained lift | Weekly rolling average |

### Learning Progression (Secondary)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Lesson Completion Rate | +20% (started → completed) | Track conversion funnel |
| Average Session Duration | +5 minutes for gamified users | Compare to control group |

### Feature Adoption (Tertiary)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Streak Attainment | 25% of WAU with 3+ day streak | Weekly report |
| Level Progression | 50% of users with 5+ lessons reach Level 3 | Cohort analysis |
| Achievement Unlock Rate | Track per-achievement unlock % | Dashboard analytics |

---

## A/B Testing & Rollout Strategy

### Feature Flag Integration

Implement feature flags for controlled rollout. Use a simple `feature_flags` table in Supabase or integrate PostHog/LaunchDarkly.

```sql
-- Simple feature flag table
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0,  -- 0-100
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO feature_flags (name, enabled, rollout_percentage) VALUES
  ('gamification_v1', false, 0),
  ('new_dashboard', false, 0);
```

### Rollout Plan

| Phase | Audience | Duration | Success Criteria |
|-------|----------|----------|------------------|
| 1. Internal | Team + QA accounts | 1 week | No critical bugs |
| 2. Beta (A/B) | 10% of new users | 2-4 weeks | KPIs trending positive |
| 3. Gradual | 10% → 25% → 50% → 100% | 1 week | No performance degradation |
| 4. Full | All users | Ongoing | Monitor KPIs |

### A/B Test Design

- **Control Group**: Existing dashboard, no gamification
- **Test Group**: New dashboard with full gamification
- **Duration**: Minimum 2 weeks for statistical significance
- **Primary Metric**: 7-day retention rate

---

## Event-Driven Architecture

**Status**: Not Started
**Priority**: Critical - implement before Phase 1

### Problem

Direct coupling between modules (e.g., `useTutorChat.ts` calling `persistAttempt()` directly) creates tight dependencies that:
- Make refactoring complex
- Limit independent module evolution
- Create security risks with client-side logic

### Solution: React Context Event Bus

Implement a lightweight pub/sub event bus using React Context API for decoupled inter-module communication.

**File**: `src/shared/hooks/useEventBus.ts`

```typescript
import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  useEffect,
} from 'react';

// Type-safe event definitions
type AttemptData = {
  studentId: string;
  lessonId: string;
  exerciseId: string;
  timeSpentSeconds: number;
  passed: boolean;
  isFirstAttempt: boolean;
};

type AppEvent =
  | { name: 'exercise:attempt_recorded'; data: AttemptData }
  | { name: 'lesson:completed'; data: { lessonId: string; timeSeconds: number } }
  | { name: 'code:run_executed'; data: { hasErrors: boolean } }
  | { name: 'error:fixed'; data: { errorType: string } }
  | { name: 'hint:used'; data: { lessonId: string } }
  | { name: 'test:first_pass'; data: { lessonId: string } }
  | { name: 'test:all_pass'; data: { lessonId: string } };

type EventName = AppEvent['name'];
type EventData<T extends EventName> = Extract<AppEvent, { name: T }>['data'];

interface EventBusContextType {
  subscribe: <T extends EventName>(
    event: T,
    callback: (data: EventData<T>) => void
  ) => () => void;
  publish: <T extends EventName>(event: T, data: EventData<T>) => void;
}

const EventBusContext = createContext<EventBusContextType | null>(null);

export const EventBusProvider = ({ children }: { children: React.ReactNode }) => {
  const subscribers = useRef<Record<string, Array<(data: unknown) => void>>>({});

  const subscribe = useCallback(<T extends EventName>(
    event: T,
    callback: (data: EventData<T>) => void
  ) => {
    if (!subscribers.current[event]) {
      subscribers.current[event] = [];
    }
    subscribers.current[event].push(callback as (data: unknown) => void);

    return () => {
      subscribers.current[event] = subscribers.current[event].filter(
        (cb) => cb !== callback
      );
    };
  }, []);

  const publish = useCallback(<T extends EventName>(event: T, data: EventData<T>) => {
    if (subscribers.current[event]) {
      subscribers.current[event].forEach((callback) => callback(data));
    }
  }, []);

  return (
    <EventBusContext.Provider value={{ subscribe, publish }}>
      {children}
    </EventBusContext.Provider>
  );
};

export const usePublish = () => {
  const context = useContext(EventBusContext);
  if (!context) {
    throw new Error('usePublish must be used within an EventBusProvider');
  }
  return context.publish;
};

export const useSubscribe = <T extends EventName>(
  event: T,
  callback: (data: EventData<T>) => void
) => {
  const context = useContext(EventBusContext);
  if (!context) {
    throw new Error('useSubscribe must be used within an EventBusProvider');
  }

  useEffect(() => {
    const unsubscribe = context.subscribe(event, callback);
    return unsubscribe;
  }, [context, event, callback]);
};
```

### Integration

**File**: `src/main.tsx`

```typescript
import { EventBusProvider } from '@/shared/hooks/useEventBus';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <EventBusProvider>
      <App />
    </EventBusProvider>
  </React.StrictMode>,
);
```

### Event Flow Example

```
┌─────────────────────┐    publish()    ┌──────────────────────┐
│   useTutorChat      │ ──────────────► │  'exercise:attempt'  │
│   (Tutor Module)    │                 │      Event Bus       │
└─────────────────────┘                 └──────────┬───────────┘
                                                   │
                              ┌────────────────────┼────────────────────┐
                              │                    │                    │
                              ▼                    ▼                    ▼
                  ┌───────────────────┐  ┌─────────────────┐  ┌─────────────────┐
                  │ useAttemptPersist │  │ useGamification │  │ Analytics       │
                  │ (Lesson Module)   │  │ (Gamification)  │  │ (Future)        │
                  └───────────────────┘  └─────────────────┘  └─────────────────┘
```

### Event Bus Files

| Action | File |
|--------|------|
| CREATE | `src/shared/hooks/useEventBus.ts` |
| CREATE | `src/shared/hooks/useEventBus.test.ts` |
| MODIFY | `src/main.tsx` (wrap with EventBusProvider) |

---

## Phase 1: Data Collection

**Status**: Not Started
**Priority**: Foundation - must complete first

### Problem

The `exercise_attempts` table exists but is never populated:
- `useExerciseAttempts.ts` tracks attempts in-memory only
- `student_progress.total_attempts` and `total_time_seconds` are always 0
- No timing data captured for analytics

### Solution

#### 1.1 Database Migration

**File**: `supabase/migrations/005_exercise_attempt_aggregates.sql`

```sql
-- Trigger to update progress aggregates on each attempt
CREATE OR REPLACE FUNCTION update_progress_aggregates()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO student_progress (student_id, lesson_id, status, total_attempts, total_time_seconds, started_at)
  VALUES (NEW.student_id, NEW.lesson_id, 'in_progress', 1, COALESCE(NEW.time_spent_seconds, 0), NOW())
  ON CONFLICT (student_id, lesson_id) DO UPDATE SET
    total_attempts = student_progress.total_attempts + 1,
    total_time_seconds = student_progress.total_time_seconds + COALESCE(NEW.time_spent_seconds, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_exercise_attempt_insert
  AFTER INSERT ON exercise_attempts
  FOR EACH ROW EXECUTE FUNCTION update_progress_aggregates();
```

#### 1.2 Persistence Hook (Event Subscriber)

**File**: `src/modules/lesson/hooks/useAttemptPersistence.ts`

Uses the event bus to listen for attempts and persist them:

```typescript
import { useSubscribe } from '@/shared/hooks/useEventBus';
import { supabase } from '@/shared/lib/supabase';

export const useAttemptPersistenceListener = () => {
  useSubscribe('exercise:attempt_recorded', async (attemptData) => {
    try {
      const { error } = await supabase
        .from('exercise_attempts')
        .insert([{
          student_id: attemptData.studentId,
          lesson_id: attemptData.lessonId,
          exercise_id: attemptData.exerciseId,
          time_spent_seconds: attemptData.timeSpentSeconds,
          passed: attemptData.passed,
        }]);
      if (error) throw error;
    } catch (error) {
      console.error('Failed to persist attempt, will retry:', error);
      // Implement retry logic - fire-and-forget, never block UI
    }
  });
};
```

#### 1.3 Integration Point (Event Publisher)

**File**: `src/modules/tutor/hooks/useTutorChat.ts`

Publishes events instead of direct function calls:

```typescript
import { usePublish } from '@/shared/hooks/useEventBus';

// Inside useTutorChat hook
const publish = usePublish();

const recordAttempt = useCallback((
  lessonId: string,
  exerciseId: string,
  timeSpentSeconds: number,
  allTestsPassed: boolean,
  isFirstAttempt: boolean,
) => {
  // Publish event - subscribers handle persistence and gamification
  publish('exercise:attempt_recorded', {
    studentId: identity?.id ?? '',
    lessonId,
    exerciseId,
    timeSpentSeconds,
    passed: allTestsPassed,
    isFirstAttempt,
  });
}, [publish, identity?.id]);
```

#### 1.4 Activate Listener

**File**: `src/modules/lesson/components/LessonLayout.tsx`

```typescript
import { useAttemptPersistenceListener } from '../hooks/useAttemptPersistence';

function LessonLayout() {
  useAttemptPersistenceListener(); // Activates the event subscriber
  // ... rest of component
}
```

### Phase 1 Files

| Action | File |
|--------|------|
| CREATE | `supabase/migrations/005_exercise_attempt_aggregates.sql` |
| CREATE | `src/modules/lesson/hooks/useAttemptPersistence.ts` |
| CREATE | `src/modules/lesson/hooks/useAttemptPersistence.test.ts` |
| MODIFY | `src/modules/tutor/hooks/useTutorChat.ts` (publish events) |
| MODIFY | `src/modules/lesson/components/LessonLayout.tsx` (activate listener) |
| MODIFY | `src/modules/lesson/index.ts` |

---

## Phase 2: Gamification System

**Status**: Not Started
**Priority**: High - core engagement feature

### Components

1. **Micro-rewards** - Celebrate small wins frequently
2. **XP System** - Points earned for actions
3. **Levels** - Progression tiers based on total XP
4. **Achievements** - Badges for milestones
5. **Streaks** - Consecutive days of learning

### 2.1 Database Schema

**File**: `supabase/migrations/006_gamification.sql`

```sql
-- Add gamification columns to student_profiles
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS xp_total INTEGER DEFAULT 0;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS current_level INTEGER DEFAULT 1;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS last_activity_date DATE;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS sound_enabled BOOLEAN DEFAULT false;

-- Achievements table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  xp_reward INTEGER DEFAULT 0,
  criteria JSONB NOT NULL,
  subject_id UUID NULL,  -- NULL = global, otherwise subject-specific (future)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Student achievements (many-to-many)
CREATE TABLE student_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, achievement_id)
);

-- Seed initial achievements
INSERT INTO achievements (slug, title, description, icon, xp_reward, criteria) VALUES
  ('first-lesson', 'First Steps', 'Complete your first lesson', '🎯', 50, '{"type": "lessons_completed", "threshold": 1}'),
  ('five-lessons', 'Getting Started', 'Complete 5 lessons', '⭐', 100, '{"type": "lessons_completed", "threshold": 5}'),
  ('ten-lessons', 'On Your Way', 'Complete 10 lessons', '🌟', 150, '{"type": "lessons_completed", "threshold": 10}'),
  ('first-module', 'Module Master', 'Complete an entire module', '🏆', 200, '{"type": "modules_completed", "threshold": 1}'),
  ('streak-3', 'On a Roll', 'Learn 3 days in a row', '🔥', 75, '{"type": "streak", "threshold": 3}'),
  ('streak-7', 'Week Warrior', 'Learn 7 days in a row', '💪', 150, '{"type": "streak", "threshold": 7}'),
  ('streak-30', 'Dedication', 'Learn 30 days in a row', '👑', 500, '{"type": "streak", "threshold": 30}'),
  ('perfect-lesson', 'Perfectionist', 'Complete a lesson on first attempt', '💎', 100, '{"type": "first_attempt_pass", "threshold": 1}'),
  ('quick-learner', 'Quick Learner', 'Complete a lesson in under 5 minutes', '⚡', 75, '{"type": "fast_completion", "threshold": 300}'),
  ('first-code-run', 'Hello World', 'Run your first piece of code', '🚀', 25, '{"type": "code_runs", "threshold": 1}'),
  ('bug-squasher', 'Bug Squasher', 'Fix 10 errors', '🐛', 100, '{"type": "errors_fixed", "threshold": 10}');

-- RLS policies
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Achievements are viewable by everyone"
  ON achievements FOR SELECT USING (true);

CREATE POLICY "Students can view own achievements"
  ON student_achievements FOR SELECT
  USING (student_id IN (
    SELECT id FROM student_profiles
    WHERE auth_user_id = auth.uid() OR access_code IS NOT NULL
  ));

CREATE POLICY "System can insert achievements"
  ON student_achievements FOR INSERT
  WITH CHECK (student_id IN (
    SELECT id FROM student_profiles
    WHERE auth_user_id = auth.uid() OR access_code IS NOT NULL
  ));
```

### 2.2 XP & Level System

**File**: `src/modules/gamification/lib/xp-system.ts`

```typescript
// XP rewards (kid-friendly: no penalties, only bonuses)
export const XP_REWARDS = {
  // Micro-rewards
  FIRST_CODE_RUN_SESSION: 5,
  ERROR_FIXED: 10,
  HINT_USED: 5,  // Encourage asking for help!
  FIRST_TEST_PASS: 15,

  // Major rewards
  ALL_TESTS_PASS: 50,
  LESSON_COMPLETE: 100,
  FIRST_ATTEMPT_BONUS: 50,
  STREAK_DAILY_BONUS: 25,

  // Speed bonuses
  FAST_COMPLETION_BONUS: 25,
}

// Level thresholds (achievable progression)
export const LEVELS = [
  { level: 1, xp: 0, title: 'Starter', icon: '🌱', color: '#94A3B8' },
  { level: 2, xp: 150, title: 'Explorer', icon: '🌿', color: '#22C55E' },
  { level: 3, xp: 400, title: 'Coder', icon: '⭐', color: '#3B82F6' },
  { level: 4, xp: 800, title: 'Builder', icon: '🌟', color: '#8B5CF6' },
  { level: 5, xp: 1500, title: 'Creator', icon: '💫', color: '#F59E0B' },
  { level: 6, xp: 2500, title: 'Developer', icon: '🔥', color: '#EF4444' },
  { level: 7, xp: 4000, title: 'Expert', icon: '💎', color: '#EC4899' },
  { level: 8, xp: 6000, title: 'Master', icon: '👑', color: '#14B8A6' },
  { level: 9, xp: 9000, title: 'Legend', icon: '🏆', color: '#F97316' },
  { level: 10, xp: 15000, title: 'Wizard', icon: '🧙', color: 'rainbow' },
]
```

### 2.3 Backend Gamification Service (Security Critical)

**Why Backend?** Client-side achievement checking is exploitable. All XP and achievement logic must run on the server.

**File**: `supabase/functions/evaluate-gamification-event/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface GamificationEvent {
  eventName: 'exercise:attempt' | 'lesson:completed' | 'code:run' | 'error:fixed';
  eventData: Record<string, unknown>;
}

interface GamificationResult {
  xpAwarded: number;
  newAchievements: { id: string; slug: string; title: string; icon: string }[];
  levelUp: { oldLevel: number; newLevel: number } | null;
  streakUpdate: { current: number; isNew: boolean } | null;
}

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Authenticate user
  const authHeader = req.headers.get('Authorization');
  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader?.replace('Bearer ', '')
  );
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { eventName, eventData }: GamificationEvent = await req.json();

  // All evaluation happens server-side
  // 1. Fetch current student stats
  // 2. Calculate XP based on event
  // 3. Check all achievement criteria
  // 4. Update streak if applicable
  // 5. Perform all updates in a transaction
  // 6. Return results for UI celebration

  const result: GamificationResult = await evaluateEvent(supabase, user.id, eventName, eventData);

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### 2.4 Module Structure

```
src/modules/gamification/
├── components/
│   ├── XPDisplay.tsx           # Current XP with animated progress bar
│   ├── LevelBadge.tsx          # Colorful level indicator
│   ├── StreakCounter.tsx       # Animated fire emoji + count
│   ├── AchievementCard.tsx     # Individual achievement with animation
│   ├── AchievementList.tsx     # Grid of achievements
│   ├── LevelUpCelebration.tsx  # Full-screen confetti celebration
│   ├── MicroReward.tsx         # Small floating reward notification
│   └── XPFloater.tsx           # "+50 XP" floating animation
├── hooks/
│   ├── useGamification.ts      # Main hook: calls Edge Function, handles results
│   ├── useGamificationListener.ts  # Event bus subscriber for gamification
│   └── useMicroRewards.ts      # Micro-reward triggers and queue
├── lib/
│   └── xp-system.ts            # XP constants and level data (shared with backend)
├── types/
│   └── index.ts
└── index.ts
```

### 2.5 Gamification Event Listener

**File**: `src/modules/gamification/hooks/useGamificationListener.ts`

Subscribes to events and calls the backend Edge Function:

```typescript
import { useSubscribe } from '@/shared/hooks/useEventBus';
import { supabase } from '@/shared/lib/supabase';
import { useCallback, useState } from 'react';

interface GamificationResult {
  xpAwarded: number;
  newAchievements: { id: string; slug: string; title: string; icon: string }[];
  levelUp: { oldLevel: number; newLevel: number } | null;
}

export const useGamificationListener = (
  onResult: (result: GamificationResult) => void
) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleEvent = useCallback(async (
    eventName: string,
    eventData: Record<string, unknown>
  ) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'evaluate-gamification-event',
        { body: { eventName, eventData } }
      );
      if (error) throw error;
      onResult(data);
    } catch (error) {
      console.error('Gamification evaluation failed:', error);
      // Never block UI - gamification is non-critical
    } finally {
      setIsProcessing(false);
    }
  }, [onResult]);

  // Subscribe to all relevant events
  useSubscribe('exercise:attempt_recorded', (data) =>
    handleEvent('exercise:attempt', data)
  );
  useSubscribe('lesson:completed', (data) =>
    handleEvent('lesson:completed', data)
  );
  useSubscribe('code:run_executed', (data) =>
    handleEvent('code:run', data)
  );
  useSubscribe('error:fixed', (data) =>
    handleEvent('error:fixed', data)
  );

  return { isProcessing };
};
```

### Phase 2 Files

| Action | File |
|--------|------|
| CREATE | `supabase/migrations/006_gamification.sql` |
| CREATE | `supabase/functions/evaluate-gamification-event/index.ts` |
| CREATE | `src/modules/gamification/lib/xp-system.ts` |
| CREATE | `src/modules/gamification/hooks/useGamification.ts` |
| CREATE | `src/modules/gamification/hooks/useGamificationListener.ts` |
| CREATE | `src/modules/gamification/hooks/useMicroRewards.ts` |
| CREATE | `src/modules/gamification/components/XPDisplay.tsx` |
| CREATE | `src/modules/gamification/components/LevelBadge.tsx` |
| CREATE | `src/modules/gamification/components/StreakCounter.tsx` |
| CREATE | `src/modules/gamification/components/AchievementCard.tsx` |
| CREATE | `src/modules/gamification/components/AchievementList.tsx` |
| CREATE | `src/modules/gamification/components/LevelUpCelebration.tsx` |
| CREATE | `src/modules/gamification/components/MicroReward.tsx` |
| CREATE | `src/modules/gamification/components/XPFloater.tsx` |
| CREATE | `src/modules/gamification/types/index.ts` |
| CREATE | `src/modules/gamification/index.ts` |
| CREATE | `src/shared/lib/copy.ts` (age-adaptive text) |
| CREATE | `public/sounds/level-up.mp3` |
| CREATE | `public/sounds/achievement.mp3` |
| CREATE | `public/sounds/xp-gain.mp3` |

---

## Phase 3: Dashboard Redesign

**Status**: Not Started
**Priority**: High - user-facing change

### New Layout

```
┌─────────────────────────────────────────────────────────┐
│  Header                                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  METRICS BAR                                     │   │
│  │  [🔥 5 day streak] [⭐ Level 3] [📚 12 lessons] │   │
│  │  [XP: 850/1000 ████████░░ → Level 4]            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  CURRENT MODULE                                  │   │
│  │  "Variables & Data Types"                        │   │
│  │                                                  │   │
│  │  ✓ Lesson 1: What are Variables?                │   │
│  │  ✓ Lesson 2: Strings and Numbers                │   │
│  │  → Lesson 3: Working with Booleans  [Continue]  │   │
│  │  ○ Lesson 4: Type Conversion                    │   │
│  │                                                  │   │
│  │  Progress: 2/4 ████████░░░░░░░░                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  COMING UP NEXT                                  │   │
│  │  "Functions & Scope" - 6 lessons                │   │
│  │  Learn to write reusable code blocks            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  RECENT ACHIEVEMENTS                             │   │
│  │  [🎯 First Steps] [⭐ Getting Started] [🔥 +2]  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Module Structure

```
src/modules/dashboard/
├── components/
│   ├── MetricsBar.tsx          # XP, level, streak, lessons count
│   ├── CurrentModule.tsx       # Focused view of active module
│   ├── LessonItem.tsx          # Individual lesson row
│   ├── NextModulePreview.tsx   # Teaser for upcoming module
│   ├── RecentAchievements.tsx  # Recently earned badges
│   └── ModuleProgress.tsx      # Animated progress bar
├── hooks/
│   └── useDashboardData.ts     # Aggregates all dashboard data
└── index.ts
```

### Phase 3 Files

| Action | File |
|--------|------|
| CREATE | `src/modules/dashboard/components/MetricsBar.tsx` |
| CREATE | `src/modules/dashboard/components/CurrentModule.tsx` |
| CREATE | `src/modules/dashboard/components/LessonItem.tsx` |
| CREATE | `src/modules/dashboard/components/NextModulePreview.tsx` |
| CREATE | `src/modules/dashboard/components/RecentAchievements.tsx` |
| CREATE | `src/modules/dashboard/components/ModuleProgress.tsx` |
| CREATE | `src/modules/dashboard/hooks/useDashboardData.ts` |
| CREATE | `src/modules/dashboard/index.ts` |
| MODIFY | `src/pages/Dashboard.tsx` |
| MODIFY | `src/modules/auth/components/OnboardingForm.tsx` (timezone) |

---

## Detailed UI/UX Specifications

### Dashboard Component Details

#### MetricsBar Component

```
┌────────────────────────────────────────────────────────────────┐
│  🔥 5        ⭐ Level 3        📚 12          ⏱️ 2.5 hrs       │
│  streak     Coder             lessons        learning         │
│                                                                │
│  ████████████████████░░░░░░  850 / 1000 XP to Level 4         │
└────────────────────────────────────────────────────────────────┘
```

**Specs**:
- Background: Gradient card with subtle glow
- Stats: Icon + number + label (vertical stack)
- XP bar: Animated fill, color matches current level
- Click level badge → opens achievements modal
- **Responsive**: 4 columns (desktop) → 2x2 grid (tablet) → horizontal scroll (mobile)

#### CurrentModule Component

```
┌─────────────────────────────────────────────────────────────┐
│  MODULE 1                                                    │
│  Variables & Data Types                                      │
│  Learn how to store and work with data in JavaScript        │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ✅  What are Variables?              5 min    +100 XP   ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ✅  Strings and Numbers              8 min    +100 XP   ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ▶️  Working with Booleans            6 min    +100 XP   ││
│  │                                      [ Continue → ]      ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🔒  Type Conversion                  7 min    (locked)  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Progress: ████████████░░░░░░░░  2/4 complete               │
└─────────────────────────────────────────────────────────────┘
```

**Lesson States**:

| State | Icon | Style | Action |
|-------|------|-------|--------|
| Completed | ✅ | Muted, checkmark | Click to review |
| Current | ▶️ | Highlighted, glow | "Continue" button |
| Locked | 🔒 | Grayed out | Tooltip: "Complete previous" |

#### NextModulePreview Component

```
┌─────────────────────────────────────────────────────────────┐
│  COMING UP NEXT                                              │
│  📦 Functions & Scope  •  6 lessons  •  ~45 min             │
│  Learn to write reusable code blocks                        │
│  [ 🔒 Unlock after completing Variables ]                   │
└─────────────────────────────────────────────────────────────┘
```

**Specs**: Collapsed, no individual lessons shown (reduce overwhelm)

#### RecentAchievements Component

```
┌─────────────────────────────────────────────────────────────┐
│  RECENT ACHIEVEMENTS                           [ View All ] │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                    │
│  │  🎯  │  │  ⭐  │  │  🔥  │  │  💎  │   →               │
│  │First │  │Getting│  │3 Day │  │Perfect│                   │
│  │Steps │  │Started│  │Streak│  │Lesson │                   │
│  │ NEW! │  │      │  │ NEW! │  │      │                    │
│  └──────┘  └──────┘  └──────┘  └──────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### Gamification UI Components

#### LevelBadge Visual Progression

| Level | Icon | Color | Title |
|-------|------|-------|-------|
| 1 | 🌱 | Gray | Starter |
| 2 | 🌿 | Green | Explorer |
| 3 | ⭐ | Blue | Coder |
| 4 | 🌟 | Purple | Builder |
| 5 | 💫 | Orange | Creator |
| 6 | 🔥 | Red | Developer |
| 7 | 💎 | Pink | Expert |
| 8 | 👑 | Teal | Master |
| 9 | 🏆 | Gold | Legend |
| 10 | 🧙 | Rainbow | Wizard |

#### LevelUpCelebration (Full-screen for kids)

```
┌─────────────────────────────────────────────┐
│        🎉 CONFETTI PARTICLES 🎉            │
│              ⭐ ⭐ ⭐                        │
│           LEVEL UP!                         │
│     You're now Level 3: Coder!             │
│        [ Awesome! Continue ]                │
└─────────────────────────────────────────────┘
```

**Celebration intensity by age**:
- Under 13: Full screen, 200 confetti, 4s duration, sound ON
- 13-17: Modal, 100 confetti, 2.5s duration, sound ON
- 18+: Toast notification, 50 confetti, 1.5s duration, no sound

#### MicroReward Toast

```
┌─────────────────────────┐
│  ✨ +10 XP              │
│  Bug squashed!          │
└─────────────────────────┘
```
- Position: Bottom-right (desktop) / bottom-center (mobile)
- Auto-dismiss: 2 seconds
- Stack multiple toasts

### Animation Specifications

**Library**: Framer Motion

```typescript
export const animations = {
  bounce: { type: "spring", stiffness: 500, damping: 30 },
  gentle: { type: "spring", stiffness: 300, damping: 25 },
  quick: { duration: 0.2, ease: "easeOut" },
  celebration: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
}
```

### Color System

```css
/* Gamification colors */
--xp-gold: #F59E0B;
--streak-fire: #EF4444;
--level-up-purple: #8B5CF6;
--success-green: #22C55E;
--achievement-blue: #3B82F6;

/* Level progression */
--level-1: #94A3B8;  /* Gray */
--level-2: #22C55E;  /* Green */
--level-3: #3B82F6;  /* Blue */
--level-4: #8B5CF6;  /* Purple */
--level-5: #F59E0B;  /* Orange */
--level-6: #EF4444;  /* Red */
--level-7: #EC4899;  /* Pink */
--level-8: #14B8A6;  /* Teal */
--level-9: #F97316;  /* Gold */
--level-10: rainbow; /* Gradient */
```

### Responsive Breakpoints

- Mobile: <768px (single column, stacked)
- Tablet: 768-1024px (wider cards)
- Desktop: >1024px (max-width container)

---

## Kid-Friendly Design Specifications

### Target Audience

- **Primary**: Kids 7-12 years old
- **Secondary**: Teens 13-17
- **Tertiary**: Adults 18+

Experience adapts based on `age_group` from student profile.

### Visual Design (Playful & Colorful)

**Color Palette**:
- Primary: Bright, saturated colors (not muted)
- Success: Vibrant green (#22C55E) with sparkle effects
- XP/Gold: Warm yellow/orange glow (#F59E0B)
- Level badges: Color progression through rainbow

**Icons & Graphics**:
- Cartoon-style achievement badges
- Bouncy, springy animations (use `spring` easing)
- Particle effects for celebrations
- Emoji-based icons for universal recognition

**Animations**:

| Event | Animation |
|-------|-----------|
| Level up | Full-screen confetti burst + "LEVEL UP!" text + sound |
| Achievement | Badge flies in from side with sparkle trail |
| XP gain | Numbers float up and fade out (+50 XP!) |
| Streak | Fire emoji pulses and grows |
| Code success | Green checkmark with satisfying bounce |
| Error fixed | Bug emoji squashed animation |

**Sound Effects** (optional, respects preferences):

| Event | Sound |
|-------|-------|
| Level up | Triumphant fanfare (2 seconds) |
| Achievement | Magical chime |
| XP gain | Coin/ding |
| Streak milestone | Whoosh + ding |

### Micro-Rewards System

Frequent positive reinforcement to maintain engagement:

| Action | Reward | Message (Under 13) |
|--------|--------|-------------------|
| First code run of session | +5 XP | "Let's go! 🚀" |
| Fixed a syntax error | +10 XP | "Bug squashed! 🐛" |
| Used a hint | +5 XP | "Smart move! 💡" |
| Passed first test case | +15 XP | "You're getting it! ✨" |
| All tests pass | +50 XP | "Woohoo! All tests pass! 🎉" |
| Completed lesson | +100 XP | "Amazing work! You're a star! ⭐" |
| Returned after 1+ days | Streak bonus | "Welcome back! 🔥" |

### Age-Adaptive Language

**Copy variations by age group**:

| Context | Under 13 | 13-17 | 18+ |
|---------|----------|-------|-----|
| Lesson complete | "Awesome job! You're a coding superstar! ⭐" | "Nice work! Lesson complete." | "Lesson completed." |
| Wrong answer | "Oops! Let's try again! You've got this! 💪" | "Not quite. Give it another shot." | "Incorrect. Try again." |
| Streak | "🔥 You're on fire! 5 days in a row!" | "🔥 5 day streak!" | "5 day streak" |
| Level up | "WOW! Level 3! You're AMAZING! 🎉" | "Level Up! You're now Level 3!" | "Level 3 reached." |
| Hint offered | "Need a little help? I've got your back! 🤝" | "Stuck? Here's a hint." | "Hint available." |
| Achievement | "You earned a badge! SO COOL! 🏆" | "Achievement unlocked!" | "Achievement: [name]" |
| Error | "Hmm, that's not quite right. Let's fix it together! 🔧" | "Error found. Check your code." | "Error: [message]" |

**Implementation**:

```typescript
// src/shared/lib/copy.ts
type AgeGroup = 'under_13' | '13-17' | '18-25' | '26-35' | '36+'
type CopyKey = 'lesson_complete' | 'wrong_answer' | 'streak' | 'level_up' | ...

export function getCopy(key: CopyKey, ageGroup: AgeGroup): string
```

### Accessibility Considerations

- **Reduced motion**: Detect `prefers-reduced-motion`, use fade instead of movement
- **Sound toggle**: Store preference in profile, default OFF (COPPA compliance)
- **Color contrast**: Playful colors must still meet WCAG AA (4.5:1 ratio)
- **Focus indicators**: Colorful glow effect, clearly visible
- **Screen readers**: Announce XP gains and achievements

---

## Future Extensibility

> Long-term vision (1+ years): Multi-subject learning platform

### Platform Decision: Unified System

**Decision**: Single unified platform with subject categories

```
┌─────────────────────────────────────────────────────────────┐
│                    UNIFIED PLATFORM                         │
│  Single app, single account, unified gamification          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐    ┌─────────────────────┐        │
│  │  PROGRAMMING        │    │  OTHER SUBJECTS     │        │
│  │  ─────────────────  │    │  ─────────────────  │        │
│  │  • JavaScript       │    │  • Chess            │        │
│  │  • Python           │    │  • Music Theory     │        │
│  │  • TypeScript       │    │  • English          │        │
│  │  • HTML/CSS         │    │  • Mathematics      │        │
│  │                     │    │                     │        │
│  │  [Unified Playground│    │  [Subject-specific  │        │
│  │   with lang select] │    │   interfaces]       │        │
│  └─────────────────────┘    └─────────────────────┘        │
│                                                             │
│  SHARED: Auth, Profiles, XP, Levels, Achievements, Streaks │
└─────────────────────────────────────────────────────────────┘
```

**Rationale**:
- Kids 7+ benefit from single app (easier to use, parents prefer)
- Unified gamification = more XP sources = more engagement
- Shared infrastructure reduces development effort
- Can always split later; merging is hard
- Cross-subject learning connections possible

### Naming Convention

| Current Name | New Name | Description |
|--------------|----------|-------------|
| Editor | **Playground** | Code editor for all programming languages |
| Code sandbox | Playground sandbox | Execution environment |

### Subject Categories

**Programming (Playground-based)**:
- JavaScript, Python, TypeScript, HTML/CSS
- All share the same Playground with language selector
- Same sandbox infrastructure, consistent UX

**Other Subjects (Custom interfaces)**:
- Chess → Chess Board component
- Music Theory → Piano/Staff notation
- English → Text/Quiz interface
- Mathematics → Formula editor + Quiz

### Vision

The platform will expand beyond JavaScript to support:
- **Programming Languages**: Python, TypeScript, HTML/CSS, etc.
- **Non-Coding Subjects**: Chess, Music Theory, English, Mathematics

### Architectural Implications

#### Current State → Future State

```
CURRENT (Phase 1-3)                    FUTURE (1+ years)
─────────────────────                  ─────────────────────
modules → lessons                      subjects → modules → lessons
(all JavaScript)                       (JavaScript, Chess, Music, etc.)

Single exercise type                   Subject-specific exercise types
(Playground sandbox)                   (Playground, quiz, chess, music)

Per-subject XP                         Per-subject XP + Global profile
```

#### Database Schema Evolution

**Future** (when needed):
```sql
-- New: Subject/Domain concept
subjects (
  id, slug, title, description,
  category,             -- 'programming' | 'other'
  interface_type,       -- 'playground' | 'chess_board' | 'piano' | 'quiz'
  evaluator_type,       -- 'sandbox' | 'answer_check' | 'custom'
  icon, color
)

-- Updated: Module belongs to subject
modules (
  id, subject_id,       -- NEW: foreign key
  title, slug, sequence_order
)

-- Updated: Per-subject progression
student_subject_progress (
  id, student_id, subject_id,
  xp_total, current_level,
  lessons_completed, total_time_seconds
)
```

#### Interface Extensibility

**Playground** (programming languages):
```typescript
// Unified code editor with language selector
interface PlaygroundProps {
  language: 'javascript' | 'python' | 'typescript' | 'html'
  code: string
  onRun: (code: string) => void
}
```

**Subject-specific interfaces** (future):
```
src/modules/interfaces/
├── playground/         # JavaScript, Python, etc.
│   ├── Playground.tsx
│   └── LanguageSelector.tsx
├── chess/
│   ├── ChessBoard.tsx
│   └── MoveInput.tsx
├── music/
│   ├── PianoKeyboard.tsx
│   └── StaffNotation.tsx
├── quiz/
│   ├── QuizQuestion.tsx
│   └── QuizOptions.tsx
└── InterfaceRenderer.tsx  # Dispatches to correct interface
```

### Recommended Changes Now

To avoid technical debt later:

1. **Rename editor to Playground** in UI copy and components
2. **Add `subject_id` to gamification tables** (migration 006) - nullable for now
3. **Use exercise type field** in exercise JSON
4. **Abstract evaluation** through interface

### What NOT to Build Now

- Subject management UI
- Multiple subject interfaces (chess, music, etc.)
- Cross-subject analytics
- Subject selection/switching
- Multi-language Playground (Python, etc.)

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Target audience | Kids 7+ | Primary user base, design for youngest then scale up |
| Gamification for code-based users | Yes, full | Engagement matters; data deleted after 10 days anyway |
| Streak reset timing | User's local midnight | Fairer UX; requires timezone storage |
| Level-up celebration | Animation + sound | Meaningful reward; respects preferences |
| Reward philosophy | No penalties, only bonuses | Encourage risk-taking and asking for help |
| Hint usage | Rewards XP | Asking for help is smart, not failure |
| Visual style | Playful & colorful | Engaging for kids, acceptable for adults |
| Language | Age-adaptive | Different tones for different ages |
| Data persistence | Fire-and-forget | Don't block UI on writes |
| Future extensibility | Per-subject progression | Plan for multi-subject platform |
| **Platform architecture** | **Unified system** | Single app, shared gamification, easier for kids/parents |
| **Code editor naming** | **Playground** | More playful, kid-friendly, applies to all programming languages |
| **Programming languages** | **Unified Playground** | One editor with language selector, shared infrastructure |
| **Non-coding subjects** | **Subject-specific interfaces** | Chess board, piano, etc. - each subject gets custom UI |

---

## Files Summary

### Pre-Phase: Infrastructure

| Action | File |
|--------|------|
| CREATE | `src/shared/hooks/useEventBus.ts` |
| CREATE | `src/shared/hooks/useEventBus.test.ts` |
| CREATE | `src/shared/lib/timezone.ts` |
| MODIFY | `src/main.tsx` (wrap with EventBusProvider) |

### Pre-Phase: COPPA Compliance

| Action | File |
|--------|------|
| CREATE | `supabase/migrations/004_parental_consent.sql` |
| CREATE | `src/modules/auth/components/AgeGate.tsx` |
| CREATE | `src/modules/auth/components/ParentEmailForm.tsx` |
| CREATE | `src/modules/auth/components/ConsentPending.tsx` |
| CREATE | `src/pages/ParentConsent.tsx` |
| CREATE | `supabase/functions/send-consent-email/index.ts` |

### Phase 1: Data Collection

| Action | File |
|--------|------|
| CREATE | `supabase/migrations/005_exercise_attempt_aggregates.sql` |
| CREATE | `src/modules/lesson/hooks/useAttemptPersistence.ts` |
| CREATE | `src/modules/lesson/hooks/useAttemptPersistence.test.ts` |
| MODIFY | `src/modules/tutor/hooks/useTutorChat.ts` (publish events) |
| MODIFY | `src/modules/lesson/components/LessonLayout.tsx` (activate listener) |
| MODIFY | `src/modules/lesson/index.ts` |

### Phase 2: Gamification

| Action | File |
|--------|------|
| CREATE | `supabase/migrations/006_gamification.sql` |
| CREATE | `supabase/functions/evaluate-gamification-event/index.ts` |
| CREATE | `src/modules/gamification/` (entire module ~15 files) |
| CREATE | `src/shared/lib/copy.ts` |
| CREATE | `public/sounds/*.mp3` (3 files) |

### Phase 3: Dashboard

| Action | File |
|--------|------|
| CREATE | `src/modules/dashboard/` (entire module ~8 files) |
| MODIFY | `src/pages/Dashboard.tsx` |
| MODIFY | `src/modules/auth/components/OnboardingForm.tsx` |

### Production Deployment

| Action | File |
|--------|------|
| CREATE | `supabase/migrations/007_backfill_gamification_for_existing_users.sql` |
| CREATE | `supabase/functions/set-test-user-activity/index.ts` (test only) |

**Total**: ~35 new files | ~8 modified files

---

## Implementation Checklist

### Pre-Phase: Infrastructure Setup
- [ ] Create `src/shared/hooks/useEventBus.ts` with type-safe events
- [ ] Create `src/shared/hooks/useEventBus.test.ts`
- [ ] Wrap app with `EventBusProvider` in `src/main.tsx`
- [ ] Create `src/shared/lib/timezone.ts` for auto-detection
- [ ] **Verify**: Event bus publishes and subscribes correctly

### Pre-Phase: COPPA Compliance (Required for under-13)
- [ ] Create migration `004_parental_consent.sql`
- [ ] Create `src/modules/auth/components/AgeGate.tsx`
- [ ] Create `src/modules/auth/components/ParentEmailForm.tsx`
- [ ] Create `src/modules/auth/components/ConsentPending.tsx`
- [ ] Create `src/pages/ParentConsent.tsx` (standalone page)
- [ ] Create `supabase/functions/send-consent-email/index.ts`
- [ ] Update `OnboardingForm.tsx` to include age gate
- [ ] **Verify**: Under-13 signup triggers consent flow

### Phase 1: Data Collection
- [ ] Create migration `005_exercise_attempt_aggregates.sql`
- [ ] Run migration: `supabase db reset`
- [ ] Create `useAttemptPersistence.ts` hook (event subscriber)
- [ ] Write tests for persistence hook
- [ ] Update `useTutorChat.ts` to publish events (not direct calls)
- [ ] Activate listener in `LessonLayout.tsx`
- [ ] **Verify**: Complete exercise → check `exercise_attempts` table

### Phase 2: Gamification
- [ ] Create migration `006_gamification.sql`
- [ ] Run migration
- [ ] Create `supabase/functions/evaluate-gamification-event/index.ts` (backend)
- [ ] Create `xp-system.ts` with calculations (shared constants)
- [ ] Create `useGamification.ts` hook
- [ ] Create `useGamificationListener.ts` hook (event subscriber)
- [ ] Create `useMicroRewards.ts` hook
- [ ] Create `src/shared/lib/copy.ts` for age-adaptive text
- [ ] Create XPDisplay component
- [ ] Create LevelBadge component
- [ ] Create StreakCounter component
- [ ] Create AchievementCard component
- [ ] Create AchievementList component
- [ ] Create LevelUpCelebration component (with confetti)
- [ ] Create MicroReward component
- [ ] Create XPFloater component
- [ ] Create sound preference just-in-time prompt
- [ ] **Verify**: Complete lesson → XP increases, level up works

### Phase 2: Design Assets
- [ ] Create achievement badge SVGs (11 badges)
- [ ] Create level badge SVGs (10 badges)
- [ ] Source and add sound files to `public/sounds/`
- [ ] Verify all assets meet specs (size, format, license)

### Phase 3: Dashboard
- [ ] Create `useDashboardData.ts` hook
- [ ] Create MetricsBar component
- [ ] Create CurrentModule component
- [ ] Create NextModulePreview component
- [ ] Create RecentAchievements component
- [ ] Create ModuleProgress component
- [ ] Update Dashboard.tsx page
- [ ] **Verify**: Visual check of new layout

### Production Deployment
- [ ] Create migration `007_backfill_gamification_for_existing_users.sql`
- [ ] Create `supabase/functions/set-test-user-activity/index.ts` (test only)
- [ ] Set up feature flags for gradual rollout
- [ ] Run backfill migration after `006_gamification.sql`
- [ ] Enable for internal team (Phase 1 rollout)
- [ ] Enable for 10% of new users (A/B test)
- [ ] Monitor KPIs for 2-4 weeks
- [ ] Gradual rollout to 100%

### Final
- [ ] Run test suite: `npm run test:run`
- [ ] Run E2E tests: `npm run e2e:local`
- [ ] Run streak-specific E2E tests
- [ ] Manual test with fresh account (kid age group)
- [ ] Manual test with adult age group
- [ ] Test reduced motion preference
- [ ] Test sound toggle
- [ ] Update FUTURE_ENHANCEMENTS.md (mark complete)

---

## Verification

### Data Collection
```sql
-- After completing an exercise:
SELECT * FROM exercise_attempts ORDER BY created_at DESC LIMIT 5;
SELECT total_attempts, total_time_seconds FROM student_progress WHERE lesson_id = '<lesson-id>';
```

### Gamification
```sql
-- After completing a lesson:
SELECT xp_total, current_level, current_streak FROM student_profiles WHERE id = '<profile-id>';
SELECT a.title, sa.earned_at FROM student_achievements sa
  JOIN achievements a ON a.id = sa.achievement_id
  WHERE sa.student_id = '<profile-id>';
```

### Dashboard
- [ ] Metrics bar shows XP, level, streak, lesson count
- [ ] Current module displays correctly
- [ ] Only active module lessons visible
- [ ] Next module preview shows teaser
- [ ] Recent achievements display
- [ ] Continue button goes to correct lesson

### Age-Adaptive
- [ ] Under 13: Full celebrations, enthusiastic copy
- [ ] 13-17: Medium celebrations, casual copy
- [ ] 18+: Toast notifications, professional copy

---

## Open Questions & Loose Ends

### COPPA Compliance (Critical for Kids 7-12)

**Status**: Requires separate specification document

| Issue | Decision |
|-------|----------|
| Parental consent for under-13 | Required by law - implement consent flow |
| Parent accounts | Yes - parent oversight dashboard (future phase) |
| Data collection notice | Required - display during consent flow |
| Sound default | OFF for under-13 ✅ |

#### Consent Flow Specification

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Age Gate (First screen of onboarding)              │
│                                                              │
│  "How old are you?"                                         │
│  [ Under 13 ]  [ 13-17 ]  [ 18+ ]                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           │ Under 13                       │ 13+
           ▼                               ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│  STEP 2: Parent Email     │   │  Continue to onboarding  │
│                          │   └──────────────────────────┘
│  "We need your parent's  │
│   permission to continue" │
│                          │
│  [ Parent's email: _____ ]│
│  [ Send Permission Request]│
└──────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│  STEP 3: Pending State                                        │
│                                                               │
│  "We sent an email to parent@example.com"                    │
│  "Ask your parent to check their inbox!"                     │
│                                                               │
│  Child cannot proceed until parent consents                  │
└──────────────────────────────────────────────────────────────┘
           │
           ▼ (Parent clicks email link)
┌──────────────────────────────────────────────────────────────┐
│  STEP 4: Parent Consent Page (standalone, unauthenticated)   │
│                                                               │
│  "Your child wants to learn coding!"                         │
│                                                               │
│  DATA COLLECTED:                                             │
│  • Learning progress and exercise attempts                   │
│  • Time spent on lessons                                     │
│  • Achievement and XP data                                   │
│                                                               │
│  DATA NOT COLLECTED:                                         │
│  • Personal identifying information                          │
│  • Location data                                             │
│  • Contact with other users                                  │
│                                                               │
│  [ I Consent ] [ Decline ]                                   │
└──────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│  STEP 5: Account Activated                                    │
│                                                               │
│  Child can now continue with onboarding                      │
│  Parent email stored for future oversight features           │
└──────────────────────────────────────────────────────────────┘
```

#### Database Schema Updates

```sql
-- Add to student_profiles
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS parent_email TEXT;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS consent_status TEXT DEFAULT 'not_required';
  -- Values: 'not_required' (13+), 'pending', 'granted', 'declined'
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS consent_granted_at TIMESTAMPTZ;

-- Consent tokens table
CREATE TABLE parental_consent_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  parent_email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,  -- 7 days from creation
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Implementation Files

| Action | File |
|--------|------|
| CREATE | `supabase/migrations/004_parental_consent.sql` |
| CREATE | `src/modules/auth/components/AgeGate.tsx` |
| CREATE | `src/modules/auth/components/ParentEmailForm.tsx` |
| CREATE | `src/modules/auth/components/ConsentPending.tsx` |
| CREATE | `src/pages/ParentConsent.tsx` (standalone page) |
| CREATE | `supabase/functions/send-consent-email/index.ts` |
| MODIFY | `src/modules/auth/components/OnboardingForm.tsx` |

### Onboarding Flow Updates

Current onboarding: Age → Avatar → Goal → Experience → Style

#### Decisions Made

| Question | Decision | Rationale |
|----------|----------|-----------|
| Timezone | Auto-detect on app load | No friction; override in settings |
| Sound preference | Just-in-time prompt | Context > upfront question |
| Parental consent | Before onboarding (see COPPA above) | Legal requirement |

#### Timezone Implementation

```typescript
// src/shared/lib/timezone.ts
export const detectTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// Called on profile creation, stored in student_profiles.timezone
// User can override in /profile/settings
```

#### Sound Preference Implementation

**Default**: Sound OFF (COPPA compliant)

**Just-in-time prompt** (shows on first XP gain):
```
┌─────────────────────────────────────────┐
│  ✨ You're earning rewards!             │
│                                          │
│  Enable fun sounds for a better          │
│  experience?                             │
│                                          │
│  [ Enable Sounds ]  [ No Thanks ]        │
└─────────────────────────────────────────┘
```

Store choice in `student_profiles.sound_enabled`. Provide permanent toggle in `/profile/settings`.

### Edge Cases

| Scenario | What Happens? |
|----------|---------------|
| User completes ALL modules | Dashboard shows "All complete!" + "More coming soon" |
| User changes timezone | Streak continues (use UTC internally, display local) |
| XP save fails | Retry 3 times, then log and continue (don't block UX) |
| Multiple achievements at once | Show one at a time with 1.5s delay between |
| User redoes completed lesson | No XP (prevent farming), but can review content |

### XP System Clarifications

| Question | Decision |
|----------|----------|
| XP per attempt or per success? | Per success only (passing all tests) |
| Max XP per lesson? | 150 XP max (100 base + 50 first-attempt bonus) |
| Redo lessons for XP? | No - first completion only |
| Daily XP cap? | No cap (encourage binge learning) |

### Level Cap & Endgame

**Current**: Level 10 (Wizard) is max at 15,000 XP

**After max level**:
- Continue earning XP (displayed as "15,000+ XP")
- Unlock "Prestige" achievements (Level 10+)
- Future: Subject-specific mastery badges

### Existing Users Migration

**File**: `supabase/migrations/007_backfill_gamification_for_existing_users.sql`

This migration MUST run after `006_gamification.sql` during production deployment.

```sql
-- Backfill XP for existing users based on completed lessons
-- Run this AFTER 006_gamification.sql

-- Step 1: Calculate and update xp_total based on completed lessons
UPDATE student_profiles sp
SET xp_total = (
  SELECT COUNT(*) * 100  -- 100 XP per completed lesson
  FROM student_progress prog
  WHERE prog.student_id = sp.id
    AND prog.status = 'completed'
)
WHERE sp.xp_total = 0;  -- Only update users who haven't started earning XP

-- Step 2: Calculate and update current_level based on xp_total
UPDATE student_profiles
SET current_level = CASE
  WHEN xp_total >= 15000 THEN 10
  WHEN xp_total >= 9000 THEN 9
  WHEN xp_total >= 6000 THEN 8
  WHEN xp_total >= 4000 THEN 7
  WHEN xp_total >= 2500 THEN 6
  WHEN xp_total >= 1500 THEN 5
  WHEN xp_total >= 800 THEN 4
  WHEN xp_total >= 400 THEN 3
  WHEN xp_total >= 150 THEN 2
  ELSE 1
END
WHERE current_level = 1 AND xp_total > 0;

-- Step 3: Grant achievements based on completed lessons
-- first-lesson achievement
INSERT INTO student_achievements (student_id, achievement_id, earned_at)
SELECT sp.id, a.id, NOW()
FROM student_profiles sp
CROSS JOIN achievements a
WHERE a.slug = 'first-lesson'
  AND (SELECT COUNT(*) FROM student_progress WHERE student_id = sp.id AND status = 'completed') >= 1
  AND NOT EXISTS (
    SELECT 1 FROM student_achievements sa
    WHERE sa.student_id = sp.id AND sa.achievement_id = a.id
  );

-- five-lessons achievement
INSERT INTO student_achievements (student_id, achievement_id, earned_at)
SELECT sp.id, a.id, NOW()
FROM student_profiles sp
CROSS JOIN achievements a
WHERE a.slug = 'five-lessons'
  AND (SELECT COUNT(*) FROM student_progress WHERE student_id = sp.id AND status = 'completed') >= 5
  AND NOT EXISTS (
    SELECT 1 FROM student_achievements sa
    WHERE sa.student_id = sp.id AND sa.achievement_id = a.id
  );

-- ten-lessons achievement
INSERT INTO student_achievements (student_id, achievement_id, earned_at)
SELECT sp.id, a.id, NOW()
FROM student_profiles sp
CROSS JOIN achievements a
WHERE a.slug = 'ten-lessons'
  AND (SELECT COUNT(*) FROM student_progress WHERE student_id = sp.id AND status = 'completed') >= 10
  AND NOT EXISTS (
    SELECT 1 FROM student_achievements sa
    WHERE sa.student_id = sp.id AND sa.achievement_id = a.id
  );

-- Step 4: Initialize streaks to 0 (cannot back-calculate)
-- Already set to 0 by default in 006_gamification.sql

-- Note: The following achievements CANNOT be back-calculated:
-- - perfect-lesson (requires first-attempt data we didn't track)
-- - quick-learner (requires timing data we didn't track)
-- - streak achievements (requires daily activity data we didn't track)
-- - first-code-run (requires code run tracking)
-- - bug-squasher (requires error tracking)
```

#### Migration Checklist

- [ ] Deploy `006_gamification.sql` first
- [ ] Run `007_backfill_gamification_for_existing_users.sql`
- [ ] Verify XP totals match lesson counts
- [ ] Verify achievement counts are correct
- [ ] Display "Welcome to the new experience!" banner for returning users

### Performance Considerations

| Concern | Mitigation |
|---------|------------|
| Animations on low-end devices | Check `navigator.hardwareConcurrency`, reduce particles |
| Dashboard queries | Single aggregated query via `useDashboardData` |
| Confetti library | Use `canvas-confetti` (lightweight, 3KB) |
| Sound files | Max 50KB each, lazy-load on first use |

### Missing Pages/Components

| Page | Purpose | Priority |
|------|---------|----------|
| `/achievements` | Full achievements grid with locked/unlocked | Phase 2 |
| `/profile/settings` updates | Add timezone, sound toggle | Phase 2 |
| Lesson completion modal | Show XP earned, achievements | Phase 2 |

### AI Tutor Integration

Should the tutor be aware of gamification?

| Feature | Recommendation |
|---------|----------------|
| Tutor congratulates on level up | Yes - add to tutor context |
| Tutor mentions XP | Occasionally ("You're doing great, almost level 5!") |
| Tutor encourages streaks | Yes ("Keep your streak going tomorrow!") |

**Implementation**: Add gamification state to `useTutorContext.ts`

### Analytics (Business Metrics)

Track to measure success:
- [ ] Daily Active Users (DAU)
- [ ] Lesson completion rate (before/after gamification)
- [ ] Average session duration
- [ ] Streak retention (% users with 7+ day streak)
- [ ] Level distribution (are users progressing?)
- [ ] Achievement unlock rate

**Recommendation**: Add analytics events in Phase 2, dashboard in Phase 4.

### Localization (Future)

Current: English only with age-adaptive copy

**Future consideration**:
- Age-adaptive copy × Language = many strings
- Consider i18n library (react-i18next) early
- Store all copy in JSON for easy translation

### Sound File Licensing

Need royalty-free sounds for:
- Level up fanfare (~2s)
- Achievement chime (~1s)
- XP gain ding (~0.5s)

**Sources**:
- freesound.org (CC0 license)
- mixkit.co (free license)
- Custom creation

---

## Dependencies

New npm packages required:

```bash
# Animation & Celebrations
npm install framer-motion canvas-confetti

# Types (if needed)
npm install -D @types/canvas-confetti
```

| Package | Purpose | Size |
|---------|---------|------|
| `framer-motion` | Animations (XP bars, badges, transitions) | ~35KB gzipped |
| `canvas-confetti` | Celebration effects (level up, achievements) | ~3KB gzipped |

**Note**: Both packages are widely used and well-maintained. Framer Motion is already a good fit for React and handles reduced motion preferences automatically.

---

## Design Asset Production Workflow

### Asset Ownership & Process

| Asset Type | Owner | Process | Review |
|------------|-------|---------|--------|
| Achievement Badges (11) | UX/UI Designer | Create vector SVGs | PM approval |
| Level Badges (10) | UX/UI Designer | Create vector SVGs with color progression | PM approval |
| Sound Effects (3) | PM or Designer | Source royalty-free sounds | Engineering verification |
| Animations | Frontend Engineer | Implement via Framer Motion | Designer review via PR |

### Required Assets Checklist

#### Achievement Badges (SVG format)

| Slug | Icon | Description | Status |
|------|------|-------------|--------|
| `first-lesson` | 🎯 | Target/bullseye | [ ] |
| `five-lessons` | ⭐ | Single star | [ ] |
| `ten-lessons` | 🌟 | Glowing star | [ ] |
| `first-module` | 🏆 | Trophy | [ ] |
| `streak-3` | 🔥 | Small flame | [ ] |
| `streak-7` | 💪 | Flexing arm | [ ] |
| `streak-30` | 👑 | Crown | [ ] |
| `perfect-lesson` | 💎 | Diamond/gem | [ ] |
| `quick-learner` | ⚡ | Lightning bolt | [ ] |
| `first-code-run` | 🚀 | Rocket | [ ] |
| `bug-squasher` | 🐛 | Bug with X | [ ] |

**Specs**: 64x64px minimum, SVG format, transparent background, consistent style

#### Level Badges (SVG format)

| Level | Icon | Color | Status |
|-------|------|-------|--------|
| 1 | 🌱 | Gray (#94A3B8) | [ ] |
| 2 | 🌿 | Green (#22C55E) | [ ] |
| 3 | ⭐ | Blue (#3B82F6) | [ ] |
| 4 | 🌟 | Purple (#8B5CF6) | [ ] |
| 5 | 💫 | Orange (#F59E0B) | [ ] |
| 6 | 🔥 | Red (#EF4444) | [ ] |
| 7 | 💎 | Pink (#EC4899) | [ ] |
| 8 | 👑 | Teal (#14B8A6) | [ ] |
| 9 | 🏆 | Gold (#F97316) | [ ] |
| 10 | 🧙 | Rainbow gradient | [ ] |

**Specs**: 48x48px minimum, SVG format, glow/shine effect for higher levels

#### Sound Effects (MP3 format)

| Event | Duration | Source | License | Status |
|-------|----------|--------|---------|--------|
| Level up | ~2s | TBD | CC0/Royalty-free | [ ] |
| Achievement | ~1s | TBD | CC0/Royalty-free | [ ] |
| XP gain | ~0.5s | TBD | CC0/Royalty-free | [ ] |

**Recommended Sources**:
- [Mixkit](https://mixkit.co/free-sound-effects/) - Free license
- [Freesound](https://freesound.org/) - CC0 license
- Custom creation

**Specs**: MP3 format, max 50KB per file, normalize to -14 LUFS

---

## Testing Strategy

### Unit Tests (Phase 1 & 2)

| File | Test Coverage |
|------|---------------|
| `xp-system.ts` | `calculateLevel()`, `calculateLessonXP()`, edge cases |
| `achievement-checker.ts` | Each achievement type, threshold logic |
| `useAttemptPersistence.ts` | Timer tracking, Supabase calls (mocked) |
| `useGamification.ts` | XP awarding, level up detection, streak logic |
| `copy.ts` | Age group variations, all copy keys |

### Integration Tests

| Flow | Scope |
|------|-------|
| Lesson completion | Exercise pass → XP awarded → Achievement check → Progress update |
| Streak calculation | Day boundary handling, timezone conversion |
| Dashboard data | Aggregated queries, current module detection |

### E2E Tests (Add to existing suite)

```typescript
// e2e/gamification.spec.ts
test('completing lesson awards XP and updates level', async ({ page }) => {
  // Login as test user
  // Complete a lesson
  // Verify XP increased in MetricsBar
  // Verify achievement toast if earned
});

test('streak counter increments on daily return', async ({ page }) => {
  // See "Streak Testing Strategy" below for implementation
});
```

### Streak Testing Strategy

Testing time-dependent features like streaks requires a deterministic approach.

#### Solution: Test-Only API Endpoint

**File**: `supabase/functions/set-test-user-activity/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  // CRITICAL: Only allow in non-production environments
  const isProduction = Deno.env.get('ENVIRONMENT') === 'production';
  if (isProduction) {
    return new Response(JSON.stringify({ error: 'Not available in production' }), {
      status: 403,
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { userId, daysAgo } = await req.json();

  // Only allow for designated test user accounts
  const { data: profile } = await supabase
    .from('student_profiles')
    .select('display_name')
    .eq('auth_user_id', userId)
    .single();

  if (!profile?.display_name?.startsWith('test_')) {
    return new Response(JSON.stringify({ error: 'Only test accounts allowed' }), {
      status: 403,
    });
  }

  // Set last_activity_date to N days ago
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - daysAgo);

  await supabase
    .from('student_profiles')
    .update({ last_activity_date: targetDate.toISOString().split('T')[0] })
    .eq('auth_user_id', userId);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

#### E2E Test Implementation

```typescript
// e2e/gamification.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Streak Calculation', () => {
  test('increments streak on consecutive day activity', async ({ page, request }) => {
    // Setup: Set user's last activity to yesterday
    await request.post('/api/set-test-user-activity', {
      data: { userId: TEST_USER_ID, daysAgo: 1 }
    });

    // Action: Log in and complete a lesson
    await loginAsTestUser(page);
    await completeLesson(page);

    // Verification: Check streak counter
    const streakCounter = page.locator('[data-testid="streak-counter"]');
    await expect(streakCounter).toContainText('2'); // Was 1, now 2
  });

  test('resets streak after missing a day', async ({ page, request }) => {
    // Setup: Set user's last activity to 2 days ago
    await request.post('/api/set-test-user-activity', {
      data: { userId: TEST_USER_ID, daysAgo: 2 }
    });

    // Action: Log in and complete a lesson
    await loginAsTestUser(page);
    await completeLesson(page);

    // Verification: Streak should be reset to 1
    const streakCounter = page.locator('[data-testid="streak-counter"]');
    await expect(streakCounter).toContainText('1');
  });

  test('maintains streak for same-day activity', async ({ page, request }) => {
    // Setup: Set user's last activity to today
    await request.post('/api/set-test-user-activity', {
      data: { userId: TEST_USER_ID, daysAgo: 0 }
    });

    // Action: Complete another lesson today
    await loginAsTestUser(page);
    await completeLesson(page);

    // Verification: Streak should remain unchanged
    const streakCounter = page.locator('[data-testid="streak-counter"]');
    await expect(streakCounter).toContainText('5'); // Assuming previous streak was 5
  });
});
```

#### Security Measures

| Measure | Implementation |
|---------|----------------|
| Environment check | Function returns 403 in production |
| Account restriction | Only `test_` prefixed display names allowed |
| No deployment to prod | Function excluded from production deploy script |

---

## Achievement Criteria Evaluation

> **Note**: All achievement evaluation runs server-side in `evaluate-gamification-event` Edge Function for security. The schema below describes the criteria structure stored in the database.

### Criteria Schema

```typescript
interface AchievementCriteria {
  type: 'lessons_completed' | 'modules_completed' | 'streak' |
        'first_attempt_pass' | 'fast_completion' | 'code_runs' | 'errors_fixed'
  threshold: number  // Count or seconds (for fast_completion)
}
```

### Evaluation Logic (Server-Side)

```typescript
// supabase/functions/evaluate-gamification-event/achievement-checker.ts
// This runs on the backend Edge Function, NOT client-side

export function checkAchievement(
  criteria: AchievementCriteria,
  studentStats: StudentStats
): boolean {
  switch (criteria.type) {
    case 'lessons_completed':
      return studentStats.lessonsCompleted >= criteria.threshold
    case 'modules_completed':
      return studentStats.modulesCompleted >= criteria.threshold
    case 'streak':
      return studentStats.currentStreak >= criteria.threshold
    case 'first_attempt_pass':
      return studentStats.firstAttemptPasses >= criteria.threshold
    case 'fast_completion':
      // Check if any lesson was completed in under threshold seconds
      return studentStats.fastestLesson <= criteria.threshold
    case 'code_runs':
      return studentStats.totalCodeRuns >= criteria.threshold
    case 'errors_fixed':
      return studentStats.errorsFixed >= criteria.threshold
    default:
      return false
  }
}

// Called by the Edge Function after each gamification event
export async function evaluateAllAchievements(
  supabase: SupabaseClient,
  studentId: string,
  earnedAchievementIds: string[]
): Promise<Achievement[]> {
  // 1. Fetch all achievements from database
  // 2. Filter out already earned
  // 3. Get student stats from database (secure server-side query)
  // 4. Check each remaining against student stats
  // 5. Insert newly earned achievements
  // 6. Return newly unlocked achievements for UI celebration
}
```

---

## Error Handling

### Gamification Errors (Non-Blocking)

Gamification should NEVER block the core learning experience.

```typescript
// Pattern: Fire-and-forget with retry
async function awardXP(amount: number, reason: string) {
  try {
    await supabase.from('student_profiles').update(...)
  } catch (error) {
    // Log error, retry up to 3 times
    // If all retries fail, queue for later sync
    // NEVER throw - don't block user
    console.error('XP award failed, will retry:', error)
  }
}
```

### Celebration Error Boundary

```tsx
// Wrap celebration components to prevent crashes
<ErrorBoundary fallback={null}>
  <LevelUpCelebration level={newLevel} />
</ErrorBoundary>
```

If confetti or animation fails, user still sees success state - just without the fancy effects.

---

## Mobile Responsive Details

### MetricsBar
- Desktop (>1024px): 4 columns, horizontal layout
- Tablet (768-1024px): 2×2 grid
- Mobile (<768px): Horizontal scroll with snap, XP bar below

### CurrentModule
- Desktop: Wide card, lessons in list
- Mobile: Full width, lessons in vertical stack, larger touch targets (min 44px)

### LevelUpCelebration
- Desktop/Tablet: Modal (max-width: 500px)
- Mobile: Full-screen overlay

### Micro-reward Toasts
- Desktop: Bottom-right corner, stacked
- Mobile: Bottom-center, single toast at a time

---

## Changelog

| Date | Update |
|------|--------|
| Jan 2026 | Initial plan created |
| Jan 2026 | Added kid-friendly design specifications |
| Jan 2026 | Added micro-rewards system |
| Jan 2026 | Added age-adaptive language specs |
| Jan 2026 | Added future extensibility for multi-subject platform |
| Jan 2026 | Added detailed UI/UX specifications |
| Jan 2026 | **Decision**: Unified platform architecture (not separate apps) |
| Jan 2026 | **Decision**: Rename editor to "Playground" |
| Jan 2026 | **Decision**: Unified Playground for all programming languages |
| Jan 2026 | **Decision**: Subject-specific interfaces for non-coding subjects |
| Jan 2026 | **Added**: Success Metrics (KPIs) with measurable targets |
| Jan 2026 | **Added**: A/B Testing & Rollout Strategy with feature flags |
| Jan 2026 | **Added**: Event-Driven Architecture (React Context pub/sub) |
| Jan 2026 | **Changed**: Phase 1 to use event bus pattern instead of direct calls |
| Jan 2026 | **Changed**: Phase 2 gamification to use backend Edge Function (security fix) |
| Jan 2026 | **Added**: COPPA compliance flow specification with consent workflow |
| Jan 2026 | **Added**: Design Asset Production Workflow with checklists |
| Jan 2026 | **Decision**: Auto-detect timezone (no onboarding step) |
| Jan 2026 | **Decision**: Just-in-time sound preference prompt |
| Jan 2026 | **Added**: Formalized data migration script for existing users |
| Jan 2026 | **Added**: Concrete E2E testing strategy for streaks |
| Jan 2026 | **Updated**: Implementation checklist with all new items |
