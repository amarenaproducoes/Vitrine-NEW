/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Link, useNavigate } from 'react-router-dom';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import DOMPurify from 'dompurify';
import { 
    Store, Car, Megaphone, Sparkles, ChevronRight, ChevronLeft, Plus, Trash2, 
    Filter, Info, ArrowRight, Zap, Edit2, Upload, X, Trophy, Settings, DollarSign, History, LogOut, MessageSquare, Search, Share2, MousePointerClick
} from 'lucide-react';

import Header from './components/Header';
import Footer from './components/Footer';
import PartnerCard from './components/PartnerCard';
import LeadForm from './components/LeadForm';
import AdminMessagesPage from './components/AdminMessagesPage';
import AboutUsPage from './components/AboutUsPage';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import TermsOfUsePage from './components/TermsOfUsePage';
import RouletteModal from './components/RouletteModal';
import WelcomeModal from './components/WelcomeModal';
import LoginPage from './components/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AnimatePresence } from 'motion/react';
import { CATEGORIES } from './constants';
import { Partner, Category, SuccessCase, AboutConfig, CashbackConfig, CashbackLog, CommercialBannerData } from './types';

interface FeaturedCoupon {
    id?: string;
    slot_id: number;
    partner_id: string | null;
    created_at?: string;
}

import { supabase } from './lib/supabase';
import { getUserIP } from './lib/ip';
import { logger } from './lib/logger';
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

const GA_MEASUREMENT_ID = 'G-9F6ST94BVG';

// Inicializa o GA4 fora do componente para garantir que rode apenas uma vez
ReactGA.initialize(GA_MEASUREMENT_ID);

