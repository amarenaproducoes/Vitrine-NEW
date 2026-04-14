import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase, AUTHORIZED_EMAILS } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { logger } from '../lib/logger';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) setLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-12 h-12 border-4 border-[#279267] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isDevBypass = false;
  const userEmail = user?.email?.toLowerCase() || '';
  const isAuthorized = AUTHORIZED_EMAILS.includes(userEmail);

  if (!isDevBypass && (!user || !isAuthorized)) {
    if (user) {
      // Log unauthorized access attempt
      logger.security({
        type: 'unauthorized_access',
        severity: 'high',
        details: { 
          user_email: user.email,
          attempted_path: location.pathname,
          method: 'protected_route'
        }
      });
      // Se estiver logado mas com o e-mail errado, desloga e manda pro login
      supabase.auth.signOut();
    } else {
      // Optional: log anonymous access attempt to admin area
      if (location.pathname.startsWith('/admin')) {
        logger.security({
          type: 'unauthorized_access',
          severity: 'medium',
          details: { 
            method: 'anonymous_admin_attempt',
            attempted_path: location.pathname
          }
        });
      }
    }
    return <Navigate to="/login" state={{ from: location, error: user ? `E-mail ${user.email} não autorizado.` : 'Acesso restrito. Por favor, faça login.' }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
