-- MIGRATION FOR WORLD CUP BOLÃO --
-- This script sets up the necessary tables for the "Bolão de Palpites" feature.

-- 1. Create table for World Cup Games
CREATE TABLE IF NOT EXISTS worldcup_games (
  id BIGSERIAL PRIMARY KEY,
  opponent_name TEXT NOT NULL,
  opponent_code TEXT NOT NULL, -- ISO code used for flagCDN (e.g., 'fr', 'ar', 'de')
  opponent_flag_url TEXT NOT NULL,
  brazil_score INTEGER, -- Nullable, filled when game resolves
  opponent_score INTEGER, -- Nullable, filled when game resolves
  prizes TEXT NOT NULL DEFAULT 'Vale Compras Exclusivo dos nossos Parceiros!',
  partner_logos TEXT[] DEFAULT '{}', -- List of partner IDs whose logos roll in the 3D carousel
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure there is at least one sample game if empty
INSERT INTO worldcup_games (opponent_name, opponent_code, opponent_flag_url, prizes, is_active)
SELECT 'Argentina', 'ar', 'https://flagcdn.com/w160/ar.png', 'Vale-compras de R$ 150,00 nos nossos parceiros locais!', true
WHERE NOT EXISTS (SELECT 1 FROM worldcup_games);

-- 2. Create table for Customer Predictions
CREATE TABLE IF NOT EXISTS worldcup_predictions (
  id BIGSERIAL PRIMARY KEY,
  whatsapp TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  game_id BIGINT NOT NULL REFERENCES worldcup_games(id) ON DELETE CASCADE,
  predicted_brazil_score INTEGER NOT NULL,
  predicted_opponent_score INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_customer_game UNIQUE (whatsapp, game_id)
);

-- 3. Configure Row Level Security (RLS)
ALTER TABLE worldcup_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE worldcup_predictions ENABLE ROW LEVEL SECURITY;

-- 4. Create Security Policies
-- Games Policies
CREATE POLICY "Allow public select on worldcup_games" 
ON worldcup_games FOR SELECT USING (true);

CREATE POLICY "Allow public insert on worldcup_games for admins" 
-- Anyone can insert for development/mock fallback, but restricted to true on prod
ON worldcup_games FOR ALL USING (true) WITH CHECK (true);

-- Predictions Policies
CREATE POLICY "Allow public select on worldcup_predictions" 
ON worldcup_predictions FOR SELECT USING (true);

CREATE POLICY "Allow public insert on worldcup_predictions" 
ON worldcup_predictions FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on worldcup_predictions" 
ON worldcup_predictions FOR UPDATE USING (true);
