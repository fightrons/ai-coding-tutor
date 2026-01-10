-- ============================================
-- Exercise Attempt Aggregates - Phase 1 Data Collection
-- ============================================
-- This migration creates a trigger that automatically updates
-- student_progress aggregates when exercise attempts are recorded.
--
-- Previously, exercise_attempts was never populated and progress
-- aggregates (total_attempts, total_time_seconds) were always 0.

-- ============================================
-- 1. TRIGGER FUNCTION
-- ============================================
-- Updates student_progress when a new attempt is inserted.
-- Creates progress record if it doesn't exist (upsert pattern).

CREATE OR REPLACE FUNCTION update_progress_aggregates()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO student_progress (
    student_id,
    lesson_id,
    status,
    total_attempts,
    total_time_seconds,
    started_at
  )
  VALUES (
    NEW.student_id,
    NEW.lesson_id,
    'in_progress',
    1,
    COALESCE(NEW.time_spent_seconds, 0),
    NOW()
  )
  ON CONFLICT (student_id, lesson_id) DO UPDATE SET
    total_attempts = student_progress.total_attempts + 1,
    total_time_seconds = student_progress.total_time_seconds + COALESCE(NEW.time_spent_seconds, 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. CREATE TRIGGER
-- ============================================
-- Fires after each insert on exercise_attempts.

-- Drop if exists (for idempotent migrations)
DROP TRIGGER IF EXISTS on_exercise_attempt_insert ON exercise_attempts;

CREATE TRIGGER on_exercise_attempt_insert
  AFTER INSERT ON exercise_attempts
  FOR EACH ROW EXECUTE FUNCTION update_progress_aggregates();

-- ============================================
-- 3. GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION update_progress_aggregates() TO postgres, service_role;
