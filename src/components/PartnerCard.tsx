import React, { useState, useRef, useEffect } from 'react';
import { ExternalLink, MapPin, Navigation, Gift, CheckCircle2, MessageCircle, Phone, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import * as htmlToImage from 'html-to-image';
import { Partner } from '../types';
import { supabase } from '../lib/supabase';
import { getUserIP } from '../lib/ip';

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
  const [userIp, setUserIp] = useState<string>('unknown');
  const couponRef = useRef<HTMLDivElement>(null);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(partner.address)}`;

  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 7);
  const formattedDate = expirationDate.toLocaleDateString('pt-BR');

  useEffect(() => {
    getUserIP().then(setUserIp);
  }, []);

  useEffect(() => {
    if (unlockStep === 'unlocked' && couponRef.current) {
      const timer = setTimeout(async () => {
        try {
          const dataUrl = await htmlToImage.toPng(couponRef.current!, {
            backgroundColor: '#f0fdf4', // matches bg-green-50/50
            pixelRatio: 2,
            cacheBust: true,
            skipFonts: true // Disable font embedding to avoid CORS issues with external stylesheets
          });
          
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = `cupom-${partner.name.toLowerCase().replace(/\s+/g, '-')}.png`;
          link.click();
        } catch (err) {
          console.error('Error generating coupon image:', err);
        }
      }, 800); // slightly longer delay to ensure styles are fully applied
      return () => clearTimeout(timer);
    }
  }, [unlockStep, partner.name]);

  const handleUnlock = async () => {
    if (whatsapp.replace(/\D/g, '').length < 10) return;
    
    setIsUnlocking(true);
    try {
      const ip = await getUserIP();
      const { error } = await supabase
        .from('unlocked_coupons')
        .insert([
          {
            partner_id: partner.id,
            partner_name: partner.name,
            coupon_code: partner.coupon,
            coupon_description: partner.couponDescription,
            whatsapp: whatsapp,
            ip_address: ip
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
    if (!partner.id) {
      console.warn('Tracking skipped: Partner ID is missing');
      return;
    }

    console.log(`Tracking ${destination} click for partner: ${partner.name} (${partner.id})`);

    try {
      // Get IP if still unknown
      let currentIp = userIp;
      if (currentIp === 'unknown') {
        try {
          currentIp = await getUserIP();
          setUserIp(currentIp);
        } catch (ipErr) {
          console.error('Error fetching IP for tracking:', ipErr);
        }
      }

      const clickData = {
        partner_id: partner.id,
        partner_name: partner.name,
        destination: destination,
        ip_address: currentIp
      };

      console.log('Sending click data to Supabase:', clickData);

      // Fire and forget the insert
      supabase.from('partner_clicks')
        .insert([clickData])
        .then(({ error, data }) => {
          if (error) {
            console.error(`Supabase error tracking ${destination} click:`, error);
          } else {
            console.log(`Successfully tracked ${destination} click`);
          }
        });
    } catch (err) {
      console.error(`Unexpected error tracking ${destination} click:`, err);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}?ref=${partner.displayId}`;
    const shareText = `Eu já garanti o meu cupom de benefícios do ${partner.name}. Não fique de fora e venha garantir o seu também!`;
    
    try {
      const ip = await getUserIP();
      await supabase.from('partner_shares').insert([
        {
          partner_id: partner.id,
          partner_name: partner.name,
          display_id: partner.displayId,
          whatsapp_number: whatsapp,
          ip_address: ip
        }
      ]);
    } catch (error) {
      console.error('Error logging share:', error);
    }

    const fullText = `${shareText} ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: partner.name,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(fullText)}`;
      window.open(whatsappUrl, '_blank');
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
          <div ref={couponRef} className="mb-6 border-2 border-dashed border-[#279267]/30 rounded-xl p-4 bg-green-50/50 relative overflow-hidden">
            {unlockStep === 'hidden' && (
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center space-x-2 mb-3">
                  <Gift size={18} className="text-[#279267] flex-shrink-0" />
                  <span className="text-[#279267] font-bold text-sm leading-tight">Para liberar o seu cupom exclusivo, confirme o seu Whatsapp</span>
                </div>
                <div className="w-full h-10 bg-white/60 backdrop-blur-sm rounded-lg mb-3 flex items-center justify-center border border-slate-200 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.03)_10px,rgba(0,0,0,0.03)_20px)]"></div>
                    <span className="text-xl font-mono tracking-widest text-slate-400 font-bold blur-[3px] select-none">••••••••</span>
                </div>
                <button
                  onClick={() => setUnlockStep('input')}
                  className="w-full bg-[#279267] text-white text-xs font-bold px-4 py-3 rounded-lg hover:bg-[#1e7452] transition-colors shadow-sm"
                >
                  Garantir meu benefício agora!
                </button>
              </div>
            )}
            {unlockStep === 'input' && (
              <div className="flex flex-col items-center animate-in fade-in duration-200 w-full">
                <span className="text-slate-700 font-bold text-xs mb-1 text-center">Para liberar o seu benefício, digite o seu Whatsapp e ganhe:</span>
                {partner.couponDescription && (
                  <span className="text-[#279267] font-black text-sm mb-3 text-center bg-white px-2 py-1.5 rounded-md border border-green-100 shadow-sm w-full">
                    {partner.couponDescription}
                  </span>
                )}
                <input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
                  className="w-full px-3 py-2 text-base rounded-lg border border-slate-200 mb-2 focus:outline-none focus:border-[#279267] bg-white text-center font-bold tracking-wider"
                  autoFocus
                />
                <button
                  onClick={handleUnlock}
                  className="w-full bg-[#279267] text-white text-xs font-bold px-4 py-3 rounded-lg hover:bg-[#1e7452] transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center"
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
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ 
                  type: "spring",
                  stiffness: 260,
                  damping: 20 
                }}
                className="flex flex-col items-center text-center"
              >
                <div className="flex items-center space-x-1 mb-2">
                  <CheckCircle2 size={16} className="text-[#279267]" />
                  <span className="text-[#279267] font-bold text-sm">Cupom Desbloqueado!</span>
                </div>
                
                <div className="flex items-center justify-center space-x-1.5 mb-3 px-4 py-1 bg-white rounded-full border border-slate-200 shadow-sm whitespace-nowrap">
                  <Phone size={10} className="text-slate-400 flex-shrink-0" />
                  <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">{whatsapp}</span>
                </div>

                {partner.couponDescription && (
                  <p className="text-xs text-slate-700 font-medium mb-2">{partner.couponDescription}</p>
                )}
                <div className="w-full py-2.5 bg-white rounded-lg border-2 border-[#279267] mb-1 select-all shadow-sm">
                  <span className="text-lg font-mono font-black text-slate-800 tracking-wider">{partner.coupon}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">Apresente este código no estabelecimento</span>
                <p className="text-[9px] text-slate-400 mt-1 leading-tight">
                  Este cupom é válido por 07 dias. Apresente até o dia <span className="font-bold">{formattedDate}</span> e garanta o seu benefício.
                </p>

                <div className="mt-6 pt-6 border-t border-[#279267]/20 w-full">
                  <p className="text-xs font-bold text-slate-700 mb-3">Compartilhe para que seus amigos também tenham benefícios!</p>
                  <button
                    onClick={handleShare}
                    className="w-full bg-[#25D366] text-white text-xs font-black px-4 py-3 rounded-xl hover:bg-[#128C7E] transition-all shadow-md flex items-center justify-center space-x-2 active:scale-95"
                  >
                    <Share2 size={16} />
                    <span>Compartilhar com meus amigos!</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}
        
        <div className="flex flex-col gap-2">
          <a 
            href={partner.link}
            target="_blank" 
            rel="noopener noreferrer"
            onPointerDown={() => trackClick('instagram')}
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
              onPointerDown={() => trackClick('whatsapp')}
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
