-- Comprehensive RLS fix for all main tables
-- This will fix RLS policies for programs, classes, and other core tables

-- 1. Fix Programs table RLS (already done, but included for completeness)
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.programs;
DROP POLICY IF EXISTS "Enable insert for admin users" ON public.programs;
DROP POLICY IF EXISTS "Enable update for admin users" ON public.programs;
DROP POLICY IF EXISTS "Enable delete for admin users" ON public.programs;
DROP POLICY IF EXISTS "Enable insert for secretary users" ON public.programs;
DROP POLICY IF EXISTS "Enable update for secretary users" ON public.programs;
DROP POLICY IF EXISTS "Enable delete for secretary users" ON public.programs;

CREATE POLICY "Enable read access for all authenticated users" ON public.programs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for admin users" ON public.programs
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Enable update for admin users" ON public.programs
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Enable delete for admin users" ON public.programs
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Enable insert for secretary users" ON public.programs
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'secretary'));

CREATE POLICY "Enable update for secretary users" ON public.programs
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'secretary'));

CREATE POLICY "Enable delete for secretary users" ON public.programs
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'secretary'));

-- 2. Fix Classes table RLS
DROP POLICY IF EXISTS "Anyone authenticated can view classes" ON public.classes;
DROP POLICY IF EXISTS "Admin can manage classes" ON public.classes;

CREATE POLICY "Enable read access for all authenticated users" ON public.classes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for admin users" ON public.classes
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Enable update for admin users" ON public.classes
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Enable delete for admin users" ON public.classes
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Enable insert for secretary users" ON public.classes
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'secretary'));

CREATE POLICY "Enable update for secretary users" ON public.classes
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'secretary'));

CREATE POLICY "Enable delete for secretary users" ON public.classes
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'secretary'));

-- 3. Fix Students table RLS
DROP POLICY IF EXISTS "Anyone authenticated can view students" ON public.students;
DROP POLICY IF EXISTS "Admin can manage students" ON public.students;

CREATE POLICY "Enable read access for all authenticated users" ON public.students
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for admin users" ON public.students
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Enable update for admin users" ON public.students
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Enable delete for admin users" ON public.students
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Enable insert for secretary users" ON public.students
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'secretary'));

CREATE POLICY "Enable update for secretary users" ON public.students
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'secretary'));

CREATE POLICY "Enable delete for secretary users" ON public.students
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'secretary'));

-- 4. Make sure RLS is enabled on all tables
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- 5. Test data insertion (optional - remove if not needed)
-- Add a test class if none exist
INSERT INTO public.classes (id, name, program_id, trainer_id, level, shift, max_capacity, current_enrollment, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Test Class - Web Development',
  (SELECT id FROM public.programs LIMIT 1),
  (SELECT id FROM public.profiles LIMIT 1),
  'L4'::student_level,
  'morning'::shift_type,
  30,
  0,
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.classes);
