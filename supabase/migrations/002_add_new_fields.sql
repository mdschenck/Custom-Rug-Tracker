-- Migration: Add new fields for product name, CAD tracking, swatch approval, and notes table
-- Run this migration in Supabase SQL Editor after 001_initial_schema.sql

-- Add new columns to quotes table
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS product_name TEXT,
ADD COLUMN IF NOT EXISTS cad_requested BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cad_approved BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cad_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS swatch_approved BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS swatch_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS swatch_approved_by TEXT;

-- Create quote_notes table for timestamped admin notes
CREATE TABLE IF NOT EXISTS quote_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for efficient lookups by quote_id
CREATE INDEX IF NOT EXISTS idx_quote_notes_quote_id ON quote_notes(quote_id);

-- Enable Row Level Security on quote_notes
ALTER TABLE quote_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated users (admins) have full access to quote_notes
CREATE POLICY "Admins have full access to quote_notes"
  ON quote_notes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON quote_notes TO authenticated;

-- Function to handle CAD approval timestamp
CREATE OR REPLACE FUNCTION handle_cad_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- When cad_approved changes from false to true, set the timestamp
  IF NEW.cad_approved = TRUE AND (OLD.cad_approved = FALSE OR OLD.cad_approved IS NULL) THEN
    NEW.cad_approved_at := NOW();
  END IF;
  -- If cad_approved is set back to false, optionally clear the timestamp
  IF NEW.cad_approved = FALSE AND OLD.cad_approved = TRUE THEN
    NEW.cad_approved_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for CAD approval timestamp
DROP TRIGGER IF EXISTS trigger_handle_cad_approval ON quotes;
CREATE TRIGGER trigger_handle_cad_approval
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION handle_cad_approval();

-- Function to handle swatch approval (timestamp and status update)
CREATE OR REPLACE FUNCTION handle_swatch_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- When swatch_approved changes from false to true
  IF NEW.swatch_approved = TRUE AND (OLD.swatch_approved = FALSE OR OLD.swatch_approved IS NULL) THEN
    NEW.swatch_approved_at := NOW();
    NEW.status := 'Swatch Approved';
  END IF;
  -- If swatch_approved is set back to false, optionally clear the timestamp
  IF NEW.swatch_approved = FALSE AND OLD.swatch_approved = TRUE THEN
    NEW.swatch_approved_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for swatch approval
DROP TRIGGER IF EXISTS trigger_handle_swatch_approval ON quotes;
CREATE TRIGGER trigger_handle_swatch_approval
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION handle_swatch_approval();
