import { describe, expect, it } from 'vitest';
import { catalogueTest } from './fixtures';
import { similaires } from './questions';
import { Alea } from './rng';
import { tirerManches, tirerQuestion } from './tirage';

const cat = catalogueTest();

describe('tirerManches', () => {
  it('débat ciblé : 3 manches sur le même sujet', () => {
    expect(tirerManches('cible', ['education', 'sante'], 'sante', new Alea(1))).toEqual(['sante', 'sante', 'sante']);
  });

  it('débat général : 4 manches sans doublon', () => {
    for (let g = 0; g < 50; g++) {
      const m = tirerManches('general', ['education', 'retraites', 'sante', 'europe', 'ecologie'], undefined, new Alea(g));
      expect(m).toHaveLength(4);
      expect(new Set(m).size).toBe(4);
    }
  });
});

describe('tirerQuestion', () => {
  it('respecte toujours le sujet en cours', () => {
    const alea = new Alea(7);
    for (let i = 0; i < 200; i++) {
      const q = tirerQuestion(cat, { sujet: 'sante', persos: ['a', 'b'] }, [], alea);
      expect(q?.sujet).toBe('sante');
      expect(['a', 'b']).toContain(q?.perso);
    }
  });

  it('ne repose jamais une question tant qu’il en reste', () => {
    const alea = new Alea(3);
    const posees: string[] = [];
    const pool = cat.questions.filter((q) => q.sujet === 'education' && ['a', 'b'].includes(q.perso));
    for (let i = 0; i < pool.length; i++) {
      const q = tirerQuestion(cat, { sujet: 'education', persos: ['a', 'b'] }, posees, alea)!;
      expect(posees).not.toContain(q.id);
      posees.push(q.id);
    }
  });

  it('environ 80 % de questions programme', () => {
    const alea = new Alea(11);
    let programme = 0;
    const n = 2000;
    for (let i = 0; i < n; i++) {
      if (tirerQuestion(cat, { sujet: 'europe', persos: ['a', 'b'] }, [], alea)?.categorie === 'programme') programme++;
    }
    expect(programme / n).toBeGreaterThan(0.72);
    expect(programme / n).toBeLessThan(0.88);
  });

  it('carte chaos : programme de l’adversaire, difficulté la plus haute', () => {
    const q = tirerQuestion(cat, { sujet: 'sante', persos: ['a', 'b'], persoForce: 'b', categorie: 'programme', difficulte: 3 }, [], new Alea(5));
    expect(q?.perso).toBe('b');
    expect(q?.categorie).toBe('programme');
    expect(q?.difficulte).toBe(3);
  });
});

describe('questions générées', () => {
  it('ont une seule bonne réponse, 4 choix distincts et une source', () => {
    const gen = cat.questions.filter((q) => q.generee);
    expect(gen.length).toBeGreaterThan(0);
    for (const q of gen) {
      expect(q.choix).toHaveLength(4);
      expect(new Set(q.choix).size).toBe(4);
      expect(q.bonne).toBeGreaterThanOrEqual(0);
      expect(q.source).not.toBeNull();
    }
  });

  it('détecte les mesures proches', () => {
    expect(similaires('Uniforme obligatoire à l’école primaire', 'Rendre l’uniforme obligatoire à l’école')).toBe(true);
    expect(similaires('Abroger Parcoursup', 'Retraite à 60 ans')).toBe(false);
  });
});
