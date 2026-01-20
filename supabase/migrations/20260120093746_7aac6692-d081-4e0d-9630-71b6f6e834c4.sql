-- Create job_applications table for storing job applications
CREATE TABLE public.job_applications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    vacancy_id UUID REFERENCES public.vacancies(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    cover_letter TEXT,
    resume_url TEXT,
    documents TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'rejected', 'hired')),
    reviewed_by UUID,
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can submit job applications" 
ON public.job_applications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admin can manage all applications" 
ON public.job_applications 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for job application documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('job-documents', 'job-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for job documents
CREATE POLICY "Anyone can upload job documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'job-documents');

CREATE POLICY "Admin can view job documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'job-documents' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can delete job documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'job-documents' AND has_role(auth.uid(), 'admin'::app_role));

-- Create update timestamp trigger
CREATE TRIGGER update_job_applications_updated_at
BEFORE UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();