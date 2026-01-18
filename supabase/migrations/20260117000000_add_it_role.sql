-- Add 'it' role to app_role enum
-- Migration: 20260117000000_add_it_role.sql

ALTER TYPE public.app_role ADD VALUE 'it';