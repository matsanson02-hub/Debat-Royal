import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { BarreHaut, Bouton, Ecran } from '../composants/Interface';
import { Portrait } from '../composants/Portrait';
import { contenu, infoSujet } from '../donnees';
import { useJeu, type ChoixDebat } from '../etat';
import { estJouable, sujetsCommuns, sujetsJouables } from '../moteur/catalogue';
import { niveauXP, plateauActuel } from '../moteur/economie';
import { graineAleatoire } from '../moteur/rng';

export function Selection({ debat, tutoriel }: { debat: ChoixDebat; tutoriel?: boolean }) {
  const { aller, profil } = useJeu();
  const c = contenu();
  const cat = c.catalogue;
  const jouables = c.candidats.filter((x) => estJouable(cat, x.id) && (!debat.sujet || sujetsJouables(cat, x.id).includes(debat.sujet)));
  const [perso, setPerso] = useState<string | null>(jouables[0]?.id ?? null);
  const [adversaire, setAdversaire] = useState<string | 'hasard'>('hasard');
  const [etape, setEtape] = useState<'perso' | 'adversaire'>('perso');

  const adversairesPossibles = useMemo(
    () => jouables.filter((x) => x.id !== perso && (debat.mode === 'general' ? sujetsCommuns(cat, perso ?? '', x.id).length > 0 : true)),
    [jouables, perso, debat.mode, cat],
  );
  const nonJouables = c.candidats.filter((x) => !jouables.includes(x));

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

  const fiche = perso ? cat.candidats.get(perso) : null;

  return (
    <Ecran className="ecran-selection">
      <BarreHaut retour={() => (etape === 'adversaire' ? setEtape('perso') : aller(tutoriel ? { nom: 'tutoriel' } : { nom: 'choixDebat' }))} titre={etape === 'perso' ? 'Choisis ton combattant' : 'Choisis ton adversaire'} />
      {debat.sujet && <p className="rappel-sujet">Débat ciblé : {infoSujet(debat.sujet).icone} {infoSujet(debat.sujet).libelle}</p>}

      {jouables.length < 2 ? (
        <p className="message-vide">Il faut au moins deux candidats avec un programme sourcé sur ce sujet. Complète les fichiers de src/data (voir A_COMPLETER.md).</p>
      ) : (
        <>
          <h2 className="section-titre">Candidats 2027</h2>
          <div className="grille-persos">
            {(etape === 'perso' ? jouables : adversairesPossibles).map((x) => {
              const actif = etape === 'perso' ? perso === x.id : adversaire === x.id;
              return (
                <motion.button
                  key={x.id}
                  type="button"
                  className={`carte-perso ${actif ? 'active' : ''}`}
                  style={{ ['--couleur' as string]: x.couleur }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => (etape === 'perso' ? setPerso(x.id) : setAdversaire(x.id))}
                >
                  <Portrait id={x.id} taille={92} />
                  <span className="carte-perso-nom">{x.nom}</span>
                  <span className="carte-perso-surnom">{x.surnom}</span>
                  {etape === 'perso' && <span className="carte-perso-niveau">Niv. {niveauXP(profil.xp[x.id] ?? 0)}</span>}
                  {x.statut === 'a_verifier' && <span className="badge">à vérifier</span>}
                </motion.button>
              );
            })}
            {etape === 'adversaire' && (
              <motion.button type="button" className={`carte-perso hasard ${adversaire === 'hasard' ? 'active' : ''}`} whileTap={{ scale: 0.95 }} onClick={() => setAdversaire('hasard')}>
                <span className="hasard-icone">🎲</span>
                <span className="carte-perso-nom">Au hasard</span>
              </motion.button>
            )}
          </div>

          {etape === 'perso' && fiche && (
            <div className="fiche-courte">
              <strong>{fiche.nom}</strong> — {fiche.parti}
              {fiche.statut_note && <p className="petit">{fiche.statut_note}</p>}
            </div>
          )}

          {etape === 'perso' && (
            <>
              <h2 className="section-titre">Légendes (non jouables comme combattants)</h2>
              <div className="grille-persos petite">
                {[...cat.legendes.values()].map((l) => (
                  <div key={l.id} className="carte-perso legende-grise" title={l.role}>
                    <Portrait id={l.id} taille={60} />
                    <span className="carte-perso-nom">{l.nom}</span>
                  </div>
                ))}
                {nonJouables.map((x) => (
                  <div key={x.id} className="carte-perso legende-grise" title="Programme pas encore sourcé">
                    <Portrait id={x.id} taille={60} />
                    <span className="carte-perso-nom">{x.nom}</span>
                    <span className="badge">bientôt</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <Bouton variante="or" grand disabled={!perso} onClick={() => (etape === 'perso' ? setEtape('adversaire') : lancer())}>
            {etape === 'perso' ? 'Valider' : tutoriel ? 'Lancer le débat guidé' : 'Préparer mon deck'}
          </Bouton>
        </>
      )}
    </Ecran>
  );
}
