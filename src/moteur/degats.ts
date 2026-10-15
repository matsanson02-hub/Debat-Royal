import {
  BONUS_COMBO,
  BONUS_PROGRAMME_ADVERSE,
  BONUS_RAPIDITE,
  BONUS_REF,
  BONUS_REF_NIVEAU,
  BONUS_REF_SUJET,
  CHRONO,
  SEUIL_CRITIQUE,
} from './constantes';
import type { Ref, RefNiveau, SujetId } from './types';

export interface EntreeDegats {
  puissance: number;
  tempsRestant: number;
  chronoMax?: number;
  combo: number;
  surProgrammeAdverse: boolean;
  bonusRefs?: number;
  multiplicateur?: number;
}

export interface SortieDegats {
  degats: number;
  critique: boolean;
}

/**
 * dégâts = puissance
 *   × (1 + 0,5 × temps restant / chrono)   — coup critique si > 60 % du temps restant
 *   × (1 + 0,1 × combo)
 *   × 1,15 si la question portait sur le programme de l'adversaire
 *   × (1 + bonus des refs)                 — uniquement sur bonne réponse
 */
export function calculerDegats(e: EntreeDegats): SortieDegats {
  const chronoMax = e.chronoMax ?? CHRONO;
  const ratio = chronoMax > 0 ? Math.max(0, Math.min(1, e.tempsRestant / chronoMax)) : 0;
  const critique = ratio > SEUIL_CRITIQUE;
  let d = e.puissance;
  d *= 1 + BONUS_RAPIDITE * ratio;
  d *= 1 + BONUS_COMBO * Math.max(0, e.combo);
  if (e.surProgrammeAdverse) d *= BONUS_PROGRAMME_ADVERSE;
  d *= 1 + (e.bonusRefs ?? 0);
  d *= e.multiplicateur ?? 1;
  return { degats: Math.round(d), critique };
}

/** Bonus d'une ref : base de rareté + 5 % par niveau au-delà du 1er + 10 % si sujet en cours. */
export function bonusRef(ref: Ref, niveau: number, sujet: SujetId): number {
  let b = BONUS_REF[ref.rarete] + BONUS_REF_NIVEAU * (Math.max(1, niveau) - 1);
  if (ref.sujet === sujet) b += BONUS_REF_SUJET;
  return Math.round(b * 1000) / 1000;
}

/** Une ref s'équipe sur le candidat qu'elle concerne ; celles des légendes sur tous. */
export function refEquipable(ref: Ref, persoId: string, idsLegendes: Set<string>): boolean {
  return ref.equipable === 'tous' || ref.perso === persoId || idsLegendes.has(ref.perso);
}

/** Refs applicables d'un camp, dans l'ordre d'équipement. */
export function refsApplicables(
  refs: RefNiveau[],
  persoId: string,
  catalogueRefs: Map<string, Ref>,
  idsLegendes: Set<string>,
): { ref: Ref; niveau: number }[] {
  const res: { ref: Ref; niveau: number }[] = [];
  for (const r of refs) {
    const ref = catalogueRefs.get(r.id);
    if (ref && refEquipable(ref, persoId, idsLegendes)) res.push({ ref, niveau: r.niveau });
  }
  return res;
}
