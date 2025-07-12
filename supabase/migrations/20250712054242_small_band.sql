/*
  # Fix RLS Policies to Prevent Infinite Recursion

  1. Drop existing problematic policies
  2. Create simpler, non-recursive policies
  3. Add RPC function for user count
*/

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Create simpler policies without recursion
CREATE POLICY "Public read access for users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (wallet_address = current_setting('app.current_user_wallet', true));

-- Create RPC function to get user count (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER FROM users;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_count() TO anon;
GRANT EXECUTE ON FUNCTION get_user_count() TO authenticated;