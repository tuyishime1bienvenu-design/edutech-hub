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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_gallery_items_type ON public.gallery_items(type);
CREATE INDEX IF NOT EXISTS idx_gallery_items_is_public ON public.gallery_items(is_public);
CREATE INDEX IF NOT EXISTS idx_gallery_items_created_at ON public.gallery_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_items_event_date ON public.gallery_items(event_date DESC);

-- Enable RLS
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage gallery items" ON public.gallery_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "Public can read public gallery items" ON public.gallery_items
  FOR SELECT USING (is_public = true);

CREATE POLICY "Authenticated users can read all gallery items" ON public.gallery_items
  FOR SELECT USING (auth.role() = 'authenticated');
