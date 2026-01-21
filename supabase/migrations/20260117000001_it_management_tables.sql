-- IT Management Tables and Policies (continued)
-- Migration: 20260117000001_it_management_tables.sql

-- Equipment table
CREATE TABLE IF NOT EXISTS public.equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  serial_number VARCHAR(255),
  model VARCHAR(255),
  category VARCHAR(100),
  status equipment_status DEFAULT 'active' NOT NULL,
  purchase_date DATE,
  purchase_cost DECIMAL(10,2),
  assigned_to UUID REFERENCES auth.users(id),
  location VARCHAR(255),
  warranty_expiry DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Materials inventory table
CREATE TABLE IF NOT EXISTS public.materials_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  type material_type NOT NULL,
  unit VARCHAR(50) DEFAULT 'pieces',
  current_quantity DECIMAL(10,2) DEFAULT 0,
  minimum_quantity DECIMAL(10,2) DEFAULT 0,
  unit_cost DECIMAL(10,2),
  supplier VARCHAR(255),
  location VARCHAR(255),
  barcode VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- WiFi networks table
CREATE TABLE IF NOT EXISTS public.wifi_networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ssid VARCHAR(255) NOT NULL,
  password VARCHAR(255),
  security_type VARCHAR(50) DEFAULT 'WPA2',
  location VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Material transactions table
CREATE TABLE IF NOT EXISTS public.material_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES public.materials_inventory(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('in', 'out')),
  quantity DECIMAL(10,2) NOT NULL,
  recipient_id UUID REFERENCES auth.users(id),
  requester_name VARCHAR(255),
  purpose TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wifi_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for equipment
DROP POLICY IF EXISTS "IT users can manage equipment" ON public.equipment;
CREATE POLICY "IT users can manage equipment" ON public.equipment
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'it')
    )
  );

-- Policies for materials inventory
DROP POLICY IF EXISTS "IT users can manage materials inventory" ON public.materials_inventory;
CREATE POLICY "IT users can manage materials inventory" ON public.materials_inventory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'it')
    )
  );

-- Policies for WiFi networks
DROP POLICY IF EXISTS "IT users can manage WiFi networks" ON public.wifi_networks;
CREATE POLICY "IT users can manage WiFi networks" ON public.wifi_networks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'it')
    )
  );

-- Policies for material transactions
DROP POLICY IF EXISTS "IT users can manage material transactions" ON public.material_transactions;
CREATE POLICY "IT users can manage material transactions" ON public.material_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'it')
    )
  );

DROP POLICY IF EXISTS "Users can view their own material transactions" ON public.material_transactions;
CREATE POLICY "Users can view their own material transactions" ON public.material_transactions
  FOR SELECT USING (auth.uid() = recipient_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_equipment_status ON public.equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_assigned_to ON public.equipment(assigned_to);
CREATE INDEX IF NOT EXISTS idx_materials_category ON public.materials_inventory(category);
CREATE INDEX IF NOT EXISTS idx_materials_active ON public.materials_inventory(is_active);
CREATE INDEX IF NOT EXISTS idx_wifi_active ON public.wifi_networks(is_active);
CREATE INDEX IF NOT EXISTS idx_transactions_material ON public.material_transactions(material_id);
CREATE INDEX IF NOT EXISTS idx_transactions_recipient ON public.material_transactions(recipient_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.material_transactions(transaction_date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_equipment_updated_at ON public.equipment;
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON public.equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_materials_updated_at ON public.materials_inventory;
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON public.materials_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wifi_updated_at ON public.wifi_networks;
CREATE TRIGGER update_wifi_updated_at BEFORE UPDATE ON public.wifi_networks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();