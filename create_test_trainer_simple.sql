-- Create test user with trainer role
-- First, create the auth user
INSERT INTO auth.users (
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at
) VALUES (
    gen_random_uuid(),
    'trainer.test@edutech.com',
    now(),
    now(),
    now()
) ON CONFLICT (email) DO NOTHING;

-- Then assign trainer role
INSERT INTO public.user_roles (
    user_id,
    role
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'trainer.test@edutech.com'),
    'trainer'
) ON CONFLICT (user_id, role) DO NOTHING;

-- Then create profile
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
) ON CONFLICT (user_id) DO NOTHING;
