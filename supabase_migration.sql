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
  display_id INTEGER
);

ALTER TABLE partner_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts on partner_shares" ON partner_shares FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on partner_shares" ON partner_shares FOR SELECT USING (true);

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

CREATE TABLE IF NOT EXISTS unlocked_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  partner_name TEXT NOT NULL,
  coupon_code TEXT NOT NULL,
  coupon_description TEXT,
  whatsapp TEXT NOT NULL,
  ip_address TEXT
);

ALTER TABLE unlocked_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts on unlocked_coupons" ON unlocked_coupons FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on unlocked_coupons" ON unlocked_coupons FOR SELECT USING (true);
