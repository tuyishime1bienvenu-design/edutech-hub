-- Create missing tables for the EduTech Hub application

-- Create gallery_items table (different from gallery_images)
CREATE TABLE IF NOT EXISTS public.gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  event_name TEXT,
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wifi_networks table
CREATE TABLE IF NOT EXISTS public.wifi_networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  assigned_roles TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create materials_inventory table
CREATE TABLE IF NOT EXISTS public.materials_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  current_quantity INTEGER DEFAULT 0,
  minimum_quantity INTEGER DEFAULT 1,
  unit TEXT DEFAULT 'pieces',
  unit_cost DECIMAL(10,2),
  location TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  assigned_date TIMESTAMP WITH TIME ZONE,
  returned BOOLEAN DEFAULT false,
  returned_date TIMESTAMP WITH TIME ZONE,
  condition TEXT DEFAULT 'good',
  value DECIMAL(10,2),
  unique_code TEXT UNIQUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create material_transactions table
CREATE TABLE IF NOT EXISTS public.material_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES public.materials_inventory(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('checkout', 'checkin', 'loss', 'damage')),
  quantity INTEGER NOT NULL DEFAULT 1,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recorded_by UUID REFERENCES auth.users(id),
  notes TEXT,
  is_returned BOOLEAN DEFAULT false,
  return_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create equipment table
CREATE TABLE IF NOT EXISTS public.equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  serial_number TEXT UNIQUE,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'broken', 'lost', 'maintenance')),
  assigned_to UUID REFERENCES auth.users(id),
  assigned_date TIMESTAMP WITH TIME ZONE,
  purchase_date DATE,
  purchase_cost DECIMAL(10,2),
  warranty_expiry DATE,
  location TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wifi_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gallery_items
DROP POLICY IF EXISTS "Anyone can view public gallery items" ON public.gallery_items;
CREATE POLICY "Anyone can view public gallery items" ON public.gallery_items
  FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Admin can manage all gallery items" ON public.gallery_items;
CREATE POLICY "Admin can manage all gallery items" ON public.gallery_items
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for wifi_networks
DROP POLICY IF EXISTS "Admin can manage wifi networks" ON public.wifi_networks;
CREATE POLICY "Admin can manage wifi networks" ON public.wifi_networks
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Trainer can view wifi networks" ON public.wifi_networks;
CREATE POLICY "Trainer can view wifi networks" ON public.wifi_networks
  FOR SELECT USING (public.has_role(auth.uid(), 'trainer'));

-- RLS Policies for materials_inventory
DROP POLICY IF EXISTS "Anyone authenticated can view materials inventory" ON public.materials_inventory;
CREATE POLICY "Anyone authenticated can view materials inventory" ON public.materials_inventory
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin can manage materials inventory" ON public.materials_inventory;
CREATE POLICY "Admin can manage materials inventory" ON public.materials_inventory
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Trainer can manage materials inventory" ON public.materials_inventory;
CREATE POLICY "Trainer can manage materials inventory" ON public.materials_inventory
  FOR ALL USING (public.has_role(auth.uid(), 'trainer'));

-- RLS Policies for material_transactions
DROP POLICY IF EXISTS "Anyone authenticated can view material transactions" ON public.material_transactions;
CREATE POLICY "Anyone authenticated can view material transactions" ON public.material_transactions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin can manage material transactions" ON public.material_transactions;
CREATE POLICY "Admin can manage material transactions" ON public.material_transactions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Trainer can manage material transactions" ON public.material_transactions;
CREATE POLICY "Trainer can manage material transactions" ON public.material_transactions
  FOR ALL USING (public.has_role(auth.uid(), 'trainer'));

-- RLS Policies for equipment
DROP POLICY IF EXISTS "Anyone authenticated can view equipment" ON public.equipment;
CREATE POLICY "Anyone authenticated can view equipment" ON public.equipment
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin can manage equipment" ON public.equipment;
CREATE POLICY "Admin can manage equipment" ON public.equipment
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Trainer can manage equipment" ON public.equipment;
CREATE POLICY "Trainer can manage equipment" ON public.equipment
  FOR ALL USING (public.has_role(auth.uid(), 'trainer'));

-- RLS Policies for job_applications
DROP POLICY IF EXISTS "Anyone can insert job applications" ON public.job_applications;
CREATE POLICY "Anyone can insert job applications" ON public.job_applications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins and Secretaries can read job applications" ON public.job_applications;
CREATE POLICY "Admins and Secretaries can read job applications" ON public.job_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'secretary')
    )
  );

DROP POLICY IF EXISTS "Admins and Secretaries can update job applications" ON public.job_applications;
CREATE POLICY "Admins and Secretaries can update job applications" ON public.job_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'secretary')
    )
  );

