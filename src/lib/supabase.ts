import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // Ensure this is set in your .env.local
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Also set this in your .env.local

export const supabase = createClient(supabaseUrl, supabaseAnonKey);