-- Initial schema for YourTranscript
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Transcripts table: caches extracted transcripts to avoid re-fetching
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT UNIQUE NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  content JSONB NOT NULL, -- Array of {text, start, duration} segments
  text_blob TEXT, -- Full transcript as plain text for search
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by video_id
CREATE INDEX IF NOT EXISTS idx_transcripts_video_id ON transcripts(video_id);

-- Request logs table: tracks all extraction requests for usage/billing
CREATE TABLE IF NOT EXISTS request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'cached')),
  provider TEXT NOT NULL CHECK (provider IN ('cache', 'db_cache', 'youtube_api', 'scrapingbee', 'error')),
  cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
  latency_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for request_logs queries
CREATE INDEX IF NOT EXISTS idx_request_logs_user_id ON request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_request_logs_created_at ON request_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_request_logs_video_id ON request_logs(video_id);

-- User profiles table: extends auth.users with subscription info
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  stripe_customer_id TEXT,
  daily_extractions_count INTEGER NOT NULL DEFAULT 0,
  daily_extractions_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Transcripts: readable by all authenticated users (it's cached public data)
CREATE POLICY "Transcripts are readable by authenticated users"
  ON transcripts FOR SELECT
  TO authenticated
  USING (true);

-- Transcripts: only service role can insert/update (from worker)
CREATE POLICY "Service role can manage transcripts"
  ON transcripts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Request logs: users can only see their own logs
CREATE POLICY "Users can view own request logs"
  ON request_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Request logs: service role can insert (from API routes)
CREATE POLICY "Service role can insert request logs"
  ON request_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- User profiles: users can view and update their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role has full access to user_profiles
CREATE POLICY "Service role can manage user profiles"
  ON user_profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to get user's daily extraction count
CREATE OR REPLACE FUNCTION get_daily_extractions(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_reset_at TIMESTAMPTZ;
BEGIN
  SELECT daily_extractions_count, daily_extractions_reset_at
  INTO v_count, v_reset_at
  FROM user_profiles
  WHERE id = p_user_id;

  -- Reset count if it's a new day
  IF v_reset_at < DATE_TRUNC('day', NOW()) THEN
    UPDATE user_profiles
    SET daily_extractions_count = 0,
        daily_extractions_reset_at = NOW()
    WHERE id = p_user_id;
    RETURN 0;
  END IF;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment daily extraction count
CREATE OR REPLACE FUNCTION increment_daily_extractions(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_new_count INTEGER;
BEGIN
  UPDATE user_profiles
  SET daily_extractions_count =
    CASE
      WHEN daily_extractions_reset_at < DATE_TRUNC('day', NOW()) THEN 1
      ELSE daily_extractions_count + 1
    END,
    daily_extractions_reset_at =
    CASE
      WHEN daily_extractions_reset_at < DATE_TRUNC('day', NOW()) THEN NOW()
      ELSE daily_extractions_reset_at
    END,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING daily_extractions_count INTO v_new_count;

  RETURN v_new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
