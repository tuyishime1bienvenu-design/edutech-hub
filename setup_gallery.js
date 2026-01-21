const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function setupGallery() {
  try {
    console.log('Creating gallery storage bucket...');
    
    // Create storage bucket
    const { error: bucketError } = await supabase
      .storage
      .createBucket('gallery', {
        public: true,
        fileSizeLimit: 104857600, // 100MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm']
      });
    
    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('Error creating bucket:', bucketError);
    } else {
      console.log('Gallery bucket created or already exists');
    }

    console.log('Creating gallery_items table...');
    
    // Create table using SQL
    const { error: tableError } = await supabase
      .rpc('exec_sql', {
        sql: `
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
          
          CREATE INDEX IF NOT EXISTS idx_gallery_items_type ON public.gallery_items(type);
          CREATE INDEX IF NOT EXISTS idx_gallery_items_is_public ON public.gallery_items(is_public);
          CREATE INDEX IF NOT EXISTS idx_gallery_items_created_at ON public.gallery_items(created_at DESC);
          CREATE INDEX IF NOT EXISTS idx_gallery_items_event_date ON public.gallery_items(event_date DESC);
          
          ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "Admins can manage gallery items" ON public.gallery_items
            FOR ALL USING (
              EXISTS (
                SELECT 1 FROM public.user_roles ur
                JOIN public.users u ON u.id = ur.user_id
                WHERE u.id = auth.uid() AND ur.role = 'admin'
              )
            );
          
          CREATE POLICY "Public can read public gallery items" ON public.gallery_items
            FOR SELECT USING (is_public = true);
          
          CREATE POLICY "Authenticated users can read all gallery items" ON public.gallery_items
            FOR SELECT USING (auth.role() = 'authenticated');
        `
      });
    
    if (tableError) {
      console.error('Error creating table:', tableError);
    } else {
      console.log('Gallery items table created successfully');
    }

    console.log('Gallery setup completed!');
    
  } catch (error) {
    console.error('Setup error:', error);
  }
}

setupGallery();
