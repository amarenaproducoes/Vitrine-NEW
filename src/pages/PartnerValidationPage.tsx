import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Partner } from '../types';
import PartnerCard from '../components/PartnerCard';
import { Play, MessageSquare, Check, Send, AlertTriangle, ChevronRight, CheckCircle2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PartnerValidationPageProps {
  approvalConfig?: {
    title: string;
    description: string;
    video_url: string;
  };
}

export const PartnerValidationPage: React.FC<PartnerValidationPageProps> = ({ approvalConfig }) => {
  const { token } = useParams<{ token: string }>();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Local config state
  const [config, setConfig] = useState(approvalConfig || {
    title: 'Seja Bem-vindo à Vitrine Oficial!',
    description: 'Aqui está o rascunho de sua vitrine digital exclusiva. Por favor, revise todos os dados, imagens e links. Se precisar de ajustes, descreva no campo abaixo e envie para nosso time de suporte técnico. Estamos prontos para te destacar!',
    video_url: 'https://www.youtube.com/embed/zH0j5XqXG7A'
  });

  // Feedback form state
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'feedback'>('preview');

  useEffect(() => {
    const fetchConfigAndPartner = async () => {
      if (!token) {
        setErrorMsg('Link de validação inválido.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch Global Onboarding presentation configurations if not passed via props
        if (!approvalConfig) {
          try {
            const { data: cData } = await supabase
              .from('presentation_settings')
              .select('*')
              .eq('id', 1)
              .maybeSingle();
            if (cData) {
              setConfig({
                title: cData.title || 'Seja Bem-vindo à Vitrine Oficial!',
                description: cData.text || '',
                video_url: cData.video_url || 'https://www.youtube.com/embed/zH0j5XqXG7A'
              });
            }
          } catch (cErr) {
            console.error('Error fetching global presentation settings:', cErr);
          }
        }

        const { data, error } = await supabase
          .from('partners')
          .select('*')
          .eq('approval_token', token)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          setErrorMsg('Cadastro não encontrado ou link expirado. Por favor, verifique com seu consultor.');
        } else {
          const mapped: Partner = {
            id: data.id,
            name: data.name,
            category: data.category,
            activity: data.activity,
            description: data.description,
            address: data.address,
            imageUrl: data.image_url,
            images: data.images || [],
            videoUrl: data.video_url || '',
            link: data.link,
            whatsappLink: data.whatsapp_link,
            googleReviewLink: data.google_review_link,
            websiteUrl: data.website_url,
            coupon: data.coupon,
            couponDescription: data.coupon_description,
            isAuthorized: data.is_authorized ?? true,
            cashbackEnabled: data.cashback_enabled ?? true,
            giftCardEnabled: data.gift_card_enabled ?? false,
            is_online_only: data.is_online_only ?? false,
            page_number: data.page_number || 1,
            displayId: data.display_id || 0,
            directLink: data.direct_link || '',
            useGoogleMapsAsDirect: data.use_google_maps_as_direct ?? false,
            directLinkClicks: data.direct_link_clicks || 0,
            approval_status: data.approval_status || 'aguardando_aprovacao',
            approval_token: data.approval_token || '',
            approval_feedback: data.approval_feedback || ''
          };
          setPartner(mapped);
          
          if (mapped.approval_feedback) {
            setFeedbackText(mapped.approval_feedback);
          }
        }
      } catch (err: any) {
        console.error('Error fetching partner by token:', err);
        setErrorMsg('Ocorreu um erro ao carregar os dados. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchConfigAndPartner();
  }, [token, approvalConfig]);

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner || !feedbackText.trim()) return;

    try {
      setIsSubmittingFeedback(true);
      const { error } = await supabase
        .from('partners')
        .update({
          approval_status: 'ajustar',
          approval_feedback: feedbackText.trim()
        })
        .eq('id', partner.id);

      if (error) throw error;

      setPartner(prev => prev ? {
        ...prev,
        approval_status: 'ajustar',
        approval_feedback: feedbackText.trim()
      } : null);

      setFeedbackSubmitted(true);
      setActiveTab('preview');
    } catch (err) {
      console.error('Error updating feedback:', err);
      alert('Erro ao enviar observações. Por favor, tente novamente.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const getYoutubeId = (url: string) => {
    if (!url) return null;
    if (url.includes('/shorts/')) {
      const parts = url.split('/shorts/');
      if (parts[1]) {
        return parts[1].split(/[?#&]/)[0];
      }
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4">
        <RefreshCw size={44} className="text-[#279267] animate-spin mb-4" />
        <p className="text-slate-600 font-bold text-sm">Carregando sua vitrine exclusiva...</p>
      </div>
    );
  }

  if (errorMsg || !partner) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-6">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-3">Ops! Algo deu errado</h2>
        <p className="text-slate-600 mb-8 leading-relaxed font-medium">{errorMsg || 'Não conseguimos localizar o cadastro solicitado.'}</p>
        <Link to="/" className="inline-flex items-center justify-center bg-[#279267] text-white font-black px-6 py-3 rounded-xl hover:bg-[#1e7452] transition-colors text-sm shadow-md">
          Ir para a Página Inicial
        </Link>
      </div>
    );
  }

  const videoId = getYoutubeId(config.video_url);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* 1. Header/Presentation Section */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 shadow-xl mb-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-[#279267]"></div>
        
        <div className="max-w-2xl mx-auto text-center space-y-4 mb-8">
          <span className="bg-[#279267]/10 text-[#279267] text-[10px] sm:text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider inline-block">
            Link Exclusivo de Visualização
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {config.title}
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
            {config.description}
          </p>
        </div>

        {/* Vertical Video Embed Frame */}
        {videoId && (
          <div className="max-w-[280px] sm:max-w-[320px] mx-auto rounded-3xl border-4 border-slate-100 shadow-2xl overflow-hidden aspect-[9/16] bg-black relative mb-4">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0&playsinline=1`}
              title="Apresentação Vitrine"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        )}
      </div>

      {/* Down arrow decorator */}
      <div className="flex flex-col items-center justify-center mb-10 text-slate-400">
        <span className="text-[10px] font-black uppercase tracking-widest mb-2 text-slate-400">Confira seu cadastro abaixo</span>
        <div className="w-8 h-8 rounded-full border-2 border-slate-200 flex items-center justify-center animate-bounce">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      {/* 2. Partner Card Preview and Action Hub */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* The beautiful Partner Card Preview */}
        <div className="md:col-span-7 flex justify-center">
          <div className="w-full max-w-sm">
            <h3 className="text-center font-bold text-slate-400 text-xs uppercase tracking-widest mb-4">Pré-visualização Interativa</h3>
            <PartnerCard partner={partner} isFlat={false} />
          </div>
        </div>

        {/* Action / Feedback Sidebar */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl space-y-6">
            <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
              <CheckCircle2 className="text-[#279267]" size={20} />
              <span>Status do Cadastro</span>
            </h3>

            {/* Current Status Badge/Box */}
            {partner.approval_status === 'autorizado' || partner.isAuthorized ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-[#279267] font-black text-sm">
                  <CheckCircle2 size={16} />
                  <span>Aprovado e Autorizado!</span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Sua vitrine já está publicada oficialmente e pode ser visualizada por todos os usuários do site!
                </p>
              </div>
            ) : partner.approval_status === 'ajustar' ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-amber-700 font-bold text-sm">
                  <RefreshCw size={16} className="animate-spin-slow" />
                  <span>Aguardando Ajustes solicitados</span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Suas observações foram enviadas ao nosso consultor. Estamos trabalhando nos ajustes necessários!
                </p>
                {partner.approval_feedback && (
                  <div className="bg-white/80 p-2.5 rounded-lg border border-amber-100 mt-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Anotações Enviadas:</span>
                    <p className="text-slate-700 text-xs italic font-medium break-words">"{partner.approval_feedback}"</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-blue-700 font-bold text-sm">
                  <MessageSquare size={16} />
                  <span>Aguardando Aprovação</span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Seu cadastro está pronto para análise. Verifique se todas as informações, links e fotos estão do seu agrado.
                </p>
              </div>
            )}

            {/* Feedback actions depending on current status */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              {activeTab === 'preview' ? (
                <div className="space-y-4">
                  {feedbackSubmitted && (
                    <div className="bg-green-50 text-[#279267] p-3 rounded-xl border border-green-100 text-xs font-bold flex items-center space-x-2">
                      <Check size={16} className="shrink-0" />
                      <span>Observações salvas com sucesso!</span>
                    </div>
                  )}

                  {partner.approval_status !== 'autorizado' && !partner.isAuthorized && (
                    <>
                      <p className="text-slate-500 text-xs leading-relaxed font-medium">
                        Se houver qualquer informação incorreta, link quebrado ou detalhe a ser alterado, utilize o botão abaixo para detalhar o ajuste.
                      </p>
                      
                      <button 
                        onClick={() => setActiveTab('feedback')}
                        className="w-full bg-slate-950 text-white font-black py-3.5 px-4 rounded-xl hover:bg-[#279267] transition-all text-xs uppercase tracking-wider flex items-center justify-center space-x-2"
                      >
                        <MessageSquare size={16} />
                        <span>Solicitar Ajustes</span>
                      </button>
                    </>
                  )}

                  <div className="bg-[#279267]/5 border border-[#279267]/20 rounded-2xl p-4 space-y-3">
                    <span className="text-[9px] font-black text-[#279267] uppercase tracking-wider block">Gostou da visualização?</span>
                    <p className="text-slate-700 text-xs leading-relaxed font-semibold">
                      Tudo certo com o seu cadastro? Excelente! Entre em contato com o nosso consultor para finalizar a liberação e publicação oficial no sistema.
                    </p>
                    <a 
                      href={`https://wa.me/5511999999999?text=Olá!%20Acabei%20de%20revisar%20meu%20cadastro%20na%20Vitrine%20Aparece%20Aí%20Por%20Aqui%20(${encodeURIComponent(partner.name)}).%20Está%20tudo%20perfeito!`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-[#279267] hover:text-[#1e7452] font-black text-xs space-x-1"
                    >
                      <span>Falar com o Consultor no WhatsApp</span>
                      <ChevronRight size={14} />
                    </a>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendFeedback} className="space-y-4 animate-in fade-in duration-200">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quais alterações você deseja?</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Descreva detalhadamente quais textos, links, imagens ou cupons deseja ajustar..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-[#279267] focus:bg-white transition-all font-medium"
                    ></textarea>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('preview')}
                      className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 px-4 rounded-xl hover:bg-slate-200 transition-colors text-xs uppercase"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingFeedback || !feedbackText.trim()}
                      className="flex-1 bg-[#279267] text-white font-black py-3 px-4 rounded-xl hover:bg-[#1e7452] transition-all text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 disabled:opacity-50"
                    >
                      {isSubmittingFeedback ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Send size={14} />
                          <span>Enviar Ajustes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerValidationPage;
