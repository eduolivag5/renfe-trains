import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useNoPullToRefresh } from '../hooks/useNoPullToRefresh';
import { useSheetMotion } from '../hooks/useSheetMotion';

/**
 * Panel de móvil a pantalla completa (selector de estación y de núcleo).
 * A pantalla completa el teclado nunca tapa la lista: el buscador está arriba del todo.
 * Animación común de los paneles de móvil (ver useSheetMotion).
 * Mientras está abierto, la página no admite "tirar para recargar".
 * Va en un portal: un ancestro con transform convertiría "fixed" en relativo a él.
 */
const FullScreenSheet = ({ open, children }: { open: boolean; children: ReactNode }) => {
  useNoPullToRefresh(open);
  const sheetMotion = useSheetMotion();

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="fullscreen-sheet"
          {...sheetMotion}
          className="fixed inset-0 z-[90] flex flex-col will-change-transform md:hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default FullScreenSheet;
