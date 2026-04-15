-- Add partner_name to commercial_banner
ALTER TABLE commercial_banner ADD COLUMN IF NOT EXISTS partner_name TEXT;

-- Create banner_clicks table for detailed logging
CREATE TABLE IF NOT EXISTS banner_clicks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    banner_id INTEGER REFERENCES commercial_banner(id) ON DELETE SET NULL,
    partner_name TEXT,
    banner_link TEXT,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ip_address TEXT
);

-- Enable RLS on banner_clicks
ALTER TABLE banner_clicks ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert clicks
CREATE POLICY "Allow anonymous to insert banner clicks" ON banner_clicks
    FOR INSERT WITH CHECK (true);

-- Allow authenticated users (admins) to read clicks
CREATE POLICY "Allow authenticated to read banner clicks" ON banner_clicks
    FOR SELECT TO authenticated USING (true);
