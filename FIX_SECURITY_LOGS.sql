-- Script para corrigir a tabela de logs de segurança
-- Execute este script no SQL Editor do Supabase

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

-- Habilitar RLS
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Admin Full Access" ON security_logs;
DROP POLICY IF EXISTS "Public Insert Security" ON security_logs;

-- Criar novas políticas
CREATE POLICY "Admin Full Access" ON security_logs 
FOR ALL TO authenticated 
USING (auth.jwt() ->> 'email' IN ('amarena.producoes@gmail.com', 'reo2000.renato@gmail.com'));

CREATE POLICY "Public Insert Security" ON security_logs 
FOR INSERT TO anon 
WITH CHECK (true);
