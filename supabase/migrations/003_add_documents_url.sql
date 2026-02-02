-- Migration: Add documents_url field to quotes table
-- Run this migration in Supabase SQL Editor after 002_add_new_fields.sql

-- Add documents_url column to quotes table
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS documents_url TEXT;
