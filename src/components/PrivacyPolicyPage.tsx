import React from 'react';
import { Shield, Lock, Eye, FileText, ArrowLeft, MessageSquare, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link 
          to="/" 
          className="inline-flex items-center text-[#279267] font-bold hover:underline mb-8 transition-all group"
        >
          <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          Voltar para a Vitrine
        </Link>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-slate-900 p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-[#279267]/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-[#c54b4b]/10 rounded-full blur-3xl"></div>
            
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-6 backdrop-blur-sm">
              <Shield className="text-[#279267] w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-4">Política de Privacidade</h1>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Sua privacidade e a segurança dos seus dados são nossa prioridade máxima na região de Vila Formosa. 
              Conheça como tratamos suas informações em conformidade com a LGPD.
            </p>
          </div>

          <div className="p-8 md:p-12 space-y-10 text-slate-600 leading-relaxed">
            <section>
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="text-[#279267]" size={24} />
                <h2 className="text-xl font-bold text-slate-900">1. Introdução</h2>
              </div>
              <p className="mb-4">
                A <strong>Aparece aí por aqui</strong> valoriza a confiança que você deposita em nós ao compartilhar seus dados. 
                Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais 
                em nosso site, garantindo total transparência e conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
              </p>
              <p>
                Esta política deve ser lida em conjunto com nossos <Link to="/termos-de-uso" className="text-[#279267] font-bold hover:underline">Termos de Uso</Link>, que regem as regras gerais de utilização da nossa plataforma.
              </p>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Eye className="text-[#279267]" size={24} />
                <h2 className="text-xl font-bold text-slate-900">2. Dados Coletados e Finalidade</h2>
              </div>
              <p className="mb-4">Coletamos apenas as informações estritamente necessárias para a prestação de nossos serviços:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Identificação:</strong> Nome completo ou nome da empresa.</li>
                <li><strong>Contato:</strong> Número de WhatsApp.</li>
                <li><strong>Dados de Cartão Presente:</strong> Número do cartão, parceiro selecionado para resgate e status de utilização.</li>
                <li><strong>Dados Técnicos:</strong> Endereço IP, tipo de navegador, logs de acesso e origem do acesso via IDs de referência (ex: QR Codes em veículos ou vestuário).</li>
                <li><strong>Interação:</strong> Mensagens enviadas através de nossos formulários.</li>
              </ul>
              <p className="mb-4"><strong>Finalidade:</strong> Seus dados são utilizados para viabilizar o contato comercial, enviar informações sobre promoções, cupons, cashback e benefícios locais em Vila Formosa (marketing direto), garantir a segurança do site contra bots (via reCAPTCHA), realizar auditoria interna de resgates de cupons e mensurar a eficácia de diferentes pontos de divulgação física através de IDs de referência.</p>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="text-[#279267]" size={24} />
                <h2 className="text-xl font-bold text-slate-900">3. Métodos de Coleta e Segurança de Infraestrutura</h2>
              </div>
              <p className="mb-4">Os dados são coletados e protegidos das seguintes formas:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Formulários Diretos:</strong> Quando você preenche seus dados para anunciar, ser parceiro ou resgatar um cupom/cashback.</li>
                <li><strong>Cloudflare & Proteção de Borda:</strong> Utilizamos a infraestrutura da Cloudflare para proteger nosso site contra ataques de negação de serviço (DDoS), injeção de scripts maliciosos e para garantir a estabilidade global do acesso. Isso inclui o processamento técnico de metadados de conexão para identificar ameaças antes que cheguem ao nosso servidor.</li>
                <li><strong>Cookies e Tecnologias de Rastreamento:</strong> Para melhorar a navegação e segurança (como o reCAPTCHA e cookies técnicos de sessão).</li>
                <li><strong>Logs de Servidor:</strong> Coleta automática de IP e dados de acesso para fins de auditoria de segurança e prevenção de fraudes.</li>
              </ul>
              <p className="mb-4"><strong>Google Analytics:</strong></p>
              <p>
                Utilizamos o Google Analytics (GA4) para entender como os usuários interagem com nosso site e melhorar a experiência de navegação. 
                O GA4 coleta dados de forma anônima, utilizando cookies para registrar informações como páginas visitadas, tempo de permanência e localização aproximada. 
                <strong>Não armazenamos nem processamos seu endereço IP de forma identificável através desta ferramenta.</strong> 
                Você pode desativar o rastreamento do Google Analytics instalando o <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-[#279267] font-bold hover:underline">Complemento do navegador para desativação do Google Analytics</a>.
              </p>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <MessageSquare className="text-[#279267]" size={24} />
                <h2 className="text-xl font-bold text-slate-900">4. Comunicação com o Cliente e Notificações</h2>
              </div>
              <p className="mb-4">
                Ao fornecer seu número de WhatsApp e marcar o checkbox de consentimento, você autoriza a <strong>Aparece aí por aqui</strong> a entrar em contato para fins comerciais, suporte e envio de ofertas. Você pode solicitar a interrupção dessas comunicações a qualquer momento através do próprio canal de atendimento.
              </p>
              <p>
                <strong>Notificações no Navegador (Push Notifications):</strong> Ao se cadastrar em nossa plataforma, você também concorda em receber notificações diretamente em seu navegador. Utilizamos o serviço OneSignal para enviar atualizações importantes, novas promoções e lembretes. Você pode gerenciar ou desativar essas notificações a qualquer momento através das configurações do seu próprio navegador.
              </p>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="text-[#279267]" size={24} />
                <h2 className="text-xl font-bold text-slate-900">5. Segurança e Estabilidade do Serviço</h2>
              </div>
              <p className="mb-4">
                Implementamos múltiplas camadas de segurança para proteger as informações de nossos clientes e parceiros lojistas:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Criptografia:</strong> Utilizamos criptografia AES-256 e protocolos SSL/TLS em todas as comunicações.</li>
                <li><strong>Políticas de Acesso (RLS):</strong> Os dados no Supabase são protegidos por Row Level Security, garantindo que apenas usuários autorizados acessem informações específicas.</li>
                <li><strong>Blindagem Cloudflare:</strong> Nosso domínio é protegido por Firewall de Aplicação Web (WAF) do Cloudflare, filtrando bots e tráfego malicioso em tempo real para manter a alta disponibilidade e estabilidade do serviço.</li>
              </ul>
              <p>
                Compensações por eventuais danos comprovados decorrentes do tratamento inadequado de dados serão tratadas individualmente, seguindo as diretrizes de responsabilidade civil previstas na LGPD.
              </p>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Lock className="text-[#279267]" size={24} />
                <h2 className="text-xl font-bold text-slate-900">6. Privacidade para Menores</h2>
              </div>
              <p>
                Nossos serviços não são direcionados a menores de 18 anos. Não coletamos intencionalmente dados de crianças ou adolescentes. Caso identifiquemos a coleta acidental, procederemos com a exclusão imediata dos registros.
              </p>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Sparkles className="text-[#279267]" size={24} />
                <h2 className="text-xl font-bold text-slate-900">7. Alterações Futuras</h2>
              </div>
              <p>
                Esta política pode ser atualizada periodicamente para refletir mudanças em nossos serviços ou na legislação. Recomendamos a consulta regular a esta página. A data da última atualização estará sempre visível no rodapé deste documento.
              </p>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="text-[#279267]" size={24} />
                <h2 className="text-xl font-bold text-slate-900">8. Seus Direitos (LGPD)</h2>
              </div>
              <p className="mb-4">Como titular dos dados, você tem o direito de, a qualquer momento:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Confirmar a existência de tratamento de seus dados.</li>
                <li>Acessar seus dados pessoais.</li>
                <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
                <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários.</li>
                <li>Revogar o consentimento dado anteriormente para o tratamento de dados.</li>
              </ul>
            </section>

            <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 mb-2">Contato do Encarregado de Dados</h2>
              <p className="text-sm">
                Para exercer seus direitos ou tirar dúvidas sobre esta política, entre em contato através do e-mail:<br />
                <a href="mailto:contato@apareceaiporaqui.com.br" className="text-[#279267] font-bold hover:underline">contato@apareceaiporaqui.com.br</a>
              </p>
            </section>

            <div className="pt-8 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">
                Última atualização: 17 de Abril de 2026.<br />
                Aparece aí por aqui - Proteção Reforçada via Cloudflare Firewall.<br />
                Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
