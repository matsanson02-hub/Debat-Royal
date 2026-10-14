import type { Alea } from './rng';
import type { Rarete, RareteRef } from './types';

export interface Urne {
  id: string;
  nom: string;
  prix: { paluches?: number; parrainages?: number };
  objets: number;
  garanti?: Rarete;
  chances: Record<Rarete, number>;
  couleur: string;
  /** urnes réservées au premier lancement, absentes de la boutique */
  cachee?: boolean;
}

export type TypeObjet = 'ref' | 'legende' | 'chaos' | 'tenue';

export interface Objet {
  type: TypeObjet;
  id: string;
  rarete: Rarete;
}

export interface ContenuUrnes {
  /** objets disponibles, rangés par rareté de jeu */
  ref: Record<Rarete, string[]>;
  legende: Record<Rarete, string[]>;
  chaos: Record<Rarete, string[]>;
  tenue: Record<Rarete, string[]>;
}

export const RARETES: Rarete[] = ['commune', 'rare', 'epique', 'legendaire'];

export const RARETE_DE_REF: Record<RareteRef, Rarete> = {
  petite_phrase: 'commune',
  punchline: 'rare',
  moment_culte: 'epique',
  replique_historique: 'legendaire',
};

/** Répartition des types d'objets : surtout des refs, parfois le reste. */
const PART_TYPES: [TypeObjet, number][] = [
  ['ref', 0.76],
  ['legende', 0.09],
  ['chaos', 0.1],
  ['tenue', 0.05],
];

export function tirerRarete(chances: Record<Rarete, number>, alea: Alea): Rarete {
  const total = RARETES.reduce((s, r) => s + chances[r], 0);
  let x = alea.nombre() * total;
  for (const r of RARETES) {
    x -= chances[r];
    if (x < 0) return r;
  }
  return 'commune';
}

function tirerType(alea: Alea): TypeObjet {
  let x = alea.nombre();
  for (const [t, p] of PART_TYPES) {
    x -= p;
    if (x < 0) return t;
  }
  return 'ref';
}

/** Choisit un objet de la rareté voulue ; si le type n'en a pas, on se rabat sur une ref. */
function tirerObjet(contenu: ContenuUrnes, rarete: Rarete, alea: Alea): Objet | null {
  const type = tirerType(alea);
  const essais: TypeObjet[] = [type, 'ref', 'chaos', 'legende', 'tenue'];
  for (const t of essais) {
    const liste = contenu[t][rarete];
    if (liste.length > 0) return { type: t, id: alea.choisir(liste), rarete };
  }
  // Rien dans cette rareté : on essaie les raretés voisines, de la plus proche à la plus lointaine.
  const i = RARETES.indexOf(rarete);
  const voisines = [i - 1, i + 1, i - 2, i + 2, i - 3, i + 3].filter((k) => k >= 0 && k < RARETES.length);
  for (const k of voisines) {
    for (const t of essais) {
      const liste = contenu[t][RARETES[k]];
      if (liste.length > 0) return { type: t, id: alea.choisir(liste), rarete: RARETES[k] };
    }
  }
  return null;
}

export function ouvrirUrne(urne: Urne, contenu: ContenuUrnes, alea: Alea): Objet[] {
  const objets: Objet[] = [];
  for (let i = 0; i < urne.objets; i++) {
    const o = tirerObjet(contenu, tirerRarete(urne.chances, alea), alea);
    if (o) objets.push(o);
  }
  if (urne.garanti && objets.length > 0) {
    const min = RARETES.indexOf(urne.garanti);
    if (!objets.some((o) => RARETES.indexOf(o.rarete) >= min)) {
      const o = tirerObjet(contenu, urne.garanti, alea);
      if (o) objets[objets.length - 1] = o;
    }
  }
  // Le dépouillement se termine par l'objet le plus rare.
  return objets.sort((a, b) => RARETES.indexOf(a.rarete) - RARETES.indexOf(b.rarete));
}
