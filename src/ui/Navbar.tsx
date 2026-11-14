import React, { useEffect, useRef, useState } from 'react';
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

const SPRING = { type: 'spring', stiffness: 420, damping: 34 } as const;

/**
 * El scroll de la app ocurre dentro de <main>, no en window.
 * Devuelve si se ha hecho scroll y si el usuario está bajando (para ocultar la barra móvil).
 */
function useMainScroll(pathname: string) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const el = document.querySelector('main');
    if (!el) return;

    lastY.current = el.scrollTop;
    // Sincroniza el estado inicial al cambiar de ruta (fuera del cuerpo del efecto)
    const initFrame = requestAnimationFrame(() => {
      setScrolled(el.scrollTop > 12);
      setHidden(false);
    });

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = el.scrollTop;
        const delta = y - lastY.current;
        setScrolled(y > 12);
        if (Math.abs(delta) > 6) {
          setHidden(delta > 0 && y > 120);
          lastY.current = y;
        }
        ticking = false;
      });
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(initFrame);
      el.removeEventListener('scroll', onScroll);
    };
  }, [pathname]);

  return { scrolled, hidden };
}

const ThemeToggle: React.FC<NavbarProps> = ({ isDarkMode, toggleTheme }) => (
  <button
    type="button"
    onClick={toggleTheme}
    aria-label={isDarkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
    className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl text-slate-500 transition-colors hover:bg-slate-900/5 hover:text-slate-900 active:scale-95 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
  >
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={isDarkMode ? 'moon' : 'sun'}
        initial={{ y: 14, rotate: -90, opacity: 0 }}
        animate={{ y: 0, rotate: 0, opacity: 1 }}
        exit={{ y: -14, rotate: 90, opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        {isDarkMode ? <Moon size={18} strokeWidth={2.25} /> : <Sun size={18} strokeWidth={2.25} />}
      </motion.span>
    </AnimatePresence>
  </button>
);

const Navbar: React.FC<NavbarProps> = ({ isDarkMode, toggleTheme }) => {
  const { pathname } = useLocation();
  const { scrolled, hidden } = useMainScroll(pathname);
  const [hovered, setHovered] = useState<string | null>(null);

  const activeHref = NAV_LINKS.find((l) => l.href === pathname)?.href ?? '/';

  /** Pulsar la pestaña de la página actual vuelve suavemente arriba */
  const handleClick = (href: string) => {
    if (href === pathname) document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <MotionConfig transition={SPRING}>
      {/* ---------------- DESKTOP: barra flotante que se compacta al hacer scroll ---------------- */}
      <header
        className={`pointer-events-none fixed inset-x-0 top-0 z-50 hidden justify-center px-6 transition-[padding] duration-500 md:flex ${
          scrolled ? 'pt-3' : 'pt-5'
        }`}
      >
        <div
          className={`pointer-events-auto flex h-14 w-full items-center justify-between gap-4 rounded-2xl border px-2 backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            scrolled
              ? 'max-w-3xl border-slate-200/70 bg-white/85 shadow-[0_12px_40px_-12px_rgba(2,33,71,0.25)] dark:border-white/10 dark:bg-slate-900/85'
              : 'max-w-6xl border-white/40 bg-white/60 shadow-[0_8px_30px_-16px_rgba(2,33,71,0.2)] dark:border-white/5 dark:bg-slate-900/60'
          }`}
        >
          {/* Logo */}
          <Link
            to="/"
            aria-label="Inicio"
            className="flex h-10 shrink-0 items-center rounded-xl bg-[#002147] px-4 shadow-md transition-all hover:bg-[#003366] active:scale-95"
          >
            <img src="/renfe.svg" alt="Renfe" className="h-4 w-auto" />
          </Link>

          {/* Enlaces */}
          <nav aria-label="Principal" onMouseLeave={() => setHovered(null)}>
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map(({ name, Icon, href }) => {
                const isActive = href === activeHref;
                return (
                  <li key={href}>
                    <Link
                      to={href}
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => handleClick(href)}
                      onMouseEnter={() => setHovered(href)}
                      className={`relative flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors duration-200 ${
                        isActive
                          ? 'text-white'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                      }`}
                    >
                      {/* Hover suave que sigue al cursor */}
                      {hovered === href && !isActive && (
                        <motion.span
                          layoutId="nav-hover"
                          className="absolute inset-0 rounded-xl bg-slate-900/5 dark:bg-white/10"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        />
                      )}
                      {/* Indicador activo deslizante */}
                      {isActive && (
                        <motion.span
                          layoutId="nav-active"
                          className="absolute inset-0 rounded-xl bg-blue-600 shadow-[0_6px_16px_-6px_rgba(37,99,235,0.7)] dark:bg-blue-500"
                        />
                      )}
                      <Icon size={17} strokeWidth={isActive ? 2.5 : 2.25} className="relative z-10" />
                      <span className="relative z-10">{name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Acciones */}
          <div className="flex shrink-0 items-center pr-1">
            <ThemeToggle isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
          </div>
        </div>
      </header>

      {/* ---------------- MÓVIL: tab bar inferior; la pestaña activa se expande con su nombre ---------------- */}
      <motion.nav
        aria-label="Principal"
        initial={false}
        animate={{ y: hidden ? '150%' : '0%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:hidden"
      >
        <ul className="flex h-16 w-full max-w-[420px] items-center justify-between gap-1 rounded-full border border-white/40 bg-white/80 px-2 shadow-[0_18px_40px_-12px_rgba(2,33,71,0.35)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/85">
          {NAV_LINKS.map(({ name, Icon, href }) => {
            const isActive = href === activeHref;
            return (
              <li key={href} className={`min-w-0 ${isActive ? 'flex-[1.6]' : 'flex-1'}`} style={{ transition: 'flex 0.35s cubic-bezier(0.16,1,0.3,1)' }}>
                <Link
                  to={href}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={name}
                  onClick={() => handleClick(href)}
                  className="relative flex h-12 w-full items-center justify-center rounded-full outline-none"
                >
                  {isActive && (
                    <motion.span
                      layoutId="mobile-active"
                      className="absolute inset-0 rounded-full bg-blue-600 shadow-[0_8px_20px_-8px_rgba(37,99,235,0.8)] dark:bg-blue-500"
                    />
                  )}
                  <motion.span
                    whileTap={{ scale: 0.85 }}
                    className={`relative z-10 flex items-center ${
                      isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Icon size={20} strokeWidth={2.4} />
                    <AnimatePresence initial={false}>
                      {isActive && (
                        <motion.span
                          initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                          animate={{ width: 'auto', opacity: 1, marginLeft: 8 }}
                          exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                          className="overflow-hidden whitespace-nowrap text-[13px] font-bold"
                        >
                          {name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.span>
                </Link>
              </li>
            );
          })}
        </ul>
      </motion.nav>
    </MotionConfig>
  );
};

export default Navbar;
