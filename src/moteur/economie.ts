// Économie calquée sur Clash Royale : Paluches (courante), Parrainages (rare),
// urnes, refs qui fusionnent, points de sondage et plateaux.
// Fonctions pures sur un Profil ; la persistance est dans src/sauvegarde.ts.

import { NIVEAU_REF_MAX } from './constantes';
import type { Objet, Urne } from './tirage-urnes';
import type { NiveauIA, Rarete } from './types';

export interface Plateau {
  id: string;
  nom: string;
  seuil: number;
  niveauIA: NiveauIA;
  urneRecompense: string;
  parrainagesPalier: number;
  decor: { fond: string; accent: string; sol: string };
}

export interface Tenue {
  id: string;
  nom: string;
  rarete: Rarete;
  /** filtre CSS appliqué au personnage, ou accessoire dessiné */
  filtre?: string;
  accessoire?: 'echarpe' | 'cocarde' | 'lunettes' | 'couronne' | 'micro';
  niveauRequis?: number;
}

export interface Profil {
  version: 1;
  paluches: number;
  parrainages: number;
  sondage: number;
  paliersRecompenses: string[];
  xp: Record<string, number>;
  collection: {
    legendes: string[];
    chaos: string[];
    tenues: string[];
    refs: Record<string, { niveau: number; exemplaires: number }>;
  };
  mesures: string[];
  deck: { legendes: string[]; chaos: string[]; refs: string[] };
  tenuesPortees: Record<string, string>;
  urnes: string[];
  reglages: { son: boolean; musique: boolean; animationsReduites: boolean };
  tutorielFait: boolean;
  defis: { jour: string; jourFait: boolean; semaine: string; victoiresSemaine: number; semaineFaite: boolean };
  stats: { parties: number; victoires: number; bonnes: number; total: number };
}

export const DEPART = {
  paluches: 500,
  parrainages: 20,
  urnes: ['urne-depart-bois', 'urne-depart-bois', 'urne-depart-argent'],
  legendes: ['lassalle', 'poutou'],
  chaos: ['invasion', 'casserolade', 'scande'],
};

export const GAINS = {
  victoire: 30,
  defaite: 10,
  parBonneReponse: 2,
  parCritique: 5,
  sondageVictoire: 30,
  sondageDefaite: -15,
  defiJour: 40,
  defiSemaineParrainages: 10,
  victoiresSemaine: 5,
  xpVictoire: 60,
  xpDefaite: 30,
  xpParBonneReponse: 5,
};

export const SEUILS_XP = [0, 100, 250, 450, 700];

/** Doublons convertis en Paluches quand l'objet est déjà au maximum. */
export const CONVERSION_DOUBLON: Record<Rarete, number> = { commune: 10, rare: 25, epique: 60, legendaire: 150 };

export function profilInitial(): Profil {
  return {
    version: 1,
    paluches: DEPART.paluches,
    parrainages: DEPART.parrainages,
    sondage: 0,
    paliersRecompenses: [],
    xp: {},
    collection: { legendes: [...DEPART.legendes], chaos: [...DEPART.chaos], tenues: [], refs: {} },
    mesures: [],
    deck: { legendes: [...DEPART.legendes], chaos: [...DEPART.chaos], refs: [] },
    tenuesPortees: {},
    urnes: [...DEPART.urnes],
    reglages: { son: true, musique: true, animationsReduites: false },
    tutorielFait: false,
    defis: { jour: '', jourFait: false, semaine: '', victoiresSemaine: 0, semaineFaite: false },
    stats: { parties: 0, victoires: 0, bonnes: 0, total: 0 },
  };
}

export function niveauXP(xp: number): number {
  let n = 1;
  SEUILS_XP.forEach((s, i) => {
    if (xp >= s) n = i + 1;
  });
  return n;
}

export function plateauActuel(sondage: number, plateaux: Plateau[]): Plateau {
  const tries = [...plateaux].sort((a, b) => a.seuil - b.seuil);
  let p = tries[0];
  for (const x of tries) if (sondage >= x.seuil) p = x;
  return p;
}

export function bonusCulture(scorePct: number): number {
  if (scorePct >= 90) return 25;
  if (scorePct >= 75) return 15;
  if (scorePct >= 50) return 5;
  return 0;
}

