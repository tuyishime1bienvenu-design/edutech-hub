-- Add internship-specific fields to students and classes tables
-- Migration: 20260124000000_internship_fields.sql

-- Add internship fields to students table
ALTER TABLE public.students
ADD COLUMN application_letter_submitted BOOLEAN DEFAULT false,
ADD COLUMN computer_owned BOOLEAN DEFAULT false,
ADD COLUMN computer_details TEXT,
ADD COLUMN logbook_received BOOLEAN DEFAULT false;

-- Add computer requirement fields to classes table
ALTER TABLE public.classes
ADD COLUMN requires_computer BOOLEAN DEFAULT false,
ADD COLUMN computer_requirement_notes TEXT;

-- Update existing logbook_submitted to logbook_received for clarity
-- (keeping the existing field but adding the new one for better tracking)