/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import { 
    Store, Car, Megaphone, Sparkles, ChevronRight, Plus, Trash2, 
    Filter, Info, ArrowRight, Zap, Edit2, Upload, X
} from 'lucide-react';

import Header from './components/Header';
import Footer from './components/Footer';
import PartnerCard from './components/PartnerCard';
import LeadForm from './components/LeadForm';
import AdminMessagesPage from './components/AdminMessagesPage';
import AboutUsPage from './components/AboutUsPage';
import { CATEGORIES } from './constants';
import { Partner, Category, SuccessCase, AboutConfig } from './types';
import { supabase } from './lib/supabase';
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

const LandingPage = ({ partners, categories, commercialBanner }: { partners: Partner[], categories: Category[], commercialBanner: string | null }) => {
    const [activeCategory, setActiveCategory] = useState("Todos");
    const authorizedPartners = partners.filter(p => p.isAuthorized).sort((a, b) => a.orderIndex - b.orderIndex);
    const filteredPartners = activeCategory === "Todos" ? authorizedPartners : authorizedPartners.filter(p => p.category === activeCategory);
    
    return (
        <main className="flex-grow">
            {commercialBanner && (
                <div className="w-full block bg-slate-900 border-b border-slate-800">
                    <img src={commercialBanner} alt="Banner Publicitário" className="w-full h-auto block" />
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

            <section className="sticky top-20 z-40 bg-white border-b border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center space-x-2 whitespace-nowrap">
                    <div className="flex items-center text-slate-400 mr-4 font-bold text-sm uppercase tracking-wider"><Filter size={16} className="mr-2" /> Filtrar:</div>
                    {['Todos', ...categories.map(c => c.name)].map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2 rounded-full text-xs font-bold transition-all border ${activeCategory === cat ? 'bg-[#279267] border-[#279267] text-white shadow-lg shadow-[#279267]/20' : 'bg-white border-slate-200 text-slate-500 hover:border-[#279267]/20 hover:text-[#279267]'}`}>{cat}</button>
                    ))}
                </div>
            </section>

            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredPartners.length > 0 ? filteredPartners.map((partner) => (<PartnerCard key={partner.id} partner={partner} />)) : (
                            <div className="col-span-full py-20 text-center">
                                <div className="text-slate-300 mb-4 flex justify-center"><Store size={64} strokeWidth={1} /></div>
                                <h3 className="text-xl font-bold text-slate-400">Nenhum parceiro nesta categoria ainda.</h3>
                                <a href="#anuncie" className="text-[#279267] font-bold mt-2 inline-block hover:underline">Seja o primeiro a anunciar aqui!</a>
                            </div>
                        )}
                    </div>
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

const AdminPage = ({ partners, setPartners, categories, setCategories, commercialBanner, setCommercialBanner }: { partners: Partner[], setPartners: React.Dispatch<React.SetStateAction<Partner[]>>, categories: Category[], setCategories: React.Dispatch<React.SetStateAction<Category[]>>, commercialBanner: string | null, setCommercialBanner: React.Dispatch<React.SetStateAction<string | null>> }) => {
    const [activeTab, setActiveTab] = useState<'partners' | 'about' | 'cases'>('partners');
    
    // Partner Form State
    const [formData, setFormData] = useState<{name: string, category: string, activity: string, description: string, address: string, imageUrl: string, imageFile: File | null, link: string, whatsappLink: string, coupon: string, couponDescription: string, isAuthorized: boolean, orderIndex: number}>({ name: '', category: categories.length > 0 ? categories[0].name : '', activity: '', description: '', address: '', imageUrl: '', imageFile: null, link: '', whatsappLink: '', coupon: '', couponDescription: '', isAuthorized: true, orderIndex: 0 });
    const [editingId, setEditingId] = useState<string | null>(null);
    
    // About Us State
    const [aboutConfig, setAboutConfig] = useState<AboutConfig>({ id: 1, history: '', logoUrl: null });
    const [aboutLogoFile, setAboutLogoFile] = useState<File | null>(null);
    
    // Success Cases State
    const [successCases, setSuccessCases] = useState<SuccessCase[]>([]);
    const [caseFormData, setCaseFormData] = useState<{companyName: string, description: string, logoUrl: string, logoFile: File | null, storeImageUrl: string, storeFile: File | null}>({ companyName: '', description: '', logoUrl: '', logoFile: null, storeImageUrl: '', storeFile: null });
    const [editingCaseId, setEditingCaseId] = useState<string | null>(null);

    const [newCategoryName, setNewCategoryName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{type: 'partner' | 'category' | 'banner' | 'case', id: string} | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const aboutLogoInputRef = useRef<HTMLInputElement>(null);
    const caseLogoInputRef = useRef<HTMLInputElement>(null);
    const caseStoreInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            const [aboutRes, casesRes] = await Promise.all([
                supabase.from('about_config').select('*').eq('id', 1).maybeSingle(),
                supabase.from('success_cases').select('*').order('created_at', { ascending: false })
            ]);

            if (aboutRes.data) {
                setAboutConfig({
                    id: aboutRes.data.id,
                    history: aboutRes.data.history,
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
            console.error('Error fetching admin data:', error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setFormData(prev => ({ ...prev, imageUrl: previewUrl, imageFile: file }));
        }
    };

    const handleAddOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.imageUrl && !formData.imageFile) {
            alert("Por favor, selecione uma imagem para o parceiro.");
            return;
        }

        setIsSubmitting(true);

        try {
            let finalImageUrl = formData.imageUrl;

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
                    console.error('Upload error:', uploadError);
                    throw new Error('Erro ao fazer upload da imagem. Verifique se o bucket "partners" existe e é público.');
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('partners')
                    .getPublicUrl(fileName);

                finalImageUrl = publicUrl;
            }

            if (editingId) {
                const { error } = await supabase
                    .from('partners')
                    .update({
                        name: formData.name,
                        category: formData.category,
                        activity: formData.activity,
                        description: formData.description,
                        address: formData.address,
                        image_url: finalImageUrl,
                        link: formData.link,
                        whatsapp_link: formData.whatsappLink || null,
                        coupon: formData.coupon || null,
                        coupon_description: formData.couponDescription || null,
                        is_authorized: formData.isAuthorized,
                        order_index: formData.orderIndex
                    })
                    .eq('id', editingId);

                if (error) throw error;
                
                setPartners(prev => prev.map(p => p.id === editingId ? { ...formData, imageUrl: finalImageUrl, id: editingId } : p).sort((a, b) => a.orderIndex - b.orderIndex));
                alert("Parceiro atualizado com sucesso!");
            } else {
                const { data, error } = await supabase
                    .from('partners')
                    .insert([{
                        name: formData.name,
                        category: formData.category,
                        activity: formData.activity,
                        description: formData.description,
                        address: formData.address,
                        image_url: finalImageUrl,
                        link: formData.link,
                        whatsapp_link: formData.whatsappLink || null,
                        coupon: formData.coupon || null,
                        coupon_description: formData.couponDescription || null,
                        is_authorized: formData.isAuthorized,
                        order_index: formData.orderIndex
                    }])
                    .select()
                    .single();

                if (error) throw error;
                
                const newPartner: Partner = { ...formData, imageUrl: finalImageUrl, id: data.id };
                setPartners(prev => [newPartner, ...prev].sort((a, b) => a.orderIndex - b.orderIndex));
                alert("Parceiro adicionado com sucesso!");
            }
            resetForm();
        } catch (error: any) {
            console.error('Error saving partner:', error);
            alert(error.message || 'Erro ao salvar parceiro. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', category: categories.length > 0 ? categories[0].name : '', activity: '', description: '', address: '', imageUrl: '', imageFile: null, link: '', whatsappLink: '', coupon: '', couponDescription: '', isAuthorized: true, orderIndex: 0 });
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
            link: partner.link,
            whatsappLink: partner.whatsappLink || '',
            coupon: partner.coupon || '',
            couponDescription: partner.couponDescription || '',
            isAuthorized: partner.isAuthorized,
            orderIndex: partner.orderIndex
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
            console.error('Error adding category:', error);
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
                console.error('Error deleting partner:', error);
            }
        } else if (deleteConfirm.type === 'category') {
            try {
                const { error } = await supabase.from('categories').delete().eq('id', deleteConfirm.id);
                if (error) throw error;
                setCategories(categories.filter(c => c.id !== deleteConfirm.id));
            } catch (error) {
                console.error('Error deleting category:', error);
            }
        } else if (deleteConfirm.type === 'banner') {
            try {
                const { error } = await supabase
                    .from('commercial_banner')
                    .delete()
                    .eq('id', 1);
                    
                if (error) throw error;
                
                setCommercialBanner(null);
            } catch (error) {
                console.error('Error removing banner:', error);
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
                console.error('Error deleting success case:', error);
            }
        }
        setDeleteConfirm(null);
    };

    const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `banners/banner_${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('partners')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                throw new Error('Erro ao fazer upload do banner. Verifique se o bucket "partners" existe.');
            }

            const { data: { publicUrl } } = supabase.storage
                .from('partners')
                .getPublicUrl(fileName);

            const { error: dbError } = await supabase
                .from('commercial_banner')
                .upsert({ id: 1, image_url: publicUrl });

            if (dbError) throw dbError;

            setCommercialBanner(publicUrl);
            alert("Banner atualizado com sucesso!");
        } catch (error: any) {
            console.error('Error uploading banner:', error);
            alert(error.message || 'Erro ao salvar banner. Tente novamente.');
        }
    };

    const handleRemoveBanner = () => {
        setDeleteConfirm({ type: 'banner', id: '1' });
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
                history: aboutConfig.history,
                logo_url: finalLogoUrl
            });
            if (error) throw error;
            setAboutConfig(prev => ({ ...prev!, logoUrl: finalLogoUrl }));
            setAboutLogoFile(null);
            alert("Configurações de 'Sobre Nós' atualizadas!");
        } catch (error) {
            console.error('Error updating about:', error);
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
            console.error('Error saving case:', error);
            alert('Erro ao salvar case.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                <div className="flex items-center space-x-3">
                    <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl">
                        <Plus size={32} />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900">
                        Painel de Controle
                    </h1>
                </div>
                
                <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
                    <button onClick={() => setActiveTab('partners')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'partners' ? 'bg-[#279267] text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}>Parceiros</button>
                    <button onClick={() => setActiveTab('about')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'about' ? 'bg-[#279267] text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}>Sobre Nós</button>
                    <button onClick={() => setActiveTab('cases')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'cases' ? 'bg-[#279267] text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}>Cases</button>
                </div>
            </div>

            {activeTab === 'partners' && (
                <>
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 mb-12">
                        <h2 className="text-2xl font-black text-slate-900 mb-4">Banner Publicitário Principal</h2>
                        <p className="text-slate-500 mb-6">Adicione um banner de destaque que será exibido logo abaixo da faixa vermelha na página inicial. Apenas 1 imagem é permitida por vez.</p>
                        
                        {commercialBanner ? (
                            <div className="space-y-4">
                                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex justify-center">
                                    <img src={commercialBanner} alt="Banner Atual" className="max-w-full h-auto rounded-lg shadow-sm" style={{ maxHeight: '150px' }} />
                                </div>
                                <button onClick={handleRemoveBanner} className="px-6 py-3 bg-[#c54b4b] text-white font-bold rounded-xl hover:bg-red-700 transition-colors">
                                    Remover Banner Atual
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                                    <input type="file" accept="image/*" onChange={handleUploadBanner} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
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
                                    <div className="grid grid-cols-2 gap-4">
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
                                    
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Foto do Anunciante</label>
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="relative cursor-pointer group border-2 border-dashed border-slate-200 rounded-xl overflow-hidden aspect-video bg-slate-50 flex flex-col items-center justify-center transition-all hover:border-[#279267] hover:bg-green-50"
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
                                    <div key={p.id} className={`bg-white p-4 rounded-2xl shadow-sm border transition-all flex items-center space-x-4 ${editingId === p.id ? 'border-[#279267] ring-2 ring-green-100 ring-offset-2' : 'border-slate-100'}`}>
                                        <img src={p.imageUrl} alt={p.name} referrerPolicy="no-referrer" className="w-16 h-16 rounded-xl object-cover shadow-inner bg-white" />
                                        <div className="flex-grow min-w-0">
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
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
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
                        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 sticky top-28">
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
                            <div key={item.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-6">
                                <img src={item.storeImageUrl} className="w-32 h-24 rounded-2xl object-cover" />
                                <div className="flex-grow">
                                    <h4 className="font-black text-slate-900 text-lg">{item.companyName}</h4>
                                    <p className="text-slate-500 text-sm line-clamp-2">{item.description}</p>
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

            {deleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Confirmar Exclusão</h3>
                        <p className="text-slate-600 mb-6">
                            Tem certeza que deseja remover {deleteConfirm.type === 'partner' ? 'este parceiro' : deleteConfirm.type === 'category' ? 'esta categoria' : deleteConfirm.type === 'banner' ? 'o banner atual' : 'este case de sucesso'}? Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex space-x-3">
                            <button 
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={async () => {
                                    if (deleteConfirm.type === 'case') {
                                        try {
                                            await supabase.from('success_cases').delete().eq('id', deleteConfirm.id);
                                            setSuccessCases(successCases.filter(c => c.id !== deleteConfirm.id));
                                        } catch (error) { console.error(error); }
                                        setDeleteConfirm(null);
                                    } else {
                                        executeDelete();
                                    }
                                }}
                                className="flex-1 px-4 py-2 bg-[#c54b4b] text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
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
    const [commercialBanner, setCommercialBanner] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [partnersRes, categoriesRes, bannerRes] = await Promise.all([
                supabase.from('partners').select('*').order('order_index', { ascending: true }),
                supabase.from('categories').select('*').order('name', { ascending: true }),
                supabase.from('commercial_banner').select('*').eq('id', 1).maybeSingle()
            ]);

            if (partnersRes.error) throw partnersRes.error;
            if (categoriesRes.error) throw categoriesRes.error;

            if (partnersRes.data) {
                const formattedPartners: Partner[] = partnersRes.data.map(p => ({
                    id: p.id,
                    name: p.name,
                    category: p.category,
                    activity: p.activity,
                    description: p.description,
                    address: p.address,
                    imageUrl: p.image_url,
                    link: p.link,
                    whatsappLink: p.whatsapp_link,
                    coupon: p.coupon,
                    couponDescription: p.coupon_description,
                    isAuthorized: p.is_authorized ?? true,
                    orderIndex: p.order_index ?? 0
                }));
                setPartners(formattedPartners);
            }

            if (categoriesRes.data) {
                setCategories(categoriesRes.data);
            }

            if (bannerRes.data) {
                setCommercialBanner(bannerRes.data.image_url);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
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
        <Router>
            <ScrollToTop />
            <div className="min-h-screen flex flex-col bg-gray-50 pt-20">
                <Header />
                <CommercialBanner position="top" />
                <Routes>
                    <Route path="/" element={<LandingPage partners={partners} categories={categories} commercialBanner={commercialBanner} />} />
                    <Route path="/sobre-nos" element={<AboutUsPage />} />
                    <Route path="/admin" element={<AdminPage partners={partners} setPartners={setPartners} categories={categories} setCategories={setCategories} commercialBanner={commercialBanner} setCommercialBanner={setCommercialBanner} />} />
                    <Route path="/admin-mensagens" element={<AdminMessagesPage />} />
                    <Route path="*" element={<LandingPage partners={partners} categories={categories} commercialBanner={commercialBanner} />} />
                </Routes>
                <Footer />
                <CommercialBanner position="bottom" />
            </div>
        </Router>
    );
};

export default App;
