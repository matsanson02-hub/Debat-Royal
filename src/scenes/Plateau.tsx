// Le plateau du Grand Débat, rendu en couches : décor (image fournie dans
// public/decor/plateau.webp|png, sinon décor dessiné en CSS), public, sol
// lumineux, candidats en grand, couche d'effets, bulles et chiffres de dégâts.

import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react';
import { Portrait } from '../composants/Portrait';
import { infoSujet, nomDe } from '../donnees';

const nomCourt = (id: string) => (nomDe(id).split(' ').slice(1).join(' ') || nomDe(id)).toUpperCase();
import type { Plateau as InfoPlateau } from '../moteur/economie';
import type { Camp, SujetId } from '../moteur/types';
import { sourcesFondPlateau, sourcesModerateur } from '../lib/assets';
import { Particules, type ApiParticules } from './Particules';
import { Public, type Reaction } from './Public';

export interface Degat {
  id: number;
  camp: Camp;
  valeur: number;
  critique?: boolean;
  soin?: boolean;
  texte?: string;
}

export interface ApiPlateau {
  secouer: (force?: number) => void;
  particules: () => ApiParticules | null;
}

export interface BulleCombat {
  contenu: ReactNode;
  /** bulle « explosion » à pointes pour les coups */
  choc?: boolean;
}

interface Props {
  decor: InfoPlateau['decor'];
  nomPlateau: string;
  sujet: SujetId;
  ecran?: 'alerte' | 'pub' | 'zapping' | 'gresille' | null;
  joueur: string;
  adversaire: string;
  tenueJoueur?: string;
  reactions: Record<Camp, Reaction>;
  bulles: Partial<Record<Camp | 'moderateur', BulleCombat | ReactNode>>;
  degats: Degat[];
  frappe: Camp | null;
  legendeEntree: { id: string; camp: Camp } | null;
  reduit: boolean;
  children?: ReactNode;
}

/** Charge la première image disponible d'une liste ; null si aucune. */
export function useImage(sources: string[]): string | null {
  const [src, setSrc] = useState<string | null>(null);
  const cle = sources.join('|');
  useEffect(() => {
    let annule = false;
    (async () => {
      for (const s of cle.split('|')) {
        const ok = await new Promise<boolean>((r) => {
          const img = new Image();
          img.onload = () => r(true);
          img.onerror = () => r(false);
          img.src = s;
        });
        if (ok) {
          if (!annule) setSrc(s);
          return;
        }
      }
    })();
    return () => {
      annule = true;
    };
  }, [cle]);
  return src;
}

function Moderateur() {
  const src = useImage(sourcesModerateur());
  return (
    <div className={`moderateur ${src?.includes('-pied') ? 'moderateur-pied' : ''}`}>
      {src ? (
        <img src={src} alt="Gilles Bouleau" draggable={false} />
      ) : (
        <svg viewBox="0 0 120 110" className="moderateur-silhouette">
          <circle cx="60" cy="32" r="20" fill="#cfd6ea" stroke="#0b1340" strokeWidth="3" />
          <path d="M28 80 C 28 58, 44 52, 60 52 C 76 52, 92 58, 92 80 Z" fill="#26304f" stroke="#0b1340" strokeWidth="3" />
          <rect x="8" y="74" width="104" height="30" rx="4" fill="#e9edf7" stroke="#0b1340" strokeWidth="3" />
          <text x="60" y="95" textAnchor="middle" fontFamily="'Barlow Condensed', system-ui" fontWeight="800" fontSize="13" fill="#14205c">
            G. BOULEAU
          </text>
        </svg>
      )}
    </div>
  );
}

function estBulle(b: unknown): b is BulleCombat {
  return !!b && typeof b === 'object' && 'contenu' in (b as object);
}

