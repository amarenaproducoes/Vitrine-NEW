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
        'cashback_logs', 'leads', 'security_logs', 'active_gift_cards'
    ];
    update_tables TEXT[] := ARRAY[
        'customers', 'cashback_logs', 'unlocked_coupons', 'partner_shares', 'active_gift_cards', 'gift_cards'
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
    FOREACH t IN ARRAY update_tables LOOP
        EXECUTE 'DROP POLICY IF EXISTS "Public Update ' || t || '" ON ' || quote_ident(t);
        -- Mantendo compatibilidade com nomes legados se houver
        EXECUTE 'DROP POLICY IF EXISTS "Public Update Customer" ON ' || quote_ident(t);
        EXECUTE 'DROP POLICY IF EXISTS "Public Update Logs" ON ' || quote_ident(t);
        EXECUTE 'DROP POLICY IF EXISTS "Public Update Coupons" ON ' || quote_ident(t);
        EXECUTE 'DROP POLICY IF EXISTS "Public Update Shares" ON ' || quote_ident(t);
        
        EXECUTE 'CREATE POLICY "Public Update ' || t || '" ON ' || quote_ident(t) || ' FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)';
    END LOOP;

END $$;

-- Nota: As políticas "Admin Full Access" continuam valendo apenas para os e-mails autorizados,
-- garantindo que apenas os admins possam EDITAR os dados de configuração.
