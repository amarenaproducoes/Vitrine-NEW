CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  full_name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  type TEXT NOT NULL,
  message TEXT,
  ip_address TEXT,
  contacted BOOLEAN DEFAULT false
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts on leads" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on leads" ON leads FOR SELECT USING (true);
CREATE POLICY "Allow public update on leads" ON leads FOR UPDATE USING (true);

ALTER TABLE partners ADD COLUMN coupon_description TEXT;
ALTER TABLE partners ADD COLUMN google_review_link TEXT;
ALTER TABLE partners ADD COLUMN website_url TEXT;
ALTER TABLE commercial_banner ADD COLUMN link_url TEXT;

CREATE TABLE IF NOT EXISTS partner_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  partner_name TEXT NOT NULL,
  destination TEXT NOT NULL,
  ip_address TEXT
);

ALTER TABLE partner_clicks ENABLE ROW LEVEL SECURITY;

-- Fix for destination check constraint
ALTER TABLE partner_clicks DROP CONSTRAINT IF EXISTS partner_clicks_destination_check;
ALTER TABLE partner_clicks ADD CONSTRAINT partner_clicks_destination_check CHECK (destination IN ('instagram', 'whatsapp', 'google'));

CREATE POLICY "Allow public inserts on partner_clicks" ON partner_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on partner_clicks" ON partner_clicks FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS partner_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  whatsapp_number TEXT NOT NULL,
  ip_address TEXT,
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  partner_name TEXT NOT NULL,
  display_id INTEGER,
  customer_name TEXT
);

ALTER TABLE partner_shares ADD COLUMN IF NOT EXISTS customer_name TEXT;

ALTER TABLE partner_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts on partner_shares" ON partner_shares FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on partner_shares" ON partner_shares FOR SELECT USING (true);
CREATE POLICY "Allow public update on partner_shares" ON partner_shares FOR UPDATE USING (true);

CREATE OR REPLACE FUNCTION get_partner_share_counts(period TEXT DEFAULT 'all')
RETURNS TABLE (
  partner_id UUID,
  partner_name TEXT,
  share_count BIGINT
) AS $$
BEGIN
  IF period = 'month' THEN
    RETURN QUERY
    SELECT 
      ps.partner_id,
      ps.partner_name,
      COUNT(*)::BIGINT as share_count
    FROM partner_shares ps
    WHERE ps.created_at >= date_trunc('month', now())
    GROUP BY ps.partner_id, ps.partner_name
    ORDER BY share_count DESC;
  ELSE
    RETURN QUERY
    SELECT 
      ps.partner_id,
      ps.partner_name,
      COUNT(*)::BIGINT as share_count
    FROM partner_shares ps
    GROUP BY ps.partner_id, ps.partner_name
    ORDER BY share_count DESC;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_partner_click_counts(period TEXT DEFAULT 'all')
RETURNS TABLE (
  partner_id UUID,
  partner_name TEXT,
  instagram_count BIGINT,
  whatsapp_count BIGINT,
  google_count BIGINT,
  website_count BIGINT
) AS $$
BEGIN
  IF period = 'month' THEN
    RETURN QUERY
    SELECT 
      pc.partner_id,
      pc.partner_name,
      COUNT(*) FILTER (WHERE pc.destination ILIKE 'insta%')::BIGINT as instagram_count,
      COUNT(*) FILTER (WHERE pc.destination ILIKE 'what%')::BIGINT as whatsapp_count,
      COUNT(*) FILTER (WHERE pc.destination ILIKE 'google%')::BIGINT as google_count,
      COUNT(*) FILTER (WHERE pc.destination ILIKE 'site%')::BIGINT as website_count
    FROM partner_clicks pc
    WHERE pc.created_at >= date_trunc('month', now())
    GROUP BY pc.partner_id, pc.partner_name
    ORDER BY (instagram_count + whatsapp_count + google_count + website_count) DESC;
  ELSIF period = 'prev_month' THEN
    RETURN QUERY
    SELECT 
      pc.partner_id,
      pc.partner_name,
      COUNT(*) FILTER (WHERE pc.destination ILIKE 'insta%')::BIGINT as instagram_count,
      COUNT(*) FILTER (WHERE pc.destination ILIKE 'what%')::BIGINT as whatsapp_count,
      COUNT(*) FILTER (WHERE pc.destination ILIKE 'google%')::BIGINT as google_count,
      COUNT(*) FILTER (WHERE pc.destination ILIKE 'site%')::BIGINT as website_count
    FROM partner_clicks pc
    WHERE pc.created_at >= date_trunc('month', now() - interval '1 month')
      AND pc.created_at < date_trunc('month', now())
    GROUP BY pc.partner_id, pc.partner_name
    ORDER BY (instagram_count + whatsapp_count + google_count + website_count) DESC;
  ELSE
    RETURN QUERY
    SELECT 
      pc.partner_id,
      pc.partner_name,
      COUNT(*) FILTER (WHERE pc.destination ILIKE 'insta%')::BIGINT as instagram_count,
      COUNT(*) FILTER (WHERE pc.destination ILIKE 'what%')::BIGINT as whatsapp_count,
      COUNT(*) FILTER (WHERE pc.destination ILIKE 'google%')::BIGINT as google_count,
      COUNT(*) FILTER (WHERE pc.destination ILIKE 'site%')::BIGINT as website_count
    FROM partner_clicks pc
    GROUP BY pc.partner_id, pc.partner_name
    ORDER BY (instagram_count + whatsapp_count + google_count + website_count) DESC;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS customers (
  whatsapp TEXT PRIMARY KEY,
  name TEXT,
  onesignal_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure onesignal_id exists if table was already created
ALTER TABLE customers ADD COLUMN IF NOT EXISTS onesignal_id TEXT;

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public inserts on customers" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on customers" ON customers FOR SELECT USING (true);
CREATE POLICY "Allow public update on customers" ON customers FOR UPDATE USING (true);

CREATE TABLE IF NOT EXISTS cashback_configs (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  value NUMERIC NOT NULL,
  probability NUMERIC NOT NULL,
  color TEXT NOT NULL
);

ALTER TABLE cashback_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on cashback_configs" ON cashback_configs FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS cashback_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  store_name TEXT NOT NULL,
  cashback_value NUMERIC NOT NULL,
  cashback_label TEXT,
  whatsapp TEXT NOT NULL,
  customer_name TEXT,
  ip_address TEXT
);

