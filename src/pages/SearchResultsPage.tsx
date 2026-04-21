import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Timer, TrainFront } from 'lucide-react';
import { format, differenceInMinutes, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { trainsService, type TrainSearchResult } from '../api/trainsService';

// Componente Interno para el Esqueleto
const TrainSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl p-4 flex flex-col gap-3 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="w-16 h-3 bg-slate-200 dark:bg-slate-800 rounded-full" />
      </div>
      <div className="w-20 h-4 bg-slate-200 dark:bg-slate-800 rounded-full" />
    </div>
    <div className="flex items-center justify-between px-1 mt-2">
      <div className="space-y-2">
        <div className="w-14 h-7 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="w-8 h-2 bg-slate-100 dark:bg-slate-800 rounded-full" />
      </div>
      <div className="flex flex-col items-center flex-1 px-8 space-y-3">
        <div className="w-12 h-3 bg-slate-200 dark:bg-slate-800 rounded-full" />
        <div className="w-full h-[2px] bg-slate-100 dark:bg-slate-800 rounded-full" />
      </div>
      <div className="space-y-2 flex flex-col items-end">
        <div className="w-14 h-7 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="w-8 h-2 bg-slate-100 dark:bg-slate-800 rounded-full" />
      </div>
    </div>
  </div>
);

// ... (TRAIN_BRAND_MAP y getTrainIdentity se mantienen igual)
const TRAIN_BRAND_MAP: Record<string, { logo: string; color: string }> = {
  'AVE': { logo: 'AVE', color: '#002147' },
  'AVE INT': { logo: 'AVE', color: '#002147' },
  'AVLO': { logo: 'AVLO', color: '#4d148c' },
  'ALVIA': { logo: 'ALVIA', color: '#002147' },
  'EUROMED': { logo: 'EUROMED', color: '#002147' },
  'INTERCITY': { logo: 'INTERCITY', color: '#002147' },
  'AVANT': { logo: 'AVANT', color: '#ee7b10' },
  'AVANT EXP': { logo: 'AVANT', color: '#ee7b10' },
  'MD': { logo: 'MD', color: '#ee7b10' },
  'REGIONAL': { logo: 'REGIONAL', color: '#ee7b10' },
  'REG.EXP.': { logo: 'REGIONAL', color: '#ee7b10' },
  'BUS': { logo: 'BUS', color: '#333333' },
  'TRENCELTA': { logo: 'TRENCELTA', color: '#002147' },
  'PROXIMIDAD': { logo: 'MD', color: '#ee7b10' },
};

const getTrainIdentity = (type: string) => {
  if (TRAIN_BRAND_MAP[type]) return TRAIN_BRAND_MAP[type];
  if (type.startsWith('C')) return { logo: 'CERCANIAS', color: '#e30613' };
  if (/^(R|RT|RG|RL)/.test(type)) return { logo: 'RODALIES', color: '#ee7b10' };
  return { logo: 'GENERIC', color: '#002147' };
};

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [trains, setTrains] = useState<TrainSearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const date = searchParams.get('date');

  useEffect(() => {
    const fetchResults = async () => {
      if (!origin || !destination || !date) return;
      try {
        setLoading(true);
        const data = await trainsService.searchTrains(origin, destination, date);
        setTrains(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [origin, destination, date]);

  const processedTrains = useMemo(() => {
    if (trains.length === 0) return [];
    const withDuration = trains.map(train => {
      const start = parse(train.departureTime, 'HH:mm:ss', new Date());
      const end = parse(train.arrivalTime, 'HH:mm:ss', new Date());
      let diff = differenceInMinutes(end, start);
      if (diff < 0) diff += 1440;
      return { ...train, durationMin: diff };
    });
    const minDur = Math.min(...withDuration.map(t => t.durationMin));
    return withDuration.map(t => ({
      ...t,
      isFastest: t.durationMin === minDur && withDuration.length > 1
    }));
  }, [trains]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] font-sans pb-10">
      <header className="sticky top-0 z-30 bg-[#F8FAFC]/80 dark:bg-[#020617]/80 backdrop-blur-md pb-4 border-b border-slate-200 dark:border-white/5">
        <div className="max-w-4xl mx-auto flex items-center justify-between pt-4">
          <div className="flex items-center gap-3">
            <motion.button 
              whileTap={{ scale: 0.85 }}
              onClick={() => navigate(-1)}
              className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-full shadow-sm"
            >
              <ArrowLeft size={18} />
            </motion.button>
            <div>
              <h1 className="text-xl font-black dark:text-white tracking-tight leading-none">Itinerarios</h1>
              <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1">
                {date ? format(new Date(date), "eee, d MMM", { locale: es }) : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
            <TrainFront size={12} className="text-blue-500" />
            <span className="text-[10px] font-black dark:text-blue-400 uppercase">
              {loading ? '--' : trains.length}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto mt-6">
        <div className="grid gap-3">
          {loading ? (
            // Renderizamos 6 esqueletos mientras carga
            Array.from({ length: 6 }).map((_, i) => <TrainSkeleton key={i} />)
          ) : processedTrains.length > 0 ? (
            processedTrains.map((train, idx) => {
              const identity = getTrainIdentity(train.trainType);
              return (
                <motion.div
                  key={train.tripId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => navigate(`/train-detail/${train.tripId}`)}
                  className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl p-4 flex flex-col gap-3 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-6 rounded-lg flex items-center justify-center p-1.5" style={{ backgroundColor: identity.color }}>
                        <img src={`/icons/Renfe_${identity.logo}.svg`} alt={train.trainType} className="w-full h-full object-contain invert" />
                      </div>
                      <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">{train.trainType}</span>
                    </div>
                    {train.isFastest && (
                      <span className="bg-green-500/10 text-green-600 dark:text-green-400 text-[9px] font-black px-2 py-0.5 rounded-full border border-green-500/20 uppercase">Más rápido</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between px-1">
                    <div className="flex flex-col">
                      <span className="text-2xl font-black dark:text-white tracking-tighter tabular-nums">{train.departureTime.substring(0, 5)}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Salida</span>
                    </div>
                    <div className="flex flex-col items-center flex-1 px-4">
                      <div className="text-[10px] font-black text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                        <Timer size={12} strokeWidth={3} />
                        {Math.floor(train.durationMin / 60)}h {train.durationMin % 60}m
                      </div>
                      <div className="w-full h-[2px] bg-slate-100 dark:bg-white/5 relative rounded-full">
                        <div className="absolute right-0 -top-[3px] w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                      </div>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-2xl font-black dark:text-white tracking-tighter tabular-nums">{train.arrivalTime.substring(0, 5)}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Llegada</span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-20 opacity-50 font-bold uppercase text-xs tracking-widest">No hay trenes disponibles</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResultsPage;