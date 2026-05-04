import React from 'react';
import { Instagram, Phone, Mail, ArrowRight, Megaphone, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BRAND_INFO } from '../constants';
import { Partner } from '../types';

interface FooterProps {
  logoUrl?: string | null;
}

const Footer: React.FC<FooterProps> = ({ logoUrl }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-10">
          <div className="col-span-1 lg:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
              ) : (
                <>
                  <div className="bg-[#279267] p-2 rounded-lg">
                    <Megaphone className="text-white w-5 h-5" />
                  </div>
                  <div className="leading-none">
                    <span className="text-[#279267] font-extrabold text-lg tracking-tight uppercase block">
                      Aparece aí
                    </span>
                    <span className="text-[#c54b4b] text-[10px] font-bold tracking-widest uppercase">
                      por aqui
                    </span>
                  </div>
                </>
              )}
            </div>
            <p className="text-sm leading-relaxed mb-6">
              Conectamos sua marca ao seu público através de telas estratégicas em estabelecimentos de alto fluxo.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://www.instagram.com/apareceai.poraqui" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-[#279267] hover:text-white transition-all"
              >
                <Instagram size={20} />
              </a>
              <a 
                href="https://wa.me/5511933014850?text=Ol%C3%A1!%20Eu%20vim%20pelo%20site%20VITRINE%20-%20APARECE%20AI%20POR%20AQUI.%20Poderia%20me%20ajudar%3F" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-[#279267] hover:text-white transition-all"
              >
                <Phone size={20} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Navegação</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="/#vitrine" onClick={(e) => { const el = document.getElementById('vitrine'); if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth' }); } }} className="hover:text-[#279267] transition-colors">Vitrine de Parceiros</a></li>
              <li><a href="/#anuncie" onClick={(e) => { const el = document.getElementById('anuncie'); if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth' }); } }} className="hover:text-[#279267] transition-colors">Anuncie Conosco</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Contato</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start space-x-3">
                <Instagram size={18} className="text-[#c54b4b] mt-1" />
                <a 
                  href="https://www.instagram.com/apareceai.poraqui" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-[#279267] transition-colors"
                >
                  {BRAND_INFO.instagram}
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <Phone size={18} className="text-[#c54b4b] mt-1" />
                <a 
                  href="https://wa.me/5511933014850?text=Ol%C3%A1!%20Eu%20vim%20pelo%20site%20VITRINE%20-%20APARECE%20AI%20POR%20AQUI.%20Poderia%20me%20ajudar%3F" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-[#279267] transition-colors"
                >
                  {BRAND_INFO.whatsapp}
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <Mail size={18} className="text-[#c54b4b] mt-1" />
                <span>{BRAND_INFO.email}</span>
              </li>
            </ul>
          </div>

          <div className="col-span-1">
            <a 
              href="/#anuncie" 
              onClick={(e) => {
                const element = document.getElementById('anuncie');
                if (element) {
                  e.preventDefault();
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="bg-[#279267] text-white p-8 rounded-3xl flex flex-col items-start justify-between group transition-all hover:bg-[#1e7452] shadow-xl shadow-[#279267]/20 h-full min-h-[160px]"
            >
              <div className="flex justify-between w-full items-start">
                <h4 className="text-xl font-black uppercase leading-tight">Quer fazer<br/>parte?</h4>
                <div className="bg-white/20 p-2 rounded-full group-hover:translate-x-2 transition-transform">
                  <ArrowRight size={24} />
                </div>
              </div>
              <p className="text-green-50 text-xs font-bold uppercase tracking-widest mt-4">
                Clique aqui e anuncie
              </p>
            </a>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 text-center text-xs flex flex-col md:flex-row justify-between items-center gap-4">
          <p>&copy; {new Date().getFullYear()} Aparece aí por aqui. Todos os direitos reservados.</p>
          <div className="flex items-center space-x-6">
            <Link to="/politica-de-privacidade" className="text-slate-600 hover:text-[#279267] transition-colors">Política de Privacidade</Link>
            <Link to="/termos-de-uso" className="text-slate-600 hover:text-[#279267] transition-colors">Termos de Uso</Link>
            <Link to="/admin" className="text-slate-600 hover:text-[#279267] transition-colors">Acesso Administrativo</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
