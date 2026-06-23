-- Add notification tracking to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS last_low_stock_notification TIMESTAMP WITH TIME ZONE;

-- Create a queue table for notifications so we don't block the main transaction
CREATE TABLE IF NOT EXISTS public.notification_queue (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on queue
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- Function to handle low stock notification safely
CREATE OR REPLACE FUNCTION public.check_low_stock_and_notify()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if stock is low AND we haven't notified in the last 24 hours (to avoid spam)
  IF (NEW.stock <= NEW.low_stock_threshold) AND 
     (OLD.stock > NEW.low_stock_threshold OR NEW.last_low_stock_notification IS NULL OR NEW.last_low_stock_notification < now() - interval '24 hours') THEN
    
    -- Update the notification timestamp
    NEW.last_low_stock_notification = now();

    -- Insert into a queue instead of making an HTTP call directly
    -- This prevents the sale from crashing if the email server is down
    INSERT INTO public.notification_queue (product_id, business_id)
    VALUES (NEW.id, NEW.business_id);
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on product update (sales reduce stock)
DROP TRIGGER IF EXISTS trigger_low_stock_check ON public.products;
CREATE TRIGGER trigger_low_stock_check
BEFORE UPDATE OF stock ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.check_low_stock_and_notify();
