-- Custom Rug Quote Tracker - Initial Schema
-- Run this migration in Supabase SQL Editor

-- Create quote_number_sequence table
CREATE TABLE IF NOT EXISTS quote_number_sequence (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_number INTEGER NOT NULL DEFAULT 0
);

-- Insert initial sequence row
INSERT INTO quote_number_sequence (id, last_number) VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_number TEXT NOT NULL,
  customer_company TEXT NOT NULL,
  cad_file_url TEXT,
  image_render_url TEXT,
  status TEXT NOT NULL DEFAULT 'Inquiry',
  sales_order_number TEXT,
  custom_rug_sku TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on customer_number for portal lookups
CREATE INDEX IF NOT EXISTS idx_quotes_customer_number ON quotes(customer_number);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);

-- Function to generate next quote number
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  quote_num TEXT;
BEGIN
  -- Atomically increment and get the next number
  UPDATE quote_number_sequence
  SET last_number = last_number + 1
  WHERE id = 1
  RETURNING last_number INTO next_num;

  -- Format as CRQ000001
  quote_num := 'CRQ' || LPAD(next_num::TEXT, 6, '0');

  RETURN quote_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate quote_number on insert
CREATE OR REPLACE FUNCTION set_quote_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quote_number IS NULL OR NEW.quote_number = '' THEN
    NEW.quote_number := generate_quote_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_quote_number ON quotes;
CREATE TRIGGER trigger_set_quote_number
  BEFORE INSERT ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION set_quote_number();

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_updated_at ON quotes;
CREATE TRIGGER trigger_update_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated users (admins) have full access
CREATE POLICY "Admins have full access to quotes"
  ON quotes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policy: Anonymous users can read quotes (for customer portal)
CREATE POLICY "Anonymous users can read quotes"
  ON quotes
  FOR SELECT
  TO anon
  USING (true);

-- Grant permissions
GRANT SELECT ON quotes TO anon;
GRANT ALL ON quotes TO authenticated;
GRANT SELECT, UPDATE ON quote_number_sequence TO authenticated;
