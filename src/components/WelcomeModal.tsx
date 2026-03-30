import React from 'react';
import { motion } from 'motion/react';
import { X, Sparkles, MapPin } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  storeName: string;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, onAccept, storeName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#279267] via-[#c54b4b] to-[#279267]"></div>
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors z-10"
        >
          <X size={24} className="text-slate-400" />
        </button>

        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg">
            <Sparkles className="text-[#279267] w-10 h-10" />
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 leading-tight">
            Bem-vindo à Vitrine Aparece Aí por Aqui!
          </h2>
          
          <p className="text-slate-600 font-medium mb-8">
            Você está em <span className="text-[#279267] font-bold">{storeName}</span>. 
            Escolha como deseja continuar:
          </p>

          <div className="space-y-4">
            <button 
              onClick={onAccept}
              className="w-full py-4 px-4 bg-[#279267] text-white font-black text-sm md:text-base rounded-2xl shadow-lg shadow-green-900/20 hover:bg-green-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 leading-tight"
            >
              <Sparkles className="w-5 h-5 flex-shrink-0" />
              <span>Estou na loja e quero garantir meu cashback agora.</span>
            </button>

            <button 
              onClick={onClose}
              className="w-full py-4 px-4 bg-slate-100 text-slate-700 font-bold text-sm md:text-base rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-3 leading-tight"
            >
              <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <span>Continuar para as benefícios do meu bairro</span>
            </button>
          </div>

          <p className="mt-8 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            Aparece aí por aqui • Conectando você ao comércio local
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default WelcomeModal;
