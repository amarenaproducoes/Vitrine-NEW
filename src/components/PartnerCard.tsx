import React, { useState, useRef, useEffect } from 'react';
import { ExternalLink, MapPin, Navigation, Gift, CheckCircle2, MessageCircle, Phone, Share2, AlertCircle, ChevronLeft, ChevronRight, Play, Star, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as htmlToImage from 'html-to-image';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { Partner } from '../types';
import { supabase } from '../lib/supabase';
import { getUserIP } from '../lib/ip';
import { logger } from '../lib/logger';
import { formatWhatsApp, getCleanWhatsApp } from '../lib/format';

interface PartnerCardProps {
  partner: Partner;
  isFlat?: boolean;
  welcomeData?: {
    custom_coupon: string;
    custom_description: string;
    expiresAt?: string | null;
    autoOpen?: boolean;
  };
}

const PartnerCard: React.FC<PartnerCardProps> = ({ partner, welcomeData, isFlat = false }) => {
  const [unlockStep, setUnlockStep] = useState<'hidden' | 'input' | 'unlocked'>(welcomeData?.autoOpen ? 'input' : 'hidden');
  const [whatsapp, setWhatsapp] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [hasOneSignalId, setHasOneSignalId] = useState(false);
  const [isSearchingName, setIsSearchingName] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [userIp, setUserIp] = useState<string>('unknown');
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const couponRef = useRef<HTMLDivElement>(null);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(partner.address)}`;

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const cleanRaw = rawValue.replace(/\D/g, '');
    
    // Prevent typing more than 11 digits
    if (cleanRaw.length > 11) return;

    const formatted = formatWhatsApp(rawValue);
    
    // Only update and clear if the value actually changed
    if (formatted !== whatsapp) {
      setWhatsapp(formatted);
      // Clear name and stop searching if WhatsApp changes
      setCustomerName('');
      setHasOneSignalId(false);
      setIsSearchingName(false);
    }
  };

  const isWhatsappValid = whatsapp.replace(/\D/g, '').length === 11;
  const isFormValid = isWhatsappValid && customerName.trim().length > 0 && hasConsented;

  useEffect(() => {
    const searchName = async () => {
      const cleanWhatsapp = getCleanWhatsApp(whatsapp);
      // Only query if WhatsApp is complete (11 digits)
      if (cleanWhatsapp.length === 11) {
        setIsSearchingName(true);
        try {
          const { data } = await supabase
            .from('customers')
            .select('name, onesignal_id')
            .eq('whatsapp', cleanWhatsapp)
            .maybeSingle();
          
          if (data?.name) {
            setCustomerName(data.name);
            if (data.onesignal_id) {
              setHasOneSignalId(true);
            }
          } else {
            // If not found, ensure name is empty for new registration
            setCustomerName('');
            setHasOneSignalId(false);
          }
        } catch (error) {
          logger.error('Error searching customer name in PartnerCard:', error);
        } finally {
          setIsSearchingName(false);
        }
      }
    };
    searchName();
  }, [whatsapp]);

  const getExpirationDate = () => {
    if (welcomeData?.expiresAt) {
      const date = new Date(welcomeData.expiresAt);
      // Add one day to include the full day selected (since HTML date input is usually midnight UTC)
      // Or just use the date as is. Usually users expect "Valid until [Date]" to include that date.
      // Let's adjust for timezone if needed, but simple local date string is usually fine.
      return date.toLocaleDateString('pt-BR');
    }
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);
    return expirationDate.toLocaleDateString('pt-BR');
  };

  const formattedDate = getExpirationDate();

  useEffect(() => {
    getUserIP().then(setUserIp);
  }, []);

  useEffect(() => {
    if (unlockStep === 'unlocked' && couponRef.current) {
      const timer = setTimeout(async () => {
        try {
          setIsGeneratingImage(true);
          // Wait a bit for the state change to reflect in the DOM
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const dataUrl = await htmlToImage.toPng(couponRef.current!, {
            backgroundColor: '#f0fdf4', // matches bg-green-50/50
            pixelRatio: 2,
            cacheBust: true,
            skipFonts: true // Disable font embedding to avoid CORS issues with external stylesheets
          });
          
          const now = new Date();
          const timeSuffix = `${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
          
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = `cupom-${partner.name.toLowerCase().replace(/\s+/g, '-')}-${timeSuffix}.png`;
          link.click();
        } catch (err) {
          logger.error('Error generating coupon image:', err);
        } finally {
          setIsGeneratingImage(false);
        }
      }, 800); // slightly longer delay to ensure styles are fully applied
      return () => clearTimeout(timer);
    }
  }, [unlockStep, partner.name]);

  const handleUnlock = async () => {
    if (!isFormValid) {
      if (!isWhatsappValid) alert('Por favor, insira um WhatsApp válido.');
      else if (customerName.trim().length === 0) alert('Por favor, insira seu nome completo.');
      else if (!hasConsented) alert('Você precisa aceitar os termos para continuar.');
      return;
    }
    
    // Rate Limiting: Check for local cooldown (1 minute)
    const lastUnlock = localStorage.getItem(`last_unlock_${partner.id}`);
    const now = Date.now();
    if (lastUnlock && now - parseInt(lastUnlock) < 60000) {
      const remaining = Math.ceil((60000 - (now - parseInt(lastUnlock))) / 1000);
      alert(`Aguarde ${remaining} segundos para tentar novamente.`);
      return;
    }

    setIsUnlocking(true);
    try {
      // ReCAPTCHA with fallback
      let recaptchaToken = 'skipped';
      if (executeRecaptcha && import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
        try {
          recaptchaToken = await executeRecaptcha('unlock_coupon');
        } catch (reErr) {
          logger.error('ReCAPTCHA error, continuing anyway:', reErr);
        }
      }

      const ip = await getUserIP();
      const cleanWhatsapp = getCleanWhatsApp(whatsapp);

      // Save/Update customer name
      try {
        let onesignalId = null;
        try {
          if (window.OneSignal && (window as any).isOneSignalInitialized) {
            // Add tags immediately so they are queued
            window.OneSignal.User.addTag("whatsapp", cleanWhatsapp);
            window.OneSignal.User.addTag("name", customerName.trim());
            
            // Link external ID via alias (v16 way)
            try {
              (window.OneSignal.User as any).addAlias("external_id", cleanWhatsapp);
            } catch (aliasErr) {
              console.warn("Erro ao adicionar alias:", aliasErr);
            }

            // Trigger native prompt if not already subscribed and not blocked
            if (!hasOneSignalId && window.OneSignal.Notifications.permissionNative === 'default') {
              try {
                await Promise.race([
                  window.OneSignal.Notifications.requestPermission(),
                  new Promise(resolve => setTimeout(resolve, 2000))
                ]);
              } catch (permErr) {
                console.warn("Aviso: Solicitação de permissão ignorada ou bloqueada pelo navegador.");
              }
            }
            
            // Try to get the ID, wait up to 5 seconds
            for (let i = 0; i < 25; i++) {
              const subId = window.OneSignal.User?.onesignalId || 
                            window.OneSignal.User?.PushSubscription?.id ||
                            (window.OneSignal.User as any)?.subscriptionId;
              if (subId) {
                onesignalId = subId;
                console.log("ID OneSignal capturado:", onesignalId);
                break;
              }
              await new Promise(resolve => setTimeout(resolve, 200));
            }

            if (!onesignalId) {
              console.warn("Aviso: OneSignal inicializou mas o ID de inscrição ainda não está disponível.");
            }
          }
        } catch (e) {
          console.error("Erro detalhado OneSignal:", e);
        }

        await supabase
          .from('customers')
          .upsert({ 
            whatsapp: cleanWhatsapp, 
            name: customerName.trim(),
            ...(onesignalId ? { onesignal_id: onesignalId } : {}),
            updated_at: new Date().toISOString()
          }, { onConflict: 'whatsapp' });

        // Update name in all previous logs to ensure consistency
        await Promise.all([
          supabase.from('cashback_logs').update({ customer_name: customerName.trim() }).eq('whatsapp', cleanWhatsapp),
          supabase.from('unlocked_coupons').update({ customer_name: customerName.trim() }).eq('whatsapp', cleanWhatsapp),
          supabase.from('partner_shares').update({ customer_name: customerName.trim() }).eq('whatsapp_number', cleanWhatsapp)
        ]);
      } catch (error) {
        logger.error('Error saving customer name in PartnerCard:', error);
      }

      const { error } = await supabase
        .from('unlocked_coupons')
        .insert([
          {
            partner_id: partner.id,
            partner_name: partner.name,
            coupon_code: welcomeData?.custom_coupon || partner.coupon,
            coupon_description: welcomeData?.custom_description || partner.couponDescription,
            whatsapp: cleanWhatsapp, // Use clean number for consistency
            customer_name: customerName.trim(),
            ip_address: ip,
            expires_at: welcomeData?.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]);

      if (error) throw error;
      
      // Save unlock time for rate limiting
      localStorage.setItem(`last_unlock_${partner.id}`, Date.now().toString());
      
      setUnlockStep('unlocked');
    } catch (error) {
      logger.error('Error unlocking coupon:', error);
      alert('Ocorreu um erro ao liberar o cupom. Verifique sua conexão e tente novamente.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const trackClick = async (destination: 'instagram' | 'whatsapp' | 'google' | 'site/vitrine') => {
    if (!partner.id) {
      logger.warn('Tracking skipped: Partner ID is missing');
      return;
    }

    logger.log(`Tracking ${destination} click for partner: ${partner.name} (${partner.id})`);

    try {
      // Get IP if still unknown
      let currentIp = userIp;
      if (currentIp === 'unknown') {
        try {
          currentIp = await getUserIP();
          setUserIp(currentIp);
        } catch (ipErr) {
          logger.error('Error fetching IP for tracking:', ipErr);
        }
      }

      const clickData = {
        partner_id: partner.id,
        partner_name: partner.name,
        destination: destination,
        ip_address: currentIp
      };

      logger.sensitive('Sending click data to Supabase', clickData);

      // Fire and forget the insert
      supabase.from('partner_clicks')
        .insert([clickData])
        .then(({ error, data }) => {
          if (error) {
            logger.error(`Supabase error tracking ${destination} click:`, error);
          } else {
            logger.log(`Successfully tracked ${destination} click`);
          }
        });
    } catch (err) {
      logger.error(`Unexpected error tracking ${destination} click:`, err);
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
          whatsapp_number: whatsapp.replace(/\D/g, ''),
          customer_name: customerName.trim(),
          ip_address: ip
        }
      ]);
    } catch (error) {
      logger.error('Error logging share:', error);
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
        logger.error('Error sharing:', err);
      }
    } else {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(fullText)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const getYoutubeId = (url: string) => {
    if (!url) return null;
    console.log('Extracting YouTube ID from:', url);
    // Handle shorts specifically
    if (url.includes('/shorts/')) {
      const parts = url.split('/shorts/');
      if (parts[1]) {
        const id = parts[1].split(/[?#&]/)[0];
        console.log('Extracted Shorts ID:', id);
        return id;
      }
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    const id = (match && match[2].length === 11) ? match[2] : null;
    console.log('Extracted Video ID:', id);
    return id;
  };

  const videoId = partner.videoUrl ? getYoutubeId(partner.videoUrl) : null;
  const mediaItems = [];
  
  if (videoId) {
    mediaItems.push({
      type: 'video',
      id: videoId,
      thumbnail: `https://img.youtube.com/vi/${videoId}/0.jpg`,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1&enablejsapi=1&mute=1`
    });
  }
  
  mediaItems.push({ type: 'image', url: partner.imageUrl });
  if (partner.images && partner.images.length > 0) {
    partner.images.forEach(img => {
      if (img) mediaItems.push({ type: 'image', url: img });
    });
  }

  const nextMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsVideoPlaying(false);
    setCurrentMediaIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const prevMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsVideoPlaying(false);
    setCurrentMediaIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  return (
    <div id={`partner-card-${partner.id}`} className={`group bg-white rounded-2xl overflow-hidden transition-all duration-300 flex flex-col h-full ${isFlat ? '' : 'shadow-sm hover:shadow-xl border border-slate-100'}`}>
      <div className="relative overflow-hidden block aspect-[9/16] bg-slate-100">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMediaIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            {mediaItems[currentMediaIndex].type === 'video' ? (
              <div className="relative w-full h-full group/video">
                {!isVideoPlaying ? (
                  <div 
                    className="relative w-full h-full cursor-pointer"
                    onClick={() => setIsVideoPlaying(true)}
                  >
                    <img 
                      src={mediaItems[currentMediaIndex].thumbnail} 
                      alt={partner.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/video:bg-black/40 transition-colors">
                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-2xl transform group-hover/video:scale-110 transition-transform">
                        <Play className="text-[#279267] fill-[#279267] ml-1" size={32} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <iframe
                    src={mediaItems[currentMediaIndex].embedUrl}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                    className="w-full h-full"
                    loading="eager"
                  ></iframe>
                )}
              </div>
            ) : (
              <img 
                src={mediaItems[currentMediaIndex].url} 
                alt={`${partner.name} - ${currentMediaIndex}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover bg-white"
              />
            )}
          </motion.div>
        </AnimatePresence>

        {mediaItems.length > 1 && (
          <>
            <button 
              onClick={prevMedia}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white rounded-full flex items-center justify-center transition-all z-10"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={nextMedia}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white rounded-full flex items-center justify-center transition-all z-10"
            >
              <ChevronRight size={20} />
            </button>
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {mediaItems.map((_, idx) => (
                <div 
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentMediaIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}

        <div className="absolute top-4 left-4 z-10">
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
              <div className="flex flex-col items-center animate-in fade-in duration-200 w-full space-y-4">
                <div className="text-center">
                  <span className="text-slate-700 font-bold text-xs mb-1 block">Para liberar o seu benefício, digite o seu Whatsapp e ganhe:</span>
                  {(welcomeData?.custom_description || partner.couponDescription) && (
                    <span className="text-[#279267] font-black text-[11px] sm:text-xs mb-3 block bg-white px-2 py-1.5 rounded-md border border-green-100 shadow-sm w-full break-words">
                      {welcomeData?.custom_description || partner.couponDescription}
                    </span>
                  )}
                </div>

                <div className="w-full">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                    Seu WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={whatsapp}
                      onChange={handleWhatsappChange}
                      maxLength={15}
                      className="w-full pl-10 pr-3 py-2.5 text-base rounded-xl border border-slate-200 focus:outline-none focus:border-[#279267] bg-white font-bold tracking-wider"
                      autoFocus
                    />
                  </div>
                </div>

                {isWhatsappValid && (
                  <div className="w-full animate-in slide-in-from-top-2 duration-300">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                      Seu Nome Completo
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Digite seu nome..."
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className={`w-full px-4 py-2.5 text-base rounded-xl border border-slate-200 focus:outline-none focus:border-[#279267] bg-white font-bold transition-all ${isSearchingName ? 'opacity-50' : ''}`}
                        disabled={isSearchingName}
                      />
                      {isSearchingName && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-[#279267] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    {hasOneSignalId && (
                      <div className="mt-2 flex items-center gap-1.5 text-[#279267]">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs font-bold">Membro Aparece Aí por Aqui</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex gap-2">
                  <AlertCircle className="text-amber-600 w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-[9px] leading-relaxed text-amber-800 font-medium">
                    <strong>AVISO DE COLETA DE DADOS:</strong> Seus dados serão coletados e utilizados para fins publicitários e informativos sobre promoções e benefícios locais, conforme nossa <Link to="/politica-de-privacidade" className="underline font-bold hover:text-[#279267]">Política de Privacidade</Link> e <Link to="/termos-de-uso" className="underline font-bold hover:text-[#279267]">Termos de Uso</Link>.
                  </p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer group w-full">
                  <div className="relative mt-0.5">
                    <input 
                      type="checkbox"
                      checked={hasConsented}
                      onChange={(e) => setHasConsented(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${hasConsented ? 'bg-[#279267] border-[#279267]' : 'bg-white border-slate-200 group-hover:border-slate-300'}`}>
                      {hasConsented && <CheckCircle2 className="text-white w-3.5 h-3.5" />}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-600 font-medium leading-tight">
                    Estou ciente e autorizo a coleta e uso dos meus dados, bem como o recebimento de notificações no navegador, conforme a Política de Privacidade e Termos de Uso.
                  </span>
                </label>

                <button
                  onClick={handleUnlock}
                  className={`w-full py-3.5 rounded-xl font-black text-xs shadow-md transition-all flex items-center justify-center ${isFormValid ? 'bg-[#279267] text-white hover:bg-[#1e7452]' : 'bg-slate-100 text-slate-400'}`}
                  disabled={isUnlocking}
                >
                  {isUnlocking ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "CONFIRMAR E LIBERAR"
                  )}
                </button>
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
                <div className="mb-4 w-full">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Estabelecimento</span>
                  <div className="bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm inline-block max-w-full">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight break-words">{partner.name}</h3>
                  </div>
                </div>

                <div className="flex items-center space-x-1 mb-2">
                  <CheckCircle2 size={16} className="text-[#279267]" />
                  <span className="text-[#279267] font-bold text-sm">Cupom Desbloqueado!</span>
                </div>
                
                <div className="flex items-center justify-center space-x-1.5 mb-3 px-4 py-1 bg-white rounded-full border border-slate-200 shadow-sm whitespace-nowrap">
                  <Phone size={10} className="text-slate-400 flex-shrink-0" />
                  <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">{whatsapp}</span>
                </div>

                {(welcomeData?.custom_description || partner.couponDescription) && (
                  <p className="text-[10px] sm:text-[11px] text-slate-700 font-medium mb-2 break-words">{welcomeData?.custom_description || partner.couponDescription}</p>
                )}
                <div className="w-full py-2.5 bg-white rounded-lg border-2 border-[#279267] mb-1 select-all shadow-sm">
                  <span className="text-lg font-mono font-black text-slate-800 tracking-wider">{welcomeData?.custom_coupon || partner.coupon}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">Apresente este código no estabelecimento</span>
                <p className="text-[9px] text-slate-400 mt-1 leading-tight">
                  {welcomeData?.expiresAt ? (
                    <>Este cupom é válido até o dia <span className="font-bold">{formattedDate}</span>. Apresente e garanta o seu benefício.</>
                  ) : (
                    <>Este cupom é válido por 07 dias. Apresente até o dia <span className="font-bold">{formattedDate}</span> e garanta o seu benefício.</>
                  )}
                </p>

                {!isGeneratingImage && (
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
                )}
              </motion.div>
            )}
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-2">
          <a 
            href={partner.link}
            target="_blank" 
            rel="noopener noreferrer"
            onMouseDown={() => trackClick('instagram')}
            className="inline-flex items-center justify-center w-full bg-slate-100 group-hover:bg-[#279267] text-slate-800 group-hover:text-white py-2.5 px-2 rounded-xl font-bold text-[11px] transition-colors duration-200 text-center leading-tight"
          >
            Instagram
            <ExternalLink className="ml-1.5 w-3 h-3" />
          </a>
          
          {partner.whatsappLink && (
            <a 
              href={partner.whatsappLink}
              target="_blank" 
              rel="noopener noreferrer"
              onMouseDown={() => trackClick('whatsapp')}
              className="inline-flex items-center justify-center w-full bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white py-2.5 px-2 rounded-xl font-bold text-[11px] transition-colors duration-200 text-center leading-tight"
            >
              WhatsApp
              <MessageCircle className="ml-1.5 w-3 h-3" />
            </a>
          )}

          {partner.googleReviewLink && (
            <a 
              href={partner.googleReviewLink}
              target="_blank" 
              rel="noopener noreferrer"
              onMouseDown={() => trackClick('google')}
              className="inline-flex items-center justify-center w-full bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white py-2.5 px-2 rounded-xl font-bold text-[11px] transition-colors duration-200 border border-blue-100 text-center leading-tight"
            >
              Avaliar Google
              <Star className="ml-1.5 w-3 h-3" />
            </a>
          )}

          {partner.websiteUrl && (
            <a 
              href={partner.websiteUrl}
              target="_blank" 
              rel="noopener noreferrer"
              onMouseDown={() => trackClick('site/vitrine')}
              className="inline-flex items-center justify-center w-full bg-purple-50 hover:bg-purple-600 text-purple-600 hover:text-white py-2.5 px-2 rounded-xl font-bold text-[11px] transition-colors duration-200 border border-purple-100 text-center leading-tight"
            >
              Site/Vitrine
              <Globe className="ml-1.5 w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnerCard;
