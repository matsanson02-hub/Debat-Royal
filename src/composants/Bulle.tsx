import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';

export function Bulle({ visible, cote, children, cle }: { visible: boolean; cote: 'gauche' | 'droite' | 'centre'; children: ReactNode; cle?: string }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={cle}
          className={`bulle bulle-${cote}`}
          initial={{ scale: 0.3, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 1.3, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 18 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
