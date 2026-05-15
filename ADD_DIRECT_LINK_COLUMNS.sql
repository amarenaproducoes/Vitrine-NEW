
-- Add new columns to partners table for direct utilization feature
ALTER TABLE partners 
ADD COLUMN IF NOT EXISTS direct_link TEXT,
ADD COLUMN IF NOT EXISTS use_google_maps_as_direct BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS direct_link_clicks INTEGER DEFAULT 0;

-- Create function to increment direct link clicks atomically
CREATE OR REPLACE FUNCTION increment_direct_link_clicks(partner_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE partners
  SET direct_link_clicks = COALESCE(direct_link_clicks, 0) + 1
  WHERE id = partner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expose the function to the API (PostgREST)
-- Assuming the function needs to be accessible by the public/anon role
GRANT EXECUTE ON FUNCTION increment_direct_link_clicks(UUID) TO anon;
GRANT EXECUTE ON FUNCTION increment_direct_link_clicks(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_direct_link_clicks(UUID) TO service_role;
