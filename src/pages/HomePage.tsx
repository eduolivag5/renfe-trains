import { useNavigate } from 'react-router-dom';
import { 
  Map as MapIcon, ChevronRight, Clock, ShieldCheck, 
  Zap, Compass, AlertTriangle, Search
} from 'lucide-react';
import StationSearch from '../components/station-search/StationSearch';
import HeroSection from '../components/home/HeroSection';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col w-full bg-white dark:bg-[#020617] space-y-16 overflow-x-hidden">
      
      <HeroSection />

      <div id="search-section" className="relative z-30 w-full max-w-7xl mx-auto py-12 px-6 space-y-40 [content-visibility:auto] [contain-intrinsic-size:1000px]">
        
        {/* SECCIÓN DE BÚSQUEDA REFORZADA */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center">

          {/* TEXTO: Debajo en móvil con estilo minimalista, normal en PC */}
          <div className="order-1 lg:order-1 space-y-4 lg:space-y-6 text-left lg:text-left px-2 lg:px-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-bold uppercase tracking-widest">
              <Search size={14} /> Planificador
            </div>
            
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none lg:leading-[1.1]">
              Tu próximo <span className="text-blue-600">trayecto</span>, <br className="hidden lg:block" /> a un click.
            </h2>
            
            <p className="text-slate-500 dark:text-slate-400 text-base md:text-xl max-w-xl leading-relaxed">
              Horarios actualizados y disponibilidad en tiempo real en toda la red nacional.
            </p>
            
            {/* Indicadores: Ocultos en móvil para limpiar la interfaz, visibles en LG */}
            <div className="hidden lg:flex items-center gap-6 pt-4 text-slate-400">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">GTFS</span>
                <span className="text-[10px] uppercase font-bold tracking-tighter">Protocolo Oficial</span>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-white/10" />
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">24/7</span>
                <span className="text-[10px] uppercase font-bold tracking-tighter">Tiempo Real</span>
              </div>
            </div>
          </div>
          
          {/* BUSCADOR: Primero en móvil (order-1), segundo en PC (lg:order-2) */}
          <div className="order-2 lg:order-2 will-change-transform">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl border border-slate-100 dark:border-white/5 p-1.5 ring-1 ring-slate-200/50 dark:ring-white/5">
              <StationSearch />
            </div>
          </div>         

        </section>

        {/* RESTO DE COMPONENTES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div 
            onClick={() => navigate('/mapa')}
            className="lg:col-span-2 group relative overflow-hidden rounded-[2.5rem] md:rounded-[3rem] p-10 bg-slate-950 shadow-2xl cursor-pointer transform-gpu"
          >
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-[500px] h-[500px] bg-blue-600/10 rounded-full" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between h-full gap-10">
              <div className="space-y-6 text-center md:text-left">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-[1.5rem] md:rounded-[2rem] bg-blue-600 flex items-center justify-center text-white">
                  <MapIcon size={32} />
                </div>
                <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter">Explora el Mapa</h3>
                <p className="text-slate-400 max-w-md text-lg md:text-xl leading-relaxed">
                  Cartografía ferroviaria en tiempo real.
                </p>
              </div>
              <div className="px-10 py-5 bg-white text-slate-950 rounded-2xl font-black text-lg flex items-center gap-3 active:scale-95 transition-transform">
                Abrir <ChevronRight size={24} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 p-10 rounded-[2.5rem] md:rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-2xl flex flex-col justify-between transform-gpu">
            <div className="space-y-8">
              <div className="p-4 w-fit rounded-2xl bg-emerald-500/10 text-emerald-500">
                <ShieldCheck size={32} />
              </div>
              <div className="space-y-3">
                <h4 className="text-3xl font-black dark:text-white tracking-tight">Estado Red</h4>
                <p className="text-slate-500 dark:text-slate-400 text-lg leading-snug">Sin incidencias en la infraestructura.</p>
              </div>
            </div>
            <div className="mt-10 pt-8 border-t border-slate-50 dark:border-white/5 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span className="flex items-center gap-2"><Clock size={14} /> 12:45 UTC</span>
              <span className="text-emerald-500 font-bold">Sync OK</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-20 border-t border-slate-100 dark:border-white/10">
          {[
            { icon: <Zap size={28} />, title: "Velocidad", color: "text-blue-500" },
            { icon: <Compass size={28} />, title: "Precisión", color: "text-purple-500" },
            { icon: <AlertTriangle size={28} />, title: "Alertas", color: "text-amber-500" }
          ].map((f, i) => (
            <div key={i} className="flex flex-col gap-4">
              <div className={`${f.color} opacity-80`}>{f.icon}</div>
              <h4 className="text-xl font-black dark:text-white uppercase tracking-tight">{f.title}</h4>
              <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed">
                Datos oficiales directos de los nodos de infraestructura.
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;