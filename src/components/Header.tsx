import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Megaphone } from 'lucide-react';
import { NAV_LINKS } from '../constants';

interface HeaderProps {
  headerLogo?: string | null;
}

const Header: React.FC<HeaderProps> = ({ headerLogo }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path.includes('#')) {
      const [base, hash] = path.split('#');
      return location.pathname === base && location.hash === `#${hash}`;
    }
    return location.pathname === path;
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-slate-900 border-b border-slate-800 backdrop-blur-md bg-opacity-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 md:h-24 items-center">
          <Link to="/" className="flex items-center space-x-3">
            {headerLogo ? (
              <img src={headerLogo} alt="Aparece aí por aqui" className="h-[60px] md:h-[90px] w-auto object-contain py-2" />
            ) : (
              <>
                <div className="bg-[#279267] p-2 rounded-lg">
                  <Megaphone className="text-white w-6 h-6" />
                </div>
                <div>
                  <span className="text-[#279267] font-extrabold text-xl tracking-tight leading-none block uppercase">
                    Aparece aí
                  </span>
                  <span className="text-[#c54b4b] text-xs font-bold tracking-widest uppercase">
                    por aqui
                  </span>
                </div>
              </>
            )}
          </Link>

          <div className="hidden md:flex space-x-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                className={`text-sm font-semibold transition-colors duration-200 ${
                  isActive(link.path) ? 'text-[#279267]' : 'text-slate-300 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-300 hover:text-white focus:outline-none"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 animate-in slide-in-from-top duration-300">
          <div className="px-4 pt-2 pb-6 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-4 text-base font-bold rounded-md ${
                  isActive(link.path)
                    ? 'bg-[#279267]/10 text-[#279267]'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Header;
