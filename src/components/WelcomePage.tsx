import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { WelcomeMessage, Partner, CouponCampaign } from '../types';
import { logger } from '../lib/logger';
import { getUserIP } from '../lib/ip';
import PartnerCard from './PartnerCard';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

interface WelcomePageProps {
  partners: Partner[];
}

const WelcomePage: React.FC<WelcomePageProps> = ({ partners }) => {
  const { refId } = useParams<{ refId: string }>();
  const navigate = useNavigate();
  const [campaignData, setCampaignData] = useState<CouponCampaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCampaignData = async () => {
      if (!refId) return;

      try {
        setIsLoading(true);
        const { data, error: fetchError } = await supabase
          .from('coupon_campaigns')
          .select('*')
          .eq('ref_id', refId)
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (!data) {
          setError('Esta campanha de cupons não foi encontrada ou expirou.');
          return;
        }

        setCampaignData(data);

        // Log access
        try {
          const ip = await getUserIP();
          await supabase.from('coupon_campaign_access_logs').insert({
            campaign_id: data.id,
            ref_id: refId,
            ip_address: ip
          });
        } catch (logErr) {
          logger.error('Error logging campaign access:', logErr);
        }

      } catch (err) {
        logger.error('Error fetching campaign data:', err);
        setError('Ocorreu um erro ao carregar a campanha. Tente novamente mais tarde.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaignData();
  }, [refId]);

  useEffect(() => {
    if (!isLoading && campaignData && titleRef.current) {
      titleRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isLoading, campaignData]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <RefreshCw size={48} className="text-[#279267] animate-spin mb-4" />
        <p className="text-slate-600 font-bold">Carregando sua surpresa...</p>
      </div>
    );
  }

  if (error || !campaignData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-red-50 p-6 rounded-3xl border border-red-100 max-w-md">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900 mb-2">Ops! Algo deu errado.</h2>
          <p className="text-slate-600 mb-6">{error || 'Campanha não encontrada.'}</p>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all"
          >
            VOLTAR PARA O INÍCIO
          </button>
        </div>
      </div>
    );
  }

  const targetPartner = partners.find(p => p.id === campaignData.partner_id);

  if (!targetPartner) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 max-w-md">
          <Sparkles size={48} className="text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900 mb-2">{campaignData.title}</h2>
          <p className="text-slate-600 mb-6">{campaignData.message}</p>
          <p className="text-sm text-amber-700 font-bold mb-6">
            Infelizmente o parceiro desta promoção não está disponível no momento.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-4 bg-[#279267] text-white font-black rounded-2xl hover:bg-green-700 transition-all"
          >
            VER OUTRAS OFERTAS
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12" ref={titleRef}>
      <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="inline-flex items-center justify-center p-3 bg-[#279267]/10 rounded-2xl mb-6">
          <Sparkles className="text-[#279267]" size={32} />
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 mb-4 tracking-tight">
          {campaignData.title}
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          {campaignData.message}
        </p>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <PartnerCard 
            partner={targetPartner} 
            welcomeData={{
              custom_coupon: campaignData.custom_coupon || targetPartner.coupon || '',
              custom_description: campaignData.custom_description || targetPartner.couponDescription || '',
              expiresAt: campaignData.expires_at,
              autoOpen: true
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
