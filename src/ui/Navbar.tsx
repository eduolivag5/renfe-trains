import React, { useState, useEffect } from 'react';
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
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const navLinks: NavLink[] = [
    { name: 'Inicio', Icon: Home, href: '/' },
    { name: 'Mapa', Icon: Map, href: '/mapa' }, // Cambiado de "Rutas" a "Mapa"
    { name: 'Trenes', Icon: TrainFront, href: '/trenes' },
    { name: 'Ajustes', Icon: Settings, href: '/ajustes' },
  ];

  // En PC filtramos "Ajustes" de la lista central
  const desktopLinks = navLinks.filter(link => link.name !== 'Ajustes');
  
  const activeTabIndex = navLinks.findIndex(link => link.href === location.pathname);
  const activeTab = activeTabIndex === -1 ? 0 : activeTabIndex;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* --- DESKTOP NAVBAR (PC) --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 hidden md:flex justify-center p-4">
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`
            relative w-full max-w-7xl flex items-center justify-between px-8 py-3
            transition-all duration-500
            bg-white/80 dark:bg-slate-900/80 backdrop-blur-[20px] 
            border border-slate-200/50 dark:border-white/10 rounded-[32px]
            ${scrolled ? 'mt-0 shadow-[0_8px_30px_rgb(0,0,0,0.12)]' : 'mt-2 shadow-[0_4px_20px_rgba(0,0,0,0.08)]'}
          `}
        >
          <Link to="/">
            <img src="/renfe.svg" alt="Renfe Logo" className="h-8 w-auto" />
          </Link>
          
          <div className="flex items-center gap-8 font-semibold">
            {desktopLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link key={link.name} to={link.href} className="outline-none">
                  <motion.div 
                    whileTap={{ scale: 0.95 }}
                    className={`
                      group relative flex items-center gap-2 transition-colors duration-200 px-2 py-1
                      ${isActive 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-blue-500'
                      }
                    `}
                  >
                    <link.Icon size={18} strokeWidth={2.5} />
                    <span className="text-[15px]">{link.name}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="activeTabDesktop"
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}

            <Link to="/ajustes">
              <motion.div 
                whileTap={{ scale: 0.9 }}
                className={`
                  p-2.5 rounded-2xl transition-all border
                  ${location.pathname === '/ajustes' 
                    ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400' 
                    : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-blue-500'
                  }
                `}
              >
                <Settings size={20} strokeWidth={2.5} />
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </nav>

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
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className={`
                    relative z-10 flex flex-col items-center justify-center gap-1
                    transition-colors duration-200 ease-in-out
                    ${isActive 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-slate-500 dark:text-slate-400'
                    }
                  `}
                >
                  <div className="relative">
                    <link.Icon 
                      size={22} 
                      strokeWidth={2.5}
                      className="block"
                    />
                    {link.name === 'Trenes' && (
                      <span className="absolute -top-1.5 -right-3.5 bg-green-500 text-[10px] text-white font-black px-1.5 py-0.5 rounded-full shadow-sm">
                        3
                      </span>
                    )}
                  </div>
                  <span className={`
                    text-[10px] font-bold tracking-tight uppercase
                    ${isActive ? 'opacity-100' : 'opacity-70'}
                  `}>
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