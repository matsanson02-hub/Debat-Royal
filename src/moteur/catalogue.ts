import type { Candidat, CarteChaos, Legende, Mesure, Question, Ref, SujetId } from './types';

/** Tout le contenu dont le moteur a besoin, déjà filtré (entrées a_completer retirées). */
export interface Catalogue {
  candidats: Map<string, Candidat>;
  mesures: Map<string, Mesure>;
  questions: Question[];
  legendes: Map<string, Legende>;
  chaos: Map<string, CarteChaos>;
  refs: Map<string, Ref>;
  libellesSujets: Record<SujetId, string>;
}

export function nomPerso(cat: Catalogue, id: string): string {
  return cat.candidats.get(id)?.nom ?? cat.legendes.get(id)?.nom ?? id;
}

/** Sujets sur lesquels un candidat a au moins un argument jouable. */
export function sujetsJouables(cat: Catalogue, persoId: string): SujetId[] {
  const c = cat.candidats.get(persoId);
  if (!c) return [];
  return (Object.keys(c.arguments) as SujetId[]).filter((s) => (c.arguments[s]?.length ?? 0) > 0);
}

export function sujetsCommuns(cat: Catalogue, a: string, b: string): SujetId[] {
  const sb = new Set(sujetsJouables(cat, b));
  return sujetsJouables(cat, a).filter((s) => sb.has(s));
}

/** Un candidat est jouable comme combattant s'il est déclaré et a au moins un sujet. */
export function estJouable(cat: Catalogue, persoId: string): boolean {
  const c = cat.candidats.get(persoId);
  return !!c && c.statut !== 'retire' && sujetsJouables(cat, persoId).length > 0;
}
