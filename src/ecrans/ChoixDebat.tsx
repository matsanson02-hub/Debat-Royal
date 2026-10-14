import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { BarreHaut, Bouton, Ecran } from '../composants/Interface';
import { contenu } from '../donnees';
import { useJeu } from '../etat';
import { Alea, graineAleatoire } from '../moteur/rng';
import type { SujetId } from '../moteur/types';

export function ChoixDebat() {
  const { aller } = useJeu();
  const sujets = contenu().sujets;
  const [mode, setMode] = useState<'cible' | 'general'>('cible');
  const [sujet, setSujet] = useState<SujetId>('education');
  const apercu = useMemo(() => new Alea(graineAleatoire()).melanger(sujets).slice(0, 4), [sujets]);

  return (
    <Ecran className="ecran-choix-debat">
      <BarreHaut retour={() => aller({ nom: 'accueil' })} titre="Choix du débat" />
      <div className="cartes-mode">
        <motion.button type="button" className={`carte-mode ${mode === 'cible' ? 'active' : ''}`} onClick={() => setMode('cible')} whileTap={{ scale: 0.97 }}>
          <h2>Débat ciblé</h2>
          <p>Un sujet, 3 manches. Idéal pour réviser un thème.</p>
          <div className="grille-sujets" onClick={(e) => e.stopPropagation()}>
            {sujets.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`pastille-sujet ${sujet === s.id && mode === 'cible' ? 'active' : ''}`}
                style={{ ['--couleur' as string]: s.couleur }}
                onClick={() => {
                  setMode('cible');
                  setSujet(s.id);
                }}
              >
                <span>{s.icone}</span> {s.court}
              </button>
            ))}
          </div>
        </motion.button>
        <motion.button type="button" className={`carte-mode ${mode === 'general' ? 'active' : ''}`} onClick={() => setMode('general')} whileTap={{ scale: 0.97 }}>
          <h2>Débat général</h2>
          <p>4 manches, un sujet tiré au sort par manche. Exemple de tirage :</p>
          <ol className="apercu-manches">
            {apercu.map((s) => (
              <li key={s.id}>
                {s.icone} {s.libelle}
              </li>
            ))}
          </ol>
        </motion.button>
      </div>
      <Bouton variante="or" grand onClick={() => aller({ nom: 'selection', debat: mode === 'cible' ? { mode, sujet } : { mode } })}>
        C’est parti !
      </Bouton>
    </Ecran>
  );
}
