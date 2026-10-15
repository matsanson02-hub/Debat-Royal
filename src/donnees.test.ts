// Vérifie le contenu de src/data : aucune information affichée sans source,
// pas de référence cassée, des ids uniques. Lancer : npm run verifier-donnees
import { describe, expect, it } from 'vitest';
import { construireContenu } from './donnees';
import { SUJETS } from './moteur/types';

const c = construireContenu();

describe('contenu', () => {
  it('chaque question affichable a 4 choix distincts, une bonne réponse et une source', () => {
    for (const q of c.catalogue.questions) {
      expect(q.choix, q.id).toHaveLength(4);
      expect(new Set(q.choix).size, q.id).toBe(4);
      expect(q.bonne, q.id).toBeGreaterThanOrEqual(0);
      expect(q.bonne, q.id).toBeLessThan(4);
      expect(q.source?.url, q.id).toMatch(/^https?:\/\//);
      expect(SUJETS, q.id).toContain(q.sujet);
    }
  });

  it('chaque mesure affichable a une source', () => {
    for (const m of c.catalogue.mesures.values()) expect(m.source?.url, m.id).toMatch(/^https?:\/\//);
  });

  it('les arguments pointent vers des mesures sourcées', () => {
    for (const cand of c.catalogue.candidats.values()) {
      for (const s of SUJETS) {
        for (const a of cand.arguments[s] ?? []) expect(c.catalogue.mesures.has(a.mesure), a.id).toBe(true);
        const u = cand.ultimes[s];
        if (u) expect(c.catalogue.mesures.has(u.mesure), u.id).toBe(true);
      }
    }
  });

  it('les stats de base sont identiques : puissances 14/16/18 et ultime 32', () => {
    for (const cand of c.catalogue.candidats.values()) {
      for (const s of SUJETS) {
        for (const a of cand.arguments[s] ?? []) expect([14, 16, 18], a.id).toContain(a.puissance);
        const u = cand.ultimes[s];
        if (u) expect(u.puissance, u.id).toBe(32);
      }
    }
  });

  it('ids uniques', () => {
    const ids = (l: { id: string }[]) => {
      const vus = new Set<string>();
      for (const x of l) {
        expect(vus.has(x.id), `doublon ${x.id}`).toBe(false);
        vus.add(x.id);
      }
    };
    ids(c.toutesMesures);
    ids(c.catalogue.questions);
    ids([...c.catalogue.refs.values()]);
    ids([...c.catalogue.legendes.values()]);
    ids(c.candidats);
  });

  it('les refs portent sur un candidat ou une légende connus', () => {
    const connus = new Set([...c.candidats.map((x) => x.id), ...c.catalogue.legendes.keys()]);
    for (const r of c.catalogue.refs.values()) expect(connus.has(r.perso) || (r.equipable === 'tous' && !!r.nom), r.id).toBe(true);
  });

  it('cartes chaos : 19 cartes, chacune avec au moins un effet', () => {
    expect(c.catalogue.chaos.size).toBe(19);
    for (const x of c.catalogue.chaos.values()) expect(x.effets.length, x.id).toBeGreaterThan(0);
  });

  it('les questions de programme parlent toujours du sujet de leur mesure', () => {
    for (const q of c.catalogue.questions) {
      if (q.categorie !== 'programme' || !q.mesure) continue;
      const m = c.catalogue.mesures.get(q.mesure);
      if (m) expect(q.sujet, q.id).toBe(m.sujet);
    }
  });
});
