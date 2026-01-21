-- Create job_postings table
CREATE TABLE IF NOT EXISTS public.job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  skills TEXT[] DEFAULT '{}',
  responsibilities TEXT NOT NULL,
  location TEXT NOT NULL,
  employment_type TEXT NOT NULL CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'internship')),
  salary_range TEXT,
  department TEXT NOT NULL,
  posted_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  application_deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_applications table
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.job_postings(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  cover_letter TEXT,
  cv_url TEXT,
  cover_letter_url TEXT,
  motivation_letter_url TEXT,
  highest_degree TEXT,
  experience_years INTEGER DEFAULT 0,
  application_key VARCHAR(32) UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'accepted', 'rejected', 'withdrawn')),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_documents table for required documents
CREATE TABLE IF NOT EXISTS public.job_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.job_postings(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('cv', 'cover_letter', 'motivation_letter', 'certificates')),
  is_required BOOLEAN DEFAULT true,
  description TEXT,
  file_size_limit INTEGER DEFAULT 5242880, -- 5MB in bytes
  allowed_extensions TEXT[] DEFAULT '{pdf,doc,docx}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Admins and Secretaries can manage job postings
DROP POLICY IF EXISTS "Admins and Secretaries can manage job postings" ON public.job_postings;
CREATE POLICY "Admins and Secretaries can manage job postings" ON public.job_postings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'secretary')
    )
  );

-- Policy: Anyone can read active job postings
DROP POLICY IF EXISTS "Anyone can read active job postings" ON public.job_postings;
CREATE POLICY "Anyone can read active job postings" ON public.job_postings
  FOR SELECT USING (
    is_active = true AND (application_deadline IS NULL OR application_deadline > NOW())
  );

-- Policy: Anyone can insert applications
DROP POLICY IF EXISTS "Anyone can insert job applications" ON public.job_applications;
CREATE POLICY "Anyone can insert job applications" ON public.job_applications
  FOR INSERT WITH CHECK (true);

-- Policy: Admins and Secretaries can read all applications
DROP POLICY IF EXISTS "Admins and Secretaries can read job applications" ON public.job_applications;
CREATE POLICY "Admins and Secretaries can read job applications" ON public.job_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'secretary')
    )
  );

-- Policy: Admins and Secretaries can update applications
DROP POLICY IF EXISTS "Admins and Secretaries can update job applications" ON public.job_applications;
CREATE POLICY "Admins and Secretaries can update job applications" ON public.job_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'secretary')
    )
  );

-- Policy: Users can update their own applications (withdraw only)
DROP POLICY IF EXISTS "Users can update own applications" ON public.job_applications;
CREATE POLICY "Users can update own applications" ON public.job_applications
  FOR UPDATE USING (
    applicant_id = auth.uid() AND (
      (SELECT status FROM public.job_applications WHERE id = public.job_applications.id) = 'pending'
    )
  );

-- Policy: Admins and Secretaries can delete applications
DROP POLICY IF EXISTS "Admins and Secretaries can delete job applications" ON public.job_applications;
CREATE POLICY "Admins and Secretaries can delete job applications" ON public.job_applications
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'secretary')
    )
  );

-- Policy: Anyone can read job documents
DROP POLICY IF EXISTS "Anyone can read job documents" ON public.job_documents;
CREATE POLICY "Anyone can read job documents" ON public.job_documents
  FOR SELECT USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_job_postings_updated_at ON public.job_postings;
CREATE TRIGGER update_job_postings_updated_at
    BEFORE UPDATE ON public.job_postings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_applications_updated_at ON public.job_applications;
CREATE TRIGGER update_job_applications_updated_at
    BEFORE UPDATE ON public.job_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
