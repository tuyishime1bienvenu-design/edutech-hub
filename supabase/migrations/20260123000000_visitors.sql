-- Create enum for visitor types
CREATE TYPE public.visitor_type AS ENUM ('school', 'company', 'individual');

-- Create enum for visit purposes
CREATE TYPE public.visit_purpose AS ENUM ('visit_children', 'visit_company');

-- Visitors table
CREATE TABLE public.visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name TEXT NOT NULL,
  visitor_type visitor_type NOT NULL,
  visit_purpose visit_purpose,
  school_name TEXT, -- for school visitors
  company_name TEXT, -- for company visitors
  student_id UUID REFERENCES public.students(id), -- for individual visitors visiting children
  reason TEXT, -- general reason
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  recorded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;

-- Policies for visitors
CREATE POLICY "Secretaries can view all visitors" ON public.visitors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'secretary'
    )
  );

CREATE POLICY "Secretaries can insert visitors" ON public.visitors
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'secretary'
    )
  );

CREATE POLICY "Admins can view all visitors" ON public.visitors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );