-- Temporary fix: Disable RLS for programs table to test
ALTER TABLE public.programs DISABLE ROW LEVEL SECURITY;

-- After testing, re-enable with:
-- ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