ALTER TABLE cashback_logs ADD COLUMN IF NOT EXISTS cashback_label TEXT;
ALTER TABLE cashback_logs ADD COLUMN IF NOT EXISTS customer_name TEXT;

ALTER TABLE cashback_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public inserts on cashback_logs" ON cashback_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on cashback_logs" ON cashback_logs FOR SELECT USING (true);
CREATE POLICY "Allow public update on cashback_logs" ON cashback_logs FOR UPDATE USING (true);

CREATE TABLE IF NOT EXISTS unlocked_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  partner_name TEXT NOT NULL,
  coupon_code TEXT NOT NULL,
  coupon_description TEXT,
  whatsapp TEXT NOT NULL,
  customer_name TEXT,
  ip_address TEXT,
  expires_at DATE
);

ALTER TABLE unlocked_coupons ADD COLUMN IF NOT EXISTS customer_name TEXT;

ALTER TABLE unlocked_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts on unlocked_coupons" ON unlocked_coupons FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on unlocked_coupons" ON unlocked_coupons FOR SELECT USING (true);
CREATE POLICY "Allow public update on unlocked_coupons" ON unlocked_coupons FOR UPDATE USING (true);

-- New tables for Personalized Welcome Messages (Old Logic)
CREATE TABLE IF NOT EXISTS welcome_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ref_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  logo_url TEXT
);

ALTER TABLE welcome_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on welcome_messages" ON welcome_messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert on welcome_messages" ON welcome_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on welcome_messages" ON welcome_messages FOR UPDATE WITH CHECK (true);
CREATE POLICY "Allow public delete on welcome_messages" ON welcome_messages FOR DELETE USING (true);

CREATE TABLE IF NOT EXISTS welcome_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  welcome_id UUID REFERENCES welcome_messages(id) ON DELETE CASCADE,
  ref_id TEXT NOT NULL,
  ip_address TEXT
);

ALTER TABLE welcome_access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on welcome_access_logs" ON welcome_access_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on welcome_access_logs" ON welcome_access_logs FOR INSERT WITH CHECK (true);

-- New tables for Surprise Coupon Campaigns (New Logic)
CREATE TABLE IF NOT EXISTS coupon_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ref_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  logo_url TEXT,
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE NOT NULL,
  custom_coupon TEXT,
  custom_description TEXT
);

ALTER TABLE coupon_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on coupon_campaigns" ON coupon_campaigns FOR SELECT USING (true);
CREATE POLICY "Allow public insert on coupon_campaigns" ON coupon_campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on coupon_campaigns" ON coupon_campaigns FOR UPDATE WITH CHECK (true);
CREATE POLICY "Allow public delete on coupon_campaigns" ON coupon_campaigns FOR DELETE USING (true);

CREATE TABLE IF NOT EXISTS coupon_campaign_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  campaign_id UUID REFERENCES coupon_campaigns(id) ON DELETE CASCADE,
  ref_id TEXT NOT NULL,
  ip_address TEXT
);

ALTER TABLE coupon_campaign_access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on coupon_campaign_access_logs" ON coupon_campaign_access_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on coupon_campaign_access_logs" ON coupon_campaign_access_logs FOR INSERT WITH CHECK (true);

-- About Us Configuration
CREATE TABLE IF NOT EXISTS about_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  history TEXT NOT NULL,
  logo_url TEXT,
  mission_vision_values TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE about_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on about_config" ON about_config FOR SELECT USING (true);
CREATE POLICY "Allow public update on about_config" ON about_config FOR UPDATE USING (true);
CREATE POLICY "Allow public insert on about_config" ON about_config FOR INSERT WITH CHECK (true);

-- Success Cases
CREATE TABLE IF NOT EXISTS success_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  company_name TEXT NOT NULL,
  description TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  store_image_url TEXT NOT NULL
);

ALTER TABLE success_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on success_cases" ON success_cases FOR SELECT USING (true);
CREATE POLICY "Allow public insert on success_cases" ON success_cases FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on success_cases" ON success_cases FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on success_cases" ON success_cases FOR DELETE USING (true);