DROP POLICY IF EXISTS "Users can update own applications" ON public.job_applications;
CREATE POLICY "Users can update own applications" ON public.job_applications
  FOR UPDATE USING (
    applicant_id = auth.uid() AND (
      (SELECT status FROM public.job_applications WHERE id = public.job_applications.id) = 'pending'
    )
  );

DROP POLICY IF EXISTS "Admins and Secretaries can delete job applications" ON public.job_applications;
CREATE POLICY "Admins and Secretaries can delete job applications" ON public.job_applications
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'secretary')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gallery_items_type ON public.gallery_items(type);
CREATE INDEX IF NOT EXISTS idx_gallery_items_is_public ON public.gallery_items(is_public);

-- Ensure columns exist before creating indexes
DO $$
BEGIN
    -- Add missing columns to materials_inventory if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials_inventory' AND column_name = 'assigned_to') THEN
        ALTER TABLE public.materials_inventory ADD COLUMN assigned_to UUID REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials_inventory' AND column_name = 'assigned_date') THEN
        ALTER TABLE public.materials_inventory ADD COLUMN assigned_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials_inventory' AND column_name = 'returned') THEN
        ALTER TABLE public.materials_inventory ADD COLUMN returned BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials_inventory' AND column_name = 'returned_date') THEN
        ALTER TABLE public.materials_inventory ADD COLUMN returned_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials_inventory' AND column_name = 'condition') THEN
        ALTER TABLE public.materials_inventory ADD COLUMN condition TEXT DEFAULT 'good';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials_inventory' AND column_name = 'value') THEN
        ALTER TABLE public.materials_inventory ADD COLUMN value DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials_inventory' AND column_name = 'unique_code') THEN
        ALTER TABLE public.materials_inventory ADD COLUMN unique_code TEXT UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials_inventory' AND column_name = 'created_by') THEN
        ALTER TABLE public.materials_inventory ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
    
    -- Add missing columns to equipment if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = 'assigned_to') THEN
        ALTER TABLE public.equipment ADD COLUMN assigned_to UUID REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = 'assigned_date') THEN
        ALTER TABLE public.equipment ADD COLUMN assigned_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add missing columns to job_applications if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'job_id') THEN
        ALTER TABLE public.job_applications ADD COLUMN job_id UUID REFERENCES public.job_postings(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'applicant_id') THEN
        ALTER TABLE public.job_applications ADD COLUMN applicant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'first_name') THEN
        ALTER TABLE public.job_applications ADD COLUMN first_name TEXT NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'last_name') THEN
        ALTER TABLE public.job_applications ADD COLUMN last_name TEXT NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'phone') THEN
        ALTER TABLE public.job_applications ADD COLUMN phone TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'cover_letter') THEN
        ALTER TABLE public.job_applications ADD COLUMN cover_letter TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'cv_url') THEN
        ALTER TABLE public.job_applications ADD COLUMN cv_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'cover_letter_url') THEN
        ALTER TABLE public.job_applications ADD COLUMN cover_letter_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'motivation_letter_url') THEN
        ALTER TABLE public.job_applications ADD COLUMN motivation_letter_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'highest_degree') THEN
        ALTER TABLE public.job_applications ADD COLUMN highest_degree TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'experience_years') THEN
        ALTER TABLE public.job_applications ADD COLUMN experience_years INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'application_key') THEN
        ALTER TABLE public.job_applications ADD COLUMN application_key VARCHAR(32) UNIQUE NOT NULL DEFAULT gen_random_uuid();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'reviewed_at') THEN
        ALTER TABLE public.job_applications ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'reviewed_by') THEN
        ALTER TABLE public.job_applications ADD COLUMN reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'admin_notes') THEN
        ALTER TABLE public.job_applications ADD COLUMN admin_notes TEXT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_materials_inventory_category ON public.materials_inventory(category);
CREATE INDEX IF NOT EXISTS idx_materials_inventory_assigned_to ON public.materials_inventory(assigned_to);
CREATE INDEX IF NOT EXISTS idx_material_transactions_material_id ON public.material_transactions(material_id);
CREATE INDEX IF NOT EXISTS idx_material_transactions_transaction_date ON public.material_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON public.equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_assigned_to ON public.equipment(assigned_to);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON public.equipment(category);

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_gallery_items_updated_at ON public.gallery_items;
CREATE TRIGGER update_gallery_items_updated_at
  BEFORE UPDATE ON public.gallery_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_wifi_networks_updated_at ON public.wifi_networks;
CREATE TRIGGER update_wifi_networks_updated_at
  BEFORE UPDATE ON public.wifi_networks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_materials_inventory_updated_at ON public.materials_inventory;
CREATE TRIGGER update_materials_inventory_updated_at
  BEFORE UPDATE ON public.materials_inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_material_transactions_updated_at ON public.material_transactions;
CREATE TRIGGER update_material_transactions_updated_at
  BEFORE UPDATE ON public.material_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_equipment_updated_at ON public.equipment;
CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON public.equipment
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
