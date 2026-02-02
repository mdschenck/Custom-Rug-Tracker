-- Migration: Add activity_logs table for tracking admin and customer actions
-- Run this migration in Supabase SQL Editor after 003_add_documents_url.sql

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  quote_number TEXT,
  performed_by TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_quote_id ON activity_logs(quote_id);

-- Enable Row Level Security
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated users (admins) can read all logs
CREATE POLICY "Admins can read activity_logs"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Authenticated users (admins) can insert logs
CREATE POLICY "Admins can insert activity_logs"
  ON activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow anonymous inserts for customer approvals
CREATE POLICY "Anonymous can insert activity_logs"
  ON activity_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT ON activity_logs TO authenticated;
GRANT INSERT ON activity_logs TO anon;
