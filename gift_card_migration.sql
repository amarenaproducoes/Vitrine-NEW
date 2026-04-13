-- Gift Cards Master Table
CREATE TABLE IF NOT EXISTS gift_cards (
  card_number TEXT PRIMARY KEY,
  value NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was already created
ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS value NUMERIC DEFAULT 0;
ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- Populate gift cards from 001 to 999
DO $$
BEGIN
    FOR i IN 1..999 LOOP
        INSERT INTO gift_cards (card_number) 
        VALUES (LPAD(i::text, 3, '0'))
        ON CONFLICT (card_number) DO NOTHING;
    END LOOP;
END $$;

-- Active Gift Cards Table
CREATE TABLE IF NOT EXISTS active_gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_number TEXT REFERENCES gift_cards(card_number) ON DELETE CASCADE,
  whatsapp TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ
);

-- Update partners table
ALTER TABLE partners ADD COLUMN IF NOT EXISTS gift_card_enabled BOOLEAN DEFAULT false;

-- RLS for new tables
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on gift_cards" ON gift_cards FOR SELECT USING (true);
CREATE POLICY "Allow public update on gift_cards" ON gift_cards FOR UPDATE USING (true);

ALTER TABLE active_gift_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on active_gift_cards" ON active_gift_cards FOR SELECT USING (true);
CREATE POLICY "Allow public insert on active_gift_cards" ON active_gift_cards FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on active_gift_cards" ON active_gift_cards FOR UPDATE USING (true);