export function cleJour(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function cleSemaine(d: Date): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const jour = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - jour);
  const debut = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const semaine = Math.ceil(((t.getTime() - debut.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-S${semaine}`;
}

export interface BilanCombat {
  victoire: boolean;
  bonnes: number;
  total: number;
  critiques: number;
  scorePct: number;
  persoId: string;
  mesures: string[];
}

export interface Gains {
  paluches: number;
  parrainages: number;
  sondage: number;
  xp: number;
  niveauAvant: number;
  niveauApres: number;
  urne: string | null;
  defiJour: boolean;
  defiSemaine: boolean;
  nouveauPlateau: Plateau | null;
}

export function appliquerCombat(p: Profil, b: BilanCombat, plateaux: Plateau[], maintenant = new Date()): { profil: Profil; gains: Gains } {
  const profil: Profil = structuredClone(p);
  const plateauAvant = plateauActuel(profil.sondage, plateaux);

  let paluches = (b.victoire ? GAINS.victoire : GAINS.defaite) + GAINS.parBonneReponse * b.bonnes + GAINS.parCritique * b.critiques + bonusCulture(b.scorePct);
  let parrainages = 0;

  // Défis
  const jour = cleJour(maintenant);
  const semaine = cleSemaine(maintenant);
  if (profil.defis.jour !== jour) profil.defis = { ...profil.defis, jour, jourFait: false };
  if (profil.defis.semaine !== semaine) profil.defis = { ...profil.defis, semaine, victoiresSemaine: 0, semaineFaite: false };
  let defiJour = false;
  let defiSemaine = false;
  if (b.victoire && !profil.defis.jourFait) {
    profil.defis.jourFait = true;
    paluches += GAINS.defiJour;
    defiJour = true;
  }
  if (b.victoire) profil.defis.victoiresSemaine++;
  if (!profil.defis.semaineFaite && profil.defis.victoiresSemaine >= GAINS.victoiresSemaine) {
    profil.defis.semaineFaite = true;
    parrainages += GAINS.defiSemaineParrainages;
    defiSemaine = true;
  }

  // Sondage, plateaux, paliers
  const sondage = b.victoire ? GAINS.sondageVictoire : GAINS.sondageDefaite;
  profil.sondage = Math.max(0, profil.sondage + sondage);
  const plateauApres = plateauActuel(profil.sondage, plateaux);
  for (const pl of plateaux) {
    if (profil.sondage >= pl.seuil && pl.parrainagesPalier > 0 && !profil.paliersRecompenses.includes(pl.id)) {
      profil.paliersRecompenses.push(pl.id);
      parrainages += pl.parrainagesPalier;
    }
  }

  // XP
  const xpAvant = profil.xp[b.persoId] ?? 0;
  const xp = (b.victoire ? GAINS.xpVictoire : GAINS.xpDefaite) + GAINS.xpParBonneReponse * b.bonnes;
  profil.xp[b.persoId] = xpAvant + xp;

  // Urne de victoire, selon le plateau
  const urne = b.victoire ? plateauAvant.urneRecompense : null;
  if (urne) profil.urnes.push(urne);

  profil.paluches += paluches;
  profil.parrainages += parrainages;
  for (const m of b.mesures) if (!profil.mesures.includes(m)) profil.mesures.push(m);
  profil.stats.parties++;
  if (b.victoire) profil.stats.victoires++;
  profil.stats.bonnes += b.bonnes;
  profil.stats.total += b.total;

  return {
    profil,
    gains: {
      paluches,
      parrainages,
      sondage,
      xp,
      niveauAvant: niveauXP(xpAvant),
      niveauApres: niveauXP(xpAvant + xp),
      urne,
      defiJour,
      defiSemaine,
      nouveauPlateau: plateauApres.id !== plateauAvant.id && plateauApres.seuil > plateauAvant.seuil ? plateauApres : null,
    },
  };
}

export type Monnaie = 'paluches' | 'parrainages';

export function peutAcheter(p: Profil, urne: Urne, monnaie: Monnaie): boolean {
  const prix = urne.prix[monnaie];
  return prix !== undefined && p[monnaie] >= prix;
}

export function acheterUrne(p: Profil, urne: Urne, monnaie: Monnaie): Profil | null {
  if (!peutAcheter(p, urne, monnaie)) return null;
  const profil = structuredClone(p);
  profil[monnaie] -= urne.prix[monnaie]!;
  profil.urnes.push(urne.id);
  return profil;
}

export interface ResultatAjout {
  objet: Objet;
  nouveau: boolean;
  niveau?: number;
  converti?: number;
}

/** Ajoute le contenu d'une urne à la collection. Les refs en double montent de niveau (max 5). */
export function ajouterObjets(p: Profil, objets: Objet[]): { profil: Profil; resultats: ResultatAjout[] } {
  const profil = structuredClone(p);
  const resultats: ResultatAjout[] = [];
  for (const o of objets) {
    if (o.type === 'ref') {
      const r = profil.collection.refs[o.id];
      if (!r) {
        profil.collection.refs[o.id] = { niveau: 1, exemplaires: 1 };
        resultats.push({ objet: o, nouveau: true, niveau: 1 });
      } else if (r.niveau < NIVEAU_REF_MAX) {
        r.niveau++;
        r.exemplaires++;
        resultats.push({ objet: o, nouveau: false, niveau: r.niveau });
      } else {
        profil.paluches += CONVERSION_DOUBLON[o.rarete];
        resultats.push({ objet: o, nouveau: false, niveau: r.niveau, converti: CONVERSION_DOUBLON[o.rarete] });
      }
      continue;
    }
    const liste = o.type === 'legende' ? profil.collection.legendes : o.type === 'chaos' ? profil.collection.chaos : profil.collection.tenues;
    if (!liste.includes(o.id)) {
      liste.push(o.id);
      resultats.push({ objet: o, nouveau: true });
    } else {
      profil.paluches += CONVERSION_DOUBLON[o.rarete];
      resultats.push({ objet: o, nouveau: false, converti: CONVERSION_DOUBLON[o.rarete] });
    }
  }
  return { profil, resultats };
}

/** Achat simulé de Parrainages (mode démo). Le vrai paiement passera par src/lib/paiement.ts. */
export function crediterParrainages(p: Profil, quantite: number): Profil {
  return { ...p, parrainages: p.parrainages + quantite };
}

/** Refs données à l'IA selon le plateau, pour garder des débats serrés. */
export function refsIA(indexPlateau: number): Rarete[] {
  return (
    [
      [],
      ['commune'],
      ['commune', 'rare'],
      ['rare', 'rare', 'epique'],
      ['rare', 'epique', 'legendaire'],
    ] as Rarete[][]
  )[Math.max(0, Math.min(4, indexPlateau))];
}
