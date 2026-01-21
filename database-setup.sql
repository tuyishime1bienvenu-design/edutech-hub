-- IT Database Schema Setup Commands
-- Run these commands in Supabase SQL Editor

-- 1. Create missing columns and fix foreign keys for materials_inventory
ALTER TABLE materials_inventory 
ADD COLUMN IF NOT EXISTS material_code VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS supplier VARCHAR(100),
ADD COLUMN IF NOT EXISTS purchase_date DATE,
ADD COLUMN IF NOT EXISTS warranty_expiry DATE,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- 2. Create material_transactions table if not exists
CREATE TABLE IF NOT EXISTS material_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID REFERENCES materials_inventory(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('issue', 'return', 'transfer')),
    quantity INTEGER NOT NULL,
    recipient_name VARCHAR(100) NOT NULL,
    recipient_role VARCHAR(50),
    purpose TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create wifi_networks table if not exists
CREATE TABLE IF NOT EXISTS wifi_networks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    network_name VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    assigned_roles TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create equipment table if not exists
CREATE TABLE IF NOT EXISTS equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_name VARCHAR(100) NOT NULL,
    equipment_type VARCHAR(50),
    serial_number VARCHAR(100) UNIQUE,
    model VARCHAR(100),
    manufacturer VARCHAR(100),
    purchase_date DATE,
    warranty_expiry DATE,
    status VARCHAR(20) DEFAULT 'active',
    assigned_to VARCHAR(100),
    location VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create salary_advances table if not exists
CREATE TABLE IF NOT EXISTS salary_advances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    review_comment TEXT,
    forwarded_to_admin BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create vacancies table
CREATE TABLE IF NOT EXISTS vacancies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    responsibilities TEXT,
    department VARCHAR(100),
    position_type VARCHAR(50) CHECK (position_type IN ('full-time', 'part-time', 'contract', 'internship')),
    salary_range VARCHAR(100),
    location VARCHAR(100),
    application_deadline DATE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create job_applications table
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vacancy_id UUID REFERENCES vacancies(id) ON DELETE CASCADE,
    applicant_name VARCHAR(100) NOT NULL,
    applicant_email VARCHAR(100) NOT NULL,
    applicant_phone VARCHAR(20),
    applicant_address TEXT,
    resume_url TEXT,
    cover_letter TEXT,
    application_status VARCHAR(20) DEFAULT 'pending',
    application_token VARCHAR(255) UNIQUE, -- For direct application links
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Enable RLS (Row Level Security)
ALTER TABLE materials_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wifi_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS Policies

-- Materials Inventory Policies
CREATE POLICY "IT users can view all materials" ON materials_inventory
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'it'
        )
    );

CREATE POLICY "IT users can manage materials" ON materials_inventory
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'it'
        )
    );

-- Material Transactions Policies
CREATE POLICY "IT users can view all transactions" ON material_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'it'
        )
    );

CREATE POLICY "IT users can manage transactions" ON material_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'it'
        )
    );

-- WiFi Networks Policies
CREATE POLICY "IT users can view all wifi networks" ON wifi_networks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'it'
        )
    );

CREATE POLICY "IT users can manage wifi networks" ON wifi_networks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'it'
        )
    );

-- Equipment Policies
CREATE POLICY "IT users can view all equipment" ON equipment
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'it'
        )
    );

CREATE POLICY "IT users can manage equipment" ON equipment
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'it'
        )
    );

-- Salary Advances Policies
CREATE POLICY "Users can view own salary advances" ON salary_advances
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own salary advances" ON salary_advances
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Finance and Admin can view all salary advances" ON salary_advances
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' IN ('finance', 'admin')
        )
    );

CREATE POLICY "Finance and Admin can manage salary advances" ON salary_advances
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' IN ('finance', 'admin')
        )
    );

-- Vacancies Policies (Public Access)
CREATE POLICY "Everyone can view active vacancies" ON vacancies
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admin users can manage vacancies" ON vacancies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Job Applications Policies
CREATE POLICY "Users can manage own applications" ON job_applications
    FOR ALL USING (applicant_email = (
        SELECT raw_user_meta_data->>'email' FROM auth.users WHERE id = auth.uid()
    ));

CREATE POLICY "Admin users can view all applications" ON job_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 10. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_material_transactions_date ON material_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_material_transactions_type ON material_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_materials_inventory_code ON materials_inventory(material_code);
CREATE INDEX IF NOT EXISTS idx_wifi_networks_active ON wifi_networks(is_active);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_salary_advances_status ON salary_advances(status);
CREATE INDEX IF NOT EXISTS idx_vacancies_active ON vacancies(is_active);
CREATE INDEX IF NOT EXISTS idx_job_applications_token ON job_applications(application_token);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(application_status);

-- 11. Create Functions for Application Tokens
CREATE OR REPLACE FUNCTION generate_application_token()
RETURNS TEXT AS $$
BEGIN
    RETURN 'app_' || encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create Trigger for Application Token
CREATE OR REPLACE FUNCTION set_application_token()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.application_token IS NULL THEN
        NEW.application_token := generate_application_token();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_application_token_trigger
    BEFORE INSERT ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION set_application_token();

-- 13. Grant Permissions
GRANT ALL ON materials_inventory TO authenticated;
GRANT ALL ON material_transactions TO authenticated;
GRANT ALL ON wifi_networks TO authenticated;
GRANT ALL ON equipment TO authenticated;
GRANT SELECT, INSERT, UPDATE ON salary_advances TO authenticated;
GRANT SELECT ON vacancies TO anon, authenticated;
GRANT ALL ON job_applications TO authenticated;

-- 14. Sample Data (Optional - for testing)
INSERT INTO vacancies (title, description, requirements, responsibilities, department, position_type, salary_range, location, application_deadline, created_by) VALUES
('Software Developer', 'We are looking for a talented software developer...', '3+ years experience in React, Node.js', 'Develop web applications', 'IT', 'full-time', '$50,000 - $70,000', 'Kigali', '2024-12-31', (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin' LIMIT 1)),
('IT Support Specialist', 'Looking for IT support specialist...', '1+ years experience in IT support', 'Provide technical support', 'IT', 'full-time', '$30,000 - $45,000', 'Kigali', '2024-12-15', (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin' LIMIT 1));
