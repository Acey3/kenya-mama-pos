-- Update the handle_new_user trigger function to automatically create the business record
-- if the business name is provided in the raw user metadata during signup.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  b_name TEXT;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone'
  );

  -- Get business name from metadata
  b_name := new.raw_user_meta_data ->> 'business_name';

  -- If business name was provided, create the business record immediately
  IF b_name IS NOT NULL AND b_name <> '' THEN
    INSERT INTO public.businesses (owner_id, business_name, business_type, location, phone)
    VALUES (
      new.id,
      b_name,
      new.raw_user_meta_data ->> 'business_type',
      new.raw_user_meta_data ->> 'location',
      new.raw_user_meta_data ->> 'phone'
    )
    ON CONFLICT (owner_id) 
    DO UPDATE SET 
      business_name = EXCLUDED.business_name,
      business_type = EXCLUDED.business_type,
      location = EXCLUDED.location,
      phone = EXCLUDED.phone;
  END IF;

  RETURN new;
END;
$$;
