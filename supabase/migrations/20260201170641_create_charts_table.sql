/*
  # Create Charts Table

  1. New Tables
    - `charts`
      - `id` (uuid, primary key)
      - `symbol` (text) - Stock/asset symbol
      - `image_url` (text) - URL to the uploaded chart image
      - `notes` (text) - Analysis notes
      - `uploaded_by` (uuid) - Foreign key to auth.users
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `charts` table
    - Authenticated users can view all charts (SELECT)
    - Only admins can upload charts (INSERT)
    - Only admins can update charts (UPDATE)
    - Only admins can delete charts (DELETE)

  3. Indexes
    - Index on `symbol` for faster lookups
    - Index on `created_at` for sorting
*/

CREATE TABLE IF NOT EXISTS charts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  image_url text NOT NULL,
  notes text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_charts_symbol ON charts(symbol);
CREATE INDEX IF NOT EXISTS idx_charts_created_at ON charts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_charts_uploaded_by ON charts(uploaded_by);

ALTER TABLE charts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all charts"
  ON charts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can upload charts"
  ON charts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update charts"
  ON charts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete charts"
  ON charts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION update_charts_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER charts_updated_at
  BEFORE UPDATE ON charts
  FOR EACH ROW
  EXECUTE FUNCTION update_charts_updated_at();
