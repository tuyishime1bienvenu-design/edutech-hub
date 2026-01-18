-- Create gallery_images table for image gallery management
CREATE TABLE public.gallery_images (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    category TEXT NOT NULL, -- e.g., 'training', 'events', 'graduation', 'facilities'
    tags JSONB DEFAULT '[]', -- array of tags for filtering
    is_featured BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gallery_images
CREATE POLICY "Anyone can view active gallery images" ON public.gallery_images
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage all gallery images" ON public.gallery_images
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for faster lookups
CREATE INDEX idx_gallery_images_category ON public.gallery_images(category);
CREATE INDEX idx_gallery_images_is_active ON public.gallery_images(is_active);
CREATE INDEX idx_gallery_images_is_featured ON public.gallery_images(is_featured);
CREATE INDEX idx_gallery_images_display_order ON public.gallery_images(display_order);