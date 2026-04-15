-- 1. Atualizar tabela commercial_banner
ALTER TABLE commercial_banner ADD COLUMN IF NOT EXISTS partner_name TEXT;

-- 2. Criar tabela de logs de cliques em banners
CREATE TABLE IF NOT EXISTS banner_clicks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    banner_id INTEGER,
    partner_name TEXT,
    link_clicked TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Configurar RLS para banner_clicks
ALTER TABLE banner_clicks ENABLE ROW LEVEL SECURITY;

-- Permite inserção pública (qualquer um que clicar registra o log)
CREATE POLICY "Public Insert Banner Clicks" ON banner_clicks 
FOR INSERT TO anon, authenticated 
WITH CHECK (true);

-- Permite leitura apenas para admins
CREATE POLICY "Admin Read Banner Clicks" ON banner_clicks 
FOR SELECT TO authenticated 
USING (auth.jwt() ->> 'email' IN ('amarena.producoes@gmail.com', 'reo2000.renato@gmail.com'));

-- 4. Garantir que a tabela active_gift_cards tenha a coluna used_at (já deve ter, mas por segurança)
-- ALTER TABLE active_gift_cards ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ;

-- 5. Atualizar permissões para as novas tabelas/colunas no script de RLS global se necessário
-- (O script FIX_RLS_PUBLIC_ACCESS.sql já lida com a maioria, mas vamos garantir aqui)
CREATE POLICY "Public Read Banners" ON commercial_banner FOR SELECT TO anon, authenticated USING (true);
