import React, { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  Check,
  Clock3,
  Database,
  Globe,
  HardDrive,
  Layers,
  Lock,
  Moon,
  RefreshCw,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sun,
  type LucideIcon,
} from 'lucide-react';
import { getPref, removePref, setPref } from '../utils/preferences';
import { usePref } from '../hooks/usePref';
import { networkName } from '../components/alerts/alertFormat';
import NetworkPicker from '../components/settings/NetworkPicker';
import { Eyebrow } from '../ui/heading';
import { HEADING, LEAD } from '../ui/headingStyles';

interface SettingsPageProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  /** Borra las preferencias guardadas en este navegador */
  onReset: () => void;
}

/* ------------------------------------------------------------------ */
/* Animación de entrada escalonada                                     */
/* ------------------------------------------------------------------ */

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

/* ------------------------------------------------------------------ */
/* Piezas reutilizables                                                */
/* ------------------------------------------------------------------ */

const CARD =
  'overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(2,33,71,0.04),0_8px_24px_-12px_rgba(2,33,71,0.08)] dark:border-white/[0.07] dark:bg-slate-900/60 dark:shadow-none';

/** Icono en baldosa de color, como en los ajustes de iOS */
const IconTile: React.FC<{ Icon: LucideIcon; className: string }> = ({ Icon, className }) => (
  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${className}`}>
    <Icon size={17} strokeWidth={2.25} />
  </span>
);

const Section: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({
  title,
  description,
  children,
}) => (
  <motion.section variants={item} className="space-y-3">
    <div className="px-1">
      <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{title}</h2>
      {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
    </div>
    <div className={CARD}>
      <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">{children}</div>
    </div>
  </motion.section>
);

interface RowProps {
  Icon: LucideIcon;
  tile: string;
  label: string;
  description?: string;
  children?: React.ReactNode;
}

const Row: React.FC<RowProps> = ({ Icon, tile, label, description, children }) => (
  <div className="flex items-center gap-4 px-4 py-4 sm:px-5">
    <IconTile Icon={Icon} className={tile} />
    <div className="min-w-0 flex-1">
      <p className="truncate text-[15px] font-semibold text-slate-900 dark:text-white">{label}</p>
      {description && <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">{description}</p>}
    </div>
    {children}
  </div>
);

/** Valor fijo (no configurable) */
const LockedValue: React.FC<{ value: string }> = ({ value }) => (
  <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[12px] font-bold text-slate-500 dark:bg-white/[0.06] dark:text-slate-400">
    <Lock size={11} strokeWidth={2.5} />
    {value}
  </span>
);

/** Interruptor accesible estilo iOS */
const Switch: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
      checked ? 'bg-accent-600 dark:bg-accent-500' : 'bg-slate-200 dark:bg-white/15'
    }`}
  >
    <span
      className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

/* ------------------------------------------------------------------ */
/* Selector de tema con mini vista previa                              */
/* ------------------------------------------------------------------ */

const ThemePreview: React.FC<{ dark: boolean }> = ({ dark }) => (
  <div aria-hidden className={`flex h-24 w-full gap-1.5 overflow-hidden rounded-2xl p-2 ${dark ? 'bg-[#020617]' : 'bg-slate-100'}`}>
    <div className="flex w-5 flex-col items-center gap-1 rounded-lg bg-[#002147] py-1.5">
      <span className="h-2 w-2 rounded-[3px] bg-gradient-to-br from-accent-500 to-accent-900" />
      <span className="mt-1 h-1 w-2.5 rounded-full bg-white/40" />
      <span className="h-1 w-2.5 rounded-full bg-white/40" />
      <span className="h-1 w-2.5 rounded-full bg-white/40" />
    </div>
    <div className="flex flex-1 flex-col gap-1.5 py-0.5">
      <span className={`h-2 w-3/5 rounded-full ${dark ? 'bg-white/80' : 'bg-slate-800'}`} />
      <span className={`h-1.5 w-4/5 rounded-full ${dark ? 'bg-white/25' : 'bg-slate-300'}`} />
      <div className={`mt-auto flex-1 rounded-lg ${dark ? 'bg-slate-800/80' : 'bg-white'} p-1.5`}>
        <span className="block h-1.5 w-1/2 rounded-full bg-accent-500" />
        <span className={`mt-1 block h-1 w-3/4 rounded-full ${dark ? 'bg-white/20' : 'bg-slate-200'}`} />
      </div>
    </div>
  </div>
);

