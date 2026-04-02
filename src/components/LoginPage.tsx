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

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/#/admin`
        }
      });

      if (authError) throw authError;
    } catch (err: any) {
      setError('Erro ao tentar entrar com o Google: ' + (err.message || 'Erro desconhecido'));
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
            Utilize sua conta Google autorizada para gerenciar a plataforma.
          </p>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-start space-x-3 text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-slate-900 font-bold py-4 rounded-2xl hover:bg-slate-100 transition-all shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Entrar com Google</span>
              </>
            )}
          </button>
          
          <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest font-bold">
            Somente e-mails autorizados têm acesso
          </p>
        </div>

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
