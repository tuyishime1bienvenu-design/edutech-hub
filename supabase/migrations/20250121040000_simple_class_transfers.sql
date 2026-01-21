-- Simple class transfer - just update student's class_id
CREATE TABLE public.simple_class_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  old_class_id TEXT,
  new_class_id TEXT NOT NULL,
  transferred_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transfer_reason TEXT,
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- RLS Policies
CREATE POLICY "Trainers can insert class transfers" ON public.simple_class_transfers
FOR INSERT WITH CHECK (auth.uid() = transferred_by);

CREATE POLICY "Trainers can update their own class transfers" ON public.simple_class_transfers
FOR UPDATE USING (auth.uid() = transferred_by);

CREATE POLICY "Admin and Secretary can manage all class transfers" ON public.simple_class_transfers
FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'secretary')
);
