import {
  AMBIANCE_COMBO,
  AMBIANCE_CRITIQUE,
  AMBIANCE_MAX,
  COMBO_AMBIANCE_MIN,
  INVOCATION_MAX,
  SUPER_MAX,
} from './constantes';
import type { Categorie, EtatCamp } from './types';

export function superPleine(c: EtatCamp): boolean {
  return c.super >= SUPER_MAX;
}

export function invocationPleine(c: EtatCamp): boolean {
  return c.invocation >= INVOCATION_MAX;
}

export function ambiancePleine(c: EtatCamp): boolean {
  return c.ambiance >= AMBIANCE_MAX;
}

/** Applique les gains de jauges d'une bonne réponse (mutation d'une copie). */
export function gagnerJauges(c: EtatCamp, categorie: Categorie, critique: boolean): void {
  c.super = Math.min(SUPER_MAX, c.super + 1);
  if (categorie === 'parcours' || categorie === 'culte') {
    c.invocation = Math.min(INVOCATION_MAX, c.invocation + 1);
  }
  let gain = 0;
  if (critique) gain += AMBIANCE_CRITIQUE;
  if (c.combo >= COMBO_AMBIANCE_MIN) gain += AMBIANCE_COMBO;
  c.ambiance = Math.min(AMBIANCE_MAX, c.ambiance + gain);
}

export function viderSuper(c: EtatCamp): void {
  c.super = 0;
}

export function viderInvocation(c: EtatCamp): void {
  c.invocation = 0;
}

export function viderAmbiance(c: EtatCamp): void {
  c.ambiance = 0;
}
