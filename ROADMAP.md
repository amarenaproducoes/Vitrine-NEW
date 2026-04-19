# 🚀 Roadmap de Evolução: Vitrine - Aparece aí por aqui

Este documento registra o planejamento estratégico detalhado para a **Fase 2** da plataforma, integrando mecânicas de retenção, gamificação e um modelo de negócio sustentável para publicidade local.

---

## 💎 1. A Mecânica que Vicia: Check-in da Sorte
O objetivo é transformar o acesso em um hábito diário através do compromisso e do medo de perder o progresso (Aversão à Perda).

*   **Janela de Oportunidade:** O check-in libera diariamente às **08:00** e encerra às **23:59** (Horário de Brasília).
*   **Lógica de Streak (Sequência):**
    *   Cada dia de check-in soma +1 ao contador.
    *   Se falhar 1 dia, o contador retorna a **0**.
    *   **Escudo de Proteção:** Item raro que pode ser ganho na roleta para proteger a sequência por 24h em caso de esquecimento.
*   **Segurança e Anti-fraude:**
    *   Validação tripla: 1 check-in por CPF + WhatsApp + Dispositivo.
    *   Google reCAPTCHA v3 rodando em background para bloquear bots (score < 0.7).
*   **Gatilhos de FOMO (Fear Of Missing Out):**
    *   Notificações OneSignal estratégicas:
        *   **08:05:** "Bom dia! Seu check-in de hoje já está liberado."
        *   **19:00:** "Lembrete: Seu streak de X dias vai queimar em 5h!"
        *   **23:30:** "Último aviso: 30 min para perder sua sequência e seus prêmios!"

---

## 🏆 2. Escada de Recompensas e Status
O cliente não busca apenas desconto, ele busca reconhecimento e status na comunidade local (Vila Formosa).

| Dias Seguidos | Nível | Prêmio Destravado |
| :--- | :--- | :--- |
| **3 dias** | 🥉 Bronze | 1 giro na Roleta Bronze (Prêmios R$3 a R$5) |
| **7 dias** | 🥈 Prata | 1 giro na Roleta Prata (R$10 a R$15) + Selo no Perfil |
| **15 dias** | 🥇 Ouro | Cashback fixo de 10% em QUALQUER parceiro por 24h |
| **30 dias** | 👑 Prefeito da Vila | "Conta Paga" até R$50 + Foto no Mural da Fama |
| **60 dias** | 🏆 Lenda | Check-in vira vitalício (nunca mais zera) |

---

## 💰 3. Modelo de Negócio e Monetização
Transformar a audiência recorrente em receita através de patrocínios de visibilidade garantida.

*   **Patrocínio de Check-in:** Lojistas podem "comprar" dias específicos da trilha (ex: Patrocinar o Dia 7).
    *   A logo do lojista aparece na roleta e no alerta de prêmio.
    *   Notificação push: "Roleta Prata de hoje patrocinada pela [Loja X]".
*   **Painel do Lojista (ROI):**
    *   Dashboard mostrando quantas pessoas estão "a 1 dia" de ganhar o prêmio do lojista.
    *   Métricas de conversão: "Seu patrocínio gerou X resgates e R$ Y em vendas".
*   **Drop Surpresa:** Em dias aleatórios (4, 9, 14, etc.), o check-in libera um "Baú Misterioso" com brindes físicos de parceiros, incentivando a abertura diária pela curiosidade.

---

## 🛠️ 4. Fluxo Técnico (Stack Atual)
Implementação utilizando a infraestrutura já existente (React + Supabase + OneSignal).

*   **Supabase (Backend):**
    *   Tabela `checkins`: Registra `user_id`, `checkin_date` e `streak_count`.
    *   Função RPC `rpc_checkin()`: Valida se o check-in já foi feito hoje, verifica se o último foi ontem (streak+1) ou se deve resetar.
*   **Frontend (React):**
    *   Interface inspirada em apps de alta performance (calendário visual, barras de progresso).
    *   Efeitos de celebração (confetes) e feedback imediato de prêmios.
*   **OneSignal:** Automação de 3 mensagens diárias baseadas no status do check-in do usuário.

---

## 📈 5. Gatilhos de Engajamento Social
*   **Calendário Visual:** Visualização dos quadrados preenchidos para satisfação psicológica.
*   **Streak dos Amigos:** Ranking local mostrando a sequência dos vizinhos da Vila Formosa, estimulando a competição saudável.
*   **Missões Complementares:**
    *   Compartilhar com 10 amigos para ganhar "Estrelas" ou "Escudos".
    *   Desbloquear cupons de diferentes categorias para subir de nível mais rápido.

---

## 🤖 6. Concierge Inteligente (Agente de IA & Voz)
Transformar a busca passiva em uma assistência ativa e humanizada, utilizando a integração com OpenAI/Gemini já existente no projeto.

*   **Agente de Recomendação Proativa:**
    *   **Entendimento de Intenção:** O usuário pode digitar ou falar "Preciso trocar o óleo do carro" e o agente filtra automaticamente parceiros de mecânica/serviços automotivos.
    *   **Busca em Linguagem Natural:** "Quais os novos parceiros dos últimos dias?" ou "Qual o restaurante mais bem avaliado?".
*   **Interação por Voz (Voz & Áudio):**
    *   **Comandos de Voz (STT):** O usuário "conversa" com o site através do microfone para buscar cupons e informações.
    *   **Respostas Sintetizadas (TTS):** O agente responde por áudio com voz natural, informando sobre promoções, localizações e benefícios ativos.
    *   **Modo Hands-Free:** Ideal para usuários em movimento ou para uso em totens informativos em estabelecimentos.
*   **Inteligência de Engajamento:**
    *   O agente pode sugerir cupons baseados no histórico de navegação do usuário: "Vi que você curte gastronomia, já conferiu o novo benefício do Parceiro X?".

## 🔍 7. Identificação Inteligente e Rastreamento Retroativo
O objetivo é conhecer o comportamento do cliente antes mesmo dele fornecer o número de WhatsApp, criando um perfil de inteligência de dados.

*   **LocalStorage (Memória do Navegador):**
    *   Após o primeiro acesso/identificação, o número de WhatsApp é salvo localmente para reconhecimento automático em visitas futuras.
*   **ID de Visitante Anônimo (Perfil de Sombra):**
    *   Geração de um UUID único para cada novo visitante que entra no site sem estar identificado.
    *   Registro de todos os eventos (cliques em WhatsApp de lojas, Instagram, visualizações) vinculados a este ID anônimo.
*   **Vínculo Retroativo:**
    *   No momento em que o usuário insere o WhatsApp para desbloquear um cupom, o sistema realiza o "merge" (fusão) dos dados.
    *   Todo o histórico de cliques anônimos é atribuído retroativamente ao número de WhatsApp no banco de dados, permitindo saber o que o cliente fez *antes* de se identificar.
*   **Estabilidade via OneSignal:**
    *   Uso do `onesignal_id` como chave secundária de identificação do dispositivo, garantindo rastreamento mesmo se o usuário limpar o cache, desde que as notificações estejam ativas.

---
*Documento atualizado em 19 de Abril de 2026. Este roadmap é o guia oficial para a transformação da Vitrine em uma plataforma de mídia e fidelidade premium.*
