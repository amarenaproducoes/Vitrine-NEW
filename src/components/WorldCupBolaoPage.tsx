import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import mascotImg from '../assets/images/bolao_copa_mockup_1781128865746.png';
import OneSignal from 'react-onesignal';
import { Trophy, Share2, ArrowRight, User, Phone, CheckCircle, HelpCircle, AlertCircle, RefreshCw, Star, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { animate } from 'motion';
import confetti from 'canvas-confetti';

interface Game {
  id: string;
  opponent_name: string;
  opponent_code: string;
  opponent_flag_url: string;
  brazil_score: number | null;
  opponent_score: number | null;
  prizes: string;
  partner_logos: string[];
  is_active: boolean;
  brazil_flag_url?: string;
  mascot_url?: string;
}

interface Prediction {
  id: string;
  whatsapp: string;
  customer_name: string;
  game_id: string;
  predicted_brazil_score: number;
  predicted_opponent_score: number;
  created_at: string;
  game?: Game;
}

interface Partner {
  id: string;
  name: string;
  imageUrl: string;
  category?: string;
  activity?: string;
}

interface WorldCupBolaoPageProps {
  partners: Partner[];
  categories: any[];
  headerLogo: string | null;
}

// Popular world cup countries with their ISO codes for FlagCDN
export const WORLD_CUP_COUNTRIES = [
  { name: 'Alemanha', code: 'de' },
  { name: 'Angola', code: 'ao' },
  { name: 'Arábia Saudita', code: 'sa' },
  { name: 'Argélia', code: 'dz' },
  { name: 'Argentina', code: 'ar' },
  { name: 'Austrália', code: 'au' },
  { name: 'Bélgica', code: 'be' },
  { name: 'Camarões', code: 'cm' },
  { name: 'Canadá', code: 'ca' },
  { name: 'Catar', code: 'qa' },
  { name: 'Chile', code: 'cl' },
  { name: 'Colômbia', code: 'co' },
  { name: 'Coreia do Sul', code: 'kr' },
  { name: 'Costa Rica', code: 'cr' },
  { name: 'Croácia', code: 'hr' },
  { name: 'Dinamarca', code: 'dk' },
  { name: 'Equador', code: 'ec' },
  { name: 'Espanha', code: 'es' },
  { name: 'Estados Unidos', code: 'us' },
  { name: 'França', code: 'fr' },
  { name: 'Gana', code: 'gh' },
  { name: 'Holanda', code: 'nl' },
  { name: 'Inglaterra', code: 'gb' },
  { name: 'Irã', code: 'ir' },
  { name: 'Itália', code: 'it' },
  { name: 'Japão', code: 'jp' },
  { name: 'Marrocos', code: 'ma' },
  { name: 'México', code: 'mx' },
  { name: 'Nigéria', code: 'ng' },
  { name: 'Paraguai', code: 'py' },
  { name: 'Peru', code: 'pe' },
  { name: 'Polônia', code: 'pl' },
  { name: 'Portugal', code: 'pt' },
  { name: 'Rússia', code: 'ru' },
  { name: 'Senegal', code: 'sn' },
  { name: 'Sérvia', code: 'rs' },
  { name: 'Suécia', code: 'se' },
  { name: 'Suíça', code: 'ch' },
  { name: 'Tunísia', code: 'tn' },
  { name: 'Uruguai', code: 'uy' }
];

// Dynamic FlagImage helper component displaying a direct URL manually set of uploaded by the administrator
export const FlagImage: React.FC<{ src: string; alt?: string; className?: string }> = ({ src, alt = '', className = '' }) => {
  const [currentSrc, setCurrentSrc] = useState(src || 'https://flagcdn.com/w160/br.png');

  useEffect(() => {
    setCurrentSrc(src || 'https://flagcdn.com/w160/br.png');
  }, [src]);

  const handleError = () => {
    // If empty or broken, provide a clean fallback (e.g. standard country default or generic)
    setCurrentSrc('https://wp.clube.apareceai.com/wp-content/uploads/2026/05/logo_placeholder.png');
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
      referrerPolicy="no-referrer"
    />
  );
};

export const unpackWcGame = (game: any) => {
  if (!game) return null;
  let rawPrizes = game.prizes || '';
  let mascot_url = '';
  let brazil_flag_url = '';

  if (rawPrizes.includes('|||')) {
    const parts = rawPrizes.split('|||');
    rawPrizes = parts[0].trim();
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i].trim();
      if (part.startsWith('MASCOT:')) {
        mascot_url = part.substring(7).trim();
      } else if (part.startsWith('BRAZIL_FLAG:')) {
        brazil_flag_url = part.substring(12).trim();
      }
    }
  }

  return {
    ...game,
    prizes: rawPrizes, // Keep it visually clean
    mascot_url: mascot_url || '', // Empty yields fallback
    brazil_flag_url: brazil_flag_url || 'https://flagcdn.com/w160/br.png'
  };
};