const ThemeOption: React.FC<{ dark: boolean; selected: boolean; onSelect: () => void }> = ({ dark, selected, onSelect }) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    onClick={onSelect}
    className={`group relative flex flex-col gap-3 rounded-[22px] border-2 p-2.5 text-left transition duration-200 active:scale-[0.98] ${
      selected
        ? 'border-accent-600 bg-accent-50/60 dark:border-accent-500 dark:bg-accent-500/10'
        : 'border-transparent bg-slate-50 hover:border-slate-200 dark:bg-white/[0.03] dark:hover:border-white/10'
    }`}
  >
    <ThemePreview dark={dark} />
    <div className="flex items-center justify-between px-1.5 pb-0.5">
      <span className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
        {dark ? <Moon size={15} /> : <Sun size={15} />}
        {dark ? 'Oscuro' : 'Claro'}
      </span>
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full transition ${
          selected ? 'scale-100 bg-accent-600 text-white dark:bg-accent-500' : 'scale-90 border-2 border-slate-300 dark:border-white/20'
        }`}
      >
        {selected && <Check size={12} strokeWidth={3.5} />}
      </span>
    </div>
  </button>
);

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

const SettingsPage: React.FC<SettingsPageProps> = ({ isDarkMode, toggleTheme, onReset }) => {
  const [showLegend, setShowLegend] = useState(() => getPref('mapLegend') !== 'hidden');
  const [resetDone, setResetDone] = useState(false);
  const nucleo = usePref('nucleo');

  const setTheme = (dark: boolean) => {
    if (dark !== isDarkMode) toggleTheme();
  };

  const changeLegend = (visible: boolean) => {
    setShowLegend(visible);
    setPref('mapLegend', visible ? 'visible' : 'hidden');
  };

  const reset = () => {
    onReset();
    setShowLegend(true);
    setResetDone(true);
    setTimeout(() => setResetDone(false), 2500);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-10 pb-12">
      {/* Cabecera */}
      <motion.header variants={item} className="max-w-2xl space-y-4">
        <Eyebrow icon={Settings}>Ajustes</Eyebrow>
        <h1 className={HEADING.page}>Preferencias</h1>
        <p className={LEAD}>
          Ajusta cómo se ve la aplicación. No necesitas cuenta: todo se guarda solo en este navegador.
        </p>
      </motion.header>

      {/* Secciones: dos columnas en pantallas anchas, mismo ancho máximo que el resto de páginas */}
      <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-x-8 [&>*]:min-w-0">
      {/* Apariencia */}
      <motion.section variants={item} className="space-y-3">
        <div className="px-1">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Apariencia</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Elige el tema de la aplicación.</p>
        </div>
        <div role="radiogroup" aria-label="Tema" className={`grid grid-cols-2 gap-3 p-3 ${CARD}`}>
          <ThemeOption dark={false} selected={!isDarkMode} onSelect={() => setTheme(false)} />
          <ThemeOption dark selected={isDarkMode} onSelect={() => setTheme(true)} />
        </div>
      </motion.section>

      {/* Avisos */}
      {/* Sin overflow-hidden en la tarjeta (el popover del selector sale de ella) y por encima de
          las secciones siguientes */}
      <motion.section variants={item} className="relative z-20 space-y-3">
        <div className="px-1">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Avisos</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {nucleo
              ? `El contador y la página de avisos se centran en ${networkName(nucleo)}.`
              : 'Elige tu núcleo de Cercanías o Rodalies para ver primero sus avisos.'}
          </p>
        </div>
        <div className={`p-2 ${CARD.replace('overflow-hidden ', '')}`}>
          <NetworkPicker value={nucleo} onChange={(code) => (code ? setPref('nucleo', code) : removePref('nucleo'))} />
        </div>
      </motion.section>

      {/* Mapa */}
      <Section title="Mapa en vivo">
        <Row
          Icon={Layers}
          tile="bg-accent-500/10 text-accent-600 dark:text-accent-400"
          label="Mostrar leyenda en el mapa"
          description="Panel con el total de trenes, la hora y el reparto por tipo."
        >
          <Switch checked={showLegend} onChange={changeLegend} label="Mostrar leyenda en el mapa" />
        </Row>
        <Row
          Icon={RefreshCw}
          tile="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          label="Actualización de posiciones"
          description="Las posiciones de los trenes se refrescan automáticamente."
        >
          <LockedValue value="30 s" />
        </Row>
      </Section>

      {/* Región */}
      <Section title="Región">
        <Row Icon={Globe} tile="bg-accent-500/10 text-accent-600 dark:text-accent-400" label="Idioma" description="Idioma de la interfaz.">
          <LockedValue value="Español" />
        </Row>
        <Row
          Icon={Clock3}
          tile="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          label="Zona horaria"
          description="Los horarios se muestran en hora peninsular."
        >
          <LockedValue value="Europe/Madrid" />
        </Row>
      </Section>

      {/* Datos */}
      <Section title="Datos">
        <Row
          Icon={Database}
          tile="bg-slate-500/10 text-slate-600 dark:text-slate-300"
          label="Fuente de datos"
          description="Horarios y posiciones a partir de los datos abiertos GTFS de Renfe."
        />
      </Section>

      {/* Privacidad */}
      <Section title="Privacidad">
        <Row
          Icon={ShieldCheck}
          tile="bg-accent-500/10 text-accent-600 dark:text-accent-400"
          label="Sin cuentas ni registro"
          description="La aplicación no pide datos personales ni inicio de sesión."
        />
        <Row
          Icon={HardDrive}
          tile="bg-slate-500/10 text-slate-600 dark:text-slate-300"
          label="Preferencias locales"
          description="El tema, la leyenda del mapa, tu núcleo y tus trayectos se guardan solo en este navegador."
        >
          <button
            type="button"
            onClick={reset}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors active:scale-95 ${
              resetDone
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/10'
            }`}
          >
            {resetDone ? <Check size={14} strokeWidth={2.75} /> : <RotateCcw size={14} strokeWidth={2.5} />}
            {resetDone ? 'Restablecido' : 'Restablecer'}
          </button>
        </Row>
      </Section>
      </div>
    </motion.div>
  );
};

export default SettingsPage;
