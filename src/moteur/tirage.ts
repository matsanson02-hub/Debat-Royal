import type { Catalogue } from './catalogue';
import { MANCHES_CIBLE, MANCHES_GENERAL, PART_PROGRAMME } from './constantes';
import type { Alea } from './rng';
import type { Categorie, Difficulte, Question, SujetId } from './types';

export function tirerManches(
  mode: 'cible' | 'general',
  disponibles: SujetId[],
  sujetCible: SujetId | undefined,
  alea: Alea,
): SujetId[] {
  if (mode === 'cible') {
    const s = sujetCible ?? disponibles[0];
    return Array.from({ length: MANCHES_CIBLE }, () => s);
  }
  const res: SujetId[] = [];
  let pioche: SujetId[] = [];
  while (res.length < MANCHES_GENERAL && disponibles.length > 0) {
    if (pioche.length === 0) pioche = alea.melanger(disponibles.filter((s) => !res.includes(s) || disponibles.length < MANCHES_GENERAL));
    if (pioche.length === 0) pioche = alea.melanger(disponibles);
    res.push(pioche.shift()!);
  }
  return res;
}

export interface CritereQuestion {
  sujet: SujetId;
  /** personnages possibles (lanceur et adversaire, environ moitié-moitié) */
  persos: string[];
  /** force un personnage (cartes chaos : programme de l'adversaire) */
  persoForce?: string;
  categorie?: Categorie;
  difficulte?: Difficulte;
}

/**
 * Tire une question jamais posée dans la partie. Si le filtre est trop strict,
 * on relâche progressivement les contraintes, sans jamais changer de sujet
 * tant qu'une question du sujet existe.
 */
export function tirerQuestion(
  cat: Catalogue,
  critere: CritereQuestion,
  posees: readonly string[],
  alea: Alea,
  pool: readonly Question[] = cat.questions,
): Question | null {
  const dejaPosees = new Set(posees);
  const categorie: Categorie | 'autre' =
    critere.categorie ?? (alea.chance(PART_PROGRAMME) ? 'programme' : 'autre');
  const perso = critere.persoForce ?? alea.choisir(critere.persos);
  const estCategorie = (q: Question) =>
    categorie === 'programme' ? q.categorie === 'programme' : categorie === 'autre' ? q.categorie !== 'programme' : q.categorie === categorie;

  const etapes: ((q: Question) => boolean)[] = [
    (q) => q.sujet === critere.sujet && q.perso === perso && estCategorie(q) && (!critere.difficulte || q.difficulte === critere.difficulte),
    (q) => q.sujet === critere.sujet && q.perso === perso && estCategorie(q) && (!critere.difficulte || q.difficulte >= 2),
    (q) => q.sujet === critere.sujet && q.perso === perso && (critere.persoForce ? q.categorie === 'programme' : true),
    (q) => q.sujet === critere.sujet && critere.persos.includes(q.perso) && !critere.persoForce,
    (q) => q.sujet === critere.sujet && q.perso === perso,
    (q) => q.perso === perso,
  ];
  for (const filtre of etapes) {
    const candidates = pool.filter((q) => !dejaPosees.has(q.id) && filtre(q));
    if (candidates.length > 0) {
      if (critere.difficulte === 3) {
        const max = Math.max(...candidates.map((q) => q.difficulte));
        return alea.choisir(candidates.filter((q) => q.difficulte === max));
      }
      return alea.choisir(candidates);
    }
  }
  // Dernier recours : on accepte une question déjà posée plutôt que de bloquer la partie.
  const secours = pool.filter((q) => q.sujet === critere.sujet && critere.persos.includes(q.perso));
  return secours.length > 0 ? alea.choisir(secours) : null;
}

/** Questions d'entraînement : sans combat, filtrées par candidat et/ou sujet. */
export function questionsEntrainement(cat: Catalogue, filtre: { perso?: string; sujet?: SujetId }): Question[] {
  return cat.questions.filter((q) => (!filtre.perso || q.perso === filtre.perso) && (!filtre.sujet || q.sujet === filtre.sujet));
}
