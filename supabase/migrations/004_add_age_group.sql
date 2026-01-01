-- Migration: Add age_group to student_profiles
-- Purpose: Enable age-appropriate content presentation in the AI tutor

-- Add age_group column to student_profiles
ALTER TABLE student_profiles
ADD COLUMN age_group TEXT CHECK (age_group IN ('under_13', '13-17', '18-25', '26-35', '36+'));

-- Add index for potential filtering/analytics
CREATE INDEX idx_student_profiles_age_group ON student_profiles(age_group);

-- Add comment for documentation
COMMENT ON COLUMN student_profiles.age_group IS 'Age group for adapting content presentation';
