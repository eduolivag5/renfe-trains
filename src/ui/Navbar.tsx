import React from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Home, Map, TrainFront, Search, Settings, Sun, Moon, TriangleAlert, type LucideIcon } from 'lucide-react';

interface NavbarProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

interface NavLink {
  name: string;
  Icon: LucideIcon;
  href: string;
  /** Solo en el rail de escritorio (la barra móvil mantiene 5 pestañas; en móvil se llega desde el Home) */
  desktopOnly?: boolean;
}

const NAV_LINKS: NavLink[] = [
  { name: 'Inicio', Icon: Home, href: '/' },
  { name: 'Trenes', Icon: TrainFront, href: '/trenes' },
  { name: 'Mapa', Icon: Map, href: '/mapa' },
  { name: 'Buscar', Icon: Search, href: '/buscar' },
  { name: 'Avisos', Icon: TriangleAlert, href: '/avisos', desktopOnly: true },
  { name: 'Ajustes', Icon: Settings, href: '/ajustes' },
];

const MOBILE_LINKS = NAV_LINKS.filter((l) => !l.desktopOnly);

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
  const activeHref = NAV_LINKS.find((l) => l.href === pathname)?.href ?? null;
  // En la barra móvil: -1 si la página actual no tiene pestaña (p. ej. /avisos)
  const activeIndex = MOBILE_LINKS.findIndex((l) => l.href === pathname);

  /** Pulsar la pestaña de la página actual vuelve suavemente arriba */
  const handleClick = (href: string) => {
    if (href === pathname) document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <MotionConfig transition={SPRING}>
      {/* ---------------- ESCRITORIO: rail lateral corporativo ---------------- */}
      <aside
        className="fixed inset-y-0 left-0 z-50 hidden w-[88px] flex-col items-center border-r border-white/5 bg-[#002147] py-5 md:flex rail-short:py-3 dark:bg-[#070d1c]"
      >
        {/* Logo */}
        <Link
          to="/"
          aria-label="Renfe · Inicio"
          onClick={() => handleClick('/')}
          className="block h-12 w-12 shrink-0 rounded-[14px] shadow-lg shadow-black/30 ring-1 ring-white/15 rail-short:h-10 rail-short:w-10 rail-short:rounded-xl"
        >
          <img src="/logo.svg" alt="" className="h-full w-full" />
        </Link>

        <span className="my-5 h-px w-8 shrink-0 bg-white/10 rail-short:my-3" />

        {/* Navegación */}
        {/* Si aun así no cupiera, la lista se desplaza por dentro (sin barra visible) */}
        <nav aria-label="Principal" className="min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex flex-col items-center gap-1 rail-short:gap-0.5">
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
                    title={name}
                    className="group flex w-full flex-col items-center gap-1 rounded-2xl py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-400 rail-short:gap-0.5 rail-short:py-1"
                  >
                    <span className="relative flex h-10 w-12 items-center justify-center rail-short:h-8 rail-tiny:h-9">
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
                      className={`text-[11px] font-bold tracking-tight transition-colors duration-200 rail-short:text-[10px] rail-tiny:sr-only ${
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
          className="mt-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/60 rail-short:mt-2 rail-short:h-9 rail-short:w-9 transition-colors hover:bg-white/10 hover:text-white active:scale-95"
        >
          <ThemeIcon isDarkMode={isDarkMode} size={19} />
        </button>
      </aside>

      {/* ---------------- MÓVIL: tab bar integrada en el borde inferior ----------------
          Fondo opaco exactamente del color de la página (igual que <html> y theme-color): Safari
          toma el color del elemento fijo pegado al borde, y si fuese translúcido caería al blanco
          del contenido. Así la zona tras su barra de direcciones tiene el mismo color que la nav,
          y se funde con la web. Respeta la zona del indicador de inicio del iPhone. */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-[#f8fafc] pb-[env(safe-area-inset-bottom)] md:hidden dark:border-white/[0.07] dark:bg-[#020617]"
      >
        <ul className="relative mx-auto flex max-w-lg px-2">
          {/* Cápsula de la pestaña activa: se desliza solo con transform (barato para la GPU) */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-2 top-2 flex h-8 w-[calc((100%-1rem)/5)] justify-center transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{ transform: `translate3d(${Math.max(0, activeIndex) * 100}%, 0, 0)`, opacity: activeIndex < 0 ? 0 : 1 }}
          >
            <span className="h-full w-14 rounded-full bg-accent-500/15 dark:bg-accent-400/20" />
          </span>

          {MOBILE_LINKS.map(({ name, Icon, href }) => {
            const isActive = href === activeHref;
            return (
              <li key={href} className="relative min-w-0 flex-1">
                <Link
                  to={href}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => handleClick(href)}
                  className="flex flex-col items-center gap-1 pb-2 pt-2 outline-none [-webkit-tap-highlight-color:transparent]"
                >
                  <span className="flex h-8 w-14 items-center justify-center transition-transform duration-150 active:scale-90">
                    <Icon
                      size={21}
                      strokeWidth={isActive ? 2.5 : 2}
                      className={`transition-colors duration-200 ${
                        isActive ? 'text-accent-600 dark:text-accent-400' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    />
                  </span>
                  <span
                    className={`max-w-full truncate text-[11px] leading-none transition-colors duration-200 ${
                      isActive ? 'font-bold text-accent-700 dark:text-accent-300' : 'font-semibold text-slate-500 dark:text-slate-400'
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
    </MotionConfig>
  );
};

export default Navbar;
