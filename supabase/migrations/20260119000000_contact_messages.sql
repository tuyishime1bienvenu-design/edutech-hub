-- Create contact_messages table for storing contact form submissions
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    inquiry_type TEXT NOT NULL DEFAULT 'general',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contact_messages
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can insert contact messages" ON public.contact_messages
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin and secretary can view all contact messages" ON public.contact_messages;
CREATE POLICY "Admin and secretary can view all contact messages" ON public.contact_messages
    FOR SELECT USING (
        public.has_role(auth.uid(), 'admin') OR
        public.has_role(auth.uid(), 'secretary')
    );

DROP POLICY IF EXISTS "Admin and secretary can update contact messages" ON public.contact_messages;
CREATE POLICY "Admin and secretary can update contact messages" ON public.contact_messages
    FOR UPDATE USING (
        public.has_role(auth.uid(), 'admin') OR
        public.has_role(auth.uid(), 'secretary')
    );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contact_messages_is_read ON public.contact_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at DESC);