export const Plateau = forwardRef<ApiPlateau, Props>(function Plateau(p, ref) {
  const controles = useAnimationControls();
  const particules = useRef<ApiParticules>(null);
  const sujet = infoSujet(p.sujet);
  const fond = useImage(sourcesFondPlateau());

  useImperativeHandle(ref, () => ({
    secouer(force = 1) {
      if (p.reduit) return;
      const f = 8 * force;
      controles.start({ x: [0, -f, f, -f / 2, f / 2, 0], y: [0, f / 2, -f / 2, 0], transition: { duration: 0.4 } });
    },
    particules: () => particules.current,
  }));

  useEffect(() => {
    if (p.frappe) particules.current?.emettre('coup', { x: p.frappe === 'joueur' ? 0.62 : 0.38, y: 0.5, nombre: 30 });
  }, [p.frappe]);

  return (
    <motion.section
      className={`plateau ${fond ? 'avec-image' : ''}`}
      animate={controles}
      style={{ ['--decor-accent' as string]: p.decor.accent, backgroundImage: fond ? `url(${fond})` : undefined }}
    >
      {!fond && (
        <div className="couche-fond" aria-hidden>
          <div className="rampe-lumieres">
            {Array.from({ length: 16 }, (_, i) => (
              <span key={i} style={{ animationDelay: `${(i % 5) * 0.3}s` }} />
            ))}
          </div>
          <div className="faisceau faisceau-1" />
          <div className="faisceau faisceau-2" />
          <div className="faisceau faisceau-3" />
          <div className="faisceau faisceau-4" />
          <div className="mur mur-gauche" />
          <div className="mur mur-droit" />
          <div className="pupitre-fond pupitre-fond-g" />
          <div className="pupitre-fond pupitre-fond-d" />
        </div>
      )}

      {/* Grand écran central : titre du débat et sujet en cours */}
      <div className={`ecran-plateau ${p.ecran ? `ecran-${p.ecran}` : ''}`}>
        <span className="drapeau" />
        <motion.div key={p.ecran ?? p.sujet} className="ecran-contenu" initial={{ rotateX: 90, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} transition={{ duration: 0.35 }}>
          {p.ecran === 'alerte' ? (
            <span className="ecran-alerte">ALERTE INFO</span>
          ) : p.ecran === 'pub' ? (
            <span className="ecran-pub">PUBLICITÉ</span>
          ) : p.ecran === 'zapping' ? (
            <span className="ecran-zapping">▶ ZAPPING</span>
          ) : (
            <>
              <span className="ecran-titre">LE GRAND DÉBAT</span>
              <span className="ecran-sous-titre">PRÉSIDENTIEL</span>
              <span className="ecran-sujet">
                {sujet.icone} {sujet.libelle}
              </span>
            </>
          )}
        </motion.div>
        <span className="drapeau" />
      </div>

      {!fond && <Public cote="gauche" camp="joueur" reaction={p.reactions.joueur} />}
      {!fond && <Public cote="droite" camp="adversaire" reaction={p.reactions.adversaire} />}

      <div className="sol" aria-hidden>
        <div className="sol-anneau" />
        <div className="sol-anneau sol-anneau-2" />
      </div>

      <Moderateur />

      {/* Candidats au premier plan, face à face */}
      <motion.div
        className="candidat candidat-joueur"
        animate={p.frappe === 'joueur' ? { x: [0, 50, 0], rotate: [0, 4, 0] } : { y: [0, -6, 0] }}
        transition={p.frappe === 'joueur' ? { duration: 0.35 } : { duration: 2.4, repeat: Infinity }}
      >
        <Portrait id={p.joueur} variante="pied" taille={260} tenue={p.tenueJoueur} />
        <div className="pupitre-devant pupitre-devant-joueur">{nomCourt(p.joueur)}</div>
      </motion.div>
      <motion.div
        className="candidat candidat-adversaire"
        animate={p.frappe === 'adversaire' ? { x: [0, -50, 0], rotate: [0, -4, 0] } : { y: [0, -6, 0] }}
        transition={p.frappe === 'adversaire' ? { duration: 0.35 } : { duration: 2.6, repeat: Infinity }}
      >
        <Portrait id={p.adversaire} variante="pied" taille={260} miroir />
        <div className="pupitre-devant pupitre-devant-adversaire">{nomCourt(p.adversaire)}</div>
      </motion.div>

      <AnimatePresence>
        {p.legendeEntree && (
          <motion.div
            key={p.legendeEntree.id}
            className={`legende-entree legende-${p.legendeEntree.camp}`}
            initial={{ y: '-120%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ type: 'spring', stiffness: 160, damping: 14 }}
          >
            <Portrait id={p.legendeEntree.id} variante="pied" taille={150} />
          </motion.div>
        )}
      </AnimatePresence>

      <Particules ref={particules} reduit={p.reduit} />
      {p.children}

      <div className="couche-bulles">
        <AnimatePresence>
          {(['joueur', 'adversaire', 'moderateur'] as const).map((c) => {
            const b = p.bulles[c];
            if (!b) return null;
            const contenu = estBulle(b) ? b.contenu : b;
            const choc = estBulle(b) && !!b.choc;
            return (
              <motion.div
                key={c + String(typeof contenu === 'string' ? contenu : '')}
                className={`bulle bulle-${c} ${choc ? 'bulle-choc' : ''}`}
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, rotate: c === 'moderateur' ? 0 : c === 'adversaire' ? 2 : -2 }}
                exit={{ scale: 1.2, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <div className="bulle-interieur">{contenu}</div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="couche-degats">
        <AnimatePresence>
          {p.degats.map((d) => (
            <motion.div
              key={d.id}
              className={`chiffre-degat ${d.critique ? 'critique' : ''} ${d.soin ? 'soin' : ''} degat-${d.camp}`}
              initial={{ y: 0, scale: 0.4, opacity: 0 }}
              animate={{ y: [-10, -80, -70], scale: d.critique ? [0.4, 1.8, 1.4] : [0.4, 1.3, 1], opacity: 1 }}
              exit={{ opacity: 0, y: -110 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              {d.texte ?? (d.soin ? `+${d.valeur}` : `−${d.valeur}`)}
              {d.critique && <small>CRITIQUE !</small>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.section>
  );
});
