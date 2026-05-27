-- SQL de migração para adicionar a coluna de título dos cupons em destaque
ALTER TABLE about_config ADD COLUMN IF NOT EXISTS featured_coupons_title TEXT;
