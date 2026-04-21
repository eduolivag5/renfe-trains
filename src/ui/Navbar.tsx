import React from 'react';
import { motion } from 'framer-motion';
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
      {/* --- DESKTOP NAVBAR (TOP HORIZONTAL) --- */}
      <div className="fixed top-0 left-0 right-0 z-50 hidden md:flex justify-center p-4">
        <nav className="flex items-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-2xl rounded-2xl overflow-hidden">
          
          {/* Logo */}
          <Link 
            to="/" 
            className="bg-[#002147] px-5 py-3 flex items-center justify-center border-r border-white/10 hover:bg-[#003366] transition-colors"
          >
            <img src="/renfe.svg" alt="Logo" className="h-6 w-auto" />
          </Link>

          {/* Elementos de navegación */}
          <div className="flex items-center px-2 py-1 gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link key={link.name} to={link.href} className="relative px-4 py-2 group">
                  <div className="relative z-10 flex items-center gap-2">
                    <link.Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-sm font-bold tracking-tight">{link.name}</span>
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

      {/* --- MOBILE NAVBAR --- */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-6 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:hidden">
        <div className="relative flex items-center w-full max-w-[400px] h-[76px] bg-slate-200/70 dark:bg-slate-900/80 backdrop-blur-[40px] border border-white/20 dark:border-white/5 shadow-[0_-15px_40px_rgba(0,0,0,0.15)] rounded-[38px] px-2">
          
          <div className="absolute inset-0 px-2 flex items-center pointer-events-none">
            <motion.div
              className="h-[56px] bg-white/60 dark:bg-white/10 rounded-[30px] shadow-sm"
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
                  <link.Icon size={22} strokeWidth={2.5} />
                  <span className={`text-[10px] font-bold tracking-tight uppercase ${isActive ? 'opacity-100' : 'opacity-70'}`}>
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