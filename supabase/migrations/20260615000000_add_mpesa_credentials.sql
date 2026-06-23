-- Add M-Pesa credential columns to businesses table
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS mpesa_shortcode TEXT,
ADD COLUMN IF NOT EXISTS mpesa_consumer_key TEXT,
ADD COLUMN IF NOT EXISTS mpesa_consumer_secret TEXT,
ADD COLUMN IF NOT EXISTS mpesa_passkey TEXT,
ADD COLUMN IF NOT EXISTS is_mpesa_live BOOLEAN DEFAULT FALSE;

-- Ensure RLS policies cover these new columns (they should by default as they are part of the table)
-- But let's verify if we need to update any specific column-level permissions (usually not in Supabase unless explicitly restricted)
