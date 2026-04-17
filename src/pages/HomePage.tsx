import { motion } from 'framer-motion';
import DesktopStationSearch from '../components/DesktopStationSearch';
import MobileStationSearch from '../components/MobileStationSearch'; // Importa el de móviles

const HomePage = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center max-w-6xl mx-auto px-6"
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
          {/* --- DECISIÓN DE DISPOSITIVO --- */}
          
          {/* Versión PC: Se muestra solo en pantallas grandes (lg y superiores) */}
          <div className="hidden lg:block">
            <DesktopStationSearch />
          </div>

          {/* Versión Móvil/Tablet: Se muestra hasta llegar a resolución desktop (lg) */}
          <div className="block lg:hidden">
            <MobileStationSearch />
          </div>
          
        </motion.div>
      </section>
    </motion.div>
  );
};

export default HomePage;