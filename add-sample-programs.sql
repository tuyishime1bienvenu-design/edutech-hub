-- Add sample programs for testing
INSERT INTO programs (id, name, description, eligible_levels, start_date, end_date, is_active, created_at) VALUES
(gen_random_uuid(), 'Web Development Fundamentals', 'Learn HTML, CSS, and JavaScript basics', ARRAY['L3'::student_level, 'L4'::student_level], '2024-01-15', '2024-03-15', true, NOW()),
(gen_random_uuid(), 'Advanced React Development', 'Master React.js and modern web development', ARRAY['L4'::student_level, 'L5'::student_level], '2024-02-01', '2024-04-01', true, NOW()),
(gen_random_uuid(), 'Network Administration', 'Learn network setup and management', ARRAY['L4'::student_level, 'L5'::student_level], '2024-01-20', '2024-04-20', true, NOW()),
(gen_random_uuid(), 'Cybersecurity Essentials', 'Introduction to cybersecurity principles', ARRAY['L4'::student_level, 'L5'::student_level], '2024-03-01', '2024-05-01', true, NOW()),
(gen_random_uuid(), 'Mobile App Development', 'Create mobile applications with React Native', ARRAY['L4'::student_level, 'L5'::student_level], '2024-02-15', '2024-05-15', false, NOW());
