/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Link, useNavigate } from 'react-router-dom';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { Lock } from 'lucide-react';
import DOMPurify from 'dompurify';
import { 
    Store, Car, Megaphone, Sparkles, ChevronRight, ChevronLeft, Plus, Trash2, 
    Filter, Info, ArrowRight, Zap, Edit2, Upload, X, Trophy, Settings, DollarSign, History, LogOut, MessageSquare, Search, Share2, MousePointerClick,
    Save, Image as ImageIcon, FileText, Hash, Type, Calendar, ExternalLink, RefreshCw, AlertCircle, Copy, Gift, List, Shield
} from 'lucide-react';

import Header from './components/Header';
import Footer from './components/Footer';
import PartnerCard from './components/PartnerCard';
import LeadForm from './components/LeadForm';
import AdminMessagesPage from './components/AdminMessagesPage';
import SecurityLogsPage from './components/SecurityLogsPage';
import AboutUsPage from './components/AboutUsPage';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import TermsOfUsePage from './components/TermsOfUsePage';
import RouletteModal from './components/RouletteModal';
import WelcomeModal from './components/WelcomeModal';
import WelcomePage from './components/WelcomePage';
import LoginPage from './components/LoginPage';
import GiftCardModal from './components/GiftCardModal';
import ProtectedRoute from './components/ProtectedRoute';
import { AnimatePresence, motion } from 'motion/react';
import { CATEGORIES } from './constants';
import { Partner, Category, SuccessCase, AboutConfig, CashbackConfig, CashbackLog, CommercialBannerData, WelcomeMessage, CouponCampaign } from './types';

interface FeaturedCoupon {
    id?: string;
    slot_id: number;
    partner_id: string | null;
    created_at?: string;
}

import { supabase, AUTHORIZED_EMAILS } from './lib/supabase';
import { getUserIP } from './lib/ip';
import { logger } from './lib/logger';
import { formatWhatsApp } from './lib/format';
import Editor, { 
    Toolbar, 
    BtnBold, 
    BtnItalic, 
    BtnUnderline, 
    BtnStrikeThrough, 
    BtnNumberedList, 
    BtnBulletList, 
    BtnLink, 
    BtnClearFormatting, 
    BtnStyles,
    Separator,
    HtmlButton,
    BtnUndo,
    BtnRedo
} from 'react-simple-wysiwyg';

import ReactGA from 'react-ga4';
import OneSignal from 'react-onesignal';

const GA_MEASUREMENT_ID = 'G-9F6ST94BVG';

// Inicializa o GA4 fora do componente para garantir que rode apenas uma vez
ReactGA.initialize(GA_MEASUREMENT_ID);

const GlobalAuthGuard = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                const email = session.user.email?.toLowerCase();
                if (!AUTHORIZED_EMAILS.includes(email || '')) {
                    // Log unauthorized access attempt immediately
                    logger.security({
                        type: 'unauthorized_access',
                        severity: 'high',
                        details: { 
                            user_email: session.user.email,
                            attempted_path: location.pathname,
                            method: 'global_guard'
                        }
                    });

                    // Se não for autorizado, desloga imediatamente
                    await supabase.auth.signOut();
                    
                    // Redireciona para a tela de login com a mensagem de erro
                    navigate('/login', { 
                        replace: true, 
                        state: { error: `E-mail ${session.user.email} não autorizado.` } 
                    });
                }
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate, location]);

    return null;
};

const parseCashbackValue = (label: string | null | undefined, fallbackValue: number): number => {
    if (!label) return fallbackValue;
    const match = label.match(/[\d,.-]+/);
    if (!match) return fallbackValue;
    const cleaned = match[0].replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? fallbackValue : parsed;
};

const AnalyticsTracker = () => {
    const location = useLocation();

    useEffect(() => {
        // Envia o evento de pageview sempre que a rota mudar
        ReactGA.send({ hitType: "pageview", page: location.pathname + location.search + location.hash });
    }, [location]);

    useEffect(() => {
        const initOneSignal = async () => {
            const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
            
            if (appId) {
                try {
                    console.log('Iniciando OneSignal com App ID:', appId);
                    await OneSignal.init({
                        appId: appId,
                        allowLocalhostAsSecureOrigin: true,
                        notifyButton: {
                            enable: false,
                            prenotify: true,
                            showCredit: false,
                            text: {
                                'tip.state.unsubscribed': 'Inscreva-se para notificações',
                                'tip.state.subscribed': 'Você está inscrito',
                                'tip.state.blocked': 'Notificações blocked',
                                'message.prenotify': 'Clique para receber novidades!',
                                'message.action.subscribed': 'Obrigado por se inscrever!',
                                'message.action.resubscribed': 'Você está inscrito novamente',
                                'message.action.unsubscribed': 'Você não receberá mais notificações',
                                'message.action.subscribing': 'Inscrevendo...',
                                'dialog.main.title': 'Gerenciar Notificações',
                                'dialog.main.button.subscribe': 'INSCREVER-SE',
                                'dialog.main.button.unsubscribe': 'CANCELAR INSCRIÇÃO',
                                'dialog.blocked.title': 'Desbloquear Notificações',
                                'dialog.blocked.message': 'Siga estas instruções para permitir notificações:'
                            }
                        },
                    });
                    console.log('OneSignal inicializado com sucesso!');
                    (window as any).isOneSignalInitialized = true;
                } catch (error: any) {
                    const errorMsg = error?.message || String(error);
                    console.warn('Aviso OneSignal Init:', errorMsg);
                    
                    if (errorMsg.includes('SDK already initialized') || errorMsg.includes('Timeout')) {
                        (window as any).isOneSignalInitialized = true;
                    } else {
                        (window as any).isOneSignalInitialized = false;
                    }
                }
            }
        };
        initOneSignal();
    }, []);

    return null;
};

const ScrollToTop = () => {
    const { pathname, hash } = useLocation();
    useEffect(() => { 
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }
        
        const forceScrollToTop = () => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
        };

        if (!hash) {
            forceScrollToTop(); 
            // Múltiplas tentativas para garantir que o navegador móvel obedeça após renderizar
            requestAnimationFrame(() => {
                forceScrollToTop();
                setTimeout(forceScrollToTop, 50);
                setTimeout(forceScrollToTop, 300);
            });
        } else {
            const id = hash.replace('#', '');
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                setTimeout(() => element.scrollIntoView({ behavior: 'smooth' }), 300);
            }
        }
    }, [pathname, hash]);
    return null;
};

