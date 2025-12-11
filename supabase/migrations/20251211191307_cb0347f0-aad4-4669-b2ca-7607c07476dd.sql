-- Create a trigger function to create business after user signup
CREATE OR REPLACE FUNCTION public.handle_new_business()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only insert if business_name is provided in metadata
  IF new.raw_user_meta_data ->> 'business_name' IS NOT NULL THEN
    INSERT INTO public.businesses (owner_id, business_name, business_type, location, phone)
    VALUES (
      new.id,
      new.raw_user_meta_data ->> 'business_name',
      new.raw_user_meta_data ->> 'business_type',
      new.raw_user_meta_data ->> 'location',
      new.raw_user_meta_data ->> 'phone'
    );
  END IF;
  RETURN new;
END;
$$;

-- Create trigger on auth.users to create business after signup
CREATE TRIGGER on_auth_user_created_business
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_business();