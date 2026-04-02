/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Link, useNavigate } from 'react-router-dom';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import DOMPurify from 'dompurify';
import { 
    Store, Car, Megaphone, Sparkles, ChevronRight, Plus, Trash2, 
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
        "✨ APAREÇA AÍ POR AQUI • O MELHOR ESPAÇO PUBLICITÁRIO DA REGIÃO",
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

const LandingPage = ({ partners, categories, commercialBanner, featuredPartner }: { partners: Partner[], categories: Category[], commercialBanner: CommercialBannerData | null, featuredPartner: Partner | null }) => {
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

    const handleWin = async (value: number, whatsapp: string) => {
        if (!roulettePartner) return;
        try {
            const ip = await getUserIP();
            await supabase.from('cashback_logs').insert({
                store_name: roulettePartner.name,
                cashback_value: value,
                whatsapp: whatsapp,
                ip_address: ip
            });
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
            {commercialBanner && (
                <div className="w-full block bg-slate-900 border-b border-slate-800">
                    {commercialBanner.linkUrl ? (
                        <a href={commercialBanner.linkUrl} target="_blank" rel="noopener noreferrer" className="block">
                            <img src={commercialBanner.imageUrl} alt="Banner Publicitário" className="w-full h-auto block" />
                        </a>
                    ) : (
                        <img src={commercialBanner.imageUrl} alt="Banner Publicitário" className="w-full h-auto block" />
                    )}
                </div>
            )}
            <section id="vitrine" className="relative overflow-hidden bg-slate-900 pt-16 pb-24 md:pt-24 md:pb-32">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-[#279267]/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#c54b4b]/10 rounded-full blur-[120px]"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center space-x-2 bg-slate-800/50 backdrop-blur-sm px-4 py-2 rounded-full text-[#279267] text-xs font-bold uppercase tracking-widest mb-8 border border-slate-700/50"><Sparkles size={14} /><span>Sua marca em todo lugar</span></div>
                    <h1 className="text-4xl md:text-7xl font-black text-white mb-6 leading-tight">Vitrine <span className="text-[#279267] italic">Exclusiva</span></h1>
                    <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium">Confira abaixo nossos parceiros que já estão brilhando nas telas do nosso circuito de divulgação.</p>
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

            <section className="py-20 bg-gray-50">
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
                        <div className="mt-16 p-6 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl overflow-hidden">
                            <div className="flex items-center space-x-4 w-full md:w-auto">
                                <div className="bg-amber-400 p-3 rounded-2xl shadow-lg shadow-amber-400/20 flex-shrink-0">
                                    <Trophy className="text-white w-6 h-6" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-white font-black uppercase tracking-tight text-xs sm:text-sm">Parceiro da Semana</h4>
                                    <p className="text-[9px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest">O mais acessado nos últimos 7 dias</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4 bg-slate-800/50 p-3 rounded-2xl border border-slate-700 w-full md:w-auto md:pr-6 min-w-0">
                                <img src={featuredPartner.imageUrl} alt={featuredPartner.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-white font-bold truncate">{featuredPartner.name}</p>
                                    <p className="text-[#279267] text-[10px] font-black uppercase tracking-widest truncate">{featuredPartner.category}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <section id="anuncie" className="py-24 bg-white border-t border-slate-100">
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

            <section id="parceria" className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
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

            <section id="contato" className="py-24 bg-white border-t border-slate-100">
                <div className="max-w-3xl mx-auto px-4">
                    <LeadForm type="contato" title="Fale Conosco" subtitle="Dúvidas, sugestões ou suporte? Estamos prontos para te atender via WhatsApp." />
                </div>
            </section>
        </main>
    );
};

const AdminPage = ({ partners, setPartners, categories, setCategories, commercialBanner, setCommercialBanner, headerLogo, setHeaderLogo }: { partners: Partner[], setPartners: React.Dispatch<React.SetStateAction<Partner[]>>, categories: Category[], setCategories: React.Dispatch<React.SetStateAction<Category[]>>, commercialBanner: CommercialBannerData | null, setCommercialBanner: React.Dispatch<React.SetStateAction<CommercialBannerData | null>>, headerLogo: string | null, setHeaderLogo: React.Dispatch<React.SetStateAction<string | null>> }) => {
    const [activeTab, setActiveTab] = useState<'partners' | 'about' | 'cases' | 'ranking' | 'cashback'>('partners');
    const navigate = useNavigate();
    
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
    const [bannerLink, setBannerLink] = useState(commercialBanner?.linkUrl || '');
    
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

    const [newCategoryName, setNewCategoryName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{type: 'partner' | 'category' | 'banner' | 'case', id: string} | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const aboutLogoInputRef = useRef<HTMLInputElement>(null);
    const caseLogoInputRef = useRef<HTMLInputElement>(null);
    const caseStoreInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (commercialBanner?.linkUrl) {
            setBannerLink(commercialBanner.linkUrl);
        }
    }, [commercialBanner]);

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
    }, [activeTab, sharePeriod, clickPeriod, cashbackRankingPeriod]);

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
        } catch (error) {
            logger.error('Error fetching ranking:', error);
        }
    };

    const fetchCashbackConfigs = async () => {
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
    };

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

            if (editingId) {
                const { data, error } = await supabase
                    .from('partners')
                    .update(partnerData)
                    .eq('id', editingId)
                    .select()
                    .single();

                if (error) throw error;
                
                setPartners(prev => prev.map(p => p.id === editingId ? { 
                    ...formData, 
                    imageUrl: finalImageUrl, 
                    images: partnerData.images,
                    videoUrl: partnerData.video_url || '',
                    id: editingId, 
                    displayId: data.display_id 
                } : p).sort((a, b) => a.orderIndex - b.orderIndex));
                alert("Parceiro atualizado com sucesso!");
            } else {
                const { data, error } = await supabase
                    .from('partners')
                    .insert([partnerData])
                    .select()
                    .single();

                if (error) throw error;
                
                const newPartner: Partner = { 
                    ...formData, 
                    imageUrl: finalImageUrl, 
                    images: partnerData.images,
                    videoUrl: partnerData.video_url || '',
                    id: data.id, 
                    displayId: data.display_id 
                };
                setPartners(prev => [newPartner, ...prev].sort((a, b) => a.orderIndex - b.orderIndex));
                alert("Parceiro adicionado com sucesso!");
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
                if (error) throw error;
                setPartners(partners.filter(p => p.id !== deleteConfirm.id)); 
                if (editingId === deleteConfirm.id) resetForm();
            } catch (error) {
                logger.error('Error deleting partner:', error);
            }
        } else if (deleteConfirm.type === 'category') {
            try {
                const { error } = await supabase.from('categories').delete().eq('id', deleteConfirm.id);
                if (error) throw error;
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
                    
                if (error) throw error;
                
                if (deleteConfirm.id === '1') {
                    setCommercialBanner(null);
                    setBannerLink('');
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
            if (id === 1) upsertData.link_url = bannerLink;

            const { error: dbError } = await supabase
                .from('commercial_banner')
                .upsert(upsertData);

            if (dbError) throw dbError;

            if (id === 1) {
                setCommercialBanner({ id: 1, imageUrl: publicUrl, linkUrl: bannerLink });
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

    const handleUpdateBannerLink = async () => {
        if (!commercialBanner) return;
        try {
            const { error } = await supabase
                .from('commercial_banner')
                .update({ link_url: bannerLink })
                .eq('id', 1);
            
            if (error) throw error;
            
            setCommercialBanner({ ...commercialBanner, linkUrl: bannerLink });
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
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-16 overflow-x-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                <div className="flex items-center space-x-3">
                    <div className="bg-slate-900 text-white p-2 sm:p-3 rounded-2xl shadow-xl flex-shrink-0">
                        <Plus size={24} className="sm:w-8 sm:h-8" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight">
                        Painel de Controle
                    </h1>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto no-scrollbar whitespace-nowrap w-full sm:w-auto">
                        <button onClick={() => setActiveTab('partners')} className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex-shrink-0 ${activeTab === 'partners' ? 'bg-[#279267] text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}>Parceiros</button>
                        <button onClick={() => setActiveTab('about')} className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex-shrink-0 ${activeTab === 'about' ? 'bg-[#279267] text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}>Sobre Nós</button>
                        <button onClick={() => setActiveTab('cases')} className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex-shrink-0 ${activeTab === 'cases' ? 'bg-[#279267] text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}>Cases</button>
                        <button onClick={() => setActiveTab('ranking')} className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex-shrink-0 ${activeTab === 'ranking' ? 'bg-[#279267] text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}>Ranking</button>
                        <button onClick={() => setActiveTab('cashback')} className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex-shrink-0 ${activeTab === 'cashback' ? 'bg-[#279267] text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}>Cashback</button>
                        <Link to="/admin-mensagens" className="px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex-shrink-0 text-slate-500 hover:text-slate-900 flex items-center">
                            <MessageSquare size={14} className="mr-2" />
                            Mensagens
                        </Link>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-500/10 text-red-500 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20 text-sm"
                    >
                        <LogOut size={18} />
                        <span>Sair</span>
                    </button>
                </div>
            </div>

            {activeTab === 'partners' && (
                <>
                    <div className="bg-white p-4 sm:p-8 rounded-3xl shadow-xl border border-slate-100 mb-12">
                        <h2 className="text-2xl font-black text-slate-900 mb-4">Logotipo do Cabeçalho</h2>
                        <p className="text-slate-500 mb-6">Adicione o logotipo que será exibido no cabeçalho do site. Apenas 1 imagem é permitida por vez.</p>
                        
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

                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 mb-12">
                        <h2 className="text-2xl font-black text-slate-900 mb-4">Banner Publicitário Principal</h2>
                        <p className="text-slate-500 mb-6">Adicione um banner de destaque que será exibido logo abaixo da faixa vermelha na página inicial. Apenas 1 imagem é permitida por vez.</p>
                        
                        {commercialBanner ? (
                            <div className="space-y-6">
                                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex justify-center">
                                    <img src={commercialBanner.imageUrl} alt="Banner Atual" className="max-w-full h-auto rounded-lg shadow-sm" style={{ maxHeight: '150px' }} />
                                </div>
                                <div className="flex flex-col space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Link do Banner:</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="url" 
                                            placeholder="https://exemplo.com" 
                                            className="flex-grow px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#279267]"
                                            value={bannerLink}
                                            onChange={(e) => setBannerLink(e.target.value)}
                                        />
                                        <button 
                                            onClick={handleUpdateBannerLink}
                                            className="px-4 py-2 bg-[#279267] text-white font-bold rounded-xl hover:bg-[#1e7250] transition-colors text-sm"
                                        >
                                            Salvar Link
                                        </button>
                                    </div>
                                </div>
                                <button onClick={() => handleRemoveBanner(1)} className="px-6 py-3 bg-[#c54b4b] text-white font-bold rounded-xl hover:bg-red-700 transition-colors w-full">
                                    Remover Banner Atual
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex flex-col space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Link do Banner (Opcional):</label>
                                    <input 
                                        type="url" 
                                        placeholder="https://exemplo.com" 
                                        className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#279267]"
                                        value={bannerLink}
                                        onChange={(e) => setBannerLink(e.target.value)}
                                    />
                                </div>
                                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                                    <input type="file" accept="image/*" onChange={(e) => handleUploadBanner(e, 1)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                                    <p className="text-slate-600 font-medium">Clique ou arraste uma imagem aqui</p>
                                    <p className="text-[#c54b4b] font-bold mt-2 text-sm">Formato obrigatório: 2275 x 563 Pixels</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-1">
                            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 sticky top-28">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-black flex items-center text-[#279267]">
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
                                            className="relative cursor-pointer group border-2 border-dashed border-slate-200 rounded-xl overflow-hidden aspect-[9/16] bg-slate-50 flex flex-col items-center justify-center transition-all hover:border-[#279267] hover:bg-green-50"
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
                                                        className="relative cursor-pointer group border-2 border-dashed border-slate-200 rounded-xl overflow-hidden aspect-[9/16] bg-slate-50 flex flex-col items-center justify-center transition-all hover:border-[#279267] hover:bg-green-50"
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
                                            <h4 className="font-bold text-slate-900 truncate">{p.name}</h4>
                                            <p className="text-[10px] font-black text-[#279267] uppercase">{p.category}</p>
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
                                    containerProps={{ style: { minHeight: '300px', border: 'none' } }}
                                >
                                    <Toolbar>
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

            {activeTab === 'ranking' && (
                <div className="bg-white p-4 sm:p-8 rounded-3xl shadow-xl border border-slate-100">
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="bg-amber-100 text-amber-600 p-3 rounded-2xl">
                            <Trophy size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">Ranking de Parceiros</h2>
                            <p className="text-slate-500 text-sm">Top 10 parceiros mais acessados no mês atual.</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Posição</th>
                                    <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Parceiro</th>
                                    <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">ID QR Code</th>
                                    <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Acessos (Mês)</th>
                                    <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Acessos (7 dias)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rankingData.map((item, index) => (
                                    <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="py-4 px-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-amber-400 text-white' : index === 1 ? 'bg-slate-300 text-white' : index === 2 ? 'bg-amber-600/50 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                {index + 1}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 font-bold text-slate-900">{item.name}</td>
                                        <td className="py-4 px-4 text-center font-mono text-slate-500">{item.display_id || '-'}</td>
                                        <td className="py-4 px-4 text-center">
                                            <span className="bg-green-100 text-[#279267] px-3 py-1 rounded-full text-sm font-bold">
                                                {item.monthCount}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-center text-slate-400 text-sm font-medium">
                                            {item.weekCount}
                                        </td>
                                    </tr>
                                ))}
                                {rankingData.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center text-slate-400 font-bold">Nenhum dado de acesso registrado este mês.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-12 pt-12 border-t border-slate-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div className="flex items-center space-x-3">
                                <div className="bg-blue-100 text-blue-600 p-3 rounded-2xl">
                                    <Share2 size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900">Ranking de Compartilhamentos</h2>
                                    <p className="text-slate-500 text-sm">Somatório de compartilhamentos por parceiro.</p>
                                </div>
                            </div>
                            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                                <button 
                                    onClick={() => setSharePeriod('all')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${sharePeriod === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Todo o Período
                                </button>
                                <button 
                                    onClick={() => setSharePeriod('month')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${sharePeriod === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Mês Atual
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Posição</th>
                                        <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Parceiro</th>
                                        <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Total de Compartilhamentos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shareRankingData.map((item, index) => (
                                        <tr key={item.partner_id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                            <td className="py-4 px-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-amber-400 text-white' : index === 1 ? 'bg-slate-300 text-white' : index === 2 ? 'bg-amber-600/50 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 font-bold text-slate-900">{item.partner_name}</td>
                                            <td className="py-4 px-4 text-center">
                                                <span className="bg-blue-100 text-blue-600 px-4 py-1.5 rounded-full text-sm font-black">
                                                    {item.share_count}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {shareRankingData.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="py-20 text-center text-slate-400 font-bold">Nenhum compartilhamento registrado no período selecionado.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-12 pt-12 border-t border-slate-100">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-purple-100 text-purple-600 p-3 rounded-2xl">
                                        <MousePointerClick size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900">Ranking de Cliques</h2>
                                        <p className="text-slate-500 text-sm">Somatório de cliques (Instagram e WhatsApp) por parceiro.</p>
                                    </div>
                                </div>
                                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                                    <button 
                                        onClick={() => setClickPeriod('all')}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${clickPeriod === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Todo o Período
                                    </button>
                                    <button 
                                        onClick={() => setClickPeriod('month')}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${clickPeriod === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Mês Atual
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Posição</th>
                                            <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Parceiro</th>
                                            <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Instagram</th>
                                            <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">WhatsApp</th>
                                            <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clickRankingData.map((item, index) => (
                                            <tr key={item.partner_id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                                <td className="py-4 px-4">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-amber-400 text-white' : index === 1 ? 'bg-slate-300 text-white' : index === 2 ? 'bg-amber-600/50 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                        {index + 1}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 font-bold text-slate-900">{item.partner_name}</td>
                                                <td className="py-4 px-4 text-center">
                                                    <span className="text-slate-600 font-bold">{item.instagram_count}</span>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <span className="text-slate-600 font-bold">{item.whatsapp_count}</span>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <span className="bg-purple-100 text-purple-600 px-4 py-1.5 rounded-full text-sm font-black">
                                                        {Number(item.instagram_count) + Number(item.whatsapp_count)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {clickRankingData.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-20 text-center text-slate-400 font-bold">Nenhum clique registrado no período selecionado.</td>
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
                <div className="space-y-8">
                    <div className="bg-white p-4 sm:p-8 rounded-3xl shadow-xl border border-slate-100">
                        <div className="flex items-center space-x-3 mb-8">
                            <div className="bg-green-100 text-[#279267] p-3 rounded-2xl">
                                <Settings size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">Configuração de Cashback</h2>
                                <p className="text-slate-500 text-sm">Defina os valores e as probabilidades da roleta.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {cashbackConfigs.map((config) => (
                                <div key={config.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Opção {config.id}</span>
                                        <div className="bg-white p-2 rounded-lg shadow-sm">
                                            <DollarSign size={16} className="text-[#279267]" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Rótulo (Ex: R$ 5,00)</label>
                                        <input 
                                            type="text"
                                            value={config.label}
                                            onChange={(e) => handleUpdateCashbackConfig(config.id, 'label', e.target.value)}
                                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#279267] outline-none font-bold text-slate-900"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Valor Numérico</label>
                                        <input 
                                            type="number"
                                            value={config.value}
                                            onChange={(e) => handleUpdateCashbackConfig(config.id, 'value', parseFloat(e.target.value))}
                                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#279267] outline-none font-bold text-slate-900"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Probabilidade (%)</label>
                                        <input 
                                            type="number"
                                            value={config.probability}
                                            onChange={(e) => handleUpdateCashbackConfig(config.id, 'probability', parseFloat(e.target.value))}
                                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#279267] outline-none font-bold text-slate-900"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start space-x-3 text-amber-700 text-xs">
                            <Info size={16} className="shrink-0 mt-0.5" />
                            <p><strong>Dica:</strong> A soma das probabilidades não precisa ser exatamente 100%. O sistema utiliza pesos relativos para determinar o vencedor.</p>
                        </div>
                    </div>

                    <div className="bg-white p-4 sm:p-8 rounded-3xl shadow-xl border border-slate-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div className="flex items-center space-x-3">
                                <div className="bg-amber-100 text-amber-600 p-3 rounded-2xl">
                                    <Trophy size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900">Ranking de Cashback</h2>
                                    <p className="text-slate-500 text-sm">Somatório de valores ganhos por parceiro.</p>
                                </div>
                            </div>
                            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                                <button 
                                    onClick={() => setCashbackRankingPeriod('all')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${cashbackRankingPeriod === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Todo o Período
                                </button>
                                <button 
                                    onClick={() => setCashbackRankingPeriod('month')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${cashbackRankingPeriod === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Mês Atual
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Posição</th>
                                        <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Parceiro</th>
                                        <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Total Cashback</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cashbackRankingData.map((item, index) => (
                                        <tr key={item.name} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                            <td className="py-4 px-4">
                                                <span className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-black ${
                                                    index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                                                    index === 1 ? 'bg-slate-200 text-slate-700' : 
                                                    index === 2 ? 'bg-amber-100 text-amber-700' : 
                                                    'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {index + 1}º
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 font-bold text-slate-900">{item.name}</td>
                                            <td className="py-4 px-4 text-right">
                                                <span className="text-[#279267] font-black">R$ {item.total.toFixed(2)}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {cashbackRankingData.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="py-20 text-center text-slate-400 font-bold">Nenhum cashback registrado no período selecionado.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white p-4 sm:p-8 rounded-3xl shadow-xl border border-slate-100">
                        <div className="flex items-center space-x-3 mb-8">
                            <div className="bg-slate-100 text-slate-600 p-3 rounded-2xl">
                                <History size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">Logs de Cashback</h2>
                                <p className="text-slate-500 text-sm">Histórico recente de prêmios concedidos.</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Data/Hora</th>
                                        <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Loja</th>
                                        <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">WhatsApp</th>
                                        <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Valor</th>
                                        <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">IP do Cliente</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cashbackLogs.map((log) => (
                                        <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                            <td className="py-4 px-4 text-sm text-slate-500">
                                                {new Date(log.created_at).toLocaleString('pt-BR')}
                                            </td>
                                            <td className="py-4 px-4 font-bold text-slate-900">{log.store_name}</td>
                                            <td className="py-4 px-4 text-sm font-bold text-[#279267]">{log.whatsapp}</td>
                                            <td className="py-4 px-4">
                                                <span className="text-[#279267] font-black">R$ {log.cashback_value.toFixed(2)}</span>
                                            </td>
                                            <td className="py-4 px-4 text-xs font-mono text-slate-400">{log.ip_address}</td>
                                        </tr>
                                    ))}
                                    {cashbackLogs.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center text-slate-400 font-bold">Nenhum log de cashback registrado ainda.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
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
    const [partners, setPartners] = useState<Partner[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [commercialBanner, setCommercialBanner] = useState<CommercialBannerData | null>(null);
    const [headerLogo, setHeaderLogo] = useState<string | null>(null);
    const [featuredPartner, setFeaturedPartner] = useState<Partner | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [partnersRes, categoriesRes, bannerRes] = await Promise.all([
                supabase.from('partners').select('*').order('order_index', { ascending: true }),
                supabase.from('categories').select('*').order('name', { ascending: true }),
                supabase.from('commercial_banner').select('*').in('id', [1, 2])
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

                // Fetch featured partner (most accesses in last 7 days)
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
                    const topPartner = mappedPartners.find(p => p.id === topPartnerId);
                    if (topPartner) setFeaturedPartner(topPartner);
                }
            }

            if (categoriesRes.data) {
                setCategories(categoriesRes.data);
            }

            if (bannerRes.data) {
                const mainBanner = bannerRes.data.find(b => b.id === 1);
                const logoBanner = bannerRes.data.find(b => b.id === 2);
                if (mainBanner) {
                    setCommercialBanner({
                        id: 1,
                        imageUrl: mainBanner.image_url,
                        linkUrl: mainBanner.link_url
                    });
                }
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
                <ScrollToTop />
                <div className="min-h-screen flex flex-col bg-gray-50 pt-20 md:pt-24 overflow-x-hidden">
                    <Header headerLogo={headerLogo} />
                    <CommercialBanner position="top" />
                    <Routes>
                        <Route path="/" element={<LandingPage partners={partners} categories={categories} commercialBanner={commercialBanner} featuredPartner={featuredPartner} />} />
                        <Route path="/sobre-nos" element={<AboutUsPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/politica-de-privacidade" element={<PrivacyPolicyPage />} />
                        <Route path="/termos-de-uso" element={<TermsOfUsePage />} />
                        <Route path="/admin" element={
                            <ProtectedRoute>
                                <AdminPage partners={partners} setPartners={setPartners} categories={categories} setCategories={setCategories} commercialBanner={commercialBanner} setCommercialBanner={setCommercialBanner} headerLogo={headerLogo} setHeaderLogo={setHeaderLogo} />
                            </ProtectedRoute>
                        } />
                        <Route path="/admin-mensagens" element={
                            <ProtectedRoute>
                                <AdminMessagesPage />
                            </ProtectedRoute>
                        } />
                        <Route path="*" element={<LandingPage partners={partners} categories={categories} commercialBanner={commercialBanner} featuredPartner={featuredPartner} />} />
                    </Routes>
                    <Footer />
                    <CommercialBanner position="bottom" />
                </div>
            </Router>
        </GoogleReCaptchaProvider>
    );
};

export default App;
