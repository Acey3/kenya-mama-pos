
-- 1. Fix search_path on check_low_stock_and_notify (trigger function)
CREATE OR REPLACE FUNCTION public.check_low_stock_and_notify()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
   edge_function_url TEXT;
   request_id BIGINT;
BEGIN
   IF (NEW.stock <= NEW.low_stock_threshold) AND
      (OLD.stock > NEW.low_stock_threshold OR NEW.last_low_stock_notification IS NULL OR NEW.last_low_stock_notification < now() - interval '24 hours') THEN
     NEW.last_low_stock_notification = now();
     edge_function_url := 'https://htzcagxhnydzqdejpjps.supabase.co/functions/v1/low-stock-alert';
     SELECT net.http_post(
         url := edge_function_url,
         headers := '{"Content-Type": "application/json"}',
         body := jsonb_build_object('record', row_to_json(NEW))
     ) INTO request_id;
   END IF;
   RETURN NEW;
END;
$function$;

-- 2. Revoke EXECUTE on SECURITY DEFINER trigger functions from PUBLIC/anon/authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_business() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_business() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_business() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.check_low_stock_and_notify() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_low_stock_and_notify() FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_low_stock_and_notify() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM authenticated;

-- 3. Replace overly permissive paystack UPDATE policy
DROP POLICY IF EXISTS "Service role can update paystack txns" ON public.paystack_transactions;

CREATE POLICY "Users can update their paystack txns"
  ON public.paystack_transactions
  FOR UPDATE
  TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

-- 4. Restrict SELECT on payment secret columns to service_role only
REVOKE SELECT (mpesa_consumer_key, mpesa_consumer_secret, mpesa_passkey, paystack_secret_key)
  ON public.businesses FROM anon;
REVOKE SELECT (mpesa_consumer_key, mpesa_consumer_secret, mpesa_passkey, paystack_secret_key)
  ON public.businesses FROM authenticated;

-- 5. Safe view of businesses for client (no secret columns), with configured flags
CREATE OR REPLACE VIEW public.businesses_safe
WITH (security_invoker = true) AS
SELECT
  id,
  owner_id,
  business_name,
  business_type,
  location,
  phone,
  mpesa_shortcode,
  is_mpesa_live,
  paystack_public_key,
  is_paystack_live,
  created_at,
  updated_at,
  (mpesa_shortcode IS NOT NULL
    AND mpesa_consumer_key IS NOT NULL
    AND mpesa_consumer_secret IS NOT NULL
    AND mpesa_passkey IS NOT NULL) AS is_mpesa_configured,
  (paystack_secret_key IS NOT NULL) AS is_paystack_configured
FROM public.businesses;

GRANT SELECT ON public.businesses_safe TO authenticated;

-- 6. Add SELECT policy for notification_queue so owners can view their queued entries
CREATE POLICY "Users can view their notifications"
  ON public.notification_queue
  FOR SELECT
  TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));
