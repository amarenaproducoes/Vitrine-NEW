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
    *   **Personificação (Branding):** O cão-guia (ex: **Finni**) pode atuar como o "faro" da IA, sendo o atendente visual que "fareja" e traz as melhores oportunidades em tempo real.

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

## 📊 8. Inteligência de Tráfego e Conversão (Google Ads/Analytics)
Preparar a plataforma para escala via tráfego pago, garantindo que os algoritmos do Google aprendam quem são os usuários mais valiosos.

*   **Configuração de Eventos de Conversão:**
    *   **WhatsApp Personalizado:** Disparar evento para o Google Ads toda vez que um usuário clicar no botão de WhatsApp de um parceiro.
    *   **Resgate de Cupons:** Rastrear o momento exato em que um cupom é desbloqueado.
    *   **Ativação de Gift Cards:** Marcar como conversão de alto valor a ativação bem-sucedida de um cartão presente.
*   **Otimização de ROI:**
    *   Vincular GA4 ao Google Ads para permitir o uso de "Lances Inteligentes" (Smart Bidding), focando o orçamento em usuários com perfil de conversão.
    *   Criação de públicos de "Remarketing" para re-impactar quem viu um parceiro mas não resgatou o cupom.
*   **Dashboards de Performance:** Relatórios que mostram não apenas as visualizações, mas a "taxa de intenção real" (cliques em botões de ação vs. visitas).

---

## 🎭 9. Campanha de Lançamento do Mascote
Transformar a escolha da identidade visual em um grande evento de engajamento comunitário na Vila Formosa.

*   **Concurso "Batize nosso Mascote & seu Fiel Escudeiro":**
    *   **Engajamento de Usuários:** Enquete interativa no site para escolha dos nomes oficiais:
        *   **Candidatos ao Mascote Principal:** Cido, Gui, Ipo, Pin, Vito.
        *   **Sugestões para o Cão-Guia:**
            *   **Finni:** (De Infinito) - O nome favorito para atuar como o atendente virtual da IA. Reforça a marca e as vantagens sem fim.
            *   **Achei:** (O farejador de ofertas) - O par perfeito para o **Cido**. *"Apareceu, Achei!"*
            *   **Bônus:** (O presente extra) - Gatilho mental positivo de ganho e recompensa.
            *   **Pino:** (O marcador) - Referência ao visual e fácil identificação local.
            *   **Faroti:** (Faro + Tech) - O cão especializado em buscas avançadas na região.
    *   **Premiação (Gamificação):** Usuários que participarem da votação ganham um "Giro Extra" na roleta ou concorrem a Vale-Compras (Gift Cards) de parceiros específicos.
*   **Ação "Lojista Padrinho":**
    *   **Interação com Parceiros:** Um parceiro lojista pode "sediar" o lançamento do nome do mascote, oferecendo um prêmio maior em troca de visibilidade exclusiva na semana da campanha.
*   **Mecânicas de Vírus Social:**
    *   "Compartilhe seu voto e ganhe chances em dobro": Incentivo para que o site circule em grupos de WhatsApp locais através da indicação orgânica.

---

## 📱 10. Experiência de App Nativo (Bottom Navigation)
Implementação de uma barra de navegação fixa no rodapé para dispositivos móveis, consolidando a sensação de aplicativo (PWA) e facilitando o acesso rápido às funções principais.

*   **Design Ergonômico:** Botões posicionados na "zona de alcance do polegar" para navegação confortável com uma mão.
*   **Ações Rápidas:**
    *   🏠 **Início:** Retorno imediato ao topo da vitrine.
    *   📂 **Categorias:** Acesso direto à filtragem por nichos.
    *   🎟️ **Meus Cupons:** Atalho para visualizar benefícios já resgatados.
    *   🎁 **Prêmios:** Entrada rápida para o Check-in diário e Roletas.
*   **Estética Glassmorphism:** Fundo translúcido com desfoque (blur), ícones modernos da Lucide-React e feedbacks visuais de seção ativa.

---

## ⏳ 11. Cupons Especiais de Escassez e Urgência (Lotes Limitados)
Estratégia para criar promoções com limite de capacidade, como "Apenas os 20 primeiros ganham um prêmio".

*   **Configuração no Cadastro do Cupom:**
    *   Flag "Uso Ilimitado" (Sim/Não).
    *   Campo "Quantidade Máxima de Cupons" disponível caso o uso não seja ilimitado.
*   **Barra de Progresso (Gatilho de Urgência Visual):**
    *   A página inicial (vitrine) mostrará uma **barra de progresso** na oferta, indicando visualmente quantos resgates já ocorreram e quantos restam, criando urgência.
    *   Se o limite já tiver sido atingido ao acessar a tela, o botão de resgate ficará bloqueado, evitando frustração do cliente em tentar algo esgotado.
*   **Tratamento de Concorrência (Race Condition):**
    *   Caso um cliente entre na aba e falte apenas 1 cupom para o limite (ex: 19 de 20 resgatados), o botão estará ativo. 
    *   Entretanto, ao clicar em "resgatar/desbloquear", o sistema fará a checagem no banco de dados. Se outra pessoa tiver resgatado o último segundo antes, o sistema retornará uma mensagem amigável: "Todos os cupons já foram resgatados dessa promoção."

---

## 🏗️ 12. Expansão de Parcerias e Atendimento (Adiado para Fase 2)
Funcionalidades que foram preparadas e serão reativadas para escala futura do modelo de negócio.

*   **Módulo "Seja nosso parceiro estratégico":**
    *   **Motoristas de App:** Captação de parceiros para instalação de telas em veículos.
    *   **Comerciantes Estratégicos:** Captação de pontos comerciais para expansão da rede de TVs.
    *   **Fluxo de Onboarding:** Automação de pré-cadastro e envio de termos de parceria.
*   **Central de Atendimento (Fale Conosco):**
    *   Canal direto de suporte via WhatsApp para usuários e lojistas.
    *   FAQ dinâmico alimentado pelo Agente de IA para resolver dúvidas rápidas.

---
*Documento atualizado em 04 de Maio de 2026.*
