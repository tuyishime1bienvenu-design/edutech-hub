-- Update user_roles table to support multiple roles per user
-- Migration: 20260117000001_multiple_user_roles.sql

-- Remove the existing unique constraint if it exists
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

-- Add a new unique constraint on user_id + role to allow multiple roles per user
-- Actually, we want to allow multiple roles, so we'll keep the primary key as is
-- The current structure already allows multiple roles per user since there's no unique constraint on user_id alone

-- Update the RLS policies to work with multiple roles
-- The existing policies should work fine since they check for specific roles

-- Add a function to get all roles for a user
CREATE OR REPLACE FUNCTION get_user_roles(user_uuid UUID)
RETURNS TABLE(role app_role) AS $$
BEGIN
  RETURN QUERY
  SELECT ur.role
  FROM public.user_roles ur
  WHERE ur.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the existing has_role function to work with multiple roles
CREATE OR REPLACE FUNCTION has_role(
  _role app_role,
  _user_id UUID
)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the get_user_role function to return the primary role (first one alphabetically)
CREATE OR REPLACE FUNCTION get_user_role(_user_id UUID)
RETURNS app_role AS $$
DECLARE
  primary_role app_role;
BEGIN
  SELECT role INTO primary_role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY
    CASE
      WHEN role = 'admin' THEN 1
      WHEN role = 'it' THEN 2
      WHEN role = 'finance' THEN 3
      WHEN role = 'secretary' THEN 4
      WHEN role = 'trainer' THEN 5
      WHEN role = 'student' THEN 6
      ELSE 7
    END
  LIMIT 1;

  RETURN primary_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;