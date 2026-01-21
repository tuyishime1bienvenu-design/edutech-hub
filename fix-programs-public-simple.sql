-- Fix RLS policies for programs table to allow public access
-- This will allow unauthenticated users to view programs for registration

-- Drop only the read policy and recreate it to allow public access
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.programs;
DROP POLICY IF EXISTS "Anyone authenticated can view programs" ON public.programs;

-- Create new RLS policy that allows anyone (including public) to view programs
CREATE POLICY "Enable read access for all users (including public)" ON public.programs
  FOR SELECT USING (true);
