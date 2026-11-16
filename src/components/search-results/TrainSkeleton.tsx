/** Tarjeta de carga con la misma estructura que TrainCard (etiquetas arriba + horario) */
const TrainSkeleton = () => (
  <div className="rounded-2xl border border-slate-200/80 bg-white px-4 pb-4 pt-3 md:px-5 dark:border-white/[0.07] dark:bg-slate-900/60">
    <div className="mb-3 flex items-center justify-between">
      <span className="h-6 w-28 animate-pulse rounded-full bg-slate-100 dark:bg-white/[0.06]" />
      <span className="h-6 w-20 animate-pulse rounded-full bg-slate-100 dark:bg-white/[0.06]" />
    </div>
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 md:grid-cols-[8.5rem_minmax(0,1fr)_auto] md:gap-x-6">
      <div className="flex items-center gap-2.5 md:flex-col md:items-start md:gap-1.5">
        <span className="h-4 w-14 animate-pulse rounded-md bg-slate-200 dark:bg-white/10" />
        <span className="h-2.5 w-10 animate-pulse rounded-full bg-slate-100 dark:bg-white/[0.06]" />
      </div>
      <span className="col-start-2 row-start-1 h-8 w-8 animate-pulse justify-self-end rounded-full bg-slate-100 md:col-start-3 dark:bg-white/[0.06]" />
      <div className="col-span-2 flex items-center gap-5 md:col-span-1 md:col-start-2 md:row-start-1">
        <span className="h-7 w-16 animate-pulse rounded-lg bg-slate-200 dark:bg-white/10" />
        <span className="flex flex-1 flex-col items-center gap-2">
          <span className="h-2.5 w-14 animate-pulse rounded-full bg-slate-100 dark:bg-white/[0.06]" />
          <span className="h-0.5 w-full animate-pulse rounded-full bg-slate-100 dark:bg-white/[0.06]" />
        </span>
        <span className="h-7 w-16 animate-pulse rounded-lg bg-slate-200 dark:bg-white/10" />
      </div>
    </div>
  </div>
);

export default TrainSkeleton;
