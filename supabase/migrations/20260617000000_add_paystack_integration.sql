-- Add Paystack credential columns to businesses table
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS paystack_public_key TEXT,
ADD COLUMN IF NOT EXISTS paystack_secret_key TEXT,
ADD COLUMN IF NOT EXISTS is_paystack_live BOOLEAN DEFAULT FALSE;

-- Create Paystack transactions table
CREATE TABLE IF NOT EXISTS public.paystack_transactions (
    reference TEXT PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    email TEXT,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed
    channel TEXT, -- card, mpesa, etc.
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.paystack_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Paystack Transactions
CREATE POLICY "Users can view their paystack txns" 
ON public.paystack_transactions FOR SELECT 
USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Users can insert their paystack txns" 
ON public.paystack_transactions FOR INSERT 
WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

-- Policy for Edge Function to update transaction status (service_role usually bypasses RLS, but for clarity)
CREATE POLICY "Service role can update paystack txns"
ON public.paystack_transactions FOR UPDATE
USING (true)
WITH CHECK (true);
