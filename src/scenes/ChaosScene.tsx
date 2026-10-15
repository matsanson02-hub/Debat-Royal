// Joue n'importe quelle carte chaos à partir de sa description dans chaos.json :
// acteurs (sprite, nombre, entrée, trajet, durée), effets (particules, secousse,
// flash, éclairage), réplique du modérateur, réaction du public, son.

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SpriteSvg } from '../composants/Sprites';
import { Silhouette } from '../composants/Portrait';
import { jouer } from '../lib/son';
import { sourcesIntervenant } from '../lib/assets';
import type { ActeurScene, Camp, CarteChaos } from '../moteur/types';
import type { ApiParticules, TypeParticule } from './Particules';
import type { Reaction } from './Public';

export const X_CAMP: Record<Camp, number> = { joueur: 24, adversaire: 76 };
const Y_PUPITRE = 62;

interface Props {
  carte: CarteChaos;
  lanceur: Camp;
  reussi: boolean;
  degats: number;
  reduit: boolean;
  particules: () => ApiParticules | null;
  onReaction: (r: Reaction) => void;
  onSecousse: () => void;
  onModerateur: (texte: string) => void;
  onFin: () => void;
}

interface Instance {
  cle: string;
  acteur: ActeurScene;
  graine: number;
  depart: { x: number; y: number };
  chemin: { x: number[]; y: number[] };
  pancarte?: string;
}

