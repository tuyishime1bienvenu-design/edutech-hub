-- Create expenses and payroll tables for finance management
-- Migration: 20260125000000_expenses_and_payroll.sql

-- Create enum for expense categories
CREATE TYPE public.expense_category AS ENUM (
  'office_supplies',
  'utilities',
  'rent',
  'equipment',
  'software',
  'training',
  'marketing',
  'maintenance',
  'travel',
  'other'
);

-- Create enum for payment methods
CREATE TYPE public.payment_method AS ENUM ('cash', 'bank_transfer', 'check', 'credit_card', 'other');

-- Create enum for payroll status
CREATE TYPE public.payroll_status AS ENUM ('pending', 'processed', 'paid', 'cancelled');

-- Expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category expense_category NOT NULL,
  payment_method payment_method NOT NULL,
  expense_date DATE NOT NULL,
  recorded_by UUID REFERENCES auth.users(id) NOT NULL,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Payroll table
CREATE TABLE public.payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES auth.users(id) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  base_salary DECIMAL(10,2) NOT NULL,
  advances_deducted DECIMAL(10,2) DEFAULT 0,
  total_payable DECIMAL(10,2) NOT NULL,
  status payroll_status DEFAULT 'pending' NOT NULL,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (employee_id, period_start, period_end)
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

-- Policies for expenses
CREATE POLICY "Finance users can view all expenses" ON public.expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'finance')
    )
  );

CREATE POLICY "Finance users can insert expenses" ON public.expenses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'finance')
    )
  );

CREATE POLICY "Finance users can update expenses" ON public.expenses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'finance')
    )
  );

-- Policies for payroll
CREATE POLICY "Users can view their own payroll" ON public.payroll
  FOR SELECT USING (auth.uid() = employee_id);

CREATE POLICY "Finance users can view all payroll" ON public.payroll
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'finance')
    )
  );

CREATE POLICY "Finance users can manage payroll" ON public.payroll
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'finance')
    )
  );