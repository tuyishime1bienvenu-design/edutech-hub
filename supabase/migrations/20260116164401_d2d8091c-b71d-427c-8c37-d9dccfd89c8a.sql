
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'secretary', 'trainer', 'finance', 'student');

-- Create enum for student levels
CREATE TYPE public.student_level AS ENUM ('L3', 'L4', 'L5');

-- Create enum for shifts
CREATE TYPE public.shift_type AS ENUM ('morning', 'afternoon');

-- Create enum for payment status
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'partial');

-- Create enum for leave request status
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected');

-- Profiles table for all users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Programs table
CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  eligible_levels student_level[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Classes table
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  level student_level NOT NULL,
  shift shift_type NOT NULL,
  max_capacity INTEGER NOT NULL DEFAULT 30,
  current_enrollment INTEGER DEFAULT 0,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Students table (additional info specific to students)
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  registration_number TEXT NOT NULL UNIQUE,
  school_name TEXT NOT NULL,
  level student_level NOT NULL,
  preferred_shift shift_type NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  whatsapp_verified BOOLEAN DEFAULT false,
  alternative_whatsapp TEXT,
  has_whatsapp BOOLEAN DEFAULT false,
  logbook_submitted BOOLEAN DEFAULT false,
  registration_fee_paid BOOLEAN DEFAULT false,
  generated_password TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Fee structures
CREATE TABLE public.fee_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  registration_fee DECIMAL(10,2) NOT NULL,
  internship_fee DECIMAL(10,2) NOT NULL,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  level student_level,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Student payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_type TEXT NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  status payment_status DEFAULT 'paid',
  recorded_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Attendance records
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIME,
  end_time TIME,
  is_present BOOLEAN DEFAULT false,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (student_id, date)
);

-- Class reports
CREATE TABLE public.class_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  topics_covered TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Learning materials
CREATE TABLE public.learning_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  material_type TEXT DEFAULT 'tutorial',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Notices/Announcements
CREATE TABLE public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  notice_type TEXT DEFAULT 'announcement',
  target_roles app_role[],
  is_holiday BOOLEAN DEFAULT false,
  holiday_date DATE,
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Leave requests (for trainers)
CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  leave_date DATE NOT NULL,
  return_date DATE NOT NULL,
  status leave_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  review_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Employee salaries
CREATE TABLE public.salaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_period TEXT NOT NULL,
  payment_date DATE,
  is_paid BOOLEAN DEFAULT false,
  paid_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Salary advance requests
CREATE TABLE public.salary_advances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  status leave_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  review_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Activity logs
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin and Secretary can view all profiles" ON public.profiles
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'secretary')
  );

CREATE POLICY "Admin can manage all profiles" ON public.profiles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Admin can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for programs
CREATE POLICY "Anyone authenticated can view programs" ON public.programs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can manage programs" ON public.programs
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for classes
CREATE POLICY "Anyone authenticated can view classes" ON public.classes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can manage classes" ON public.classes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for students
CREATE POLICY "Students can view their own record" ON public.students
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin and Secretary can view all students" ON public.students
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'secretary')
  );

CREATE POLICY "Admin and Secretary can manage students" ON public.students
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'secretary')
  );

CREATE POLICY "Trainer can view students in their class" ON public.students
  FOR SELECT USING (
    public.has_role(auth.uid(), 'trainer') AND
    class_id IN (SELECT id FROM public.classes WHERE trainer_id = auth.uid())
  );

CREATE POLICY "Finance can view students" ON public.students
  FOR SELECT USING (public.has_role(auth.uid(), 'finance'));

-- RLS Policies for fee_structures
CREATE POLICY "Anyone authenticated can view fee structures" ON public.fee_structures
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can manage fee structures" ON public.fee_structures
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for payments
CREATE POLICY "Students can view their own payments" ON public.payments
  FOR SELECT USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin and Finance can manage payments" ON public.payments
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'finance')
  );

-- RLS Policies for attendance
CREATE POLICY "Students can view their own attendance" ON public.attendance
  FOR SELECT USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

CREATE POLICY "Trainer can manage attendance for their classes" ON public.attendance
  FOR ALL USING (
    public.has_role(auth.uid(), 'trainer') AND
    class_id IN (SELECT id FROM public.classes WHERE trainer_id = auth.uid())
  );

CREATE POLICY "Admin and Secretary can view all attendance" ON public.attendance
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'secretary')
  );

-- RLS Policies for class_reports
CREATE POLICY "Trainer can manage their own reports" ON public.class_reports
  FOR ALL USING (trainer_id = auth.uid());

CREATE POLICY "Admin can view all reports" ON public.class_reports
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for learning_materials
CREATE POLICY "Anyone authenticated can view materials" ON public.learning_materials
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Trainer can manage their own materials" ON public.learning_materials
  FOR ALL USING (trainer_id = auth.uid());

CREATE POLICY "Admin can manage all materials" ON public.learning_materials
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for notices
CREATE POLICY "Anyone authenticated can view active notices" ON public.notices
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Admin can manage notices" ON public.notices
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for leave_requests
CREATE POLICY "Trainers can manage their own leave requests" ON public.leave_requests
  FOR ALL USING (trainer_id = auth.uid());

CREATE POLICY "Admin can manage all leave requests" ON public.leave_requests
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for salaries
CREATE POLICY "Employees can view their own salary" ON public.salaries
  FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "Admin and Finance can manage salaries" ON public.salaries
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'finance')
  );

-- RLS Policies for salary_advances
CREATE POLICY "Employees can manage their own advances" ON public.salary_advances
  FOR ALL USING (employee_id = auth.uid());

CREATE POLICY "Admin and Finance can manage all advances" ON public.salary_advances
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'finance')
  );

-- RLS Policies for activity_logs
CREATE POLICY "Admin can view all logs" ON public.activity_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert logs" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON public.programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_salary_advances_updated_at BEFORE UPDATE ON public.salary_advances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
