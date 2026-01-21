
-- Add columns to notices table
ALTER TABLE notices ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id);
ALTER TABLE notices ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Attempt to add 'it' role. 
-- Note: ALTER TYPE ... ADD VALUE cannot be executed inside a transaction block in some Postgres versions.
-- We use a DO block to check if it exists first.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'it') THEN
        ALTER TYPE app_role ADD VALUE 'it';
    END IF;
END$$;

-- Enable RLS on notices if not already
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public notices are visible to everyone" ON notices;
DROP POLICY IF EXISTS "Staff can view all notices" ON notices;
DROP POLICY IF EXISTS "Students can view general active notices" ON notices;
DROP POLICY IF EXISTS "Students can view class specific notices" ON notices;
DROP POLICY IF EXISTS "Staff can insert notices" ON notices;
DROP POLICY IF EXISTS "Trainers can insert class notices" ON notices;
DROP POLICY IF EXISTS "Students can view relevant notices" ON notices;
DROP POLICY IF EXISTS "Staff can create notices" ON notices;
DROP POLICY IF EXISTS "Trainers can create class notices" ON notices;
DROP POLICY IF EXISTS "Trainers can view all notices" ON notices;

-- Policy 1: Public notices are visible to everyone
CREATE POLICY "Public notices are visible to everyone"
ON notices FOR SELECT
USING (is_public = true);

-- Policy 2: Staff (Admin, Secretary, Finance, IT) can view all notices
CREATE POLICY "Staff can view all notices"
ON notices FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM user_roles 
    WHERE role IN ('admin', 'secretary', 'finance', 'it')
  )
);

-- Policy 3: Trainers can view all notices
CREATE POLICY "Trainers can view all notices"
ON notices FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'trainer'
  )
);

-- Policy 4: Students can view relevant notices
CREATE POLICY "Students can view relevant notices"
ON notices FOR SELECT
TO authenticated
USING (
  -- User is a student
  auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'student')
  AND (
    -- Notice is public
    is_public = true
    OR
    -- Notice is for all (no specific class)
    (class_id IS NULL AND (target_roles IS NULL OR 'student' = ANY(target_roles)))
    OR
    -- Notice is for their class
    class_id IN (
      SELECT class_id FROM students WHERE user_id = auth.uid()
    )
  )
);

-- Policy 5: Creation Permissions for Staff
CREATE POLICY "Staff can create notices"
ON notices FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM user_roles 
    WHERE role IN ('admin', 'secretary', 'finance', 'it')
  )
);

-- Policy 6: Trainers can create notices ONLY for their class
CREATE POLICY "Trainers can create class notices"
ON notices FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'trainer'
  )
  AND
  class_id IN (
    -- Check if the class belongs to the trainer
    -- We join classes with profiles to match the trainer_id (which is likely profile id) to the user_id
    SELECT c.id 
    FROM classes c
    JOIN profiles p ON c.trainer_id = p.id
    WHERE p.user_id = auth.uid()
  )
);
