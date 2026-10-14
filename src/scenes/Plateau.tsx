// Le plateau de débat, rendu en couches : fond (écran, décor), gradins,
// sol, pupitres et candidats, couche d'effets, interface.

import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react';
import { Portrait } from '../composants/Portrait';
import { infoSujet } from '../donnees';
import type { Plateau as InfoPlateau } from '../moteur/economie';
import type { Camp, SujetId } from '../moteur/types';
import { cheminModerateur } from '../lib/assets';
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

interface Props {
  decor: InfoPlateau['decor'];
  nomPlateau: string;
  sujet: SujetId;
  ecran?: 'alerte' | 'pub' | 'zapping' | 'gresille' | null;
  joueur: string;
  adversaire: string;
  tenueJoueur?: string;
  reactions: Record<Camp, Reaction>;
  bulles: Partial<Record<Camp | 'moderateur', ReactNode>>;
  degats: Degat[];
  frappe: Camp | null;
  legendeEntree: { id: string; camp: Camp } | null;
  reduit: boolean;
  children?: ReactNode;
}

function Moderateur() {
  const [manquant, setManquant] = useState(false);
  return (
    <div className="moderateur">
      {manquant ? (
        <svg viewBox="0 0 120 110" className="moderateur-silhouette">
          <circle cx="60" cy="32" r="20" fill="#cfd6ea" stroke="#0b1340" strokeWidth="3" />
          <path d="M28 80 C 28 58, 44 52, 60 52 C 76 52, 92 58, 92 80 Z" fill="#26304f" stroke="#0b1340" strokeWidth="3" />
          <rect x="8" y="74" width="104" height="30" rx="4" fill="#e9edf7" stroke="#0b1340" strokeWidth="3" />
          <text x="60" y="95" textAnchor="middle" fontFamily="'Barlow Condensed', system-ui" fontWeight="800" fontSize="13" fill="#14205c">
            G. BOULEAU
          </text>
        </svg>
      ) : (
        <img src={cheminModerateur()} alt="Gilles Bouleau" onError={() => setManquant(true)} draggable={false} />
      )}
    </div>
  );
}

export const Plateau = forwardRef<ApiPlateau, Props>(function Plateau(p, ref) {
  const controles = useAnimationControls();
  const particules = useRef<ApiParticules>(null);
  const sujet = infoSujet(p.sujet);

  useImperativeHandle(ref, () => ({
    secouer(force = 1) {
      if (p.reduit) return;
      const f = 8 * force;
      controles.start({ x: [0, -f, f, -f / 2, f / 2, 0], y: [0, f / 2, -f / 2, 0], transition: { duration: 0.4 } });
    },
    particules: () => particules.current,
  }));

  useEffect(() => {
    if (p.frappe) particules.current?.emettre('coup', { x: p.frappe === 'joueur' ? 0.24 : 0.76, y: 0.55, nombre: 30 });
  }, [p.frappe]);

  return (
    <motion.section
      className="plateau"
      animate={controles}
      style={{ ['--decor-fond' as string]: p.decor.fond, ['--decor-accent' as string]: p.decor.accent, ['--decor-sol' as string]: p.decor.sol }}
    >
      {/* Couche fond : projecteurs + écran central */}
      <div className="couche-fond">
        <div className="projecteur projecteur-g" />
        <div className="projecteur projecteur-d" />
        <div className={`ecran-plateau ${p.ecran ? `ecran-${p.ecran}` : ''}`}>
            <motion.div
              key={p.ecran ?? p.sujet}
              className="ecran-contenu"
              initial={{ rotateX: 90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              transition={{ duration: 0.35 }}
            >
              {p.ecran === 'alerte' ? (
                <span className="ecran-alerte">ALERTE INFO</span>
              ) : p.ecran === 'pub' ? (
                <span className="ecran-pub">PUBLICITÉ</span>
              ) : p.ecran === 'zapping' ? (
                <span className="ecran-zapping">▶ ZAPPING</span>
              ) : (
                <>
                  <span className="ecran-icone">{sujet.icone}</span>
                  <span className="ecran-sujet">{sujet.libelle}</span>
                </>
              )}
            </motion.div>
        </div>
        <div className="nom-plateau">{p.nomPlateau}</div>
      </div>

      {/* Gradins */}
      <Public cote="gauche" camp="joueur" reaction={p.reactions.joueur} />
      <Public cote="droite" camp="adversaire" reaction={p.reactions.adversaire} />

      {/* Sol circulaire lumineux */}
      <div className="sol">
        <div className="sol-anneau" />
      </div>

      {/* Candidats, pupitres, modérateur */}
      <div className="scene-personnages">
        <motion.div
          className="candidat candidat-joueur"
          animate={p.frappe === 'joueur' ? { x: [0, -16, 0], rotate: [0, -6, 0] } : { y: [0, -3, 0] }}
          transition={p.frappe === 'joueur' ? { duration: 0.35 } : { duration: 2.4, repeat: Infinity }}
        >
          <Portrait id={p.joueur} variante="pied" taille={130} tenue={p.tenueJoueur} />
          <div className="pupitre pupitre-joueur" />
        </motion.div>
        <Moderateur />
        <motion.div
          className="candidat candidat-adversaire"
          animate={p.frappe === 'adversaire' ? { x: [0, 16, 0], rotate: [0, 6, 0] } : { y: [0, -3, 0] }}
          transition={p.frappe === 'adversaire' ? { duration: 0.35 } : { duration: 2.6, repeat: Infinity }}
        >
          <Portrait id={p.adversaire} variante="pied" taille={130} miroir />
          <div className="pupitre pupitre-adversaire" />
        </motion.div>
      </div>

      {/* Entrée d'une légende */}
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
            <Portrait id={p.legendeEntree.id} variante="legende" taille={110} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Couche d'effets */}
      <Particules ref={particules} reduit={p.reduit} />
      {p.children}

      {/* Bulles */}
      <div className="couche-bulles">
        <AnimatePresence>
          {(['joueur', 'adversaire', 'moderateur'] as const).map(
            (c) =>
              p.bulles[c] && (
                <motion.div
                  key={c + String(typeof p.bulles[c] === 'string' ? p.bulles[c] : '')}
                  className={`bulle bulle-${c}`}
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.2, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  {p.bulles[c]}
                </motion.div>
              ),
          )}
        </AnimatePresence>
      </div>

      {/* Chiffres de dégâts */}
      <div className="couche-degats">
        <AnimatePresence>
          {p.degats.map((d) => (
            <motion.div
              key={d.id}
              className={`chiffre-degat ${d.critique ? 'critique' : ''} ${d.soin ? 'soin' : ''} degat-${d.camp}`}
              initial={{ y: 0, scale: 0.4, opacity: 0 }}
              animate={{ y: [-10, -70, -60], scale: d.critique ? [0.4, 1.7, 1.3] : [0.4, 1.3, 1], opacity: 1 }}
              exit={{ opacity: 0, y: -100 }}
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