function hasard(i: number, k: number): number {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

function construire(acteurs: ActeurScene[], cibleX: number, lanceurX: number): Instance[] {
  const res: Instance[] = [];
  acteurs.forEach((a, ia) => {
    for (let i = 0; i < a.nombre; i++) {
      const r1 = hasard(i, ia + 1);
      const r2 = hasard(i, ia + 7);
      let depart: { x: number; y: number };
      switch (a.entree) {
        case 'gauche':
          depart = { x: -12 - r1 * 10, y: 58 + r2 * 14 };
          break;
        case 'droite':
          depart = { x: 112 + r1 * 10, y: 58 + r2 * 14 };
          break;
        case 'fond':
          depart = { x: 30 + r1 * 40, y: 34 + r2 * 6 };
          break;
        case 'haut':
          depart = { x: cibleX + (r1 - 0.5) * 30, y: -25 };
          break;
        default: // gradins
          depart = { x: r1 < 0.5 ? 4 + r2 * 12 : 84 + r2 * 12, y: 22 + r1 * 16 };
      }
      let x: number[];
      let y: number[];
      switch (a.trajet) {
        case 'centre':
          x = [depart.x, 50];
          y = [depart.y, 60];
          break;
        case 'cible':
          x = [depart.x, cibleX + (r1 - 0.5) * 24];
          y = [depart.y, Y_PUPITRE + (r2 - 0.5) * 14];
          break;
        case 'lanceur':
          x = [depart.x, cibleX + (r1 - 0.5) * 30];
          y = [depart.y, 40 + r2 * 30];
          break;
        case 'traverse':
          x = [depart.x, depart.x < 50 ? 115 : -15];
          y = [depart.y, depart.y + (r2 - 0.5) * 6];
          break;
        case 'ronde': {
          const angle0 = (i / Math.max(1, a.nombre)) * Math.PI * 2;
          x = [depart.x];
          y = [depart.y];
          for (let k = 0; k <= 8; k++) {
            const ang = angle0 + (k / 8) * Math.PI * 2;
            x.push(50 + Math.cos(ang) * 26);
            y.push(60 + Math.sin(ang) * 9);
          }
          break;
        }
        case 'tombe':
          x = [depart.x, depart.x + (r1 - 0.5) * 20];
          y = [depart.y, 110];
          break;
        default:
          x = [depart.x, lanceurX];
          y = [depart.y, Y_PUPITRE];
      }
      res.push({
        cle: `${ia}-${i}`,
        acteur: a,
        graine: i + ia * 13,
        depart,
        chemin: { x, y },
        pancarte: a.pancartes?.[i % a.pancartes.length],
      });
    }
  });
  return res;
}

function ActeurImage({ src, nom }: { src: string; nom?: string }) {
  const [manquant, setManquant] = useState(false);
  if (manquant) return <Silhouette nom={nom ?? ''} couleur="#9aa5d6" pied />;
  return <img src={`/${src}`} alt={nom ?? ''} onError={() => setManquant(true)} draggable={false} />;
}

export function ChaosScene({ carte, lanceur, reussi, degats, reduit, particules, onReaction, onSecousse, onModerateur, onFin }: Props) {
  // Carte ratée : le chaos se retourne contre le lanceur.
  const cibleCamp: Camp = reussi ? (lanceur === 'joueur' ? 'adversaire' : 'joueur') : lanceur;
  const cibleX = X_CAMP[cibleCamp];
  const lanceurX = X_CAMP[lanceur === cibleCamp ? (lanceur === 'joueur' ? 'adversaire' : 'joueur') : lanceur];
  const instances = useMemo(() => (reduit ? [] : construire(carte.scene.acteurs, cibleX, lanceurX)), [carte, cibleX, lanceurX, reduit]);
  const dureeActeurs = carte.scene.acteurs.reduce((m, a) => Math.max(m, (a.delai ?? 0) + a.duree), 0);
  const duree = reduit ? 1.4 : Math.min(4, Math.max(2.5, dureeActeurs + 1.2));
  const [phase, setPhase] = useState<'entree' | 'sortie'>('entree');
  const [eclairage, setEclairage] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const fini = useRef(false);

  const terminer = () => {
    if (fini.current) return;
    fini.current = true;
    particules()?.vider();
    onReaction('calme');
    onFin();
  };

  useEffect(() => {
    const minuteurs: number[] = [];
    const plus = (s: number, f: () => void) => minuteurs.push(window.setTimeout(f, s * 1000));
    jouer(carte.scene.son);
    onReaction(reussi ? carte.scene.public : 'hue');
    if (!reduit) {
      for (const eff of carte.scene.effets) {
        const [nom, valeur] = eff.split(/[:@]/);
        if (nom === 'secousse') plus(Number(valeur ?? 0), onSecousse);
        else if (nom === 'flash') {
          setFlash(true);
          plus(0.25, () => setFlash(false));
        } else if (nom === 'eclairage') setEclairage(valeur);
        else if (nom === 'particules') {
          const type = valeur as TypeParticule;
          const pos = type === 'confettis' ? { x: 0.5, y: 0 } : type === 'feu' ? { x: 0.5, y: 0.75 } : { x: cibleX / 100, y: 0.6 };
          if (type === 'feu') {
            particules()?.emettre('feu', { x: 0.12, y: 0.7, largeur: 0.12, duree: duree - 0.6, nombre: 3 });
            particules()?.emettre('feu', { x: 0.88, y: 0.7, largeur: 0.12, duree: duree - 0.6, nombre: 3 });
          } else if (type === 'fumee') {
            particules()?.emettre('fumee', { ...pos, y: 0.7, largeur: 0.6, duree: duree - 0.5, nombre: 1 });
          } else if (type === 'confettis') {
            particules()?.emettre('confettis', { ...pos, duree: duree - 0.8, nombre: 4 });
          } else {
            plus(Math.max(0.2, dureeActeurs - 0.4), () => particules()?.emettre(type, { ...pos, nombre: 60, largeur: 0.15 }));
          }
        } else if (nom === 'public-debout') onReaction('debout');
      }
    }
    plus(duree * 0.45, () => onModerateur(reussi ? carte.scene.moderateur : 'Ça se retourne contre lui !'));
    plus(duree - 0.6, () => setPhase('sortie'));
    plus(duree, terminer);
    return () => minuteurs.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`chaos-scene ${eclairage ? `eclairage-${eclairage}` : ''}`}>
      {eclairage === 'noir' && !reduit && (
        <>
          <motion.div className="lampe" animate={{ rotate: [-20, 25, -10] }} transition={{ duration: 2, repeat: Infinity }} />
          <motion.div className="lampe lampe-2" animate={{ rotate: [20, -25, 10] }} transition={{ duration: 2.4, repeat: Infinity }} />
        </>
      )}
      {eclairage === 'disco' && !reduit && <div className="boule-disco" />}
      <AnimatePresence>{flash && <motion.div className="flash" initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} />}</AnimatePresence>

      {instances.map((ins) => {
        const a = ins.acteur;
        const estImage = !a.sprite.startsWith('svg:');
        const taille = (a.echelle ?? 1) * (estImage ? 22 : 9);
        return (
          <motion.div
            key={ins.cle}
            className="acteur"
            style={{ width: `${taille}%`, zIndex: Math.round(ins.chemin.y[ins.chemin.y.length - 1]) }}
            initial={{ left: `${ins.depart.x}%`, top: `${ins.depart.y}%`, opacity: 0 }}
            animate={
              phase === 'entree'
                ? {
                    left: ins.chemin.x.map((v) => `${v}%`),
                    top: ins.chemin.y.map((v) => `${v}%`),
                    opacity: 1,
                    y: a.trajet === 'tombe' ? 0 : [0, -6, 0, -6, 0],
                  }
                : { opacity: 0, scale: 0.8 }
            }
            transition={phase === 'entree' ? { duration: a.duree, delay: a.delai ?? 0, ease: a.trajet === 'tombe' ? 'easeIn' : 'easeOut' } : { duration: 0.5 }}
          >
            {estImage ? (
              <div className="acteur-image">
                <ActeurImage src={a.sprite} nom={a.nom} />
                {a.nom && <span className="acteur-nom">{a.nom}</span>}
              </div>
            ) : (
              <SpriteSvg nom={a.sprite.slice(4)} graine={ins.graine} pancarte={ins.pancarte} />
            )}
          </motion.div>
        );
      })}

      {carte.scene.effets.includes('bulle-coupe') && !reduit && reussi && (
        <motion.div className="bulle bulle-centre bulle-coupe" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.1 }}>
          Attendez, attendez, je vous coupe !
        </motion.div>
      )}
      {carte.scene.effets.includes('incrustation:verticale') && !reduit && (
        <motion.div className="incrustation-verticale" initial={{ x: 200 }} animate={{ x: 0 }} transition={{ type: 'spring' }}>
          <strong>On vous explique</strong>
          <span>2 réponses en moins à ta prochaine question</span>
        </motion.div>
      )}
      {carte.scene.effets.includes('compteur-vues') && !reduit && <CompteurVues />}

      <motion.div className={`bandeau-chaos ${reussi ? '' : 'rate'}`} initial={{ x: '-110%' }} animate={{ x: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 22 }}>
        <span className="bandeau-nom">{carte.nom}</span>
        <span className="bandeau-texte">{reussi ? carte.scene.bandeau ?? carte.description : 'Raté ! Le chaos se retourne contre toi'}</span>
        {degats > 0 && <span className="bandeau-degats">−{degats}</span>}
      </motion.div>

      <button type="button" className="bouton-passer" onClick={terminer}>
        Passer ▸
      </button>
    </div>
  );
}

function CompteurVues() {
  const [n, setN] = useState(1000);
  useEffect(() => {
    const id = window.setInterval(() => setN((v) => Math.min(1_250_000, Math.round(v * 1.6))), 90);
    return () => clearInterval(id);
  }, []);
  return <div className="compteur-vues">▶ {n.toLocaleString('fr-FR')} vues</div>;
}
