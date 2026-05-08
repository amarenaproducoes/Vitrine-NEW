import React, { useState, useEffect } from 'react';
import OneSignal from 'react-onesignal';
import { AlertCircle, Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const NotificationReactivationBanner = () => {
    const [status, setStatus] = useState<'granted' | 'denied' | 'default' | 'unknown'>('unknown');
    const [isVisible, setIsVisible] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                // API v16+ (react-onesignal 3.5.1+)
                // @ts-ignore
                const permission = OneSignal.Notifications?.permission;
                setStatus(permission ? 'granted' : 'default'); 

                // @ts-ignore
                const isEnabled = OneSignal.User?.PushSubscription?.optedIn;
                setIsSubscribed(!!isEnabled);

                // @ts-ignore
                const hasId = !!(OneSignal.User?.onesignalId || OneSignal.User?.PushSubscription?.id);

                // SÓ MOSTRA O BANNER SE:
                // 1. O usuário já tiver um ID no OneSignal (ou seja, não é um visitante novo)
                // 2. E as notificações estiverem bloqueadas (permission false) OU ele deu opt-out (isEnabled false)
                if (hasId && (!permission || isEnabled === false)) {
                    setTimeout(() => setIsVisible(true), 2000);
                } else {
                    setIsVisible(false);
                }
            } catch (error) {
                console.warn('Erro ao verificar status de notificações:', error);
            }
        };

        if ((window as any).isOneSignalInitialized) {
            checkStatus();
        } else {
            const interval = setInterval(() => {
                if ((window as any).isOneSignalInitialized) {
                    checkStatus();
                    clearInterval(interval);
                }
            }, 1000);
            return () => clearInterval(interval);
        }
    }, []);

    const handleReactivate = async () => {
        try {
            // @ts-ignore
            const permission = OneSignal.Notifications?.permission;

            if (!permission) {
                // Tenta pedir permissão ao navegador
                // @ts-ignore
                await OneSignal.Notifications?.requestPermission();
            } else {
                // Se já tem permissão mas está desativado no OneSignal (opted out)
                // @ts-ignore
                await OneSignal.User?.PushSubscription?.optIn();
            }
            
            setIsVisible(false);
        } catch (error) {
            console.error('Erro ao reativar notificações:', error);
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-[100]"
                >
                    <div className="bg-white border-2 border-[#c54b4b] rounded-2xl shadow-2xl p-4 relative overflow-hidden">
                        {/* Indicador visual lateral */}
                        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#c54b4b]"></div>
                        
                        <div className="flex items-start space-x-3">
                            <div className="bg-[#c54b4b]/10 p-2 rounded-xl text-[#c54b4b] flex-shrink-0 animate-bounce">
                                <Bell size={24} />
                            </div>
                            
                            <div className="flex-grow min-w-0">
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">
                                    Notificações Desativadas
                                </h4>
                                <p className="text-xs text-slate-600 font-medium leading-relaxed mb-3">
                                    Vimos que você está perdendo oportunidades valiosas da nossa Vitrine. Clique aqui para reativar as notificações!
                                </p>
                                
                                <div className="flex items-center space-x-2">
                                    <button 
                                        onClick={handleReactivate}
                                        className="bg-[#c54b4b] hover:bg-[#b13b3b] text-white text-[11px] font-black uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 flex items-center"
                                    >
                                        Ativar Avisos via Browser
                                    </button>
                                    <button 
                                        onClick={() => setIsVisible(false)}
                                        className="text-slate-400 hover:text-slate-600 text-[10px] font-bold uppercase tracking-widest px-2"
                                    >
                                        Ignorar
                                    </button>
                                </div>
                            </div>

                            <button 
                                onClick={() => setIsVisible(false)}
                                className="text-slate-300 hover:text-slate-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        {status === 'denied' && (
                            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center space-x-2">
                                <AlertCircle size={14} className="text-[#c54b4b] flex-shrink-0" />
                                <span className="text-[9px] text-slate-500 font-bold leading-tight">
                                    Nota: Você bloqueou as notificações. Se o botão não funcionar, clique no ícone de cadeado na barra de endereços para permitir.
                                </span>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NotificationReactivationBanner;
