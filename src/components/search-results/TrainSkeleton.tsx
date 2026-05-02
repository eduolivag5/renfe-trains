const TrainSkeleton = () => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl p-5 flex flex-col gap-4 animate-pulse shadow-sm">
      {/* Header del Skeleton: Logo y Tipo de Tren */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Espacio para el Icono */}
          <div className="w-8 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          {/* Espacio para el texto del tipo de tren */}
          <div className="w-16 h-3 bg-slate-200 dark:bg-slate-800 rounded-full" />
        </div>
        {/* Badge opcional (ej. "Más rápido") */}
        <div className="w-20 h-4 bg-slate-100 dark:bg-slate-800/50 rounded-full" />
      </div>

      {/* Body del Skeleton: Horarios y Trayecto */}
      <div className="flex items-center justify-between px-1 mt-2">
        {/* Salida */}
        <div className="space-y-2">
          <div className="w-14 h-7 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="w-8 h-2 bg-slate-100 dark:bg-slate-800 rounded-full" />
        </div>

        {/* Línea de tiempo / Duración */}
        <div className="flex flex-col items-center flex-1 px-8 space-y-3">
          {/* Tiempo estimado */}
          <div className="w-12 h-3 bg-slate-200 dark:bg-slate-800 rounded-full" />
          {/* Línea visual */}
          <div className="w-full h-[2px] bg-slate-100 dark:bg-slate-800 rounded-full" />
        </div>

        {/* Llegada */}
        <div className="space-y-2 flex flex-col items-end">
          <div className="w-14 h-7 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="w-8 h-2 bg-slate-100 dark:bg-slate-800 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default TrainSkeleton;