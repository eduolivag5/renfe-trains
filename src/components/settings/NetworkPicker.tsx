import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, CornerDownLeft, Globe, MapPinned, Search, SearchX, TrainFront, X } from 'lucide-react';
import { FIELD, LABEL, POPOVER, fieldState } from '../station-search/fieldStyles';
import { Highlight } from '../station-search/StationPanel';
import { NETWORK_LIST, RODALIES_NETWORK, networkName } from '../alerts/alertFormat';
import FullScreenSheet from '../../ui/FullScreenSheet';

interface Option {
  /** '' = sin núcleo (avisos de toda España) */
  code: string;
  name: string;
  place: string;
  /** Símbolo mínimo del servicio junto a "Cercanías" / "Rodalies" */
  logo?: string;
}

const NONE: Option = { code: '', name: 'Sin núcleo', place: 'Avisos de toda España' };
const OPTIONS: Option[] = NETWORK_LIST.map(([code, name]) =>
  code === RODALIES_NETWORK
    ? { code, name, place: 'Rodalies', logo: '/new_icons/rodalies_min.svg' }
    : { code, name, place: 'Cercanías', logo: '/new_icons/cercanias_min.svg' },
);

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/* ------------------------------------------------------------------ */
/* Panel: buscador + lista (mismo diseño que el de estaciones)          */
/* ------------------------------------------------------------------ */