const AnalyticsTracker = () => {
    const location = useLocation();

    useEffect(() => {
        // Envia o evento de pageview sempre que a rota mudar
        ReactGA.send({ hitType: "pageview", page: location.pathname + location.search + location.hash });
    }, [location]);

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

const BannerCarousel = ({ banners }: { banners: CommercialBannerData[] }) => {
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
                                    <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="block">
                                        <img src={banner.imageUrl} alt="Banner Publicitário" className="w-full h-auto block" />
                                    </a>
                                ) : (
                                    <img src={banner.imageUrl} alt="Banner Publicitário" className="w-full h-auto block" />
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

const LandingPage = ({ partners, categories, commercialBanners, featuredPartner, featuredCoupons, headerLogo }: { partners: Partner[], categories: Category[], commercialBanners: CommercialBannerData[], featuredPartner: Partner | null, featuredCoupons: FeaturedCoupon[], headerLogo: string | null }) => {
    const [activeCategory, setActiveCategory] = useState("Todos");
    const [searchTerm, setSearchTerm] = useState("");
    const [roulettePartner, setRoulettePartner] = useState<Partner | null>(null);
    const [cashbackConfigs, setCashbackConfigs] = useState<CashbackConfig[]>([]);
    const [showRoulette, setShowRoulette] = useState(false);
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const location = useLocation();

    useEffect(() => {
        // Check both window.location.search (before hash) and location.search (after hash)
        const windowParams = new URLSearchParams(window.location.search);
        const locationParams = new URLSearchParams(location.search);
        
        const refId = windowParams.get('ref') || locationParams.get('ref');
        
        if (refId) {
            handleRefAccess(parseInt(refId));
        }
    }, [location]);

    const handleRefAccess = async (displayId: number) => {
        // Check if modal was already shown in this session to prevent re-triggering on navigation
        if (sessionStorage.getItem(`welcome_modal_shown_${displayId}`)) return;

        try {
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
                        // Mark as shown for this session
                        sessionStorage.setItem(`welcome_modal_shown_${displayId}`, 'true');
                    }
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
    const filteredPartners = authorizedPartners.filter(p => {
        const matchesCategory = activeCategory === "Todos" || p.category === activeCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });
    
    return (
        <main className="flex-grow">
            <AnimatePresence>
                {showWelcomeModal && roulettePartner && (
                    <WelcomeModal 
                        isOpen={showWelcomeModal}
                        onClose={() => setShowWelcomeModal(false)}
                        onAccept={() => {
                            setShowWelcomeModal(false);
                            setShowRoulette(true);
                        }}
                        storeName={roulettePartner.name}
                        logoUrl={headerLogo}
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
            <BannerCarousel banners={commercialBanners} />
            <section id="vitrine" className="relative overflow-hidden bg-slate-900 pt-8 pb-10 md:pt-10 md:pb-12">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-[#279267]/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#c54b4b]/10 rounded-full blur-[120px]"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center space-x-2 bg-slate-800/50 backdrop-blur-sm px-4 py-2 rounded-full text-[#279267] text-xs font-bold uppercase tracking-widest mb-6 border border-slate-700/50"><Sparkles size={14} /><span>Garanta cupons de benefícios nas lojas da região!</span></div>
                    <h1 className="text-4xl md:text-7xl font-black text-white mb-4 leading-tight">Cupons <span className="text-[#279267] italic">Exclusivos</span></h1>
                    <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium">Confira abaixo os benefícios e descontos exclusivos que os nossos parceiros prepararam para vocês! Aproveitem e garantam já!</p>
                </div>
            </section>

            <section className="sticky top-20 z-40 bg-white border-b border-slate-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar whitespace-nowrap flex-grow">
                        <div className="flex items-center text-slate-400 mr-4 font-bold text-sm uppercase tracking-wider"><Filter size={16} className="mr-2" /> Filtrar:</div>
                        {['Todos', ...categories.map(c => c.name)].map(cat => (
                            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2 rounded-full text-xs font-bold transition-all border ${activeCategory === cat ? 'bg-[#279267] border-[#279267] text-white shadow-lg shadow-[#279267]/20' : 'bg-white border-slate-200 text-slate-500 hover:border-[#279267]/20 hover:text-[#279267]'}`}>{cat}</button>
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

            <section className="py-6 bg-white border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center space-x-2 mb-8">
                        <div className="bg-[#c54b4b] text-white p-2 rounded-lg shadow-lg shadow-red-500/20">
                            <Trophy size={18} />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Cupons em Destaque da Semana</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    className="flex items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-[#279267] hover:bg-green-50 transition-all group text-left"
                                >
                                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-slate-200 flex-shrink-0 mr-4">
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

            <section id="results-grid" className="py-8 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredPartners.length > 0 ? filteredPartners.map((partner) => (<PartnerCard key={partner.id} partner={partner} />)) : (
                            <div className="col-span-full py-20 text-center">
                                <div className="text-slate-300 mb-4 flex justify-center"><Store size={64} strokeWidth={1} /></div>
                                <h3 className="text-xl font-bold text-slate-400">
                                    {searchTerm ? `Nenhum parceiro encontrado para "${searchTerm}"` : "Nenhum parceiro nesta categoria ainda."}
                                </h3>
                                {!searchTerm && <a href="#anuncie" className="text-[#279267] font-bold mt-2 inline-block hover:underline">Seja o primeiro a anunciar aqui!</a>}
                            </div>
                        )}
                    </div>

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

const AdminPage = ({ partners, setPartners, categories, setCategories, commercialBanners, setCommercialBanners, headerLogo, setHeaderLogo, featuredCoupons, setFeaturedCoupons }: { partners: Partner[], setPartners: React.Dispatch<React.SetStateAction<Partner[]>>, categories: Category[], setCategories: React.Dispatch<React.SetStateAction<Category[]>>, commercialBanners: CommercialBannerData[], setCommercialBanners: React.Dispatch<React.SetStateAction<CommercialBannerData[]>>, headerLogo: string | null, setHeaderLogo: React.Dispatch<React.SetStateAction<string | null>>, featuredCoupons: FeaturedCoupon[], setFeaturedCoupons: React.Dispatch<React.SetStateAction<FeaturedCoupon[]>> }) => {
    const [activeTab, setActiveTab] = useState<'partners' | 'about' | 'cases' | 'ranking' | 'cashback' | 'featured' | 'coupons'>('partners');
    const navigate = useNavigate();
    
    // Coupon Mass Edit State
    const [couponEdits, setCouponEdits] = useState<{[key: string]: { orderIndex: number, coupon: string, couponDescription: string }}>({});

    const handleSaveCoupons = async () => {
        setIsSubmitting(true);
        try {
            const updates = Object.entries(couponEdits).map(([id, edit]) => ({
                id,
                order_index: edit.orderIndex,
                coupon: edit.coupon,
                coupon_description: edit.couponDescription
            }));

            for (const update of updates) {
                const { error } = await supabase.from('partners').update({
                    order_index: update.order_index,
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
                        coupon: couponEdits[p.id].coupon,
                        couponDescription: couponEdits[p.id].couponDescription
                    };
                }
                return p;
            }).sort((a, b) => a.orderIndex - b.orderIndex));

            setCouponEdits({});
            alert("Cupons e sequências atualizados com sucesso!");
        } catch (error: any) {
            logger.error('Error saving coupons:', error);
            alert(`Erro ao salvar: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCouponChange = (partnerId: string, field: 'orderIndex' | 'coupon' | 'couponDescription', value: any) => {
        setCouponEdits(prev => {
            const existing = prev[partnerId] || { 
                orderIndex: partners.find(p => p.id === partnerId)?.orderIndex || 0,
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
        coupon: string, 
        couponDescription: string, 
        isAuthorized: boolean, 
        cashbackEnabled: boolean, 
        orderIndex: number, 
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
        coupon: '', 
        couponDescription: '', 
        isAuthorized: true, 
        cashbackEnabled: true, 
        orderIndex: 0, 
        displayId: 0 
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [bannerLinks, setBannerLinks] = useState<{[key: number]: string}>({
        1: commercialBanners.find(b => b.id === 1)?.linkUrl || '',
        3: commercialBanners.find(b => b.id === 3)?.linkUrl || '',
        4: commercialBanners.find(b => b.id === 4)?.linkUrl || ''
    });
    
    // About Us State
    const [aboutConfig, setAboutConfig] = useState<AboutConfig>({ id: 1, history: '', logoUrl: null });
    const [aboutLogoFile, setAboutLogoFile] = useState<File | null>(null);
    
    // Success Cases State
    const [successCases, setSuccessCases] = useState<SuccessCase[]>([]);
    const [caseFormData, setCaseFormData] = useState<{companyName: string, description: string, logoUrl: string, logoFile: File | null, storeImageUrl: string, storeFile: File | null}>({ companyName: '', description: '', logoUrl: '', logoFile: null, storeImageUrl: '', storeFile: null });
    const [editingCaseId, setEditingCaseId] = useState<string | null>(null);

    // Ranking State
    const [rankingData, setRankingData] = useState<any[]>([]);
    const [shareRankingData, setShareRankingData] = useState<any[]>([]);
    const [sharePeriod, setSharePeriod] = useState<'all' | 'month'>('all');
    const [clickRankingData, setClickRankingData] = useState<any[]>([]);
    const [clickPeriod, setClickPeriod] = useState<'all' | 'month'>('all');
    const [cashbackRankingData, setCashbackRankingData] = useState<any[]>([]);
    const [cashbackRankingPeriod, setCashbackRankingPeriod] = useState<'all' | 'month'>('all');
    const [cashbackConfigs, setCashbackConfigs] = useState<CashbackConfig[]>([]);
    const [cashbackLogs, setCashbackLogs] = useState<CashbackLog[]>([]);
    const [customerRankingData, setCustomerRankingData] = useState<any[]>([]);
    const [customerRankingPeriod, setCustomerRankingPeriod] = useState<'all' | 'month' | 'prev_month'>('all');

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

    useEffect(() => {
        fetchAdminData();
        if (activeTab === 'ranking') fetchRanking();
        if (activeTab === 'cashback') fetchCashbackConfigs();
    }, [activeTab, sharePeriod, clickPeriod, cashbackRankingPeriod, customerRankingPeriod]);

    useEffect(() => {
        if (!editingId && formData.displayId === 0 && partners.length > 0) {
            setFormData(prev => ({ ...prev, displayId: getNextAvailableDisplayId(partners) }));
        }
    }, [partners, editingId]);

    const fetchRanking = async () => {
        try {
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

            const { data: partnersData } = await supabase.from('partners').select('id, name, display_id');
            if (!partnersData) return;

            const ranking = await Promise.all(partnersData.map(async (p) => {
                const { count: monthCount } = await supabase
                    .from('partner_access_logs')
                    .select('*', { count: 'exact', head: true })
                    .eq('partner_id', p.id)
                    .gte('created_at', firstDayOfMonth);

                const { count: weekCount } = await supabase
                    .from('partner_access_logs')
                    .select('*', { count: 'exact', head: true })
                    .eq('partner_id', p.id)
                    .gte('created_at', sevenDaysAgo);

                return {
                    ...p,
                    monthCount: monthCount || 0,
                    weekCount: weekCount || 0
                };
            }));

            setRankingData(ranking.sort((a, b) => b.monthCount - a.monthCount).slice(0, 10));

            // Fetch Share Ranking
            const { data: shareRanking, error: shareError } = await supabase.rpc('get_partner_share_counts', { period: sharePeriod });
            if (shareError) throw shareError;
            setShareRankingData(shareRanking || []);

            // Fetch Click Ranking
            const { data: clickRanking, error: clickError } = await supabase.rpc('get_partner_click_counts', { period: clickPeriod });
            if (clickError) throw clickError;
            
            // Explicitly sort by total clicks (Instagram + WhatsApp) descending
            const sortedClickRanking = (clickRanking || []).sort((a: any, b: any) => {
                const totalA = Number(a.instagram_count || 0) + Number(a.whatsapp_count || 0);
                const totalB = Number(b.instagram_count || 0) + Number(b.whatsapp_count || 0);
                return totalB - totalA;
            });
            
            setClickRankingData(sortedClickRanking);

            // Fetch Customer Ranking (based on Unlocked Coupons)
            const { data: allUnlockedCoupons } = await supabase.from('unlocked_coupons').select('whatsapp, customer_name, created_at');
            if (allUnlockedCoupons) {
                const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

                const rankingMap: { [key: string]: { name: string, all: number, current: number, prev: number } } = {};

                allUnlockedCoupons.forEach(coupon => {
                    const couponDate = new Date(coupon.created_at);
                    if (!rankingMap[coupon.whatsapp]) {
                        rankingMap[coupon.whatsapp] = { name: coupon.customer_name || 'Sem Nome', all: 0, current: 0, prev: 0 };
                    }
                    
                    rankingMap[coupon.whatsapp].all++;
                    if (couponDate >= firstDayCurrentMonth) {
                        rankingMap[coupon.whatsapp].current++;
                    } else if (couponDate >= firstDayPrevMonth && couponDate <= lastDayPrevMonth) {
                        rankingMap[coupon.whatsapp].prev++;
                    }
                });

                const sortedCustomerRanking = Object.entries(rankingMap)
                    .map(([whatsapp, stats]) => ({
                        whatsapp,
                        name: stats.name,
                        count: customerRankingPeriod === 'all' ? stats.all : 
                               customerRankingPeriod === 'month' ? stats.current : stats.prev
                    }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 20);

                setCustomerRankingData(sortedCustomerRanking);
            }
        } catch (error) {
            logger.error('Error fetching ranking:', error);
        }
    };

    async function fetchCashbackConfigs() {
        try {
            const { data: configs } = await supabase.from('cashback_configs').select('*').order('id', { ascending: true });
            const { data: logs } = await supabase.from('cashback_logs').select('*').order('created_at', { ascending: false }).limit(50);
            if (configs) setCashbackConfigs(configs);
            if (logs) setCashbackLogs(logs);

            // Fetch Ranking
            let query = supabase.from('cashback_logs').select('store_name, cashback_value, created_at');
            
            if (cashbackRankingPeriod === 'month') {
                const now = new Date();
                const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                query = query.gte('created_at', firstDayOfMonth);
            }

            const { data: allLogs } = await query;
            
            if (allLogs) {
                const ranking: { [key: string]: number } = {};
                allLogs.forEach(log => {
                    ranking[log.store_name] = (ranking[log.store_name] || 0) + Number(log.cashback_value);
                });

                const sortedRanking = Object.entries(ranking)
                    .map(([name, total]) => ({ name, total }))
                    .sort((a, b) => b.total - a.total);

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
                    logoUrl: aboutRes.data.logo_url
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
                link: formData.link,
                whatsapp_link: formData.whatsappLink || null,
                coupon: formData.coupon || null,
                coupon_description: formData.couponDescription || null,
                is_authorized: formData.isAuthorized,
                cashback_enabled: formData.cashbackEnabled,
                order_index: formData.orderIndex,
                display_id: formData.displayId
            };

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
            coupon: '', 
            couponDescription: '', 
            isAuthorized: true, 
            cashbackEnabled: true, 
            orderIndex: 0, 
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
            coupon: partner.coupon || '',
            couponDescription: partner.couponDescription || '',
            isAuthorized: partner.isAuthorized,
            cashbackEnabled: partner.cashbackEnabled,
            orderIndex: partner.orderIndex,
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
            if ([1, 3, 4].includes(id)) upsertData.link_url = bannerLinks[id] || '';

            const { error: dbError } = await supabase
                .from('commercial_banner')
                .upsert(upsertData);

            if (dbError) throw dbError;

            if ([1, 3, 4].includes(id)) {
                const newBanner = { id: id, imageUrl: publicUrl, linkUrl: bannerLinks[id] || '' };
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
                .update({ link_url: bannerLinks[id] || '' })
                .eq('id', id);
            
            if (error) throw error;
            
            setCommercialBanners(prev => prev.map(b => b.id === id ? { ...b, linkUrl: bannerLinks[id] || '' } : b));
            alert("Link do banner atualizado!");
        } catch (error) {
            logger.error('Error updating banner link:', error);
            alert("Erro ao atualizar link.");
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
                logo_url: finalLogoUrl
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
        localStorage.removeItem('dev_bypass');
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
                            <Link to="/admin-mensagens" className="whitespace-nowrap px-2 sm:px-4 py-1.5 rounded-lg text-[9px] sm:text-xs font-bold transition-all text-slate-500 hover:text-slate-900 flex items-center">
                                <MessageSquare size={10} className="mr-1" />
                                Mensagens
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                            <input 
                                                type="checkbox" 
                                                id="isAuthorized" 
                                                className="w-5 h-5 accent-[#279267] cursor-pointer" 
                                                checked={formData.isAuthorized} 
                                                onChange={e => setFormData({...formData, isAuthorized: e.target.checked})} 
                                            />
                                            <label htmlFor="isAuthorized" className="text-sm font-bold text-slate-700 cursor-pointer">Divulgação autorizada</label>
                                        </div>
                                        <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                            <input 
                                                type="checkbox" 
                                                id="cashbackEnabled" 
                                                className="w-5 h-5 accent-[#279267] cursor-pointer" 
                                                checked={formData.cashbackEnabled} 
                                                onChange={e => setFormData({...formData, cashbackEnabled: e.target.checked})} 
                                            />
                                            <label htmlFor="cashbackEnabled" className="text-sm font-bold text-slate-700 cursor-pointer">Cashback Ativado</label>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
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
                                    <input required type="url" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#279267]" placeholder="Link do Instagram" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} />
                                    <input type="url" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#279267]" placeholder="Link do WhatsApp (wa.me/...)" value={formData.whatsappLink} onChange={e => setFormData({...formData, whatsappLink: e.target.value})} />
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
                    <div className="flex items-center space-x-3 mb-6 sm:mb-8 px-2 sm:px-0">
                        <div className="bg-amber-100 text-amber-600 p-2 sm:p-3 rounded-xl sm:rounded-2xl">
                            <Trophy size={20} className="sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-2xl font-black text-slate-900">Ranking de Parceiros</h2>
                            <p className="text-slate-500 text-[10px] sm:text-sm">Top 10 parceiros mais acessados no mês atual.</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
                        <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Posição</th>
                                    <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Parceiro</th>
                                    <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest text-center">ID QR</th>
                                    <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Mês</th>
                                    <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest text-center">7 dias</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rankingData.map((item, index) => (
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
                                                {item.monthCount}
                                            </span>
                                        </td>
                                        <td className="py-3 sm:py-4 px-2 sm:px-4 text-center text-slate-400 text-[10px] sm:text-sm font-medium">
                                            {item.weekCount}
                                        </td>
                                    </tr>
                                ))}
                                {rankingData.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-10 sm:py-20 text-center text-slate-400 font-bold text-xs sm:text-base">Nenhum dado de acesso registrado este mês.</td>
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
                            <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit">
                                <button 
                                    onClick={() => setSharePeriod('all')}
                                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${sharePeriod === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Tudo
                                </button>
                                <button 
                                    onClick={() => setSharePeriod('month')}
                                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${sharePeriod === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Mês
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
                                    {shareRankingData.map((item, index) => (
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
                                    ))}
                                    {shareRankingData.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="py-10 sm:py-20 text-center text-slate-400 font-bold text-xs sm:text-base">Nenhum compartilhamento registrado.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
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
                                        {customerRankingData.map((item, index) => (
                                            <tr key={item.whatsapp} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                                <td className="py-3 sm:py-4 px-2 sm:px-4">
                                                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-sm ${index === 0 ? 'bg-amber-400 text-white' : index === 1 ? 'bg-slate-300 text-white' : index === 2 ? 'bg-amber-600/50 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                        {index + 1}
                                                    </div>
                                                </td>
                                                <td className="py-3 sm:py-4 px-2 sm:px-4 font-bold text-slate-900 text-[11px] sm:text-base">{item.name}</td>
                                                <td className="py-3 sm:py-4 px-2 sm:px-4 text-slate-500 font-mono text-[10px] sm:text-sm">{item.whatsapp}</td>
                                                <td className="py-3 sm:py-4 px-2 sm:px-4 text-center">
                                                    <span className="bg-green-100 text-[#279267] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-sm font-bold">
                                                        {item.count}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {customerRankingData.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="py-10 sm:py-20 text-center text-slate-400 font-bold text-xs sm:text-base">Nenhum cupom liberado.</td>
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
                                <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit">
                                    <button 
                                        onClick={() => setClickPeriod('all')}
                                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${clickPeriod === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Tudo
                                    </button>
                                    <button 
                                        onClick={() => setClickPeriod('month')}
                                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${clickPeriod === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Mês
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
                                            <th className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clickRankingData.map((item, index) => (
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
                                                    <span className="bg-purple-100 text-purple-600 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-sm font-black">
                                                        {Number(item.instagram_count) + Number(item.whatsapp_count)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {clickRankingData.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-10 sm:py-20 text-center text-slate-400 font-bold text-xs sm:text-base">Nenhum clique registrado.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
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
                            <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit">
                                <button 
                                    onClick={() => setCashbackRankingPeriod('all')}
                                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${cashbackRankingPeriod === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Tudo
                                </button>
                                <button 
                                    onClick={() => setCashbackRankingPeriod('month')}
                                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${cashbackRankingPeriod === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Mês
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
                                    {cashbackRankingData.map((item, index) => (
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
                                    ))}
                                    {cashbackRankingData.length === 0 && (
                                        <tr>
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
                                    {cashbackLogs.map((log) => (
                                        <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                            <td className="py-3 sm:py-4 px-2 sm:px-4 text-[10px] sm:text-sm text-slate-500">
                                                {new Date(log.created_at).toLocaleString('pt-BR')}
                                            </td>
                                            <td className="py-3 sm:py-4 px-2 sm:px-4 font-bold text-slate-900 text-[11px] sm:text-base">{log.store_name}</td>
                                            <td className="py-3 sm:py-4 px-2 sm:px-4 text-[10px] sm:text-sm font-bold text-[#279267]">{log.whatsapp}</td>
                                            <td className="py-3 sm:py-4 px-2 sm:px-4">
                                                <span className="text-[#279267] font-black text-[11px] sm:text-base">R$ {log.cashback_value.toFixed(2)}</span>
                                            </td>
                                            <td className="py-3 sm:py-4 px-2 sm:px-4 text-[9px] sm:text-xs font-mono text-slate-400">{log.ip_address}</td>
                                        </tr>
                                    ))}
                                    {cashbackLogs.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-10 sm:py-20 text-center text-slate-400 font-bold text-xs sm:text-base">Nenhum log registrado.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
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
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Sequência</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-48">Código do Cupom</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/3">Descrição do Benefício</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {partners.map((partner) => {
                                    const currentEdit = couponEdits[partner.id] || {
                                        orderIndex: partner.orderIndex,
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
                                })}
                                {partners.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center text-slate-400 font-bold">Nenhum parceiro cadastrado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
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
    const [partners, setPartners] = useState<Partner[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [commercialBanners, setCommercialBanners] = useState<CommercialBannerData[]>([]);
    const [headerLogo, setHeaderLogo] = useState<string | null>(null);
    const [featuredPartner, setFeaturedPartner] = useState<Partner | null>(null);
    const [featuredCoupons, setFeaturedCoupons] = useState<FeaturedCoupon[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

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
            const [partnersRes, categoriesRes, bannerRes, featuredCouponsRes] = await Promise.all([
                supabase.from('partners').select('*').order('order_index', { ascending: true }),
                supabase.from('categories').select('*').order('name', { ascending: true }),
                supabase.from('commercial_banner').select('*').in('id', [1, 2, 3, 4]),
                supabase.from('featured_coupons').select('*').order('slot_id', { ascending: true })
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
                    coupon: p.coupon,
                    couponDescription: p.coupon_description,
                    isAuthorized: p.is_authorized ?? true,
                    cashbackEnabled: p.cashback_enabled ?? true,
                    orderIndex: p.order_index ?? 0,
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

            if (bannerRes.data) {
                const carouselBanners = bannerRes.data
                    .filter(b => [1, 3, 4].includes(b.id))
                    .map(b => ({
                        id: b.id,
                        imageUrl: b.image_url,
                        linkUrl: b.link_url
                    }))
                    .sort((a, b) => {
                        // Maintain order: 1, 3, 4
                        const order = { 1: 0, 3: 1, 4: 2 };
                        return (order[a.id as keyof typeof order] || 0) - (order[b.id as keyof typeof order] || 0);
                    });
                
                setCommercialBanners(carouselBanners);
                
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

    return (
        <GoogleReCaptchaProvider 
            reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
            language="pt-BR"
        >
            <Router>
                <AnalyticsTracker />
                <ScrollToTop />
                <div className="min-h-screen flex flex-col bg-gray-50 pt-20 md:pt-24 overflow-x-hidden">
                    <Header headerLogo={headerLogo} />
                    <CommercialBanner position="top" />
                    <Routes>
                        <Route path="/" element={<LandingPage partners={partners} categories={categories} commercialBanners={commercialBanners} featuredPartner={featuredPartner} featuredCoupons={featuredCoupons} headerLogo={headerLogo} />} />
                        <Route path="/sobre-nos" element={<AboutUsPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/politica-de-privacidade" element={<PrivacyPolicyPage />} />
                        <Route path="/termos-de-uso" element={<TermsOfUsePage />} />
                        <Route path="/admin" element={
                            <ProtectedRoute>
                                <AdminPage partners={partners} setPartners={setPartners} categories={categories} setCategories={setCategories} commercialBanners={commercialBanners} setCommercialBanners={setCommercialBanners} headerLogo={headerLogo} setHeaderLogo={setHeaderLogo} featuredCoupons={featuredCoupons} setFeaturedCoupons={setFeaturedCoupons} />
                            </ProtectedRoute>
                        } />
                        <Route path="/admin-mensagens" element={
                            <ProtectedRoute>
                                <AdminMessagesPage />
                            </ProtectedRoute>
                        } />
                        <Route path="*" element={<LandingPage partners={partners} categories={categories} commercialBanners={commercialBanners} featuredPartner={featuredPartner} featuredCoupons={featuredCoupons} headerLogo={headerLogo} />} />
                    </Routes>
                    <Footer logoUrl={headerLogo} />
                    <CommercialBanner position="bottom" />
                </div>
            </Router>
        </GoogleReCaptchaProvider>
    );
};

export default App;
