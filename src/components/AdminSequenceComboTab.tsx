import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Plus, Search, CheckCircle2, AlertCircle, Edit2, Trash2, 
  Phone, User, Filter, RefreshCw, ShieldCheck, ToggleLeft, ToggleRight, List
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Partner, SequenceComboPartner, SequenceComboCoupon, SequenceComboLead } from '../types';

interface AdminSequenceComboTabProps {
  partners: Partner[];
}

interface FilteredCustomerResult {
  id: string;
  name: string;
  whatsapp: string;
  is_member: boolean;
  created_at: string;
  source: 'Cliente Cadastrado' | 'Lead da Promoção';
}

export const AdminSequenceComboTab: React.FC<AdminSequenceComboTabProps> = ({ partners }) => {
  // Sub-tab selection: 'config' | 'filter' | 'coupons'
  const [subTab, setSubTab] = useState<'config' | 'filter' | 'coupons'>('config');

  // 1. Config State (Participating Partners)
  const [comboPartners, setComboPartners] = useState<SequenceComboPartner[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Modal Form State
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [formPartnerId, setFormPartnerId] = useState<string>('');
  const [formSequencePattern, setFormSequencePattern] = useState<string>('22');
  const [formBenefit, setFormBenefit] = useState<string>('22% de desconto no combo especial');
  const [formProductName, setFormProductName] = useState<string>('Combo Fit Especial');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [savingConfig, setSavingConfig] = useState(false);

  // 2. Sequence Search/Filter State
  // IMPORTANT: Sequence search starts completely BLANK!
  const [sequenceFilter, setSequenceFilter] = useState<string>('');
  const [filterResults, setFilterResults] = useState<FilteredCustomerResult[]>([]);
  const [loadingFilter, setLoadingFilter] = useState(false);

  // 3. Coupons & Leads Monitoring State
  const [couponsList, setCouponsList] = useState<SequenceComboCoupon[]>([]);
  const [leadsList, setLeadsList] = useState<SequenceComboLead[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'awaiting_friend' | 'unlocked'>('all');

  // Load participating partners
  const fetchComboPartners = async () => {
    setLoadingConfig(true);
    try {
      const { data, error } = await supabase
        .from('sequence_combo_partners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sequence combo partners:', error);
      } else {
        setComboPartners(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch combo partners', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  // Load coupons & leads
  const fetchCouponsAndLeads = async () => {
    setLoadingCoupons(true);
    try {
      const [couponsRes, leadsRes] = await Promise.all([
        supabase.from('sequence_combo_coupons').select('*').order('created_at', { ascending: false }),
        supabase.from('sequence_combo_leads').select('*').order('created_at', { ascending: false })
      ]);

      if (couponsRes.data) setCouponsList(couponsRes.data);
      if (leadsRes.data) setLeadsList(leadsRes.data);
    } catch (err) {
      console.error('Failed to fetch coupons/leads', err);
    } finally {
      setLoadingCoupons(false);
    }
  };

  useEffect(() => {
    fetchComboPartners();
    fetchCouponsAndLeads();
  }, []);

  // Handle sequence filter search
  // CRITICAL REQUIREMENT: Table is BLANK until user types digit sequence in search!
  useEffect(() => {
    const cleanPattern = sequenceFilter.replace(/\D/g, '');
    if (cleanPattern.length < 1) {
      setFilterResults([]);
      return;
    }

    const runSequenceSearch = async () => {
      setLoadingFilter(true);
      try {
        // Query customers
        const { data: customersData } = await supabase
          .from('customers')
          .select('id, name, whatsapp, created_at');

        // Query leads
        const { data: leadsData } = await supabase
          .from('sequence_combo_leads')
          .select('id, friend_whatsapp, friend_first_name, is_registered_member, created_at');

        const results: FilteredCustomerResult[] = [];

        if (customersData) {
          customersData.forEach(c => {
            if (c.whatsapp && c.whatsapp.includes(cleanPattern)) {
              results.push({
                id: `c_${c.id || c.whatsapp}`,
                name: c.name || 'Cliente Cadastrado',
                whatsapp: c.whatsapp,
                is_member: true,
                created_at: c.created_at || '',
                source: 'Cliente Cadastrado'
              });
            }
          });
        }

        if (leadsData) {
          leadsData.forEach(l => {
            if (l.friend_whatsapp && l.friend_whatsapp.includes(cleanPattern)) {
              // avoid duplicate if already in customers
              const existsInCustomers = results.some(r => r.whatsapp === l.friend_whatsapp);
              if (!existsInCustomers) {
                results.push({
                  id: `l_${l.id}`,
                  name: l.friend_first_name || 'Lead Convidado',
                  whatsapp: l.friend_whatsapp,
                  is_member: Boolean(l.is_registered_member),
                  created_at: l.created_at || '',
                  source: 'Lead da Promoção'
                });
              }
            }
          });
        }

        setFilterResults(results);
      } catch (err) {
        console.error('Error executing sequence filter search:', err);
      } finally {
        setLoadingFilter(false);
      }
    };

    const timer = setTimeout(runSequenceSearch, 300);
    return () => clearTimeout(timer);
  }, [sequenceFilter]);

  // Open add/edit modal
  const handleOpenAddModal = (comboP?: SequenceComboPartner) => {
    if (comboP) {
      setEditingPartnerId(comboP.id);
      setFormPartnerId(comboP.partner_id);
      setFormSequencePattern(comboP.sequence_pattern || '22');
      setFormBenefit(comboP.benefit_description);
      setFormProductName(comboP.product_name || '');
      setFormIsActive(comboP.is_active);
    } else {
      setEditingPartnerId(null);
      setFormPartnerId(partners[0]?.id || '');
      setFormSequencePattern('22');
      setFormBenefit('22% de desconto no combo especial');
      setFormProductName('Combo Fit');
      setFormIsActive(true);
    }
    setShowAddModal(true);
  };

  // Save combo partner config
  const handleSavePartnerConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPartnerId) {
      alert('Selecione um parceiro.');
      return;
    }

    const selectedPartnerObj = partners.find(p => p.id === formPartnerId);
    const partnerName = selectedPartnerObj ? selectedPartnerObj.name : 'Parceiro';

    setSavingConfig(true);
    try {
      const payload = {
        partner_id: formPartnerId,
        partner_name: partnerName,
        sequence_pattern: formSequencePattern.trim() || '22',
        benefit_description: formBenefit.trim(),
        product_name: formProductName.trim(),
        is_active: formIsActive,
        updated_at: new Date().toISOString()
      };

      if (editingPartnerId) {
        await supabase
          .from('sequence_combo_partners')
          .update(payload)
          .eq('id', editingPartnerId);
      } else {
        await supabase
          .from('sequence_combo_partners')
          .insert(payload);
      }

      setShowAddModal(false);
      fetchComboPartners();
    } catch (err) {
      console.error('Error saving combo partner config:', err);
      alert('Erro ao salvar configuração.');
    } finally {
      setSavingConfig(false);
    }
  };

  // Toggle active state
  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await supabase
        .from('sequence_combo_partners')
        .update({ is_active: !currentActive })
        .eq('id', id);
      fetchComboPartners();
    } catch (err) {
      console.error('Error toggling active state:', err);
    }
  };

  // Delete combo partner
  const handleDeleteComboPartner = async (id: string) => {
    if (!confirm('Deseja realmente remover este parceiro da promoção?')) return;
    try {
      await supabase
        .from('sequence_combo_partners')
        .delete()
        .eq('id', id);
      fetchComboPartners();
    } catch (err) {
      console.error('Error deleting combo partner:', err);
    }
  };

  // Filtered coupons
  const filteredCoupons = couponsList.filter(c => {
    if (statusFilter === 'all') return true;
    return c.status === statusFilter;
  });

  return (
    <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100 mb-8 sm:mb-12">
      {/* Tab Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" /> <span>Promoção de Sequência de Celular</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">Gestão da Ação de Combinação de Números</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Configure parceiros participantes, benefícios, filtre cadastrados por sequência de dígitos e monitore os cupons liberados.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center space-x-2 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Parceiro na Ação</span>
          </button>
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <div className="flex bg-slate-100 p-1 rounded-xl mb-6 max-w-md">
        <button
          onClick={() => setSubTab('config')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            subTab === 'config' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Parceiros Participantes ({comboPartners.length})
        </button>
        <button
          onClick={() => setSubTab('filter')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            subTab === 'filter' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Filtro de Sequência 🔍
        </button>
        <button
          onClick={() => setSubTab('coupons')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            subTab === 'coupons' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Cupons e Leads ({couponsList.length})
        </button>
      </div>

      {/* SUB-TAB 1: CONFIGURATION OF PARTICIPATING PARTNERS */}
      {subTab === 'config' && (
        <div className="space-y-4">
          {loadingConfig ? (
            <div className="py-12 text-center text-slate-400 font-bold">Carregando parceiros da ação...</div>
          ) : comboPartners.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="p-3.5">Parceiro</th>
                    <th className="p-3.5 text-center">Sequência Exigida</th>
                    <th className="p-3.5">Descrição do Benefício</th>
                    <th className="p-3.5">Produto / Oferta</th>
                    <th className="p-3.5 text-center">Ativo na Ação</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {comboPartners.map((cp) => (
                    <tr key={cp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">{cp.partner_name}</td>
                      <td className="p-3.5 text-center font-mono font-black text-emerald-600">{cp.sequence_pattern || '22'}</td>
                      <td className="p-3.5 text-slate-700">{cp.benefit_description}</td>
                      <td className="p-3.5 text-slate-500">{cp.product_name || '-'}</td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleActive(cp.id, cp.is_active)}
                          className="text-slate-600 hover:text-slate-900 transition-colors"
                        >
                          {cp.is_active ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              🟢 Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
                              ⚪ Inativo
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleOpenAddModal(cp)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteComboPartner(cp.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
              <p className="font-bold text-slate-600 text-base mb-1">Nenhum parceiro configurado para esta ação.</p>
              <p className="text-xs text-slate-400 mb-4">Clique no botão abaixo para adicionar empresas participantes e os benefícios oferecidos.</p>
              <button
                onClick={() => handleOpenAddModal()}
                className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs"
              >
                + Configurar Primeiro Parceiro
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: DIGIT SEQUENCE FILTER / LOOKUP */}
      {subTab === 'filter' && (
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Search className="w-4 h-4 text-emerald-600" />
              <span>Buscar Clientes/Leads por Sequência do Celular</span>
            </h3>
            <p className="text-xs text-slate-500">
              Digite os dígitos de combinação (ex: <strong className="text-emerald-700 font-bold">22</strong> ou <strong className="text-emerald-700 font-bold">7</strong>) no campo abaixo para filtrar todos os cadastrados cujo número contenha essa sequência.
            </p>
            <div className="relative max-w-md">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={sequenceFilter}
                onChange={(e) => setSequenceFilter(e.target.value)}
                placeholder="Digite a sequência (ex: 22)"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-600 font-mono font-bold"
              />
            </div>
          </div>

          {/* Table displaying results */}
          {sequenceFilter.trim().length === 0 ? (
            <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
              <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-600 text-sm">Digite uma sequência no campo acima para exibir a lista de clientes.</p>
              <p className="text-xs text-slate-400">A tabela é mantida vazia até que uma sequência seja pesquisada.</p>
            </div>
          ) : loadingFilter ? (
            <div className="py-12 text-center text-slate-400 font-bold">Buscando cadastrados com a sequência &quot;{sequenceFilter}&quot;...</div>
          ) : filterResults.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="p-3.5">Nome</th>
                    <th className="p-3.5">WhatsApp / Celular</th>
                    <th className="p-3.5 text-center">Selo de Membro</th>
                    <th className="p-3.5">Origem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filterResults.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">{item.name}</td>
                      <td className="p-3.5 font-mono text-emerald-700 font-bold">{item.whatsapp}</td>
                      <td className="p-3.5 text-center">
                        {item.is_member ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            🟢 Membro Oficial
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            🟡 Lead (Não Cadastrado)
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-xs text-slate-500">{item.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 font-bold">
              Nenhum cliente ou lead encontrado com a sequência &quot;{sequenceFilter}&quot;.
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: COUPONS & LEADS MONITORING */}
      {subTab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-600 uppercase">Filtrar por Status:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border'
                }`}
              >
                Todos ({couponsList.length})
              </button>
              <button
                onClick={() => setStatusFilter('awaiting_friend')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  statusFilter === 'awaiting_friend' ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border'
                }`}
              >
                🟡 Aguardando 2ª Etapa
              </button>
              <button
                onClick={() => setStatusFilter('unlocked')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  statusFilter === 'unlocked' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border'
                }`}
              >
                🟢 Desbloqueado
              </button>
            </div>
          </div>

          {loadingCoupons ? (
            <div className="py-12 text-center text-slate-400 font-bold">Carregando cupons e leads...</div>
          ) : filteredCoupons.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="p-3">Iniciador</th>
                    <th className="p-3">Amigo Convidado</th>
                    <th className="p-3">Parceiro & Benefício</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Código do Cupom</th>
                    <th className="p-3">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCoupons.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{c.initiator_name || 'Iniciador'}</div>
                        <div className="font-mono text-xs text-slate-500">{c.initiator_whatsapp}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{c.friend_first_name || c.friend_full_name || '-'}</div>
                        <div className="font-mono text-xs text-slate-500">{c.friend_whatsapp || '-'}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-emerald-700">{c.partner_name}</div>
                        <div className="text-xs text-slate-500 truncate max-w-xs">{c.benefit_description}</div>
                      </td>
                      <td className="p-3 text-center">
                        {c.status === 'unlocked' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            🟢 Desbloqueado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                            🟡 Aguardando Amigo
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-800">
                        {c.coupon_code}
                      </td>
                      <td className="p-3 text-xs text-slate-400">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-2xl">
              Nenhum cupom encontrado para os filtros selecionados.
            </div>
          )}
        </div>
      )}

      {/* ADD / EDIT PARTNER CONFIG MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5">
            <h3 className="text-lg font-black text-slate-900">
              {editingPartnerId ? 'Editar Parceiro na Promoção' : 'Adicionar Parceiro na Promoção'}
            </h3>

            <form onSubmit={handleSavePartnerConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Selecione o Parceiro:
                </label>
                <select
                  value={formPartnerId}
                  onChange={(e) => setFormPartnerId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-emerald-600 font-bold"
                  required
                >
                  <option value="">-- Selecione --</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sequência Padrão Exigida no Celular (ex: 22):
                </label>
                <input
                  type="text"
                  value={formSequencePattern}
                  onChange={(e) => setFormSequencePattern(e.target.value)}
                  placeholder="Ex: 22"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 px-3 text-sm font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descrição do Benefício (ex: 22% OFF no Combo Gourmet):
                </label>
                <input
                  type="text"
                  value={formBenefit}
                  onChange={(e) => setFormBenefit(e.target.value)}
                  placeholder="Ex: 22% de desconto no Combo Especial"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 px-3 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome do Produto / Oferta (opcional):
                </label>
                <input
                  type="text"
                  value={formProductName}
                  onChange={(e) => setFormProductName(e.target.value)}
                  placeholder="Ex: Marmita Fit Congelada"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 px-3 text-sm"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Ativo na promoção
                </label>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  {savingConfig ? 'Salvando...' : 'Salvar Parceiro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
