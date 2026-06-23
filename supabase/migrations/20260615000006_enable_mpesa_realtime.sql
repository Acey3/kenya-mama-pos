-- Enable Realtime for mpesa_transactions table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.mpesa_transactions;
  ELSE
    CREATE PUBLICATION supabase_realtime FOR TABLE public.mpesa_transactions;
  END IF;
END $$;
