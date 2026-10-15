import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Portrait } from '../composants/Portrait';
import { Logo } from '../composants/Logo';
import { contenu, infoSujet } from '../donnees';
import { useJeu, type ChoixDebat } from '../etat';
import { jouer } from '../lib/son';
import { estJouable, sujetsCommuns, sujetsJouables } from '../moteur/catalogue';
import { niveauXP, plateauActuel } from '../moteur/economie';
import { graineAleatoire } from '../moteur/rng';

/** Petite réplique affichée sous le personnage : une vraie citation sourcée, courte. */
function repliqueCourte(id: string): string | null {
  const c = contenu().catalogue;
  const refs = [...c.refs.values()].filter((r) => r.perso === id).map((r) => r.phrase);
  const entree = c.candidats.get(id)?.entree?.replique ?? c.legendes.get(id)?.entree?.replique;
  const candidates = [...refs, ...(entree ? [entree] : [])].filter((t) => t.length <= 56).sort((a, b) => a.length - b.length);
  return candidates[0] ?? null;
}

function CarteCombattant({
  id,
  nom,
  surnom,
  couleur,
  actif,
  badge,
  niveau,
  onClick,
  grise,
}: {
  id: string;
  nom: string;
  surnom: string;
  couleur: string;
  actif?: boolean;
  badge?: string;
  niveau?: number;
  onClick?: () => void;
  grise?: boolean;
}) {
  const citation = repliqueCourte(id);
  return (
    <motion.button
      type="button"
      className={`carte-combattant ${actif ? 'active' : ''} ${grise ? 'grise' : ''}`}
      style={{ ['--couleur' as string]: couleur }}
      whileHover={onClick ? { y: -4 } : undefined}
      whileTap={onClick ? { scale: 0.96 } : undefined}
      onClick={onClick}
      disabled={!onClick}
    >
      <span className="combattant-art">
        <Portrait id={id} taille={140} />
      </span>
      <span className="combattant-nom">{nom.toUpperCase()}</span>
      <span className="combattant-surnom">{surnom.toUpperCase()}</span>
      {citation && <span className="combattant-citation">« {citation} »</span>}
      {niveau !== undefined && <span className="combattant-niveau">Niv. {niveau}</span>}
      {badge && <span className="combattant-badge">{badge}</span>}
    </motion.button>
  );
}

