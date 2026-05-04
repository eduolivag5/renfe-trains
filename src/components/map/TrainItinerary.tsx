import React from 'react';
import { Check } from 'lucide-react';
import { type TrainDetail } from '../../api/trainsService';

interface TrainItineraryProps {
  itinerary: TrainDetail['itinerary'];
  accent: string;
}

const TrainItinerary: React.FC<TrainItineraryProps> = ({ itinerary, accent }) => {
  return (
    <div className="rounded-xl overflow-hidden border border-indigo-50 dark:border-violet-500/10">
      {itinerary.slice(0, 9).map((stop, i) => (
        <div 
          key={i} 
          className={`flex items-center gap-3 px-3.5 py-[9px] text-[12px] 
            ${i % 2 === 0 
              ? 'bg-indigo-50/60 dark:bg-white/[0.03]' 
              : 'bg-white dark:bg-transparent'
            }`}
        >
          {/* Eje visual */}
          <div className="flex flex-col items-center self-stretch py-px gap-[2px] shrink-0 w-5">
            {/* Línea superior del conector */}
            <div className="w-px flex-1" style={{ background: stop.isPassed ? accent + '40' : accent + '20' }} />
            
            {stop.isPassed ? (
              /* Indicador de estación visitada */
              <div className="flex items-center justify-center w-4 h-4 rounded-full bg-white shadow-sm shrink-0">
                <Check size={10} strokeWidth={4} className="text-black" />
              </div>
            ) : (
              /* Indicador de estación pendiente */
              <div className="flex items-center justify-center w-4 h-4">
                <div className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: accent }} />
              </div>
            )}
            
            {/* Línea inferior del conector */}
            <div className="w-px flex-1" style={{ background: stop.isPassed ? accent + '40' : accent + '20' }} />
          </div>

          {/* Nombre de la estación */}
          <span className={`flex-1 font-medium truncate ${
            stop.isPassed 
              ? 'text-slate-500 dark:text-slate-400' 
              : 'text-indigo-900 dark:text-violet-100'
          }`}>
            {stop.stopName}
          </span>
          
          {/* Horario */}
          <span className="font-mono tabular-nums shrink-0 text-[11px] text-indigo-300 dark:text-violet-400">
            {stop.actualArrival || stop.scheduledArrival}
          </span>
        </div>
      ))}
    </div>
  );
};

export default TrainItinerary;