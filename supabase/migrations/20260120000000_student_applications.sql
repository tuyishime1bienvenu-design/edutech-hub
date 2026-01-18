-- Create student_applications table for public student registrations
CREATE TABLE IF NOT EXISTS public.student_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Personal Information
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    address TEXT NOT NULL,
    emergency_contact TEXT,
    emergency_phone TEXT,

    -- Academic Information
    education_level TEXT NOT NULL,
    institution TEXT NOT NULL,
    graduation_year INTEGER NOT NULL,
    gpa DECIMAL(3,2),

    -- Program Selection
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    student_level student_level NOT NULL,

    -- Additional Information
    motivation TEXT,
    experience TEXT,
    special_needs TEXT,
    payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank-transfer', 'mobile-money')),

    -- Application Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'enrolled')),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    review_notes TEXT,

    -- Registration tracking
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_applications_email ON public.student_applications(email);
CREATE INDEX IF NOT EXISTS idx_student_applications_program_id ON public.student_applications(program_id);
CREATE INDEX IF NOT EXISTS idx_student_applications_status ON public.student_applications(status);
CREATE INDEX IF NOT EXISTS idx_student_applications_created_at ON public.student_applications(created_at);

-- Enable Row Level Security
ALTER TABLE public.student_applications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow anyone to insert (for public registration)
CREATE POLICY "Anyone can create student applications" ON public.student_applications
    FOR INSERT WITH CHECK (true);

-- Allow authenticated users to view applications (for admin/secretary review)
CREATE POLICY "Authenticated users can view student applications" ON public.student_applications
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to update applications (for admin/secretary review)
CREATE POLICY "Authenticated users can update student applications" ON public.student_applications
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_student_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_student_applications_updated_at
    BEFORE UPDATE ON public.student_applications
    FOR EACH ROW EXECUTE FUNCTION update_student_applications_updated_at();