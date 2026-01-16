-- Create a function to assign admin roles automatically for specific emails
CREATE OR REPLACE FUNCTION public.assign_admin_role_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_email TEXT;
  admin_role app_role;
BEGIN
  -- Get the email from the new user
  admin_email := NEW.email;
  
  -- Check if this is a master admin email
  IF admin_email = 'hudson@efa.gg' THEN
    admin_role := 'master';
  -- Check if this is a global admin email
  ELSIF admin_email = 'carlos@efa.gg' THEN
    admin_role := 'global_admin';
  ELSE
    -- Not an admin email, return without assigning role
    RETURN NEW;
  END IF;
  
  -- Insert the admin role for this user
  INSERT INTO public.user_roles (user_id, role, granted_at)
  VALUES (NEW.id, admin_role, now())
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users to assign admin roles on signup
-- Note: This trigger runs after the handle_new_user trigger
DROP TRIGGER IF EXISTS on_auth_user_created_assign_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_admin_role_on_signup();

-- Also create a helper function for manually assigning admin roles by email
-- This can be called by existing admins
CREATE OR REPLACE FUNCTION public.assign_role_by_email(
  target_email TEXT,
  target_role app_role,
  granter_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find the user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;
  
  IF target_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Insert or update the role
  INSERT INTO public.user_roles (user_id, role, granted_by, granted_at)
  VALUES (target_user_id, target_role, granter_id, now())
  ON CONFLICT (user_id, role) DO UPDATE
  SET granted_by = EXCLUDED.granted_by,
      granted_at = EXCLUDED.granted_at;
  
  RETURN TRUE;
END;
$$;

-- Add unique constraint on user_roles to prevent duplicate roles
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_role_unique UNIQUE (user_id, role);