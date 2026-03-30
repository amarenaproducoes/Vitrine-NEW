import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, User, AlertCircle, Megaphone } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/admin';

  const validatePassword = (pass: string) => {
    const minLength = pass.length >= 6;
    const hasUpper = /[A-Z]/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    
    if (!minLength) return 'A senha deve ter no mínimo 6 caracteres.';
    if (!hasUpper) return 'A senha deve conter pelo menos uma letra maiúscula.';
    if (!hasSpecial) return 'A senha deve conter pelo menos um caractere especial.';
    
    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      // We use email for Supabase Auth, but we can label it as "Usuário"
      // If the user enters a plain username, we might need to append a domain if we're using email auth
      // But usually, it's better to just use the email.
      // For "Texto livre", I'll assume they might enter an email or we can treat it as one.
      const loginEmail = email.includes('@') ? email : `${email}@admin.com`;

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });

      if (authError) {
        if (authError.message === 'Invalid login credentials') {
          setError('Usuário ou senha inválidos.');
        } else {
          setError(authError.message);
        }
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError('Ocorreu um erro ao tentar fazer login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 p-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-[#279267] rounded-2xl shadow-lg shadow-[#279267]/20 mb-6">
            <Megaphone className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">
            Acesso <span className="text-[#279267]">Restrito</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium">
            Entre com suas credenciais para gerenciar a plataforma.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-start space-x-3 text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Usuário</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#279267] transition-colors">
                <User size={20} />
              </div>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none focus:border-[#279267] focus:ring-4 focus:ring-[#279267]/10 transition-all"
                placeholder="Seu usuário"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Senha</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#279267] transition-colors">
                <Lock size={20} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none focus:border-[#279267] focus:ring-4 focus:ring-[#279267]/10 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-2 ml-1">
              Mínimo 6 caracteres, 1 letra maiúscula e 1 caractere especial.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#279267] text-white font-black py-4 rounded-2xl hover:bg-[#1e7452] transition-all shadow-lg shadow-[#279267]/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span>Entrar no Painel</span>
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-slate-800 text-center">
          <button 
            onClick={() => navigate('/')}
            className="text-slate-500 hover:text-white text-sm font-bold transition-colors"
          >
            Voltar para o site
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
