-- Check if any users have trainer roles
SELECT 
    p.id,
    p.full_name,
    p.email,
    ur.role,
    pr.created_at
FROM 
    auth.users p
JOIN public.user_roles ur ON p.id = ur.user_id 
WHERE ur.role = 'trainer';

-- If no trainers exist, create a test trainer
INSERT INTO auth.users (
    id,
    email,
    created_at
) VALUES (
    gen_random_uuid(),
    'trainer.test@edutech.com',
    now()
) ON CONFLICT DO NOTHING;

-- Assign trainer role to test user
INSERT INTO public.user_roles (
    user_id,
    role
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'trainer.test@edutech.com'),
    'trainer'
) ON CONFLICT DO NOTHING;

-- Create a profile for the test trainer
INSERT INTO public.profiles (
    user_id,
    email,
    full_name,
    phone,
    avatar_url,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'trainer.test@edutech.com'),
    'trainer.test@edutech.com',
    'Test Trainer',
    '+2507880000',
    'https://ui-avatars.com/api/?name=Test+Trainer&background=random',
    now(),
    now()
) ON CONFLICT DO NOTHING;
