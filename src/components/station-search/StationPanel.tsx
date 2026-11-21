import { memo, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Search, SearchX, TrainFront, X, Star, CornerDownLeft } from 'lucide-react';
import { POPULAR_STATIONS, prettyName, stationPlace, type Estacion } from '../../utils/stationUtils';

type Field = 'origin' | 'destination';

interface StationPanelProps {
  field: Field;
  query: string;
  onQueryChange: (v: string) => void;
  results: Estacion[];
  loading: boolean;
  onSelect: (e: Estacion) => void;
  onClose: () => void;
  /** Código de la estación elegida en el otro campo (no se puede repetir) */
  excludeCode?: string;
  mobile?: boolean;
}

/** Resalta la parte del nombre que coincide con lo escrito (también lo usa el selector de núcleo) */
export const Highlight =({ text, query }: { text: string; query: string }) => {
  const q = query.trim().toLocaleLowerCase('es');
  const i = q.length >= 2 ? text.toLocaleLowerCase('es').indexOf(q) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-[3px] bg-accent-500/15 text-accent-700 dark:bg-accent-400/20 dark:text-accent-300">
        {text.slice(i, i + q.length)}
      </mark>
      {text.slice(i + q.length)}
    </>
  );
};

const SkeletonRow = () => (
  <div className="flex items-center gap-3 px-3 py-3">
    <span className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-slate-100 dark:bg-white/[0.06]" />
    <div className="flex-1 space-y-2">
      <span className="block h-3 w-3/5 animate-pulse rounded-full bg-slate-100 dark:bg-white/[0.06]" />
      <span className="block h-2.5 w-2/5 animate-pulse rounded-full bg-slate-100 dark:bg-white/[0.06]" />
    </div>
  </div>
);

export const StationPanel = memo(
  ({ field, query, onQueryChange, results, loading, onSelect, onClose, excludeCode, mobile }: StationPanelProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const [active, setActive] = useState(0);

    const showPopular = query.trim().length < 3;
    const items = (showPopular ? POPULAR_STATIONS : results).filter((e) => e.codigo !== excludeCode);
    const isOrigin = field === 'origin';

    // En escritorio enfocamos al abrir; en iOS el teclado solo se abre con un toque directo
    useEffect(() => {
      if (!mobile) inputRef.current?.focus();
    }, [mobile]);

    // El elemento activo siempre visible al navegar con el teclado
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
        onSelect(items[active]);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    return (
      <div className={`flex h-full flex-col ${mobile ? 'bg-slate-50 dark:bg-slate-950' : ''}`}>
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
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                {isOrigin ? '¿Desde dónde sales?' : '¿A dónde vas?'}
              </h2>
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
                onQueryChange(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder={isOrigin ? 'Estación o ciudad de origen' : 'Estación o ciudad de destino'}
              aria-label={isOrigin ? 'Buscar estación de origen' : 'Buscar estación de destino'}
              className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 dark:text-white"
            />
            {query && (
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  onQueryChange('');
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
          {!loading && items.length > 0 && (
            <p className="flex items-center gap-1.5 px-3 pb-1.5 pt-1 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
              {showPopular ? (
                <>
                  <Star size={11} strokeWidth={3} /> Estaciones principales
                </>
              ) : (
                `${items.length} ${items.length === 1 ? 'estación' : 'estaciones'}`
              )}
            </p>
          )}

          {loading ? (
            <div>
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : items.length > 0 ? (
            <ul ref={listRef} role="listbox" aria-label="Estaciones">
              {items.map((est, i) => {
                const name = prettyName(est.nombre);
                const place = stationPlace(est);
                const isActive = i === active;
                return (
                  <li key={est.codigo} role="option" aria-selected={isActive} data-index={i}>
                    <button
                      type="button"
                      // Se elige con un toque completo (click), no al apoyar el dedo: así deslizar
                      // la lista para hacer scroll no selecciona nada. mousedown sin efecto por
                      // defecto mantiene el foco en el buscador al hacer clic con el ratón.
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => onSelect(est)}
                      onMouseEnter={() => setActive(i)}
                      className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors ${
                        isActive && !mobile ? 'bg-slate-100 dark:bg-white/[0.06]' : 'active:bg-slate-100 dark:active:bg-white/[0.06]'
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                          isOrigin
                            ? 'bg-accent-500/10 text-accent-600 dark:text-accent-400'
                            : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                        }`}
                      >
                        <TrainFront size={18} strokeWidth={2.25} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-semibold text-slate-900 dark:text-white">
                          <Highlight text={name} query={query} />
                        </span>
                        {place && (
                          <span className="mt-0.5 block truncate text-[12.5px] text-slate-500 dark:text-slate-400">{place}</span>
                        )}
                      </span>
                      {isActive && !mobile ? (
                        <CornerDownLeft size={15} className="shrink-0 text-slate-400" />
                      ) : (
                        <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-slate-400 dark:bg-white/[0.05] dark:text-slate-500">
                          {est.codigo}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/[0.05] dark:text-slate-500">
                <SearchX size={24} />
              </span>
              <p className="text-[15px] font-bold text-slate-900 dark:text-white">Sin resultados</p>
              <p className="mt-1 max-w-[16rem] text-sm text-slate-500 dark:text-slate-400">
                No encontramos estaciones para «{query}». Prueba con el nombre de la ciudad.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  },
);