const CommercialBanner = ({ position }: { position: 'top' | 'bottom' }) => {
    const isTop = position === 'top';
    const adMessages = [
        "📢 ANUNCIE AQUI! SUA MARCA VISTA POR MILHARES DIARIAMENTE",
        "🚀 IMPULSIONE SEU NEGÓCIO NO NOSSO CIRCUITO DE TVs",
        "✨ APARECE AÍ POR AQUI • O MELHOR ESPAÇO PUBLICITÁRIO DA REGIÃO",
        "💰 PREÇOS ESPECIAIS PARA NOVOS ANUNCIANTES • CONSULTE-NOS",
        "📺 SUA MARCA EM DESTAQUE EM ESTABELECIMENTOS DE ALTO FLUXO"
    ];

    return (
        <div className={`block w-full overflow-hidden relative py-1.5 ${isTop ? 'bg-[#c54b4b]' : 'bg-slate-900'} border-y ${isTop ? 'border-[#b13b3b]' : 'border-slate-800'} z-40`}>
            <div className="flex whitespace-nowrap overflow-hidden">
                <div className="animate-marquee flex items-center">
                    {[...adMessages, ...adMessages].map((msg, i) => (
                        <div key={i} className="flex items-center mx-12 text-white font-black uppercase italic tracking-tighter text-sm md:text-lg">
                            <Zap className="mr-4 w-5 h-5 text-yellow-300 animate-pulse" />
                            <span>{msg}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const BannerCarousel = ({ banners, onBannerClick }: { banners: CommercialBannerData[], onBannerClick?: (banner: CommercialBannerData) => void }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (banners.length <= 1 || isPaused) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [banners.length, isPaused]);

    if (banners.length === 0) return null;

    const nextBanner = () => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
        setIsPaused(true);
        setTimeout(() => setIsPaused(false), 10000); // Resume after 10s of inactivity
    };

    const prevBanner = () => {
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
        setIsPaused(true);
        setTimeout(() => setIsPaused(false), 10000);
    };

    return (
        <div className="w-full bg-slate-900 py-6 md:py-8 group">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative overflow-hidden rounded-2xl md:rounded-[2rem] shadow-2xl border border-slate-800">
                    <div 
                        className="flex transition-transform duration-700 ease-in-out" 
                        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                    >
                        {banners.map((banner) => (
                            <div key={banner.id} className="w-full flex-shrink-0">
                                {banner.linkUrl ? (
                                    <a 
                                        href={banner.linkUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="block"
                                        onClick={() => onBannerClick?.(banner)}
                                    >
                                        <img src={banner.imageUrl} alt={banner.partnerName || "Banner Publicitário"} className="w-full h-auto block" />
                                    </a>
                                ) : (
                                    <img src={banner.imageUrl} alt={banner.partnerName || "Banner Publicitário"} className="w-full h-auto block" />
                                )}
                            </div>
                        ))}
                    </div>

                    {banners.length > 1 && (
                        <>
                            <button 
                                onClick={prevBanner}
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button 
                                onClick={nextBanner}
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                                <ChevronRight size={24} />
                            </button>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                                {banners.map((_, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => {
                                            setCurrentIndex(i);
                                            setIsPaused(true);
                                            setTimeout(() => setIsPaused(false), 10000);
                                        }}
                                        className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? 'bg-white w-4' : 'bg-white/40'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const LandingPage = ({ partners, categories, commercialBanners, featuredPartner, featuredCoupons, headerLogo, partnerAccessCounts, onBannerClick }: { partners: Partner[], categories: Category[], commercialBanners: CommercialBannerData[], featuredPartner: Partner | null, featuredCoupons: FeaturedCoupon[], headerLogo: string | null, partnerAccessCounts: Record<string, number>, onBannerClick?: (banner: CommercialBannerData) => void }) => {
    const [activeCategory, setActiveCategory] = useState("Todos");
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedPartnerId, setExpandedPartnerId] = useState<string | null>(null);
    const [partnersPage, setPartnersPage] = useState(1);
    const PARTNERS_PER_PAGE = 10;
    const [roulettePartner, setRoulettePartner] = useState<Partner | null>(null);
    const [cashbackConfigs, setCashbackConfigs] = useState<CashbackConfig[]>([]);
    const [showRoulette, setShowRoulette] = useState(false);
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const [customWelcomeData, setCustomWelcomeData] = useState<{ title: string; message: string; logoUrl: string | null } | null>(null);
    const location = useLocation();

    useEffect(() => {
        // Check both window.location.search (before hash) and location.search (after hash)
        const windowParams = new URLSearchParams(window.location.search);
        const locationParams = new URLSearchParams(location.search);
        
        const refId = windowParams.get('ref') || locationParams.get('ref');
        
        if (refId) {
            handleRefAccess(refId);
        }
    }, [location]);

    const handleRefAccess = async (refId: string) => {
        // Check if modal was already shown in this session to prevent re-triggering on navigation
        if (sessionStorage.getItem(`welcome_modal_shown_${refId}`)) return;
        
        // Mark as shown immediately to prevent race conditions
        sessionStorage.setItem(`welcome_modal_shown_${refId}`, 'true');

        try {
            const displayId = parseInt(refId);
            const isNumeric = !isNaN(displayId);

            if (isNumeric) {
                const { data: partner } = await supabase
                    .from('partners')
                    .select('*')
                    .eq('display_id', displayId)
                    .maybeSingle();

                if (partner) {
                    const ip = await getUserIP();
                    // Log access
                    await supabase.from('partner_access_logs').insert({
                        partner_id: partner.id,
                        ip_address: ip
                    });

                    // Only show modals if cashback is enabled for this partner
                    if (partner.cashback_enabled) {
                        // Fetch cashback configs
                        const { data: configs } = await supabase.from('cashback_configs').select('*').order('id', { ascending: true });
                        if (configs && configs.length > 0) {
                            setCashbackConfigs(configs);
                            setRoulettePartner({
                                id: partner.id,
                                name: partner.name,
                                category: partner.category,
                                activity: partner.activity,
                                description: partner.description,
                                address: partner.address,
                                imageUrl: partner.image_url,
                                images: partner.images || [],
                                videoUrl: partner.video_url || '',
                                link: partner.link,
                                whatsappLink: partner.whatsapp_link,
                                coupon: partner.coupon,
                                couponDescription: partner.coupon_description,
                                isAuthorized: partner.is_authorized,
                                cashbackEnabled: partner.cashback_enabled,
                                orderIndex: partner.order_index,
                                displayId: partner.display_id
                            });
                            setShowWelcomeModal(true);
                        }
                    }
                }
            } else {
                // Alphanumeric ref ID - check personalized welcome messages
                const { data: welcomeMsg } = await supabase
                    .from('welcome_messages')
                    .select('*')
                    .eq('ref_id', refId)
                    .maybeSingle();

                if (welcomeMsg) {
                    const ip = await getUserIP();
                    // Log access to the new table
                    await supabase.from('welcome_access_logs').insert({
                        ref_id: refId,
                        ip_address: ip
                    });

                    // Show custom welcome modal
                    setCustomWelcomeData({
                        title: welcomeMsg.title,
                        message: welcomeMsg.message,
                        logoUrl: welcomeMsg.logo_url
                    });
                    setShowWelcomeModal(true);
                }
            }
        } catch (error) {
            logger.error('Error handling ref access:', error);
        }
    };

    const fetchCashbackConfigs = async () => {
        try {
            const { data: configs } = await supabase.from('cashback_configs').select('*').order('id', { ascending: true });
            if (configs) setCashbackConfigs(configs);
        } catch (error) {
            logger.error('Error fetching cashback configs in LandingPage:', error);
        }
    };

    const handleWin = async (value: number, whatsapp: string, name: string, label: string) => {
        if (!roulettePartner) return;
        try {
            const ip = await getUserIP();
            await supabase.from('cashback_logs').insert({
                store_name: roulettePartner.name,
                cashback_value: value,
                cashback_label: label,
                whatsapp: whatsapp,
                customer_name: name,
                ip_address: ip
            });
            fetchCashbackConfigs();
        } catch (error) {
            logger.error('Error logging cashback:', error);
        }
    };

    const authorizedPartners = partners.filter(p => p.isAuthorized).sort((a, b) => a.orderIndex - b.orderIndex);
    const handleCategoryClick = (category: string) => {
        setActiveCategory(category);
        setSearchTerm(""); // Clear search when category is selected
    };

    const filteredPartners = authorizedPartners.filter(p => {
        const matchesCategory = activeCategory === "Todos" || p.category === activeCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Sort partners by page_number first, then by access count ranking
    const sortedPartners = [...filteredPartners].sort((a, b) => {
        const pageA = a.page_number || 1;
        const pageB = b.page_number || 1;
        if (pageA !== pageB) return pageA - pageB;

        const countA = partnerAccessCounts[a.id] || 0;
        const countB = partnerAccessCounts[b.id] || 0;
        return countB - countA;
    });

    // Determine total pages based on the maximum page_number assigned to any authorized partner
    // OR based on the number of filtered partners if they are all on the same page
    const maxAssignedPage = Math.max(1, ...authorizedPartners.map(p => p.page_number || 1));
    const totalPartnersPages = activeCategory === "Todos" && !searchTerm ? maxAssignedPage : Math.ceil(sortedPartners.length / PARTNERS_PER_PAGE);

    // If searching or filtering by category, use traditional pagination, otherwise use assigned pages
    const paginatedPartners = (searchTerm || activeCategory !== "Todos") 
        ? sortedPartners.slice((partnersPage - 1) * PARTNERS_PER_PAGE, partnersPage * PARTNERS_PER_PAGE)
        : sortedPartners.filter(p => (p.page_number || 1) === partnersPage);

    useEffect(() => {
        setPartnersPage(1);
        setExpandedPartnerId(null);
    }, [searchTerm, activeCategory]);
    
    return (
        <main className="flex-grow">
            <AnimatePresence>
                {showWelcomeModal && (roulettePartner || customWelcomeData) && (
                    <WelcomeModal 
                        isOpen={showWelcomeModal}
                        onClose={() => {
                            setShowWelcomeModal(false);
                            setCustomWelcomeData(null);
                        }}
                        onAccept={() => {
                            setShowWelcomeModal(false);
                            if (customWelcomeData) {
                                setCustomWelcomeData(null);
                            } else {
                                setShowRoulette(true);
                            }
                        }}
                        storeName={roulettePartner?.name || ''}
                        logoUrl={customWelcomeData ? customWelcomeData.logoUrl : headerLogo}
                        customTitle={customWelcomeData?.title}
                        customMessage={customWelcomeData?.message}
                    />
                )}
                {showRoulette && roulettePartner && (
                    <RouletteModal 
                        isOpen={showRoulette}
                        onClose={() => setShowRoulette(false)}
                        storeName={roulettePartner.name}
                        configs={cashbackConfigs}
                        onWin={handleWin}
                    />
                )}
            </AnimatePresence>
            <BannerCarousel banners={commercialBanners} onBannerClick={onBannerClick} />
            <section id="vitrine" className="relative overflow-hidden bg-slate-900 pt-8 pb-10 md:pt-10 md:pb-12">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-[#279267]/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#c54b4b]/10 rounded-full blur-[120px]"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center space-x-2 bg-slate-800/50 backdrop-blur-sm px-4 py-2 rounded-full text-[#279267] text-xs font-bold uppercase tracking-widest mb-6 border border-slate-700/50"><Sparkles size={14} /><span>Garanta cupons de benefícios nas lojas da região!</span></div>
                    <h1 className="text-4xl md:text-7xl font-black text-white mb-4 leading-tight">Cupons <span className="text-[#279267] italic">Exclusivos</span></h1>
                    <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium">Confira abaixo os benefícios e descontos exclusivos que os nossos parceiros prepararam para vocês! Aproveitem e garantam já!</p>
                </div>
            </section>

            <section className="py-6 bg-white border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="bg-[#c54b4b] text-white p-2 rounded-lg shadow-lg shadow-red-500/20">
                            <Trophy size={18} />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Cupons em Destaque da Semana</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[0, 1, 2, 3, 4, 5].map((idx) => {
                            const coupon = featuredCoupons.find(c => c.slot_id === idx + 1);
                            const partner = partners.find(p => p.id === coupon?.partner_id);
                            
                            if (!partner) return null;

                            return (
                                <button 
                                    key={idx}
                                    onClick={() => {
                                        setSearchTerm(partner.name);
                                        // Aguarda a busca ser aplicada e desce direto até o card do parceiro
                                        setTimeout(() => {
                                            const cardElement = document.getElementById(`partner-card-${partner.id}`);
                                            if (cardElement) {
                                                const offset = 100; // Altura do header fixo
                                                const elementPosition = cardElement.getBoundingClientRect().top + window.pageYOffset;
                                                const offsetPosition = elementPosition - offset;

                                                window.scrollTo({
                                                    top: offsetPosition,
                                                    behavior: 'smooth'
                                                });
                                            }
                                        }, 300);
                                    }}
                                    className="flex items-center p-2.5 bg-slate-50 border border-slate-100 rounded-2xl hover:border-[#279267] hover:bg-green-50 transition-all group text-left"
                                >
                                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-slate-200 flex-shrink-0 mr-3">
                                        <img src={partner.imageUrl} alt={partner.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <h4 className="text-[11px] sm:text-sm font-bold text-slate-900 group-hover:text-[#279267] transition-colors leading-tight mb-1 break-words">{partner.name}</h4>
                                        <p className="text-[9px] sm:text-[10px] font-black text-[#c54b4b] uppercase tracking-wider leading-tight break-words">
                                            {partner.couponDescription || "Confira o benefício exclusivo"}
                                        </p>
                                    </div>
                                    <ChevronRight size={18} className="text-slate-300 group-hover:text-[#279267] transition-colors ml-2 flex-shrink-0" />
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="sticky top-20 z-40 bg-white border-b border-slate-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar whitespace-nowrap flex-grow">
                        <div className="flex items-center text-slate-400 mr-4 font-bold text-sm uppercase tracking-wider"><Filter size={16} className="mr-2" /> Filtrar:</div>
                        {['Todos', ...categories.map(c => c.name)].map(cat => (
                            <button key={cat} onClick={() => handleCategoryClick(cat)} className={`px-5 py-2 rounded-full text-xs font-bold transition-all border ${activeCategory === cat ? 'bg-[#279267] border-[#279267] text-white shadow-lg shadow-[#279267]/20' : 'bg-white border-slate-200 text-slate-500 hover:border-[#279267]/20 hover:text-[#279267]'}`}>{cat}</button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-80">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar parceiro pelo nome..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-2xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#279267] focus:border-[#279267] sm:text-sm transition-all font-medium"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm("")}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </section>

            <section id="results-grid" className="py-8 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedPartners.length > 0 ? paginatedPartners.map((partner) => (
                            <div key={partner.id} className="flex flex-col">
                                <button 
                                    onClick={() => {
                                        const isExpanding = expandedPartnerId !== partner.id;
                                        setExpandedPartnerId(isExpanding ? partner.id : null);
                                        if (isExpanding) {
                                            setTimeout(() => {
                                                const element = document.getElementById(`partner-card-${partner.id}`);
                                                if (element) {
                                                    const offset = 120;
                                                    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
                                                    window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
                                                }
                                            }, 100);
                                        }
                                    }}
                                    className={`flex items-center p-3 bg-white border rounded-2xl transition-all group text-left shadow-sm hover:shadow-md ${expandedPartnerId === partner.id ? 'border-[#279267] bg-green-50 ring-2 ring-[#279267]/10' : 'border-slate-100'}`}
                                >
                                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-slate-200 flex-shrink-0 mr-4">
                                        <img src={partner.imageUrl} alt={partner.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#279267] transition-colors leading-tight break-words">{partner.name}</h4>
                                        <p className="text-[10px] font-black text-[#279267] uppercase tracking-widest mt-0.5">{partner.category}</p>
                                    </div>
                                    <div className={`transition-transform duration-300 ${expandedPartnerId === partner.id ? 'rotate-90' : ''}`}>
                                        <ChevronRight size={20} className="text-slate-300 group-hover:text-[#279267]" />
                                    </div>
                                </button>
                                
                                <AnimatePresence>
                                    {expandedPartnerId === partner.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                            animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                            transition={{ duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] }}
                                            className="overflow-hidden origin-top bg-white rounded-2xl border border-slate-100 shadow-lg"
                                        >
                                            <PartnerCard partner={partner} isFlat={true} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )) : (
                            <div className="col-span-full py-20 text-center">
                                <div className="text-slate-300 mb-4 flex justify-center"><Store size={64} strokeWidth={1} /></div>
                                <h3 className="text-xl font-bold text-slate-400">
                                    {searchTerm ? `Nenhum parceiro encontrado para "${searchTerm}"` : "Nenhum parceiro nesta categoria ainda."}
                                </h3>
                                {!searchTerm && <a href="#anuncie" className="text-[#279267] font-bold mt-2 inline-block hover:underline">Seja o primeiro a anunciar aqui!</a>}
                            </div>
                        )}
                    </div>

                    {totalPartnersPages > 1 && (
                        <div className="mt-12 flex justify-center items-center space-x-2">
                            <button 
                                onClick={() => {
                                    setPartnersPage(prev => Math.max(1, prev - 1));
                                    document.getElementById('results-grid')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                disabled={partnersPage === 1}
                                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div className="flex items-center space-x-1">
                                {Array.from({ length: totalPartnersPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => {
                                            setPartnersPage(page);
                                            document.getElementById('results-grid')?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${partnersPage === page ? 'bg-[#279267] text-white shadow-lg shadow-[#279267]/20' : 'bg-white border border-slate-200 text-slate-500 hover:border-[#279267]/20'}`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={() => {
                                    setPartnersPage(prev => Math.min(totalPartnersPages, prev + 1));
                                    document.getElementById('results-grid')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                disabled={partnersPage === totalPartnersPages}
                                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}

                    {featuredPartner && (
                        <div 
                            onClick={() => {
                                setSearchTerm(featuredPartner.name);
                                const element = document.getElementById('results-grid');
                                if (element) element.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="mt-8 p-6 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl overflow-hidden cursor-pointer hover:bg-slate-800 transition-all group"
                        >
                            <div className="flex items-center space-x-4 w-full md:w-auto">
                                <div className="bg-amber-400 p-3 rounded-2xl shadow-lg shadow-amber-400/20 flex-shrink-0 group-hover:scale-110 transition-transform">
                                    <Trophy className="text-white w-6 h-6" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-white font-black uppercase tracking-tight text-xs sm:text-sm group-hover:text-amber-400 transition-colors">Parceiro da Semana</h4>
                                    <p className="text-[9px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest">O mais acessado nos últimos 7 dias</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4 bg-slate-800/50 p-3 rounded-2xl border border-slate-700 w-full md:w-auto md:pr-6 min-w-0">
                                <img src={featuredPartner.imageUrl} alt={featuredPartner.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-white/10" />
                                <div className="min-w-0 flex-grow">
                                    <p className="text-white font-bold text-sm sm:text-base group-hover:text-amber-400 transition-colors leading-tight break-words">{featuredPartner.name}</p>
                                    <p className="text-[#279267] text-[10px] font-black uppercase tracking-widest leading-tight mt-1">{featuredPartner.category}</p>
                                </div>
                                <ChevronRight className="text-slate-500 ml-auto group-hover:text-amber-400 transition-colors flex-shrink-0" size={20} />
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <section id="anuncie" className="py-10 bg-white border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:flex lg:items-center lg:gap-16">
                    <div className="lg:w-1/2 mb-16 lg:mb-0">
                        <div className="inline-flex items-center space-x-2 text-[#c54b4b] font-bold text-xs uppercase tracking-widest mb-4">
                            <Megaphone size={14} /> <span>Impulsione seu negócio</span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-8 leading-tight">Sua marca <span className="text-[#279267]">aparecendo</span> nos melhores lugares.</h2>
                        <p className="text-slate-600 text-lg leading-relaxed mb-8">Nossa rede de TVs inteligentes em comércios e veículos de aplicativos garante visibilidade máxima para quem realmente importa: o seu cliente local.</p>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[#279267] font-black text-2xl mb-1">10k+</p>
                                <p className="text-slate-500 text-xs font-bold uppercase">Visualizações/mês</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[#279267] font-black text-2xl mb-1">100%</p>
                                <p className="text-slate-500 text-xs font-bold uppercase">Foco Regional</p>
                            </div>
                        </div>
                    </div>
                    <div className="lg:w-1/2">
                        <LeadForm type="anunciante" title="Quero Anunciar" subtitle="Preencha os dados e nossa equipe entrará em contato com uma proposta exclusiva." />
                    </div>
                </div>
            </section>

            <section id="parceria" className="py-10 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-8">
                    <h2 className="text-4xl font-black text-slate-900 mb-4">Seja nosso parceiro estratégico</h2>
                    <p className="text-slate-600 max-w-2xl mx-auto">Temos oportunidades para quem deseja monetizar seu veículo ou seu estabelecimento comercial.</p>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-12">
                        <LeadForm type="motorista" title="Motorista de App" subtitle="Renda extra instalando nossas telas inteligentes em seu veículo. Simples e rentável." />
                        <LeadForm type="comerciante" title="Comerciante" subtitle="Transforme o tempo de espera dos seus clientes em entretenimento e lucro extra." />
                    </div>
                </div>
            </section>

            <section id="contato" className="py-10 bg-white border-t border-slate-100">
                <div className="max-w-3xl mx-auto px-4">
                    <LeadForm type="contato" title="Fale Conosco" subtitle="Dúvidas, sugestões ou suporte? Estamos prontos para te atender via WhatsApp." />
                </div>
            </section>
        </main>
    );
};

const AdminPage = ({ 
    partners, 
    setPartners, 
    categories, 
    setCategories, 
    commercialBanners, 
    setCommercialBanners, 
    headerLogo, 
    setHeaderLogo, 
    featuredCoupons, 
    setFeaturedCoupons, 
    welcomeMessages, 
    setWelcomeMessages,
    welcomeAccessCounts,
    couponCampaigns,
    setCouponCampaigns,
    couponCampaignAccessCounts,
    giftCards,
    setGiftCards,
    isLoadingGiftCards,
    fetchGiftCards,
    activeGiftCards,
    isLoadingActiveGiftCards,
    activeGiftCardsError,
    fetchActiveGiftCards,
    handleUpdateGiftCard,
    isUpdatingGiftCard,
    setIsUpdatingGiftCard,
    bannerLinks,
    setBannerLinks,
    bannerNames,
    setBannerNames
}: { 
    partners: Partner[], 
    setPartners: React.Dispatch<React.SetStateAction<Partner[]>>, 
    categories: Category[], 
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>, 
    commercialBanners: CommercialBannerData[], 
    setCommercialBanners: React.Dispatch<React.SetStateAction<CommercialBannerData[]>>, 
    headerLogo: string | null, 
    setHeaderLogo: React.Dispatch<React.SetStateAction<string | null>>, 
    featuredCoupons: FeaturedCoupon[], 
    setFeaturedCoupons: React.Dispatch<React.SetStateAction<FeaturedCoupon[]>>, 
    welcomeMessages: WelcomeMessage[], 
    setWelcomeMessages: React.Dispatch<React.SetStateAction<WelcomeMessage[]>>,
    welcomeAccessCounts: Record<string, number>,
    couponCampaigns: CouponCampaign[],
    setCouponCampaigns: React.Dispatch<React.SetStateAction<CouponCampaign[]>>,
    couponCampaignAccessCounts: Record<string, number>,
    giftCards: any[],
    setGiftCards: React.Dispatch<React.SetStateAction<any[]>>,
    isLoadingGiftCards: boolean,
    fetchGiftCards: () => Promise<void>,
    activeGiftCards: any[],
    isLoadingActiveGiftCards: boolean,
    activeGiftCardsError: string | null,
    fetchActiveGiftCards: () => Promise<void>,
    handleUpdateGiftCard: (cardNumber: string, field: string, value: any) => Promise<void>,
    isUpdatingGiftCard: string | null,
    setIsUpdatingGiftCard: React.Dispatch<React.SetStateAction<string | null>>,
    bannerLinks: {[key: number]: string},
    setBannerLinks: React.Dispatch<React.SetStateAction<{[key: number]: string}>>,
    bannerNames: {[key: number]: string},
    setBannerNames: React.Dispatch<React.SetStateAction<{[key: number]: string}>>
}) => {
    const [activeTab, setActiveTab] = useState<'partners' | 'about' | 'cases' | 'ranking' | 'cashback' | 'featured' | 'coupons' | 'welcome' | 'campaigns' | 'giftcards'>('partners');
    const [giftCardPage, setGiftCardPage] = useState(0);
    const [cashbackLogsPage, setCashbackLogsPage] = useState(0);
    const [activeGiftCardsPage, setActiveGiftCardsPage] = useState(0);
    const [activeGiftCardsFilter, setActiveGiftCardsFilter] = useState<'all' | 'used' | 'unused'>('all');
    const [activeGiftCardsPeriod, setActiveGiftCardsPeriod] = useState<'all' | 'month' | 'prev_month'>('all');

    const filteredActiveGiftCards = useMemo(() => {
        let filtered = [...activeGiftCards];
        
        // Status Filter
        if (activeGiftCardsFilter === 'used') filtered = filtered.filter(c => c.used);
        if (activeGiftCardsFilter === 'unused') filtered = filtered.filter(c => !c.used);
        
        // Period Filter
        if (activeGiftCardsPeriod !== 'all') {
            const now = new Date();
            // Use UTC to be consistent with Supabase timestamps
            const nowYear = now.getUTCFullYear();
            const nowMonth = now.getUTCMonth();
            
            filtered = filtered.filter(c => {
                // Try activated_at first, then created_at
                const dateStr = c.activated_at || c.created_at;
                if (!dateStr) return false; 
                
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) return false;
                
                const dateYear = date.getUTCFullYear();
                const dateMonth = date.getUTCMonth();
                
                if (activeGiftCardsPeriod === 'month') {
                    return dateYear === nowYear && dateMonth === nowMonth;
                }
                if (activeGiftCardsPeriod === 'prev_month') {
                    let targetMonth = nowMonth - 1;
                    let targetYear = nowYear;
                    if (targetMonth < 0) {
                        targetMonth = 11;
                        targetYear--;
                    }
                    return dateYear === targetYear && dateMonth === targetMonth;
                }
                return true;
            });
        }
        return filtered;
    }, [activeGiftCards, activeGiftCardsFilter, activeGiftCardsPeriod]);

    const activeGiftCardsTotalPages = Math.ceil(filteredActiveGiftCards.length / 10);
    const activeGiftCardsDisplayData = filteredActiveGiftCards.slice(activeGiftCardsPage * 10, (activeGiftCardsPage + 1) * 10);
    const navigate = useNavigate();
    
    const [welcomeFormData, setWelcomeFormData] = useState({
        ref_id: '',
        title: '',
        message: '',
        logo_url: '' as string | null,
        logoFile: null as File | null
    });
    const [editingWelcomeId, setEditingWelcomeId] = useState<string | null>(null);

    const [campaignFormData, setCampaignFormData] = useState({
        ref_id: '',
        title: '',
        message: '',
        logo_url: '' as string | null,
        logoFile: null as File | null,
        partner_id: '' as string | null,
        custom_coupon: '' as string | null,
        custom_description: '' as string | null,
        expires_at: '' as string | null
    });
    const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
    const [isSupabaseAuth, setIsSupabaseAuth] = useState(false);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setIsSupabaseAuth(!!data.user);
        });
    }, []);

    const handleAddOrUpdateWelcome = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let logoUrl = welcomeFormData.logo_url;
            if (welcomeFormData.logoFile) {
                const fileExt = welcomeFormData.logoFile.name.split('.').pop();
                const fileName = `welcome/logo_${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('partners').upload(fileName, welcomeFormData.logoFile);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('partners').getPublicUrl(fileName);
                logoUrl = publicUrl;
            }

            const payload = {
                ref_id: welcomeFormData.ref_id,
                title: welcomeFormData.title,
                message: welcomeFormData.message,
                logo_url: logoUrl
            };

            if (editingWelcomeId) {
                const { error } = await supabase
                    .from('welcome_messages')
                    .update(payload)
                    .eq('id', editingWelcomeId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('welcome_messages')
                    .insert(payload);
                if (error) throw error;
            }

            // Refresh list
            const { data } = await supabase.from('welcome_messages').select('*').order('created_at', { ascending: false });
            if (data) setWelcomeMessages(data);

            setWelcomeFormData({ 
                ref_id: '', 
                title: '', 
                message: '', 
                logo_url: '', 
                logoFile: null
            });
            setEditingWelcomeId(null);
            alert(editingWelcomeId ? "Mensagem atualizada!" : "Mensagem cadastrada!");
        } catch (error: any) {
            logger.error('Error saving welcome message:', error);
            if (error.code === '23505') {
                alert("Este ID de Referência já está em uso.");
            } else {
                alert("Erro ao salvar mensagem.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditWelcome = (msg: WelcomeMessage) => {
        setEditingWelcomeId(msg.id);
        setWelcomeFormData({
            ref_id: msg.ref_id,
            title: msg.title,
            message: msg.message,
            logo_url: msg.logo_url,
            logoFile: null
        });
        setActiveTab('welcome');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAddOrUpdateCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let logoUrl = campaignFormData.logo_url;
            if (campaignFormData.logoFile) {
                const fileExt = campaignFormData.logoFile.name.split('.').pop();
                const fileName = `campaigns/logo_${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('partners').upload(fileName, campaignFormData.logoFile);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('partners').getPublicUrl(fileName);
                logoUrl = publicUrl;
            }

            const payload = {
                ref_id: campaignFormData.ref_id,
                title: campaignFormData.title,
                message: campaignFormData.message,
                logo_url: logoUrl,
                partner_id: campaignFormData.partner_id,
                custom_coupon: campaignFormData.custom_coupon || null,
                custom_description: campaignFormData.custom_description || null,
                expires_at: campaignFormData.expires_at || null
            };

            if (editingCampaignId) {
                const { error } = await supabase
                    .from('coupon_campaigns')
                    .update(payload)
                    .eq('id', editingCampaignId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('coupon_campaigns')
                    .insert(payload);
                if (error) throw error;
            }

            // Refresh list
            const { data } = await supabase.from('coupon_campaigns').select('*').order('created_at', { ascending: false });
            if (data) setCouponCampaigns(data);

            setCampaignFormData({ 
                ref_id: '', 
                title: '', 
                message: '', 
                logo_url: '', 
                logoFile: null,
                partner_id: '',
                custom_coupon: '',
                custom_description: '',
                expires_at: ''
            });
            setEditingCampaignId(null);
            alert(editingCampaignId ? "Campanha atualizada!" : "Campanha cadastrada!");
        } catch (error: any) {
            logger.error('Error saving campaign:', error);
            if (error.code === '23505') {
                alert("Este ID de Referência já está em uso.");
            } else {
                alert("Erro ao salvar campanha.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditCampaign = (campaign: CouponCampaign) => {
        setEditingCampaignId(campaign.id);
        setCampaignFormData({
            ref_id: campaign.ref_id,
            title: campaign.title,
            message: campaign.message,
            logo_url: campaign.logo_url,
            logoFile: null,
            partner_id: campaign.partner_id,
            custom_coupon: campaign.custom_coupon || '',
            custom_description: campaign.custom_description || '',
            expires_at: campaign.expires_at || ''
        });
        setActiveTab('campaigns');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRemoveCampaign = async (id: string) => {
        if (!confirm("Tem certeza que deseja remover esta campanha?")) return;
        try {
            const { error } = await supabase.from('coupon_campaigns').delete().eq('id', id);
            if (error) throw error;
            setCouponCampaigns(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            logger.error('Error removing campaign:', error);
            alert("Erro ao remover campanha.");
        }
    };

    const handleRemoveWelcome = async (id: string) => {
        if (!confirm("Tem certeza que deseja remover esta mensagem de boas-vindas?")) return;
        try {
            const { error } = await supabase.from('welcome_messages').delete().eq('id', id);
            if (error) throw error;
            setWelcomeMessages(prev => prev.filter(m => m.id !== id));
        } catch (error) {
            logger.error('Error removing welcome message:', error);
            alert("Erro ao remover mensagem.");
        }
    };
    
    // Coupon Mass Edit State
    const [couponEdits, setCouponEdits] = useState<{[key: string]: { orderIndex: number, pageNumber: number, coupon: string, couponDescription: string }}>({});

    const handleSaveCoupons = async () => {
        setIsSubmitting(true);
        try {
            // First, validate 10 partners per page limit
            const pageCounts: { [key: number]: number } = {};
            
            // Calculate current counts from existing partners
            partners.forEach(p => {
                const page = couponEdits[p.id]?.pageNumber || p.page_number || 1;
                pageCounts[page] = (pageCounts[page] || 0) + 1;
            });

            // Check if any page exceeds 10
            const overlimitPage = Object.entries(pageCounts).find(([_, count]) => count > 10);
            if (overlimitPage) {
                throw new Error(`A página ${overlimitPage[0]} já possui 10 parceiros. Limite atingido.`);
            }

            const updates = Object.entries(couponEdits).map(([id, edit]) => ({
                id,
                order_index: edit.orderIndex,
                page_number: edit.pageNumber,
                coupon: edit.coupon,
                coupon_description: edit.couponDescription
            }));

            for (const update of updates) {
                const { error } = await supabase.from('partners').update({
                    order_index: update.order_index,
                    page_number: update.page_number,
                    coupon: update.coupon,
                    coupon_description: update.coupon_description
                }).eq('id', update.id);
                if (error) throw error;
            }

            setPartners(prev => prev.map(p => {
                if (couponEdits[p.id]) {
                    return {
                        ...p,
                        orderIndex: couponEdits[p.id].orderIndex,
                        page_number: couponEdits[p.id].pageNumber,
                        coupon: couponEdits[p.id].coupon,
                        couponDescription: couponEdits[p.id].couponDescription
                    };
                }
                return p;
            }));

            setCouponEdits({});
            alert("Cupons e sequências atualizados com sucesso!");
        } catch (error: any) {
            logger.error('Error saving coupons:', error);
            alert(`Erro ao salvar: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCouponChange = (partnerId: string, field: 'orderIndex' | 'pageNumber' | 'coupon' | 'couponDescription', value: any) => {
        setCouponEdits(prev => {
            const existing = prev[partnerId] || { 
                orderIndex: partners.find(p => p.id === partnerId)?.orderIndex || 0,
                pageNumber: partners.find(p => p.id === partnerId)?.page_number || 1,
                coupon: partners.find(p => p.id === partnerId)?.coupon || '',
                couponDescription: partners.find(p => p.id === partnerId)?.couponDescription || ''
            };
            return {
                ...prev,
                [partnerId]: {
                    ...existing,
                    [field]: value
                }
            };
        });
    };
    
    // Partner Form State
    const [formData, setFormData] = useState<{
        name: string, 
        category: string, 
        activity: string, 
        description: string, 
        address: string, 
        imageUrl: string, 
        imageFile: File | null, 
        images: string[],
        imageFiles: (File | null)[],
        videoUrl: string,
        link: string, 
        whatsappLink: string, 
        googleReviewLink: string,
        websiteUrl: string,
        coupon: string, 
        couponDescription: string, 
        isAuthorized: boolean, 
        cashbackEnabled: boolean, 
        giftCardEnabled: boolean,
        orderIndex: number, 
        page_number: number,
        displayId: number
    }>({ 
        name: '', 
        category: categories.length > 0 ? categories[0].name : '', 
        activity: '', 
        description: '', 
        address: '', 
        imageUrl: '', 
        imageFile: null, 
        images: ['', '', '', ''],
        imageFiles: [null, null, null, null],
        videoUrl: '',
        link: '', 
        whatsappLink: '', 
        googleReviewLink: '',
        websiteUrl: '',
        coupon: '', 
        couponDescription: '', 
        isAuthorized: true, 
        cashbackEnabled: true, 
        giftCardEnabled: false,
        orderIndex: 0, 
        page_number: 1,
        displayId: 0 
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    
    // About Us State
    const [aboutConfig, setAboutConfig] = useState<AboutConfig>({ id: 1, history: '', logoUrl: null, mission_vision_values: '' });
    const [aboutLogoFile, setAboutLogoFile] = useState<File | null>(null);
    
    // Success Cases State
    const [successCases, setSuccessCases] = useState<SuccessCase[]>([]);
    const [caseFormData, setCaseFormData] = useState<{companyName: string, description: string, logoUrl: string, logoFile: File | null, storeImageUrl: string, storeFile: File | null}>({ companyName: '', description: '', logoUrl: '', logoFile: null, storeImageUrl: '', storeFile: null });
    const [editingCaseId, setEditingCaseId] = useState<string | null>(null);

    // Ranking State
    const [rankingData, setRankingData] = useState<any[]>([]);
    const [partnerRankingPeriod, setPartnerRankingPeriod] = useState<'all' | 'month' | 'prev_month'>('all');
    const [shareRankingData, setShareRankingData] = useState<any[]>([]);
    const [sharePeriod, setSharePeriod] = useState<'all' | 'month' | 'prev_month'>('all');
    const [clickRankingData, setClickRankingData] = useState<any[]>([]);
    const [clickPeriod, setClickPeriod] = useState<'all' | 'month' | 'prev_month'>('all');
    const [cashbackRankingData, setCashbackRankingData] = useState<any[]>([]);
    const [cashbackRankingPeriod, setCashbackRankingPeriod] = useState<'all' | 'month' | 'prev_month'>('all');
    const [cashbackConfigs, setCashbackConfigs] = useState<CashbackConfig[]>([]);
    const [cashbackLogs, setCashbackLogs] = useState<CashbackLog[]>([]);
    const [customerRankingData, setCustomerRankingData] = useState<any[]>([]);
    const [customerRankingPeriod, setCustomerRankingPeriod] = useState<'all' | 'month' | 'prev_month'>('all');
    const [bannerClickRankingData, setBannerClickRankingData] = useState<any[]>([]);
    const [isRankingLoading, setIsRankingLoading] = useState(false);
    const [rankingError, setRankingError] = useState<string | null>(null);

    const [newCategoryName, setNewCategoryName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{type: 'partner' | 'category' | 'banner' | 'case', id: string} | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const aboutLogoInputRef = useRef<HTMLInputElement>(null);
    const caseLogoInputRef = useRef<HTMLInputElement>(null);
    const caseStoreInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const newLinks = { ...bannerLinks };
        commercialBanners.forEach(b => {
            if ([1, 3, 4].includes(b.id)) {
                newLinks[b.id] = b.linkUrl || '';
            }
        });
        setBannerLinks(newLinks);
    }, [commercialBanners]);

    const getNextAvailableDisplayId = (currentPartners: Partner[]) => {
        const usedIds = currentPartners.map(p => p.displayId).filter(id => id > 0);
        let nextId = 1;
        while (usedIds.includes(nextId)) {
            nextId++;
        }
        return nextId;
    };

    const [debugCounts, setDebugCounts] = useState<{ [key: string]: number }>({});
    const [debugError, setDebugError] = useState<string | null>(null);
    const [rawSample, setRawSample] = useState<any>(null);

    useEffect(() => {
        const checkData = async () => {
            setDebugError(null);
            try {
                const [coupons, customers, partners, clicks, shares, gCards, aGCards] = await Promise.all([
                    supabase.from('unlocked_coupons').select('*', { count: 'exact', head: true }),
                    supabase.from('customers').select('*', { count: 'exact', head: true }),
                    supabase.from('partners').select('*', { count: 'exact', head: true }),
                    supabase.from('partner_clicks').select('*', { count: 'exact', head: true }),
                    supabase.from('partner_shares').select('*', { count: 'exact', head: true }),
                    supabase.from('gift_cards').select('*', { count: 'exact', head: true }),
                    supabase.from('active_gift_cards').select('*', { count: 'exact', head: true })
                ]);
                
                setDebugCounts({
                    coupons: coupons.count || 0,
                    customers: customers.count || 0,
                    partners: partners.count || 0,
                    clicks: clicks.count || 0,
                    shares: shares.count || 0,
                    giftCards: gCards.count || 0,
                    activeGiftCards: aGCards.count || 0
                });

                // Try to fetch a raw sample to see if data is actually visible
                const { data: sample, error: sampleError } = await supabase
                    .from('unlocked_coupons')
                    .select('*')
                    .limit(1);
                
                if (sampleError) {
                    setDebugError(`Erro RLS/Banco: ${sampleError.message} (Código: ${sampleError.code})`);
                } else if (sample && sample.length > 0) {
                    setRawSample(sample[0]);
                } else {
                    setRawSample('Nenhum dado retornado (Tabela vazia ou RLS bloqueando)');
                }

                if (coupons.error) logger.error('Error checking unlocked_coupons count:', coupons.error);
            } catch (err: any) {
                logger.error('Exception checking counts:', err);
                setDebugError(`Exceção: ${err.message || String(err)}`);
            }
        };
        checkData();
        fetchAdminData();
        if (activeTab === 'ranking') fetchRanking();
        if (activeTab === 'cashback') fetchCashbackConfigs();
        if (activeTab === 'giftcards') {
            fetchGiftCards();
            fetchActiveGiftCards();
        }
    }, [activeTab, partnerRankingPeriod, sharePeriod, clickPeriod, cashbackRankingPeriod, customerRankingPeriod]);

    useEffect(() => {
        if (!editingId && formData.displayId === 0 && partners.length > 0) {
            setFormData(prev => ({ ...prev, displayId: getNextAvailableDisplayId(partners) }));
        }
    }, [partners, editingId]);

    const fetchRanking = async () => {
        setIsRankingLoading(true);
        setRankingError(null);
        try {
            const now = new Date();
            const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
            const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

            // Fetch Partner Ranking
            try {
                const { data: partnersData, error: pError } = await supabase.from('partners').select('id, name, display_id');
                if (pError) throw pError;
                
                if (partnersData) {
                    const ranking = await Promise.all(partnersData.map(async (p) => {
                        let query = supabase
                            .from('partner_access_logs')
                            .select('*', { count: 'exact', head: true })
                            .eq('partner_id', p.id);

                        if (partnerRankingPeriod === 'month') {
                            query = query.gte('created_at', firstDayCurrentMonth);
                        } else if (partnerRankingPeriod === 'prev_month') {
                            query = query.gte('created_at', firstDayPrevMonth).lte('created_at', lastDayPrevMonth);
                        }

                        const { count } = await query;

                        return {
                            ...p,
                            count: count || 0
                        };
                    }));

                    setRankingData(ranking.sort((a, b) => b.count - a.count).slice(0, 10));
                }
            } catch (err) {
                logger.error('Error fetching partner ranking:', err);
            }

            // Fetch Share Ranking
            try {
                let query = supabase.from('partner_shares').select('partner_id, partner_name');
                
                if (sharePeriod === 'month') {
                    query = query.gte('created_at', firstDayCurrentMonth);
                } else if (sharePeriod === 'prev_month') {
                    query = query.gte('created_at', firstDayPrevMonth).lte('created_at', lastDayPrevMonth);
                }

                const { data: shares, error: shareError } = await query;
                if (shareError) throw shareError;

                const ranking: { [key: string]: any } = {};
                shares?.forEach((s: any) => {
                    const partnerId = s.partner_id;
                    if (!ranking[partnerId]) {
                        ranking[partnerId] = {
                            partner_id: partnerId,
                            partner_name: s.partner_name || 'N/A',
                            share_count: 0
                        };
                    }
                    ranking[partnerId].share_count++;
                });

                setShareRankingData(Object.values(ranking).sort((a, b) => b.share_count - a.share_count).slice(0, 10));
            } catch (err) {
                logger.error('Error fetching share ranking:', err);
            }

            // Fetch Click Ranking
            try {
                const { data: ranking, error: clickError } = await supabase.rpc('get_partner_click_counts', { 
                    period: clickPeriod 
                });
                
                if (clickError) throw clickError;
                
                const sortedRanking = (ranking || []).sort((a, b) => {
                    const totalA = Number(a.instagram_count || 0) + Number(a.whatsapp_count || 0) + Number(a.google_count || 0) + Number(a.website_count || 0);
                    const totalB = Number(b.instagram_count || 0) + Number(b.whatsapp_count || 0) + Number(b.google_count || 0) + Number(b.website_count || 0);
                    return totalB - totalA;
                });
                
                setClickRankingData(sortedRanking);
            } catch (err) {
                logger.error('Error fetching click ranking:', err);
            }

            // Fetch Customer Ranking (based on Unlocked Coupons)
            try {
                // Fetch both coupons and customers for better name mapping
                const [couponsRes, customersRes] = await Promise.all([
                    supabase.from('unlocked_coupons').select('whatsapp, customer_name, created_at'),
                    supabase.from('customers').select('whatsapp, name')
                ]);

                if (couponsRes.error) {
                    throw couponsRes.error;
                }
                
                const allUnlockedCoupons = couponsRes.data || [];
                const allCustomers = customersRes.data || [];
                
                // Create a name map from customers table
                const customerNameMap: { [key: string]: string } = {};
                allCustomers.forEach(c => {
                    if (c.whatsapp && c.name) {
                        customerNameMap[c.whatsapp.trim()] = c.name.trim();
                    }
                });

                if (allUnlockedCoupons.length > 0) {
                    const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

                    const rankingMap: { [key: string]: { name: string, all: number, current: number, prev: number } } = {};

                    allUnlockedCoupons.forEach(coupon => {
                        const whatsapp = (coupon.whatsapp || '').trim();
                        if (!whatsapp) return;
                        
                        const couponDate = new Date(coupon.created_at);
                        
                        if (!rankingMap[whatsapp]) {
                            // Try to get name from: 1. Coupon record, 2. Customers table, 3. Default
                            const name = (coupon.customer_name || customerNameMap[whatsapp] || 'Cliente').trim();
                            rankingMap[whatsapp] = { 
                                name: name || 'Cliente', 
                                all: 0, 
                                current: 0, 
                                prev: 0 
                            };
                        } else if ((rankingMap[whatsapp].name === 'Cliente' || !rankingMap[whatsapp].name) && coupon.customer_name) {
                            // Update name if we previously had 'Cliente' or empty but now found a real name
                            rankingMap[whatsapp].name = coupon.customer_name.trim();
                        }
                        
                        rankingMap[whatsapp].all++;
                        if (couponDate >= firstDayCurrentMonth) {
                            rankingMap[whatsapp].current++;
                        } else if (couponDate >= firstDayPrevMonth && couponDate <= lastDayPrevMonth) {
                            rankingMap[whatsapp].prev++;
                        }
                    });

                    const sortedCustomerRanking = Object.entries(rankingMap)
                        .map(([whatsapp, stats]) => ({
                            whatsapp,
                            name: stats.name,
                            count: customerRankingPeriod === 'all' ? stats.all : 
                                   customerRankingPeriod === 'month' ? stats.current : stats.prev
                        }))
                        .filter(item => item.count > 0)
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 10);

                    setCustomerRankingData(sortedCustomerRanking);
                } else {
                    setCustomerRankingData([]);
                }
            } catch (err) {
                logger.error('Error in customer ranking block:', err);
                setRankingError(err instanceof Error ? err.message : String(err));
                setCustomerRankingData([]);
            }
        } catch (error) {
            logger.error('Global error in fetchRanking:', error);
        } finally {
            // Fetch Banner Click Ranking
            try {
                const { data: bannerClicks, error: bannerError } = await supabase
                    .from('banner_clicks')
                    .select('partner_name, link_url, clicked_at')
                    .order('clicked_at', { ascending: false });
                
                if (bannerError) throw bannerError;
                
                // Group by partner and link
                const bannerRanking: { [key: string]: any } = {};
                bannerClicks?.forEach((c: any) => {
                    const key = `${c.partner_name}-${c.link_url}`;
                    if (!bannerRanking[key]) {
                        bannerRanking[key] = {
                            partner_name: c.partner_name,
                            banner_link: c.link_url,
                            click_count: 0,
                            last_click: c.clicked_at
                        };
                    }
                    bannerRanking[key].click_count++;
                });
                
                setBannerClickRankingData(Object.values(bannerRanking).sort((a, b) => b.click_count - a.click_count));
            } catch (err) {
                logger.error('Error fetching banner click ranking:', err);
            }

            setIsRankingLoading(false);
        }
    };

    async function fetchCashbackConfigs() {
        try {
            const { data: configs } = await supabase.from('cashback_configs').select('*').order('id', { ascending: true });
            const { data: logs } = await supabase.from('cashback_logs').select('*').order('created_at', { ascending: false }).limit(50);
            if (configs) setCashbackConfigs(configs);
            if (logs) setCashbackLogs(logs);

            // Fetch Ranking
            let query = supabase.from('cashback_logs').select('store_name, cashback_value, cashback_label, created_at');
            
            const now = new Date();
            const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
            const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

            if (cashbackRankingPeriod === 'month') {
                query = query.gte('created_at', firstDayCurrentMonth);
            } else if (cashbackRankingPeriod === 'prev_month') {
                query = query.gte('created_at', firstDayPrevMonth).lte('created_at', lastDayPrevMonth);
            }

            const { data: allLogs } = await query;
            
            if (allLogs) {
                const ranking: { [key: string]: number } = {};
                allLogs.forEach(log => {
                    const value = parseCashbackValue(log.cashback_label, Number(log.cashback_value));
                    ranking[log.store_name] = (ranking[log.store_name] || 0) + value;
                });

                const sortedRanking = Object.entries(ranking)
                    .map(([name, total]) => ({ name, total }))
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 10);

                setCashbackRankingData(sortedRanking);
            }
        } catch (error) {
            logger.error('Error fetching cashback:', error);
        }
    }

    const handleUpdateCashbackConfig = async (id: number, field: string, value: any) => {
        try {
            const { error } = await supabase.from('cashback_configs').update({ [field]: value }).eq('id', id);
            if (error) throw error;
            setCashbackConfigs(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
        } catch (error) {
            logger.error('Error updating cashback config:', error);
        }
    };

    const fetchAdminData = async () => {
        try {
            const [aboutRes, casesRes] = await Promise.all([
                supabase.from('about_config').select('*').eq('id', 1).maybeSingle(),
                supabase.from('success_cases').select('*').order('created_at', { ascending: false })
            ]);

            if (aboutRes.data) {
                setAboutConfig({
                    id: aboutRes.data.id,
                    history: DOMPurify.sanitize(aboutRes.data.history),
                    logoUrl: aboutRes.data.logo_url,
                    mission_vision_values: DOMPurify.sanitize(aboutRes.data.mission_vision_values || '')
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
            }
        } catch (error) {
            logger.error('Error fetching admin data:', error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setFormData(prev => ({ ...prev, imageUrl: previewUrl, imageFile: file }));
        }
    };

    const handleAdditionalFileChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            const newImages = [...formData.images];
            const newImageFiles = [...formData.imageFiles];
            newImages[index] = previewUrl;
            newImageFiles[index] = file;
            setFormData(prev => ({ ...prev, images: newImages, imageFiles: newImageFiles }));
        }
    };

    const handleAddOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.imageUrl && !formData.imageFile) {
            alert("Por favor, selecione uma imagem principal para o parceiro.");
            return;
        }

        setIsSubmitting(true);

        try {
            let finalImageUrl = formData.imageUrl;
            const finalImages = [...formData.images];

            // Upload main image
            if (formData.imageFile) {
                const fileExt = formData.imageFile.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('partners')
                    .upload(fileName, formData.imageFile, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) {
                    logger.error('Upload error:', uploadError);
                    throw new Error('Erro ao fazer upload da imagem principal.');
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('partners')
                    .getPublicUrl(fileName);

                finalImageUrl = publicUrl;
            }

            // Upload additional images
            for (let i = 0; i < formData.imageFiles.length; i++) {
                const file = formData.imageFiles[i];
                if (file) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}_extra_${i}.${fileExt}`;
                    
                    const { error: uploadError } = await supabase.storage
                        .from('partners')
                        .upload(fileName, file, {
                            cacheControl: '3600',
                            upsert: false
                        });

                    if (uploadError) {
                        logger.error(`Upload error for extra image ${i}:`, uploadError);
                        throw new Error(`Erro ao fazer upload da imagem adicional ${i + 1}.`);
                    }

                    const { data: { publicUrl } } = supabase.storage
                        .from('partners')
                        .getPublicUrl(fileName);

                    finalImages[i] = publicUrl;
                }
            }

            const partnerData = {
                name: formData.name,
                category: formData.category,
                activity: formData.activity,
                description: formData.description,
                address: formData.address,
                image_url: finalImageUrl,
                images: finalImages.filter(img => img && img.startsWith('http')),
                video_url: formData.videoUrl || null,
                link: formData.link || null,
                whatsapp_link: formData.whatsappLink || null,
                google_review_link: formData.googleReviewLink || null,
                website_url: formData.websiteUrl || null,
                coupon: formData.coupon || null,
                coupon_description: formData.couponDescription || null,
                is_authorized: formData.isAuthorized,
                cashback_enabled: formData.cashbackEnabled,
                gift_card_enabled: formData.giftCardEnabled,
                order_index: formData.orderIndex,
                page_number: formData.page_number,
                display_id: formData.displayId
            };

            // Validate 10 partners per page limit
            const partnersInSamePage = partners.filter(p => (p.page_number || 1) === formData.page_number && p.id !== editingId);
            if (partnersInSamePage.length >= 10) {
                throw new Error(`A página ${formData.page_number} já possui 10 parceiros. Limite atingido.`);
            }

            console.log('FULL DATA BEING SENT TO SUPABASE:');
            console.dir(partnerData);

            if (editingId) {
                console.log('Attempting to update partner with ID:', editingId);
                const { data: updatedData, error } = await supabase
                    .from('partners')
                    .update(partnerData)
                    .eq('id', editingId)
                    .select();

                if (error) {
                    console.error('Supabase Update Error:', error);
                    alert(`Erro ao atualizar no banco de dados: ${error.message}`);
                    throw error;
                }
                
                const data = updatedData && updatedData.length > 0 ? updatedData[0] : null;

                if (!data) {
                    console.log('Update successful. Using local data for state update (RLS might be restricting immediate select).');
                    console.log('Fallback videoUrl:', formData.videoUrl);
                    // Fallback to local state update if DB update succeeded but select failed to return data
                    setPartners(prev => prev.map(p => p.id === editingId ? { 
                        ...p,
                        ...formData, 
                        imageUrl: finalImageUrl, 
                        images: partnerData.images,
                        videoUrl: formData.videoUrl || '',
                        websiteUrl: formData.websiteUrl || '',
                        id: editingId, 
                        displayId: partnerData.display_id || p.displayId || 0
                    } : p).sort((a, b) => a.orderIndex - b.orderIndex));
                } else {
                    console.log('Update response data:', data);
                    console.log('DB returned video_url:', data.video_url);
                    setPartners(prev => prev.map(p => p.id === editingId ? { 
                        ...formData, 
                        imageUrl: finalImageUrl, 
                        images: data.images || [],
                        videoUrl: data.video_url || '',
                        websiteUrl: data.website_url || '',
                        id: editingId, 
                        displayId: data.display_id 
                    } : p).sort((a, b) => a.orderIndex - b.orderIndex));
                }
                alert("Parceiro atualizado com sucesso!");
            } else {
                console.log('Attempting to insert new partner');
                const { data: insertedData, error } = await supabase
                    .from('partners')
                    .insert([partnerData])
                    .select();

                if (error) {
                    console.error('Supabase Insert Error:', error);
                    alert(`Erro ao salvar no banco de dados: ${error.message}`);
                    throw error;
                }
                
                const data = insertedData && insertedData.length > 0 ? insertedData[0] : null;
                
                if (!data) {
                    console.log('Insert successful. Using local data for state update.');
                    const newPartner: Partner = {
                        ...formData,
                        imageUrl: finalImageUrl,
                        images: partnerData.images,
                        videoUrl: formData.videoUrl || '',
                        websiteUrl: formData.websiteUrl || '',
                        id: 'temp-' + Date.now(), // Fallback ID if DB didn't return one
                        displayId: partnerData.display_id || formData.displayId || 0
                    };
                    setPartners(prev => [newPartner, ...prev].sort((a, b) => a.orderIndex - b.orderIndex));
                } else {
                    console.log('Insert response data:', data);
                    const newPartner: Partner = { 
                        ...formData, 
                        imageUrl: finalImageUrl, 
                        images: data.images || [],
                        videoUrl: data.video_url || '',
                        websiteUrl: data.website_url || '',
                        id: data.id, 
                        displayId: data.display_id 
                    };
                    setPartners(prev => [newPartner, ...prev].sort((a, b) => a.orderIndex - b.orderIndex));
                }
                alert("Parceiro salvo com sucesso!");
            }
            resetForm();
        } catch (error: any) {
            logger.error('Error saving partner:', error);
            alert(error.message || 'Erro ao salvar parceiro. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        const nextId = getNextAvailableDisplayId(partners);
        setFormData({ 
            name: '', 
            category: categories.length > 0 ? categories[0].name : '', 
            activity: '', 
            description: '', 
            address: '', 
            imageUrl: '', 
            imageFile: null, 
            images: ['', '', '', ''],
            imageFiles: [null, null, null, null],
            videoUrl: '',
            link: '', 
            whatsappLink: '', 
            googleReviewLink: '',
            websiteUrl: '',
            coupon: '', 
            couponDescription: '', 
            isAuthorized: true, 
            cashbackEnabled: true, 
            giftCardEnabled: false,
            orderIndex: 0, 
            page_number: 1,
            displayId: nextId 
        });
        setEditingId(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleEdit = (partner: Partner) => {
        console.log('Editing partner:', partner);
        console.log('Partner videoUrl from DB:', partner.videoUrl);
        setFormData({
            name: partner.name,
            category: partner.category,
            activity: partner.activity,
            description: partner.description,
            address: partner.address,
            imageUrl: partner.imageUrl,
            imageFile: null,
            images: partner.images ? [...partner.images, '', '', '', ''].slice(0, 4) : ['', '', '', ''],
            imageFiles: [null, null, null, null],
            videoUrl: partner.videoUrl || '',
            link: partner.link,
            whatsappLink: partner.whatsappLink || '',
            googleReviewLink: partner.googleReviewLink || '',
            websiteUrl: partner.websiteUrl || '',
            coupon: partner.coupon || '',
            couponDescription: partner.couponDescription || '',
            isAuthorized: partner.isAuthorized,
            cashbackEnabled: partner.cashbackEnabled,
            giftCardEnabled: partner.giftCardEnabled || false,
            orderIndex: partner.orderIndex,
            page_number: partner.page_number || 1,
            displayId: partner.displayId || 0
        });
        setEditingId(partner.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    const handleRemove = (id: string) => { 
        setDeleteConfirm({ type: 'partner', id });
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        try {
            const { data, error } = await supabase
                .from('categories')
                .insert([{ name: newCategoryName.trim() }])
                .select()
                .single();

            if (error) throw error;

            setCategories([...categories, data]);
            setNewCategoryName('');
            if (!formData.category) {
                setFormData(prev => ({ ...prev, category: data.name }));
            }
            alert("Categoria adicionada com sucesso!");
        } catch (error) {
            logger.error('Error adding category:', error);
            alert('Erro ao adicionar categoria. Pode já existir.');
        }
    };

    const handleRemoveCategory = (id: string) => {
        setDeleteConfirm({ type: 'category', id });
    };

    const executeDelete = async () => {
        if (!deleteConfirm) return;
        
        if (deleteConfirm.type === 'partner') {
            try {
                const { error } = await supabase.from('partners').delete().eq('id', deleteConfirm.id);
                if (error) {
                    alert(`Erro ao excluir: ${error.message}`);
                    return;
                }
                setPartners(partners.filter(p => p.id !== deleteConfirm.id)); 
                if (editingId === deleteConfirm.id) resetForm();
            } catch (error) {
                logger.error('Error deleting partner:', error);
            }
        } else if (deleteConfirm.type === 'category') {
            try {
                const { error } = await supabase.from('categories').delete().eq('id', deleteConfirm.id);
                if (error) {
                    alert(`Erro ao excluir categoria: ${error.message}`);
                    return;
                }
                setCategories(categories.filter(c => c.id !== deleteConfirm.id));
            } catch (error) {
                logger.error('Error deleting category:', error);
            }
        } else if (deleteConfirm.type === 'banner') {
            try {
                const { error } = await supabase
                    .from('commercial_banner')
                    .delete()
                    .eq('id', parseInt(deleteConfirm.id));
                    
                if (error) {
                    alert(`Erro ao excluir banner: ${error.message}`);
                    return;
                }
                
                if (deleteConfirm.id === '1' || deleteConfirm.id === '3' || deleteConfirm.id === '4') {
                    const idNum = parseInt(deleteConfirm.id);
                    setCommercialBanners(prev => prev.filter(b => b.id !== idNum));
                    setBannerLinks(prev => ({ ...prev, [idNum]: '' }));
                } else if (deleteConfirm.id === '2') {
                    setHeaderLogo(null);
                }
            } catch (error) {
                logger.error('Error removing banner:', error);
            }
        } else if (deleteConfirm.type === 'case') {
            try {
                const { error } = await supabase.from('success_cases').delete().eq('id', deleteConfirm.id);
                if (error) throw error;
                setSuccessCases(prev => prev.filter(c => c.id !== deleteConfirm.id));
                if (editingCaseId === deleteConfirm.id) {
                    setCaseFormData({ companyName: '', description: '', logoUrl: '', logoFile: null, storeImageUrl: '', storeFile: null });
                    setEditingCaseId(null);
                }
            } catch (error) {
                logger.error('Error deleting success case:', error);
            }
        }
        setDeleteConfirm(null);
    };

    const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>, id: number = 1) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `banners/banner_${id}_${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('partners')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) {
                logger.error('Upload error:', uploadError);
                throw new Error('Erro ao fazer upload da imagem. Verifique se o bucket "partners" existe.');
            }

            const { data: { publicUrl } } = supabase.storage
                .from('partners')
                .getPublicUrl(fileName);

            const upsertData: any = { id: id, image_url: publicUrl };
            if ([1, 3, 4].includes(id)) {
                upsertData.link_url = bannerLinks[id] || '';
                upsertData.partner_name = bannerNames[id] || '';
            }

            const { error: dbError } = await supabase
                .from('commercial_banner')
                .upsert(upsertData);

            if (dbError) throw dbError;

            if ([1, 3, 4].includes(id)) {
                const newBanner = { 
                    id: id, 
                    imageUrl: publicUrl, 
                    linkUrl: bannerLinks[id] || '',
                    partnerName: bannerNames[id] || ''
                };
                setCommercialBanners(prev => {
                    const filtered = prev.filter(b => b.id !== id);
                    return [...filtered, newBanner].sort((a, b) => {
                        const order = { 1: 0, 3: 1, 4: 2 };
                        return (order[a.id as keyof typeof order] || 0) - (order[b.id as keyof typeof order] || 0);
                    });
                });
                alert("Banner atualizado com sucesso!");
            } else if (id === 2) {
                setHeaderLogo(publicUrl);
                alert("Logotipo do cabeçalho atualizado com sucesso!");
            }
        } catch (error: any) {
            logger.error('Error uploading image:', error);
            alert(error.message || 'Erro ao salvar imagem. Tente novamente.');
        }
    };

    const handleUpdateBannerLink = async (id: number) => {
        try {
            const { error } = await supabase
                .from('commercial_banner')
                .update({ 
                    link_url: bannerLinks[id] || '',
                    partner_name: bannerNames[id] || ''
                })
                .eq('id', id);
            
            if (error) throw error;
            
            setCommercialBanners(prev => prev.map(b => b.id === id ? { 
                ...b, 
                linkUrl: bannerLinks[id] || '',
                partnerName: bannerNames[id] || ''
            } : b));
            alert("Informações do banner atualizadas!");
        } catch (error) {
            logger.error('Error updating banner info:', error);
            alert("Erro ao atualizar informações.");
        }
    };

    const handleRemoveBanner = (id: number = 1) => {
        setDeleteConfirm({ type: 'banner', id: id.toString() });
    };

    const handleUpdateAbout = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let finalLogoUrl = aboutConfig.logoUrl;
            if (aboutLogoFile) {
                const fileExt = aboutLogoFile.name.split('.').pop();
                const fileName = `about/logo_${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('partners').upload(fileName, aboutLogoFile);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('partners').getPublicUrl(fileName);
                finalLogoUrl = publicUrl;
            }

            const { error } = await supabase.from('about_config').upsert({
                id: 1,
                history: DOMPurify.sanitize(aboutConfig.history),
                logo_url: finalLogoUrl,
                mission_vision_values: DOMPurify.sanitize(aboutConfig.mission_vision_values || '')
            });
            if (error) throw error;
            setAboutConfig(prev => ({ ...prev!, logoUrl: finalLogoUrl }));
            setAboutLogoFile(null);
            alert("Configurações de 'Sobre Nós' atualizadas!");
        } catch (error) {
            logger.error('Error updating about:', error);
            alert('Erro ao atualizar configurações.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddOrUpdateCase = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!caseFormData.logoUrl && !caseFormData.logoFile) return alert("Logo obrigatória");
        if (!caseFormData.storeImageUrl && !caseFormData.storeFile) return alert("Foto da loja obrigatória");

        setIsSubmitting(true);
        try {
            let finalLogoUrl = caseFormData.logoUrl;
            let finalStoreUrl = caseFormData.storeImageUrl;

            if (caseFormData.logoFile) {
                const fileExt = caseFormData.logoFile.name.split('.').pop();
                const fileName = `cases/logo_${Date.now()}.${fileExt}`;
                const { error } = await supabase.storage.from('partners').upload(fileName, caseFormData.logoFile);
                if (error) throw error;
                finalLogoUrl = supabase.storage.from('partners').getPublicUrl(fileName).data.publicUrl;
            }

            if (caseFormData.storeFile) {
                const fileExt = caseFormData.storeFile.name.split('.').pop();
                const fileName = `cases/store_${Date.now()}.${fileExt}`;
                const { error } = await supabase.storage.from('partners').upload(fileName, caseFormData.storeFile);
                if (error) throw error;
                finalStoreUrl = supabase.storage.from('partners').getPublicUrl(fileName).data.publicUrl;
            }

            if (editingCaseId) {
                const { error } = await supabase.from('success_cases').update({
                    company_name: caseFormData.companyName,
                    description: caseFormData.description,
                    logo_url: finalLogoUrl,
                    store_image_url: finalStoreUrl
                }).eq('id', editingCaseId);
                if (error) throw error;
                setSuccessCases(prev => prev.map(c => c.id === editingCaseId ? { ...caseFormData, logoUrl: finalLogoUrl, storeImageUrl: finalStoreUrl, id: editingCaseId } : c));
                alert("Case atualizado!");
            } else {
                const { data, error } = await supabase.from('success_cases').insert([{
                    company_name: caseFormData.companyName,
                    description: caseFormData.description,
                    logo_url: finalLogoUrl,
                    store_image_url: finalStoreUrl
                }]).select().single();
                if (error) throw error;
                setSuccessCases([{ id: data.id, companyName: data.company_name, description: data.description, logoUrl: data.logo_url, storeImageUrl: data.store_image_url }, ...successCases]);
                alert("Case adicionado!");
            }
            setCaseFormData({ companyName: '', description: '', logoUrl: '', logoFile: null, storeImageUrl: '', storeFile: null });
            setEditingCaseId(null);
        } catch (error) {
            logger.error('Error saving case:', error);
            alert('Erro ao salvar case.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 md:py-16">
            <div className="sticky top-20 md:top-24 z-30 bg-gray-50/95 backdrop-blur-sm -mx-2 px-2 sm:-mx-4 sm:px-4 pt-2 pb-6 mb-6 border-b border-slate-200/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="bg-slate-900 text-white p-1.5 rounded-lg shadow-lg flex-shrink-0">
                            <Plus size={16} className="sm:w-6 sm:h-6" />
                        </div>
                        <h1 className="text-base sm:text-xl md:text-3xl font-black text-slate-900 leading-tight">
                            Painel de Controle
                        </h1>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        <div className="flex flex-wrap bg-white p-1 rounded-xl shadow-sm border border-slate-100 w-full sm:w-auto justify-center sm:justify-start overflow-x-auto no-scrollbar">
                            <button onClick={() => setActiveTab('partners')} className={`whitespace-nowrap px-2 sm:px-4 py-1.5 rounded-lg text-[9px] sm:text-xs font-bold transition-all ${activeTab === 'partners' ? 'bg-[#279267] text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}>Parceiros</button>
                            <button onClick={() => setActiveTab('about')} className={`whitespace-nowrap px-2 sm:px-4 py-1.5 rounded-lg text-[9px] sm:text-xs font-bold transition-all ${activeTab === 'about' ? 'bg-[#279267] text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}>Sobre Nós</button>
                            <button onClick={() => setActiveTab('cases')} className={`whitespace-nowrap px-2 sm:px-4 py-1.5 rounded-lg text-[9px] sm:text-xs font-bold transition-all ${activeTab === 'cases' ? 'bg-[#279267] text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}>Cases</button>
                            <button onClick={() => setActiveTab('ranking')} className={`whitespace-nowrap px-2 sm:px-4 py-1.5 rounded-lg text-[9px] sm:text-xs font-bold transition-all ${activeTab === 'ranking' ? 'bg-[#279267] text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}>Ranking</button>
                            <button onClick={() => setActiveTab('cashback')} className={`whitespace-nowrap px-2 sm:px-4 py-1.5 rounded-lg text-[9px] sm:text-xs font-bold transition-all ${activeTab === 'cashback' ? 'bg-[#279267] text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}>Cashback</button>
                            <button onClick={() => setActiveTab('featured')} className={`whitespace-nowrap px-2 sm:px-4 py-1.5 rounded-lg text-[9px] sm:text-xs font-bold transition-all ${activeTab === 'featured' ? 'bg-[#279267] text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}>Destaques</button>
                            <button onClick={() => setActiveTab('coupons')} className={`whitespace-nowrap px-2 sm:px-4 py-1.5 rounded-lg text-[9px] sm:text-xs font-bold transition-all ${activeTab === 'coupons' ? 'bg-[#279267] text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}>Cupons/Sequência</button>
                            <button onClick={() => setActiveTab('welcome')} className={`whitespace-nowrap px-2 sm:px-4 py-1.5 rounded-lg text-[9px] sm:text-xs font-bold transition-all ${activeTab === 'welcome' ? 'bg-[#279267] text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}>Boas-vindas</button>
                            <button onClick={() => setActiveTab('campaigns')} className={`whitespace-nowrap px-2 sm:px-4 py-1.5 rounded-lg text-[9px] sm:text-xs font-bold transition-all ${activeTab === 'campaigns' ? 'bg-[#279267] text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}>Cupons Surpresa</button>
                            <button onClick={() => setActiveTab('giftcards')} className={`whitespace-nowrap px-2 sm:px-4 py-1.5 rounded-lg text-[9px] sm:text-xs font-bold transition-all ${activeTab === 'giftcards' ? 'bg-[#279267] text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}>Cartão Presente</button>
                            <Link to="/admin-mensagens" className="whitespace-nowrap px-2 sm:px-4 py-1.5 rounded-lg text-[9px] sm:text-xs font-bold transition-all text-slate-500 hover:text-slate-900 flex items-center">
                                <MessageSquare size={10} className="mr-1" />
                                Mensagens
                            </Link>
                            <Link to="/admin/security" className="whitespace-nowrap px-2 sm:px-4 py-1.5 rounded-lg text-[9px] sm:text-xs font-bold transition-all text-slate-500 hover:text-slate-900 flex items-center">
                                <Shield size={10} className="mr-1" />
                                Segurança
                            </Link>
                        </div>
                        <button 
                            onClick={handleLogout}
                            className="flex items-center justify-center space-x-2 px-3 py-1.5 bg-red-500/10 text-red-500 font-bold rounded-lg hover:bg-red-500 hover:text-white transition-all border border-red-500/20 text-[10px] w-full sm:w-auto"
                        >
                            <LogOut size={14} />
                            <span>Sair</span>
                        </button>
                    </div>
                </div>
            </div>
            
            {activeTab === 'partners' && (
                <>
                    <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100 mb-8 sm:mb-12">
                        <h2 className="text-lg sm:text-2xl font-black text-slate-900 mb-3 sm:mb-4">Logotipo do Cabeçalho</h2>
                        <p className="text-slate-500 text-xs sm:text-base mb-4 sm:mb-6">Adicione o logotipo que será exibido no cabeçalho do site. Apenas 1 imagem é permitida por vez.</p>
                        
                        {headerLogo ? (
                            <div className="space-y-4">
                                <div className="border border-slate-200 rounded-xl p-4 bg-slate-900 flex justify-center">
                                    <img src={headerLogo} alt="Logo Atual" className="max-w-full h-auto rounded-lg shadow-sm" style={{ maxHeight: '90px' }} />
                                </div>
                                <button onClick={() => handleRemoveBanner(2)} className="px-6 py-3 bg-[#c54b4b] text-white font-bold rounded-xl hover:bg-red-700 transition-colors">
                                    Remover Logo Atual
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                                    <input type="file" accept="image/*" onChange={(e) => handleUploadBanner(e, 2)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                                    <p className="text-slate-600 font-medium">Clique ou arraste uma imagem aqui</p>
                                    <p className="text-[#c54b4b] font-bold mt-2 text-sm">Formato obrigatório: 270 x 90 Pixels</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100 mb-8 sm:mb-12">
                        <h2 className="text-lg sm:text-2xl font-black text-slate-900 mb-3 sm:mb-4">Carrossel de Banners Principal</h2>
                        <p className="text-slate-500 text-xs sm:text-base mb-4 sm:mb-6">Adicione até 3 banners que serão exibidos em um carrossel rotativo na página inicial.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[1, 3, 4].map((id, index) => {
                                const banner = commercialBanners.find(b => b.id === id);
                                return (
                                    <div key={id} className="space-y-4 p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                                        <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Banner {index + 1}</h3>
                                        {banner ? (
                                            <div className="space-y-4">
                                                <div className="border border-slate-200 rounded-xl p-2 bg-white flex justify-center overflow-hidden h-32">
                                                    <img src={banner.imageUrl} alt={`Banner ${index + 1}`} className="max-w-full h-full object-contain rounded-lg shadow-sm" />
                                                </div>
                                                <div className="flex flex-col space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nome do Parceiro:</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Nome da Empresa" 
                                                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 outline-none focus:border-[#279267] text-xs"
                                                        value={bannerNames[id] || ''}
                                                        onChange={(e) => setBannerNames(prev => ({ ...prev, [id]: e.target.value }))}
                                                    />
                                                </div>
                                                <div className="flex flex-col space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Link do Banner:</label>
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="url" 
                                                            placeholder="https://exemplo.com" 
                                                            className="flex-grow px-3 py-2 rounded-lg bg-white border border-slate-200 outline-none focus:border-[#279267] text-xs"
                                                            value={bannerLinks[id] || ''}
                                                            onChange={(e) => setBannerLinks(prev => ({ ...prev, [id]: e.target.value }))}
                                                        />
                                                        <button 
                                                            onClick={() => handleUpdateBannerLink(id)}
                                                            className="px-3 py-2 bg-[#279267] text-white font-bold rounded-lg hover:bg-[#1e7250] transition-colors text-[10px] uppercase"
                                                        >
                                                            Salvar
                                                        </button>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleRemoveBanner(id)} className="w-full py-2 bg-[#c54b4b]/10 text-[#c54b4b] font-bold rounded-lg hover:bg-[#c54b4b] hover:text-white transition-all text-xs uppercase">
                                                    Remover
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex flex-col space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nome do Parceiro:</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Nome da Empresa" 
                                                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 outline-none focus:border-[#279267] text-xs"
                                                        value={bannerNames[id] || ''}
                                                        onChange={(e) => setBannerNames(prev => ({ ...prev, [id]: e.target.value }))}
                                                    />
                                                </div>
                                                <div className="flex flex-col space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Link do Banner (Opcional):</label>
                                                    <input 
                                                        type="url" 
                                                        placeholder="https://exemplo.com" 
                                                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 outline-none focus:border-[#279267] text-xs"
                                                        value={bannerLinks[id] || ''}
                                                        onChange={(e) => setBannerLinks(prev => ({ ...prev, [id]: e.target.value }))}
                                                    />
                                                </div>
                                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-white hover:bg-slate-100 transition-colors cursor-pointer relative">
                                                    <input type="file" accept="image/*" onChange={(e) => handleUploadBanner(e, id)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                                    <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                                                    <p className="text-slate-600 font-medium text-xs">Clique ou arraste</p>
                                                    <p className="text-[#c54b4b] font-bold mt-1 text-[10px]">2275 x 563 Pixels</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-12">
                        <div className="lg:col-span-1">
                            <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100 sticky top-28">
                                <div className="flex justify-between items-center mb-4 sm:mb-6">
                                    <h2 className="text-lg sm:text-xl font-black flex items-center text-[#279267]">
                                        {editingId ? "Alterar Dados" : "Novo Parceiro"}
                                    </h2>
                                    {editingId && (
                                        <button onClick={resetForm} className="text-slate-400 hover:text-red-500 transition-colors">
                                            <X size={20} />
                                        </button>
                                    )}
                                </div>
                                <form onSubmit={handleAddOrUpdate} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                            <input 
                                                type="checkbox" 
                                                id="isAuthorized" 
                                                className="w-5 h-5 accent-[#279267] cursor-pointer" 
                                                checked={formData.isAuthorized} 
                                                onChange={e => setFormData({...formData, isAuthorized: e.target.checked})} 
                                            />
                                            <label htmlFor="isAuthorized" className="text-sm font-bold text-slate-700 cursor-pointer">Autorizado</label>
                                        </div>
                                        <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                            <input 
                                                type="checkbox" 
                                                id="cashbackEnabled" 
                                                className="w-5 h-5 accent-[#279267] cursor-pointer" 
                                                checked={formData.cashbackEnabled} 
                                                onChange={e => setFormData({...formData, cashbackEnabled: e.target.checked})} 
                                            />
                                            <label htmlFor="cashbackEnabled" className="text-sm font-bold text-slate-700 cursor-pointer">Cashback</label>
                                        </div>
                                        <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                            <input 
                                                type="checkbox" 
                                                id="giftCardEnabled" 
                                                className="w-5 h-5 accent-[#279267] cursor-pointer" 
                                                checked={formData.giftCardEnabled} 
                                                onChange={e => setFormData({...formData, giftCardEnabled: e.target.checked})} 
                                            />
                                            <label htmlFor="giftCardEnabled" className="text-sm font-bold text-slate-700 cursor-pointer">Presente</label>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col space-y-1">
                                            <label htmlFor="pageNumber" className="text-[10px] font-bold text-slate-500 uppercase ml-1">Página</label>
                                            <input 
                                                type="number" 
                                                id="pageNumber"
                                                min="1"
                                                className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#279267]" 
                                                placeholder="Página" 
                                                value={formData.page_number} 
                                                onChange={e => setFormData({...formData, page_number: parseInt(e.target.value) || 1})} 
                                            />
                                        </div>
                                        <div className="flex flex-col space-y-1">
                                            <label htmlFor="orderIndex" className="text-[10px] font-bold text-slate-500 uppercase ml-1">Sequência</label>
                                            <input 
                                                type="number" 
                                                id="orderIndex"
                                                className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#279267]" 
                                                placeholder="Ordem" 
                                                value={formData.orderIndex} 
                                                onChange={e => setFormData({...formData, orderIndex: parseInt(e.target.value) || 0})} 
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col space-y-1">
                                        <label htmlFor="displayId" className="text-[10px] font-bold text-slate-500 uppercase ml-1">ID para QR Code (Número Único)</label>
                                        <input 
                                            type="number" 
                                            id="displayId"
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#279267]" 
                                            placeholder="Ex: 1, 2, 3..." 
                                            value={formData.displayId} 
                                            onChange={e => setFormData({...formData, displayId: parseInt(e.target.value) || 0})} 
                                        />
                                    </div>
                                    <input required type="text" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#279267]" placeholder="Nome da Empresa" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                    <select required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                        {categories.length === 0 && <option value="">Nenhuma categoria cadastrada</option>}
                                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                    <input required type="text" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#279267]" placeholder="Atividade (Ex: Pizzaria)" value={formData.activity} onChange={e => setFormData({...formData, activity: e.target.value})} />
                                    <input required type="text" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#279267]" placeholder="Endereço" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                                    <textarea rows={2} required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#279267]" placeholder="Descrição Curta" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                                    <input type="url" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#279267]" placeholder="Link do Instagram (Opcional)" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} />
                                    <input type="url" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#279267]" placeholder="Link do WhatsApp (wa.me/...)" value={formData.whatsappLink} onChange={e => setFormData({...formData, whatsappLink: e.target.value})} />
                                    <input type="url" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#279267]" placeholder="Link de Avaliação do Google" value={formData.googleReviewLink} onChange={e => setFormData({...formData, googleReviewLink: e.target.value})} />
                                    <input type="url" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#279267]" placeholder="Link do Site/Vitrine" value={formData.websiteUrl} onChange={e => setFormData({...formData, websiteUrl: e.target.value})} />
                                    <input type="text" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#279267]" placeholder="Cupom de Desconto (Opcional)" value={formData.coupon} onChange={e => setFormData({...formData, coupon: e.target.value})} />
                                    <input type="text" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#279267]" placeholder="O que o cliente ganha com o cupom? (Opcional)" value={formData.couponDescription} onChange={e => setFormData({...formData, couponDescription: e.target.value})} />
                                    
                                    <div className="flex flex-col space-y-1">
                                        <label htmlFor="videoUrl" className="text-[10px] font-bold text-slate-500 uppercase ml-1">Vídeo do YouTube Shorts (URL)</label>
                                        <input 
                                            type="url" 
                                            id="videoUrl"
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#279267]" 
                                            placeholder="https://youtube.com/shorts/..." 
                                            value={formData.videoUrl} 
                                            onChange={e => setFormData({...formData, videoUrl: e.target.value})} 
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Foto Principal (Vertical Recomendada)</label>
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="relative cursor-pointer group border-2 border-dashed border-slate-200 rounded-xl overflow-hidden w-32 h-32 mx-auto bg-slate-50 flex flex-col items-center justify-center transition-all hover:border-[#279267] hover:bg-green-50"
                                        >
                                            {formData.imageUrl ? (
                                                <>
                                                    <img src={formData.imageUrl} alt="Preview" referrerPolicy="no-referrer" className="w-full h-full object-cover bg-white" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <Upload className="text-white" size={32} />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center p-4">
                                                    <Upload className="mx-auto text-slate-300 mb-2" size={32} />
                                                    <p className="text-xs font-bold text-slate-400">Clique para fazer upload</p>
                                                </div>
                                            )}
                                        </div>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            className="hidden" 
                                            accept="image/*" 
                                            onChange={handleFileChange} 
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Imagens Adicionais (Até 4)</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {[0, 1, 2, 3].map((idx) => (
                                                <div key={idx} className="space-y-1">
                                                    <div 
                                                        onClick={() => {
                                                            const input = document.getElementById(`extra-file-${idx}`) as HTMLInputElement;
                                                            input?.click();
                                                        }}
                                                        className="relative cursor-pointer group border-2 border-dashed border-slate-200 rounded-xl overflow-hidden w-20 h-20 mx-auto bg-slate-50 flex flex-col items-center justify-center transition-all hover:border-[#279267] hover:bg-green-50"
                                                    >
                                                        {formData.images[idx] ? (
                                                            <>
                                                                <img src={formData.images[idx]} alt={`Extra ${idx + 1}`} referrerPolicy="no-referrer" className="w-full h-full object-cover bg-white" />
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                    <Upload className="text-white" size={24} />
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="text-center p-2">
                                                                <Plus className="mx-auto text-slate-300 mb-1" size={24} />
                                                                <p className="text-[10px] font-bold text-slate-400">Extra {idx + 1}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <input 
                                                        type="file" 
                                                        id={`extra-file-${idx}`}
                                                        className="hidden" 
                                                        accept="image/*" 
                                                        onChange={(e) => handleAdditionalFileChange(e, idx)} 
                                                    />
                                                    {formData.images[idx] && (
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newImages = [...formData.images];
                                                                const newImageFiles = [...formData.imageFiles];
                                                                newImages[idx] = '';
                                                                newImageFiles[idx] = null;
                                                                setFormData(prev => ({ ...prev, images: newImages, imageFiles: newImageFiles }));
                                                            }}
                                                            className="w-full py-1 text-[10px] font-bold text-red-500 hover:text-red-700"
                                                        >
                                                            Remover
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button disabled={isSubmitting} className="w-full bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-[#279267] transition-all flex items-center justify-center space-x-2 shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
                                        {isSubmitting ? (
                                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                {editingId ? <Edit2 size={20} /> : <Plus size={20} />}
                                                <span>{editingId ? "Salvar Alterações" : "Cadastrar na Vitrine"}</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                        <div className="lg:col-span-2 space-y-4">
                            <div className="bg-[#279267]/5 border border-[#279267]/10 p-4 rounded-2xl flex items-center space-x-3 text-[#279267] text-sm mb-6">
                                <Info size={18} />
                                <p><strong>Gestão de Anunciantes:</strong> Clique no ícone de lápis para editar ou na lixeira para remover permanentemente.</p>
                            </div>

                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Gerenciar Categorias</h3>
                                <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
                                    <input 
                                        type="text" 
                                        className="flex-grow px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#279267]" 
                                        placeholder="Nova Categoria" 
                                        value={newCategoryName} 
                                        onChange={e => setNewCategoryName(e.target.value)} 
                                    />
                                    <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-[#279267] transition-colors">
                                        Adicionar
                                    </button>
                                </form>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map(c => (
                                        <div key={c.id} className="inline-flex items-center bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-sm font-medium text-slate-700">
                                            {c.name}
                                            <button onClick={() => handleRemoveCategory(c.id)} className="ml-2 text-slate-400 hover:text-red-500">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {categories.length === 0 && <span className="text-sm text-slate-400">Nenhuma categoria cadastrada.</span>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {partners.map(p => (
                                    <div key={p.id} className={`bg-white p-4 rounded-2xl shadow-sm border transition-all flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4 ${editingId === p.id ? 'border-[#279267] ring-2 ring-green-100 ring-offset-2' : 'border-slate-100'}`}>
                                        <img src={p.imageUrl} alt={p.name} referrerPolicy="no-referrer" className="w-16 h-16 rounded-xl object-cover shadow-inner bg-white flex-shrink-0" />
                                        <div className="flex-grow min-w-0 text-center sm:text-left">
                                            <h4 className="font-bold text-slate-900 text-sm sm:text-base break-words">{p.name}</h4>
                                            <p className="text-[9px] sm:text-[10px] font-black text-[#279267] uppercase">{p.category}</p>
                                        </div>
                                        <div className="flex space-x-1">
                                            <button 
                                                onClick={() => handleEdit(p)} 
                                                className={`p-3 rounded-xl transition-all ${editingId === p.id ? 'text-[#279267] bg-green-50' : 'text-slate-300 hover:text-[#279267] hover:bg-green-50'}`}
                                                title="Editar parceiro"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleRemove(p.id)} 
                                                className="p-3 text-slate-300 hover:text-[#c54b4b] hover:bg-red-50 rounded-xl transition-all" 
                                                title="Excluir parceiro"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'about' && (
                <div className="bg-white p-4 sm:p-8 rounded-3xl shadow-xl border border-slate-100">
                    <h2 className="text-2xl font-black text-slate-900 mb-6">Configuração da Página 'Sobre Nós'</h2>
                    <form onSubmit={handleUpdateAbout} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700">História da Empresa</label>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#279267]">
                                <Editor 
                                    value={aboutConfig.history} 
                                    onChange={e => setAboutConfig({...aboutConfig, history: e.target.value})} 
                                    containerProps={{ style: { minHeight: '300px', border: 'none', width: '100%' } }}
                                >
                                    <Toolbar style={{ display: 'flex', flexWrap: 'wrap' }}>
                                        <BtnUndo />
                                        <BtnRedo />
                                        <Separator />
                                        <BtnBold />
                                        <BtnItalic />
                                        <BtnUnderline />
                                        <BtnStrikeThrough />
                                        <Separator />
                                        <BtnNumberedList />
                                        <BtnBulletList />
                                        <Separator />
                                        <BtnLink />
                                        <BtnClearFormatting />
                                        <HtmlButton />
                                        <Separator />
                                        <BtnStyles />
                                        <Separator />
                                        <input 
                                            type="color" 
                                            onChange={(e) => document.execCommand('foreColor', false, e.target.value)}
                                            title="Cor do Texto"
                                            className="w-6 h-6 p-0 border-0 cursor-pointer bg-transparent"
                                        />
                                    </Toolbar>
                                </Editor>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700">Banner da Empresa (Topo da Página)</label>
                            <p className="text-xs text-slate-500 mb-2">Formato obrigatório: 2275 x 563 Pixels. Ocupará a largura inteira da tela.</p>
                            <div 
                                onClick={() => aboutLogoInputRef.current?.click()}
                                className="relative cursor-pointer group border-2 border-dashed border-slate-200 rounded-xl overflow-hidden h-40 bg-slate-50 flex flex-col items-center justify-center transition-all hover:border-[#279267] hover:bg-green-50"
                            >
                                {aboutConfig.logoUrl || aboutLogoFile ? (
                                    <>
                                        <img 
                                            src={aboutLogoFile ? URL.createObjectURL(aboutLogoFile) : aboutConfig.logoUrl!} 
                                            alt="Banner Preview" 
                                            className="w-full h-full object-cover" 
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Upload className="text-white" size={32} />
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-4">
                                        <Upload className="mx-auto text-slate-300 mb-2" size={32} />
                                        <p className="text-xs font-bold text-slate-400">Clique para fazer upload do banner</p>
                                    </div>
                                )}
                            </div>
                            <input 
                                type="file" 
                                ref={aboutLogoInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={e => e.target.files?.[0] && setAboutLogoFile(e.target.files[0])} 
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700">Missão, Visão e Valores</label>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#279267]">
                                <Editor 
                                    value={aboutConfig.mission_vision_values} 
                                    onChange={e => setAboutConfig({...aboutConfig, mission_vision_values: e.target.value})} 
                                    containerProps={{ style: { minHeight: '300px', border: 'none', width: '100%' } }}
                                >
                                    <Toolbar style={{ display: 'flex', flexWrap: 'wrap' }}>
                                        <BtnUndo />
                                        <BtnRedo />
                                        <Separator />
                                        <BtnBold />
                                        <BtnItalic />
                                        <BtnUnderline />
                                        <BtnStrikeThrough />
                                        <Separator />
                                        <BtnNumberedList />
                                        <BtnBulletList />
                                        <Separator />
                                        <BtnLink />
                                        <BtnClearFormatting />
                                        <HtmlButton />
                                        <Separator />
                                        <BtnStyles />
                                        <Separator />
                                        <input 
                                            type="color" 
                                            onChange={(e) => document.execCommand('foreColor', false, e.target.value)}
                                            title="Cor do Texto"
                                            className="w-6 h-6 p-0 border-0 cursor-pointer bg-transparent"
                                        />
                                    </Toolbar>
                                </Editor>
                            </div>
                        </div>

                        <button disabled={isSubmitting} className="bg-slate-900 text-white font-black px-8 py-4 rounded-xl hover:bg-[#279267] transition-all flex items-center justify-center space-x-2 shadow-lg active:scale-95 disabled:opacity-70">
                            {isSubmitting ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <span>Salvar Configurações</span>}
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'cases' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-1">
                        <div className="bg-white p-4 sm:p-8 rounded-3xl shadow-xl border border-slate-100 sticky top-28">
                            <h2 className="text-xl font-black text-[#279267] mb-6">{editingCaseId ? "Editar Case" : "Novo Case de Sucesso"}</h2>
                            <form onSubmit={handleAddOrUpdateCase} className="space-y-4">
                                <input required type="text" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#279267]" placeholder="Nome da Empresa" value={caseFormData.companyName} onChange={e => setCaseFormData({...caseFormData, companyName: e.target.value})} />
                                <textarea required rows={3} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#279267]" placeholder="Descrição do que foi feito" value={caseFormData.description} onChange={e => setCaseFormData({...caseFormData, description: e.target.value})} />
                                
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase">Logo da Empresa</label>
                                    <div onClick={() => caseLogoInputRef.current?.click()} className="cursor-pointer border-2 border-dashed border-slate-200 rounded-xl h-24 bg-slate-50 flex items-center justify-center overflow-hidden">
                                        {caseFormData.logoUrl || caseFormData.logoFile ? (
                                            <img src={caseFormData.logoFile ? URL.createObjectURL(caseFormData.logoFile) : caseFormData.logoUrl} className="h-full w-auto object-contain p-2" />
                                        ) : <Upload className="text-slate-300" />}
                                    </div>
                                    <input type="file" ref={caseLogoInputRef} className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && setCaseFormData({...caseFormData, logoFile: e.target.files[0]})} />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase">Foto da Loja/Estabelecimento</label>
                                    <div onClick={() => caseStoreInputRef.current?.click()} className="cursor-pointer border-2 border-dashed border-slate-200 rounded-xl h-32 bg-slate-50 flex items-center justify-center overflow-hidden">
                                        {caseFormData.storeImageUrl || caseFormData.storeFile ? (
                                            <img src={caseFormData.storeFile ? URL.createObjectURL(caseFormData.storeFile) : caseFormData.storeImageUrl} className="w-full h-full object-cover" />
                                        ) : <Upload className="text-slate-300" />}
                                    </div>
                                    <input type="file" ref={caseStoreInputRef} className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && setCaseFormData({...caseFormData, storeFile: e.target.files[0]})} />
                                </div>

                                <button disabled={isSubmitting} className="w-full bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-[#279267] transition-all flex items-center justify-center space-x-2 shadow-lg">
                                    {isSubmitting ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <span>{editingCaseId ? "Salvar Case" : "Adicionar Case"}</span>}
                                </button>
                                {editingCaseId && <button type="button" onClick={() => {setEditingCaseId(null); setCaseFormData({ companyName: '', description: '', logoUrl: '', logoFile: null, storeImageUrl: '', storeFile: null });}} className="w-full text-slate-400 font-bold py-2">Cancelar Edição</button>}
                            </form>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        {successCases.map(item => (
                            <div key={item.id} className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                                <img src={item.storeImageUrl} className="w-full sm:w-32 h-48 sm:h-24 rounded-2xl object-cover" />
                                <div className="flex-grow text-center sm:text-left">
                                    <h4 className="font-black text-slate-900 text-lg">{item.companyName}</h4>
                                    <p className="text-slate-500 text-sm line-clamp-3 sm:line-clamp-2">{item.description}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <button onClick={() => {
                                        setEditingCaseId(item.id);
                                        setCaseFormData({ companyName: item.companyName, description: item.description, logoUrl: item.logoUrl, logoFile: null, storeImageUrl: item.storeImageUrl, storeFile: null });
                                    }} className="p-3 text-slate-300 hover:text-[#279267] hover:bg-green-50 rounded-xl transition-all"><Edit2 size={18} /></button>
                                    <button onClick={() => setDeleteConfirm({ type: 'case', id: item.id })} className="p-3 text-slate-300 hover:text-[#c54b4b] hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        ))}
                        {successCases.length === 0 && <div className="text-center py-20 text-slate-400 font-bold">Nenhum case de sucesso cadastrado.</div>}
                    </div>
                </div>
            )}

            {activeTab === 'featured' && (
                <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100">
                    <div className="flex items-center space-x-3 mb-6 sm:mb-8">
                        <div className="bg-[#c54b4b] text-white p-2 sm:p-3 rounded-xl sm:rounded-2xl">
                            <Trophy size={20} className="sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-2xl font-black text-slate-900">Destaques da Semana</h2>
                            <p className="text-slate-500 text-xs sm:text-sm">Selecione os 6 parceiros que aparecerão em destaque na página inicial.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((slotId) => (
                            <div key={slotId} className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Slot #{slotId}</label>
                                <select 
                                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:border-[#279267] font-bold text-slate-700"
                                    value={featuredCoupons.find(c => c.slot_id === slotId)?.partner_id || ""}
                                    onChange={async (e) => {
                                        const partnerId = e.target.value || null;
                                        try {
                                            const { error } = await supabase
                                                .from('featured_coupons')
                                                .upsert({ slot_id: slotId, partner_id: partnerId });
                                            
                                            if (error) throw error;
                                            
                                            setFeaturedCoupons(prev => {
                                                const filtered = prev.filter(c => c.slot_id !== slotId);
                                                return [...filtered, { slot_id: slotId, partner_id: partnerId }].sort((a, b) => a.slot_id - b.slot_id);
                                            });
                                        } catch (error) {
                                            logger.error('Error updating featured coupon:', error);
                                            alert("Erro ao salvar destaque.");
                                        }
                                    }}
                                >
                                    <option value="">-- Selecionar Parceiro --</option>
                                    {partners.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'ranking' && (
                <div className="bg-white p-2 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 px-2 sm:px-0">
                        <div className="flex items-center space-x-3">
                            <div className="bg-amber-100 text-amber-600 p-2 sm:p-3 rounded-xl sm:rounded-2xl">
                                <Trophy size={20} className="sm:w-6 sm:h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-2xl font-black text-slate-900">Ranking de Parceiros</h2>
                                <p className="text-slate-500 text-[10px] sm:text-sm">Top 10 parceiros mais acessados.</p>
                            </div>
                        </div>
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit overflow-x-auto no-scrollbar">
                            <button 
                                onClick={() => setPartnerRankingPeriod('all')}
                                className={`whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${partnerRankingPeriod === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Tudo
                            </button>
                            <button 
                                onClick={() => setPartnerRankingPeriod('month')}
                                className={`whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${partnerRankingPeriod === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Mês
                            </button>
                            <button 
                                onClick={() => setPartnerRankingPeriod('prev_month')}
                                className={`whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${partnerRankingPeriod === 'prev_month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Anterior
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
                        <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Posição</th>
                                    <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Parceiro</th>
                                    <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest text-center">ID QR</th>
                                    <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Acessos</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rankingData.length > 0 ? (
                                    rankingData.map((item, index) => (
                                        <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                            <td className="py-3 sm:py-4 px-2 sm:px-4">
                                                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-sm ${index === 0 ? 'bg-amber-400 text-white' : index === 1 ? 'bg-slate-300 text-white' : index === 2 ? 'bg-amber-600/50 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td className="py-3 sm:py-4 px-2 sm:px-4 font-bold text-slate-900 text-[11px] sm:text-base truncate max-w-[120px] sm:max-w-none">{item.name}</td>
                                            <td className="py-3 sm:py-4 px-2 sm:px-4 text-center font-mono text-slate-500 text-[10px] sm:text-sm">{item.display_id || '-'}</td>
                                            <td className="py-3 sm:py-4 px-2 sm:px-4 text-center">
                                                <span className="bg-green-100 text-[#279267] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-sm font-bold">
                                                    {item.count}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr key="empty-partners">
                                        <td colSpan={4} className="py-10 sm:py-20 text-center text-slate-400 font-bold text-xs sm:text-base">Nenhum dado de acesso registrado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-8 sm:mt-12 pt-8 sm:pt-12 border-t border-slate-100">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 px-2 sm:px-0">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-blue-100 text-blue-600 p-2 sm:p-3 rounded-xl sm:rounded-2xl">
                                        <Share2 size={20} className="sm:w-6 sm:h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg sm:text-2xl font-black text-slate-900">Ranking de Compartilhamentos</h2>
                                        <p className="text-slate-500 text-[10px] sm:text-sm">Somatório de compartilhamentos por parceiro.</p>
                                    </div>
                                </div>
                                <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit overflow-x-auto no-scrollbar">
                                    <button 
                                        onClick={() => setSharePeriod('all')}
                                        className={`whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${sharePeriod === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Tudo
                                    </button>
                                    <button 
                                        onClick={() => setSharePeriod('month')}
                                        className={`whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${sharePeriod === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Mês
                                    </button>
                                    <button 
                                        onClick={() => setSharePeriod('prev_month')}
                                        className={`whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${sharePeriod === 'prev_month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Anterior
                                    </button>
                                </div>
                            </div>

                        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
                            <table className="w-full text-left border-collapse min-w-[400px] sm:min-w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Posição</th>
                                        <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Parceiro</th>
                                        <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shareRankingData.length > 0 ? (
                                        shareRankingData.map((item, index) => (
                                            <tr key={item.partner_id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                                <td className="py-3 sm:py-4 px-2 sm:px-4">
                                                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-sm ${index === 0 ? 'bg-amber-400 text-white' : index === 1 ? 'bg-slate-300 text-white' : index === 2 ? 'bg-amber-600/50 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                        {index + 1}
                                                    </div>
                                                </td>
                                                <td className="py-3 sm:py-4 px-2 sm:px-4 font-bold text-slate-900 text-[11px] sm:text-base">{item.partner_name}</td>
                                                <td className="py-3 sm:py-4 px-2 sm:px-4 text-center">
                                                    <span className="bg-blue-100 text-blue-600 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-sm font-black">
                                                        {item.share_count}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr key="empty-shares">
                                            <td colSpan={3} className="py-10 sm:py-20 text-center text-slate-400 font-bold text-xs sm:text-base">Nenhum compartilhamento registrado.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="mt-8 sm:mt-12 pt-8 sm:pt-12 border-t border-slate-100">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 px-2 sm:px-0">
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-green-100 text-[#279267] p-2 sm:p-3 rounded-xl sm:rounded-2xl">
                                            <MousePointerClick size={20} className="sm:w-6 sm:h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg sm:text-2xl font-black text-slate-900">Ranking de Clientes (Cupons)</h2>
                                            <p className="text-slate-500 text-[10px] sm:text-sm">Clientes que mais desbloquearam cupons.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {rankingError && (
                                            <div className="flex items-center space-x-2 text-red-500 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                                                <AlertCircle size={14} />
                                                <span className="text-[10px] font-bold">Erro ao carregar</span>
                                            </div>
                                        )}
                                        <button 
                                            onClick={fetchRanking}
                                            disabled={isRankingLoading}
                                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-[#279267] disabled:opacity-50"
                                            title="Atualizar Ranking"
                                        >
                                            <RefreshCw size={18} className={isRankingLoading ? 'animate-spin' : ''} />
                                        </button>
                                        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit overflow-x-auto no-scrollbar">
                                            <button 
                                                onClick={() => setCustomerRankingPeriod('all')}
                                                className={`whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${customerRankingPeriod === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                Tudo
                                            </button>
                                            <button 
                                                onClick={() => setCustomerRankingPeriod('month')}
                                                className={`whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${customerRankingPeriod === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                Mês
                                            </button>
                                            <button 
                                                onClick={() => setCustomerRankingPeriod('prev_month')}
                                                className={`whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${customerRankingPeriod === 'prev_month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                Anterior
                                            </button>
                                        </div>
                                    </div>
                                </div>

                            <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
                                <table className="w-full text-left border-collapse min-w-[450px] sm:min-w-full">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Posição</th>
                                            <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                                            <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">WhatsApp</th>
                                            <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isRankingLoading ? (
                                            <tr key="loading-customers">
                                                <td colSpan={4} className="py-10 text-center">
                                                    <div className="flex items-center justify-center space-x-2 text-slate-400">
                                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                                        <span className="ml-2 font-bold text-xs">Carregando ranking...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : customerRankingData.length > 0 ? (
                                            customerRankingData.map((item, index) => (
                                                <tr key={item.whatsapp} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                                    <td className="py-3 sm:py-4 px-2 sm:px-4">
                                                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-sm ${index === 0 ? 'bg-amber-400 text-white' : index === 1 ? 'bg-slate-300 text-white' : index === 2 ? 'bg-amber-600/50 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                            {index + 1}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 sm:py-4 px-2 sm:px-4 font-bold text-slate-900 text-[11px] sm:text-base">{item.name}</td>
                                                    <td className="py-3 sm:py-4 px-2 sm:px-4 text-slate-500 font-mono text-[10px] sm:text-sm">{formatWhatsApp(item.whatsapp)}</td>
                                                    <td className="py-3 sm:py-4 px-2 sm:px-4 text-center">
                                                        <span className="bg-green-100 text-[#279267] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-sm font-bold">
                                                            {item.count}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr key="empty-customers">
                                                <td colSpan={4} className="py-10 sm:py-20 text-center">
                                                    <div className="flex flex-col items-center space-y-2">
                                                        <p className="text-slate-400 font-bold text-xs sm:text-base">Nenhum cupom liberado para este período.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="mt-8 sm:mt-12 pt-8 sm:pt-12 border-t border-slate-100">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 px-2 sm:px-0">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-purple-100 text-purple-600 p-2 sm:p-3 rounded-xl sm:rounded-2xl">
                                        <MousePointerClick size={20} className="sm:w-6 sm:h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg sm:text-2xl font-black text-slate-900">Ranking de Cliques</h2>
                                        <p className="text-slate-500 text-[10px] sm:text-sm">Somatório de cliques (Instagram e WhatsApp) por parceiro.</p>
                                    </div>
                                </div>
                                <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit overflow-x-auto no-scrollbar">
                                    <button 
                                        onClick={() => setClickPeriod('all')}
                                        className={`whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${clickPeriod === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Tudo
                                    </button>
                                    <button 
                                        onClick={() => setClickPeriod('month')}
                                        className={`whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${clickPeriod === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Mês
                                    </button>
                                    <button 
                                        onClick={() => setClickPeriod('prev_month')}
                                        className={`whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${clickPeriod === 'prev_month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Anterior
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
                                <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-full">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Posição</th>
                                            <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Parceiro</th>
                                            <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest text-center">IG</th>
                                            <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest text-center">WPP</th>
                                            <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest text-center">GGL</th>
                                            <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest text-center">VIT</th>
                                            <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clickRankingData.length > 0 ? (
                                            clickRankingData.map((item, index) => (
                                                <tr key={item.partner_id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                                    <td className="py-3 sm:py-4 px-2 sm:px-4">
                                                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-sm ${index === 0 ? 'bg-amber-400 text-white' : index === 1 ? 'bg-slate-300 text-white' : index === 2 ? 'bg-amber-600/50 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                            {index + 1}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 sm:py-4 px-2 sm:px-4 font-bold text-slate-900 text-[11px] sm:text-base">{item.partner_name}</td>
                                                    <td className="py-3 sm:py-4 px-2 sm:px-4 text-center">
                                                        <span className="text-slate-600 font-bold text-[10px] sm:text-sm">{item.instagram_count}</span>
                                                    </td>
                                                    <td className="py-3 sm:py-4 px-2 sm:px-4 text-center">
                                                        <span className="text-slate-600 font-bold text-[10px] sm:text-sm">{item.whatsapp_count}</span>
                                                    </td>
                                                    <td className="py-3 sm:py-4 px-2 sm:px-4 text-center">
                                                        <span className="text-slate-600 font-bold text-[10px] sm:text-sm">{item.google_count || 0}</span>
                                                    </td>
                                                    <td className="py-3 sm:py-4 px-2 sm:px-4 text-center">
                                                        <span className="text-slate-600 font-bold text-[10px] sm:text-sm">{item.website_count || 0}</span>
                                                    </td>
                                                    <td className="py-3 sm:py-4 px-2 sm:px-4 text-center">
                                                        <span className="bg-purple-100 text-purple-600 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-sm font-black">
                                                            {Number(item.instagram_count) + Number(item.whatsapp_count) + Number(item.google_count || 0) + Number(item.website_count || 0)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr key="empty-clicks">
                                                <td colSpan={6} className="py-10 sm:py-20 text-center text-slate-400 font-bold text-xs sm:text-base">Nenhum clique registrado.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Banner Clicks Ranking */}
                        <div className="mt-8 sm:mt-12 pt-8 sm:pt-12 border-t border-slate-100">
                            <div className="flex items-center space-x-3 mb-6 sm:mb-8 px-2 sm:px-0">
                                <div className="bg-purple-100 text-purple-600 p-2 sm:p-3 rounded-xl sm:rounded-2xl">
                                    <Megaphone size={20} className="sm:w-6 sm:h-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg sm:text-2xl font-black text-slate-900">Cliques em Banners (Home)</h2>
                                    <p className="text-slate-500 text-[10px] sm:text-sm">Ranking de cliques nos banners do carrossel principal.</p>
                                </div>
                            </div>

                            <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
                                <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-full">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Posição</th>
                                            <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Parceiro</th>
                                            <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Link</th>
                                            <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Cliques</th>
                                            <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Último Clique</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bannerClickRankingData.length > 0 ? (
                                            bannerClickRankingData.map((item, index) => (
                                                <tr key={`${item.partner_name}-${index}`} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                                    <td className="py-3 sm:py-4 px-2 sm:px-4">
                                                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-sm ${index === 0 ? 'bg-amber-400 text-white' : index === 1 ? 'bg-slate-300 text-white' : index === 2 ? 'bg-amber-600/50 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                            {index + 1}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 sm:py-4 px-2 sm:px-4 font-bold text-slate-900 text-[11px] sm:text-base">{item.partner_name}</td>
                                                    <td className="py-3 sm:py-4 px-2 sm:px-4 text-[10px] sm:text-sm text-slate-400 truncate max-w-[150px] sm:max-w-xs">{item.banner_link}</td>
                                                    <td className="py-3 sm:py-4 px-2 sm:px-4 text-center">
                                                        <span className="bg-[#279267]/10 text-[#279267] px-3 py-1 rounded-full text-[10px] sm:text-sm font-black">
                                                            {item.click_count}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 sm:py-4 px-2 sm:px-4 text-right text-[9px] sm:text-xs text-slate-400">
                                                        {new Date(item.last_click).toLocaleString('pt-BR')}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr key="empty-banner-clicks">
                                                <td colSpan={5} className="py-10 sm:py-20 text-center text-slate-400 font-bold text-xs sm:text-base">Nenhum clique em banner registrado.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

            {activeTab === 'cashback' && (
                <div className="space-y-6 sm:space-y-8">
                    <div className="bg-white p-2 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100">
                        <div className="flex items-center space-x-3 mb-6 sm:mb-8 px-2 sm:px-0">
                            <div className="bg-green-100 text-[#279267] p-2 sm:p-3 rounded-xl sm:rounded-2xl">
                                <Settings size={20} className="sm:w-6 sm:h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-2xl font-black text-slate-900">Configuração de Cashback</h2>
                                <p className="text-slate-500 text-[10px] sm:text-sm">Defina os valores e as probabilidades da roleta.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 px-2 sm:px-0">
                            {cashbackConfigs.map((config) => (
                                <div key={config.id} className="p-4 sm:p-6 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 space-y-3 sm:space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Opção {config.id}</span>
                                        <div className="bg-white p-1.5 sm:p-2 rounded-lg shadow-sm">
                                            <DollarSign size={14} className="text-[#279267] sm:w-4 sm:h-4" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase ml-1">Rótulo</label>
                                        <input 
                                            type="text"
                                            value={config.label}
                                            onChange={(e) => handleUpdateCashbackConfig(config.id, 'label', e.target.value)}
                                            className="w-full px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#279267] outline-none font-bold text-slate-900 text-xs sm:text-base"
                                        />
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase ml-1">Valor</label>
                                        <input 
                                            type="number"
                                            value={config.value}
                                            onChange={(e) => handleUpdateCashbackConfig(config.id, 'value', parseFloat(e.target.value))}
                                            className="w-full px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#279267] outline-none font-bold text-slate-900 text-xs sm:text-base"
                                        />
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase ml-1">Prob. (%)</label>
                                        <input 
                                            type="number"
                                            value={config.probability}
                                            onChange={(e) => handleUpdateCashbackConfig(config.id, 'probability', parseFloat(e.target.value))}
                                            className="w-full px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#279267] outline-none font-bold text-slate-900 text-xs sm:text-base"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-2 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 px-2 sm:px-0">
                            <div className="flex items-center space-x-3">
                                <div className="bg-amber-100 text-amber-600 p-2 sm:p-3 rounded-xl sm:rounded-2xl">
                                    <Trophy size={20} className="sm:w-6 sm:h-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg sm:text-2xl font-black text-slate-900">Ranking de Cashback</h2>
                                    <p className="text-slate-500 text-[10px] sm:text-sm">Somatório de valores ganhos por parceiro.</p>
                                </div>
                            </div>
                            <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit overflow-x-auto no-scrollbar">
                                <button 
                                    onClick={() => setCashbackRankingPeriod('all')}
                                    className={`whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${cashbackRankingPeriod === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Tudo
                                </button>
                                <button 
                                    onClick={() => setCashbackRankingPeriod('month')}
                                    className={`whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${cashbackRankingPeriod === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Mês
                                </button>
                                <button 
                                    onClick={() => setCashbackRankingPeriod('prev_month')}
                                    className={`whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${cashbackRankingPeriod === 'prev_month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Anterior
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
                            <table className="w-full text-left border-collapse min-w-[400px] sm:min-w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Posição</th>
                                        <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Parceiro</th>
                                        <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cashbackRankingData.length > 0 ? (
                                        cashbackRankingData.map((item, index) => (
                                            <tr key={item.name} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                                <td className="py-3 sm:py-4 px-2 sm:px-4">
                                                    <span className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-[10px] sm:text-xs font-black ${
                                                        index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                                                        index === 1 ? 'bg-slate-200 text-slate-700' : 
                                                        index === 2 ? 'bg-amber-100 text-amber-700' : 
                                                        'bg-slate-100 text-slate-500'
                                                    }`}>
                                                        {index + 1}º
                                                    </span>
                                                </td>
                                                <td className="py-3 sm:py-4 px-2 sm:px-4 font-bold text-slate-900 text-[11px] sm:text-base">{item.name}</td>
                                                <td className="py-3 sm:py-4 px-2 sm:px-4 text-right">
                                                    <span className="text-[#279267] font-black text-[11px] sm:text-base">R$ {item.total.toFixed(2)}</span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr key="empty-cashback">
                                            <td colSpan={3} className="py-10 sm:py-20 text-center text-slate-400 font-bold text-xs sm:text-base">Nenhum cashback registrado.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white p-2 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100">
                        <div className="flex items-center space-x-3 mb-6 sm:mb-8 px-2 sm:px-0">
                            <div className="bg-slate-100 text-slate-600 p-2 sm:p-3 rounded-xl sm:rounded-2xl">
                                <History size={20} className="sm:w-6 sm:h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-2xl font-black text-slate-900">Logs de Cashback</h2>
                                <p className="text-slate-500 text-[10px] sm:text-sm">Histórico recente de prêmios concedidos.</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
                            <table className="w-full text-left border-collapse min-w-[600px] sm:min-w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Data/Hora</th>
                                        <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Loja</th>
                                        <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">WhatsApp</th>
                                        <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Valor</th>
                                        <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">IP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cashbackLogs.length > 0 ? (
                                        cashbackLogs.slice(cashbackLogsPage * 10, (cashbackLogsPage + 1) * 10).map((log) => (
                                            <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                                <td className="py-3 sm:py-4 px-2 sm:px-4 text-[10px] sm:text-sm text-slate-500">
                                                    {new Date(log.created_at).toLocaleString('pt-BR')}
                                                </td>
                                                <td className="py-3 sm:py-4 px-2 sm:px-4 font-bold text-slate-900 text-[11px] sm:text-base">{log.store_name}</td>
                                                <td className="py-3 sm:py-4 px-2 sm:px-4 text-[10px] sm:text-sm font-bold text-[#279267]">{formatWhatsApp(log.whatsapp)}</td>
                                                <td className="py-3 sm:py-4 px-2 sm:px-4">
                                                    <span className="text-[#279267] font-black text-[11px] sm:text-base">
                                                        {log.cashback_label ? log.cashback_label : `R$ ${parseCashbackValue(log.cashback_label, log.cashback_value).toFixed(2)}`}
                                                    </span>
                                                </td>
                                                <td className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-mono text-slate-400">{log.ip_address}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr key="empty-logs">
                                            <td colSpan={5} className="py-10 sm:py-20 text-center text-slate-400 font-bold text-xs sm:text-base">Nenhum log registrado.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {cashbackLogs.length > 10 && (
                            <div className="mt-8 flex items-center justify-center space-x-4">
                                <button 
                                    onClick={() => setCashbackLogsPage(prev => Math.max(0, prev - 1))}
                                    disabled={cashbackLogsPage === 0}
                                    className="p-2 rounded-xl bg-slate-100 text-slate-600 disabled:opacity-30 hover:bg-slate-200 transition-all"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm font-bold text-slate-900">Página {cashbackLogsPage + 1}</span>
                                    <span className="text-xs text-slate-400">de {Math.ceil(cashbackLogs.length / 10)}</span>
                                </div>
                                <button 
                                    onClick={() => setCashbackLogsPage(prev => Math.min(Math.ceil(cashbackLogs.length / 10) - 1, prev + 1))}
                                    disabled={cashbackLogsPage >= Math.ceil(cashbackLogs.length / 10) - 1}
                                    className="p-2 rounded-xl bg-slate-100 text-slate-600 disabled:opacity-30 hover:bg-slate-200 transition-all"
                                >
                                    <ChevronRight size={24} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'coupons' && (
                <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100 mb-8 sm:mb-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div>
                            <h2 className="text-lg sm:text-2xl font-black text-slate-900 mb-2">Gestão de Cupons e Sequência</h2>
                            <p className="text-slate-500 text-xs sm:text-base">Altere a sequência de exibição, o código do cupom e a descrição do benefício em massa.</p>
                        </div>
                        <button 
                            onClick={handleSaveCoupons}
                            disabled={isSubmitting}
                            className="w-full md:w-auto px-6 py-3 bg-[#279267] text-white font-bold rounded-xl hover:bg-[#1e7250] transition-colors shadow-lg shadow-[#279267]/20 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Edit2 size={18} />
                                    <span>Salvar Alterações</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Parceiro</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">Página</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Sequência</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-48">Código do Cupom</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/3">Descrição do Benefício</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {partners.length > 0 ? (
                                    partners.map((partner) => {
                                        const currentEdit = couponEdits[partner.id] || {
                                            orderIndex: partner.orderIndex,
                                            pageNumber: partner.page_number || 1,
                                            coupon: partner.coupon || '',
                                            couponDescription: partner.couponDescription || ''
                                        };
                                        return (
                                            <tr key={partner.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-4">
                                                    <div className="flex items-center space-x-3">
                                                        <img src={partner.imageUrl} alt={partner.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                                                        <div>
                                                            <p className="font-bold text-slate-900 text-sm">{partner.name}</p>
                                                            <p className="text-[10px] font-black text-[#279267] uppercase tracking-widest">{partner.category}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <input 
                                                        type="number" 
                                                        min="1"
                                                        value={currentEdit.pageNumber}
                                                        onChange={(e) => handleCouponChange(partner.id, 'pageNumber', parseInt(e.target.value) || 1)}
                                                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 outline-none focus:border-[#279267] text-sm"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <input 
                                                        type="number" 
                                                        value={currentEdit.orderIndex}
                                                        onChange={(e) => handleCouponChange(partner.id, 'orderIndex', parseInt(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 outline-none focus:border-[#279267] text-sm"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <input 
                                                        type="text" 
                                                        value={currentEdit.coupon}
                                                        placeholder="Ex: PROMO10"
                                                        onChange={(e) => handleCouponChange(partner.id, 'coupon', e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 outline-none focus:border-[#279267] text-sm"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <input 
                                                        type="text" 
                                                        value={currentEdit.couponDescription}
                                                        placeholder="Ex: 10% de desconto"
                                                        onChange={(e) => handleCouponChange(partner.id, 'couponDescription', e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 outline-none focus:border-[#279267] text-sm"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr key="empty-partners-list">
                                        <td colSpan={4} className="py-12 text-center text-slate-400 font-bold">Nenhum parceiro cadastrado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'giftcards' && (
                <div className="space-y-6">
                    <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div className="flex items-center space-x-3">
                                <div className="bg-purple-100 text-purple-600 p-2 rounded-xl">
                                    <DollarSign size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg sm:text-2xl font-black text-slate-900">Gestão de Cartões Presente</h2>
                                    <p className="text-slate-500 text-[10px] sm:text-sm">Atualize valores e status de ativação dos cartões.</p>
                                </div>
                            </div>
                            <button 
                                onClick={fetchGiftCards}
                                disabled={isLoadingGiftCards}
                                className="flex items-center justify-center space-x-2 px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all disabled:opacity-50"
                            >
                                <RefreshCw size={18} className={isLoadingGiftCards ? 'animate-spin' : ''} />
                                <span>Atualizar Lista</span>
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Número</th>
                                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Valor (R$)</th>
                                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoadingGiftCards ? (
                                        <tr>
                                            <td colSpan={4} className="p-12 text-center">
                                                <RefreshCw size={32} className="animate-spin text-purple-600 mx-auto mb-2" />
                                                <p className="text-slate-400 font-bold">Carregando cartões...</p>
                                            </td>
                                        </tr>
                                    ) : giftCards.slice(giftCardPage * 10, (giftCardPage + 1) * 10).map((card) => (
                                        <tr key={card.card_number} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                            <td className="p-4 font-mono font-bold text-slate-900">{card.card_number}</td>
                                            <td className="p-4">
                                                <input 
                                                    type="number"
                                                    value={card.value}
                                                    onChange={(e) => handleUpdateGiftCard(card.card_number, 'value', parseFloat(e.target.value) || 0)}
                                                    className="w-32 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 outline-none focus:border-[#279267] font-bold"
                                                />
                                            </td>
                                            <td className="p-4">
                                                <select 
                                                    value={card.is_active ? 'true' : 'false'}
                                                    onChange={(e) => handleUpdateGiftCard(card.card_number, 'is_active', e.target.value === 'true')}
                                                    className={`px-3 py-2 rounded-lg border outline-none font-bold text-xs ${card.is_active ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}
                                                >
                                                    <option value="true">ATIVO</option>
                                                    <option value="false">INATIVO</option>
                                                </select>
                                            </td>
                                            <td className="p-4 text-center">
                                                {isUpdatingGiftCard === card.card_number ? (
                                                    <RefreshCw size={16} className="animate-spin text-slate-400 mx-auto" />
                                                ) : (
                                                    <div className="w-4 h-4 rounded-full bg-green-500 mx-auto shadow-sm shadow-green-200"></div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-8 flex items-center justify-center space-x-4">
                            <button 
                                onClick={() => setGiftCardPage(prev => Math.max(0, prev - 1))}
                                disabled={giftCardPage === 0}
                                className="p-2 rounded-xl bg-slate-100 text-slate-600 disabled:opacity-30 hover:bg-slate-200 transition-all"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm font-bold text-slate-900">Página {giftCardPage + 1}</span>
                                <span className="text-xs text-slate-400">de {Math.ceil(giftCards.length / 10)}</span>
                            </div>
                            <button 
                                onClick={() => setGiftCardPage(prev => Math.min(Math.ceil(giftCards.length / 10) - 1, prev + 1))}
                                disabled={giftCardPage >= Math.ceil(giftCards.length / 10) - 1}
                                className="p-2 rounded-xl bg-slate-100 text-slate-600 disabled:opacity-30 hover:bg-slate-200 transition-all"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div className="flex items-center space-x-3">
                                <div className="bg-green-100 text-green-600 p-2 rounded-xl">
                                    <History size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg sm:text-2xl font-black text-slate-900">Visualização de Cartões Ativos</h2>
                                    <p className="text-slate-500 text-[10px] sm:text-sm">Consulte todos os cartões que já foram ativados pelos clientes.</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                                    <button 
                                        onClick={() => { setActiveGiftCardsFilter('all'); setActiveGiftCardsPage(0); }}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${activeGiftCardsFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Todos
                                    </button>
                                    <button 
                                        onClick={() => { setActiveGiftCardsFilter('used'); setActiveGiftCardsPage(0); }}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${activeGiftCardsFilter === 'used' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Usados
                                    </button>
                                    <button 
                                        onClick={() => { setActiveGiftCardsFilter('unused'); setActiveGiftCardsPage(0); }}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${activeGiftCardsFilter === 'unused' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Não Usados
                                    </button>
                                </div>

                                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                                    <button 
                                        onClick={() => { setActiveGiftCardsPeriod('all'); setActiveGiftCardsPage(0); }}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${activeGiftCardsPeriod === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Todos
                                    </button>
                                    <button 
                                        onClick={() => { setActiveGiftCardsPeriod('month'); setActiveGiftCardsPage(0); }}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${activeGiftCardsPeriod === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Mês Atual
                                    </button>
                                    <button 
                                        onClick={() => { setActiveGiftCardsPeriod('prev_month'); setActiveGiftCardsPage(0); }}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${activeGiftCardsPeriod === 'prev_month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Mês Anterior
                                    </button>
                                </div>

                                <button 
                                    onClick={fetchActiveGiftCards}
                                    disabled={isLoadingActiveGiftCards}
                                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all disabled:opacity-50"
                                >
                                    <RefreshCw size={18} className={isLoadingActiveGiftCards ? 'animate-spin' : ''} />
                                    <span>Atualizar</span>
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            {activeGiftCardsError && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3 text-red-600">
                                    <AlertCircle size={20} />
                                    <span className="text-sm font-bold">Erro ao carregar: {activeGiftCardsError}</span>
                                </div>
                            )}
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Número</th>
                                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Valor</th>
                                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">WhatsApp</th>
                                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Loja</th>
                                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Data Uso</th>
                                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Expiração</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoadingActiveGiftCards ? (
                                        <tr>
                                            <td colSpan={8} className="p-12 text-center">
                                                <RefreshCw size={32} className="animate-spin text-[#279267] mx-auto mb-2" />
                                                <p className="text-slate-400 font-bold">Carregando dados...</p>
                                            </td>
                                        </tr>
                                    ) : activeGiftCards.length > 0 ? (
                                        activeGiftCardsDisplayData.length > 0 ? (
                                            activeGiftCardsDisplayData.map((card) => (
                                                <tr key={card.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                                    <td className="p-4 font-mono font-bold text-slate-900">{card.card_number}</td>
                                                    <td className="p-4 font-bold text-[#279267]">
                                                        {card.gift_cards?.value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.gift_cards.value) : 'N/A'}
                                                    </td>
                                                    <td className="p-4 text-sm text-slate-600">{card.customer_name}</td>
                                                    <td className="p-4 text-sm text-slate-600">{formatWhatsApp(card.whatsapp)}</td>
                                                    <td className="p-4 text-sm text-slate-600 font-bold">{card.partners?.name || 'N/A'}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${card.used ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                            {card.used ? 'USADO' : 'NÃO USADO'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-sm text-slate-500">
                                                        {card.used_at ? new Date(card.used_at).toLocaleDateString('pt-BR') : '-'}
                                                    </td>
                                                    <td className="p-4 text-sm text-slate-500">
                                                        {(!card.used && card.expires_at) ? new Date(card.expires_at).toLocaleDateString('pt-BR') : '-'}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">Nenhum cartão encontrado com estes filtros.</td>
                                            </tr>
                                        )
                                    ) : (
                                        <tr>
                                            <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">Nenhum cartão ativo encontrado.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {activeGiftCardsTotalPages > 1 && (
                            <div className="mt-8 flex items-center justify-center space-x-4">
                                <button 
                                    onClick={() => setActiveGiftCardsPage(prev => Math.max(0, prev - 1))}
                                    disabled={activeGiftCardsPage === 0}
                                    className="p-2 rounded-xl bg-slate-100 text-slate-600 disabled:opacity-30 hover:bg-slate-200 transition-all"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm font-bold text-slate-900">Página {activeGiftCardsPage + 1}</span>
                                    <span className="text-xs text-slate-400">de {activeGiftCardsTotalPages}</span>
                                </div>
                                <button 
                                    onClick={() => setActiveGiftCardsPage(prev => Math.min(activeGiftCardsTotalPages - 1, prev + 1))}
                                    disabled={activeGiftCardsPage >= activeGiftCardsTotalPages - 1}
                                    className="p-2 rounded-xl bg-slate-100 text-slate-600 disabled:opacity-30 hover:bg-slate-200 transition-all"
                                >
                                    <ChevronRight size={24} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'welcome' && (
                <div className="space-y-8 sm:space-y-12">
                    <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="bg-[#279267]/10 p-2 rounded-xl">
                                <Sparkles className="text-[#279267]" size={24} />
                            </div>
                            <h2 className="text-lg sm:text-2xl font-black text-slate-900">
                                {editingWelcomeId ? 'Editar Mensagem de Boas-vindas' : 'Nova Mensagem de Boas-vindas'}
                            </h2>
                        </div>

                        <form onSubmit={handleAddOrUpdateWelcome} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center">
                                        <Hash size={16} className="mr-2 text-slate-400" />
                                        ID de Referência (Alfanumérico)
                                    </label>
                                    <input 
                                        type="text" 
                                        required
                                        value={welcomeFormData.ref_id}
                                        onChange={(e) => setWelcomeFormData({ ...welcomeFormData, ref_id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                        placeholder="Ex: carro, rua, camiseta-01"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#279267] focus:ring-4 focus:ring-[#279267]/10 transition-all font-mono"
                                    />
                                    <p className="text-[10px] text-slate-400">Este será o valor usado na URL: ?ref={welcomeFormData.ref_id || 'id-aqui'}</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center">
                                        <Type size={16} className="mr-2 text-slate-400" />
                                        Título do Pop-up
                                    </label>
                                    <input 
                                        type="text" 
                                        required
                                        value={welcomeFormData.title}
                                        onChange={(e) => setWelcomeFormData({ ...welcomeFormData, title: e.target.value })}
                                        placeholder="Ex: Bem-vindo ao nosso projeto!"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#279267] focus:ring-4 focus:ring-[#279267]/10 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center">
                                    <FileText size={16} className="mr-2 text-slate-400" />
                                    Texto de Boas-vindas
                                </label>
                                <textarea 
                                    required
                                    rows={4}
                                    value={welcomeFormData.message}
                                    onChange={(e) => setWelcomeFormData({ ...welcomeFormData, message: e.target.value })}
                                    placeholder="Escreva a mensagem que aparecerá no pop-up..."
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#279267] focus:ring-4 focus:ring-[#279267]/10 transition-all resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center">
                                    <ImageIcon size={16} className="mr-2 text-slate-400" />
                                    Logotipo ou Imagem (Opcional)
                                </label>
                                <div className="flex items-center space-x-4">
                                    <div className="flex-1">
                                        <input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={(e) => setWelcomeFormData({ ...welcomeFormData, logoFile: e.target.files?.[0] || null })}
                                            className="hidden"
                                            id="welcome-logo-upload"
                                        />
                                        <label 
                                            htmlFor="welcome-logo-upload"
                                            className="flex items-center justify-center space-x-2 px-4 py-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 hover:border-[#279267] transition-all group"
                                        >
                                            <Upload size={20} className="text-slate-400 group-hover:text-[#279267]" />
                                            <span className="text-sm font-bold text-slate-500 group-hover:text-slate-700">
                                                {welcomeFormData.logoFile ? welcomeFormData.logoFile.name : 'Selecionar Imagem'}
                                            </span>
                                        </label>
                                    </div>
                                    {(welcomeFormData.logoFile || welcomeFormData.logo_url) && (
                                        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center p-1">
                                            <img 
                                                src={welcomeFormData.logoFile ? URL.createObjectURL(welcomeFormData.logoFile) : welcomeFormData.logo_url!} 
                                                alt="Preview" 
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-4 bg-[#279267] text-white font-black rounded-2xl shadow-lg shadow-green-900/20 hover:bg-green-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Save size={20} />
                                            <span>{editingWelcomeId ? 'Atualizar Mensagem' : 'Salvar Mensagem'}</span>
                                        </>
                                    )}
                                </button>
                                {editingWelcomeId && (
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setEditingWelcomeId(null);
                                            setWelcomeFormData({ 
                                                ref_id: '', 
                                                title: '', 
                                                message: '', 
                                                logo_url: '', 
                                                logoFile: null
                                            });
                                        }}
                                        className="px-8 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center space-x-3">
                                <div className="bg-slate-900 text-white p-2 rounded-xl">
                                    <FileText size={20} />
                                </div>
                                <h2 className="text-lg sm:text-2xl font-black text-slate-900">Mensagens Cadastradas</h2>
                            </div>
                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                                {welcomeMessages.length} Total
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {welcomeMessages.map((msg) => (
                                <div key={msg.id} className="group bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:border-[#279267] hover:shadow-lg transition-all relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                        <button 
                                            onClick={() => handleEditWelcome(msg)}
                                            className="p-2 bg-white text-blue-500 rounded-lg shadow-sm hover:bg-blue-50 transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button 
                                            onClick={() => handleRemoveWelcome(msg.id)}
                                            className="p-2 bg-white text-red-500 rounded-lg shadow-sm hover:bg-red-50 transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center p-1 overflow-hidden">
                                                {msg.logo_url ? (
                                                    <img src={msg.logo_url} alt="Logo" className="w-full h-full object-contain" />
                                                ) : (
                                                    <Sparkles className="text-[#279267]" size={20} />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-900 leading-tight">{msg.title}</h3>
                                                <p className="text-[10px] font-mono text-[#279267] font-bold uppercase tracking-wider">ref={msg.ref_id}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs font-black text-slate-900">{welcomeAccessCounts[msg.ref_id] || 0}</span>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Acessos</span>
                                        </div>
                                    </div>

                                    <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed">
                                        {msg.message}
                                    </p>

                                    <div className="pt-4 border-t border-slate-200/50 flex items-center justify-between">
                                        <div className="flex items-center text-[10px] text-slate-400 font-bold">
                                            <Calendar size={12} className="mr-1" />
                                            {new Date(msg.created_at!).toLocaleDateString('pt-BR')}
                                        </div>
                                        <button 
                                            onClick={() => {
                                                const url = `${window.location.origin}/?ref=${msg.ref_id}`;
                                                navigator.clipboard.writeText(url);
                                                alert("Link copiado para a área de transferência!");
                                            }}
                                            className="text-[10px] font-bold text-[#279267] hover:underline flex items-center"
                                        >
                                            <ExternalLink size={12} className="mr-1" />
                                            Copiar Link
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {welcomeMessages.length === 0 && (
                                <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                    <Sparkles className="mx-auto text-slate-300 mb-4" size={48} />
                                    <h3 className="text-slate-500 font-bold">Nenhuma mensagem de boas-vindas cadastrada.</h3>
                                    <p className="text-slate-400 text-sm">Crie sua primeira mensagem acima.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'campaigns' && (
                <div className="space-y-8 sm:space-y-12">
                    <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="bg-[#279267]/10 p-2 rounded-xl">
                                <Gift className="text-[#279267]" size={24} />
                            </div>
                            <h2 className="text-lg sm:text-2xl font-black text-slate-900">
                                {editingCampaignId ? 'Editar Campanha de Cupom' : 'Nova Campanha de Cupom'}
                            </h2>
                        </div>

                        <form onSubmit={handleAddOrUpdateCampaign} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center">
                                        <Hash size={16} className="mr-2 text-slate-400" />
                                        ID de Referência (Slug da URL)
                                    </label>
                                    <input 
                                        type="text" 
                                        required
                                        value={campaignFormData.ref_id}
                                        onChange={(e) => setCampaignFormData({ ...campaignFormData, ref_id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                        placeholder="Ex: cupom-especial, oferta-natal"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#279267] focus:ring-4 focus:ring-[#279267]/10 transition-all font-mono"
                                    />
                                    <p className="text-[10px] text-slate-400">Este será o valor usado na URL: /#/v/{campaignFormData.ref_id || 'slug-aqui'}</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center">
                                        <Type size={16} className="mr-2 text-slate-400" />
                                        Título da Campanha
                                    </label>
                                    <input 
                                        type="text" 
                                        required
                                        value={campaignFormData.title}
                                        onChange={(e) => setCampaignFormData({ ...campaignFormData, title: e.target.value })}
                                        placeholder="Ex: Seu Cupom Especial Chegou!"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#279267] focus:ring-4 focus:ring-[#279267]/10 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center">
                                    <FileText size={16} className="mr-2 text-slate-400" />
                                    Mensagem de Boas-vindas
                                </label>
                                <textarea 
                                    required
                                    rows={3}
                                    value={campaignFormData.message}
                                    onChange={(e) => setCampaignFormData({ ...campaignFormData, message: e.target.value })}
                                    placeholder="Escreva a mensagem que aparecerá no topo da página..."
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#279267] focus:ring-4 focus:ring-[#279267]/10 transition-all resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center">
                                        <Store size={16} className="mr-2 text-slate-400" />
                                        Loja Parceira
                                    </label>
                                    <select 
                                        required
                                        value={campaignFormData.partner_id || ''}
                                        onChange={(e) => setCampaignFormData({ ...campaignFormData, partner_id: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#279267] focus:ring-4 focus:ring-[#279267]/10 transition-all"
                                    >
                                        <option value="">Selecione uma loja...</option>
                                        {partners.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center">
                                        <Gift size={16} className="mr-2 text-slate-400" />
                                        Código do Cupom (Personalizado)
                                    </label>
                                    <input 
                                        type="text" 
                                        value={campaignFormData.custom_coupon || ''}
                                        onChange={(e) => setCampaignFormData({ ...campaignFormData, custom_coupon: e.target.value })}
                                        placeholder="Ex: BEMVINDO10"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#279267] focus:ring-4 focus:ring-[#279267]/10 transition-all font-mono"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center">
                                        <Sparkles size={16} className="mr-2 text-slate-400" />
                                        Descrição do Benefício
                                    </label>
                                    <input 
                                        type="text" 
                                        value={campaignFormData.custom_description || ''}
                                        onChange={(e) => setCampaignFormData({ ...campaignFormData, custom_description: e.target.value })}
                                        placeholder="Ex: 10% de desconto na primeira compra"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#279267] focus:ring-4 focus:ring-[#279267]/10 transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center">
                                        <Calendar size={16} className="mr-2 text-slate-400" />
                                        Data de Validade (Opcional)
                                    </label>
                                    <input 
                                        type="date" 
                                        value={campaignFormData.expires_at || ''}
                                        onChange={(e) => setCampaignFormData({ ...campaignFormData, expires_at: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#279267] focus:ring-4 focus:ring-[#279267]/10 transition-all"
                                    />
                                    <p className="text-[10px] text-slate-400">Se vazio, usará a regra padrão de 7 dias.</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center">
                                    <ImageIcon size={16} className="mr-2 text-slate-400" />
                                    Logotipo ou Imagem da Campanha (Opcional)
                                </label>
                                <div className="flex items-center space-x-4">
                                    <div className="flex-1">
                                        <input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={(e) => setCampaignFormData({ ...campaignFormData, logoFile: e.target.files?.[0] || null })}
                                            className="hidden"
                                            id="campaign-logo-upload"
                                        />
                                        <label 
                                            htmlFor="campaign-logo-upload"
                                            className="flex items-center justify-center space-x-2 px-4 py-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 hover:border-[#279267] transition-all group"
                                        >
                                            <Upload size={20} className="text-slate-400 group-hover:text-[#279267]" />
                                            <span className="text-sm font-bold text-slate-500 group-hover:text-slate-700">
                                                {campaignFormData.logoFile ? campaignFormData.logoFile.name : 'Selecionar Imagem'}
                                            </span>
                                        </label>
                                    </div>
                                    {(campaignFormData.logoFile || campaignFormData.logo_url) && (
                                        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center p-1">
                                            <img 
                                                src={campaignFormData.logoFile ? URL.createObjectURL(campaignFormData.logoFile) : campaignFormData.logo_url!} 
                                                alt="Preview" 
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-4 bg-[#279267] text-white font-black rounded-2xl shadow-lg shadow-green-900/20 hover:bg-green-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Save size={20} />
                                            <span>{editingCampaignId ? 'Atualizar Campanha' : 'Salvar Campanha'}</span>
                                        </>
                                    )}
                                </button>
                                {editingCampaignId && (
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setEditingCampaignId(null);
                                            setCampaignFormData({ 
                                                ref_id: '', 
                                                title: '', 
                                                message: '', 
                                                logo_url: '', 
                                                logoFile: null,
                                                partner_id: '',
                                                custom_coupon: '',
                                                custom_description: '',
                                                expires_at: ''
                                            });
                                        }}
                                        className="px-8 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100">
                        <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center">
                            <List size={24} className="mr-2 text-[#279267]" />
                            Campanhas Ativas
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {couponCampaigns.map(campaign => (
                                <div key={campaign.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:border-[#279267] transition-all group">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                                            {campaign.logo_url ? (
                                                <img src={campaign.logo_url} alt="" className="w-full h-full object-contain" />
                                            ) : (
                                                <Gift size={20} className="text-slate-300" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-black text-slate-900 truncate">{campaign.title}</h4>
                                            <p className="text-[10px] font-mono text-slate-500">/#/v/{campaign.ref_id}</p>
                                            {campaign.expires_at && (
                                                <p className="text-[9px] font-bold text-amber-600 mt-1 flex items-center">
                                                    <Calendar size={10} className="mr-1" />
                                                    Expira em: {new Date(campaign.expires_at).toLocaleDateString('pt-BR')}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-black text-[#279267] bg-[#279267]/10 px-2 py-0.5 rounded-full">
                                                {couponCampaignAccessCounts[campaign.ref_id] || 0} acessos
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                                        <div className="flex space-x-2">
                                            <button 
                                                onClick={() => handleEditCampaign(campaign)}
                                                className="p-2 text-slate-400 hover:text-[#279267] hover:bg-white rounded-lg transition-all"
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleRemoveCampaign(campaign.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                                                title="Remover"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                const url = `${window.location.origin}${window.location.pathname}#/v/${campaign.ref_id}`;
                                                navigator.clipboard.writeText(url);
                                                alert("Link copiado!");
                                            }}
                                            className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:border-[#279267] hover:text-[#279267] transition-all"
                                        >
                                            <Copy size={12} />
                                            <span>Copiar Link</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Confirmar Exclusão</h3>
                        <p className="text-slate-600 mb-6">
                            Tem certeza que deseja remover {deleteConfirm.type === 'partner' ? 'este parceiro' : deleteConfirm.type === 'category' ? 'esta categoria' : deleteConfirm.type === 'banner' ? 'o banner atual' : 'este case de sucesso'}? Esta ação não pode ser desfeita.
                        </p>
                                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                                    <button 
                                        onClick={() => setDeleteConfirm(null)}
                                        className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        onClick={async () => {
                                            if (deleteConfirm.type === 'case') {
                                                try {
                                                    await supabase.from('success_cases').delete().eq('id', deleteConfirm.id);
                                                    setSuccessCases(successCases.filter(c => c.id !== deleteConfirm.id));
                                                } catch (error) { logger.error(error); }
                                                setDeleteConfirm(null);
                                            } else {
                                                executeDelete();
                                            }
                                        }}
                                        className="flex-1 px-4 py-3 bg-[#c54b4b] text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
                                    >
                                        Excluir
                                    </button>
                                </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const App = () => {
    const [isPasswordVerified, setIsPasswordVerified] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        const savedAuth = localStorage.getItem('app_authorized');
        if (savedAuth === 'true') {
            setIsPasswordVerified(true);
        }
    }, []);

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordInput === 'Ama23') {
            localStorage.setItem('app_authorized', 'true');
            setIsPasswordVerified(true);
            setPasswordError('');
            logger.security({
                type: 'successful_login',
                severity: 'low',
                details: { method: 'global_password' }
            });
        } else {
            setPasswordError('Senha incorreta. Tente novamente.');
            logger.security({
                type: 'failed_password',
                severity: 'medium',
                details: { attempted_password: passwordInput }
            });
        }
    };

    const [partners, setPartners] = useState<Partner[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [commercialBanners, setCommercialBanners] = useState<CommercialBannerData[]>([]);
    const [headerLogo, setHeaderLogo] = useState<string | null>(null);
    const [featuredPartner, setFeaturedPartner] = useState<Partner | null>(null);
    const [featuredCoupons, setFeaturedCoupons] = useState<FeaturedCoupon[]>([]);
    const [welcomeMessages, setWelcomeMessages] = useState<WelcomeMessage[]>([]);
    const [welcomeAccessCounts, setWelcomeAccessCounts] = useState<Record<string, number>>({});
    const [partnerAccessCounts, setPartnerAccessCounts] = useState<Record<string, number>>({});
    const [couponCampaigns, setCouponCampaigns] = useState<CouponCampaign[]>([]);
    const [couponCampaignAccessCounts, setCouponCampaignAccessCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [showGiftCardModal, setShowGiftCardModal] = useState(false);
    const [giftCardNumber, setGiftCardNumber] = useState('');
    const [giftCardToken, setGiftCardToken] = useState('');
    const [giftCards, setGiftCards] = useState<any[]>([]);
    const [isLoadingGiftCards, setIsLoadingGiftCards] = useState(false);
    const [activeGiftCards, setActiveGiftCards] = useState<any[]>([]);
    const [isLoadingActiveGiftCards, setIsLoadingActiveGiftCards] = useState(false);
    const [activeGiftCardsError, setActiveGiftCardsError] = useState<string | null>(null);
    const [isUpdatingGiftCard, setIsUpdatingGiftCard] = useState<string | null>(null);

    const [bannerLinks, setBannerLinks] = useState<{[key: number]: string}>({
        1: commercialBanners.find(b => b.id === 1)?.linkUrl || '',
        3: commercialBanners.find(b => b.id === 3)?.linkUrl || '',
        4: commercialBanners.find(b => b.id === 4)?.linkUrl || ''
    });
    const [bannerNames, setBannerNames] = useState<{[key: number]: string}>({
        1: commercialBanners.find(b => b.id === 1)?.partnerName || '',
        3: commercialBanners.find(b => b.id === 3)?.partnerName || '',
        4: commercialBanners.find(b => b.id === 4)?.partnerName || ''
    });

    const logBannerClick = async (banner: CommercialBannerData) => {
        console.log('Logging banner click:', banner);
        try {
            const ip = await getUserIP();
            const { error } = await supabase.from('banner_clicks').insert({
                banner_id: banner.id,
                partner_name: banner.partnerName || 'N/A',
                link_url: banner.linkUrl || 'N/A',
                ip_address: ip
            });
            if (error) {
                console.error('Supabase error logging banner click:', error);
            } else {
                console.log('Banner click logged successfully');
            }
        } catch (error) {
            console.error('Catch error logging banner click:', error);
            logger.error('Error logging banner click:', error);
        }
    };

    useEffect(() => {
        // Detect /presente/XXX-TOKEN or /presenteXXX path
        const checkPath = (p: string) => {
            // New secure format: /presente/001-AbC123
            const secureMatch = p.match(/\/presente\/(\d{3})-([a-zA-Z0-9]{6})/);
            if (secureMatch) {
                setGiftCardNumber(secureMatch[1]);
                setGiftCardToken(secureMatch[2]);
                setShowGiftCardModal(true);
                return true;
            }

            // Legacy format: /presente001
            const legacyMatch = p.match(/\/presente(\d{3})/);
            if (legacyMatch) {
                setGiftCardNumber(legacyMatch[1]);
                setGiftCardToken(''); // No token for legacy
                setShowGiftCardModal(true);
                return true;
            }
            return false;
        };

        if (!checkPath(window.location.pathname)) {
            checkPath(window.location.hash);
        }
    }, []);

    useEffect(() => {
        fetchData();
        fetchGiftCards();
        fetchActiveGiftCards();
    }, []);

    const fetchActiveGiftCards = async () => {
        setIsLoadingActiveGiftCards(true);
        setActiveGiftCardsError(null);
        try {
            // Try to fetch with joins, but fall back if it fails (likely due to missing foreign keys)
            const { data: enrichedData, error: enrichedError } = await supabase
                .from('active_gift_cards')
                .select('*, partners(name), gift_cards(value)')
                .order('id', { ascending: false });
            
            if (enrichedError) {
                logger.warn('Enriched fetch failed, falling back to simple fetch:', enrichedError);
                const { data: simpleData, error: simpleError } = await supabase
                    .from('active_gift_cards')
                    .select('*')
                    .order('id', { ascending: false });
                
                if (simpleError) {
                    logger.error('Simple fetch also failed:', simpleError);
                    setActiveGiftCardsError(simpleError.message);
                    throw simpleError;
                }
                setActiveGiftCards(simpleData || []);
            } else {
                setActiveGiftCards(enrichedData || []);
            }
        } catch (error: any) {
            logger.error('Error fetching active gift cards:', error);
            setActiveGiftCardsError(error.message || 'Erro desconhecido ao buscar cartões ativos.');
        } finally {
            setIsLoadingActiveGiftCards(false);
        }
    };

    const fetchGiftCards = async () => {
        setIsLoadingGiftCards(true);
        try {
            const { data, error } = await supabase
                .from('gift_cards')
                .select('*')
                .order('card_number', { ascending: true });
            if (error) throw error;
            setGiftCards(data || []);
        } catch (error) {
            logger.error('Error fetching gift cards:', error);
        } finally {
            setIsLoadingGiftCards(false);
        }
    };

    const handleUpdateGiftCard = async (cardNumber: string, field: string, value: any) => {
        setIsUpdatingGiftCard(cardNumber);
        try {
            const { data, error } = await supabase
                .from('gift_cards')
                .update({ [field]: value })
                .eq('card_number', cardNumber)
                .select();
            
            if (error) throw error;
            
            if (!data || data.length === 0) {
                throw new Error('Nenhum registro encontrado para este número de cartão.');
            }
            
            setGiftCards(prev => prev.map(card => 
                card.card_number === cardNumber ? { ...card, [field]: value } : card
            ));
        } catch (error: any) {
            logger.error('Error updating gift card:', error);
            alert(`Erro ao atualizar cartão: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setIsUpdatingGiftCard(null);
        }
    };

    useEffect(() => {
        if (!loading && partners.length > 0) {
            fetchFeaturedPartner();
        }
    }, [loading, partners.length]);

    const fetchFeaturedPartner = async () => {
        try {
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            const { data: accessLogs } = await supabase
                .from('partner_access_logs')
                .select('partner_id')
                .gte('created_at', sevenDaysAgo);

            if (accessLogs && accessLogs.length > 0) {
                const counts: { [key: string]: number } = {};
                accessLogs.forEach(log => {
                    counts[log.partner_id] = (counts[log.partner_id] || 0) + 1;
                });
                const topPartnerId = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
                const topPartner = partners.find(p => p.id === topPartnerId);
                if (topPartner) setFeaturedPartner(topPartner);
            }
        } catch (error) {
            logger.error('Error fetching featured partner:', error);
        }
    };

    const fetchData = async () => {
        try {
            const [partnersRes, categoriesRes, bannerRes, featuredCouponsRes, welcomeMessagesRes, welcomeAccessLogsRes, couponCampaignsRes, couponCampaignAccessLogsRes, partnerAccessLogsRes] = await Promise.all([
                supabase.from('partners').select('*').order('order_index', { ascending: true }),
                supabase.from('categories').select('*').order('name', { ascending: true }),
                supabase.from('commercial_banner').select('*').in('id', [1, 2, 3, 4]),
                supabase.from('featured_coupons').select('*').order('slot_id', { ascending: true }),
                supabase.from('welcome_messages').select('*').order('created_at', { ascending: false }),
                supabase.from('welcome_access_logs').select('ref_id'),
                supabase.from('coupon_campaigns').select('*').order('created_at', { ascending: false }),
                supabase.from('coupon_campaign_access_logs').select('ref_id'),
                supabase.from('partner_access_logs').select('partner_id')
            ]);

            if (partnersRes.error) throw partnersRes.error;
            if (categoriesRes.error) throw categoriesRes.error;
            
            if (partnersRes.data) {
                const mappedPartners: Partner[] = partnersRes.data.map(p => ({
                    id: p.id,
                    name: p.name,
                    category: p.category,
                    activity: p.activity,
                    description: p.description,
                    address: p.address,
                    imageUrl: p.image_url,
                    images: p.images || [],
                    videoUrl: p.video_url || '',
                    link: p.link,
                    whatsappLink: p.whatsapp_link,
                    googleReviewLink: p.google_review_link,
                    websiteUrl: p.website_url,
                    coupon: p.coupon,
                    couponDescription: p.coupon_description,
                    isAuthorized: p.is_authorized ?? true,
                    cashbackEnabled: p.cashback_enabled ?? true,
                    giftCardEnabled: p.gift_card_enabled ?? false,
                    orderIndex: p.order_index ?? 0,
                    page_number: p.page_number || 1,
                    displayId: p.display_id || 0
                }));
                setPartners(mappedPartners);
            }

            if (categoriesRes.data) {
                setCategories(categoriesRes.data);
            }

            if (featuredCouponsRes.data) {
                setFeaturedCoupons(featuredCouponsRes.data);
            }

            if (welcomeMessagesRes.data) {
                setWelcomeMessages(welcomeMessagesRes.data);
            }

            if (welcomeAccessLogsRes.data) {
                const counts: Record<string, number> = {};
                welcomeAccessLogsRes.data.forEach(log => {
                    counts[log.ref_id] = (counts[log.ref_id] || 0) + 1;
                });
                setWelcomeAccessCounts(counts);
            }

            if (couponCampaignsRes.data) {
                setCouponCampaigns(couponCampaignsRes.data);
            }

            if (couponCampaignAccessLogsRes.data) {
                const counts: Record<string, number> = {};
                couponCampaignAccessLogsRes.data.forEach(log => {
                    counts[log.ref_id] = (counts[log.ref_id] || 0) + 1;
                });
                setCouponCampaignAccessCounts(counts);
            }

            if (partnerAccessLogsRes.data) {
                const counts: Record<string, number> = {};
                partnerAccessLogsRes.data.forEach(log => {
                    counts[log.partner_id] = (counts[log.partner_id] || 0) + 1;
                });
                setPartnerAccessCounts(counts);
            }

            if (bannerRes.data) {
                const carouselBanners = bannerRes.data
                    .filter(b => [1, 3, 4].includes(b.id))
                    .map(b => ({
                        id: b.id,
                        imageUrl: b.image_url,
                        linkUrl: b.link_url,
                        partnerName: b.partner_name
                    }))
                    .sort((a, b) => {
                        // Maintain order: 1, 3, 4
                        const order = { 1: 0, 3: 1, 4: 2 };
                        return (order[a.id as keyof typeof order] || 0) - (order[b.id as keyof typeof order] || 0);
                    });
                
                setCommercialBanners(carouselBanners);
                
                // Update bannerLinks and bannerNames states
                const links: {[key: number]: string} = {};
                const names: {[key: number]: string} = {};
                carouselBanners.forEach(b => {
                    links[b.id] = b.linkUrl || '';
                    names[b.id] = b.partnerName || '';
                });
                setBannerLinks(prev => ({ ...prev, ...links }));
                setBannerNames(prev => ({ ...prev, ...names }));
                
                const logoBanner = bannerRes.data.find(b => b.id === 2);
                if (logoBanner) setHeaderLogo(logoBanner.image_url);
            }
        } catch (error) {
            logger.error('Error fetching data:', error);
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

    if (!isPasswordVerified) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Lock className="text-slate-900" size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Ambiente de Testes</h1>
                    <p className="text-slate-500 mb-8 font-medium">Digite a senha para acessar a plataforma.</p>
                    
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div className="relative">
                            <input
                                type="password"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                placeholder="Digite a senha"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-center font-bold"
                                autoFocus
                            />
                        </div>
                        {passwordError && (
                            <p className="text-red-500 text-sm font-bold">{passwordError}</p>
                        )}
                        <button
                            type="submit"
                            className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
                        >
                            Entrar
                        </button>
                    </form>
                    
                    <p className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Aparece aí por aqui • Vila Formosa
                    </p>
                </div>
            </div>
        );
    }

    return (
        <GoogleReCaptchaProvider 
            reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
            language="pt-BR"
        >
            <Router>
                <GlobalAuthGuard />
                <AnimatePresence>
                    {showGiftCardModal && (
                        <GiftCardModal 
                            isOpen={showGiftCardModal}
                            cardNumber={giftCardNumber}
                            accessToken={giftCardToken}
                            onClose={() => {
                                setShowGiftCardModal(false);
                                setGiftCardNumber('');
                                setGiftCardToken('');
                            }}
                            partners={partners}
                            headerLogo={headerLogo}
                        />
                    )}
                </AnimatePresence>
                <AnalyticsTracker />
                <ScrollToTop />
                <div className="min-h-screen flex flex-col bg-gray-50 pt-20 md:pt-24 overflow-x-hidden">
                    <Header headerLogo={headerLogo} />
                    <CommercialBanner position="top" />
                    <Routes>
                        <Route path="/" element={<LandingPage partners={partners} categories={categories} commercialBanners={commercialBanners} featuredPartner={featuredPartner} featuredCoupons={featuredCoupons} headerLogo={headerLogo} partnerAccessCounts={partnerAccessCounts} onBannerClick={logBannerClick} />} />
                        <Route path="/sobre-nos" element={<AboutUsPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/politica-de-privacidade" element={<PrivacyPolicyPage />} />
                        <Route path="/termos-de-uso" element={<TermsOfUsePage />} />
                        <Route path="/v/:refId" element={<WelcomePage partners={partners} />} />
                        <Route path="/admin" element={
                            <ProtectedRoute>
                                <AdminPage 
                                    partners={partners} 
                                    setPartners={setPartners} 
                                    categories={categories} 
                                    setCategories={setCategories} 
                                    commercialBanners={commercialBanners} 
                                    setCommercialBanners={setCommercialBanners} 
                                    headerLogo={headerLogo} 
                                    setHeaderLogo={setHeaderLogo} 
                                    featuredCoupons={featuredCoupons} 
                                    setFeaturedCoupons={setFeaturedCoupons} 
                                    welcomeMessages={welcomeMessages} 
                                    setWelcomeMessages={setWelcomeMessages}
                                    welcomeAccessCounts={welcomeAccessCounts}
                                    couponCampaigns={couponCampaigns}
                                    setCouponCampaigns={setCouponCampaigns}
                                    couponCampaignAccessCounts={couponCampaignAccessCounts}
                                    giftCards={giftCards}
                                    setGiftCards={setGiftCards}
                                    isLoadingGiftCards={isLoadingGiftCards}
                                    fetchGiftCards={fetchGiftCards}
                                    activeGiftCards={activeGiftCards}
                                    isLoadingActiveGiftCards={isLoadingActiveGiftCards}
                                    activeGiftCardsError={activeGiftCardsError}
                                    fetchActiveGiftCards={fetchActiveGiftCards}
                                    handleUpdateGiftCard={handleUpdateGiftCard}
                                    isUpdatingGiftCard={isUpdatingGiftCard}
                                    setIsUpdatingGiftCard={setIsUpdatingGiftCard}
                                    bannerLinks={bannerLinks}
                                    setBannerLinks={setBannerLinks}
                                    bannerNames={bannerNames}
                                    setBannerNames={setBannerNames}
                                />
                            </ProtectedRoute>
                        } />
                        <Route path="/admin-mensagens" element={
                            <ProtectedRoute>
                                <AdminMessagesPage />
                            </ProtectedRoute>
                        } />
                        <Route path="/admin/security" element={
                            <ProtectedRoute>
                                <SecurityLogsPage />
                            </ProtectedRoute>
                        } />
                        <Route path="*" element={<LandingPage partners={partners} categories={categories} commercialBanners={commercialBanners} featuredPartner={featuredPartner} featuredCoupons={featuredCoupons} headerLogo={headerLogo} partnerAccessCounts={partnerAccessCounts} onBannerClick={logBannerClick} />} />
                    </Routes>
                    <Footer logoUrl={headerLogo} />
                    <CommercialBanner position="bottom" />
                </div>
            </Router>
        </GoogleReCaptchaProvider>
    );
};

export default App;
