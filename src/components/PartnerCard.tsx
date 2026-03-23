import React, { useState } from 'react';
import { ExternalLink, MapPin, Navigation, Gift, CheckCircle2, MessageCircle } from 'lucide-react';
import { Partner } from '../types';
import { supabase } from '../lib/supabase';

interface PartnerCardProps {
  partner: Partner;
}

const formatWhatsApp = (value: string) => {
  const v = value.replace(/\D/g, '').slice(0, 11);
  if (v.length >= 3 && v.length <= 7) {
    return `(${v.slice(0, 2)}) ${v.slice(2)}`;
  } else if (v.length > 7) {
    return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
  } else if (v.length > 0) {
    return `(${v}`;
  }
  return '';
};

const PartnerCard: React.FC<PartnerCardProps> = ({ partner }) => {
  const [unlockStep, setUnlockStep] = useState<'hidden' | 'input' | 'unlocked'>('hidden');
  const [whatsapp, setWhatsapp] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(partner.address)}`;

  const handleUnlock = async () => {
    if (whatsapp.replace(/\D/g, '').length < 10) return;
    
    setIsUnlocking(true);
    try {
      const { error } = await supabase
        .from('unlocked_coupons')
        .insert([
          {
            partner_id: partner.id,
            partner_name: partner.name,
            coupon_code: partner.coupon,
            whatsapp: whatsapp
          }
        ]);

      if (error) throw error;
      setUnlockStep('unlocked');
    } catch (error) {
      console.error('Error unlocking coupon:', error);
      alert('Ocorreu um erro ao liberar o cupom. Tente novamente.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const trackClick = async (destination: 'instagram' | 'whatsapp') => {
    try {
      await supabase.from('partner_clicks').insert([
        {
          partner_id: partner.id,
          partner_name: partner.name,
          destination: destination
        }
      ]);
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col h-full">
      <div className="relative overflow-hidden block aspect-[4/3]">
        <img 
          src={partner.imageUrl} 
          alt={partner.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 bg-white"
        />
        <div className="absolute top-4 left-4">
          <span className="bg-[#279267] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
            {partner.category}
          </span>
        </div>
      </div>
      
      <div className="p-6 flex-grow flex flex-col">
        <span className="text-[#c54b4b] font-bold text-xs uppercase tracking-widest mb-1 block">
          {partner.activity}
        </span>
        <h3 className="text-xl font-extrabold text-slate-900 mb-2 leading-tight">
          {partner.name}
        </h3>
        
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-start space-x-2 text-slate-500 text-xs">
            <MapPin size={14} className="mt-0.5 flex-shrink-0 text-[#c54b4b]" />
            <span className="leading-snug">{partner.address}</span>
          </div>
          <a 
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-bold text-[10px] uppercase tracking-wider transition-colors"
            title="Abrir no Google Maps"
          >
            <Navigation size={12} />
            <span>Como chegar</span>
          </a>
        </div>

        <p className={`text-slate-600 text-sm leading-relaxed flex-grow ${partner.coupon ? 'mb-2' : 'mb-6'}`}>
          {partner.description}
        </p>
        
        {partner.coupon && (
          <div className="mb-6 border-2 border-dashed border-[#279267]/30 rounded-xl p-4 bg-green-50/50 relative overflow-hidden">
            {unlockStep === 'hidden' && (
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center space-x-2 mb-2">
                  <Gift size={16} className="text-[#279267]" />
                  <span className="text-[#279267] font-bold text-sm">Cupom Exclusivo</span>
                </div>
                <div className="w-full h-10 bg-white/60 backdrop-blur-sm rounded-lg mb-3 flex items-center justify-center border border-slate-200 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.03)_10px,rgba(0,0,0,0.03)_20px)]"></div>
                    <span className="text-xl font-mono tracking-widest text-slate-400 font-bold blur-[3px] select-none">••••••••</span>
                </div>
                <button
                  onClick={() => setUnlockStep('input')}
                  className="w-full bg-[#279267] text-white text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-[#1e7452] transition-colors shadow-sm"
                >
                  Desbloquear Desconto
                </button>
              </div>
            )}
            {unlockStep === 'input' && (
              <div className="flex flex-col items-center animate-in fade-in duration-200">
                <span className="text-slate-700 font-bold text-xs mb-2 text-center">Para liberar, informe seu WhatsApp:</span>
                <input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 mb-2 focus:outline-none focus:border-[#279267] bg-white"
                  autoFocus
                />
                <button
                  onClick={handleUnlock}
                  className="w-full bg-[#279267] text-white text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-[#1e7452] transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center"
                  disabled={whatsapp.replace(/\D/g, '').length < 10 || isUnlocking}
                >
                  {isUnlocking ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Confirmar e Liberar"
                  )}
                </button>
                <p className="text-[9px] text-slate-400 mt-2 text-center leading-tight px-1">
                  Ao clicar, você autoriza o envio de mensagens publicitárias. Fique tranquilo, seus dados estão protegidos.
                </p>
              </div>
            )}
            {unlockStep === 'unlocked' && (
              <div className="flex flex-col items-center text-center animate-in zoom-in duration-300">
                <div className="flex items-center space-x-1 mb-2">
                  <CheckCircle2 size={16} className="text-[#279267]" />
                  <span className="text-[#279267] font-bold text-sm">Cupom Desbloqueado!</span>
                </div>
                <div className="w-full py-2.5 bg-white rounded-lg border-2 border-[#279267] mb-1 select-all shadow-sm">
                  <span className="text-lg font-mono font-black text-slate-800 tracking-wider">{partner.coupon}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">Apresente este código no estabelecimento</span>
              </div>
            )}
          </div>
        )}
        
        <div className="flex flex-col gap-2">
          <a 
            href={partner.link}
            target="_blank" 
            rel="noopener noreferrer"
            onClick={() => trackClick('instagram')}
            className="inline-flex items-center justify-center w-full bg-slate-100 group-hover:bg-[#279267] text-slate-800 group-hover:text-white py-3 px-4 rounded-xl font-bold text-sm transition-colors duration-200"
          >
            Visitar Instagram
            <ExternalLink className="ml-2 w-4 h-4" />
          </a>
          
          {partner.whatsappLink && (
            <a 
              href={partner.whatsappLink}
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => trackClick('whatsapp')}
              className="inline-flex items-center justify-center w-full bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white py-3 px-4 rounded-xl font-bold text-sm transition-colors duration-200"
            >
              Chamar no Whatsapp
              <MessageCircle className="ml-2 w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnerCard;
