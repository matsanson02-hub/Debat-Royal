import { motion } from 'framer-motion';
import { useState } from 'react';
import { Bouton, Ecran } from '../composants/Interface';
import { Logo } from '../composants/Logo';
import { useJeu } from '../etat';

const ETAPES = [
  { titre: 'Bienvenue sur le plateau !', texte: 'Dans Débat Royale, les candidats à la présidentielle 2027 s’affrontent dans un débat télévisé. Ton arme : la connaissance des programmes.' },
  { titre: 'Choisis un argument', texte: 'À chaque tour, choisis un des 3 arguments de ton candidat sur le sujet annoncé par le modérateur. Chaque argument est une vraie mesure de son programme.' },
  { titre: 'Réponds à la question', texte: 'Une question s’affiche, 4 réponses, 12 secondes. Bonne réponse : ton argument frappe. Mauvaise réponse : ton candidat s’emmêle les pinceaux et perd 4 PV.' },
  { titre: 'Plus tu es rapide, plus tu fais mal', texte: 'Réponds avec plus de 60 % du temps restant pour un coup critique. Enchaîne les bonnes réponses pour un combo.' },
  { titre: 'Trois jauges', texte: 'Super (3 bonnes réponses) → attaque ultime. Invocation (questions de parcours) → une légende entre sur le plateau. Ambiance (critiques et combos) → carte chaos !' },
  { titre: 'Le chaos', texte: 'Invasion du public, plateau en feu, Pascal Praud qui débarque… Pour lancer une carte chaos, réponds juste sur le programme de ton adversaire. Sinon, le chaos se retourne contre toi !' },
  { titre: 'Tout est sourcé', texte: 'Chaque bonne réponse débloque une mesure dans les fiches Programmes, avec sa source. Mieux tu connais les programmes, plus tu fais mal.' },
];

export function Tutoriel() {
  const { aller, profil } = useJeu();
  const [i, setI] = useState(0);
  const e = ETAPES[i];
  const derniere = i === ETAPES.length - 1;
  return (
    <Ecran className="ecran-tutoriel">
      <Logo taille={0.55} />
      <>
        <motion.div key={i} className="carte-tutoriel" initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -60, opacity: 0 }}>
          <span className="tutoriel-etape">
            {i + 1}/{ETAPES.length}
          </span>
          <h2>{e.titre}</h2>
          <p>{e.texte}</p>
        </motion.div>
      </>
      <div className="tutoriel-boutons">
        {i > 0 && (
          <Bouton variante="gris" onClick={() => setI(i - 1)}>
            ←
          </Bouton>
        )}
        {derniere ? (
          <Bouton variante="or" grand onClick={() => aller({ nom: 'selection', debat: { mode: 'cible' }, tutoriel: true })}>
            Débat guidé !
          </Bouton>
        ) : (
          <Bouton variante="or" onClick={() => setI(i + 1)}>
            Suivant →
          </Bouton>
        )}
      </div>
      {profil.tutorielFait && (
        <button type="button" className="lien" onClick={() => aller({ nom: 'accueil' })}>
          Passer le tutoriel
        </button>
      )}
    </Ecran>
  );
}
