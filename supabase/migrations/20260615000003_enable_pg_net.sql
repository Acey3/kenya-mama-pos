-- Enable the pg_net extension required for sending HTTP requests from Postgres
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Set up dummy settings so the trigger doesn't crash if environment variables are not immediately available
-- Users must set their actual Supabase URL and Service Role Key in the dashboard settings
DO $$
BEGIN
    PERFORM set_config('app.settings.supabase_url', 'https://htzcagxhnydzqdejpjps.supabase.co', false);
    PERFORM set_config('app.settings.supabase_service_role_key', 'YOUR_SERVICE_ROLE_KEY_HERE', false);
EXCEPTION
    WHEN OTHERS THEN
        -- Fallback if setting config fails for any reason
        NULL;
END $$;
