-- Create Enums
CREATE TYPE public.transfer_status AS ENUM ('pending', 'approved', 'rejected');
-- CREATE TYPE public.advance_status AS ENUM ('pending', 'approved', 'rejected', 'paid');

-- Create class transfers table
CREATE TABLE public.class_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  to_class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  transferred_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transfer_reason TEXT,
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status transfer_status DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create advance requests table
-- CREATE TABLE public.advance_requests (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
--   amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
--   reason TEXT NOT NULL,
--   status advance_status DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
--   requested_date DATE NOT NULL DEFAULT CURRENT_DATE,
--   approved_date DATE,
--   approved_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
--   notes TEXT,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
-- );

-- Create indexes for better performance
CREATE INDEX idx_class_transfers_from_class ON public.class_transfers(from_class_id);
CREATE INDEX idx_class_transfers_to_class ON public.class_transfers(to_class_id);
CREATE INDEX idx_class_transfers_student ON public.class_transfers(student_id);
CREATE INDEX idx_class_transfers_date ON public.class_transfers(transfer_date);
-- CREATE INDEX idx_advance_requests_trainer ON public.advance_requests(trainer_id);
-- CREATE INDEX idx_advance_requests_status ON public.advance_requests(status);
-- CREATE INDEX idx_advance_requests_date ON public.advance_requests(requested_date);

-- RLS Policies for class transfers
CREATE POLICY "Trainers can view their own class transfers" ON public.class_transfers
FOR SELECT USING (auth.uid() = transferred_by);

CREATE POLICY "Trainers can insert class transfers" ON public.class_transfers
FOR INSERT WITH CHECK (auth.uid() = transferred_by);

CREATE POLICY "Trainers can update their own class transfers" ON public.class_transfers
FOR UPDATE USING (auth.uid() = transferred_by);

CREATE POLICY "Admin and Secretary can manage all class transfers" ON public.class_transfers
FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'secretary')
);

-- RLS Policies for advance requests
-- CREATE POLICY "Trainers can view their own advance requests" ON public.advance_requests
-- FOR SELECT USING (auth.uid() = trainer_id);

-- CREATE POLICY "Trainers can insert advance requests" ON public.advance_requests
-- FOR INSERT WITH CHECK (auth.uid() = trainer_id);

-- CREATE POLICY "Trainers can update their own advance requests" ON public.advance_requests
-- FOR UPDATE USING (auth.uid() = trainer_id);

-- CREATE POLICY "Admin and Finance can manage all advance requests" ON public.advance_requests
-- FOR ALL USING (
--   public.has_role(auth.uid(), 'admin') OR 
--   public.has_role(auth.uid(), 'finance')
-- );
