-- Create contact_messages table for storing contact form submissions
CREATE TABLE public.contact_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    inquiry_type TEXT DEFAULT 'general',
    status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived')),
    reply TEXT,
    replied_by UUID REFERENCES auth.users(id),
    replied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gallery_images table
CREATE TABLE public.gallery_images (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    category TEXT DEFAULT 'events',
    tags TEXT[] DEFAULT '{}',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create visitors table
CREATE TABLE public.visitors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    purpose TEXT NOT NULL,
    organization TEXT,
    host_name TEXT,
    visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    departure_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    recorded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create equipment table for IT department
CREATE TABLE public.equipment (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    serial_number TEXT,
    model TEXT,
    category TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'repair', 'retired', 'lost')),
    purchase_date DATE,
    purchase_cost NUMERIC,
    assigned_to TEXT,
    assigned_to_id UUID REFERENCES auth.users(id),
    location TEXT,
    warranty_expiry DATE,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create materials_inventory table
CREATE TABLE public.materials_inventory (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    type TEXT DEFAULT 'consumable' CHECK (type IN ('consumable', 'non_consumable', 'equipment')),
    unit TEXT DEFAULT 'pieces',
    current_quantity NUMERIC DEFAULT 0,
    minimum_quantity NUMERIC DEFAULT 0,
    unit_cost NUMERIC,
    supplier TEXT,
    location TEXT,
    barcode TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create material_transactions table for tracking material distribution
CREATE TABLE public.material_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    material_id UUID NOT NULL REFERENCES public.materials_inventory(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('in', 'out', 'return', 'adjustment')),
    quantity NUMERIC NOT NULL,
    unit_cost NUMERIC,
    total_cost NUMERIC,
    recipient_id UUID REFERENCES auth.users(id),
    recipient_name TEXT,
    purpose TEXT,
    notes TEXT,
    is_returned BOOLEAN DEFAULT false,
    return_date TIMESTAMP WITH TIME ZONE,
    return_notes TEXT,
    recorded_by UUID REFERENCES auth.users(id),
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wifi_networks table
CREATE TABLE public.wifi_networks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    description TEXT,
    assigned_roles TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vacancies table
CREATE TABLE public.vacancies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    location TEXT DEFAULT 'Kigali, Rwanda',
    type TEXT DEFAULT 'full-time' CHECK (type IN ('full-time', 'part-time', 'contract', 'internship')),
    salary_min NUMERIC,
    salary_max NUMERIC,
    description TEXT,
    responsibilities TEXT[],
    requirements TEXT[],
    benefits TEXT[],
    deadline DATE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create services table for dynamic services display
CREATE TABLE public.services (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT DEFAULT 'BookOpen',
    features TEXT[] DEFAULT '{}',
    price TEXT,
    color TEXT DEFAULT 'from-blue-500 to-blue-600',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wifi_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Contact Messages Policies
CREATE POLICY "Anyone can submit contact messages" ON public.contact_messages
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin and Secretary can view contact messages" ON public.contact_messages
    FOR SELECT USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'secretary')
    );

CREATE POLICY "Admin and Secretary can update contact messages" ON public.contact_messages
    FOR UPDATE USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'secretary')
    );

-- Gallery Images Policies
CREATE POLICY "Anyone can view active gallery images" ON public.gallery_images
    FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can manage gallery images" ON public.gallery_images
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Visitors Policies
CREATE POLICY "Admin and Secretary can manage visitors" ON public.visitors
    FOR ALL USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'secretary')
    );

-- Equipment Policies
CREATE POLICY "Admin can manage equipment" ON public.equipment
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view equipment" ON public.equipment
    FOR SELECT USING (true);

-- Materials Inventory Policies
CREATE POLICY "Admin can manage materials inventory" ON public.materials_inventory
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view materials" ON public.materials_inventory
    FOR SELECT USING (true);

-- Material Transactions Policies
CREATE POLICY "Admin can manage material transactions" ON public.material_transactions
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view transactions" ON public.material_transactions
    FOR SELECT USING (true);

-- WiFi Networks Policies
CREATE POLICY "Admin can manage wifi networks" ON public.wifi_networks
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view wifi networks assigned to their role" ON public.wifi_networks
    FOR SELECT USING (
        is_active = true AND (
            assigned_roles IS NULL OR
            public.get_user_role(auth.uid())::text = ANY(assigned_roles) OR
            public.has_role(auth.uid(), 'admin')
        )
    );

-- Vacancies Policies
CREATE POLICY "Anyone can view active vacancies" ON public.vacancies
    FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can manage vacancies" ON public.vacancies
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Services Policies
CREATE POLICY "Anyone can view active services" ON public.services
    FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can manage services" ON public.services
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Add triggers for updated_at
CREATE TRIGGER update_equipment_updated_at
    BEFORE UPDATE ON public.equipment
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_materials_inventory_updated_at
    BEFORE UPDATE ON public.materials_inventory
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for images bucket
CREATE POLICY "Anyone can view images" ON storage.objects
    FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Admin can upload images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete images" ON storage.objects
    FOR DELETE USING (bucket_id = 'images' AND public.has_role(auth.uid(), 'admin'));