// Tous les réglages d'équilibrage au même endroit.

export const PV_MAX = 100;
export const CHRONO = 12;
export const PENALITE_ERREUR = 4;
export const PENALITE_CHAOS_RATE = 15;

export const BONUS_RAPIDITE = 0.5;
export const SEUIL_CRITIQUE = 0.6;
export const BONUS_COMBO = 0.1;
export const BONUS_PROGRAMME_ADVERSE = 1.15;

export const SUPER_MAX = 3;
export const INVOCATION_MAX = 2;
export const AMBIANCE_MAX = 100;
export const AMBIANCE_CRITIQUE = 25;
export const AMBIANCE_COMBO = 15;
export const COMBO_AMBIANCE_MIN = 3;

export const ACTIONS_PAR_MANCHE = 4; // 2 tours = joueur + adversaire, deux fois
export const MANCHES_CIBLE = 3;
export const MANCHES_GENERAL = 4;

export const PART_PROGRAMME = 0.8;

export const PUISSANCE_LEGENDE = 28;
export const SOIN_LEGENDE = 20;

export const REUSSITE_IA: Record<'facile' | 'normal' | 'difficile', number> = {
  facile: 0.6,
  normal: 0.7,
  difficile: 0.8,
};

export const BONUS_REF: Record<'petite_phrase' | 'punchline' | 'moment_culte' | 'replique_historique', number> = {
  petite_phrase: 0.1,
  punchline: 0.18,
  moment_culte: 0.28,
  replique_historique: 0.4,
};
export const BONUS_REF_SUJET = 0.1;
export const BONUS_REF_NIVEAU = 0.05;
export const REFS_MAX = 3;
export const NIVEAU_REF_MAX = 5;
