import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getUserIP } from '../lib/ip';

interface LeadFormProps {
  type: 'anunciante' | 'motorista' | 'comerciante' | 'contato';
  title: string;
  subtitle: string;
}

const formatWhatsApp = (value: string) => {
  const v = value.replace(/\D/g, '').slice(0, 11);
  if (v.length >= 3 && v.length <= 7) {
    return `(${v.slice(0, 2)}) ${v.slice(2)}`;
  } else if (v.length > 7) {
    return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
  } else if (v.length > 0) {
    return `(${v}`;
  }
  return '';
};

const LeadForm: React.FC<LeadFormProps> = ({ type, title, subtitle }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({ fullName: '', whatsapp: '', message: '' });

  const isWhatsAppValid = formData.whatsapp.replace(/\D/g, '').length === 11;
  let isFormValid = formData.fullName.trim().length > 0 && isWhatsAppValid;
  
  if (type === 'anunciante' || type === 'comerciante') {
    isFormValid = isFormValid && formData.message.trim().length > 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    try {
      const ip = await getUserIP();
      const { error } = await supabase
        .from('leads')
        .insert([
          {
            full_name: formData.fullName,
            whatsapp: formData.whatsapp,
            type: type,
            message: formData.message || null,
            ip_address: ip
          }
        ]);

      if (error) throw error;

      setStatus('success');
      setFormData({ fullName: '', whatsapp: '', message: '' });
    } catch (error) {
      console.error('Error saving lead:', error);
      setStatus('error');
      alert('Ocorreu um erro ao enviar seus dados. Tente novamente.');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-green-100 text-center animate-in zoom-in duration-300">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <CheckCircle2 className="text-[#279267] w-10 h-10" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Solicitação Enviada!</h3>
        <p className="text-slate-600">
          Recebemos seus dados. Nossa equipe entrará em contato via WhatsApp em breve.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
      <h2 className="text-2xl font-extrabold text-slate-900 mb-2">{title}</h2>
      <p className="text-slate-500 mb-8">{subtitle}</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {(type === 'anunciante' || type === 'comerciante') && (
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
              Nome da Empresa
            </label>
            <input
              required
              type="text"
              className="w-full px-4 py-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-[#279267]/20 focus:border-[#279267] outline-none transition-all text-slate-900 bg-slate-50 text-base"
              placeholder="Digite o nome da sua empresa..."
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
            Nome Completo
          </label>
          <input
            required
            type="text"
            className="w-full px-4 py-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-[#279267]/20 focus:border-[#279267] outline-none transition-all text-slate-900 bg-slate-50 text-base"
            placeholder="Digite seu nome..."
            value={formData.fullName}
            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
            WhatsApp
          </label>
          <input
            required
            type="tel"
            className="w-full px-4 py-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-[#279267]/20 focus:border-[#279267] outline-none transition-all text-slate-900 bg-slate-50 text-base"
            placeholder="(11) 99999-9999"
            value={formData.whatsapp}
            onChange={(e) => setFormData({...formData, whatsapp: formatWhatsApp(e.target.value)})}
          />
        </div>

        {type === 'contato' && (
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
              Mensagem (Opcional)
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-[#279267]/20 focus:border-[#279267] outline-none transition-all text-slate-900 bg-slate-50 text-base"
              placeholder="Como podemos ajudar?"
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
            />
          </div>
        )}

        <button
          disabled={status === 'loading' || !isFormValid}
          className="w-full bg-[#279267] hover:bg-[#1e7452] text-white font-black py-4 rounded-xl shadow-lg shadow-[#279267]/30 transition-all active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? (
            <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <span>Enviar Agora</span>
              <Send size={20} />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default LeadForm;
