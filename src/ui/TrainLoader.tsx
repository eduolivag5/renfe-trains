import { motion } from 'framer-motion';

export const TrainLoader = () => {
  // Ciclo matemático para animación infinita sin saltos
  // Altura del travesaño (12px) + Margen inferior (40px) = 52px
  const TIE_CYCLE = 52; 

  return (
    <div className="flex items-center justify-center w-full h-screen bg-black">
      
      {/* CONTENEDOR DE PERSPECTIVA */}
      <div className="relative w-80 h-80 overflow-hidden" style={{ perspective: '150px' }}>
        
        <motion.div 
          style={{ rotateX: '65deg' }}
          className="absolute inset-0 flex flex-col items-center"
        >
          {/* RAÍLES: Efecto acero pulido con brillo central */}
          <div className="absolute inset-y-0 left-12 w-[6px] bg-gradient-to-r from-[#222] via-[#ddd] to-[#222] shadow-[0_0_20px_rgba(255,255,255,0.15)] z-20" />
          <div className="absolute inset-y-0 right-12 w-[6px] bg-gradient-to-r from-[#222] via-[#ddd] to-[#222] shadow-[0_0_20px_rgba(255,255,255,0.15)] z-20" />
          
          {/* TRAVESAÑOS: Bloques de hormigón con iluminación cenital */}
          <motion.div
            animate={{ y: [0, TIE_CYCLE] }}
            transition={{ 
              repeat: Infinity, 
              duration: 0.7, 
              ease: "linear" 
            }}
            className="flex flex-col items-center"
          >
            {[...Array(15)].map((_, i) => (
              <div 
                key={i} 
                className="w-48 h-3 mb-[40px] rounded-[1px] z-10"
                style={{ 
                  background: 'linear-gradient(to bottom, #333 0%, #111 100%)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.1)',
                  opacity: 1 - (i * 0.08) // Desvanecimiento hacia el horizonte
                }} 
              />
            ))}
          </motion.div>
        </motion.div>

        {/* GRADIENTES DE PROFUNDIDAD (Ocultan el inicio y fin de la vía) */}
        {/* Superior: Efecto horizonte/túnel */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-transparent z-30" />
        {/* Inferior: Fundido a negro para suavizar la base */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-30" />
        
        {/* Resplandor sutil púrpura para conectar con la marca Renfe */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-purple-900/10 blur-[80px] rounded-full z-0" />
      </div>

    </div>
  );
};