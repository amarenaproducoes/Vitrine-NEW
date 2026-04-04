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
  whatsapp_count BIGINT
) AS $$
BEGIN
  IF period = 'month' THEN
    RETURN QUERY
    SELECT 
      pc.partner_id,
      pc.partner_name,
      COUNT(*) FILTER (WHERE pc.destination ILIKE 'insta%')::BIGINT as instagram_count,
      COUNT(*) FILTER (WHERE pc.destination ILIKE 'what%')::BIGINT as whatsapp_count
    FROM partner_clicks pc
    WHERE pc.created_at >= date_trunc('month', now())
    GROUP BY pc.partner_id, pc.partner_name
    ORDER BY (instagram_count + whatsapp_count) DESC;
  ELSE
    RETURN QUERY
    SELECT 
      pc.partner_id,
      pc.partner_name,
      COUNT(*) FILTER (WHERE pc.destination ILIKE 'insta%')::BIGINT as instagram_count,
      COUNT(*) FILTER (WHERE pc.destination ILIKE 'what%')::BIGINT as whatsapp_count
    FROM partner_clicks pc
    GROUP BY pc.partner_id, pc.partner_name
    ORDER BY (instagram_count + whatsapp_count) DESC;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS customers (
  whatsapp TEXT PRIMARY KEY,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
  ip_address TEXT
);

ALTER TABLE unlocked_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts on unlocked_coupons" ON unlocked_coupons FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on unlocked_coupons" ON unlocked_coupons FOR SELECT USING (true);
CREATE POLICY "Allow public update on unlocked_coupons" ON unlocked_coupons FOR UPDATE USING (true);
