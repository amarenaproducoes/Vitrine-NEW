import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Lead } from '../types';
import { Filter, MessageSquare, Calendar, User, Phone, Tag, CheckSquare, Square, LogOut, Settings } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const AdminMessagesPage = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<string>('Todos');
    const navigate = useNavigate();

    const leadTypes = ['Todos', 'anunciante', 'motorista', 'comerciante', 'contato'];

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const formattedLeads: Lead[] = data.map(l => ({
                    id: l.id,
                    fullName: l.full_name,
                    whatsapp: l.whatsapp,
                    type: l.type,
                    message: l.message,
                    created_at: l.created_at,
                    contacted: l.contacted,
                    ip_address: l.ip_address
                }));
                setLeads(formattedLeads);
            }
        } catch (error) {
            console.error('Error fetching leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleContacted = async (id: string, currentStatus: boolean | undefined) => {
        try {
            const newStatus = !currentStatus;
            
            // Optimistic update
            setLeads(leads.map(lead => 
                lead.id === id ? { ...lead, contacted: newStatus } : lead
            ));

            const { error } = await supabase
                .from('leads')
                .update({ contacted: newStatus })
                .eq('id', id);

            if (error) {
                // Revert on error
                setLeads(leads.map(lead => 
                    lead.id === id ? { ...lead, contacted: currentStatus } : lead
                ));
                throw error;
            }
        } catch (error) {
            console.error('Error updating lead status:', error);
            alert('Erro ao atualizar o status do contato.');
        }
    };

    const filteredLeads = activeFilter === 'Todos' 
        ? leads 
        : leads.filter(lead => lead.type === activeFilter);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-12 h-12 border-4 border-[#279267] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-16 flex-grow w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                <div className="flex items-center space-x-3">
                    <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl">
                        <MessageSquare size={32} />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900">
                        Mensagens e Leads
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <Link 
                        to="/admin"
                        className="flex items-center justify-center space-x-2 px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all border border-slate-200"
                    >
                        <Settings size={20} />
                        <span>Painel de Controle</span>
                    </Link>
                    <button 
                        onClick={handleLogout}
                        className="flex items-center justify-center space-x-2 px-6 py-3 bg-red-500/10 text-red-500 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                    >
                        <LogOut size={20} />
                        <span>Sair</span>
                    </button>
                </div>
            </div>

            <section className="mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto no-scrollbar">
                <div className="flex items-center space-x-2 whitespace-nowrap">
                    <div className="flex items-center text-slate-400 mr-4 font-bold text-sm uppercase tracking-wider">
                        <Filter size={16} className="mr-2" /> Tipo de Contato:
                    </div>
                    {leadTypes.map(type => (
                        <button 
                            key={type} 
                            onClick={() => setActiveFilter(type)} 
                            className={`px-5 py-2 rounded-full text-xs font-bold transition-all border capitalize ${
                                activeFilter === type 
                                    ? 'bg-[#279267] border-[#279267] text-white shadow-lg shadow-[#279267]/20' 
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-[#279267]/20 hover:text-[#279267]'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </section>

            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                {filteredLeads.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm uppercase tracking-wider">
                                    <th className="p-4 font-bold">Data</th>
                                    <th className="p-4 font-bold">Nome</th>
                                    <th className="p-4 font-bold">WhatsApp</th>
                                    <th className="p-4 font-bold">Tipo</th>
                                    <th className="p-4 font-bold">IP</th>
                                    <th className="p-4 font-bold">Mensagem / Empresa</th>
                                    <th className="p-4 font-bold text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredLeads.map((lead) => (
                                    <tr key={lead.id} className={`hover:bg-slate-50/50 transition-colors ${lead.contacted ? 'bg-green-50/30' : ''}`}>
                                        <td className="p-4 text-slate-600 text-sm whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Calendar size={14} className="mr-2 text-slate-400" />
                                                {new Date(lead.created_at).toLocaleDateString('pt-BR', {
                                                    day: '2-digit', month: '2-digit', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </div>
                                        </td>
                                        <td className="p-4 font-bold text-slate-900">
                                            <div className="flex items-center">
                                                <User size={14} className="mr-2 text-slate-400" />
                                                {lead.fullName}
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-600">
                                            <a 
                                                href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, '')}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center text-[#279267] hover:underline font-medium"
                                            >
                                                <Phone size={14} className="mr-2" />
                                                {lead.whatsapp}
                                            </a>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 capitalize border border-slate-200">
                                                <Tag size={12} className="mr-1" />
                                                {lead.type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-500 text-[10px] font-mono">
                                            {lead.ip_address || '-'}
                                        </td>
                                        <td className="p-4 text-slate-600 text-sm max-w-xs truncate" title={lead.message || '-'}>
                                            {lead.message || <span className="text-slate-400 italic">Sem mensagem</span>}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button 
                                                onClick={() => toggleContacted(lead.id, lead.contacted)}
                                                className={`inline-flex items-center justify-center p-2 rounded-lg transition-colors ${
                                                    lead.contacted 
                                                        ? 'text-[#279267] bg-green-100 hover:bg-green-200' 
                                                        : 'text-slate-400 bg-slate-100 hover:bg-slate-200 hover:text-slate-600'
                                                }`}
                                                title={lead.contacted ? "Marcar como não contatado" : "Marcar como contatado"}
                                            >
                                                {lead.contacted ? <CheckSquare size={20} /> : <Square size={20} />}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-50 rounded-full mb-4">
                            <MessageSquare className="text-slate-300 w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhuma mensagem encontrada</h3>
                        <p className="text-slate-500">
                            {activeFilter === 'Todos' 
                                ? 'Ainda não há mensagens ou leads cadastrados no sistema.' 
                                : `Nenhuma mensagem do tipo "${activeFilter}" foi encontrada.`}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminMessagesPage;
