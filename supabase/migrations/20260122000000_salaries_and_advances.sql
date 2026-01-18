-- Create enum for salary periods
CREATE TYPE public.salary_period AS ENUM ('daily', 'weekly', 'monthly', 'custom');

-- Salaries table
CREATE TABLE public.salaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  period salary_period NOT NULL,
  custom_days INTEGER, -- only used if period is 'custom'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id) -- one salary per user
);

-- Advance requests table
CREATE TABLE public.advance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount_requested DECIMAL(10,2) NOT NULL,
  status leave_status DEFAULT 'pending' NOT NULL, -- reusing leave_status enum
  approved_amount DECIMAL(10,2),
  reason TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advance_requests ENABLE ROW LEVEL SECURITY;

-- Policies for salaries
CREATE POLICY "Users can view their own salary" ON public.salaries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins and finance can view all salaries" ON public.salaries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'finance')
    )
  );

CREATE POLICY "Admins and finance can insert/update salaries" ON public.salaries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'finance')
    )
  );

-- Policies for advance_requests
CREATE POLICY "Users can view their own advance requests" ON public.advance_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own advance requests" ON public.advance_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins and finance can view all advance requests" ON public.advance_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'finance')
    )
  );

CREATE POLICY "Admins and finance can update advance requests" ON public.advance_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'finance')
    )
  );