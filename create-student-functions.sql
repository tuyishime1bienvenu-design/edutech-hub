-- Create necessary functions for student management

-- Function to update class enrollment counts
CREATE OR REPLACE FUNCTION update_class_enrollment(class_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.classes 
    SET current_enrollment = (
        SELECT COUNT(*) 
        FROM public.student_classes 
        WHERE class_id = classes.id AND status = 'active'
    )
    WHERE id = class_id;
END;
$$ LANGUAGE plpgsql;

-- Create student_classes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.student_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped', 'transferred')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(student_id, class_id)
);

-- Add RLS policies for student_classes table
ALTER TABLE public.student_classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.student_classes;
DROP POLICY IF EXISTS "Enable insert for admin users" ON public.student_classes;
DROP POLICY IF EXISTS "Enable update for admin users" ON public.student_classes;
DROP POLICY IF EXISTS "Enable delete for admin users" ON public.student_classes;

CREATE POLICY "Enable read access for all authenticated users" ON public.student_classes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for admin users" ON public.student_classes
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Enable update for admin users" ON public.student_classes
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Enable delete for admin users" ON public.student_classes
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Enable insert for secretary users" ON public.student_classes
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'secretary'));

CREATE POLICY "Enable update for secretary users" ON public.student_classes
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'secretary'));

CREATE POLICY "Enable delete for secretary users" ON public.student_classes
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'secretary'));

CREATE POLICY "Enable update for trainer users" ON public.student_classes
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'trainer') AND 
    class_id IN (
      SELECT id FROM public.classes WHERE trainer_id = auth.uid()
    )
  );
