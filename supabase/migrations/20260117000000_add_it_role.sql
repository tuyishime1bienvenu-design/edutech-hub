-- Add 'it' role to app_role enum
-- Migration: 20260117000000_add_it_role.sql

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'it') THEN
        ALTER TYPE app_role ADD VALUE 'it';
    END IF;
END$$;
