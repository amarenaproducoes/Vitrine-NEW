import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Gift, CheckCircle2, AlertCircle, Share2, Phone, User, ShieldCheck, 
  Sparkles, Lock, ExternalLink, ArrowRight, RefreshCw, Printer, Search, Store
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Partner, SequenceComboPartner, SequenceComboCoupon, SequenceComboLead } from '../types';

interface SequenceComboPageProps {
  partners: Partner[];
  headerLogo?: string | null;
}

// Phone mask helper for Brazilian numbers
const formatPhoneMask = (val: string) => {
  const digits = val.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

export const SequenceComboPage: React.FC<SequenceComboPageProps> = ({ partners, headerLogo }) => {
  const { token, resgateToken } = useParams<{ token?: string; resgateToken?: string }>();
  const navigate = useNavigate();

  // Mode detection
  const isFriendUnlockMode = Boolean(token);
  const isResgateMode = Boolean(resgateToken);
  const isInitiatorMode = !isFriendUnlockMode && !isResgateMode;

  // Active combo partners state
  const [comboPartners, setComboPartners] = useState<SequenceComboPartner[]>([]);
  const [loadingComboPartners, setLoadingComboPartners] = useState(true);
  const [selectedComboPartnerId, setSelectedComboPartnerId] = useState<string>('');

  // Initiator Form State
  const [initiatorPhone, setInitiatorPhone] = useState('');
  const [initiatorName, setInitiatorName] = useState('');
  const [isInitiatorMember, setIsInitiatorMember] = useState(false);
  const [initiatorCheckingMember, setInitiatorCheckingMember] = useState(false);
  const [initiatorTermsAccepted, setInitiatorTermsAccepted] = useState(false);
  const [initiatorStep, setInitiatorStep] = useState<'input' | 'awaiting_friend' | 'unlocked'>('input');
  const [existingCouponNotice, setExistingCouponNotice] = useState<'active' | 'unlocked' | null>(null);

  // Current Coupon State
  const [currentCoupon, setCurrentCoupon] = useState<SequenceComboCoupon | null>(null);
  const [loadingCoupon, setLoadingCoupon] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Friend details for Stage 1 (filled by initiator)
  const [friendPhone, setFriendPhone] = useState('');
  const [friendFirstName, setFriendFirstName] = useState('');
  const [isFriendMember, setIsFriendMember] = useState(false);
  const [friendMemberChecking, setFriendMemberChecking] = useState(false);
  const [stage1WarningAccepted, setStage1WarningAccepted] = useState(false);

  // Friend details for Stage 2 (filled by friend on unlock screen)
  const [friendFullName, setFriendFullName] = useState('');
  const [friendTermsAccepted, setFriendTermsAccepted] = useState(false);
  const [friendIsAlreadyMember, setFriendIsAlreadyMember] = useState(false);
  const [stage2WarningAccepted, setStage2WarningAccepted] = useState(false);
  const [friendUnlockedSuccess, setFriendUnlockedSuccess] = useState(false);

  // Submitting state
  const [submitting, setSubmitting] = useState(false);

  // Helper clean phone
  const cleanPhone = (phone: string) => phone.replace(/\D/g, '');

  // Helper check sequence
  const phoneHasSequence = (phone: string, pattern: string = '22') => {
    const cleaned = cleanPhone(phone);
    return cleaned.includes(pattern);
  };

  // Selected combo partner object
  const selectedComboPartner = useMemo(() => {
    return comboPartners.find(p => p.id === selectedComboPartnerId) || comboPartners[0];
  }, [comboPartners, selectedComboPartnerId]);

  // Selected pattern
  const currentPattern = selectedComboPartner?.sequence_pattern || '22';

  // Check if initiator phone has sequence
  const initiatorHasSeq = useMemo(() => {
    return phoneHasSequence(initiatorPhone, currentPattern);
  }, [initiatorPhone, currentPattern]);

  // Load Active Combo Partners on mount (NO FALLBACK IF NONE ACTIVE!)
  useEffect(() => {
    const fetchComboPartners = async () => {
      setLoadingComboPartners(true);
      try {
        const { data, error } = await supabase
          .from('sequence_combo_partners')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching sequence combo partners:', error);
          setComboPartners([]);
        } else if (data && data.length > 0) {
          setComboPartners(data);
          setSelectedComboPartnerId(data[0].id);
        } else {
          // Rule: If no active campaign, do NOT show partners!
          setComboPartners([]);
        }
      } catch (err) {
        console.error('Failed to load combo partners', err);
        setComboPartners([]);
      } finally {
        setLoadingComboPartners(false);
      }
    };

    fetchComboPartners();
  }, []);

  // Real-time check for Initiator Phone (Member lookup + Active coupon lookup)
  useEffect(() => {
    if (!isInitiatorMode) return;
    const cleanWsp = cleanPhone(initiatorPhone);

    if (cleanWsp.length === 11) {
      const runChecks = async () => {
        setInitiatorCheckingMember(true);
        setExistingCouponNotice(null);

        try {
          // 1. Check if member in customers table
          const { data: custData } = await supabase
            .from('customers')
            .select('name')
            .eq('whatsapp', cleanWsp)
            .maybeSingle();

          if (custData) {
            setIsInitiatorMember(true);
            setInitiatorName(custData.name || '');
            setInitiatorTermsAccepted(true);
          } else {
            setIsInitiatorMember(false);
          }

          // 2. Check if existing active or unlocked coupon for this initiator phone
          const { data: couponData } = await supabase
            .from('sequence_combo_coupons')
            .select('*')
            .eq('initiator_whatsapp', cleanWsp)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (couponData) {
            setCurrentCoupon(couponData as SequenceComboCoupon);
            if (couponData.status === 'unlocked') {
              setExistingCouponNotice('unlocked');
            } else {
              setExistingCouponNotice('active');
            }
          }
        } catch (err) {
          console.error('Error in initiator phone check:', err);
        } finally {
          setInitiatorCheckingMember(false);
        }
      };

      runChecks();
    } else {
      setIsInitiatorMember(false);
      setExistingCouponNotice(null);
    }
  }, [initiatorPhone, isInitiatorMode]);

  // Real-time check if friend phone entered by initiator is already a member
  useEffect(() => {
    const cleaned = cleanPhone(friendPhone);
    if (cleaned.length === 11) {
      setFriendMemberChecking(true);
      const checkMember = async () => {
        try {
          const { data } = await supabase
            .from('customers')
            .select('name')
            .eq('whatsapp', cleaned)
            .maybeSingle();
          setIsFriendMember(Boolean(data));
        } catch {
          setIsFriendMember(false);
        } finally {
          setFriendMemberChecking(false);
        }
      };
      checkMember();
    } else {
      setIsFriendMember(false);
    }
  }, [friendPhone]);

  // Load Coupon when in Friend Unlock Mode (/v/:token)
  useEffect(() => {
    if (!isFriendUnlockMode || !token) return;

    const loadFriendCoupon = async () => {
      setLoadingCoupon(true);
      setErrorMessage('');
      try {
        const { data, error } = await supabase
          .from('sequence_combo_coupons')
          .select('*')
          .eq('token', token)
          .maybeSingle();

        if (error || !data) {
          setErrorMessage('Cupom não encontrado ou link de desbloqueio inválido.');
        } else {
          setCurrentCoupon(data as SequenceComboCoupon);
          if (data.status === 'unlocked') {
            setFriendUnlockedSuccess(true);
            if (data.friend_full_name) setFriendFullName(data.friend_full_name);
          }

          // Check if friend is already a member in customers table
          if (data.friend_whatsapp) {
            const cleanWsp = cleanPhone(data.friend_whatsapp);
            const { data: custData } = await supabase
              .from('customers')
              .select('name')
              .eq('whatsapp', cleanWsp)
              .maybeSingle();

            if (custData) {
              setFriendIsAlreadyMember(true);
              setFriendFullName(custData.name);
              setFriendTermsAccepted(true);
            }
          }
        }
      } catch (err) {
        console.error('Error loading coupon for friend:', err);
        setErrorMessage('Erro ao carregar dados do cupom.');
      } finally {
        setLoadingCoupon(false);
      }
    };

    loadFriendCoupon();
  }, [isFriendUnlockMode, token]);

  // Load Coupon when in Resgate Mode (/resgate/:resgateToken)
  useEffect(() => {
    if (!isResgateMode || !resgateToken) return;

    const loadResgateCoupon = async () => {
      setLoadingCoupon(true);
      setErrorMessage('');
      try {
        const { data, error } = await supabase
          .from('sequence_combo_coupons')
          .select('*')
          .eq('resgate_token', resgateToken)
          .maybeSingle();

        if (error || !data) {
          setErrorMessage('Link de resgate inválido ou cupom não encontrado.');
        } else {
          setCurrentCoupon(data as SequenceComboCoupon);
        }
      } catch (err) {
        console.error('Error loading resgate coupon:', err);
        setErrorMessage('Erro ao carregar dados de resgate do cupom.');
      } finally {
        setLoadingCoupon(false);
      }
    };

    loadResgateCoupon();
  }, [isResgateMode, resgateToken]);

  // Handle Initiator Submit (Start Coupon)
  const handleInitiatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanWsp = cleanPhone(initiatorPhone);

    if (cleanWsp.length !== 11) {
      alert('Por favor, insira um número de WhatsApp válido com DDD (11 dígitos).');
      return;
    }
    if (!selectedComboPartner) {
      alert('Selecione um parceiro participante.');
      return;
    }

    // Check existing active / unlocked coupon block
    if (existingCouponNotice === 'active') {
      setInitiatorStep('awaiting_friend');
      return;
    }
    if (existingCouponNotice === 'unlocked') {
      setInitiatorStep('unlocked');
      return;
    }

    if (!initiatorName.trim()) {
      alert('Por favor, informe seu nome completo.');
      return;
    }

    if (!isInitiatorMember && !initiatorTermsAccepted) {
      alert('Por favor, aceite os Termos de Uso e Política de Privacidade para se cadastrar.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      // 1. Register initiator in customers table if non-member
      if (!isInitiatorMember) {
        await supabase.from('customers').upsert({
          whatsapp: cleanWsp,
          name: initiatorName.trim(),
          created_at: new Date().toISOString()
        }, { onConflict: 'whatsapp' });
      }

      // 2. Create coupon record
      const pattern = currentPattern;
      const hasSeq = phoneHasSequence(cleanWsp, pattern);
      const generatedToken = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 8);
      const generatedResgateToken = 'r_' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 8);
      const couponCode = `SEQ${pattern}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      const newCouponPayload: SequenceComboCoupon = {
        id: 'c_' + Math.random().toString(36).substring(2, 9),
        token: generatedToken,
        resgate_token: generatedResgateToken,
        initiator_whatsapp: cleanWsp,
        initiator_name: initiatorName.trim(),
        initiator_has_sequence: hasSeq,
        partner_id: selectedComboPartner.partner_id,
        partner_name: selectedComboPartner.partner_name,
        benefit_description: selectedComboPartner.benefit_description,
        sequence_pattern: pattern,
        coupon_code: couponCode,
        status: 'awaiting_friend',
        created_at: new Date().toISOString()
      };

      const { data: createdData, error: createError } = await supabase
        .from('sequence_combo_coupons')
        .insert(newCouponPayload)
        .select()
        .single();

      if (createError) {
        console.error('Error creating combo coupon:', createError);
        setCurrentCoupon(newCouponPayload as SequenceComboCoupon);
      } else {
        setCurrentCoupon(createdData as SequenceComboCoupon);
      }

      setInitiatorStep('awaiting_friend');
    } catch (err) {
      console.error('Error initiating sequence coupon:', err);
      alert('Ocorreu um erro ao processar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Initiator Share to Friend
  const handleInitiatorShareToFriend = async () => {
    if (!currentCoupon) return;
    const cleanFriend = cleanPhone(friendPhone);

    if (cleanFriend.length !== 11) {
      alert('Informe o WhatsApp do seu amigo com DDD (11 dígitos).');
      return;
    }
    if (!friendFirstName.trim()) {
      alert('Informe o primeiro nome do seu amigo.');
      return;
    }
    if (!stage1WarningAccepted) {
      alert('Você precisa marcar a caixa de ciente sobre o redirecionamento para o WhatsApp.');
      return;
    }

    setSubmitting(true);
    try {
      // Save lead entry in sequence_combo_leads
      await supabase.from('sequence_combo_leads').upsert({
        coupon_id: currentCoupon.id || null,
        initiator_whatsapp: currentCoupon.initiator_whatsapp,
        friend_whatsapp: cleanFriend,
        friend_first_name: friendFirstName.trim(),
        is_registered_member: isFriendMember,
        updated_at: new Date().toISOString()
      }, { onConflict: 'friend_whatsapp,initiator_whatsapp' });

      // Update sequence_combo_coupons record
      if (currentCoupon.id) {
        await supabase
          .from('sequence_combo_coupons')
          .update({
            friend_whatsapp: cleanFriend,
            friend_first_name: friendFirstName.trim()
          })
          .eq('id', currentCoupon.id);
      }

      // Build WhatsApp share link
      const unlockUrl = `${window.location.origin}/cupom-sequencia/v/${currentCoupon.token}`;
      const partnerName = currentCoupon.partner_name;
      const benefitText = currentCoupon.benefit_description;

      const messageText = `Olá ${friendFirstName.trim()}! Te enviei uma surpresa especial do Aparece Aí por Aqui! 🎁\n\nEu iniciei o resgate de um benefício exclusivo de (${benefitText}) na ${partnerName}.\n\nPara liberar o nosso cupom, acesse o link abaixo para confirmar o desbloqueio da 2ª etapa:\n\n👉 ${unlockUrl}`;

      const waUrl = `https://api.whatsapp.com/send?phone=55${cleanFriend}&text=${encodeURIComponent(messageText)}`;
      window.open(waUrl, '_blank');
    } catch (err) {
      console.error('Error saving friend lead:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Friend Sequence check (when in Stage 2)
  const friendPhoneClean = cleanPhone(currentCoupon?.friend_whatsapp || '');
  const patternForCoupon = currentCoupon?.sequence_pattern || '22';
  const friendHasSeq = phoneHasSequence(friendPhoneClean, patternForCoupon);
  const friendUnlockAllowed = Boolean(currentCoupon?.initiator_has_sequence || friendHasSeq);

  // Handle Friend Submitting Unlock (Stage 2)
  const handleFriendUnlockConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCoupon) return;

    if (!friendUnlockAllowed) {
      alert('Não é possível desbloquear pois nem você nem seu amigo possuem a sequência da sorte no número de celular.');
      return;
    }

    if (!friendIsAlreadyMember && !friendFullName.trim()) {
      alert('Por favor, informe seu nome completo.');
      return;
    }
    if (!friendIsAlreadyMember && !friendTermsAccepted) {
      alert('Você precisa aceitar os Termos de Uso e Política de Privacidade.');
      return;
    }

    setSubmitting(true);
    try {
      const cleanFriendWsp = cleanPhone(currentCoupon.friend_whatsapp || '');

      // 1. Register or update friend in main customers table
      if (!friendIsAlreadyMember) {
        await supabase.from('customers').upsert({
          whatsapp: cleanFriendWsp,
          name: friendFullName.trim(),
          created_at: new Date().toISOString()
        }, { onConflict: 'whatsapp' });
      }

      // 2. Update sequence_combo_leads setting is_registered_member = true
      await supabase
        .from('sequence_combo_leads')
        .update({ is_registered_member: true })
        .eq('friend_whatsapp', cleanFriendWsp);

      // 3. Update sequence_combo_coupons to unlocked status
      const { error: updateErr } = await supabase
        .from('sequence_combo_coupons')
        .update({
          status: 'unlocked',
          friend_full_name: friendFullName.trim(),
          unlocked_at: new Date().toISOString()
        })
        .eq('id', currentCoupon.id);

      if (updateErr) console.error('Error unlocking coupon:', updateErr);

      setCurrentCoupon(prev => prev ? {
        ...prev,
        status: 'unlocked',
        friend_full_name: friendFullName.trim(),
        unlocked_at: new Date().toISOString()
      } : null);

      setFriendUnlockedSuccess(true);
    } catch (err) {
      console.error('Error during friend unlock:', err);
      alert('Ocorreu um erro ao efetuar o desbloqueio. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Friend Sharing BACK to Initiator
  const handleFriendShareBackToInitiator = () => {
    if (!currentCoupon) return;
    if (!stage2WarningAccepted) {
      alert('Você precisa marcar a caixa de ciente sobre o redirecionamento para o WhatsApp.');
      return;
    }

    const initiatorClean = cleanPhone(currentCoupon.initiator_whatsapp);
    const resgateUrl = `${window.location.origin}/cupom-sequencia/resgate/${currentCoupon.resgate_token}`;
    const partnerName = currentCoupon.partner_name;
    const initiatorName = currentCoupon.initiator_name || 'Amigo';

    const messageText = `Olá, ${initiatorName}! Boas notícias! 🎉\n\nEu acabei de desbloquear a 2ª etapa do nosso cupom de desconto na ${partnerName}!\n\nAcesse o link abaixo para visualizar e baixar o seu cupom desbloqueado:\n\n👉 ${resgateUrl}`;

    const waUrl = `https://api.whatsapp.com/send?phone=55${initiatorClean}&text=${encodeURIComponent(messageText)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16 pt-24 md:pt-28">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-500/10 via-emerald-600/5 to-transparent pointer-events-none rounded-b-full blur-3xl" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Banner Title & Explanation */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-bold uppercase tracking-wider mb-4 animate-pulse">
            <Sparkles className="w-4 h-4" /> Promoção Exclusiva da Sorte
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
            Jogo dos Números da Sorte <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
              O Desconto do seu Celular! 📱✨
            </span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            A sequência do seu número de celular libera vantagens incríveis! Se o seu celular possui a combinação da sorte (como a sequência <strong className="text-emerald-400 font-black">22</strong>), você e seu amigo garantem benefícios exclusivos com nossos parceiros!
          </p>
        </div>

        {/* CHECK IF NO CAMPAIGN IS ACTIVE */}
        {!loadingComboPartners && comboPartners.length === 0 && isInitiatorMode && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">Nenhuma Campanha Ativa no Momento</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Nenhuma campanha de Cupom Sequência está ativa no momento. Fique atento às nossas redes sociais para o lançamento das próximas rodadas do Jogo dos Números da Sorte!
            </p>
            <Link
              to="/"
              className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider"
            >
              Voltar para as Ofertas do Aparece Aí
            </Link>
          </div>
        )}

        {/* MODE A: INITIATOR FLOW (/cupom-sequencia) */}
        {isInitiatorMode && (comboPartners.length > 0 || loadingComboPartners) && (
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            {initiatorStep === 'input' && (
              <form onSubmit={handleInitiatorSubmit} className="space-y-6">
                <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-2xl p-4 sm:p-5 flex items-start space-x-3 text-emerald-300 text-xs sm:text-sm">
                  <Gift className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold text-emerald-200 text-sm mb-1">Passo 1: Digite seu celular e selecione o parceiro</strong>
                    Digite seu WhatsApp para validar se seu celular possui a sequência e se você já possui cadastro no sistema.
                  </div>
                </div>

                {/* 1. Initiator WhatsApp First */}
                <div>
                  <label className="block text-sm font-bold text-slate-200 mb-2">
                    1. Digite seu Celular / WhatsApp (com DDD):
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      value={formatPhoneMask(initiatorPhone)}
                      onChange={(e) => setInitiatorPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                {/* Status Indicator & Member Badge */}
                {initiatorCheckingMember && (
                  <div className="text-xs text-slate-400 flex items-center space-x-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verificando seu cadastro e sequência do celular...</span>
                  </div>
                )}

                {/* MEMBER BADGE OR NON-MEMBER INPUTS */}
                {cleanPhone(initiatorPhone).length === 11 && !initiatorCheckingMember && (
                  <div className="space-y-4">
                    {/* Existing active coupon notice */}
                    {existingCouponNotice === 'active' && (
                      <div className="bg-amber-950/60 border border-amber-500/50 rounded-2xl p-4 text-amber-200 text-xs space-y-2">
                        <p className="font-bold text-sm flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                          <span>Solicitação Ativa em Andamento!</span>
                        </p>
                        <p>
                          Você já possui um cupom em andamento aguardando a 2ª etapa pelo seu amigo. Não é permitido criar um novo cupom enquanto houver um ativo.
                        </p>
                        <button
                          type="button"
                          onClick={() => setInitiatorStep('awaiting_friend')}
                          className="px-4 py-2 bg-amber-600 text-white font-bold rounded-xl text-xs uppercase"
                        >
                          Ir para o Envio ao Amigo
                        </button>
                      </div>
                    )}

                    {existingCouponNotice === 'unlocked' && (
                      <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-2xl p-4 text-emerald-200 text-xs space-y-2">
                        <p className="font-bold text-sm flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Cupom Já Desbloqueado!</span>
                        </p>
                        <p>
                          Você já possui um cupom de desconto desbloqueado nesta promoção.
                        </p>
                        {currentCoupon && (
                          <Link
                            to={`/cupom-sequencia/resgate/${currentCoupon.resgate_token}`}
                            className="inline-block px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs uppercase"
                          >
                            Ver Meus Cupons Desbloqueados
                          </Link>
                        )}
                      </div>
                    )}

                    {/* Member Badge Signal */}
                    {isInitiatorMember ? (
                      <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-2xl p-4 flex items-center space-x-3 text-emerald-300 text-xs sm:text-sm font-bold">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <div>
                          <span className="block text-emerald-200 text-sm">Olá, {initiatorName}! 🟢</span>
                          Você é um Membro Oficial do Aparece Aí por Aqui!
                        </div>
                      </div>
                    ) : (
                      /* Non-Member Full Name + Terms */
                      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">
                            Seu Nome Completo (para cadastro):
                          </label>
                          <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="text"
                              value={initiatorName}
                              onChange={(e) => setInitiatorName(e.target.value)}
                              placeholder="Digite seu nome completo"
                              required={!isInitiatorMember}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>

                        <label className="flex items-start space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={initiatorTermsAccepted}
                            onChange={(e) => setInitiatorTermsAccepted(e.target.checked)}
                            required={!isInitiatorMember}
                            className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-700 bg-slate-900 focus:ring-emerald-500"
                          />
                          <span className="text-xs text-slate-300 leading-relaxed">
                            Li e concordo com os <Link to="/termos-de-uso" target="_blank" className="text-emerald-400 underline">Termos de Uso</Link> e <Link to="/politica-de-privacidade" target="_blank" className="text-emerald-400 underline">Política de Privacidade</Link> do Aparece Aí por Aqui.
                          </span>
                        </label>
                      </div>
                    )}

                    {/* Sequence Message feedback */}
                    {initiatorHasSeq ? (
                      <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 text-emerald-300 text-xs sm:text-sm">
                        ✨ <strong>Que sorte!</strong> O seu número de celular possui a sequência da sorte <strong className="text-emerald-200 font-mono font-bold">[{currentPattern}]</strong>! Ao convidar um amigo para a 2ª etapa, o seu amigo <strong>não precisará</strong> ter a sequência para liberar o cupom!
                      </div>
                    ) : (
                      <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 text-amber-200 text-xs sm:text-sm">
                        💡 <strong>Seu número não possui a sequência [{currentPattern}]</strong>, mas não se preocupe! Você ainda pode garantir o desconto convidando um amigo cujo celular tenha essa sequência da sorte!
                      </div>
                    )}
                  </div>
                )}

                {/* Partner Selector */}
                {comboPartners.length > 0 && (
                  <div>
                    <label className="block text-sm font-bold text-slate-200 mb-2">
                      2. Escolha a Oferta / Parceiro:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {comboPartners.map((cp) => (
                        <div
                          key={cp.id}
                          onClick={() => setSelectedComboPartnerId(cp.id)}
                          className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-center space-x-3 ${
                            selectedComboPartnerId === cp.id
                              ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/30'
                              : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-lg flex-shrink-0">
                            {cp.sequence_pattern || '22'}
                          </div>
                          <div className="flex-grow min-w-0">
                            <h4 className="text-white font-bold text-sm truncate">{cp.partner_name}</h4>
                            <p className="text-emerald-400 text-xs font-semibold truncate">{cp.benefit_description}</p>
                          </div>
                          {selectedComboPartnerId === cp.id && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || cleanPhone(initiatorPhone).length !== 11 || Boolean(existingCouponNotice)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 text-base uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Confirmar e Iniciar Desbloqueio</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* INITIATOR STEP 2: AWAITING FRIEND UNLOCK */}
            {initiatorStep === 'awaiting_friend' && currentCoupon && (
              <div className="space-y-6">
                <div className="text-center pb-4 border-b border-slate-800">
                  <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                    <AlertCircle className="w-4 h-4" /> 1ª Etapa Concluída - Aguardando 2ª Etapa
                  </span>
                  <h2 className="text-2xl font-black text-white">Aguardando desbloqueio da 2ª etapa pelo seu amigo</h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Benefício Escolhido: <strong className="text-emerald-400">{currentCoupon.benefit_description}</strong> na <strong>{currentCoupon.partner_name}</strong>
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wide flex items-center space-x-2">
                    <User className="w-4 h-4" /> <span>Informe os dados do amigo para convidar:</span>
                  </h3>

                  {/* Friend WhatsApp Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      WhatsApp do Amigo (com DDD):
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        value={formatPhoneMask(friendPhone)}
                        onChange={(e) => setFriendPhone(e.target.value)}
                        placeholder="(11) 98888-8888"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Friend First Name Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Primeiro Nome do Amigo:
                    </label>
                    <input
                      type="text"
                      value={friendFirstName}
                      onChange={(e) => setFriendFirstName(e.target.value)}
                      placeholder="Ex: Carlos"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Este primeiro nome será usado apenas na mensagem de saudação do WhatsApp e na tabela de leads.
                    </p>
                  </div>

                  {/* Member Badge indicator for friend */}
                  {friendMemberChecking && (
                    <div className="text-xs text-slate-400 flex items-center space-x-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verificando status de membro do amigo...</span>
                    </div>
                  )}

                  {isFriendMember && !friendMemberChecking && (
                    <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-xl p-3 flex items-center space-x-2 text-emerald-300 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Selo de Membro: Este amigo já é membro oficial do Aparece Aí por Aqui! 🟢</span>
                    </div>
                  )}

                  {/* Mandatory Checkbox Warning */}
                  <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3.5 mt-4">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={stage1WarningAccepted}
                        onChange={(e) => setStage1WarningAccepted(e.target.checked)}
                        className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-700 bg-slate-900 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-amber-200/90 leading-relaxed">
                        ⚠️ <strong>Atenção:</strong> Ao clicar em compartilhar, você será redirecionado para o WhatsApp para enviar o desbloqueio para seu amigo. Caso esteja em um computador, certifique-se de que está conectado ao WhatsApp Web. Caso contrário, refaça o processo por um celular que contenha o seu WhatsApp.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Share Button */}
                <button
                  type="button"
                  onClick={handleInitiatorShareToFriend}
                  disabled={!stage1WarningAccepted || !friendFirstName.trim() || cleanPhone(friendPhone).length !== 11 || submitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 text-base uppercase tracking-wider"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Compartilhar no WhatsApp com {friendFirstName.trim() || 'Amigo'}</span>
                </button>
              </div>
            )}

            {/* INITIATOR STEP 3: UNLOCKED STATE */}
            {initiatorStep === 'unlocked' && currentCoupon && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-white">Parabéns! Seu Cupom Já Está Desbloqueado 🎉</h2>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-left space-y-3">
                  <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Cupom de Desconto de Sequência</p>
                  <h3 className="text-xl font-black text-white">{currentCoupon.partner_name}</h3>
                  <p className="text-slate-300 text-sm">{currentCoupon.benefit_description}</p>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-mono">CÓDIGO:</span>
                    <span className="text-lg font-black font-mono text-emerald-400 tracking-wider">{currentCoupon.coupon_code}</span>
                  </div>
                </div>
                <Link
                  to={`/cupom-sequencia/resgate/${currentCoupon.resgate_token}`}
                  className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-3.5 rounded-xl text-sm"
                >
                  <span>Visualizar e Baixar Cupom Completo</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* MODE B: FRIEND UNLOCK FLOW (/cupom-sequencia/v/:token) */}
        {isFriendUnlockMode && (
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            {loadingCoupon ? (
              <div className="text-center py-12 space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                <p className="text-slate-400 text-sm">Carregando dados do convite do seu amigo...</p>
              </div>
            ) : errorMessage ? (
              <div className="text-center py-8 space-y-4">
                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
                <p className="text-rose-300 font-bold">{errorMessage}</p>
                <Link to="/cupom-sequencia" className="inline-block bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold">
                  Ir para a página principal da promoção
                </Link>
              </div>
            ) : currentCoupon && !friendUnlockedSuccess ? (
              <form onSubmit={handleFriendUnlockConfirm} className="space-y-6">
                <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-2xl p-5 text-emerald-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                    🎁 Você recebeu um presente de {currentCoupon.initiator_name || 'um amigo'}!
                  </span>
                  <h3 className="text-lg font-black text-white">{currentCoupon.partner_name}</h3>
                  <p className="text-sm text-emerald-300 font-semibold">{currentCoupon.benefit_description}</p>
                </div>

                {/* Sequence check validation message for Friend */}
                {!friendUnlockAllowed ? (
                  <div className="bg-rose-950/60 border border-rose-500/50 rounded-2xl p-4 text-rose-200 text-xs sm:text-sm space-y-2">
                    <div className="flex items-center space-x-2 font-bold text-rose-400 text-base">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span>Desbloqueio Não Permitido</span>
                    </div>
                    <p>
                      Infelizmente, nem o celular do seu amigo nem o seu número ({formatPhoneMask(currentCoupon.friend_whatsapp || '')}) possuem a sequência da sorte <strong className="font-mono text-white">[{patternForCoupon}]</strong> necessária para liberar esta promoção.
                    </p>
                    <p className="text-xs text-rose-300/80">
                      Peça para outro amigo com a sequência da sorte enviar um novo convite!
                    </p>
                  </div>
                ) : (
                  <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 text-emerald-300 text-xs sm:text-sm">
                    ✨ <strong>Sequência Válida!</strong> O cupom está pronto para ser desbloqueado para você e seu amigo!
                  </div>
                )}

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Confirme seus dados para desbloquear o cupom para vocês dois:</span>
                  </h4>

                  {/* Friend WhatsApp Field - READ ONLY */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Seu Celular / WhatsApp (preenchido pelo amigo):
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={formatPhoneMask(currentCoupon.friend_whatsapp || '')}
                        disabled
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-400 text-sm font-mono cursor-not-allowed"
                      />
                      <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    </div>
                  </div>

                  {/* Friend Name Field */}
                  {friendIsAlreadyMember ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Seu Nome Completo (Membro Cadastrado):
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          value={friendFullName}
                          disabled
                          className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-400 text-sm cursor-not-allowed"
                        />
                        <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      </div>
                      <div className="mt-2 bg-emerald-950/60 border border-emerald-500/50 rounded-xl p-2.5 flex items-center space-x-2 text-emerald-300 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>Selo de Membro: Você já é membro oficial do Aparece Aí por Aqui! 🟢</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Seu Nome Completo:
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={friendFullName}
                          onChange={(e) => setFriendFullName(e.target.value)}
                          placeholder="Digite seu nome completo"
                          required
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Seu nome será utilizado para cadastrar seu usuário no Aparece Aí por Aqui.
                      </p>
                    </div>
                  )}

                  {/* Terms Checkbox */}
                  {!friendIsAlreadyMember && (
                    <div className="pt-2">
                      <label className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={friendTermsAccepted}
                          onChange={(e) => setFriendTermsAccepted(e.target.checked)}
                          required
                          className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-700 bg-slate-900 focus:ring-emerald-500"
                        />
                        <span className="text-xs text-slate-300 leading-relaxed">
                          Li e concordo com os <Link to="/termos-de-uso" target="_blank" className="text-emerald-400 underline">Termos de Uso</Link> e <Link to="/politica-de-privacidade" target="_blank" className="text-emerald-400 underline">Política de Privacidade</Link> do Aparece Aí por Aqui.
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Unlock Confirm Button */}
                <button
                  type="submit"
                  disabled={submitting || !friendUnlockAllowed || (!friendIsAlreadyMember && (!friendFullName.trim() || !friendTermsAccepted))}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 text-base uppercase tracking-wider"
                >
                  {submitting ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Confirmar e Desbloquear Cupom</span>
                    </>
                  )}
                </button>
              </form>
            ) : currentCoupon && friendUnlockedSuccess ? (
              /* FRIEND STAGE 2 UNLOCKED SUCCESS & SHARE BACK */
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-white">Cupom Desbloqueado com Sucesso! 🎉</h2>
                <p className="text-slate-300 text-sm max-w-md mx-auto">
                  Você liberou o benefício para você e para <strong className="text-emerald-400">{currentCoupon.initiator_name || 'seu amigo'}</strong>!
                </p>

                {/* Coupon Card */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-left space-y-3">
                  <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Cupom de Desconto de Sequência</p>
                  <h3 className="text-xl font-black text-white">{currentCoupon.partner_name}</h3>
                  <p className="text-slate-300 text-sm">{currentCoupon.benefit_description}</p>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-mono">CÓDIGO DO CUPOM:</span>
                    <span className="text-lg font-black font-mono text-emerald-400 tracking-wider">{currentCoupon.coupon_code}</span>
                  </div>
                </div>

                {/* Return Share Back Section */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-left space-y-4">
                  <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wide flex items-center space-x-2">
                    <Share2 className="w-4 h-4" /> <span>Avise seu amigo que o cupom foi liberado:</span>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Clique no botão abaixo para devolver a mensagem no WhatsApp do seu amigo <strong>{currentCoupon.initiator_name || ''}</strong> para que ele também possa baixar o cupom!
                  </p>

                  {/* Warning Checkbox */}
                  <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3.5">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={stage2WarningAccepted}
                        onChange={(e) => setStage2WarningAccepted(e.target.checked)}
                        className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-700 bg-slate-900 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-amber-200/90 leading-relaxed">
                        ⚠️ <strong>Atenção:</strong> Ao clicar em compartilhar, você será redirecionado para o WhatsApp para enviar o desbloqueio para seu amigo. Caso esteja em um computador, certifique-se de que está conectado ao WhatsApp Web. Caso contrário, refaça o processo por um celular que contenha o seu WhatsApp.
                      </span>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleFriendShareBackToInitiator}
                    disabled={!stage2WarningAccepted}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black py-3.5 rounded-xl transition-all flex items-center justify-center space-x-2 text-sm uppercase tracking-wider"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Enviar Confirmação para {currentCoupon.initiator_name || 'Amigo'} no WhatsApp</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* MODE C: INITIATOR FINAL REDEEM PAGE (/cupom-sequencia/resgate/:resgateToken) */}
        {isResgateMode && (
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            {loadingCoupon ? (
              <div className="text-center py-12 space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                <p className="text-slate-400 text-sm">Carregando dados de resgate do seu cupom...</p>
              </div>
            ) : errorMessage ? (
              <div className="text-center py-8 space-y-4">
                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
                <p className="text-rose-300 font-bold">{errorMessage}</p>
                <Link to="/cupom-sequencia" className="inline-block bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold">
                  Ir para a promoção
                </Link>
              </div>
            ) : currentCoupon ? (
              currentCoupon.status === 'unlocked' ? (
                /* UNLOCKED COUPON FINAL CARD */
                <div className="space-y-6 text-center print:text-black print:bg-white">
                  <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40 print:hidden">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div className="print:text-black">
                    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase rounded-full print:border-black print:text-black">
                      Cupom Oficial Desbloqueado
                    </span>
                    <h2 className="text-3xl font-black text-white mt-2 print:text-black">Seu Cupom de Sequência da Sorte</h2>
                  </div>

                  {/* Printable Coupon Container */}
                  <div className="bg-gradient-to-br from-slate-950 to-slate-900 border-2 border-dashed border-emerald-500/50 rounded-3xl p-6 sm:p-8 text-left space-y-5 shadow-2xl print:bg-white print:border-black print:text-black">
                    <div className="flex justify-between items-start border-b border-slate-800 pb-4 print:border-black">
                      <div>
                        <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest print:text-black">Parceiro Oficial</p>
                        <h3 className="text-2xl font-black text-white print:text-black">{currentCoupon.partner_name}</h3>
                      </div>
                      <Store className="w-8 h-8 text-emerald-400 print:text-black" />
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase print:text-black">Benefício Exclusivo:</p>
                      <p className="text-lg font-bold text-emerald-300 print:text-black">{currentCoupon.benefit_description}</p>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3 print:bg-gray-100 print:border-black">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase font-mono print:text-black">Código Único do Cupom</p>
                        <p className="text-2xl font-black font-mono text-emerald-400 tracking-wider print:text-black">{currentCoupon.coupon_code}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-bold uppercase print:text-black">Titular do Cupom</p>
                        <p className="text-xs font-bold text-white print:text-black">{currentCoupon.initiator_name}</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed print:text-black">
                      Apresente este código no estabelecimento parceiro ao efetuar seu pedido para usufruir do desconto. Válido conforme os termos da promoção.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center print:hidden">
                    <button
                      onClick={() => window.print()}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3.5 rounded-xl transition-all flex items-center justify-center space-x-2 text-sm"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Imprimir / Salvar Cupom</span>
                    </button>
                    <Link
                      to="/"
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-6 py-3.5 rounded-xl transition-all text-sm flex items-center justify-center"
                    >
                      Ver Outras Ofertas no Aparece Aí
                    </Link>
                  </div>
                </div>
              ) : (
                /* AWAITING FRIEND STAGE 2 UNLOCK STATUS */
                <div className="text-center py-8 space-y-6">
                  <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/40">
                    <AlertCircle className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-black text-white">Aguardando Desbloqueio do Seu Amigo</h2>
                  <p className="text-slate-300 text-sm max-w-md mx-auto">
                    Seu amigo ainda não concluiu a 2ª etapa do desbloqueio para a <strong className="text-emerald-400">{currentCoupon.partner_name}</strong>.
                  </p>
                  <p className="text-xs text-slate-400">
                    Assim que ele acessar o link e confirmar os dados, seu cupom ficará disponível aqui imediatamente!
                  </p>
                </div>
              )
            ) : null}
          </div>
        )}

      </div>
    </div>
  );
};
