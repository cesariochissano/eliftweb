# Guia de Testes - eLift

Para testar o sistema completo de tempo real (Passageiro e Motorista interagindo), agora você tem botões de acesso rápido.

### 1. Acesso Rápido (Demo)
Adicionei 3 botões na tela de login para facilitar os testes:
*   👤 **Passageiro**: +258 84 000 0001 (Código: 123456)
*   🚕 **Motorista**: +258 84 000 0002 (Código: 123456)
*   🏢 **Frotista**: +258 84 000 0003 (Código: 123456)

> [!IMPORTANT]
> **Configuração Necessária no Supabase:**
> Para que estes botões funcionem, você **DEVE** cadastrar estes números no seu painel:
> 1. Vá em **Authentication** -> **Providers** -> **Phone**.
> 2. Ative **"Phone numbers for testing"**.
> 3. Adicione os 3 números acima (no formato `+258840000001`, etc) com o código `123456`.

### 2. Autenticação Social (Google)
*   **Atenção**: O erro "provider is not enabled" ocorre porque o Google Auth precisa ser ativado no seu painel do Supabase (**Authentication** -> **Providers** -> **Google**).
*   Já corrigi o erro de URL de redirecionamento.

### 3. Persistência de Login
*   O app agora lembra de você! Se você fechar e abrir ou der refresh, ele te levará direto para a tela correta (Dashboard ou Home) baseada no seu perfil.

### 4. Como Testar o Fluxo Simultâneo
1. **Janela 1 (Passageiro)**: Use o acesso rápido de Passageiro.
2. **Janela 2 (Anônima - Motorista)**: Use o acesso rápido de Motorista.
3. **Acompanhamento**: Solicite a corrida em uma tela e aceite na outra. O mapa atualizará a posição do motorista em tempo real.
