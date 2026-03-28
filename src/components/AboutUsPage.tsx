import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SuccessCase, AboutConfig } from '../types';
import { Trophy, History, Building2, Star } from 'lucide-react';

const AboutUsPage: React.FC = () => {
  const [aboutConfig, setAboutConfig] = useState<AboutConfig | null>(null);
  const [successCases, setSuccessCases] = useState<SuccessCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAboutData();
  }, []);

  const fetchAboutData = async () => {
    try {
      const [aboutRes, casesRes] = await Promise.all([
        supabase.from('about_config').select('*').eq('id', 1).maybeSingle(),
        supabase.from('success_cases').select('*').order('created_at', { ascending: false })
      ]);

      if (aboutRes.data) {
        setAboutConfig({
          id: aboutRes.data.id,
          history: aboutRes.data.history,
          logoUrl: aboutRes.data.logo_url
        });
      } else {
        // Default content if not found
        setAboutConfig({
          id: 1,
          history: "A 'Aparece aí por aqui' nasceu da visão de transformar espaços comuns em oportunidades extraordinárias de conexão. Iniciamos nossa jornada com o propósito de democratizar o acesso à publicidade de alto impacto para pequenos e médios empreendedores locais.\n\nAtravés de uma rede inteligente de telas estrategicamente posicionadas em estabelecimentos de alto fluxo e veículos de aplicativo, criamos um ecossistema onde marcas ganham vida e consumidores descobrem o melhor da sua região. Nossa história é construída diariamente por parcerias sólidas e resultados reais para nossos clientes.",
          logoUrl: null
        });
      }

      if (casesRes.data) {
        setSuccessCases(casesRes.data.map(c => ({
          id: c.id,
          companyName: c.company_name,
          description: c.description,
          logoUrl: c.logo_url,
          storeImageUrl: c.store_image_url
        })));
      } else {
        // Mock cases if empty
        setSuccessCases([
          {
            id: 'mock-1',
            companyName: 'Pizzaria Donatello',
            description: 'Aumentamos o fluxo de pedidos em 40% nos primeiros 3 meses de veiculação em nosso circuito de TVs locais.',
            logoUrl: 'https://picsum.photos/seed/logo1/200/200',
            storeImageUrl: 'https://picsum.photos/seed/store1/800/600'
          },
          {
            id: 'mock-2',
            companyName: 'Academia FitLife',
            description: 'Campanha focada em horários de pico que resultou em mais de 50 novas matrículas vindas diretamente da divulgação nas telas.',
            logoUrl: 'https://picsum.photos/seed/logo2/200/200',
            storeImageUrl: 'https://picsum.photos/seed/store2/800/600'
          },
          {
            id: 'mock-3',
            companyName: 'PetShop Amigão',
            description: 'Divulgação de banho e tosa que esgotou a agenda semanal em apenas 15 dias de exposição no circuito.',
            logoUrl: 'https://picsum.photos/seed/logo3/200/200',
            storeImageUrl: 'https://picsum.photos/seed/store3/800/600'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching about data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-[#279267] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Full Width Banner Logo */}
      {aboutConfig?.logoUrl && (
        <div className="w-full bg-white">
          <img 
            src={aboutConfig.logoUrl} 
            alt="Banner Empresa" 
            className="w-full h-auto block object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 pt-24 pb-32">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-[#279267]/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#c54b4b]/10 rounded-full blur-[120px]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {!aboutConfig?.logoUrl && (
            <div className="inline-flex items-center space-x-2 bg-slate-800/50 backdrop-blur-sm px-4 py-2 rounded-full text-[#279267] text-xs font-bold uppercase tracking-widest mb-8 border border-slate-700/50">
              <Star size={14} />
              <span>Nossa História</span>
            </div>
          )}
          
          <h1 className="text-4xl md:text-7xl font-black text-white mb-6 leading-tight">
            Sobre <span className="text-[#279267] italic">Nós</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed font-medium">
            Conheça a trajetória da empresa que está revolucionando a publicidade regional.
          </p>
        </div>
      </section>

      {/* History Content */}
      <section className="py-20 -mt-16 relative z-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white p-8 md:p-16 rounded-[40px] shadow-2xl border border-slate-100">
            <div className="flex items-center space-x-4 mb-8">
              <div className="bg-[#279267]/10 p-3 rounded-2xl text-[#279267]">
                <History size={32} />
              </div>
              <h2 className="text-3xl font-black text-slate-900">Nossa Jornada</h2>
            </div>
            
            <div 
              className="prose prose-lg text-slate-600 max-w-none leading-relaxed"
              dangerouslySetInnerHTML={{ __html: aboutConfig?.history || '' }}
            />
          </div>
        </div>
      </section>

      {/* Success Cases Section */}
      <section className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 text-[#c54b4b] font-bold text-xs uppercase tracking-widest mb-4">
              <Trophy size={16} />
              <span>Resultados que Inspiram</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-tight">
              Cases de <span className="text-[#279267]">Sucesso</span>
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Veja como nossa plataforma ajudou empresas locais a alcançarem novos patamares de visibilidade e vendas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {successCases.map((item) => (
              <div key={item.id} className="group bg-slate-50 rounded-[32px] overflow-hidden border border-slate-100 hover:shadow-2xl transition-all duration-500 flex flex-col h-full">
                {/* Store Image */}
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={item.storeImageUrl} 
                    alt={item.companyName} 
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                  
                  {/* Company Logo Overlay */}
                  <div className="absolute -bottom-6 left-8">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-xl p-2 flex items-center justify-center border border-slate-100">
                      <img 
                        src={item.logoUrl} 
                        alt={`${item.companyName} Logo`} 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-8 pt-10 flex-grow flex flex-col">
                  <div className="flex items-center space-x-2 mb-3">
                    <Building2 size={16} className="text-[#279267]" />
                    <h3 className="text-xl font-black text-slate-900">{item.companyName}</h3>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-sm flex-grow">
                    {item.description}
                  </p>
                  
                  <div className="mt-6 pt-6 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#279267] uppercase tracking-widest">Case Verificado</span>
                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#279267]/20 rounded-full blur-[100px]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-8">Quer ser o nosso próximo case de sucesso?</h2>
          <p className="text-slate-400 text-lg mb-12 max-w-2xl mx-auto">Junte-se a centenas de empresas que já estão colhendo os frutos de uma divulgação inteligente e focada.</p>
          <a 
            href="/#anuncie" 
            className="inline-flex items-center px-10 py-5 bg-[#279267] text-white font-black rounded-2xl hover:bg-[#1e7a54] transition-all shadow-xl shadow-[#279267]/20 active:scale-95"
          >
            Começar Agora
          </a>
        </div>
      </section>
    </div>
  );
};

export default AboutUsPage;
