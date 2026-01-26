-- Allow public read access to user_coins for leaderboard
-- This enables the leaderboard widget to show top users without requiring authentication

-- Drop existing policy if any
DROP POLICY IF EXISTS "Allow public read for leaderboard" ON user_coins;

-- Create policy to allow anyone to read user_coins (for leaderboard)
CREATE POLICY "Allow public read for leaderboard"
ON user_coins
FOR SELECT
TO public
USING (true);

-- Also ensure users table can be read for names/avatars
DROP POLICY IF EXISTS "Allow public read users for leaderboard" ON users;

CREATE POLICY "Allow public read users for leaderboard"
ON users
FOR SELECT
TO public
USING (true);
