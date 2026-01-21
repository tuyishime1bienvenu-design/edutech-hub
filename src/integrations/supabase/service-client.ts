// Service role client for public access to programs
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Debug logging
console.log('Service Client - SUPABASE_URL:', SUPABASE_URL ? '***' + SUPABASE_URL.slice(-20) : 'undefined');
console.log('Service Client - SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '***' + SUPABASE_SERVICE_ROLE_KEY.slice(-10) : 'undefined');
console.log('Service Client - SUPABASE_PUBLISHABLE_KEY:', SUPABASE_PUBLISHABLE_KEY ? '***' + SUPABASE_PUBLISHABLE_KEY.slice(-10) : 'undefined');

// Create service role client for operations that need elevated permissions
// Fallback to publishable key if service key is not available
const supabaseKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_PUBLISHABLE_KEY;

// Validate required environment variables
if (!SUPABASE_URL) {
  console.error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseKey) {
  console.error('Missing Supabase keys. Please check your environment variables.');
  console.log('You need to add VITE_SUPABASE_SERVICE_ROLE_KEY to your .env file for public program access.');
}

export const supabaseService = createClient<Database>(
  SUPABASE_URL || '',
  supabaseKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
