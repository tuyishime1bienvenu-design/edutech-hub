-- Create vacancies table for job openings
CREATE TABLE IF NOT EXISTS public.vacancies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT 'Kigali, Rwanda',
    employment_type TEXT NOT NULL DEFAULT 'full-time', -- full-time, part-time, contract, internship
    experience_level TEXT NOT NULL DEFAULT 'entry-level', -- entry-level, mid-level, senior-level
    salary_range TEXT, -- e.g., "RWF 300,000 - 500,000"
    description TEXT NOT NULL,
    requirements JSONB NOT NULL DEFAULT '[]', -- array of requirements
    responsibilities JSONB NOT NULL DEFAULT '[]', -- array of responsibilities
    required_documents JSONB NOT NULL DEFAULT '[]', -- array of required documents
    application_deadline DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.vacancies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vacancies
DROP POLICY IF EXISTS "Anyone can view active vacancies" ON public.vacancies;
CREATE POLICY "Anyone can view active vacancies" ON public.vacancies
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admin can manage all vacancies" ON public.vacancies;
CREATE POLICY "Admin can manage all vacancies" ON public.vacancies
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_vacancies_is_active ON public.vacancies(is_active);
CREATE INDEX IF NOT EXISTS idx_vacancies_department ON public.vacancies(department);
CREATE INDEX IF NOT EXISTS idx_vacancies_created_at ON public.vacancies(created_at DESC);