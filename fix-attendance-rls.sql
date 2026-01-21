-- Fix RLS policies for attendance table to allow admin viewing
-- This will enable admins and secretaries to view attendance reports

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.attendance;
DROP POLICY IF EXISTS "Enable insert for admin users" ON public.attendance;
DROP POLICY IF EXISTS "Enable update for admin users" ON public.attendance;
DROP POLICY IF EXISTS "Enable delete for admin users" ON public.attendance;
DROP POLICY IF EXISTS "Enable insert for secretary users" ON public.attendance;
DROP POLICY IF EXISTS "Enable update for secretary users" ON public.attendance;
DROP POLICY IF EXISTS "Enable delete for secretary users" ON public.attendance;
DROP POLICY IF EXISTS "Enable insert for trainer users" ON public.attendance;
DROP POLICY IF EXISTS "Enable update for trainer users" ON public.attendance;
DROP POLICY IF EXISTS "Enable delete for trainer users" ON public.attendance;

-- Create new RLS policies for attendance table
CREATE POLICY "Enable read access for all authenticated users" ON public.attendance
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for admin users" ON public.attendance
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Enable update for admin users" ON public.attendance
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Enable delete for admin users" ON public.attendance
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Enable insert for secretary users" ON public.attendance
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'secretary'));

CREATE POLICY "Enable update for secretary users" ON public.attendance
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'secretary'));

CREATE POLICY "Enable delete for secretary users" ON public.attendance
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'secretary'));

CREATE POLICY "Enable insert for trainer users" ON public.attendance
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'trainer'));

CREATE POLICY "Enable update for trainer users" ON public.attendance
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'trainer') AND 
    class_id IN (
      SELECT id FROM public.classes WHERE trainer_id = auth.uid()
    )
  );

CREATE POLICY "Enable delete for trainer users" ON public.attendance
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'trainer') AND 
    class_id IN (
      SELECT id FROM public.classes WHERE trainer_id = auth.uid()
    )
  );

-- Make sure RLS is enabled on the table
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Also fix any issues with students table access
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.students;
DROP POLICY IF EXISTS "Enable insert for admin users" ON public.students;
DROP POLICY IF EXISTS "Enable update for admin users" ON public.students;
DROP POLICY IF EXISTS "Enable delete for admin users" ON public.students;
DROP POLICY IF EXISTS "Enable insert for secretary users" ON public.students;
DROP POLICY IF EXISTS "Enable update for secretary users" ON public.students;
DROP POLICY IF EXISTS "Enable delete for secretary users" ON public.students;

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

-- Make sure RLS is enabled on the students table
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Fix profiles table access
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for admin users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for admin users" ON public.profiles;
DROP POLICY IF EXISTS "Enable delete for admin users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for secretary users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for secretary users" ON public.profiles;
DROP POLICY IF EXISTS "Enable delete for secretary users" ON public.profiles;

CREATE POLICY "Enable read access for all authenticated users" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for admin users" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Enable update for admin users" ON public.profiles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Enable delete for admin users" ON public.profiles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Enable insert for secretary users" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'secretary'));

CREATE POLICY "Enable update for secretary users" ON public.profiles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'secretary'));

CREATE POLICY "Enable delete for secretary users" ON public.profiles
  FOR DELETE TO authenticated USING (public.profiles)
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'secretary'));

-- Make sure RLS is enabled on the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
