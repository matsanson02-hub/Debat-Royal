import { describe, expect, it } from 'vitest';
import { bonusRef, calculerDegats } from './degats';
import type { Ref } from './types';

describe('calculerDegats', () => {
  it('applique la formule de base sans bonus', () => {
    expect(calculerDegats({ puissance: 20, tempsRestant: 0, combo: 0, surProgrammeAdverse: false })).toEqual({ degats: 20, critique: false });
  });

  it('bonus de rapidité maximal à chrono plein, avec coup critique', () => {
    const r = calculerDegats({ puissance: 20, tempsRestant: 12, combo: 0, surProgrammeAdverse: false });
    expect(r.degats).toBe(30);
    expect(r.critique).toBe(true);
  });

  it('critique seulement au-delà de 60 % du temps', () => {
    expect(calculerDegats({ puissance: 10, tempsRestant: 7.2, combo: 0, surProgrammeAdverse: false }).critique).toBe(false);
    expect(calculerDegats({ puissance: 10, tempsRestant: 7.3, combo: 0, surProgrammeAdverse: false }).critique).toBe(true);
  });

  it('combo, programme adverse et refs se multiplient', () => {
    // 20 × 1 × 1,2 × 1,15 × 1,4 = 38,64
    const r = calculerDegats({ puissance: 20, tempsRestant: 0, combo: 2, surProgrammeAdverse: true, bonusRefs: 0.4 });
    expect(r.degats).toBe(39);
  });

  it('tient compte d’un chrono réduit', () => {
    expect(calculerDegats({ puissance: 20, tempsRestant: 5, chronoMax: 5, combo: 0, surProgrammeAdverse: false }).degats).toBe(30);
  });
});

describe('bonusRef', () => {
  const ref: Ref = { id: 'r', perso: 'a', rarete: 'punchline', phrase: '', sujet: 'education', source: { url: '', libelle: '' } };
  it('base de rareté + niveau + sujet', () => {
    expect(bonusRef(ref, 1, 'retraites')).toBe(0.18);
    expect(bonusRef(ref, 3, 'retraites')).toBe(0.28);
    expect(bonusRef(ref, 1, 'education')).toBe(0.28);
  });
});
