import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Map as MapIcon, Radio, ChevronRight } from 'lucide-react';
import DesktopStationSearch from '../components/DesktopStationSearch';
import MobileStationSearch from '../components/MobileStationSearch';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center max-w-5xl mx-auto space-y-10"
    >
      {/* HERO: BUSCADOR CENTRALIZADO */}
      <section className="w-full text-center space-y-12">
        <div className="space-y-4">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white"
          >
            ¿Cuál es tu <span className="text-blue-600">próximo destino</span>?
          </motion.h1>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full"
        >
          <div className="hidden lg:block">
            <DesktopStationSearch />
          </div>

          <div className="block lg:hidden">
            <MobileStationSearch />
          </div>
        </motion.div>
      </section>

      {/* BANNER DEL MAPA EN VIVO */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        onClick={() => navigate('/mapa')}
        className="w-full cursor-pointer group"
      >
        <div className="relative overflow-hidden rounded-[2rem] p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-blue-500/5 hover:shadow-blue-500/10 transition-all duration-300">
          {/* Fondo Decorativo / Animación de Radar */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors duration-500" />
          
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
                <MapIcon size={28} />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-300 border-2 border-blue-600"></span>
                </span>
              </div>
              
              <div className="text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider border border-blue-200 dark:border-blue-800">
                    <Radio size={10} className="animate-pulse" />
                    En vivo
                  </span>
                  <span className="text-slate-400 text-xs font-medium">Real-time GTFS</span>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                  Explora el tráfico ferroviario
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base max-w-md">
                  Visualiza todos los trenes de España moviéndose en tiempo real sobre el mapa interactivo.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm group-hover:gap-5 transition-all">
              Ver mapa completo
              <ChevronRight size={18} />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HomePage;