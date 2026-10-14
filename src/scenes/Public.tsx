// Gradins de public : têtes, pancartes, réactions en continu.

import { motion } from 'framer-motion';
import { useMemo } from 'react';

export type Reaction = 'calme' | 'applaudit' | 'hue' | 'scande' | 'panique' | 'rit' | 'debout';

const PEAUX = ['#f2c9a5', '#d9a47c', '#a86d4a', '#7a4a2e', '#f5d6bd'];
const HAUTS = ['#4c7dff', '#ff4d8d', '#22c55e', '#f59e0b', '#a855f7', '#06b6d4', '#ef4444', '#64748b'];
const PANCARTES_BLEU = ['Allez !', 'Bravo !', '🔥', 'Encore !', '❤'];
const PANCARTES_ROSE = ['Allez !', 'Vas-y !', '👏', 'Debout !', '❤'];

export function Public({ cote, reaction, camp, rangs = 3 }: { cote: 'gauche' | 'droite'; reaction: Reaction; camp: 'joueur' | 'adversaire'; rangs?: number }) {
  const gens = useMemo(() => {
    const res: { x: number; y: number; peau: string; haut: string; pancarte?: string; delai: number }[] = [];
    const pancartes = camp === 'joueur' ? PANCARTES_BLEU : PANCARTES_ROSE;
    for (let r = 0; r < rangs; r++) {
      const n = 6 - r;
      for (let i = 0; i < n; i++) {
        const k = r * 10 + i;
        res.push({
          x: 6 + i * (88 / n) + (r % 2) * 6,
          y: 18 + r * 26,
          peau: PEAUX[(k * 3) % PEAUX.length],
          haut: HAUTS[(k * 5 + (cote === 'gauche' ? 0 : 3)) % HAUTS.length],
          pancarte: (k * 7) % 5 === 0 ? pancartes[k % pancartes.length] : undefined,
          delai: ((k * 37) % 10) / 20,
        });
      }
    }
    return res;
  }, [cote, camp, rangs]);

  const anim = (delai: number) => {
    switch (reaction) {
      case 'applaudit':
      case 'debout':
        return { y: [0, -10, 0], transition: { duration: 0.35, repeat: Infinity, delay: delai } };
      case 'scande':
        return { y: [0, -14, 0], transition: { duration: 0.5, repeat: Infinity, delay: 0 } };
      case 'hue':
        return { rotate: [0, -8, 8, 0], transition: { duration: 0.5, repeat: Infinity, delay: delai } };
      case 'panique':
        return { x: [0, -4, 4, -2, 0], y: [0, -6, 0], transition: { duration: 0.3, repeat: Infinity, delay: delai } };
      case 'rit':
        return { scale: [1, 1.08, 1], transition: { duration: 0.3, repeat: Infinity, delay: delai } };
      default:
        return { y: [0, -1.5, 0], transition: { duration: 2 + delai * 2, repeat: Infinity, delay: delai } };
    }
  };

  return (
    <div className={`public public-${cote} camp-${camp}`} aria-hidden>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="gradins">
        {Array.from({ length: rangs }, (_, r) => (
          <rect key={r} x="0" y={30 + r * 26} width="100" height="26" className={`gradin gradin-${r}`} />
        ))}
      </svg>
      {gens.map((g, i) => (
        <motion.div key={i} className="spectateur" style={{ left: `${g.x}%`, top: `${g.y}%` }} animate={anim(g.delai)}>
          {(g.pancarte || reaction === 'debout' || reaction === 'scande') && (
            <span className="pancarte">{g.pancarte ?? (reaction === 'hue' ? '👎' : '★')}</span>
          )}
          <span className="tete" style={{ background: g.peau }} />
          <span className="corps" style={{ background: g.haut }} />
          {reaction === 'hue' && i % 3 === 0 && <span className="onomatopee">Bouh !</span>}
        </motion.div>
      ))}
    </div>
  );
}
