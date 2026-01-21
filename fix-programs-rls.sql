-- Fix RLS policies for programs table
-- This will allow admin users to create, update, and delete programs

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone authenticated can view programs" ON public.programs;
DROP POLICY IF EXISTS "Admin can manage programs" ON public.programs;

-- Create new RLS policies for programs table
CREATE POLICY "Enable read access for all authenticated users" ON public.programs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for admin users" ON public.programs
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Enable update for admin users" ON public.programs
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Enable delete for admin users" ON public.programs
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Also create policies for secretary role to manage programs
CREATE POLICY "Enable insert for secretary users" ON public.programs
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'secretary'));

CREATE POLICY "Enable update for secretary users" ON public.programs
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'secretary'));

CREATE POLICY "Enable delete for secretary users" ON public.programs
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'secretary'));

-- Make sure RLS is enabled on the table
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
