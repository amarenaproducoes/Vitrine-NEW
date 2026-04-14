import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, Calendar, Globe, AlertTriangle, Trash2, Filter, LogOut, Settings, MessageSquare } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { logger } from '../lib/logger';

interface SecurityLog {
    id: string;
    created_at: string;
    event_type: string;
    severity: string;
    ip_address: string;
    user_agent: string;
    path: string;
    details: any;
}

const SecurityLogsPage = () => {
    const [logs, setLogs] = useState<SecurityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<string>('Todos');
    const navigate = useNavigate();

    const eventTypes = ['Todos', 'unauthorized_access', 'failed_password', 'successful_login', 'blocked_bot', 'rls_violation', 'admin_access'];

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const { data, error } = await supabase
                .from('security_logs')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                setLogs(data);
            }
        } catch (error: any) {
            logger.error('Error fetching security logs:', error);
            setErrorMsg(error.message || JSON.stringify(error));
        } finally {
            setLoading(false);
        }
    };

    const clearLogs = async () => {
        if (!window.confirm('Tem certeza que deseja limpar todos os logs de segurança?')) return;

        try {
            const { error } = await supabase
                .from('security_logs')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

            if (error) throw error;
            setLogs([]);
            alert('Logs limpos com sucesso.');
        } catch (error: any) {
            logger.error('Error clearing logs:', error);
            alert('Erro ao limpar logs: ' + error.message);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-600 text-white';
            case 'high': return 'bg-red-100 text-red-700 border-red-200';
            case 'medium': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getEventLabel = (type: string) => {
        switch (type) {
            case 'unauthorized_access': return 'Acesso Não Autorizado';
            case 'failed_password': return 'Senha Incorreta';
            case 'successful_login': return 'Login com Sucesso';
            case 'blocked_bot': return 'Bot Bloqueado';
            case 'rls_violation': return 'Violação de RLS';
            case 'admin_access': return 'Acesso Admin';
            default: return type;
        }
    };

    const filteredLogs = activeFilter === 'Todos' 
        ? logs 
        : logs.filter(log => log.event_type === activeFilter);

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
                        <Shield size={32} />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900">
                        Logs de Segurança
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={clearLogs}
                        className="flex items-center justify-center space-x-2 px-6 py-3 bg-white text-red-500 font-bold rounded-xl hover:bg-red-50 transition-all border border-red-100"
                    >
                        <Trash2 size={20} />
                        <span>Limpar Logs</span>
                    </button>
                    <Link 
                        to="/admin"
                        className="flex items-center justify-center space-x-2 px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all border border-slate-200"
                    >
                        <Settings size={20} />
                        <span>Painel</span>
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
                        <Filter size={16} className="mr-2" /> Filtrar Evento:
                    </div>
                    {eventTypes.map(type => (
                        <button 
                            key={type} 
                            onClick={() => setActiveFilter(type)} 
                            className={`px-5 py-2 rounded-full text-xs font-bold transition-all border capitalize ${
                                activeFilter === type 
                                    ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20' 
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-900/20 hover:text-slate-900'
                            }`}
                        >
                            {type === 'Todos' ? 'Todos' : getEventLabel(type)}
                        </button>
                    ))}
                </div>
            </section>

            {errorMsg && (
                <div className="mb-8 bg-red-50 p-4 rounded-2xl border border-red-200 text-red-700">
                    <h3 className="font-bold mb-2">Erro ao carregar logs:</h3>
                    <p className="font-mono text-sm">{errorMsg}</p>
                </div>
            )}

            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                {filteredLogs.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm uppercase tracking-wider">
                                    <th className="p-4 font-bold">Data/Hora</th>
                                    <th className="p-4 font-bold">Evento</th>
                                    <th className="p-4 font-bold">Gravidade</th>
                                    <th className="p-4 font-bold">Página/Caminho</th>
                                    <th className="p-4 font-bold">IP/Dispositivo</th>
                                    <th className="p-4 font-bold">Detalhes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 text-slate-600 text-sm whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Calendar size={14} className="mr-2 text-slate-400" />
                                                {new Date(log.created_at).toLocaleString('pt-BR')}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center font-bold text-slate-900">
                                                {log.event_type === 'failed_password' || log.event_type === 'unauthorized_access' ? (
                                                    <AlertTriangle size={14} className="mr-2 text-orange-500" />
                                                ) : (
                                                    <Shield size={14} className="mr-2 text-blue-500" />
                                                )}
                                                {getEventLabel(log.event_type)}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getSeverityColor(log.severity)}`}>
                                                {log.severity}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-600 text-sm font-mono">
                                            {log.path}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-slate-900 font-bold text-xs flex items-center">
                                                    <Globe size={12} className="mr-1 text-slate-400" />
                                                    {log.ip_address || 'IP Oculto'}
                                                </span>
                                                <span className="text-slate-400 text-[10px] truncate max-w-[150px]" title={log.user_agent}>
                                                    {log.user_agent}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-600 text-xs italic">
                                            {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-50 rounded-full mb-4">
                            <Shield className="text-slate-300 w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhum log encontrado</h3>
                        <p className="text-slate-500">
                            O sistema está seguro. Nenhuma atividade suspeita registrada.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SecurityLogsPage;
