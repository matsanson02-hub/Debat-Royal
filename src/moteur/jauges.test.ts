import { describe, expect, it } from 'vitest';
import { gagnerJauges, superPleine } from './jauges';
import type { EtatCamp } from './types';

function camp(): EtatCamp {
  return { persoId: 'a', pv: 100, combo: 0, super: 0, invocation: 0, ambiance: 0, refs: [], prochaineRef: 0, legendes: [], chaos: [], effets: [], derniereAttaque: null, derniereReponseFausse: false, bonnes: 0, total: 0, critiques: 0 };
}

describe('jauges', () => {
  it('Super pleine à 3 bonnes réponses, plafonnée', () => {
    const c = camp();
    for (let i = 0; i < 5; i++) gagnerJauges(c, 'programme', false);
    expect(c.super).toBe(3);
    expect(superPleine(c)).toBe(true);
  });

  it('Invocation ne monte qu’avec le parcours et les moments cultes', () => {
    const c = camp();
    gagnerJauges(c, 'programme', false);
    expect(c.invocation).toBe(0);
    gagnerJauges(c, 'parcours', false);
    gagnerJauges(c, 'culte', false);
    gagnerJauges(c, 'culte', false);
    expect(c.invocation).toBe(2);
  });

  it('Ambiance : +25 par critique, +15 par combo ≥ 3', () => {
    const c = camp();
    gagnerJauges(c, 'programme', true);
    expect(c.ambiance).toBe(25);
    c.combo = 3;
    gagnerJauges(c, 'programme', true);
    expect(c.ambiance).toBe(65);
    gagnerJauges(c, 'programme', true);
    expect(c.ambiance).toBe(100);
  });
});
