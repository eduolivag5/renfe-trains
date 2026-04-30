import { useState, useRef, memo } from 'react';
import { Search, X, Loader2, MapPin, ChevronRight } from 'lucide-react';

interface Estacion { codigo: string; nombre: string; }
type ActiveField = 'origin' | 'destination' | null;

interface StationPanelProps {
  field: ActiveField;
  query: string;
  onQueryChange: (v: string) => void;
  results: Estacion[];
  loading: boolean;
  onSelect: (e: Estacion) => void;
  onClose: () => void;
  mobile?: boolean;
}

export const StationPanel = memo(({ field, query, onQueryChange, results, loading, onSelect, onClose, mobile }: StationPanelProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputVisible, setInputVisible] = useState(!mobile);

  const activateInput = () => {
    setInputVisible(true);
    setTimeout(() => inputRef.current?.focus(), 40);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 font-sans">
      {/* Header Estilo iPhone */}
      <div className={`shrink-0 ${mobile ? 'px-4 pt-14 pb-2' : 'px-4 py-4'}`}>
        <div className="flex items-center justify-between mb-4 px-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {field === 'origin' ? 'Origen' : 'Destino'}
          </h1>
          {/* Botón de cierre iconográfico para ambos casos */}
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 active:scale-90 transition-transform"
          >
            <X size={18} className="text-slate-600 dark:text-slate-300" strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 flex items-center gap-2 bg-slate-100 dark:bg-white/[0.1] rounded-xl px-3 h-10 min-w-0">
            <Search size={18} className="text-slate-500 shrink-0" strokeWidth={2.5} />
            
            <div className="flex-1 min-w-0 flex items-center">
              {mobile && !inputVisible ? (
                <button onPointerDown={activateInput} className="w-full text-left">
                  <span className="text-[17px] text-slate-400 truncate font-normal">Buscar estación</span>
                </button>
              ) : (
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="search"
                  enterKeyHint="search"
                  autoFocus={!mobile}
                  value={query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  placeholder="Buscar estación"
                  className="w-full text-sm bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-400 font-normal"
                />
              )}
            </div>

            {query && (
              <button 
                onPointerDown={() => onQueryChange('')}
                className="bg-slate-300 dark:bg-white/20 rounded-full p-0.5 shrink-0"
              >
                <X size={12} className="text-white dark:text-slate-300" strokeWidth={3} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Resultados / Estado Vacío */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4">
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <Loader2 size={28} className="animate-spin text-blue-500/80" strokeWidth={2} />
          </div>
        ) : results.length > 0 ? (
          <ul className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            {results.map((est) => (
              <li key={est.codigo}>
                <button
                  onPointerDown={() => onSelect(est)}
                  className="w-full flex items-center gap-4 py-4 text-left active:opacity-40 transition-opacity"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/[0.05] flex items-center justify-center shrink-0">
                    <MapPin size={18} className="text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {est.nombre}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 font-normal">
                      Renfe · {est.codigo}
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300" strokeWidth={1.5} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-white/[0.03] flex items-center justify-center mb-4">
              <Search size={28} className="text-slate-200 dark:text-white/10" strokeWidth={2} />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
              {query.length === 0 ? 'Encuentra tu estación' : 'Sin resultados'}
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 font-normal">
              {query.length < 3 
                ? 'Escribe el nombre de la ciudad o la estación para buscar trenes.' 
                : `No hemos encontrado nada para "${query}"`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
});