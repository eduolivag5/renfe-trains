import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Home, Map, TrainFront, Settings, type LucideIcon } from 'lucide-react';

interface NavbarProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

interface NavLink {
  name: string;
  Icon: LucideIcon;
  href: string;
}

const Navbar: React.FC<NavbarProps> = () => {
  const location = useLocation();
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const navLinks: NavLink[] = [
    { name: 'Inicio', Icon: Home, href: '/' },
    { name: 'Mapa', Icon: Map, href: '/mapa' },
    { name: 'Trenes', Icon: TrainFront, href: '/trenes' },
    { name: 'Ajustes', Icon: Settings, href: '/ajustes' },
  ];

  const activeTabIndex = navLinks.findIndex(link => link.href === location.pathname);
  const activeTab = activeTabIndex === -1 ? 0 : activeTabIndex;

  return (
    <>
      {/* --- DESKTOP NAVBAR (CENTERED & COMPACT) --- */}
      <div className="fixed top-0 left-0 right-0 z-50 hidden md:flex justify-center p-6 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          
          {/* Logo Pill */}
          <Link 
            to="/" 
            className="bg-[#002147] h-11 px-4 flex items-center justify-center rounded-2xl shadow-lg border border-white/10 hover:bg-[#003366] transition-all active:scale-95"
          >
            <img src="/renfe.svg" alt="Logo" className="h-4 w-auto" />
          </Link>

          {/* Navigation Pill */}
          <nav className="flex items-center bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-xl rounded-2xl p-1.5">
            <div className="flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <Link 
                    key={link.name} 
                    to={link.href} 
                    className="relative w-10 h-10 flex items-center justify-center group"
                    onMouseEnter={() => setHoveredTab(link.name)}
                    onMouseLeave={() => setHoveredTab(null)}
                  >
                    {/* Tooltip */}
                    <AnimatePresence>
                      {hoveredTab === link.name && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 5, scale: 0.9 }}
                          className="absolute top-12 px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-bold rounded-lg shadow-xl whitespace-nowrap pointer-events-none"
                        >
                          {link.name}
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 dark:bg-white rotate-45" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className={`relative z-10 transition-colors duration-200 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                      <link.Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                    </div>

                    {isActive && (
                      <motion.div 
                        layoutId="activeTabDesktop"
                        className="absolute inset-0 bg-blue-500/10 dark:bg-blue-400/10 rounded-xl border border-blue-500/20"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>

      {/* --- MOBILE NAVBAR (REMAINS CONSISTENT) --- */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-6 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:hidden">
        <div className="relative flex items-center w-full max-w-[400px] h-[72px] bg-slate-200/70 dark:bg-slate-900/80 backdrop-blur-[40px] border border-white/20 dark:border-white/5 shadow-[0_-15px_40px_rgba(0,0,0,0.15)] rounded-[36px] px-2">
          
          <div className="absolute inset-0 px-2 flex items-center pointer-events-none">
            <motion.div
              className="h-[52px] bg-white/60 dark:bg-white/10 rounded-[28px] shadow-sm"
              animate={{ x: `${activeTab * 100}%`, width: '25%' }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
            />
          </div>

          {navLinks.map((link, index) => {
            const isActive = activeTab === index;
            return (
              <Link 
                key={link.name} 
                to={link.href}
                className="flex-1 h-full flex items-center justify-center outline-none"
              >
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className={`relative z-10 flex flex-col items-center justify-center gap-1 transition-colors duration-200 ease-in-out
                    ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}
                  `}
                >
                  <link.Icon size={20} strokeWidth={2.5} />
                  <span className={`text-[9px] font-bold tracking-tight uppercase ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                    {link.name}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Navbar;