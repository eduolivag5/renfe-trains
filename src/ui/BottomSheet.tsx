import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useDragControls, type PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { useNoPullToRefresh } from '../hooks/useNoPullToRefresh';
import { BACKDROP_MOTION, useSheetMotion } from '../hooks/useSheetMotion';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Hoja inferior de móvil, tan alta como su contenido (calendario de /buscar): fondo oscurecido
 * que cierra al tocarlo, asa, título y botón de cerrar.
 * - Se cierra arrastrándola hacia abajo desde la cabecera (asa + título), igual que la hoja de
 *   detalle de un tren. La cabecera y el fondo llevan `touch-action: none` y, mientras está
 *   abierta, la página no admite "tirar para recargar": el gesto no recarga la página.
 * - Pensada para contenido sin teclado: las listas con buscador van a pantalla completa
 *   (FullScreenSheet), donde el teclado no las tapa.
 * - Animación común de los paneles de móvil: fundido + desplazamiento corto (ver useSheetMotion).
 * - Va en un portal: un ancestro con transform convertiría "fixed" en relativo a él.
 */
const BottomSheet = ({ open, onClose, title, children }: BottomSheetProps) => {
  const dragControls = useDragControls();
  const sheetMotion = useSheetMotion();
  useNoPullToRefresh(open);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 90 || info.velocity.y > 600) onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div key="sheet" className="fixed inset-0 z-[90] flex items-end md:hidden">
          <motion.div
            {...BACKDROP_MOTION}
            onClick={onClose}
            className="absolute inset-0 touch-none bg-slate-950/40"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            {...sheetMotion}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={onDragEnd}
            className="relative flex max-h-[calc(100dvh-1rem)] w-full flex-col will-change-transform rounded-t-[28px] bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl dark:bg-slate-900"
          >
            {/* Cabecera: zona de arrastre para cerrar */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="shrink-0 cursor-grab touch-none px-5 pt-3 active:cursor-grabbing"
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200 dark:bg-white/10" />
              <div className="mb-1 flex items-center justify-between">
                <p className="text-lg font-black tracking-tight text-slate-900 dark:text-white">{title}</p>
                <button
                  type="button"
                  onClick={onClose}
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-label="Cerrar"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300"
                >
                  <X size={17} strokeWidth={2.5} />
                </button>
              </div>
            </div>
            <div className="min-h-0 overflow-y-auto overscroll-contain">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default BottomSheet;
