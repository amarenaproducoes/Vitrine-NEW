import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { supabase } from '../lib/supabase';
import { getUserIP } from '../lib/ip';
import { logger } from '../lib/logger';

interface LeadFormProps {
  type: 'anunciante' | 'motorista' | 'comerciante' | 'contato';
  title: string;
  subtitle: string;
}

const formatWhatsApp = (value: string) => {
  const v = value.replace(/\D/g, '').slice(0, 11);
  let formatted = v;
  if (v.length > 0) {
    formatted = `(${v.slice(0, 2)}`;
    if (v.length > 2) {
      formatted += `) ${v.slice(2, 7)}`;
    }
    if (v.length > 7) {
      formatted += `-${v.slice(7, 11)}`;
    }
  }
  return formatted;
};

const LeadForm: React.FC<LeadFormProps> = ({ type, title, subtitle }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({ fullName: '', whatsapp: '', message: '' });
  const [hasConsented, setHasConsented] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const isWhatsAppValid = formData.whatsapp.replace(/\D/g, '').length === 11;

  let isFormValid = formData.fullName.trim().length > 0 && isWhatsAppValid && hasConsented;
  
  if (type === 'anunciante' || type === 'comerciante') {
    isFormValid = isFormValid && formData.message.trim().length > 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) {
      if (!isWhatsAppValid) alert('Por favor, insira um WhatsApp válido.');
      else if (formData.fullName.trim().length === 0) alert('Por favor, insira seu nome completo.');
      else if (!hasConsented) alert('Você precisa aceitar os termos para continuar.');
      else if ((type === 'anunciante' || type === 'comerciante') && formData.message.trim().length === 0) alert('Por favor, insira o nome da empresa.');
      return;
    }

    setStatus('loading');
    
    try {
      if (executeRecaptcha && import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
        try {
          const token = await executeRecaptcha('lead_submission');
          if (!token) {
            logger.warn('ReCAPTCHA verification failed, but continuing...');
          }
        } catch (recaptchaErr) {
          logger.error('ReCAPTCHA error:', recaptchaErr);
          // We continue if it's just a connection error
        }
      }

      const ip = await getUserIP();
      
      // Save/Update customer name
      try {
        const cleanWhatsapp = formData.whatsapp.replace(/\D/g, '');
        await supabase
          .from('customers')
          .upsert({ 
            whatsapp: cleanWhatsapp, 
            name: formData.fullName.trim(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'whatsapp' });

        // Update name in all previous logs for this WhatsApp to ensure consistency
        await Promise.all([
          supabase.from('cashback_logs').update({ customer_name: formData.fullName.trim() }).eq('whatsapp', cleanWhatsapp),
          supabase.from('unlocked_coupons').update({ customer_name: formData.fullName.trim() }).eq('whatsapp', cleanWhatsapp),
          supabase.from('partner_shares').update({ customer_name: formData.fullName.trim() }).eq('whatsapp_number', cleanWhatsapp)
        ]);
      } catch (error) {
        logger.error('Error saving customer name in LeadForm:', error);
      }

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
      logger.error('Error saving lead:', error);
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

        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
          <AlertCircle className="text-amber-600 w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-[10px] leading-relaxed text-amber-800 font-medium">
            <strong>AVISO DE COLETA DE DADOS:</strong> Seus dados serão coletados e utilizados para fins publicitários e informativos sobre promoções e benefícios locais, conforme nossa <Link to="/politica-de-privacidade" className="underline font-bold hover:text-[#279267]">Política de Privacidade</Link> e <Link to="/termos-de-uso" className="underline font-bold hover:text-[#279267]">Termos de Uso</Link>.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-1">
            <input 
              type="checkbox"
              checked={hasConsented}
              onChange={(e) => setHasConsented(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${hasConsented ? 'bg-[#279267] border-[#279267]' : 'bg-white border-slate-200 group-hover:border-slate-300'}`}>
              {hasConsented && <CheckCircle2 className="text-white w-4 h-4" />}
            </div>
          </div>
          <span className="text-xs text-slate-600 font-medium leading-tight">
            Estou ciente e autorizo a coleta e uso dos meus dados conforme a Política de Privacidade e Termos de Uso.
          </span>
        </label>

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
          className={`w-full bg-[#279267] hover:bg-[#1e7452] text-white font-black py-4 rounded-xl shadow-lg shadow-[#279267]/30 transition-all active:scale-[0.98] flex items-center justify-center space-x-2 ${!isFormValid ? 'opacity-50' : ''}`}
          disabled={status === 'loading'}
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
