-- Fix RLS policies to prevent unauthorized deletions
-- Add restrictions to prevent deletion of active students and require verification

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Admin and Secretary can manage students" ON public.students;

-- Create more restrictive policies with proper checks
CREATE POLICY "Admin can manage students" ON public.students
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Secretary can manage students with restrictions" ON public.students
  FOR ALL USING (
    public.has_role(auth.uid(), 'secretary') AND
    -- Allow INSERT, UPDATE, SELECT but restrict DELETE
    (
      (SELECT current_setting() = 'enable_deletions' FROM public.system_settings WHERE key = 'student_deletion_policy') OR
      -- Allow deletion only if student is inactive or has no attendance/payments
      (
        OLD.is_active = false OR
        NOT EXISTS (
          SELECT 1 FROM public.attendance 
          WHERE student_id = OLD.id 
          LIMIT 1
        ) OR
        NOT EXISTS (
          SELECT 1 FROM public.payments 
          WHERE student_id = OLD.id 
          LIMIT 1
        )
      )
    )
  );

-- Create system_settings table for controlling deletion policies
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    current_setting TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default setting to prevent student deletions
INSERT INTO public.system_settings (key, current_setting) 
VALUES 
  ('student_deletion_policy', 'restricted')
ON CONFLICT (key) DO UPDATE SET 
  current_setting = EXCLUDED.current_setting, 
  updated_at = NOW();
