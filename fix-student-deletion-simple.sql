-- Fix Student Deletion Restrictions
-- Prevents secretary from deleting active students and adds audit logging

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Admin and Secretary can manage students" ON public.students;

-- Create secure policies
CREATE POLICY "Admin can fully manage students" ON public.students
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Secretary can manage students with restrictions" ON public.students
  FOR INSERT, UPDATE, SELECT USING (public.has_role(auth.uid(), 'secretary'));

CREATE POLICY "Secretary can delete inactive students only" ON public.students
  FOR DELETE USING (
    public.has_role(auth.uid(), 'secretary') AND 
    OLD.is_active = false
  );

-- Create audit log
CREATE TABLE IF NOT EXISTS public.deletion_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    user_role TEXT NOT NULL,
    action TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.deletion_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert audit logs" ON public.deletion_audit_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can view audit logs" ON public.deletion_audit_log
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger function
CREATE OR REPLACE FUNCTION public.log_deletion_attempt()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.deletion_audit_log (
            table_name, record_id, user_id, user_role, action, reason
        ) VALUES (
            TG_TABLE_NAME, OLD.id, auth.uid(),
            (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1),
            'DELETE_ATTEMPT',
            CASE WHEN OLD.is_active = true THEN 'Attempted to delete active student' ELSE 'Deleted inactive student' END
        );
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS log_student_deletions ON public.students;
CREATE TRIGGER log_student_deletions
    AFTER DELETE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.log_deletion_attempt();
