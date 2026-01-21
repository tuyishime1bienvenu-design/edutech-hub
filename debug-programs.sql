-- Debug programs table
-- Check if programs exist and test RLS policies

-- 1. Check if programs table exists and has data
SELECT COUNT(*) as total_programs FROM public.programs;

-- 2. Show existing programs (if any)
SELECT id, name, is_active, created_at FROM public.programs ORDER BY created_at DESC LIMIT 5;

-- 3. Check RLS status
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'programs' AND schemaname = 'public';

-- 4. Check existing RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'programs' AND schemaname = 'public';

-- 5. Test if current user can read programs (bypass RLS temporarily)
SET row_security = off;
SELECT COUNT(*) as programs_bypassing_rls FROM public.programs;
SET row_security = on;

-- 6. Insert a test program (if none exist)
INSERT INTO public.programs (id, name, description, eligible_levels, start_date, end_date, is_active, created_at)
SELECT 
  gen_random_uuid(),
  'Test Program - Web Development',
  'Learn modern web development with HTML, CSS, and JavaScript',
  ARRAY['L3'::student_level, 'L4'::student_level],
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '3 months',
  true,
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.programs);

-- 7. Verify the test program was created
SELECT COUNT(*) as total_programs_after_insert FROM public.programs;
