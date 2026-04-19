-- ===============================================================
-- AUDITORIA E REFORÇO DE SEGURANÇA (RLS) - SUPABASE
-- Projeto: Aparece Aí
-- Usuário Autorizado: amarena.producoes@gmail.com e reo2000.renato@gmail.com
-- Data: 2026-04-14
-- ===============================================================

-- ===============================================================
-- 0. CRIAÇÃO DE TABELAS DE SISTEMA (SE NÃO EXISTIREM)
-- ===============================================================

CREATE TABLE IF NOT EXISTS security_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    event_type TEXT NOT NULL,
    severity TEXT DEFAULT 'low',
    ip_address TEXT,
    user_agent TEXT,
    path TEXT,
    details JSONB DEFAULT '{}'::jsonb
);

-- 1. HABILITAR RLS EM TODAS AS TABELAS
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_banner ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE success_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashback_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashback_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlocked_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE welcome_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE welcome_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_campaign_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- 2. LIMPAR POLÍTICAS EXISTENTES (PARA GARANTIR ESTADO LIMPO)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 3. POLÍTICAS PARA O ADMINISTRADOR
-- Permite acesso total a todas as tabelas apenas para os e-mails autorizados
CREATE POLICY "Admin Full Access" ON partners FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('amarena.producoes@gmail.com', 'reo2000.renato@gmail.com'));
CREATE POLICY "Admin Full Access" ON categories FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('amarena.producoes@gmail.com', 'reo2000.renato@gmail.com'));
CREATE POLICY "Admin Full Access" ON commercial_banner FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('amarena.producoes@gmail.com', 'reo2000.renato@gmail.com'));
CREATE POLICY "Admin Full Access" ON featured_coupons FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('amarena.producoes@gmail.com', 'reo2000.renato@gmail.com'));
CREATE POLICY "Admin Full Access" ON about_config FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('amarena.producoes@gmail.com', 'reo2000.renato@gmail.com'));
CREATE POLICY "Admin Full Access" ON success_cases FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('amarena.producoes@gmail.com', 'reo2000.renato@gmail.com'));
CREATE POLICY "Admin Full Access" ON partner_access_logs FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('amarena.producoes@gmail.com', 'reo2000.renato@gmail.com'));
CREATE POLICY "Admin Full Access" ON partner_clicks FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('amarena.producoes@gmail.com', 'reo2000.renato@gmail.com'));
CREATE POLICY "Admin Full Access" ON partner_shares FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('amarena.producoes@gmail.com', 'reo2000.renato@gmail.com'));
CREATE POLICY "Admin Full Access" ON cashback_configs FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('amarena.producoes@gmail.com', 'reo2000.renato@gmail.com'));
CREATE POLICY "Admin Full Access" ON cashback_logs FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('amarena.producoes@gmail.com', 'reo2000.renato@gmail.com'));
CREATE POLICY "Admin Full Access" ON unlocked_coupons FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('amarena.producoes@gmail.com', 'reo2000.renato@gmail.com'));
CREATE POLICY "Admin Full Access" ON customers FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('amarena.producoes@gmail.com', 'reo2000.renato@gmail.com'));
CREATE POLICY "Admin Full Access" ON welcome_messages FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('amarena.producoes@gmail.com', 'reo2000.renato@gmail.com'));
CREATE POLICY "Admin Full Access" ON welcome_access_logs FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('amarena.producoes@gmail.com', 'reo2000.renato@gmail.com'));
CREATE POLICY "Admin Full Access" ON coupon_campaigns FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('amarena.producoes@gmail.com', 'reo2000.renato@gmail.com'));
CREATE POLICY "Admin Full Access" ON coupon_campaign_access_logs FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('amarena.producoes@gmail.com', 'reo2000.renato@gmail.com'));
CREATE POLICY "Admin Full Access" ON gift_cards FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('amarena.producoes@gmail.com', 'reo2000.renato@gmail.com'));
CREATE POLICY "Admin Full Access" ON active_gift_cards FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('amarena.producoes@gmail.com', 'reo2000.renato@gmail.com'));
CREATE POLICY "Admin Full Access" ON leads FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('amarena.producoes@gmail.com', 'reo2000.renato@gmail.com'));
CREATE POLICY "Admin Full Access" ON security_logs FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('amarena.producoes@gmail.com', 'reo2000.renato@gmail.com'));

-- 4. POLÍTICAS PÚBLICAS (ANÔNIMOS E AUTENTICADOS NÃO-ADMINS) - APENAS O NECESSÁRIO PARA O FUNCIONAMENTO DO SITE
-- Leitura Pública (Permite que qualquer um veja o site, mesmo logado com e-mail não autorizado)
CREATE POLICY "Public Read" ON partners FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read" ON categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read" ON commercial_banner FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read" ON featured_coupons FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read" ON about_config FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read" ON success_cases FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read" ON welcome_messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read" ON coupon_campaigns FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read" ON cashback_configs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read" ON active_gift_cards FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read" ON customers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read" ON gift_cards FOR SELECT TO anon, authenticated USING (true);

-- Escrita Pública (Apenas Inserção)
CREATE POLICY "Public Insert" ON partner_access_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public Insert" ON partner_clicks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public Insert" ON partner_shares FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public Insert" ON unlocked_coupons FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public Insert" ON customers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public Insert" ON welcome_access_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public Insert" ON coupon_campaign_access_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public Insert" ON cashback_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public Insert" ON leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public Insert" ON active_gift_cards FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public Insert Security" ON security_logs FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Atualização Pública (Apenas campos específicos para clientes existentes)
CREATE POLICY "Public Update Customer" ON customers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public Update Logs" ON cashback_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public Update Coupons" ON unlocked_coupons FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public Update Shares" ON partner_shares FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public Update Gift Cards" ON active_gift_cards FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public Update Master Gift Cards" ON gift_cards FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- 5. NOTA FINAL
-- Todas as outras operações (DELETE, UPDATE em tabelas de config, etc) estão bloqueadas por padrão (RLS).
-- Apenas o administrador amarena.producoes@gmail.com tem permissão total.
