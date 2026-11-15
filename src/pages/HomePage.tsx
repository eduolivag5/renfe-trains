import { Search, Sparkles } from 'lucide-react';
import StationSearch from '../components/station-search/StationSearch';
import HeroSection from '../components/home/HeroSection';
import TrainFamilies from '../components/home/TrainFamilies';
import LiveNetwork from '../components/home/LiveNetwork';
import AppFeatures from '../components/home/AppFeatures';
import PopularRoutes from '../components/search-results/PopularRoutes';

const HomePage = () => {
  return (
    <div className="flex flex-col w-full bg-white dark:bg-[#020617] space-y-16 overflow-x-hidden">
      
      <HeroSection />

      <div id="search-section" className="relative z-30 w-full max-w-7xl mx-auto py-12 px-6 space-y-40 [content-visibility:auto] [contain-intrinsic-size:1000px]">
        
        {/* SECCIÓN DE BÚSQUEDA REFORZADA */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center">

          {/* TEXTO: Debajo en móvil con estilo minimalista, normal en PC */}
          <div className="order-1 lg:order-1 space-y-4 lg:space-y-6 text-left lg:text-left px-2 lg:px-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-500/10 text-accent-600 dark:text-accent-400 text-[11px] font-bold uppercase tracking-widest">
              <Search size={14} /> Planificador
            </div>
            
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none lg:leading-[1.1]">
              Tu próximo <span className="text-accent-600">trayecto</span>, <br className="hidden lg:block" /> a un click.
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

        {/* RUTAS POPULARES */}
        <section className="-mt-24 space-y-6">
          <h2 className="flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            <Sparkles size={13} /> Rutas populares · trenes de hoy
          </h2>
          <PopularRoutes />
        </section>

        {/* CÓMO FUNCIONAN LOS TRENES */}
        <TrainFamilies />

        {/* LA RED EN DIRECTO */}
        <LiveNetwork />

        {/* QUÉ SE PUEDE HACER EN LA WEB */}
        <AppFeatures />
      </div>
    </div>
  );
};

export default HomePage;