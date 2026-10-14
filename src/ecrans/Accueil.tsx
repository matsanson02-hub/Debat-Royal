import { motion } from 'framer-motion';
import { useState } from 'react';
import { Bouton, Ecran, IconePaluche, IconeParrainage, IconeSondage } from '../composants/Interface';
import { Logo } from '../composants/Logo';
import { contenu } from '../donnees';
import { useJeu } from '../etat';
import { plateauActuel } from '../moteur/economie';
import { reinitialiser } from '../sauvegarde';

const SLOGANS = ['Le débat, c’est le combat.', 'Laissez-moi finir !', 'Une République, un seul trône.'];

export function Accueil() {
  const { profil, aller, majProfil } = useJeu();
  const [reglages, setReglages] = useState(false);
  const plateaux = contenu().plateaux;
  const plateau = plateauActuel(profil.sondage, plateaux);
  const suivant = plateaux.filter((p) => p.seuil > profil.sondage).sort((a, b) => a.seuil - b.seuil)[0];
  const slogan = SLOGANS[new Date().getDate() % SLOGANS.length];

  return (
    <Ecran className="ecran-accueil">
      <div className="accueil-haut">
        <div className="monnaies grandes">
          <span className="monnaie"><IconePaluche taille={26} /> {profil.paluches.toLocaleString('fr-FR')}</span>
          <span className="monnaie parrainages"><IconeParrainage taille={26} /> {profil.parrainages.toLocaleString('fr-FR')}</span>
        </div>
        <Bouton variante="gris" onClick={() => setReglages(true)} titre="Réglages">⚙</Bouton>
      </div>

      <motion.div className="accueil-logo" initial={{ scale: 0.6, rotate: -4 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 120 }}>
        <Logo taille={0.9} />
        <p className="slogan">Que le meilleur programme gagne.</p>
        <p className="slogan-secondaire">{slogan}</p>
      </motion.div>

      <div className="carte-plateau" style={{ background: `linear-gradient(135deg, ${plateau.decor.fond}, ${plateau.decor.sol})`, borderColor: plateau.decor.accent }}>
        <span className="carte-plateau-nom">{plateau.nom}</span>
        <span className="carte-plateau-sondage">
          <IconeSondage /> {profil.sondage} pts {suivant ? `· prochain plateau à ${suivant.seuil}` : '· sommet atteint !'}
        </span>
        {suivant && (
          <div className="progression">
            <div style={{ width: `${Math.min(100, ((profil.sondage - plateau.seuil) / (suivant.seuil - plateau.seuil)) * 100)}%` }} />
          </div>
        )}
      </div>

      <Bouton variante="or" grand onClick={() => aller({ nom: 'choixDebat' })} className="bouton-jouer">
        JOUER
      </Bouton>

      {profil.urnes.length > 0 && (
        <Bouton variante="rose" onClick={() => aller({ nom: 'depouillement', urnes: profil.urnes, retour: { nom: 'accueil' } })}>
          🗳️ {profil.urnes.length} urne{profil.urnes.length > 1 ? 's' : ''} à dépouiller
        </Bouton>
      )}

      <nav className="menu-accueil">
        <Bouton onClick={() => aller({ nom: 'programmes' })}>📘 Programmes</Bouton>
        <Bouton onClick={() => aller({ nom: 'collection' })}>🃏 Collection</Bouton>
        <Bouton onClick={() => aller({ nom: 'boutique' })}>🛒 Boutique</Bouton>
      </nav>

      <p className="stats-accueil">
        {profil.stats.parties} débat{profil.stats.parties > 1 ? 's' : ''} · {profil.stats.victoires} victoire{profil.stats.victoires > 1 ? 's' : ''} · culture politique{' '}
        {profil.stats.total ? Math.round((profil.stats.bonnes / profil.stats.total) * 100) : 0} % · {profil.mesures.length} mesure{profil.mesures.length > 1 ? 's' : ''} apprise{profil.mesures.length > 1 ? 's' : ''}
      </p>

      {reglages && (
        <div className="modale-fond" onClick={() => setReglages(false)}>
          <div className="modale" onClick={(e) => e.stopPropagation()}>
            <h2>Réglages</h2>
            <label className="interrupteur">
              <input type="checkbox" checked={profil.reglages.son} onChange={(e) => majProfil((p) => ({ ...p, reglages: { ...p.reglages, son: e.target.checked } }))} />
              Son
            </label>
            <label className="interrupteur">
              <input
                type="checkbox"
                checked={profil.reglages.animationsReduites}
                onChange={(e) => majProfil((p) => ({ ...p, reglages: { ...p.reglages, animationsReduites: e.target.checked } }))}
              />
              Animations réduites
            </label>
            <Bouton variante="gris" onClick={() => aller({ nom: 'tutoriel' })}>
              Revoir le tutoriel
            </Bouton>
            <Bouton
              variante="rose"
              onClick={() => {
                if (window.confirm('Effacer toute ta progression ? Cette action est définitive.')) {
                  const p = reinitialiser();
                  majProfil(() => p);
                  setReglages(false);
                  aller({ nom: 'tutoriel' });
                }
              }}
            >
              Effacer ma progression
            </Bouton>
            <p className="petit">Jeu à usage privé. Toutes les mesures et citations affichées sont sourcées ; les répliques du modérateur sont des textes de jeu.</p>
            <Bouton onClick={() => setReglages(false)}>Fermer</Bouton>
          </div>
        </div>
      )}
    </Ecran>
  );
}
