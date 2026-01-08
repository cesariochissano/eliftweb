# Guia de Configuração de Produção: eLift

Este guia detalha os passos necessários para configurar os serviços externos (Google e Supabase) para funcionarem corretamente com o seu domínio oficial e garantir a segurança das chaves.

## 1. Google Cloud Console (Geolocalização)

A Google Maps/Places API precisa de estar protegida para evitar que terceiros utilizem a sua quota (e o seu dinheiro).

### A. Restrição por Domínio (HTTP Referrers)
1. Aceda a [Google Cloud Console > API & Services > Credentials](https://console.cloud.google.com/apis/credentials).
2. Clique na sua API Key.
3. Em **Set an application restriction**, selecione **Websites**.
4. Adicione os seguintes domínios:
   - `http://localhost:*/*` (Para desenvolvimento local)
   - `https://elift.app/*` (O seu domínio oficial)
   - `https://*.elift.app/*` (Se usar subdomínios)

### B. Restrição de API (API Restriction)
Para segurança extra, restrinja a chave para usar apenas estes serviços:
1. Em **API restrictions**, selecione **Restrict key**.
2. No menu, ative apenas:
   - `Maps JavaScript API`
   - `Places API`
   - `Geocoding API`
   - `Distance Matrix API`

## 2. Supabase Dashboard (Autenticação)

Para que o login e os redirecionamentos funcionem no novo domínio:

1. Aceda a [Supabase Dashboard > Authentication > URL Configuration](https://supabase.com/dashboard/project/_/auth/url-configuration).
2. **Site URL**: Altere para `https://elift.app`.
3. **Redirect URLs**: Adicione `https://elift.app/**` (para capturar todos os fluxos de callback).

## 3. Variáveis de Ambiente

Não se esqueça de atualizar o ficheiro `.env.production` na raiz do projeto com a sua chave Google oficial em `VITE_GOOGLE_MAPS_API_KEY`.

---
> [!IMPORTANT]
> Sem estas configurações, a pesquisa de endereços poderá falhar com erros de "AuthError" (da Google) ou o login poderá falhar ao tentar redirecionar para o localhost.