export function Selection({ debat, tutoriel }: { debat: ChoixDebat; tutoriel?: boolean }) {
  const { aller, profil } = useJeu();
  const c = contenu();
  const cat = c.catalogue;
  const jouables = c.candidats.filter((x) => estJouable(cat, x.id) && (!debat.sujet || sujetsJouables(cat, x.id).includes(debat.sujet)));
  const [perso, setPerso] = useState<string | null>(null);
  const [adversaire, setAdversaire] = useState<string | 'hasard'>('hasard');
  const [etape, setEtape] = useState<'perso' | 'adversaire'>('perso');

  const adversairesPossibles = useMemo(
    () => jouables.filter((x) => x.id !== perso && (debat.mode === 'general' ? sujetsCommuns(cat, perso ?? '', x.id).length > 0 : true)),
    [jouables, perso, debat.mode, cat],
  );
  const nonJouables = c.candidats.filter((x) => !jouables.includes(x));
  const liste = etape === 'perso' ? jouables : adversairesPossibles;

  const lancer = () => {
    if (!perso) return;
    const adv = adversaire === 'hasard' ? adversairesPossibles[Math.floor(Math.random() * adversairesPossibles.length)]?.id : adversaire;
    if (!adv) return;
    if (tutoriel) {
      const plateau = plateauActuel(0, c.plateaux);
      const sujet = debat.sujet ?? sujetsCommuns(cat, perso, adv)[0];
      aller({
        nom: 'combat',
        tutoriel: true,
        config: {
          mode: 'cible',
          sujetCible: sujet,
          niveauIA: plateau.niveauIA,
          joueur: { persoId: perso, legendes: profil.deck.legendes, chaos: profil.deck.chaos, refs: [] },
          adversaire: { persoId: adv, legendes: [], chaos: [], refs: [] },
          graine: graineAleatoire(),
        },
      });
      return;
    }
    aller({ nom: 'deck', debat, perso, adversaire: adv });
  };

  const valider = () => {
    jouer('clic');
    if (etape === 'perso') {
      if (perso) setEtape('adversaire');
    } else lancer();
  };

  return (
    <main className="ecran-selection-maquette">
      <header className="selection-entete">
        <div className="titre-pinceau">
          <h1>{etape === 'perso' ? 'CHOISIS TON COMBATTANT !' : 'CHOISIS TON ADVERSAIRE !'}</h1>
          <p>Une seule règle : débattre plus fort que l’adversaire !</p>
        </div>
        <div className="panneau-election">
          <span className="election-titre">
            <span className="drapeau-pinceau" /> ÉLECTION PRÉSIDENTIELLE <span className="drapeau-pinceau" />
          </span>
          <span className="election-annee">2027</span>
          <span className="election-sous">
            {debat.sujet ? `${infoSujet(debat.sujet).icone} DÉBAT CIBLÉ : ${infoSujet(debat.sujet).libelle.toUpperCase()}` : '+ STARS DE LA POLITIQUE'}
          </span>
        </div>
        <div className="entete-droite">
          <div className="bulle-explosion">
            DES PUNCHLINES,
            <br />
            PAS DES BULLETINS !
          </div>
          <div className="mini-logo">
            <Logo taille={0.32} />
          </div>
        </div>
      </header>

      {jouables.length < 2 ? (
        <p className="message-vide">Il faut au moins deux candidats avec un programme sourcé sur ce sujet. Complète les fichiers de src/data (voir A_COMPLETER.md).</p>
      ) : (
        <>
          <h2 className="onglet-section">{etape === 'perso' ? 'LES CANDIDATS 2027' : 'TON ADVERSAIRE'}</h2>
          <section className="grille-combattants">
            {liste.map((x) => (
              <CarteCombattant
                key={x.id}
                id={x.id}
                nom={x.nom}
                surnom={x.surnom}
                couleur={x.couleur}
                actif={etape === 'perso' ? perso === x.id : adversaire === x.id}
                badge={x.statut === 'a_verifier' ? 'À VÉRIFIER' : undefined}
                niveau={etape === 'perso' ? niveauXP(profil.xp[x.id] ?? 0) : undefined}
                onClick={() => {
                  jouer('clic');
                  if (etape === 'perso') setPerso(x.id);
                  else setAdversaire(x.id);
                }}
              />
            ))}
            {etape === 'adversaire' && (
              <motion.button type="button" className={`carte-combattant hasard ${adversaire === 'hasard' ? 'active' : ''}`} style={{ ['--couleur' as string]: '#6b4bd8' }} onClick={() => setAdversaire('hasard')}>
                <span className="combattant-art hasard-art">🎲</span>
                <span className="combattant-nom">AU HASARD</span>
                <span className="combattant-surnom">SURPRISE !</span>
              </motion.button>
            )}
          </section>

          {etape === 'perso' && (
            <>
              <h2 className="onglet-section">LES AUTRES LÉGENDES</h2>
              <section className="grille-combattants legendes">
                {[...cat.legendes.values()].map((l) => (
                  <CarteCombattant key={l.id} id={l.id} nom={l.nom} surnom={l.surnom} couleur={l.couleur} grise />
                ))}
                {nonJouables.map((x) => (
                  <CarteCombattant key={x.id} id={x.id} nom={x.nom} surnom={x.surnom} couleur={x.couleur} badge="BIENTÔT" grise />
                ))}
              </section>
              <p className="note-legendes">Les légendes ne combattent pas : invoque-les pendant le débat avec ta jauge Invocation.</p>
            </>
          )}
        </>
      )}

      <footer className="selection-pied">
        <button type="button" className="bouton-retour-maquette" onClick={() => (etape === 'adversaire' ? setEtape('perso') : aller(tutoriel ? { nom: 'tutoriel' } : { nom: 'choixDebat' }))}>
          ◀ RETOUR
        </button>
        <div className="sticker-dejantes">
          DES PERSONNAGES 100 % POLITIQUE <span>👑</span>
          <br />
          <em>ET 100 % DÉJANTÉS !</em>
        </div>
        <div className="atouts">
          <span>
            🇫🇷
            <small>Plus de débats</small>
          </span>
          <span>
            ⭐<small>Plus d’arguments</small>
          </span>
          <span>
            ⚡<small>Plus de fun</small>
          </span>
        </div>
        <button type="button" className="bouton-cest-parti" disabled={etape === 'perso' && !perso} onClick={valider}>
          ▶ {etape === 'perso' ? 'C’EST PARTI !' : tutoriel ? 'AU DÉBAT !' : 'MON DECK !'}
        </button>
      </footer>
    </main>
  );
}
