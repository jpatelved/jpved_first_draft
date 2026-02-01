/*
  # Fix Security Issues and Remove Unused Indexes

  ## Changes Made

  1. **Remove Unused Indexes**
     - Drop `idx_charts_symbol` - not being used by queries
     - Drop `idx_charts_created_at` - not being used by queries  
     - Drop `idx_charts_uploaded_by` - not being used by queries

  2. **Fix Multiple Permissive Policies on user_profiles**
     - Consolidate SELECT policies into single policy that handles both users and admins
     - Consolidate UPDATE policies into single policy that handles both users and admins
     - This prevents security issues from OR logic of multiple permissive policies

  ## Security Notes
  
  - Single policies are more maintainable and prevent unintended access
  - Policies use explicit conditions for both user and admin access
  - Admin checks verify role through EXISTS subquery
  - User checks verify ownership through auth.uid() comparison

  ## Performance Notes
  
  - Removed indexes that aren't being utilized by current queries
  - Can add back specific indexes later if query patterns change
  - Consolidated policies reduce policy evaluation overhead
*/

-- Remove unused indexes on charts table
DROP INDEX IF EXISTS idx_charts_symbol;
DROP INDEX IF EXISTS idx_charts_created_at;
DROP INDEX IF EXISTS idx_charts_uploaded_by;

-- Fix multiple permissive policies on user_profiles for SELECT
-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;

-- Create single consolidated SELECT policy
CREATE POLICY "Users can read own profile, admins can read all"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    -- Users can read their own profile
    (select auth.uid()) = id
    OR
    -- Admins can read all profiles
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = (select auth.uid())
      AND up.role = 'admin'
    )
  );

-- Fix multiple permissive policies on user_profiles for UPDATE
-- Drop existing policies
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON user_profiles;

-- Create single consolidated UPDATE policy
CREATE POLICY "Users can update own profile, admins can update all"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    -- Users can update their own profile
    (select auth.uid()) = id
    OR
    -- Admins can update any profile
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = (select auth.uid())
      AND up.role = 'admin'
    )
  )
  WITH CHECK (
    -- Users updating their own profile cannot change their role
    (
      (select auth.uid()) = id 
      AND role = (SELECT role FROM user_profiles WHERE id = (select auth.uid()))
    )
    OR
    -- Admins can update any profile including roles
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = (select auth.uid())
      AND up.role = 'admin'
    )
  );