export const packWcGame = (prizesText: string, mascotUrl: string, brazilFlagUrl: string): string => {
  let result = prizesText ? prizesText.trim() : '';
  if (mascotUrl) {
    result += ` |||MASCOT:${mascotUrl.trim()}`;
  }
  if (brazilFlagUrl) {
    result += ` |||BRAZIL_FLAG:${brazilFlagUrl.trim()}`;
  }
  return result;
};

// Helper format function for Brazil Mobile layout: (XX) XXXXX-XXXX
export const formatWhatsAppPattern = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

export const WorldCupBolaoPage: React.FC<WorldCupBolaoPageProps> = ({ partners, categories, headerLogo }) => {
  const navigate = useNavigate();
  const [whatsapp, setWhatsapp] = useState('');
  const [fullName, setFullName] = useState('');
  const [hasConsented, setHasConsented] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showNameForm, setShowNameForm] = useState(false);
  const [welcomeBack, setWelcomeBack] = useState('');

  // World Cup states
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [myPredictions, setMyPredictions] = useState<Prediction[]>([]);
  const [predBrazil, setPredBrazil] = useState<string>('');
  const [predOpponent, setPredOpponent] = useState<string>('');
  
  // Safe images resolution mapping
  const activeSponsors = useMemo(() => {
    if (!activeGame || !activeGame.partner_logos) return [];
    return partners.filter(p => activeGame.partner_logos.includes(p.id));
  }, [activeGame, partners]);

  const sponsorsToShow = useMemo(() => {
    if (activeSponsors && activeSponsors.length > 0) return activeSponsors;
    return partners || [];
  }, [activeSponsors, partners]);

  // Carousel settings & indices
  const [carouselRotation, setCarouselRotation] = useState(0);
  const [currentSponsorIndex, setCurrentSponsorIndex] = useState(0);

  // Status indicators
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [predictionFeedback, setPredictionFeedback] = useState<{
    success: boolean;
    message: string;
    submittedPred?: { brazil: number; opponent: number };
  } | null>(null);

  // Fallback mode if Supabase tables don't exist yet
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  // OneSignal registration ID check
  const [hasOneSignalId, setHasOneSignalId] = useState(false);

  // References for automatic scrolling or focus
  const predSectionRef = useRef<HTMLDivElement>(null);

  // Fetch games and verify if there's any active game
  const loadWorldCupData = async () => {
    setLoading(true);
    try {
      // Try to fetch games from Supabase
      const { data: games, error } = await supabase
        .from('worldcup_games')
        .select('*')
        .order('is_active', { ascending: false })
        .order('id', { ascending: false });

      if (error) throw error;

      if (games && games.length > 0) {
        const unpacked = games.map(g => unpackWcGame(g));
        setAllGames(unpacked);
        const active = unpacked.find(g => g.is_active);
        setActiveGame(active || unpacked[0]);
      } else {
        // Mock default active game if nothing in DB
        const defaultGame: Game = {
          id: '1',
          opponent_name: 'Argentina',
          opponent_code: 'ar',
          opponent_flag_url: 'https://flagcdn.com/w160/ar.png',
          brazil_score: null,
          opponent_score: null,
          prizes: 'Vale-compras de R$ 150,00 nos nossos parceiros excelentes da Vila Formosa!',
          partner_logos: partners.slice(0, 6).map(p => p.id),
          is_active: true
        };
        const unpackedDefault = unpackWcGame(defaultGame);
        setActiveGame(unpackedDefault);
        setAllGames([unpackedDefault]);
      }
    } catch (err: any) {
      console.warn('worldcup_games database table not found, switching to local storage fallback mode:', err.message);
      setIsFallbackMode(true);
      // Load from local storage or set defaults
      const localGames = localStorage.getItem('worldcup_games');
      if (localGames) {
        const parsed = JSON.parse(localGames).map((g: any) => unpackWcGame(g));
        setAllGames(parsed);
        const active = parsed.find((g: Game) => g.is_active);
        setActiveGame(active || parsed[0]);
      } else {
        const defaultGame: Game = {
          id: '1',
          opponent_name: 'França',
          opponent_code: 'fr',
          opponent_flag_url: 'https://flagcdn.com/w160/fr.png',
          brazil_score: null,
          opponent_score: null,
          prizes: 'Vale-compras especial de R$ 100,00 válido em lojas conveniadas!',
          partner_logos: partners.slice(0, 6).map(p => p.id),
          is_active: true
        };
        const unpackedDefault = unpackWcGame(defaultGame);
        setActiveGame(unpackedDefault);
        setAllGames([unpackedDefault]);
        localStorage.setItem('worldcup_games', JSON.stringify([defaultGame]));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorldCupData();
    // OneSignal initialization check
    if ((window as any).isOneSignalInitialized) {
      setHasOneSignalId(true);
    }
  }, []);

  useEffect(() => {
    if (sponsorsToShow.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSponsorIndex(prev => (prev + 1) % sponsorsToShow.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [sponsorsToShow]);

  // Clean whatsapp input format helper
  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only numbers
    const clean = e.target.value.replace(/\D/g, '');
    setWhatsapp(clean);
  };

  // Perform Subscriber validation / Login checking
  const handleVerifyClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (whatsapp.length < 10) return;

    setIsVerifying(true);
    try {
      // 1. Search in the customers table
      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('whatsapp', whatsapp)
        .maybeSingle();

      if (customer) {
        // Customer exists! Welcome them back automatically
        setIsRegistered(true);
        setIsNewUser(false);
        setFullName(customer.name);
        setWelcomeBack(`Que bom te ver de novo! Você já é membro do Aparece Aí por aqui! 💚`);
        // Fetch their historical predictions
        fetchClientPredictions(whatsapp);
        triggerOneSignalAddTags(whatsapp, customer.name);
      } else {
        // Customer does not exist! Request their name first
        setIsNewUser(true);
        setShowNameForm(true);
      }
    } catch (err: any) {
      console.warn('Error reading from customers table, using fallback verify:', err);
      // Fallback mode client registration simulation
      const localCustomers = JSON.parse(localStorage.getItem('worldcup_customers') || '{}');
      if (localCustomers[whatsapp]) {
        setIsRegistered(true);
        setIsNewUser(false);
        setFullName(localCustomers[whatsapp]);
        setWelcomeBack(`Que bom te ver de novo! Você já é membro do Aparece Aí por aqui! 💚`);
        fetchClientPredictions(whatsapp);
      } else {
        setIsNewUser(true);
        setShowNameForm(true);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Trigger registration for a new customer
  const handleRegisterClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || whatsapp.length < 10) return;

    setIsVerifying(true);
    try {
      // Try to register the customer dynamically
      const customerPayload = {
        whatsapp,
        name: fullName.trim(),
        updated_at: new Date().toISOString()
      };

      try {
        const { error } = await supabase
          .from('customers')
          .upsert(customerPayload);
        if (error) throw error;
      } catch (err) {
        console.warn('Upserting to customers failed, ignoring restriction for resiliency');
      }

      // Add OneSignal connection
      triggerOneSignalAddTags(whatsapp, fullName.trim());

      // Save local backup
      const localCustomers = JSON.parse(localStorage.getItem('worldcup_customers') || '{}');
      localCustomers[whatsapp] = fullName.trim();
      localStorage.setItem('worldcup_customers', JSON.stringify(localCustomers));

      setIsRegistered(true);
      setWelcomeBack(`Cadastro feito com sucesso! Seja muito bem-vindo ao Aparece Aí! 💚`);
      fetchClientPredictions(whatsapp);
    } catch (err: any) {
      console.error('Registration failed:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  // Fetch predictions for the logged in subscriber
  const fetchClientPredictions = async (clientWhatsapp: string) => {
    try {
      const { data, error } = await supabase
        .from('worldcup_predictions')
        .select('*')
        .eq('whatsapp', clientWhatsapp);

      if (error) throw error;
      
      const mapped = (data || []).map(p => ({
        ...p,
        game: allGames.find(g => String(g.id) === String(p.game_id))
      }));
      setMyPredictions(mapped);

      // Check if they already predicted the active game
      if (activeGame) {
        const existing = mapped.find(p => String(p.game_id) === String(activeGame.id));
        if (existing) {
          setPredBrazil(String(existing.predicted_brazil_score));
          setPredOpponent(String(existing.predicted_opponent_score));
          setPredictionFeedback({
            success: true,
            message: `Você já enviou seu palpite para o jogo contra o ${activeGame.opponent_name}! Seus dedos estão cruzados! 🤞✨ \n\nQue tal convidar os seus amigos para participarem também do nosso Bolão? Compartilhe agora para torcerem juntos! 🇧🇷⚽`,
            submittedPred: {
              brazil: existing.predicted_brazil_score,
              opponent: existing.predicted_opponent_score
            }
          });
        }
      }
    } catch (err) {
      // Fallback predictions load from local storage
      const localPreds = JSON.parse(localStorage.getItem(`worldcup_preds_${clientWhatsapp}`) || '[]');
      const mapped = localPreds.map((p: any) => ({
        ...p,
        game: allGames.find(g => String(g.id) === String(p.game_id))
      }));
      setMyPredictions(mapped);
      
      if (activeGame) {
        const existing = mapped.find((p: any) => String(p.game_id) === String(activeGame.id));
        if (existing) {
          setPredBrazil(String(existing.predicted_brazil_score));
          setPredOpponent(String(existing.predicted_opponent_score));
          setPredictionFeedback({
            success: true,
            message: `Você já enviou seu palpite para este jogo! Seus dedos estão cruzados! 🤞✨ \n\nQue tal convidar os seus amigos para participarem também do nosso Bolão? Compartilhe agora para torcerem juntos! 🇧🇷⚽`,
            submittedPred: {
              brazil: existing.predicted_brazil_score,
              opponent: existing.predicted_opponent_score
            }
          });
        }
      }
    }
  };

  // Trigger OneSignal Login and Tags addition (browser registration wrapper)
  const triggerOneSignalAddTags = async (cleanWhatsapp: string, name: string) => {
    try {
      if ((window as any).isOneSignalInitialized) {
        await OneSignal.login(cleanWhatsapp);
        await OneSignal.User.addTag("whatsapp", cleanWhatsapp);
        await OneSignal.User.addTag("name", name);
        
        // Request visual layout permission
        if (OneSignal.Notifications.permissionNative === 'default') {
          await OneSignal.Notifications.requestPermission();
        }
      }
    } catch (e) {
      console.warn('OneSignal direct subscription bypassed in current frame:', e);
    }
  };

  // Submit prediction trigger
  const handleRegisterPrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGame || predBrazil === '' || predOpponent === '') return;

    setSubmitting(true);
    const scoreBr = parseInt(predBrazil, 10);
    const scoreOp = parseInt(predOpponent, 10);

    if (isNaN(scoreBr) || isNaN(scoreOp)) return;

    try {
      const predPayload = {
        whatsapp,
        customer_name: fullName.trim(),
        game_id: activeGame.id,
        predicted_brazil_score: scoreBr,
        predicted_opponent_score: scoreOp
      };

      if (!isFallbackMode) {
        const { error } = await supabase
          .from('worldcup_predictions')
          .upsert(predPayload, { onConflict: 'whatsapp,game_id' });

        if (error) throw error;
      }

      // Success visual effects
      confetti({
        particleCount: 140,
        spread: 80,
        origin: { y: 0.6 }
      });

      setPredictionFeedback({
        success: true,
        message: `Palpite registrado com sucesso! Seus dedos estão cruzados! 🤞✨ \n\nQue tal convidar os seus amigos para participarem também do nosso Bolão? Compartilhe agora para torcerem juntos! 🇧🇷⚽`,
        submittedPred: { brazil: scoreBr, opponent: scoreOp }
      });

      // Save locally as backup
      const localPreds = JSON.parse(localStorage.getItem(`worldcup_preds_${whatsapp}`) || '[]');
      const index = localPreds.findIndex((p: any) => String(p.game_id) === String(activeGame.id));
      if (index >= 0) {
        localPreds[index] = predPayload;
      } else {
        localPreds.push(predPayload);
      }
      localStorage.setItem(`worldcup_preds_${whatsapp}`, JSON.stringify(localPreds));

      // Refresh list
      fetchClientPredictions(whatsapp);
    } catch (err: any) {
      console.error('Failed to submit prediction:', err);
      alert('Houve um erro técnico. Salvando seu palpite de forma local para segurança!');
      
      // Save locally
      const localPreds = JSON.parse(localStorage.getItem(`worldcup_preds_${whatsapp}`) || '[]');
      localPreds.push({
        whatsapp,
        customer_name: fullName.trim(),
        game_id: activeGame.id,
        predicted_brazil_score: scoreBr,
        predicted_opponent_score: scoreOp,
        created_at: new Date().toISOString()
      });
      localStorage.setItem(`worldcup_preds_${whatsapp}`, JSON.stringify(localPreds));
      fetchClientPredictions(whatsapp);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper calculation for prediction status
  const getPredictionStatus = (pred: Prediction) => {
    const game = allGames.find(g => String(g.id) === String(pred.game_id));
    if (!game) return { label: 'Aguardando', color: 'bg-yellow-500/15 text-yellow-600 border border-yellow-500/30' };

    if (game.brazil_score === null || game.opponent_score === null) {
      return { label: 'Aguardando', color: 'bg-yellow-500/15 text-yellow-600 border border-yellow-500/30' };
    }

    if (
      pred.predicted_brazil_score === game.brazil_score &&
      pred.predicted_opponent_score === game.opponent_score
    ) {
      return { label: 'Acertou', color: 'bg-green-500/15 text-green-600 border border-green-500/30' };
    }

    return { label: 'Errou', color: 'bg-red-500/15 text-red-600 border border-red-500/30' };
  };

  // Share text builder
  const getShareLink = () => {
    if (!activeGame) return '';
    const shareText = `Dei meu palpite oficial para o jogo do Brasil x ${activeGame.opponent_name} no Bolão do Aparece Aí por Aqui! Palpitei em Brasil ${predBrazil} x ${predOpponent} ${activeGame.opponent_name}. Entre no site para dar o seu palpite gratuitamente também e concorrer a prêmios excepcionais dos parceiros! ⚽💚 👉 ${window.location.origin}/bolao`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 mt-4">
      {/* Custom styles for our smooth scrolling marquee animation */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 20s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Upper Area with Mascot Logo & Dynamic Slogan */}
      <div className="relative flex flex-col items-center text-center pb-6 md:pb-8">
        
        {/* Customized Mascot Frame with transparent background and subtle hover glow */}
        <div className="relative w-48 h-48 md:w-56 md:h-56 mb-6 flex items-center justify-center bg-transparent group animate-fade-in">
          {/* Subtle glowing ambient backdrop behind the transparent mascot */}
          <div className="absolute inset-2 bg-gradient-to-tr from-yellow-400/20 to-emerald-500/20 rounded-full blur-3xl opacity-75 group-hover:opacity-100 transition-opacity duration-500" />
          
          {(!loading && (activeGame?.mascot_url || mascotImg)) ? (
            <img 
              src={activeGame?.mascot_url || mascotImg} 
              alt="Mascote Oficial" 
              className="relative w-44 h-44 md:w-52 md:h-52 object-contain pointer-events-none transition-all duration-500 md:group-hover:scale-105 drop-shadow-[0_15px_30px_rgba(39,146,103,0.3)]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-44 h-44 md:w-52 md:h-52" />
          )}
        </div>

        {/* Header Branding */}
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Bolão de Palpites <span className="bg-gradient-to-r from-emerald-600 to-[#279267] bg-clip-text text-transparent">Aparece Aí por Aqui</span>
        </h1>
        <p className="text-sm md:text-base text-slate-600 font-medium max-w-2xl mt-3">
          Participe, mostre que você é um craque nos palpites e ganhe <span className="text-emerald-600 font-bold">Vale Compras exclusivos</span> de nossos parceiros comerciais locais! 🎁⚽
        </p>
      </div>

      {/* Main Body Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left/Main Column - Predictions Game */}
        <div className="md:col-span-8 bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-100/60 relative overflow-hidden">
          
          {/* Brazil/Cup Deco Strip */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-400 via-green-500 to-sky-500" />

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <RefreshCw className="animate-spin text-emerald-600 w-8 h-8" />
              <p className="text-slate-500 text-sm font-semibold">Carregando jogos e novidades...</p>
            </div>
          ) : (
            <>
              {/* Not registered block - login first */}
              {!isRegistered ? (
                <div className="py-6">
                  <div className="text-center mb-6">
                    <Trophy className="mx-auto w-10 h-10 text-yellow-500 animate-bounce mb-2" />
                    <h3 className="text-lg font-black text-slate-800">Identifique-se para palpitar</h3>
                    <p className="text-xs text-slate-500 mt-1">É rápido! Digite seu WhatsApp para verificar seu convite da Copa.</p>
                  </div>

                  <form onSubmit={showNameForm ? handleRegisterClient : handleVerifyClient} className="space-y-4 max-w-sm mx-auto">
                    <div>
                      <label className="text-xs font-black text-slate-600 tracking-wider uppercase block mb-1">WhatsApp</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-bold text-xs">
                          <Phone size={14} className="mr-1 inline" /> +55
                        </span>
                        <input 
                          type="text" 
                          placeholder="(11) 99999-9999" 
                          value={formatWhatsAppPattern(whatsapp)}
                          onChange={handleWhatsappChange}
                          disabled={isVerifying || showNameForm}
                          maxLength={15}
                          required
                          className="w-full pl-16 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm tracking-wide focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-700 disabled:opacity-75"
                        />
                      </div>
                    </div>

                    {showNameForm && (
                      <div className="animate-fade-in">
                        <label className="text-xs font-black text-slate-600 tracking-wider uppercase block mb-1">
                          Notamos que este é o seu primeiro palpite! Qual é o seu Nome?
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                            <User size={14} />
                          </span>
                          <input 
                            type="text" 
                            placeholder="Seu nome completo" 
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            required
                            disabled={isVerifying}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-700"
                          />
                        </div>
                      </div>
                    )}

                    <button 
                      type="submit" 
                      disabled={isVerifying || whatsapp.length < 10}
                      className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-md shadow-green-500/10 flex items-center justify-center space-x-2 text-sm cursor-pointer disabled:opacity-50"
                    >
                      {isVerifying ? (
                        <>
                          <RefreshCw className="animate-spin w-4 h-4 mr-2" />
                          <span>Verificando informações...</span>
                        </>
                      ) : (
                        <>
                          <span>{showNameForm ? 'Concluir Cadastro e Jogar' : 'Próximo Passo'}</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                /* Registered subscriber prediction panel */
                <div ref={predSectionRef} className="space-y-6">
                  
                  {/* Gentle Welcome Back Banner */}
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start space-x-3 text-emerald-800 animate-slide-in">
                    <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                    <div className="space-y-0.5">
                      <p className="text-xs font-black uppercase tracking-widest text-emerald-700">Olá, {fullName}!</p>
                      <p className="text-xs text-emerald-600 font-medium">{welcomeBack}</p>
                    </div>
                  </div>

                  {activeGame ? (
                    <div>
                      {/* Interactive Match Header */}
                      <div className="text-center py-4 border-b border-slate-100 mb-6">
                        <span className="px-3 py-1 bg-[#279267]/10 text-[#279267] rounded-full text-[10px] font-black uppercase tracking-widest inline-block">
                          Próxima Partida Ativa
                        </span>
                        <h2 className="text-base text-slate-700 font-bold mt-2">Dê o seu pitaco oficial abaixo!</h2>
                      </div>

                      <form onSubmit={handleRegisterPrediction} className="space-y-8">
                        {/* Flag Score Input Widget */}
                        <div className="flex items-center justify-center space-x-4 md:space-x-8">
                          
                          {/* Brazil Team */}
                          <div className="flex flex-col items-center space-y-2 w-28 md:w-36 text-center">
                            <div className="w-16 h-12 md:w-20 md:h-16 rounded-xl overflow-hidden shadow-md border-2 border-slate-100 bg-white flex items-center justify-center transition-all bg-slate-50">
                              <FlagImage src={activeGame?.brazil_flag_url || 'https://flagcdn.com/w160/br.png'} alt="Brasil" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-xs md:text-sm font-black text-slate-800">BRASIL</span>
                          </div>

                          {/* Prediction Inputs */}
                          <div className="flex items-center space-x-2 md:space-x-4 bg-slate-50 px-4 md:px-6 py-4 rounded-3xl border border-slate-100">
                            <input 
                              type="number" 
                              min="0"
                              max="99"
                              value={predBrazil}
                              onChange={e => {
                                const val = e.target.value.replace(/\D/g, '');
                                if (!predictionFeedback?.submittedPred) setPredBrazil(val);
                              }}
                              disabled={!!predictionFeedback?.submittedPred}
                              placeholder="0"
                              required
                              className="w-12 h-12 md:w-16 md:h-16 text-center bg-white border border-slate-200 rounded-2xl text-xl md:text-3xl font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 focus:scale-105 transition-all disabled:opacity-85 disabled:bg-slate-100"
                            />
                            <span className="text-slate-400 font-bold text-lg">x</span>
                            <input 
                              type="number"
                              min="0"
                              max="99"
                              value={predOpponent}
                              onChange={e => {
                                const val = e.target.value.replace(/\D/g, '');
                                if (!predictionFeedback?.submittedPred) setPredOpponent(val);
                              }}
                              disabled={!!predictionFeedback?.submittedPred}
                              placeholder="0"
                              required
                              className="w-12 h-12 md:w-16 md:h-16 text-center bg-white border border-slate-200 rounded-2xl text-xl md:text-3xl font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 focus:scale-105 transition-all disabled:opacity-85 disabled:bg-slate-100"
                            />
                          </div>

                          {/* Opponent Team */}
                          <div className="flex flex-col items-center space-y-2 w-28 md:w-36 text-center">
                            <div className="w-16 h-12 md:w-20 md:h-16 rounded-xl overflow-hidden shadow-md border-2 border-slate-100 bg-white flex items-center justify-center transition-all">
                              <FlagImage src={activeGame.opponent_flag_url} alt={activeGame.opponent_name} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-xs md:text-sm font-black text-slate-800 uppercase max-w-full truncate">{activeGame.opponent_name}</span>
                          </div>

                        </div>

                        {/* Prizes Display Card (Bottom Space in Page) */}
                        <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl space-y-2">
                          <div className="flex items-center space-x-2 text-amber-800">
                            <Trophy size={18} className="text-amber-500 shrink-0" />
                            <h4 className="text-xs font-black uppercase tracking-wider">Prêmios em Jogo nesta Rodada!</h4>
                          </div>
                          <p className="text-xs md:text-sm text-amber-900 font-semibold leading-relaxed whitespace-pre-line">
                            {activeGame.prizes}
                          </p>
                        </div>

                        {/* Privacy & Data Consent Checkbox */}
                        {!predictionFeedback?.submittedPred && (
                          <div className="space-y-4 pt-2">
                            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3 text-left animate-slide-in">
                              <AlertCircle className="text-amber-600 w-5 h-5 shrink-0 mt-0.5" />
                              <p className="text-[10px] leading-relaxed text-amber-800 font-medium">
                                <strong>AVISO DE COLETA DE DADOS:</strong> Seus dados serão coletados e utilizados para fins publicitários e informativos sobre promoções e benefícios locais, conforme nossa <Link to="/politica-de-privacidade" className="underline font-bold hover:text-[#279267]">Política de Privacidade</Link> e <Link to="/termos-de-uso" className="underline font-bold hover:text-[#279267]">Termos de Uso</Link>.
                              </p>
                            </div>

                            <label className="flex items-start gap-3 cursor-pointer group text-left">
                              <div className="relative mt-0.5">
                                <input 
                                  type="checkbox"
                                  checked={hasConsented}
                                  onChange={(e) => setHasConsented(e.target.checked)}
                                  className="sr-only"
                                />
                                <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${hasConsented ? 'bg-emerald-600 border-emerald-600' : 'bg-white border-slate-200 group-hover:border-slate-300'}`}>
                                  {hasConsented && <CheckCircle className="text-white w-3.5 h-3.5" />}
                                </div>
                              </div>
                              <span className="text-xs text-slate-600 font-medium leading-tight select-none">
                                Estou ciente e autorizo a coleta e uso dos meus dados, bem como o recebimento de notificações no navegador, conforme a Política de Privacidade e Termos de Uso.
                              </span>
                            </label>
                          </div>
                        )}

                        {/* Submission outcome block */}
                        {predictionFeedback ? (
                          <div className="space-y-4 animate-scale-in">
                            <div className="p-4 bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 rounded-2xl text-center">
                              <p className="text-xs md:text-sm font-bold whitespace-pre-line">{predictionFeedback.message}</p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-3">
                              <a 
                                href={getShareLink()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-3.5 bg-[#25D366] text-white font-bold rounded-xl hover:bg-[#20ba59] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 text-sm shadow-md cursor-pointer"
                              >
                                <Share2 size={16} />
                                <span>Compartilhar no WhatsApp</span>
                              </a>

                              <Link 
                                shadow-md="true"
                                to="/" 
                                className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 text-sm shadow-md cursor-pointer"
                              >
                                <span>Ir para o Site Vitrine</span>
                                <ArrowRight size={16} />
                              </Link>
                            </div>
                          </div>
                        ) : (
                          <button 
                            type="submit" 
                            disabled={submitting || predBrazil === '' || predOpponent === '' || !hasConsented}
                            className="w-full py-3.5 bg-emerald-600 text-white font-extrabold rounded-2xl hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-lg shadow-green-500/20 text-sm flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                          >
                            {submitting ? (
                              <>
                                <RefreshCw className="animate-spin w-4 h-4 mr-2" />
                                <span>Registrando seu palpite nos servidores...</span>
                              </>
                            ) : (
                              <>
                                <span>Enviar Palpite Oficial</span>
                                <Trophy size={16} />
                              </>
                            )}
                          </button>
                        )}
                      </form>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <HelpCircle className="mx-auto w-12 h-12 text-slate-300 mb-2" />
                      <p className="text-sm font-semibold">Nenhum jogo ativo disponível para palpite no momento.</p>
                    </div>
                  )}

                  {/* Previous users guesses history logs list */}
                  {myPredictions.length > 0 && (
                    <div className="border-t border-slate-100 pt-8 mt-8">
                      <h3 className="text-sm font-black text-slate-800 tracking-wider uppercase mb-4 flex items-center space-x-2">
                        <Star size={16} className="text-yellow-500" />
                        <span>Seus Palpites Anteriores</span>
                      </h3>

                      <div className="space-y-3">
                        {myPredictions.map((pred) => {
                          const status = getPredictionStatus(pred);
                          return (
                            <div key={pred.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                              <div className="flex items-center space-x-3">
                                {/* Flags Mini UI */}
                                <div className="flex items-center space-x-1 shrink-0 bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
                                  <FlagImage src={pred.game?.brazil_flag_url || 'https://flagcdn.com/w160/br.png'} alt="Brasil" className="w-6 h-4 object-cover rounded-sm" />
                                  <span className="text-[10px] font-black text-slate-700">BR</span>
                                  <span className="text-[10px] font-black text-slate-400">x</span>
                                  <span className="text-[10px] font-black text-slate-700 uppercase">{pred.game?.opponent_code || 'OP'}</span>
                                  <FlagImage src={pred.game?.opponent_flag_url || 'https://flagcdn.com/w160/fr.png'} alt={pred.game?.opponent_name} className="w-6 h-4 object-cover rounded-sm" />
                                </div>

                                <div className="space-y-0.5">
                                  <p className="text-xs font-bold text-slate-800">
                                    Seu palpite: <span className="text-emerald-600 font-extrabold">{pred.predicted_brazil_score} x {pred.predicted_opponent_score}</span>
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    Feito em: {new Date(pred.created_at).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center space-x-4">
                                {pred.game?.brazil_score !== null && pred.game?.opponent_score !== null && (
                                  <span className="text-[10px] font-mono font-medium text-slate-500">
                                    Resultado Real: {pred.game?.brazil_score}x{pred.game?.opponent_score}
                                  </span>
                                )}
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${status.color}`}>
                                  {status.label}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </>
          )}

        </div>

        {/* Right Column - Modern 9:16 Sponsor Carousel & Partner Names Animation */}
        <div className="md:col-span-4 flex flex-col items-center w-full">
          <div className="bg-gradient-to-br from-[#279267]/5 to-[#279267]/10 border border-[#279267]/10 rounded-3xl p-4 sm:p-6 w-full text-center relative overflow-hidden flex flex-col items-center">
            
            <h3 className="text-xs font-black text-emerald-800 tracking-widest uppercase mb-4 flex items-center justify-center space-x-1 font-sans">
              <Star size={12} className="animate-pulse text-emerald-600" />
              <span>Parceiros Participantes</span>
            </h3>

            {/* Continuous Marquee/Ticker with Partner Names */}
            <div className="w-full overflow-hidden bg-white/70 py-2 rounded-xl border border-emerald-500/10 mb-4 select-none relative">
              <div className="flex whitespace-nowrap animate-marquee">
                {/* Duplicate the array multi-fold to guarantee elegant looping */}
                {[...sponsorsToShow, ...sponsorsToShow, ...sponsorsToShow, ...sponsorsToShow].map((partner, index) => (
                  <span key={`${partner.id}-${index}`} className="mx-3.5 text-[10px] font-black text-emerald-700 uppercase tracking-wider flex items-center space-x-1 font-sans">
                    <span className="text-emerald-500">⚽</span>
                    <span>{partner.name}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Depth 9:16 Carousel container */}
            <div className="relative w-full max-w-[280px] aspect-[9/16] mx-auto bg-slate-100 rounded-2xl shadow-md overflow-hidden group/carousel border border-slate-200/50">
              {sponsorsToShow.length > 0 ? (
                <div className="relative w-full h-full">
                  {sponsorsToShow.map((partner, idx) => {
                    const isActive = idx === currentSponsorIndex;
                    return (
                      <div 
                        key={partner.id} 
                        className={`absolute inset-0 transition-all duration-700 ease-in-out ${isActive ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-95 pointer-events-none'}`}
                      >
                        <a 
                          href={`/parceiro/${partner.id}`}
                          className="block w-full h-full relative"
                        >
                          <img 
                            src={partner.imageUrl} 
                            alt={partner.name} 
                            className="w-full h-full object-cover select-none"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.src = 'https://wp.clube.apareceai.com/wp-content/uploads/2026/05/logo_placeholder.png';
                            }}
                          />
                          {/* Bottom info banner with dark glassy overlay */}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 text-left">
                            <span className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black uppercase rounded tracking-wider inline-block mb-1 font-sans">
                              {partner.category || 'Parceiro'}
                            </span>
                            <h4 className="text-white text-xs sm:text-xs font-black uppercase tracking-wide truncate font-sans">{partner.name}</h4>
                            <p className="text-gray-300 text-[10px] font-medium truncate font-sans">{partner.activity || 'Apoie o comércio local!'}</p>
                          </div>
                        </a>
                      </div>
                    );
                  })}

                  {/* Manual Navigation Controls */}
                  {sponsorsToShow.length > 1 && (
                    <>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentSponsorIndex(prev => (prev - 1 + sponsorsToShow.length) % sponsorsToShow.length);
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-emerald-600 backdrop-blur-md text-white flex items-center justify-center transition-all z-20 opacity-0 group-hover/carousel:opacity-100 cursor-pointer border border-white/10 select-none"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentSponsorIndex(prev => (prev + 1) % sponsorsToShow.length);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-emerald-600 backdrop-blur-md text-white flex items-center justify-center transition-all z-20 opacity-0 group-hover/carousel:opacity-100 cursor-pointer border border-white/10 select-none"
                      >
                        <ChevronRight size={14} />
                      </button>

                      {/* Sliding indicator dots */}
                      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center space-x-1 z-20">
                        {sponsorsToShow.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentSponsorIndex(idx);
                            }}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentSponsorIndex ? 'bg-emerald-500 w-3' : 'bg-white/50 hover:bg-white/85'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 p-4">
                  <AlertCircle size={28} className="text-slate-300 mb-1" />
                  <span className="text-[10px] font-semibold text-slate-400">Nenhum parceiro nesta rodada.</span>
                </div>
              )}
            </div>

            <p className="text-[10px] text-slate-500 max-w-xs mt-4">
              Cada palpite apoia e divulga o comércio da sua região. Fortaleça os negócios locais da Vila Formosa!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
