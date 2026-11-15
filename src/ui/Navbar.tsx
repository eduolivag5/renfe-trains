import React from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Home, Map, TrainFront, Search, Settings, Sun, Moon, type LucideIcon } from 'lucide-react';

interface NavbarProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

interface NavLink {
  name: string;
  Icon: LucideIcon;
  href: string;
}

const NAV_LINKS: NavLink[] = [
  { name: 'Inicio', Icon: Home, href: '/' },
  { name: 'Trenes', Icon: TrainFront, href: '/trenes' },
  { name: 'Mapa', Icon: Map, href: '/mapa' },
  { name: 'Buscar', Icon: Search, href: '/buscar' },
  { name: 'Ajustes', Icon: Settings, href: '/ajustes' },
];

/* Ancho del rail lateral en escritorio: 88px (App.tsx lo reserva con md:pl-[88px]) */

const SPRING = { type: 'spring', stiffness: 460, damping: 36 } as const;

const ThemeIcon: React.FC<{ isDarkMode: boolean; size: number }> = ({ isDarkMode, size }) => (
  <AnimatePresence mode="wait" initial={false}>
    <motion.span
      key={isDarkMode ? 'moon' : 'sun'}
      initial={{ y: 12, rotate: -90, opacity: 0 }}
      animate={{ y: 0, rotate: 0, opacity: 1 }}
      exit={{ y: -12, rotate: 90, opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="flex"
    >
      {isDarkMode ? <Moon size={size} strokeWidth={2.25} /> : <Sun size={size} strokeWidth={2.25} />}
    </motion.span>
  </AnimatePresence>
);

const Navbar: React.FC<NavbarProps> = ({ isDarkMode, toggleTheme }) => {
  const { pathname } = useLocation();
  const activeIndex = Math.max(0, NAV_LINKS.findIndex((l) => l.href === pathname));
  const activeHref = NAV_LINKS[activeIndex].href;

  /** Pulsar la pestaña de la página actual vuelve suavemente arriba */
  const handleClick = (href: string) => {
    if (href === pathname) document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <MotionConfig transition={SPRING}>
      {/* ---------------- ESCRITORIO: rail lateral corporativo ---------------- */}
      <aside
        className="fixed inset-y-0 left-0 z-50 hidden w-[88px] flex-col items-center border-r border-white/5 bg-[#002147] py-5 md:flex dark:bg-[#070d1c]"
      >
        {/* Logo */}
        <Link
          to="/"
          aria-label="Renfe · Inicio"
          onClick={() => handleClick('/')}
          className="block h-12 w-12 rounded-[14px] shadow-lg shadow-black/30 ring-1 ring-white/15"
        >
          <img src="/logo.svg" alt="" className="h-12 w-12" />
        </Link>

        <span className="my-6 h-px w-8 bg-white/10" />

        {/* Navegación */}
        <nav aria-label="Principal" className="w-full">
          <ul className="flex flex-col items-center gap-2">
            {NAV_LINKS.map(({ name, Icon, href }) => {
              const isActive = href === activeHref;
              return (
                <li key={href} className="relative w-full px-2">
                  {/* Indicador lateral que se desliza entre secciones */}
                  {isActive && (
                    <motion.span
                      layoutId="rail-indicator"
                      className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full bg-accent-400"
                    />
                  )}
                  <Link
                    to={href}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => handleClick(href)}
                    className="group flex w-full flex-col items-center gap-1.5 rounded-2xl py-2 outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
                  >
                    <span className="relative flex h-10 w-12 items-center justify-center">
                      {isActive ? (
                        <motion.span
                          layoutId="rail-chip"
                          className="absolute inset-0 rounded-xl bg-white shadow-md shadow-black/25"
                        />
                      ) : (
                        <span className="absolute inset-0 rounded-xl bg-white/0 transition-colors duration-200 group-hover:bg-white/10" />
                      )}
                      <Icon
                        size={20}
                        strokeWidth={isActive ? 2.5 : 2}
                        className={`relative z-10 transition-colors duration-200 ${
                          isActive ? 'text-[#002147]' : 'text-white/60 group-hover:text-white'
                        }`}
                      />
                    </span>
                    <span
                      className={`text-[11px] font-bold tracking-tight transition-colors duration-200 ${
                        isActive ? 'text-white' : 'text-white/55 group-hover:text-white/90'
                      }`}
                    >
                      {name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Tema */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDarkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
          className="mt-auto flex h-11 w-11 items-center justify-center rounded-xl text-white/60 transition-colors hover:bg-white/10 hover:text-white active:scale-95"
        >
          <ThemeIcon isDarkMode={isDarkMode} size={19} />
        </button>
      </aside>

      {/* ---------------- MÓVIL: tab bar flotante de cristal líquido (estilo iOS) ----------------
          No toca el borde inferior: así Safari tiñe su barra con el fondo de la página, no con la nav. */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-50 mx-auto max-w-md md:hidden"
      >
        <div className="liquid-glass rounded-full p-1.5">
          <ul className="relative flex">
            {/* Gota bajo la pestaña activa: solo se mueve con transform (compositor, sin repintar el blur) */}
            <span
              aria-hidden
              className="liquid-drop pointer-events-none absolute inset-y-0 left-0 w-1/5 rounded-full"
              style={{ transform: `translate3d(${activeIndex * 100}%, 0, 0)` }}
            />
            {NAV_LINKS.map(({ name, Icon, href }) => {
              const isActive = href === activeHref;
              return (
                <li key={href} className="relative min-w-0 flex-1">
                  <Link
                    to={href}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => handleClick(href)}
                    className="flex h-[52px] flex-col items-center justify-center gap-0.5 rounded-full outline-none transition-transform duration-150 active:scale-90"
                  >
                    <Icon
                      size={21}
                      strokeWidth={isActive ? 2.5 : 2}
                      className={`transition-colors duration-200 ${
                        isActive ? 'text-accent-600 dark:text-accent-400' : 'text-slate-600 dark:text-slate-300'
                      }`}
                    />
                    <span
                      className={`max-w-full truncate text-[10px] font-bold leading-tight transition-colors duration-200 ${
                        isActive ? 'text-accent-600 dark:text-accent-400' : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </MotionConfig>
  );
};

export default Navbar;
