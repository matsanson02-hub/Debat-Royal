import { useEffect, useRef, useState } from 'react';
import { jouer } from '../lib/son';

/** Chrono circulaire. Appelle onFin à 0 ; onTick donne le temps restant (pour le calcul des dégâts). */
export function Chrono({ duree, actif, onFin, onTick }: { duree: number; actif: boolean; onFin: () => void; onTick?: (t: number) => void }) {
  const [reste, setReste] = useState(duree);
  const debut = useRef(performance.now());
  const fini = useRef(false);
  const derniereSeconde = useRef(Math.ceil(duree));

  useEffect(() => {
    debut.current = performance.now();
    fini.current = false;
    setReste(duree);
  }, [duree]);

  useEffect(() => {
    if (!actif) return;
    let raf = 0;
    const boucle = () => {
      const t = Math.max(0, duree - (performance.now() - debut.current) / 1000);
      setReste(t);
      onTick?.(t);
      const s = Math.ceil(t);
      if (s !== derniereSeconde.current) {
        derniereSeconde.current = s;
        if (s <= 3 && s > 0) jouer('tic');
      }
      if (t <= 0) {
        if (!fini.current) {
          fini.current = true;
          onFin();
        }
        return;
      }
      raf = requestAnimationFrame(boucle);
    };
    raf = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(raf);
  }, [actif, duree, onFin, onTick]);

  const ratio = duree > 0 ? reste / duree : 0;
  const r = 26;
  const circ = 2 * Math.PI * r;
  return (
    <div className={`chrono ${reste <= 3 ? 'urgent' : ''}`} aria-label={`${Math.ceil(reste)} secondes`}>
      <svg viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} className="chrono-fond" />
        <circle cx="32" cy="32" r={r} className="chrono-arc" strokeDasharray={circ} strokeDashoffset={circ * (1 - ratio)} transform="rotate(-90 32 32)" />
      </svg>
      <span>{Math.ceil(reste)}</span>
    </div>
  );
}
