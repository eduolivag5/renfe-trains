import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Bell, CreditCard, Lock } from 'lucide-react';

interface SettingsPageProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ isDarkMode, toggleTheme }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-12 pb-12"
    >
      {/* HEADER LIMPIO */}
      <header>
        <h1 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white">
          Ajustes
        </h1>
        <p className="mt-2 text-slate-400 dark:text-slate-500 font-medium">
          Configuración de cuenta y sistema
        </p>
      </header>

      {/* SECCIÓN: CUENTA */}
      <section className="space-y-4">
        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600 dark:text-blue-500">
          Perfil de usuario
        </h2>
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          <MinimalField label="Nombre completo" value="Alejandro Renfe" />
          <MinimalField label="Correo electrónico" value="alejandro@renfe.es" />
          <MinimalField label="Método de pago" value="Visa •••• 4242" icon={<CreditCard size={14} />} />
        </div>
      </section>

      {/* SECCIÓN: PREFERENCIAS */}
      <section className="space-y-4">
        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600 dark:text-blue-500">
          Preferencias
        </h2>
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          
          {/* MODO OSCURO */}
          <div className="flex items-center justify-between py-6">
            <div>
              <p className="text-[16px] text-slate-800 dark:text-slate-100 font-semibold">Tema oscuro</p>
            </div>
            <button 
                onClick={toggleTheme}
                className={`
                    relative w-11 h-6 rounded-full transition-all duration-300
                    flex items-center 
                    ${isDarkMode ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}
                `}
            >
                <motion.div 
                    animate={{ x: isDarkMode ? 24 : 4 }}
                    className="w-4 h-4 bg-white rounded-full shadow-sm"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            </button>        
          </div>

          {/* IDIOMA (Bloqueado) */}
          <StaticRow 
            label="Idioma de la interfaz" 
            value="Español" 
            description="Ajuste predefinido por el sistema"
            icon={<Globe size={18} />}
          />

          {/* NOTIFICACIONES (Bloqueado) */}
          <StaticRow 
            label="Notificaciones Push" 
            value="Deshabilitadas" 
            description="Las notificaciones están desactivadas permanentemente"
            icon={<Bell size={18} />}
          />

          {/* MONEDA (Bloqueado) */}
          <StaticRow 
            label="Moneda" 
            value="Euro (EUR)" 
            description="Moneda por defecto para transacciones"
            icon={<CreditCard size={18} />}
          />
        </div>
      </section>

      {/* FOOTER DE SESIÓN */}
      <footer className="pt-8">
        <button className="text-red-500 dark:text-red-400 text-sm font-bold hover:opacity-70 transition-opacity">
          Cerrar sesión en este dispositivo
        </button>
      </footer>
    </motion.div>
  );
};

/* COMPONENTES DE APOYO */

const MinimalField = ({ label, value, icon }: { label: string, value: string, icon?: React.ReactNode }) => (
  <div className="py-6 flex justify-between items-baseline group">
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
      <div className="flex items-center gap-2">
        {icon && <span className="text-slate-400">{icon}</span>}
        <p className="text-[16px] text-slate-800 dark:text-slate-100 font-medium">{value}</p>
      </div>
    </div>
    <button className="text-[11px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
      Editar
    </button>
  </div>
);

const StaticRow = ({ label, value, description, icon }: any) => (
  <div className="py-6 flex justify-between items-center opacity-80">
    <div className="space-y-0.5">
      <p className="text-[16px] text-slate-800 dark:text-slate-100 font-semibold flex items-center gap-2">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
      </p>
      {/* Oculto en móvil, visible en md (Desktop) */}
      <p className="hidden md:block text-sm text-slate-400 dark:text-slate-500">{description}</p>
    </div>
    <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-white/5">
      <Lock size={12} className="text-slate-400" />
      <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{value}</span>
    </div>
  </div>
);

export default SettingsPage;