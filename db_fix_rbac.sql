-- SCRIPT DE CORREÇÃO FINAL - RBAC & ACESSO ADMIN
-- Este script resolve a restrição de cargos e garante o seu acesso via e-mail.

-- 1. Remove a trava de segurança de cargos (se ainda existir)
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Garante que o SUPER_ADMIN é um valor permitido se for ENUM
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('PASSENGER', 'DRIVER', 'FLEET_MANAGER', 'SERVICE_ADMIN', 'SUPER_ADMIN');
    END IF;
END $$;

-- 3. Atualiza ou Cria o seu perfil buscando o ID diretamente do Auth (evita erros de ID)
INSERT INTO public.profiles (id, email, first_name, role)
SELECT id, email, 'Cesário Chissano', 'SUPER_ADMIN'
FROM auth.users
WHERE email = 'jccchissano@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'SUPER_ADMIN';

-- 4. Confirmação: Mostra o seu estado atual
SELECT id, email, role FROM public.profiles WHERE email = 'jccchissano@gmail.com';
