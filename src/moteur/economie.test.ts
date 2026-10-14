import { describe, expect, it } from 'vitest';
import { acheterUrne, ajouterObjets, appliquerCombat, niveauXP, plateauActuel, profilInitial, type Plateau } from './economie';
import { Alea } from './rng';
import { ouvrirUrne, type ContenuUrnes, type Urne } from './tirage-urnes';

const plateaux: Plateau[] = [
  { id: 'mairie', nom: 'Mairie', seuil: 0, niveauIA: 'facile', urneRecompense: 'urne-bois', parrainagesPalier: 0, decor: { fond: '', accent: '', sol: '' } },
  { id: 'locale', nom: 'Locale', seuil: 300, niveauIA: 'facile', urneRecompense: 'urne-bois', parrainagesPalier: 10, decor: { fond: '', accent: '', sol: '' } },
];

const urneOr: Urne = { id: 'urne-or', nom: 'Or', prix: { paluches: 1200, parrainages: 60 }, objets: 7, garanti: 'rare', chances: { commune: 0.4, rare: 0.38, epique: 0.18, legendaire: 0.04 }, couleur: '' };

const contenu: ContenuUrnes = {
  ref: { commune: ['r1', 'r2'], rare: ['r3'], epique: ['r4'], legendaire: ['r5'] },
  legende: { commune: ['l1'], rare: [], epique: [], legendaire: ['l2'] },
  chaos: { commune: ['c1'], rare: ['c2'], epique: [], legendaire: ['c3'] },
  tenue: { commune: [], rare: ['t1'], epique: [], legendaire: [] },
};

describe('économie', () => {
  it('profil de départ : 500 Paluches, 20 Parrainages, 3 urnes', () => {
    const p = profilInitial();
    expect(p.paluches).toBe(500);
    expect(p.parrainages).toBe(20);
    expect(p.urnes).toHaveLength(3);
  });

  it('victoire : +30 Paluches de base, +30 points de sondage', () => {
    const { profil, gains } = appliquerCombat(profilInitial(), { victoire: true, bonnes: 0, total: 5, critiques: 0, scorePct: 0, persoId: 'a', mesures: [] }, plateaux, new Date('2026-10-14'));
    expect(gains.paluches).toBe(30 + 40); // + défi du jour
    expect(profil.sondage).toBe(30);
    expect(gains.urne).toBe('urne-bois');
  });

  it('défaite : +10 Paluches, −15 sondage sans descendre sous 0', () => {
    const { profil, gains } = appliquerCombat(profilInitial(), { victoire: false, bonnes: 2, total: 5, critiques: 1, scorePct: 40, persoId: 'a', mesures: ['m1'] }, plateaux);
    expect(gains.paluches).toBe(10 + 4 + 5);
    expect(profil.sondage).toBe(0);
    expect(profil.mesures).toContain('m1');
  });

  it('palier de plateau : Parrainages crédités une seule fois', () => {
    let p = { ...profilInitial(), sondage: 290 };
    const r1 = appliquerCombat(p, { victoire: true, bonnes: 0, total: 0, critiques: 0, scorePct: 0, persoId: 'a', mesures: [] }, plateaux);
    expect(r1.gains.parrainages).toBe(10);
    expect(r1.gains.nouveauPlateau?.id).toBe('locale');
    p = { ...r1.profil, sondage: 280 };
    const r2 = appliquerCombat(p, { victoire: true, bonnes: 0, total: 0, critiques: 0, scorePct: 0, persoId: 'a', mesures: [] }, plateaux);
    expect(r2.gains.parrainages).toBe(0);
  });

  it('niveaux 1 à 5', () => {
    expect(niveauXP(0)).toBe(1);
    expect(niveauXP(100)).toBe(2);
    expect(niveauXP(5000)).toBe(5);
  });

  it('plateau selon les points de sondage', () => {
    expect(plateauActuel(299, plateaux).id).toBe('mairie');
    expect(plateauActuel(300, plateaux).id).toBe('locale');
  });

  it('achat d’urne en Paluches ou en Parrainages', () => {
    const p = { ...profilInitial(), paluches: 1300 };
    expect(acheterUrne(p, urneOr, 'paluches')?.paluches).toBe(100);
    expect(acheterUrne(profilInitial(), urneOr, 'parrainages')).toBeNull();
  });

  it('les doublons de refs fusionnent jusqu’au niveau 5 puis se convertissent', () => {
    let p = profilInitial();
    const o = { type: 'ref' as const, id: 'r1', rarete: 'commune' as const };
    for (let i = 0; i < 6; i++) p = ajouterObjets(p, [o]).profil;
    expect(p.collection.refs.r1.niveau).toBe(5);
    expect(p.paluches).toBe(510);
  });

  it('urne avec garantie : au moins un objet rare', () => {
    for (let g = 0; g < 100; g++) {
      const objets = ouvrirUrne(urneOr, contenu, new Alea(g));
      expect(objets).toHaveLength(7);
      expect(objets.some((x) => x.rarete !== 'commune')).toBe(true);
    }
  });
});
