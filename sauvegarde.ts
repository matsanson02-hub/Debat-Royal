// Couche de sauvegarde isolée : aujourd'hui localStorage, demain un vrai
// compte (Supabase). Le reste du jeu ne connaît que charger() / enregistrer().

import { profilInitial, type Profil } from './moteur/economie';

const CLE = 'debat-royale:profil:v1';

export interface Stockage {
  lire(): Profil | null;
  ecrire(p: Profil): void;
  effacer(): void;
}

export const stockageLocal: Stockage = {
  lire() {
    try {
      const brut = localStorage.getItem(CLE);
      return brut ? (JSON.parse(brut) as Profil) : null;
    } catch {
      return null;
    }
  },
  ecrire(p) {
    try {
      localStorage.setItem(CLE, JSON.stringify(p));
    } catch {
      /* navigation privée ou stockage plein : le jeu continue sans sauvegarde */
    }
  },
  effacer() {
    try {
      localStorage.removeItem(CLE);
    } catch {
      /* rien */
    }
  },
};

let stockage: Stockage = stockageLocal;

/** Pour brancher plus tard un stockage distant (compte joueur). */
export function utiliserStockage(s: Stockage): void {
  stockage = s;
}

/** Complète un profil ancien avec les champs ajoutés depuis. */
function migrer(p: Partial<Profil>): Profil {
  const base = profilInitial();
  return {
    ...base,
    ...p,
    collection: { ...base.collection, ...p.collection, refs: { ...(p.collection?.refs ?? {}) } },
    deck: { ...base.deck, ...p.deck },
    reglages: { ...base.reglages, ...p.reglages },
    defis: { ...base.defis, ...p.defis },
    stats: { ...base.stats, ...p.stats },
    version: 1,
  };
}

export function charger(): Profil {
  const p = stockage.lire();
  return p ? migrer(p) : profilInitial();
}

export function enregistrer(p: Profil): void {
  stockage.ecrire(p);
}

export function reinitialiser(): Profil {
  stockage.effacer();
  const p = profilInitial();
  stockage.ecrire(p);
  return p;
}
