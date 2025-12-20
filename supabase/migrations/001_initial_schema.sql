-- ============================================
-- AI Programming Tutor - Initial Schema
-- ============================================

-- Modules group related lessons (e.g., "Variables", "Functions")
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sequence_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Individual lessons within modules
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  sequence_order INTEGER NOT NULL,

  -- Lesson content (structured JSON)
  content JSONB NOT NULL,

  -- Exercise definition
  exercise JSONB,

  -- Metadata
  estimated_minutes INTEGER DEFAULT 5,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'easy',
  prerequisites TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Extended profile (supplements Supabase auth.users)
CREATE TABLE student_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Onboarding data
  display_name TEXT,
  learning_goal TEXT,
  prior_experience TEXT CHECK (prior_experience IN ('none', 'some', 'other_language')),
  preferred_style TEXT CHECK (preferred_style IN ('examples', 'analogies', 'theory')) DEFAULT 'examples',

  -- Computed/updated by system
  current_skill_level TEXT CHECK (current_skill_level IN ('beginner', 'intermediate')) DEFAULT 'beginner',

  -- Profile display
  avatar_emoji TEXT DEFAULT '😊',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Lesson-level progress
CREATE TABLE student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,

  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  total_attempts INTEGER DEFAULT 0,
  total_time_seconds INTEGER DEFAULT 0,

  UNIQUE(student_id, lesson_id)
);

-- Individual exercise attempts
CREATE TABLE exercise_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,

  code_submitted TEXT NOT NULL,

  passed BOOLEAN NOT NULL,
  error_message TEXT,
  test_results JSONB,

  time_spent_seconds INTEGER,

  hint_requested BOOLEAN DEFAULT false,
  hint_level INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tutor conversation history
CREATE TABLE tutor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,

  role TEXT CHECK (role IN ('student', 'tutor')) NOT NULL,
  content TEXT NOT NULL,

  message_type TEXT CHECK (message_type IN ('question', 'hint', 'explanation', 'encouragement', 'correction')),

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_lessons_module ON lessons(module_id);
CREATE INDEX idx_lessons_sequence ON lessons(sequence_order);
CREATE INDEX idx_progress_student ON student_progress(student_id);
CREATE INDEX idx_progress_lesson ON student_progress(lesson_id);
CREATE INDEX idx_attempts_student_lesson ON exercise_attempts(student_id, lesson_id);
CREATE INDEX idx_attempts_created ON exercise_attempts(created_at DESC);
CREATE INDEX idx_messages_student_lesson ON tutor_messages(student_id, lesson_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_messages ENABLE ROW LEVEL SECURITY;

-- Curriculum: Anyone can read
CREATE POLICY "Curriculum is publicly readable"
  ON modules FOR SELECT
  USING (true);

CREATE POLICY "Lessons are publicly readable"
  ON lessons FOR SELECT
  USING (true);

-- Student profile: Users can only access their own
CREATE POLICY "Users can view own profile"
  ON student_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON student_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON student_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Progress: Users can only access their own
CREATE POLICY "Users can view own progress"
  ON student_progress FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Users can insert own progress"
  ON student_progress FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can update own progress"
  ON student_progress FOR UPDATE
  USING (auth.uid() = student_id);

-- Attempts: Users can only access their own
CREATE POLICY "Users can view own attempts"
  ON exercise_attempts FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Users can insert own attempts"
  ON exercise_attempts FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Messages: Users can only access their own
CREATE POLICY "Users can view own messages"
  ON tutor_messages FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Users can insert own messages"
  ON tutor_messages FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-create student profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.student_profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION handle_new_user() TO postgres, service_role;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Get next lesson for student
CREATE OR REPLACE FUNCTION get_next_lesson(p_student_id UUID)
RETURNS TABLE(lesson_id UUID, lesson_slug TEXT, lesson_title TEXT, module_title TEXT)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT
    l.id,
    l.slug,
    l.title,
    m.title
  FROM public.lessons l
  JOIN public.modules m ON l.module_id = m.id
  LEFT JOIN public.student_progress sp ON sp.lesson_id = l.id AND sp.student_id = p_student_id
  WHERE sp.status IS NULL OR sp.status != 'completed'
  ORDER BY m.sequence_order, l.sequence_order
  LIMIT 1;
$$;

-- Update timestamp on profile changes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER student_profiles_updated_at
  BEFORE UPDATE ON student_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
