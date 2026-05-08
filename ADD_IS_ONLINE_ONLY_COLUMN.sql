-- Adicionar coluna is_online_only à tabela partners
ALTER TABLE partners ADD COLUMN IF NOT EXISTS is_online_only BOOLEAN DEFAULT false;

-- Comentário para documentar a coluna
COMMENT ON COLUMN partners.is_online_only IS 'Indica se o parceiro atende exclusivamente online (sem endereço físico)';
