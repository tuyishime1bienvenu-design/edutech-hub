-- Create gallery storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gallery',
  'gallery',
  true,
  104857600, -- 100MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Create gallery_items table
CREATE TABLE IF NOT EXISTS public.gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size BIGINT NOT NULL,
  event_date DATE,
  event_name TEXT,
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_gallery_items_type ON public.gallery_items(type);
CREATE INDEX IF NOT EXISTS idx_gallery_items_is_public ON public.gallery_items(is_public);
CREATE INDEX IF NOT EXISTS idx_gallery_items_created_at ON public.gallery_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_items_event_date ON public.gallery_items(event_date DESC);

-- Create RLS policies
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything
DROP POLICY IF EXISTS "Admins can manage gallery items" ON public.gallery_items;
CREATE POLICY "Admins can manage gallery items" ON public.gallery_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Policy: Public can read public items
DROP POLICY IF EXISTS "Public can read public gallery items" ON public.gallery_items;
CREATE POLICY "Public can read public gallery items" ON public.gallery_items
  FOR SELECT USING (is_public = true);

-- Policy: Authenticated users can read all items (for admin dashboard)
DROP POLICY IF EXISTS "Authenticated users can read all gallery items" ON public.gallery_items;
CREATE POLICY "Authenticated users can read all gallery items" ON public.gallery_items
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create storage policies
DROP POLICY IF EXISTS "Admins can upload to gallery bucket" ON storage.objects;
CREATE POLICY "Admins can upload to gallery bucket" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'gallery' AND
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update gallery bucket objects" ON storage.objects;
CREATE POLICY "Admins can update gallery bucket objects" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'gallery' AND
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete gallery bucket objects" ON storage.objects;
CREATE POLICY "Admins can delete gallery bucket objects" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'gallery' AND
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Anyone can view gallery bucket objects" ON storage.objects;
CREATE POLICY "Anyone can view gallery bucket objects" ON storage.objects
  FOR SELECT USING (bucket_id = 'gallery');

-- Create payment_notifications table for certificate notifications
CREATE TABLE IF NOT EXISTS public.payment_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'whatsapp')),
  message TEXT NOT NULL,
  amount_due DECIMAL(10,2) NOT NULL,
  payment_code TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed'))
);

-- Create indexes for payment_notifications
CREATE INDEX IF NOT EXISTS idx_payment_notifications_student_id ON public.payment_notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_sent_at ON public.payment_notifications(sent_at DESC);

-- Enable RLS for payment_notifications
ALTER TABLE public.payment_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage payment notifications
DROP POLICY IF EXISTS "Admins can manage payment notifications" ON public.payment_notifications;
CREATE POLICY "Admins can manage payment notifications" ON public.payment_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Policy: Secretaries and finance can read payment notifications
DROP POLICY IF EXISTS "Secretaries and finance can read payment notifications" ON public.payment_notifications;
CREATE POLICY "Secretaries and finance can read payment notifications" ON public.payment_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('secretary', 'finance')
    )
  );

-- Create certificate_templates table
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('student', 'employment')),
  design_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure type column exists (for idempotency if table existed without it)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificate_templates' AND column_name = 'type') THEN
        ALTER TABLE public.certificate_templates ADD COLUMN type TEXT CHECK (type IN ('student', 'employment'));
    END IF;
END $$;

-- Create indexes for certificate_templates
CREATE INDEX IF NOT EXISTS idx_certificate_templates_type ON public.certificate_templates(type);
CREATE INDEX IF NOT EXISTS idx_certificate_templates_created_at ON public.certificate_templates(created_at DESC);

-- Enable RLS for certificate_templates
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Admins and IT can manage certificate templates
DROP POLICY IF EXISTS "Admins and IT can manage certificate templates" ON public.certificate_templates;
CREATE POLICY "Admins and IT can manage certificate templates" ON public.certificate_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'it')
    )
  );

-- Policy: Admins and IT can read certificate templates
DROP POLICY IF EXISTS "Admins and IT can read certificate templates" ON public.certificate_templates;
CREATE POLICY "Admins and IT can read certificate templates" ON public.certificate_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'it')
    )
  );
