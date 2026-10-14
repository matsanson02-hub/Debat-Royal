import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Bouton, Ecran, IconePaluche, IconeParrainage, IconeSondage, LienSource } from '../composants/Interface';
import { Portrait } from '../composants/Portrait';
import { contenu, infoSujet, nomDe } from '../donnees';
import { useJeu } from '../etat';
import { partager } from '../lib/partage';
import { scoreCulture } from '../moteur/combat';
import type { Gains } from '../moteur/economie';
import type { EtatCombat } from '../moteur/types';
import { Particules, type ApiParticules } from '../scenes/Particules';

export function Fin({ etat, gains, tutoriel }: { etat: EtatCombat; gains: Gains; tutoriel?: boolean }) {
  const { aller, profil, animationsReduites } = useJeu();
  const cat = contenu().catalogue;
  const victoire = etat.vainqueur === 'joueur';
  const J = etat.camps.joueur;
  const A = etat.camps.adversaire;
  const score = scoreCulture(etat);
  const particules = useRef<ApiParticules>(null);
  const [partage, setPartage] = useState<string | null>(null);
  const mesures = etat.mesuresDebloquees.map((id) => cat.mesures.get(id)).filter((m): m is NonNullable<typeof m> => !!m);

  useEffect(() => {
    if (victoire) setTimeout(() => particules.current?.emettre('confettis', { duree: 2.5, nombre: 5 }), 200);
  }, [victoire]);

  const revanche = () => {
    aller({ nom: 'combat', config: { ...etat.config, graine: Math.floor(Math.random() * 2 ** 31) } });
  };

  return (
    <Ecran className={`ecran-fin ${victoire ? 'victoire' : 'defaite'}`}>
      <Particules ref={particules} reduit={animationsReduites} />
      <motion.h1 className="titre-fin" initial={{ scale: 3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 140 }}>
        {victoire ? 'VICTOIRE !' : 'DÉFAITE…'}
      </motion.h1>
      <div className="fin-duel">
        <div className={`fin-camp ${victoire ? 'gagnant' : ''}`}>
          <Portrait id={J.persoId} taille={90} className="portrait-rond" />
          <strong>{nomDe(J.persoId)}</strong>
          <span>{J.pv} PV</span>
        </div>
        <span className="vs">VS</span>
        <div className={`fin-camp ${!victoire ? 'gagnant' : ''}`}>
          <Portrait id={A.persoId} taille={90} className="portrait-rond" />
          <strong>{nomDe(A.persoId)}</strong>
          <span>{A.pv} PV</span>
        </div>
      </div>

      <div className="score-culture">
        <span className="score-valeur">{score} %</span>
        <span>
          de culture politique — {J.bonnes}/{J.total} bonnes réponses
        </span>
      </div>

      <div className="gains">
        <span><IconePaluche /> +{gains.paluches}</span>
        {gains.parrainages > 0 && <span><IconeParrainage /> +{gains.parrainages}</span>}
        <span><IconeSondage /> {gains.sondage > 0 ? '+' : ''}{gains.sondage}</span>
        <span>⭐ +{gains.xp} XP</span>
      </div>
      {gains.niveauApres > gains.niveauAvant && <p className="annonce-gain">🎉 {nomDe(J.persoId)} passe au niveau {gains.niveauApres} ! Nouvelle tenue débloquée.</p>}
      {gains.nouveauPlateau && <p className="annonce-gain">🏟️ Nouveau plateau : {gains.nouveauPlateau.nom} !</p>}
      {gains.urne && <p className="annonce-gain">🗳️ Une urne t’attend !</p>}
      {gains.defiJour && <p className="annonce-gain">✅ Défi du jour réussi : +40 Paluches</p>}
      {gains.defiSemaine && <p className="annonce-gain">✅ Défi de la semaine réussi : +10 Parrainages</p>}

      <section className="appris">
        <h2>Ce que tu as appris</h2>
        {mesures.length === 0 ? (
          <p className="message-vide">Aucune mesure débloquée cette fois. Retente ta chance !</p>
        ) : (
          <ul>
            {mesures.map((m) => (
              <li key={m.id}>
                <span className="appris-perso">{nomDe(m.perso)}</span> · {infoSujet(m.sujet).court}
                <strong>{m.intitule}</strong>
                {m.millesime < 2027 && <span className="millesime">Prog. {m.millesime}</span>}
                <LienSource source={m.source} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="fin-boutons">
        <Bouton
          variante="bleu"
          onClick={async () => {
            const r = await partager({ victoire, joueur: nomDe(J.persoId), adversaire: nomDe(A.persoId), score, bonnes: J.bonnes, total: J.total, mesures: mesures.length });
            setPartage(r === 'echec' ? 'Partage impossible sur cet appareil.' : r === 'telecharge' ? 'Image téléchargée !' : 'Partagé !');
          }}
        >
          📤 Partager mon score
        </Bouton>
        {tutoriel ? (
          <Bouton variante="or" grand onClick={() => aller({ nom: 'depouillement', urnes: profil.urnes, retour: { nom: 'accueil' } })}>
            Dépouiller mes 3 urnes de départ !
          </Bouton>
        ) : (
          <>
            <Bouton variante="rose" onClick={revanche}>
              Revanche
            </Bouton>
            {profil.urnes.length > 0 && (
              <Bouton variante="or" onClick={() => aller({ nom: 'depouillement', urnes: profil.urnes, retour: { nom: 'accueil' } })}>
                Ouvrir mes urnes ({profil.urnes.length})
              </Bouton>
            )}
            <Bouton variante="gris" onClick={() => aller({ nom: 'accueil' })}>
              Accueil
            </Bouton>
          </>
        )}
      </div>
      {partage && <p className="petit">{partage}</p>}
    </Ecran>
  );
}
