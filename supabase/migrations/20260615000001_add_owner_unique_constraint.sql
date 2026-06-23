-- Add a unique constraint to owner_id to ensure one user has exactly one business record
-- This is required for the 'upsert' logic to work correctly with 'onConflict'
ALTER TABLE public.businesses 
ADD CONSTRAINT businesses_owner_id_unique UNIQUE (owner_id);
