-- Insert sample programs for testing
INSERT INTO public.programs (name, description, start_date, end_date, eligible_levels, is_active) VALUES
('Web Development Fundamentals', 'Learn the basics of HTML, CSS, and JavaScript to build modern websites', '2026-02-01', '2026-05-01', ARRAY['L3', 'L4']::student_level[], true),
('Advanced React Development', 'Master React.js with TypeScript, hooks, and modern development practices', '2026-03-01', '2026-06-01', ARRAY['L4', 'L5']::student_level[], true),
('Data Science with Python', 'Introduction to data analysis, visualization, and machine learning with Python', '2026-04-01', '2026-07-01', ARRAY['L4', 'L5']::student_level[], true),
('Mobile App Development', 'Build native mobile applications for iOS and Android using React Native', '2026-05-01', '2026-08-01', ARRAY['L3', 'L4', 'L5']::student_level[], true);