const NetworkPanel = ({
  value,
  onSelect,
  onClose,
  mobile,
}: {
  value: string | null;
  onSelect: (code: string) => void;
  onClose: () => void;
  mobile?: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const searching = query.trim().length > 0;
  const items = useMemo(() => {
    if (!searching) return value ? [NONE, ...OPTIONS] : OPTIONS;
    const q = normalize(query.trim());
    return OPTIONS.filter((o) => normalize(`${o.name} ${o.place} ${o.code}`).includes(q));
  }, [query, searching, value]);

  // En escritorio enfocamos al abrir; en iOS el teclado solo se abre con un toque directo
  useEffect(() => {
    if (!mobile) inputRef.current?.focus();
  }, [mobile]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && items[active]) {
      e.preventDefault();
      onSelect(items[active].code);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className={`flex h-full min-h-0 flex-col ${mobile ? 'bg-slate-50 dark:bg-slate-950' : ''}`}>
      {/* Cabecera + buscador */}
      <div className={`shrink-0 ${mobile ? 'px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]' : 'p-3'}`}>
        {mobile && (
          <div className="mb-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Volver"
              className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-slate-600 active:bg-slate-200 dark:text-slate-300 dark:active:bg-white/10"
            >
              <ArrowLeft size={22} />
            </button>
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">¿Cuál es tu núcleo?</h2>
          </div>
        )}

        <div className="flex h-12 items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <Search size={18} className="shrink-0 text-slate-400" strokeWidth={2.5} />
          <input
            ref={inputRef}
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Ciudad o comunidad"
            aria-label="Buscar núcleo"
            className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 dark:text-white"
          />
          {query && (
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                setQuery('');
                setActive(0);
                inputRef.current?.focus();
              }}
              aria-label="Borrar"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500 dark:bg-white/15 dark:text-slate-300"
            >
              <X size={12} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${mobile ? 'px-2 pb-8' : 'px-1.5 pb-1.5'}`}>
        {items.length > 0 ? (
          <>
            <p className="flex items-center gap-1.5 px-3 pb-1.5 pt-1 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
              {searching ? (
                `${items.length} ${items.length === 1 ? 'núcleo' : 'núcleos'}`
              ) : (
                <>
                  <MapPinned size={11} strokeWidth={3} /> Núcleos de Cercanías y Rodalies
                </>
              )}
            </p>
            <ul ref={listRef} role="listbox" aria-label="Núcleos">
              {items.map((o, i) => {
                const isActive = i === active;
                const selected = (value ?? '') === o.code;
                return (
                  <li key={o.code || 'none'} role="option" aria-selected={selected} data-index={i}>
                    <button
                      type="button"
                      // Se elige con un toque completo (click), no al apoyar el dedo: así deslizar
                      // la lista para hacer scroll no selecciona nada. mousedown sin efecto por
                      // defecto mantiene el foco en el buscador al hacer clic con el ratón.
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => onSelect(o.code)}
                      onMouseEnter={() => setActive(i)}
                      className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors ${
                        isActive && !mobile ? 'bg-slate-100 dark:bg-white/[0.06]' : 'active:bg-slate-100 dark:active:bg-white/[0.06]'
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          o.code
                            ? 'bg-accent-500/10 text-accent-600 dark:text-accent-400'
                            : 'bg-slate-500/10 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {o.code ? <TrainFront size={18} strokeWidth={2.25} /> : <Globe size={18} strokeWidth={2.25} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-semibold text-slate-900 dark:text-white">
                          <Highlight text={o.name} query={query} />
                        </span>
                        <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[12.5px] text-slate-500 dark:text-slate-400">
                          {o.logo && <img src={o.logo} alt="" aria-hidden width={14} height={14} className="h-3.5 w-3.5 shrink-0" />}
                          <span className="truncate">{o.place}</span>
                        </span>
                      </span>
                      {selected ? (
                        <Check size={16} strokeWidth={3} className="shrink-0 text-accent-600 dark:text-accent-400" />
                      ) : isActive && !mobile ? (
                        <CornerDownLeft size={15} className="shrink-0 text-slate-400" />
                      ) : (
                        o.code && (
                          <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-slate-400 dark:bg-white/[0.05] dark:text-slate-500">
                            {o.code}
                          </span>
                        )
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/[0.05] dark:text-slate-500">
              <SearchX size={24} />
            </span>
            <p className="text-[15px] font-bold text-slate-900 dark:text-white">Sin resultados</p>
            <p className="mt-1 max-w-[16rem] text-sm text-slate-500 dark:text-slate-400">
              No hay ningún núcleo para «{query}». Prueba con el nombre de la ciudad.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Selector: campo + popover (escritorio) / pantalla completa (móvil)   */
/* ------------------------------------------------------------------ */

/**
 * Selector de "Mi núcleo" con el mismo diseño y comportamiento que los campos Origen/Destino
 * de /buscar: campo con etiqueta, popover con buscador en escritorio y panel a pantalla
 * completa en móvil. `onChange('')` quita el núcleo.
 */
const NetworkPicker = ({ value, onChange }: { value: string | null; onChange: (code: string) => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  // Cerrar al pulsar fuera (escritorio) o con Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (window.innerWidth < 768) return; // en móvil el panel es a pantalla completa
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const select = (code: string) => {
    onChange(code);
    setOpen(false);
  };

  const panel = (mobile = false) => (
    <NetworkPanel value={value} onSelect={select} onClose={() => setOpen(false)} mobile={mobile} />
  );

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className={`${FIELD} ${fieldState(open)}`}>
        <span className={LABEL}>Mi núcleo</span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={value ?? 'empty'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className={`block w-full truncate text-[16px] font-bold leading-snug ${
              value ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-600'
            }`}
          >
            {value ? networkName(value) : 'Elige núcleo'}
          </motion.span>
        </AnimatePresence>
      </button>

      {/* Escritorio: popover anclado bajo el campo */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="network"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className={`${POPOVER} left-0 hidden max-h-[440px] w-[min(26rem,calc(100vw-3rem))] origin-top-left md:flex md:flex-col`}
          >
            {panel()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Móvil: pantalla completa, como Origen/Destino en /buscar (el teclado no tapa la lista) */}
      <FullScreenSheet open={open}>{panel(true)}</FullScreenSheet>
    </div>
  );
};

export default NetworkPicker;
