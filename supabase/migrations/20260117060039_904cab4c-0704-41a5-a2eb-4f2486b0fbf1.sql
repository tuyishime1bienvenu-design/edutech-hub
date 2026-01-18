-- Create certificate_templates table for storing certificate designs
CREATE TABLE public.certificate_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    message TEXT NOT NULL,
    background_color TEXT DEFAULT '#ffffff',
    text_color TEXT DEFAULT '#000000',
    border_style TEXT DEFAULT 'classic',
    font_family TEXT DEFAULT 'serif',
    include_dates BOOLEAN DEFAULT true,
    include_registration_number BOOLEAN DEFAULT true,
    additional_text TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create class_trainers junction table for many-to-many relationship
CREATE TABLE public.class_trainers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(class_id, trainer_id)
);

-- Create class_curriculum table for what admin wants trainers to cover
CREATE TABLE public.class_curriculum (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_date DATE,
    completed_by UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_curriculum ENABLE ROW LEVEL SECURITY;

-- RLS for certificate_templates
CREATE POLICY "Anyone can view active templates" ON public.certificate_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage templates" ON public.certificate_templates
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS for class_trainers
CREATE POLICY "Authenticated users can view class trainers" ON public.class_trainers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage class trainers" ON public.class_trainers
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS for class_curriculum
CREATE POLICY "Authenticated users can view curriculum" ON public.class_curriculum
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage curriculum" ON public.class_curriculum
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Trainers can update their class curriculum" ON public.class_curriculum
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.class_trainers ct 
            WHERE ct.class_id = class_curriculum.class_id 
            AND ct.trainer_id = auth.uid()
        )
    );

CREATE POLICY "Trainers can insert curriculum for their classes" ON public.class_curriculum
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.class_trainers ct 
            WHERE ct.class_id = class_curriculum.class_id 
            AND ct.trainer_id = auth.uid()
        )
        OR public.has_role(auth.uid(), 'admin')
    );

-- Triggers for updated_at
CREATE TRIGGER update_certificate_templates_updated_at
    BEFORE UPDATE ON public.certificate_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_class_curriculum_updated_at
    BEFORE UPDATE ON public.class_curriculum
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();