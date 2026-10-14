import { useMemo } from 'react';
import { BarreHaut, Bouton, Ecran, Rarete } from '../composants/Interface';
import { Portrait } from '../composants/Portrait';
import { contenu, nomDe } from '../donnees';
import { useJeu, type ChoixDebat } from '../etat';
import { REFS_MAX } from '../moteur/constantes';
import { bonusRef, refEquipable } from '../moteur/degats';
import { plateauActuel, refsIA } from '../moteur/economie';
import { Alea, graineAleatoire } from '../moteur/rng';
import { RARETE_DE_REF } from '../moteur/tirage-urnes';
import type { ConfigCombat, RefNiveau } from '../moteur/types';

const EFFETS: Record<string, string> = { attaque: 'Grosse attaque', bouclier: 'Bouclier', soin: 'Soin 20 PV', vol_combo: 'Vol de combo' };

export function Deck({ debat, perso, adversaire }: { debat: ChoixDebat; perso: string; adversaire: string }) {
  const { profil, majProfil, aller } = useJeu();
  const c = contenu();
  const cat = c.catalogue;
  const idsLegendes = useMemo(() => new Set(cat.legendes.keys()), [cat]);
  const deck = profil.deck;

  const legendes = profil.collection.legendes.filter((id) => cat.legendes.has(id));
  const chaos = profil.collection.chaos.filter((id) => cat.chaos.has(id));
  const refs = Object.keys(profil.collection.refs)
    .map((id) => cat.refs.get(id))
    .filter((r): r is NonNullable<typeof r> => !!r && refEquipable(r, perso, idsLegendes));

  const basculer = (cle: 'legendes' | 'chaos' | 'refs', id: string, max: number) =>
    majProfil((p) => {
      const liste = p.deck[cle];
      const nouvelle = liste.includes(id) ? liste.filter((x) => x !== id) : liste.length >= max ? [...liste.slice(1), id] : [...liste, id];
      return { ...p, deck: { ...p.deck, [cle]: nouvelle } };
    });

  const deckLegendes = deck.legendes.filter((id) => legendes.includes(id)).slice(0, 2);
  const deckChaos = deck.chaos.filter((id) => chaos.includes(id)).slice(0, 3);
  const deckRefs = deck.refs.filter((id) => refs.some((r) => r.id === id)).slice(0, REFS_MAX);

  const lancer = () => {
    const plateaux = c.plateaux;
    const plateau = plateauActuel(profil.sondage, plateaux);
    const index = [...plateaux].sort((a, b) => a.seuil - b.seuil).findIndex((p) => p.id === plateau.id);
    const alea = new Alea(graineAleatoire());
    // Deck de l'IA, adapté au plateau pour garder des débats serrés.
    const refsAdverses: RefNiveau[] = [];
    for (const rarete of refsIA(index)) {
      const candidates = [...cat.refs.values()].filter((r) => RARETE_DE_REF[r.rarete] === rarete && refEquipable(r, adversaire, idsLegendes) && !refsAdverses.some((x) => x.id === r.id));
      if (candidates.length) refsAdverses.push({ id: alea.choisir(candidates).id, niveau: 1 + Math.floor(index / 2) });
    }
    const config: ConfigCombat = {
      mode: debat.mode,
      sujetCible: debat.sujet,
      niveauIA: plateau.niveauIA,
      joueur: {
        persoId: perso,
        legendes: deckLegendes,
        chaos: deckChaos,
        refs: deckRefs.map((id) => ({ id, niveau: profil.collection.refs[id]?.niveau ?? 1 })),
      },
      adversaire: {
        persoId: adversaire,
        legendes: alea.melanger([...cat.legendes.keys()]).slice(0, 2),
        chaos: alea.melanger([...cat.chaos.values()].filter((x) => debat.mode === 'general' || !x.generalSeulement).map((x) => x.id)).slice(0, 3),
        refs: refsAdverses,
      },
      graine: alea.etat,
    };
    aller({ nom: 'combat', config });
  };

  return (
    <Ecran className="ecran-deck">
      <BarreHaut retour={() => aller({ nom: 'selection', debat })} titre="Ton deck" />
      <div className="deck-vs">
        <Portrait id={perso} taille={64} className="portrait-rond" />
        <span className="vs">VS</span>
        <Portrait id={adversaire} taille={64} className="portrait-rond" />
      </div>

      <h2 className="section-titre">
        Légendes ({deckLegendes.length}/2)
      </h2>
      <div className="grille-deck">
        {legendes.map((id) => {
          const l = cat.legendes.get(id)!;
          return (
            <button key={id} type="button" className={`carte-deck ${deckLegendes.includes(id) ? 'active' : ''}`} onClick={() => basculer('legendes', id, 2)}>
              <Portrait id={id} variante="legende" taille={70} />
              <strong>{l.nom}</strong>
              <Rarete rarete={l.rarete} />
              <small>{EFFETS[l.effet]}</small>
            </button>
          );
        })}
      </div>

      <h2 className="section-titre">
        Cartes chaos ({deckChaos.length}/3)
      </h2>
      <div className="grille-deck">
        {chaos.map((id) => {
          const x = cat.chaos.get(id)!;
          const indispo = x.generalSeulement && debat.mode !== 'general';
          return (
            <button key={id} type="button" className={`carte-deck chaos ${deckChaos.includes(id) ? 'active' : ''} ${indispo ? 'indispo' : ''}`} onClick={() => basculer('chaos', id, 3)} title={indispo ? 'Jouable en débat général uniquement' : undefined}>
              <span className="carte-chaos-icone">💥</span>
              <strong>{x.nom}</strong>
              <Rarete rarete={x.rarete} />
              <small>{x.description}</small>
            </button>
          );
        })}
      </div>

      <h2 className="section-titre">
        Refs ({deckRefs.length}/{REFS_MAX})
      </h2>
      {refs.length === 0 ? (
        <p className="message-vide">Aucune ref pour {nomDe(perso)} ou pour les légendes. Ouvre des urnes pour en collectionner !</p>
      ) : (
        <div className="grille-deck">
          {refs.map((r) => {
            const niveau = profil.collection.refs[r.id]?.niveau ?? 1;
            const bonus = bonusRef(r, niveau, debat.sujet ?? 'education');
            return (
              <button key={r.id} type="button" className={`carte-deck ref ${deckRefs.includes(r.id) ? 'active' : ''}`} onClick={() => basculer('refs', r.id, REFS_MAX)}>
                <span className="ref-phrase">« {r.phrase} »</span>
                <small>
                  {nomDe(r.perso)} · Niv. {niveau}
                </small>
                <Rarete rarete={r.rarete} />
                <span className="ref-bonus">+{Math.round(bonus * 100)} % sur bonne réponse{debat.sujet && r.sujet === debat.sujet ? ' (sujet !)' : ''}</span>
              </button>
            );
          })}
        </div>
      )}

      <Bouton variante="or" grand onClick={lancer}>
        Entrer sur le plateau
      </Bouton>
    </Ecran>
  );
}
