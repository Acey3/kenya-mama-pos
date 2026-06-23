CREATE TABLE IF NOT EXISTS public.mpesa_transactions (
    checkout_request_id TEXT PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed
    mpesa_receipt_number TEXT,
    result_desc TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.mpesa_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their mpesa txns" 
ON public.mpesa_transactions FOR SELECT 
USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Users can insert their mpesa txns" 
ON public.mpesa_transactions FOR INSERT 
WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));
