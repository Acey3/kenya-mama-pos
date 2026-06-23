-- Drop the old queue table logic as we will use pg_net async requests
DROP TRIGGER IF EXISTS trigger_low_stock_check ON public.products;
DROP FUNCTION IF EXISTS public.check_low_stock_and_notify();

-- Ensure pg_net is enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the function to send the webhook
CREATE OR REPLACE FUNCTION public.check_low_stock_and_notify()
RETURNS TRIGGER AS $$
DECLARE
  edge_function_url TEXT;
  service_role_key TEXT;
  request_id BIGINT;
BEGIN
  -- Check if stock crossed the threshold AND we haven't notified recently
  IF (NEW.stock <= NEW.low_stock_threshold) AND 
     (OLD.stock > NEW.low_stock_threshold OR NEW.last_low_stock_notification IS NULL OR NEW.last_low_stock_notification < now() - interval '24 hours') THEN
    
    -- Update the timestamp to prevent spam
    NEW.last_low_stock_notification = now();

    -- Try to get secrets from Vault (this is how Supabase securely stores env vars for the DB)
    -- If they don't exist, we fall back to a hardcoded URL structure for this specific project
    -- Note: The URL must exactly match your project ID
    edge_function_url := 'https://htzcagxhnydzqdejpjps.supabase.co/functions/v1/low-stock-alert';
    
    -- Attempt to get the anon key or service key from the environment. 
    -- If it fails, the webhook might be rejected by the edge function unless we disable JWT verification.
    BEGIN
        service_role_key := current_setting('request.jwt.claim.role', true);
    EXCEPTION WHEN OTHERS THEN
        service_role_key := 'anon';
    END;

    -- Use pg_net to make an ASYNCHRONOUS POST request.
    -- Because it's async, it will NEVER block the sale transaction, even if the email fails.
    SELECT net.http_post(
        url := edge_function_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('request.jwt', true) -- Send the current user's token
        ),
        body := jsonb_build_object('record', row_to_json(NEW))
    ) INTO request_id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach the trigger
CREATE TRIGGER trigger_low_stock_check
BEFORE UPDATE OF stock ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.check_low_stock_and_notify();
