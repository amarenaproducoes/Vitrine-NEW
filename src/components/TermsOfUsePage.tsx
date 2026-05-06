import React from 'react';
import { FileText, Shield, AlertCircle, Scale, ArrowLeft, Info, Lock as LockIcon, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsOfUsePage: React.FC = () => {
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
              <Scale className="text-[#279267] w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-4">Termos de Uso</h1>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Regras e condições para utilização da plataforma Aparece aí por aqui na região de Vila Formosa. 
              Ao navegar em nosso site, você concorda com estas diretrizes.
            </p>
          </div>

          <div className="p-8 md:p-12 space-y-10 text-slate-600 leading-relaxed">
            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="text-[#279267]" size={24} />
                <h2 className="text-xl font-bold text-slate-900">1. Aceite do Usuário</h2>
              </div>
              <p className="mb-4">
                O uso desta plataforma está condicionado à aceitação destes Termos de Uso e da nossa Política de Privacidade. O aceite ocorre de forma clara através do uso continuado do site ou mediante a marcação de checkboxes de consentimento em nossos formulários de contato e resgate de benefícios.
              </p>
              <p>
                Caso não concorde com qualquer parte destas condições, você deve interromper o uso da plataforma imediatamente.
              </p>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="text-[#279267]" size={24} />
                <h2 className="text-xl font-bold text-slate-900">2. Descrição dos Serviços</h2>
              </div>
              <p className="mb-4">
                A plataforma funciona como uma vitrine digital de benefícios exclusivos, oferecendo:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Divulgação de empresas e parceiros locais em Vila Formosa.</li>
                <li>Disponibilização de cupons de desconto, promoções e sistemas de recompensas.</li>
                <li>Benefícios exclusivos para a comunidade local e usuários da plataforma.</li>
                <li>Canais de contato para anunciantes e comerciantes interessados em parcerias.</li>
                <li>Mensagens de boas-vindas personalizadas com base no ponto de entrada do usuário (QR Codes de referência).</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Scale className="text-[#279267]" size={24} />
                <h2 className="text-xl font-bold text-slate-900">3. Regras de Conduta</h2>
              </div>
              <p className="mb-4">Ao utilizar nosso site, você se compromete a:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Fornecer informações verdadeiras e atualizadas nos formulários de contato.</li>
                <li>Não utilizar a plataforma para fins ilícitos, fraudulentos ou que violem direitos de terceiros.</li>
                <li>Não tentar burlar sistemas de segurança, como verificações de bots ou limites de resgate.</li>
                <li>Não utilizar robôs, spiders ou outros dispositivos automáticos para acessar o site para qualquer finalidade.</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <AlertCircle className="text-[#279267]" size={24} />
                <h2 className="text-xl font-bold text-slate-900">4. Compromisso com a Estabilidade e Segurança</h2>
              </div>
              <p className="mb-4">
                A <strong>Aparece aí por aqui</strong> utiliza infraestrutura de ponta para garantir a máxima estabilidade do serviço para nossos usuários e parceiros lojistas. No entanto:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Esforçamo-nos para manter o site disponível 24/7, mas não nos responsabilizamos por instabilidades decorrentes de falhas globais na internet ou incidentes técnicos que superem as medidas de segurança atuais.</li>
                <li>Não nos responsabilizamos pela qualidade, entrega ou validade dos produtos e serviços oferecidos pelos parceiros anunciados.</li>
                <li>A validade de cupons e benefícios é de inteira responsabilidade do estabelecimento parceiro.</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <LockIcon className="text-[#279267]" size={24} />
                <h2 className="text-xl font-bold text-slate-900">5. Propriedade Intelectual</h2>
              </div>
              <p>
                Todo o design, código-fonte, logotipos, textos e imagens (exceto as de parceiros) são de propriedade exclusiva da <strong>Aparece aí por aqui</strong> ou de seus licenciadores. A reprodução total ou parcial sem autorização prévia é estritamente proibida.
              </p>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="text-[#279267]" size={24} />
                <h2 className="text-xl font-bold text-slate-900">6. Privacidade e Dados (LGPD)</h2>
              </div>
              <p>
                O tratamento de seus dados pessoais coletados através deste site é regido pela nossa <Link to="/politica-de-privacidade" className="text-[#279267] font-bold hover:underline">Política de Privacidade</Link>, em total conformidade com a LGPD.
              </p>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <AlertCircle className="text-[#279267]" size={24} />
                <h2 className="text-xl font-bold text-slate-900">7. Rescisão e Suspensão</h2>
              </div>
              <p>
                Reservamo-nos o direito de suspender ou cancelar o acesso de qualquer usuário à plataforma, a qualquer momento e sem aviso prévio, caso identifiquemos violação destes termos ou atividades suspeitas de fraude.
              </p>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Scale className="text-[#279267]" size={24} />
                <h2 className="text-xl font-bold text-slate-900">8. Alterações e Foro</h2>
              </div>
              <p className="mb-4">
                Estes termos podem ser alterados a qualquer momento. O uso continuado do site após alterações constitui aceitação dos novos termos.
              </p>
              <p>
                Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer controvérsias decorrentes deste documento.
              </p>
            </section>

            <div className="pt-8 border-t border-slate-100 text-center">
              <p className="mb-6 text-slate-600">
                Para suporte, dúvidas ou sugestões, entre em contato: <br />
                <a href="mailto:contato@apareceaiporaqui.com.br" className="text-[#279267] font-bold hover:underline">contato@apareceaiporaqui.com.br</a>
              </p>
              <p className="text-xs text-slate-400">
                Última atualização: 06 de Maio de 2026.<br />
                Aparece aí por aqui - Sistema de Segurança em Camadas.<br />
                Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUsePage;
