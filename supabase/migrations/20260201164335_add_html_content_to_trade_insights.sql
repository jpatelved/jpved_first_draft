/*
  # Add HTML content support to trade insights

  1. Changes
    - Add `html_content` column to store AI-generated HTML from Make.com workflow
    - Make existing structured fields nullable (symbol, action, price, reasoning, confidence)
    - Update RLS policy to allow either structured data OR HTML content
  
  2. Notes
    - Allows flexibility to receive either:
      a) Structured JSON data (symbol, action, price, etc.)
      b) Ready-to-display HTML content from AI (Gemini/ChatGPT)
    - Both formats can coexist in the same table
*/

ALTER TABLE trade_insights 
  ALTER COLUMN symbol DROP NOT NULL,
  ALTER COLUMN action DROP NOT NULL,
  ALTER COLUMN price DROP NOT NULL,
  ALTER COLUMN reasoning DROP NOT NULL;

ALTER TABLE trade_insights 
  ADD COLUMN IF NOT EXISTS html_content text;

DROP POLICY IF EXISTS "Authenticated users can insert trade insights" ON trade_insights;

CREATE POLICY "Authenticated users can insert trade insights"
  ON trade_insights
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (html_content IS NOT NULL AND html_content != '') OR
    (symbol IS NOT NULL AND action IS NOT NULL AND price IS NOT NULL AND reasoning IS NOT NULL)
  );
