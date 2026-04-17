-- Script para limpeza de colunas não utilizadas no banco de dados Supabase
-- Requisitado pelo usuário para remover campos legados

-- 1. Remover coluna order_index da tabela partners (se existir)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='partners' AND column_name='order_index') THEN
        ALTER TABLE public.partners DROP COLUMN order_index;
    END IF;
END $$;

-- 2. Remover coluna sequencia (se existir em alguma tabela mencionada)
-- O usuário mencionou "sequencia na página sequencia", vamos verificar as tabelas prováveis
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='partners' AND column_name='sequencia') THEN
        ALTER TABLE public.partners DROP COLUMN sequencia;
    END IF;
END $$;
