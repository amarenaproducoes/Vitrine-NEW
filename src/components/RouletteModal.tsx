import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Sparkles, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { CashbackConfig } from '../types';
import { logger } from '../lib/logger';
import { supabase } from '../lib/supabase';

interface RouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeName: string;
  configs: CashbackConfig[];
  onWin: (value: number, whatsapp: string, name: string, label: string) => void;
}

const RouletteModal: React.FC<RouletteModalProps> = ({ isOpen, onClose, storeName, configs, onWin }) => {
  const [step, setStep] = useState<'form' | 'wheel'>('form');
  const [whatsapp, setWhatsapp] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [hasOneSignalId, setHasOneSignalId] = useState(false);
  const [isSearchingName, setIsSearchingName] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [result, setResult] = useState<CashbackConfig | null>(null);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  const spin = () => {
    if (isSpinning || configs.length === 0) return;

    setIsSpinning(true);
    
    // Calculate result based on probability
    const totalProb = configs.reduce((acc, curr) => acc + curr.probability, 0);
    let random = Math.random() * totalProb;
    let selected: CashbackConfig = configs[0];
    
    for (const config of configs) {
      if (random < config.probability) {
        selected = config;
        break;
      }
      random -= config.probability;
    }

    // Calculate rotation
    const index = configs.indexOf(selected);
    const segmentAngle = 360 / configs.length;
    const extraSpins = 5 + Math.floor(Math.random() * 5);
    const targetRotation = rotation + (extraSpins * 360) + (360 - (index * segmentAngle)) - (segmentAngle / 2);
    
    setRotation(targetRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setResult(selected);
      onWin(selected.value, whatsapp, customerName, selected.label);
      
      // Save spin time for rate limiting
      localStorage.setItem('last_roulette_spin', Date.now().toString());
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#279267', '#c54b4b', '#ffffff']
      });
    }, 4000);
  };

  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    let formatted = numbers;
    if (numbers.length > 0) {
      formatted = `(${numbers.slice(0, 2)}`;
      if (numbers.length > 2) {
        formatted += `) ${numbers.slice(2, 7)}`;
      }
      if (numbers.length > 7) {
        formatted += `-${numbers.slice(7, 11)}`;
      }
    }
    return formatted;
  };

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsApp(e.target.value);
    setWhatsapp(formatted);
    
    const cleanWhatsapp = formatted.replace(/\D/g, '');
    // Clear name and stop searching if WhatsApp changes
    setCustomerName('');
    setHasOneSignalId(false);
    setIsSearchingName(false);
  };

  useEffect(() => {
    const searchName = async () => {
      const cleanWhatsapp = whatsapp.replace(/\D/g, '');
      if (cleanWhatsapp.length === 11) {
        setIsSearchingName(true);
        try {
          const { data, error } = await supabase
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
            setCustomerName('');
            setHasOneSignalId(false);
          }
        } catch (error) {
          logger.error('Error searching customer name:', error);
        } finally {
          setIsSearchingName(false);
        }
      }
    };
    searchName();
  }, [whatsapp]);

  if (!isOpen) return null;

  const isWhatsappValid = whatsapp.replace(/\D/g, '').length === 11;
  const isFormValid = isWhatsappValid && customerName.trim().length > 0 && hasConsented;

  const handleUnlockWheel = async () => {
    if (!isFormValid) {
      if (!isWhatsappValid) alert('Por favor, insira um WhatsApp válido.');
      else if (customerName.trim().length === 0) alert('Por favor, insira seu nome completo.');
      else if (!hasConsented) alert('Você precisa aceitar os termos para continuar.');
      return;
    }

    // Save/Update customer name
    try {
      const cleanWhatsapp = whatsapp.replace(/\D/g, '');
      
      let onesignalId = null;
      try {
        if (window.OneSignal) {
          // Add tags immediately so they are queued
          window.OneSignal.User.addTag("whatsapp", cleanWhatsapp);
          window.OneSignal.User.addTag("name", customerName.trim());

          // Trigger native prompt if not already subscribed, with a 5-second timeout
          if (!hasOneSignalId) {
            await Promise.race([
              window.OneSignal.Notifications.requestPermission(),
              new Promise(resolve => setTimeout(resolve, 5000))
            ]);
          }
          
          // Try to get the ID, wait up to 5 seconds if permission is granted but ID is not yet available
          for (let i = 0; i < 25; i++) {
            const subId = window.OneSignal.User?.PushSubscription?.id;
            if (subId) {
              onesignalId = subId;
              console.log("OneSignal ID capturado com sucesso:", onesignalId);
              break;
            }
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
          if (!onesignalId) {
            console.warn("Não foi possível capturar o OneSignal ID a tempo. O ID pode ser gerado em segundo plano.");
          }
        }
      } catch (e) {
        console.error("OneSignal tag error", e);
      }

      const { error } = await supabase
        .from('customers')
        .upsert({ 
          whatsapp: cleanWhatsapp, 
          name: customerName.trim(),
          ...(onesignalId ? { onesignal_id: onesignalId } : {}),
          updated_at: new Date().toISOString()
        }, { onConflict: 'whatsapp' });
      
      if (error) throw error;

      // Update name in all previous logs for this WhatsApp to ensure consistency
      await Promise.all([
        supabase.from('cashback_logs').update({ customer_name: customerName.trim() }).eq('whatsapp', cleanWhatsapp),
        supabase.from('unlocked_coupons').update({ customer_name: customerName.trim() }).eq('whatsapp', cleanWhatsapp),
        supabase.from('partner_shares').update({ customer_name: customerName.trim() }).eq('whatsapp_number', cleanWhatsapp)
      ]);
    } catch (error) {
      logger.error('Error saving customer name:', error);
    }

    // Rate Limiting: Check for local cooldown (5 minutes)
    const lastSpin = localStorage.getItem('last_roulette_spin');
    const now = Date.now();
    if (lastSpin && now - parseInt(lastSpin) < 300000) {
      const remaining = Math.ceil((300000 - (now - parseInt(lastSpin))) / 60000);
      alert(`Aguarde ${remaining} minuto(s) para girar a roleta novamente.`);
      return;
    }

    if (executeRecaptcha && import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
      try {
        const token = await executeRecaptcha('unlock_wheel');
        if (token) {
          setStep('wheel');
        } else {
          setStep('wheel'); // Fallback
        }
      } catch (error) {
        logger.error('ReCAPTCHA error:', error);
        setStep('wheel'); // Fallback
      }
    } else {
      setStep('wheel');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 backdrop-blur-sm">
      <div className="min-h-full flex items-center justify-center p-4 py-8">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl max-w-md w-full relative"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors z-10"
          >
            <X size={24} className="text-slate-400" />
          </button>

          <div className="p-6 md:p-8 text-center">
            <AnimatePresence mode="wait">
              {step === 'form' ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="bg-green-50 p-4 rounded-2xl mb-4">
                    <Sparkles className="text-[#279267] w-8 h-8 mx-auto mb-2" />
                    <h2 className="text-xl font-black text-slate-900">Quase lá!</h2>
                    <p className="text-slate-600 text-sm">Identifique-se para liberar a roleta de prêmios.</p>
                  </div>

                  <div className="space-y-4 text-left">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                        Seu WhatsApp
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                          type="tel"
                          placeholder="(00) 00000-0000"
                          value={whatsapp}
                          onChange={handleWhatsappChange}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#279267] focus:bg-white outline-none transition-all font-bold text-slate-900"
                        />
                      </div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ 
                        opacity: isWhatsappValid ? 1 : 0,
                        height: isWhatsappValid ? 'auto' : 0
                      }}
                      className="overflow-hidden"
                    >
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                        Seu Nome Completo
                      </label>
                      <div className="relative">
                        <input 
                          type="text"
                          placeholder="Digite seu nome e sobrenome..."
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          disabled={isSearchingName}
                          className={`w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#279267] focus:bg-white outline-none transition-all font-bold text-slate-900 ${isSearchingName ? 'opacity-50' : ''}`}
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
                    </motion.div>

                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
                      <AlertCircle className="text-amber-600 w-5 h-5 shrink-0" />
                      <p className="text-[10px] leading-relaxed text-amber-800 font-medium">
                        <strong>AVISO DE COLETA DE DADOS:</strong> Seus dados serão coletados e utilizados para fins publicitários e informativos sobre promoções e benefícios locais, conforme nossa <Link to="/politica-de-privacidade" className="underline font-bold hover:text-[#279267]">Política de Privacidade</Link> e <Link to="/termos-de-uso" className="underline font-bold hover:text-[#279267]">Termos de Uso</Link>.
                      </p>
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative mt-1">
                        <input 
                          type="checkbox"
                          checked={hasConsented}
                          onChange={(e) => setHasConsented(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${hasConsented ? 'bg-[#279267] border-[#279267]' : 'bg-white border-slate-200 group-hover:border-slate-300'}`}>
                          {hasConsented && <CheckCircle2 className="text-white w-4 h-4" />}
                        </div>
                      </div>
                      <span className="text-xs text-slate-600 font-medium leading-tight">
                        Estou ciente e autorizo a coleta e uso dos meus dados, bem como o recebimento de notificações no navegador, conforme a Política de Privacidade e Termos de Uso.
                      </span>
                    </label>
                  </div>

                  <button 
                    onClick={handleUnlockWheel}
                    className={`w-full py-4 rounded-2xl font-black text-lg shadow-lg transition-all transform flex items-center justify-center gap-2 ${isFormValid ? 'bg-[#279267] text-white hover:bg-green-700 hover:scale-[1.02]' : 'bg-slate-100 text-slate-400'}`}
                  >
                    LIBERAR ROLETA
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="wheel"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="mb-6">
                    <h2 className="text-2xl font-black text-slate-900 mb-2">
                      Bem-vindo à {storeName}!
                    </h2>
                    <p className="text-slate-500 font-medium text-sm md:text-base">
                      Gire a roleta e garanta seu cashback nesta compra!
                    </p>
                  </div>

                  <div className="relative w-64 h-64 sm:w-72 sm:h-72 mx-auto mb-8">
                    {/* Pointer */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                      <div className="w-8 h-8 bg-[#c54b4b] rotate-45 rounded-sm shadow-lg border-2 border-white" />
                    </div>

                    {/* Wheel */}
                    <motion.div 
                      ref={wheelRef}
                      animate={{ rotate: rotation }}
                      transition={{ duration: 4, ease: [0.45, 0.05, 0.55, 0.95] }}
                      className="w-full h-full rounded-full border-8 border-slate-900 relative overflow-hidden shadow-2xl"
                      style={{
                        background: `conic-gradient(${configs.map((_, i) => {
                          const start = i * (360 / configs.length);
                          const end = (i + 1) * (360 / configs.length);
                          const color = i % 2 === 0 ? '#279267' : '#c54b4b';
                          return `${color} ${start}deg ${end}deg`;
                        }).join(', ')})`
                      }}
                    >
                      {configs.map((config, i) => {
                        const angle = 360 / configs.length;
                        const sliceCenter = i * angle + angle / 2;
                        return (
                          <div 
                            key={config.id}
                            className="absolute inset-0 flex items-start justify-center pt-8 sm:pt-10"
                            style={{ transform: `rotate(${sliceCenter}deg)` }}
                          >
                            <span className="text-white font-black text-xl sm:text-2xl drop-shadow-md whitespace-nowrap">
                              {config.label}
                            </span>
                          </div>
                        );
                      })}
                      {/* Center point */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full border-4 border-slate-900 z-10 shadow-inner" />
                    </motion.div>
                  </div>

                  <AnimatePresence mode="wait">
                    {result ? (
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="space-y-4"
                      >
                        <div className="bg-green-50 p-4 sm:p-6 rounded-2xl border-2 border-green-200">
                          <div className="flex justify-center mb-2">
                            <Trophy className="text-green-600 w-10 h-10 sm:w-12 sm:h-12" />
                          </div>
                          <h3 className="text-xl sm:text-2xl font-black text-green-700">
                            Parabéns! Você ganhou {result.label}
                          </h3>
                          <p className="text-green-600 font-bold mt-2 text-sm sm:text-base">
                            Apresente esta tela ao lojista para garantir seu cashback imediato!
                          </p>
                        </div>
                        <button 
                          onClick={onClose}
                          className="w-full py-3 sm:py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
                        >
                          Continuar para a Vitrine
                        </button>
                      </motion.div>
                    ) : (
                      <button 
                        onClick={spin}
                        disabled={isSpinning}
                        className={`w-full py-3 sm:py-4 ${isSpinning ? 'bg-slate-200 text-slate-400' : 'bg-[#279267] text-white hover:bg-green-700'} font-black text-lg sm:text-xl rounded-2xl shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2`}
                      >
                        {isSpinning ? 'Girando...' : (
                          <>
                            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                            GIRAR AGORA!
                          </>
                        )}
                      </button>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RouletteModal;
