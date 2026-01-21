-- Debug query to check user roles
-- Run this in Supabase SQL editor to verify role assignments

SELECT 
    p.id,
    p.email,
    p.full_name,
    array_agg(ur.role) as roles,
    p.created_at
FROM 
    public.profiles p
LEFT JOIN 
    public.user_roles ur ON p.user_id = ur.user_id 
WHERE 
    p.email LIKE '%@%'  -- Show all users with email
GROUP BY 
    p.id, p.email, p.full_name
ORDER BY 
    p.created_at DESC;
