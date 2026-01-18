-- Create services table for managing service offerings and special offers
CREATE TABLE public.services (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL, -- e.g., 'internship', 'training', 'consultation'
    is_special_offer BOOLEAN NOT NULL DEFAULT false,
    target_audience TEXT, -- e.g., 'schools', 'individuals', 'companies'
    price DECIMAL(10,2),
    currency TEXT DEFAULT 'RWF',
    duration TEXT, -- e.g., '3 months', '1 week'
    features JSONB, -- array of features/benefits
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for services
CREATE POLICY "Anyone can view active services" ON public.services
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage all services" ON public.services
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster lookups
CREATE INDEX idx_services_category ON public.services(category);
CREATE INDEX idx_services_is_active ON public.services(is_active);
CREATE INDEX idx_services_is_special_offer ON public.services(is_special_offer);