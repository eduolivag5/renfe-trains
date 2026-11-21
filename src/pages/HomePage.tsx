import { Search, Sparkles } from 'lucide-react';
import StationSearch from '../components/station-search/StationSearch';
import HeroSection from '../components/home/HeroSection';
import TrainFamilies from '../components/home/TrainFamilies';
import LiveNetwork from '../components/home/LiveNetwork';
import HomeAlerts from '../components/home/HomeAlerts';
import AppFeatures from '../components/home/AppFeatures';
import PopularRoutes from '../components/search-results/PopularRoutes';
import SavedTrips from '../components/search-results/SavedTrips';
import { Eyebrow } from '../ui/heading';
import { HEADING, LEAD } from '../ui/headingStyles';

const HomePage = () => {
  return (
    <div className="flex w-full flex-col space-y-16 overflow-x-hidden bg-white [--page-bg:#fff] dark:bg-[#020617] dark:[--page-bg:#020617]">
      <HeroSection />

      <div id="search-section" className="relative z-30 mx-auto w-full max-w-page space-y-28 px-page py-12 compact:space-y-20">
        {/* PLANIFICADOR + RUTAS POPULARES */}
        <div className="space-y-12 compact:space-y-8">
          {/* SECCIÓN DE BÚSQUEDA REFORZADA */}
          <section className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16">

            {/* TEXTO: Debajo en móvil con estilo minimalista, normal en PC */}
            <div className="order-1 max-w-2xl space-y-3 text-left">
              <Eyebrow icon={Search}>Planificador</Eyebrow>

              <h2 className={HEADING.section}>
                Tu próximo trayecto, <br className="hidden lg:block" /> a un click.
              </h2>

              <p className={LEAD}>
                Horarios actualizados y disponibilidad en tiempo real en toda la red nacional.
              </p>

              {/* Indicadores: Ocultos en móvil para limpiar la interfaz, visibles en LG */}
              <div className="hidden items-center gap-6 pt-2 text-slate-400 lg:flex">
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
            <div className="order-2 lg:order-2">
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl border border-slate-100 dark:border-white/5 p-1.5 ring-1 ring-slate-200/50 dark:ring-white/5">
                <StationSearch />
              </div>
            </div>

          </section>

          {/* TUS TRAYECTOS (favoritos y recientes; solo si hay alguno) */}
          <SavedTrips />

          {/* RUTAS POPULARES */}
          <section className="space-y-4">
            <h2 className="flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              <Sparkles size={13} /> Rutas populares · trenes de hoy
            </h2>
            <PopularRoutes />
          </section>
        </div>

        {/* CÓMO FUNCIONAN LOS TRENES */}
        <div className="cv-section">
          <TrainFamilies compact />
        </div>

        {/* LA RED EN DIRECTO */}
        {/* -mx-6 px-6: content-visibility recorta lo que sobresale; el trazado de vías decorativo sobresale 24 px */}
        <div className="cv-section -mx-6 px-6">
          <LiveNetwork />
        </div>

        {/* AVISOS DEL SERVICIO */}
        <div className="cv-section">
          <HomeAlerts />
        </div>

        {/* QUÉ SE PUEDE HACER EN LA WEB */}
        <div className="cv-section">
          <AppFeatures />
        </div>
      </div>
    </div>
  );
};

export default HomePage;