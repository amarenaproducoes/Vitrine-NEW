-- Script para permitir que usuários autenticados (não admins) vejam e usem o site normalmente
-- Isso evita que o site apareça "vazio" ou pare de funcionar caso alguém logue com um e-mail não autorizado.

DO $$ 
DECLARE 
    read_tables TEXT[] := ARRAY[
        'partners', 'categories', 'commercial_banner', 'featured_coupons', 
        'about_config', 'success_cases', 'welcome_messages', 'coupon_campaigns', 
        'cashback_configs', 'active_gift_cards', 'customers', 'gift_cards'
    ];
    insert_tables TEXT[] := ARRAY[
        'partner_access_logs', 'partner_clicks', 'partner_shares', 'unlocked_coupons', 
        'customers', 'welcome_access_logs', 'coupon_campaign_access_logs', 
        'cashback_logs', 'leads', 'security_logs'
    ];
    update_tables TEXT[] := ARRAY[
        'customers', 'cashback_logs', 'unlocked_coupons', 'partner_shares'
    ];
    t TEXT;
BEGIN
    -- 1. Atualizar políticas de LEITURA
    FOREACH t IN ARRAY read_tables LOOP
        EXECUTE 'DROP POLICY IF EXISTS "Public Read" ON ' || quote_ident(t);
        EXECUTE 'CREATE POLICY "Public Read" ON ' || quote_ident(t) || ' FOR SELECT TO anon, authenticated USING (true)';
    END LOOP;

    -- 2. Atualizar políticas de INSERÇÃO
    FOREACH t IN ARRAY insert_tables LOOP
        EXECUTE 'DROP POLICY IF EXISTS "Public Insert" ON ' || quote_ident(t);
        EXECUTE 'DROP POLICY IF EXISTS "Public Insert Security" ON ' || quote_ident(t);
        IF t = 'security_logs' THEN
            EXECUTE 'CREATE POLICY "Public Insert Security" ON security_logs FOR INSERT TO anon, authenticated WITH CHECK (true)';
        ELSE
            EXECUTE 'CREATE POLICY "Public Insert" ON ' || quote_ident(t) || ' FOR INSERT TO anon, authenticated WITH CHECK (true)';
        END IF;
    END LOOP;

    -- 3. Atualizar políticas de ATUALIZAÇÃO
    EXECUTE 'DROP POLICY IF EXISTS "Public Update Customer" ON customers';
    EXECUTE 'CREATE POLICY "Public Update Customer" ON customers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)';
    
    EXECUTE 'DROP POLICY IF EXISTS "Public Update Logs" ON cashback_logs';
    EXECUTE 'CREATE POLICY "Public Update Logs" ON cashback_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)';
    
    EXECUTE 'DROP POLICY IF EXISTS "Public Update Coupons" ON unlocked_coupons';
    EXECUTE 'CREATE POLICY "Public Update Coupons" ON unlocked_coupons FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)';
    
    EXECUTE 'DROP POLICY IF EXISTS "Public Update Shares" ON partner_shares';
    EXECUTE 'CREATE POLICY "Public Update Shares" ON partner_shares FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)';

END $$;

-- Nota: As políticas "Admin Full Access" continuam valendo apenas para os e-mails autorizados,
-- garantindo que apenas os admins possam EDITAR os dados de configuração.
