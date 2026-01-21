-- Create issued_certificates table to track generated certificates
CREATE TABLE IF NOT EXISTS public.issued_certificates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    certificate_template_id UUID REFERENCES public.certificate_templates(id) ON DELETE SET NULL,
    certificate_number TEXT NOT NULL UNIQUE,
    issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
    issued_by UUID REFERENCES auth.users(id),
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(student_id) -- Prevent duplicate certificates per student
);

-- Enable Row Level Security
ALTER TABLE public.issued_certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for issued_certificates
DROP POLICY IF EXISTS "Students can view their own certificate" ON public.issued_certificates;
CREATE POLICY "Students can view their own certificate" ON public.issued_certificates
    FOR SELECT USING (
        student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Admin and Secretary can view all certificates" ON public.issued_certificates;
CREATE POLICY "Admin and Secretary can view all certificates" ON public.issued_certificates
    FOR SELECT USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'secretary')
    );

DROP POLICY IF EXISTS "Admin and Secretary can manage certificates" ON public.issued_certificates;
CREATE POLICY "Admin and Secretary can manage certificates" ON public.issued_certificates
    FOR ALL USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'secretary')
    );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_issued_certificates_student_id ON public.issued_certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_issued_certificates_certificate_number ON public.issued_certificates(certificate_number);
