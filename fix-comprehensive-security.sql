-- Comprehensive Security Fix for RLS Policies
-- Prevents unauthorized deletions and adds audit logging

-- 1. STUDENTS TABLE - Add deletion restrictions
DROP POLICY IF EXISTS "Admin and Secretary can manage students" ON public.students;

-- Create secure student management policies
CREATE POLICY "Admin can fully manage students" ON public.students
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Secretary can manage students with audit" ON public.students
  FOR INSERT, UPDATE, SELECT USING (public.has_role(auth.uid(), 'secretary'));

CREATE POLICY "Secretary can delete inactive students only" ON public.students
  FOR DELETE USING (
    public.has_role(auth.uid(), 'secretary') AND
    OLD.is_active = false AND
    -- Only allow deletion if no payment history exists
    NOT EXISTS (
      SELECT 1 FROM public.payments 
      WHERE student_id = OLD.id AND status = 'paid'
      LIMIT 1
    )
  );

-- 2. PROGRAMS TABLE - Restrict deletions
DROP POLICY IF EXISTS "Admin can manage programs" ON public.programs;

CREATE POLICY "Admin can manage programs" ON public.programs
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Secretary can manage programs but not delete" ON public.programs
  FOR INSERT, UPDATE, SELECT USING (public.has_role(auth.uid(), 'secretary'));

-- 3. CLASSES TABLE - Add deletion restrictions
DROP POLICY IF EXISTS "Admin can manage classes" ON public.classes;

CREATE POLICY "Admin can fully manage classes" ON public.classes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Secretary can manage classes but not delete" ON public.classes
  FOR INSERT, UPDATE, SELECT USING (public.has_role(auth.uid(), 'secretary'));

-- 4. PAYMENTS TABLE - Prevent deletion of paid payments
DROP POLICY IF EXISTS "Admin and Finance can manage payments" ON public.payments;

CREATE POLICY "Admin can fully manage payments" ON public.payments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Finance can manage payments but not delete" ON public.payments
  FOR INSERT, UPDATE, SELECT USING (public.has_role(auth.uid(), 'finance'));

-- 5. ATTENDANCE TABLE - Prevent deletion of attendance records
DROP POLICY IF EXISTS "Admin and Secretary can view all attendance" ON public.attendance;

CREATE POLICY "Admin can fully manage attendance" ON public.attendance
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Secretary can manage attendance but not delete" ON public.attendance
  FOR INSERT, UPDATE, SELECT USING (public.has_role(auth.uid(), 'secretary'));

-- 6. Create audit log for deletion attempts
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

-- Enable RLS on audit log
ALTER TABLE public.deletion_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert audit logs" ON public.deletion_audit_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can view audit logs" ON public.deletion_audit_log
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 7. Create trigger to log deletion attempts
CREATE OR REPLACE FUNCTION public.log_deletion_attempt()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.deletion_audit_log (
            table_name,
            record_id,
            user_id,
            user_role,
            action,
            reason
        ) VALUES (
            TG_TABLE_NAME,
            OLD.id,
            auth.uid(),
            COALESCE(
                (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1),
                'unknown'
            ),
            'DELETE_ATTEMPT',
            CASE 
                WHEN OLD.is_active = true THEN 'Attempted to delete active student'
                ELSE 'Deleted inactive student'
            END
        );
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for critical tables
DROP TRIGGER IF EXISTS log_student_deletions ON public.students;
CREATE TRIGGER log_student_deletions
    AFTER DELETE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.log_deletion_attempt();

DROP TRIGGER IF EXISTS log_program_deletions ON public.programs;
CREATE TRIGGER log_program_deletions
    AFTER DELETE ON public.programs
    FOR EACH ROW EXECUTE FUNCTION public.log_deletion_attempt();

DROP TRIGGER IF EXISTS log_class_deletions ON public.classes;
CREATE TRIGGER log_class_deletions
    AFTER DELETE ON public.classes
    FOR EACH ROW EXECUTE FUNCTION public.log_deletion_attempt();
