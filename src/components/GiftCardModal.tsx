import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, User, Store, CheckCircle2, AlertCircle, X, Download, ShieldCheck, ExternalLink, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Partner, GiftCard } from '../types';
import * as htmlToImage from 'html-to-image';
import OneSignal from 'react-onesignal';
import { getUserIP } from '../lib/ip';
import { logger } from '../lib/logger';
import { formatWhatsApp } from '../lib/format';

interface GiftCardModalProps {
  isOpen: boolean;
  cardNumber: string;
  accessToken?: string;
  onClose: () => void;
  partners: Partner[];
  headerLogo: string | null;
}

type ViewState = 'initial' | 'customer' | 'merchant' | 'success' | 'error';

export default function GiftCardModal({ isOpen, cardNumber, accessToken, onClose, partners, headerLogo }: GiftCardModalProps) {
  const [view, setView] = useState<ViewState>('initial');
  const [whatsapp, setWhatsapp] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expirationDate, setExpirationDate] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeCardData, setActiveCardData] = useState<any>(null);
  const [masterCardData, setMasterCardData] = useState<GiftCard | null>(null);
  const [isUsed, setIsUsed] = useState(false);
  const [isAlreadyUsed, setIsAlreadyUsed] = useState(false);
  const [isLoadingMaster, setIsLoadingMaster] = useState(true);
  const [activeGiftCards, setActiveGiftCards] = useState<any[]>([]);
  const [hasOneSignalId, setHasOneSignalId] = useState(false);
  
  const couponRef = useRef<HTMLDivElement>(null);

  // Filter partners that have gift card enabled
  const giftCardPartners = partners.filter(p => p.giftCardEnabled);
  const selectedPartner = partners.find(p => p.id === selectedPartnerId);

  useEffect(() => {
    if (isOpen && cardNumber) {
      fetchMasterCard();
    }
  }, [isOpen, cardNumber]);

  const fetchMasterCard = async () => {
    setIsLoadingMaster(true);
    try {
      // 1. Check master card existence and status
      const { data, error } = await supabase
        .from('gift_cards')
        .select('*')
        .eq('card_number', cardNumber)
        .maybeSingle();
      
      if (error) throw error;
      
      if (!data) {
        setErrorMessage('Este cartão não foi encontrado em nossa base de dados. Verifique o número e tente novamente.');
        setView('error');
        setIsLoadingMaster(false);
        return;
      }

      setMasterCardData(data);

      // 1.1 Validate access token
      const dbToken = data.access_token;
      
      // If the card has a token in DB, the link MUST provide the correct one
      if (dbToken) {
        if (!accessToken || accessToken !== dbToken) {
          setErrorMessage('Este link de acesso é inválido ou está incompleto. Por favor, utilize o QR Code original do cartão.');
          setView('error');
          setIsLoadingMaster(false);
          return;
        }
      }

      if (!data.is_active) {
        setErrorMessage('Esse cartão não está ativo. Entrar em contato com o suporte Aparece Aí por Aqui, presente no verso do cartão.');
        setView('error');
        setIsLoadingMaster(false);
        return;
      }

    } catch (error) {
      logger.error('Error fetching master card:', error);
    } finally {
      setIsLoadingMaster(false);
    }
  };

  useEffect(() => {
    const cleanWhatsapp = whatsapp.replace(/\D/g, '');
    if (cleanWhatsapp.length === 11) {
      const fetchCustomer = async () => {
        const { data } = await supabase
          .from('customers')
          .select('name, onesignal_id')
          .eq('whatsapp', cleanWhatsapp)
          .maybeSingle();
        
        if (data) {
          setCustomerName(data.name);
          if (data.onesignal_id) {
            setHasOneSignalId(true);
          } else {
            setHasOneSignalId(false);
          }
        } else {
          setCustomerName('');
          setHasOneSignalId(false);
        }
      };
      fetchCustomer();
    } else {
      setCustomerName('');
      setHasOneSignalId(false);
    }
  }, [whatsapp]);

  const handleCustomerClick = async () => {
    if (isLoadingMaster) return;

    if (!masterCardData) {
      setErrorMessage('Este cartão não foi encontrado em nossa base de dados. Verifique o número e tente novamente.');
      setView('error');
      return;
    }

    // 1. Check if card is active in master table
    if (!masterCardData.is_active) {
      setErrorMessage('Esse cartão não está ativo. Entrar em contato com o suporte Aparece Aí por Aqui, presente no verso do cartão.');
      setView('error');
      return;
    }

    // 2. Check if already activated by someone
    setIsProcessing(true);
    try {
      const { data: existing, error } = await supabase
        .from('active_gift_cards')
        .select('*, partners(name)')
        .eq('card_number', cardNumber)
        .eq('used', false)
        .maybeSingle();

      if (error) throw error;

      if (existing) {
        setErrorMessage(`Esse cartão já está ativo para o cliente ${existing.customer_name}, na loja ${existing.partners?.name || 'N/A'}.`);
        setView('error');
      } else {
        setView('customer');
      }
    } catch (error) {
      logger.error('Error checking existing activation:', error);
      alert('Erro ao verificar status do cartão.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActivate = async () => {
    if (!whatsapp || !customerName || !selectedPartnerId || !isAgreed) {
      alert('Por favor, preencha todos os campos e aceite os termos.');
      return;
    }

    setIsProcessing(true);
    try {
      const cleanWhatsapp = whatsapp.replace(/\D/g, '');
      const ip = await getUserIP();
      
      // 1. Check if card is already active
      const { data: existing } = await supabase
        .from('active_gift_cards')
        .select('*')
        .eq('card_number', cardNumber)
        .eq('used', false)
        .maybeSingle();

      if (existing) {
        setErrorMessage('Este cartão já está ativo para outro cliente.');
        setView('error');
        return;
      }

      // 2. Create/Update customer
      let onesignalId = null;
      try {
        if ((window as any).isOneSignalInitialized) {
          await OneSignal.login(cleanWhatsapp);
          OneSignal.User.addTag("whatsapp", cleanWhatsapp);
          OneSignal.User.addTag("name", customerName.trim());

          if (!hasOneSignalId && OneSignal.Notifications.permissionNative === 'default') {
            OneSignal.Notifications.requestPermission().catch(err => {
              console.warn("Aviso: Solicitação de permissão ignorada.", err);
            });
          }
          
          onesignalId = OneSignal.User.onesignalId || 
                        OneSignal.User.PushSubscription?.id || 
                        (OneSignal.User as any).subscriptionId;
                        
          if (!onesignalId) {
              console.log("Aguardando ID do OneSignal...");
              for (let i = 0; i < 25; i++) {
                await new Promise(resolve => setTimeout(resolve, 200));
                const lateId = OneSignal.User.onesignalId || OneSignal.User.PushSubscription?.id || (OneSignal.User as any).subscriptionId;
                if (lateId) {
                  onesignalId = lateId;
                  break;
                }
              }
          }

          if (onesignalId) {
              console.log("ID OneSignal capturado com sucesso:", onesignalId);
          } else {
              console.warn("Aviso: O ID do OneSignal não foi gerado a tempo.");
          }
        }
      } catch (e) {
        console.error("Erro detalhado OneSignal:", e);
      }

      await supabase.from('customers').upsert({
        whatsapp: cleanWhatsapp,
        name: customerName.trim(),
        ...(onesignalId ? { onesignal_id: onesignalId } : {}),
        updated_at: new Date().toISOString()
      }, { onConflict: 'whatsapp' });

      // 3. Activate card
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const { error: activateError } = await supabase.from('active_gift_cards').insert({
        card_number: cardNumber,
        whatsapp: cleanWhatsapp,
        customer_name: customerName,
        partner_id: selectedPartnerId,
        expires_at: expiresAt.toISOString()
      });

      if (activateError) throw activateError;

      setExpirationDate(expiresAt.toLocaleDateString('pt-BR'));
      setView('success');

      // Auto download coupon after a short delay to allow rendering
      setTimeout(downloadCoupon, 1000);

    } catch (error) {
      logger.error('Error activating gift card:', error);
      alert('Erro ao ativar o cartão. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleValidate = async () => {
    if (isLoadingMaster) return;

    if (!masterCardData) {
      setErrorMessage('Este cartão não foi encontrado em nossa base de dados.');
      setView('error');
      return;
    }

    if (!masterCardData.is_active) {
      setErrorMessage('Esse cartão não está ativo. Entrar em contato com o suporte Aparece Aí por Aqui, presente no verso do cartão.');
      setView('error');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase
        .from('active_gift_cards')
        .select('*, partners(name)')
        .eq('card_number', cardNumber)
        .eq('used', false)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setErrorMessage('Este cartão não está ativo para nenhum cliente no momento. Solicite ao cliente para ativar antes de utilizar.');
        setView('error');
      } else {
        setActiveCardData(data);
        setIsUsed(data.used);
        setView('merchant');
      }
    } catch (error) {
      logger.error('Error validating gift card:', error);
      alert('Erro ao validar o cartão.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmUsage = async () => {
    if (isUsed || !activeCardData) return;
    
    setIsProcessing(true);
    try {
      const { error: activeError } = await supabase
        .from('active_gift_cards')
        .update({ 
          used: true, 
          used_at: new Date().toISOString() 
        })
        .eq('id', activeCardData.id);

      if (activeError) throw activeError;

      const { error: masterError } = await supabase
        .from('gift_cards')
        .update({
          is_active: false
        })
        .eq('card_number', cardNumber);

      if (masterError) throw masterError;

      setIsUsed(true);
      alert('Cartão marcado como utilizado com sucesso!');
    } catch (error) {
      logger.error('Error confirming card usage:', error);
      alert('Erro ao confirmar utilização.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadCoupon = async () => {
    if (!couponRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(couponRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      const now = new Date();
      const timeSuffix = `${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
      
      const link = document.createElement('a');
      link.download = `cupom-presente-${cardNumber}-${timeSuffix}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      logger.error('Error generating coupon image:', error);
    }
  };

  if (!isOpen) return null;

  if (isLoadingMaster) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm">
        <div className="w-12 h-12 border-4 border-[#279267] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden relative my-auto max-h-[95vh] flex flex-col"
      >
        {/* Header Background */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-[#279267] to-[#1e7a54] -z-10" />
        
        <div className="p-8 overflow-y-auto">
          {view === 'initial' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6 -mt-4">
                <Gift className="text-[#279267] w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Seja bem vindo!</h2>
              <p className="text-slate-700 text-sm mb-8 leading-relaxed">
                Seja bem vindo à Vitrine Aparece Aí por Aqui. Acesse os botões abaixo para ativar/validar o seu Cartão presente {cardNumber}.
              </p>
              
              <div className="space-y-4">
                <button 
                  onClick={handleCustomerClick}
                  disabled={isLoadingMaster}
                  className="w-full py-4 bg-white text-[#279267] font-black rounded-2xl shadow-lg hover:bg-slate-50 transition-all flex items-center justify-center space-x-3 border-2 border-transparent hover:border-[#279267]/10 disabled:opacity-50"
                >
                  <User size={20} />
                  <span>SOU CLIENTE E QUERO ATIVAR</span>
                </button>
                
                <button 
                  onClick={handleValidate}
                  className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center space-x-3"
                >
                  <Store size={20} />
                  <span>SOU COMERCIANTE E QUERO VALIDAR</span>
                </button>
                
                <button 
                  onClick={onClose}
                  className="w-full py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center space-x-3"
                >
                  <ExternalLink size={20} />
                  <span>ACESSAR VITRINE</span>
                </button>
              </div>
            </div>
          )}

          {view === 'customer' && (
            <div>
              <div className="flex items-center space-x-4 mb-8">
                <div className="bg-white p-3 rounded-2xl shadow-lg">
                  <Gift className="text-[#279267] w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Ativar Cartão</h2>
                  <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Número: {cardNumber}</p>
                </div>
              </div>

              <div className="space-y-4 mt-12">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Número do Cartão</label>
                  <input 
                    type="text" 
                    value={cardNumber} 
                    readOnly 
                    className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-500 font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Valor do Cartão</label>
                  <div className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-[#279267] font-black text-xl">
                    {masterCardData?.value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(masterCardData.value) : 'R$ 0,00'}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Seu WhatsApp</label>
                  <input 
                    type="tel" 
                    placeholder="(00) 00000-0000"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-[#279267] focus:border-transparent transition-all"
                  />
                </div>

                {whatsapp.replace(/\D/g, '').length === 11 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="overflow-hidden"
                  >
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Seu Nome</label>
                    <input 
                      type="text" 
                      placeholder="Como podemos te chamar?"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-[#279267] focus:border-transparent transition-all"
                    />
                  </motion.div>
                )}

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Onde vai usar?</label>
                  <select 
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-[#279267] focus:border-transparent transition-all appearance-none"
                  >
                    <option value="">Selecione um parceiro...</option>
                    {giftCardPartners.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col space-y-4 p-5 bg-amber-50 rounded-3xl border border-amber-100">
                    <div className="flex items-center space-x-3 text-amber-700">
                      <div className="bg-amber-100 p-2 rounded-xl">
                        <Info size={18} className="font-bold" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-wider">Aviso de Coleta de Dados</span>
                    </div>
                    <p className="text-[11px] text-amber-800/80 leading-relaxed font-medium">
                      Seus dados serão coletados e utilizados para fins publicitários e informativos sobre promoções e benefícios locais, conforme nossa <a href="#/privacidade" target="_blank" className="text-amber-900 font-bold underline">Política de Privacidade</a> e <a href="#/termos" target="_blank" className="text-amber-900 font-bold underline">Termos de Uso</a>.
                    </p>
                  </div>

                  <div className="flex items-start space-x-3 p-5 bg-slate-50 rounded-3xl border border-slate-100 group cursor-pointer" onClick={() => setIsAgreed(!isAgreed)}>
                    <div className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isAgreed ? 'bg-[#279267] border-[#279267]' : 'border-slate-300 bg-white'}`}>
                      {isAgreed && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                    <label className="text-[11px] text-slate-600 leading-relaxed font-semibold cursor-pointer select-none">
                      Estou ciente e autorizo a coleta e uso dos meus dados, bem como o recebimento de notificações no navegador, conforme a Política de Privacidade e Termos de Uso.
                    </label>
                  </div>
                </div>

                <button 
                  onClick={handleActivate}
                  disabled={isProcessing || whatsapp.replace(/\D/g, '').length !== 11 || !customerName.trim() || !selectedPartnerId || !isAgreed}
                  className="w-full py-5 bg-[#279267] text-white font-black rounded-2xl shadow-xl shadow-green-500/20 hover:bg-[#1e7a54] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  {isProcessing ? 'PROCESSANDO...' : 'ATIVAR CARTÃO PRESENTE'}
                </button>
              </div>
            </div>
          )}

          {view === 'merchant' && activeCardData && (
            <div>
              <div className="flex items-center space-x-4 mb-8">
                <div className="bg-white p-3 rounded-2xl shadow-lg">
                  <ShieldCheck className="text-[#279267] w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Validar Cartão</h2>
                  <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Número: {cardNumber}</p>
                </div>
              </div>

              <div className="space-y-4 mt-12">
                <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center space-x-3 mb-6">
                  <CheckCircle2 className="text-[#279267]" />
                  <span className="text-sm font-bold text-[#279267]">Cartão Ativo e Válido</span>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Cliente</label>
                  <div className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold">
                    {activeCardData.customer_name}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">WhatsApp</label>
                  <div className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold">
                    {formatWhatsApp(activeCardData.whatsapp)}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Data de Expiração</label>
                  <div className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold">
                    {new Date(activeCardData.expires_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-5 bg-slate-900 text-white rounded-2xl shadow-xl mt-6">
                  <input 
                    type="checkbox" 
                    id="confirm-use"
                    checked={isUsed}
                    onChange={handleConfirmUsage}
                    disabled={isUsed || isProcessing}
                    className="w-6 h-6 rounded border-white/20 text-[#279267] focus:ring-[#279267] bg-slate-800"
                  />
                  <label htmlFor="confirm-use" className="font-black text-sm uppercase tracking-tight">
                    {isUsed ? 'CARTÃO JÁ UTILIZADO' : 'CONFIRMAR UTILIZAÇÃO NA LOJA'}
                  </label>
                </div>

                <button 
                  onClick={onClose}
                  className="w-full py-4 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors mt-4"
                >
                  FECHAR VALIDAÇÃO
                </button>
              </div>
            </div>
          )}

          {view === 'success' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="text-[#279267] w-12 h-12" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Cartão Ativado!</h2>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                Seu cartão presente foi ativado com sucesso e é válido até <span className="font-black text-[#279267]">{expirationDate}</span> (7 dias).<br/>
                <span className="text-xs font-bold text-slate-400 mt-2 block">Seu cupom já está disponível na sua galeria e deve apresentar ao lojista.</span>
              </p>

              {/* Hidden Coupon for Screenshot */}
              <div className="fixed left-[-9999px]">
                <div ref={couponRef} className="w-[400px] p-8 bg-white border-4 border-[#279267] rounded-[2rem] text-center">
                  <div className="mb-6">
                    {headerLogo ? (
                      <img 
                        src={headerLogo} 
                        alt="Logo" 
                        className="h-16 mx-auto object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Gift className="text-[#279267] w-16 h-16 mx-auto" />
                    )}
                  </div>
                  <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tighter">CARTÃO PRESENTE</h1>
                  <div className="bg-slate-900 text-white py-3 px-6 rounded-2xl inline-block mb-6">
                    <span className="text-2xl font-black tracking-[0.3em]">{cardNumber}</span>
                  </div>
                  <div className="space-y-2 mb-8 text-left bg-slate-50 p-6 rounded-2xl">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</p>
                        <p className="text-xl font-black text-[#279267]">
                          {masterCardData?.value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(masterCardData.value) : 'R$ 0,00'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loja</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{selectedPartner?.name || 'N/A'}</p>
                      </div>
                    </div>

                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</p>
                    <p className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">{customerName}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Válido até</p>
                    <p className="text-xl font-bold text-[#c54b4b]">{expirationDate}</p>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    Apresente este cupom no estabelecimento escolhido para validar seu benefício.
                    Sujeito aos termos de uso do Aparece Aí Por Aqui.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={onClose}
                  className="w-full py-4 bg-[#279267] text-white font-black rounded-2xl shadow-lg hover:bg-[#1e7a54] transition-all"
                >
                  IR PARA A VITRINE
                </button>
              </div>
            </div>
          )}

          {view === 'error' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="text-[#c54b4b] w-12 h-12" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Ops! Algo deu errado</h2>
              <p className="text-slate-500 text-sm mb-8">{errorMessage}</p>
              
              <div className="space-y-4">
                {(!isAlreadyUsed && masterCardData?.is_active) && (
                  <button 
                    onClick={() => setView('initial')}
                    className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-lg hover:bg-slate-800 transition-all"
                  >
                    TENTAR NOVAMENTE
                  </button>
                )}
                
                <button 
                  onClick={onClose}
                  className="w-full py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all"
                >
                  ACESSAR VITRINE
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
