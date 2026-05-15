import React from 'react';
import { Train, ChevronDown, Activity, Search, Map, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative w-full h-[100dvh] flex flex-col items-center justify-center px-6 bg-white dark:bg-[#020617] transform-gpu">
      
      {/* --- FONDO ULTRA-LIGERO --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden translate-z-0">
        {/* Rejilla estática optimizada */}
        <div className="absolute inset-0 opacity-[0.15] dark:opacity-[0.08]
          bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] 
          bg-[size:40px_40px] md:bg-[size:50px_50px]" 
        />
      </div>

      {/* --- CONTENIDO --- */}
      <div className="relative z-20 flex flex-col items-center max-w-4xl w-full text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-8">
          <Radio size={12} className="animate-pulse" /> Live Infrastructure
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
          Red ferroviaria,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-violet-400">
            tiempo real.
          </span>
        </h1>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 w-full max-w-[90vw] sm:max-w-none">
           <button 
            onClick={() => document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex-1 w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold active:scale-95 transition-transform shadow-lg shadow-blue-500/5"
           >
              <Search size={18} />
              <span>Empezar búsqueda</span>
           </button>
           
           <button 
            onClick={() => navigate('/mapa')}
            className="flex-1 w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl font-bold active:scale-95 transition-transform"
           >
              <Map size={18} />
              <span>Ver Mapa Vivo</span>
           </button>
        </div>
      </div>

      {/* INDICADORES (Solo visibles en Desktop para ahorrar nodos en móvil) */}
      <div className="absolute inset-0 pointer-events-none z-10 hidden lg:block translate-z-0">
        <div className="absolute top-[20%] left-[8%] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-3 rounded-xl">
          <div className="flex items-center gap-3">
            <Activity size={14} className="text-emerald-500" />
            <span className="text-[10px] font-bold dark:text-white/80 uppercase">AVE S-103 · 284km/h</span>
          </div>
        </div>

        <div className="absolute bottom-[35%] right-[8%] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-3 rounded-xl">
          <div className="flex items-center gap-3">
            <Train size={14} className="text-blue-500" />
            <span className="text-[10px] font-bold dark:text-white/80 uppercase">P. de Atocha · Vía 4</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 opacity-40">
        <ChevronDown size={16} strokeWidth={3} />
      </div>

    </section>
  );
};

export default HeroSection;