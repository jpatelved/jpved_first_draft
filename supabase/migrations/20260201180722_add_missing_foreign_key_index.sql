/*
  # Add Missing Foreign Key Index

  1. Performance Optimization
    - Add index on `charts.uploaded_by` to support the foreign key constraint
    - This improves JOIN performance and foreign key validation speed
    - Prevents table scans when querying or deleting related user records

  2. Notes
    - Foreign keys should always have covering indexes for optimal performance
    - This index helps queries filtering or joining on uploaded_by
    - Also speeds up CASCADE operations on the referenced user_id
*/

-- Add index for the uploaded_by foreign key
CREATE INDEX IF NOT EXISTS idx_charts_uploaded_by_fkey 
ON charts(uploaded_by);
