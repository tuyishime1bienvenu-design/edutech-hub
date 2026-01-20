-- Add forwarded_to_admin column to salary_advances table to track workflow status
ALTER TABLE public.salary_advances 
ADD COLUMN IF NOT EXISTS forwarded_to_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS forwarded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS forwarded_by UUID;

-- Add comment for clarity
COMMENT ON COLUMN public.salary_advances.forwarded_to_admin IS 'Indicates if finance has forwarded this request to admin for approval';
COMMENT ON COLUMN public.salary_advances.forwarded_at IS 'Timestamp when the request was forwarded to admin';
COMMENT ON COLUMN public.salary_advances.forwarded_by IS 'User ID of the finance person who forwarded the request';