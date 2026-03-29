import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CashbackConfig } from '../types';

interface RouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeName: string;
  configs: CashbackConfig[];
  onWin: (value: number) => void;
}

const RouletteModal: React.FC<RouletteModalProps> = ({ isOpen, onClose, storeName, configs, onWin }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<CashbackConfig | null>(null);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  const spin = () => {
    if (isSpinning || configs.length === 0) return;

    setIsSpinning(true);
    
    // Calculate result based on probability
    const totalProb = configs.reduce((acc, curr) => acc + curr.probability, 0);
    let random = Math.random() * totalProb;
    let selected: CashbackConfig = configs[0];
    
    for (const config of configs) {
      if (random < config.probability) {
        selected = config;
        break;
      }
      random -= config.probability;
    }

    // Calculate rotation
    const index = configs.indexOf(selected);
    const segmentAngle = 360 / configs.length;
    const extraSpins = 5 + Math.floor(Math.random() * 5);
    const targetRotation = rotation + (extraSpins * 360) + (360 - (index * segmentAngle)) - (segmentAngle / 2);
    
    setRotation(targetRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setResult(selected);
      onWin(selected.value);
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#279267', '#c54b4b', '#ffffff']
      });
    }, 4000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors z-10"
        >
          <X size={24} className="text-slate-400" />
        </button>

        <div className="p-8 text-center">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-900 mb-2">
              Bem-vindo à {storeName}!
            </h2>
            <p className="text-slate-500 font-medium">
              Gire a roleta e garanta seu cashback nesta compra!
            </p>
          </div>

          <div className="relative w-64 h-64 mx-auto mb-8">
            {/* Pointer */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
              <div className="w-8 h-8 bg-[#c54b4b] rotate-45 rounded-sm shadow-lg border-2 border-white" />
            </div>

            {/* Wheel */}
            <motion.div 
              ref={wheelRef}
              animate={{ rotate: rotation }}
              transition={{ duration: 4, ease: [0.45, 0.05, 0.55, 0.95] }}
              className="w-full h-full rounded-full border-8 border-slate-900 relative overflow-hidden shadow-2xl bg-slate-900"
            >
              {configs.map((config, i) => {
                const angle = 360 / configs.length;
                return (
                  <div 
                    key={config.id}
                    className="absolute top-0 left-0 w-full h-full origin-center"
                    style={{ 
                      transform: `rotate(${i * angle}deg)`,
                      clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.tan((angle * Math.PI) / 360)}% 0%)`,
                      backgroundColor: i % 2 === 0 ? '#279267' : '#c54b4b'
                    }}
                  >
                    <div 
                      className="absolute top-8 left-1/2 -translate-x-1/2 text-white font-black text-lg whitespace-nowrap"
                      style={{ transform: `rotate(${angle / 2}deg)` }}
                    >
                      {config.label}
                    </div>
                  </div>
                );
              })}
              {/* Center point */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full border-4 border-slate-900 z-10 shadow-inner" />
            </motion.div>
          </div>

          <AnimatePresence mode="wait">
            {result ? (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="space-y-4"
              >
                <div className="bg-green-50 p-6 rounded-2xl border-2 border-green-200">
                  <div className="flex justify-center mb-2">
                    <Trophy className="text-green-600 w-12 h-12" />
                  </div>
                  <h3 className="text-2xl font-black text-green-700">
                    Parabéns! Você ganhou {result.label}
                  </h3>
                  <p className="text-green-600 font-bold mt-2">
                    Apresente esta tela ao lojista para garantir seu cashback imediato!
                  </p>
                </div>
                <button 
                  onClick={onClose}
                  className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Continuar para a Vitrine
                </button>
              </motion.div>
            ) : (
              <button 
                onClick={spin}
                disabled={isSpinning}
                className={`w-full py-4 ${isSpinning ? 'bg-slate-200 text-slate-400' : 'bg-[#279267] text-white hover:bg-green-700'} font-black text-xl rounded-2xl shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2`}
              >
                {isSpinning ? 'Girando...' : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    GIRAR AGORA!
                  </>
                )}
              </button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default RouletteModal;
