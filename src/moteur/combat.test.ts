import { describe, expect, it } from 'vitest';
import { actionsPossibles, creerCombat, reduire, sujetEnCours } from './combat';
import { catalogueTest } from './fixtures';
import type { ConfigCombat, EtatCombat } from './types';

const cat = catalogueTest();

function config(partiel: Partial<ConfigCombat> = {}): ConfigCombat {
  return {
    mode: 'cible',
    sujetCible: 'education',
    niveauIA: 'normal',
    joueur: { persoId: 'a', legendes: ['leg', 'leg2'], chaos: ['invasion', 'gilets', 'bfm'], refs: [{ id: 'ref-a', niveau: 1 }] },
    adversaire: { persoId: 'b', legendes: ['leg'], chaos: ['feu'], refs: [] },
    graine: 42,
    ...partiel,
  };
}

/** Répond juste (ou faux) à la question en cours. */
function repondre(e: EtatCombat, juste: boolean, temps = 6): EtatCombat {
  const q = e.questionEnCours!;
  const choix = juste ? q.question.bonne : (q.question.bonne + 1) % 4;
  return reduire(e, { type: 'repondre', choix, tempsRestant: temps }, cat);
}

/** Joue une partie complète : le joueur répond toujours juste ou toujours faux. */
function jouerPartie(cfg: ConfigCombat, juste: boolean): EtatCombat {
  let e = creerCombat(cfg, cat);
  for (let garde = 0; garde < 500 && e.phase !== 'fin'; garde++) {
    if (e.phase === 'annonce') e = reduire(e, { type: 'commencerManche' }, cat);
    else if (e.phase === 'choix' && e.actif === 'joueur') {
      const p = actionsPossibles(e, cat);
      if (p.ultime) e = reduire(e, { type: 'lancerUltime' }, cat);
      else e = reduire(e, { type: 'choisirArgument', argId: p.arguments[0].id }, cat);
    } else if (e.phase === 'choix') e = reduire(e, { type: 'tourIA' }, cat);
    else if (e.phase === 'question') e = repondre(e, juste);
    else if (e.phase === 'resultat') e = reduire(e, { type: 'suite' }, cat);
  }
  return e;
}

describe('combat', () => {
  it('commence par l’annonce du premier sujet', () => {
    const e = creerCombat(config(), cat);
    expect(e.phase).toBe('annonce');
    expect(e.manches).toEqual(['education', 'education', 'education']);
    expect(e.journal[0]).toMatchObject({ type: 'annonce', sujet: 'education' });
  });

  it('bonne réponse : dégâts chez l’adversaire, combo, Super, mesure débloquée', () => {
    let e = reduire(creerCombat(config(), cat), { type: 'commencerManche' }, cat);
    const arg = actionsPossibles(e, cat).arguments[0];
    e = reduire(e, { type: 'choisirArgument', argId: arg.id }, cat);
    expect(e.phase).toBe('question');
    expect(e.questionEnCours!.question.sujet).toBe('education');
    e = repondre(e, true, 0);
    expect(e.phase).toBe('resultat');
    expect(e.camps.adversaire.pv).toBeLessThan(100);
    expect(e.camps.joueur.combo).toBe(1);
    expect(e.camps.joueur.super).toBe(1);
    expect(e.resolution?.correct).toBe(true);
  });

  it('mauvaise réponse : −4 PV pour soi et combo remis à zéro', () => {
    let e = reduire(creerCombat(config(), cat), { type: 'commencerManche' }, cat);
    e.camps.joueur.combo = 3;
    e = reduire(e, { type: 'choisirArgument', argId: actionsPossibles(e, cat).arguments[0].id }, cat);
    e = repondre(e, false);
    expect(e.camps.joueur.pv).toBe(96);
    expect(e.camps.joueur.combo).toBe(0);
    expect(e.camps.adversaire.pv).toBe(100);
    expect(e.resolution?.bonne).toBeTypeOf('number');
  });

  it('temps écoulé = mauvaise réponse', () => {
    let e = reduire(creerCombat(config(), cat), { type: 'commencerManche' }, cat);
    e = reduire(e, { type: 'choisirArgument', argId: actionsPossibles(e, cat).arguments[0].id }, cat);
    e = reduire(e, { type: 'repondre', choix: null, tempsRestant: 0 }, cat);
    expect(e.resolution?.correct).toBe(false);
    expect(e.camps.joueur.pv).toBe(96);
  });

  it('le sujet annoncé détermine toujours les questions posées', () => {
    for (let g = 0; g < 20; g++) {
      let e = creerCombat(config({ mode: 'general', sujetCible: undefined, graine: g }), cat);
      for (let i = 0; i < 400 && e.phase !== 'fin'; i++) {
        if (e.questionEnCours && e.questionEnCours.contexte.type !== 'legende') {
          expect(e.questionEnCours.question.sujet).toBe(sujetEnCours(e));
        }
        if (e.phase === 'annonce') e = reduire(e, { type: 'commencerManche' }, cat);
        else if (e.phase === 'choix' && e.actif === 'joueur') e = reduire(e, { type: 'choisirArgument', argId: actionsPossibles(e, cat).arguments[0].id }, cat);
        else if (e.phase === 'choix') e = reduire(e, { type: 'tourIA' }, cat);
        else if (e.phase === 'question') e = repondre(e, true);
        else e = reduire(e, { type: 'suite' }, cat);
      }
    }
  });

  it('jamais la même question deux fois dans une partie', () => {
    const e = jouerPartie(config({ mode: 'general', sujetCible: undefined }), true);
    expect(new Set(e.posees).size).toBe(e.posees.length);
  });

  it('une partie complète se termine, avec un vainqueur', () => {
    for (let g = 0; g < 30; g++) {
      const e = jouerPartie(config({ graine: g }), g % 2 === 0);
      expect(e.phase).toBe('fin');
      expect(e.vainqueur).not.toBeNull();
    }
  });

  it('un joueur qui répond toujours juste gagne contre l’IA facile', () => {
    let gagnees = 0;
    for (let g = 0; g < 20; g++) if (jouerPartie(config({ graine: g, niveauIA: 'facile' }), true).vainqueur === 'joueur') gagnees++;
    expect(gagnees).toBeGreaterThanOrEqual(18);
  });

  it('les stats de base sont identiques pour les deux camps', () => {
    const e = creerCombat(config(), cat);
    expect(e.camps.joueur.pv).toBe(e.camps.adversaire.pv);
  });

  it('l’ultime vide la jauge Super', () => {
    let e = reduire(creerCombat(config(), cat), { type: 'commencerManche' }, cat);
    e.camps.joueur.super = 3;
    expect(actionsPossibles(e, cat).ultime).toBe(true);
    e = reduire(e, { type: 'lancerUltime' }, cat);
    expect(e.questionEnCours?.contexte.type).toBe('ultime');
    e = repondre(e, true);
    expect(e.camps.joueur.super).toBe(0);
    expect(e.resolution?.evenements.some((x) => x.type === 'attaque' && x.ultime)).toBe(true);
  });

  it('carte chaos ratée : −15 PV pour le lanceur', () => {
    let e = reduire(creerCombat(config(), cat), { type: 'commencerManche' }, cat);
    e.camps.joueur.ambiance = 100;
    e = reduire(e, { type: 'jouerChaos', carteId: 'invasion' }, cat);
    expect(e.questionEnCours?.question.perso).toBe('b');
    e = repondre(e, false);
    expect(e.camps.joueur.pv).toBe(85);
    expect(e.camps.joueur.ambiance).toBe(0);
  });

  it('gilets jaunes : 38 dégâts et l’adversaire perd son tour', () => {
    let e = reduire(creerCombat(config(), cat), { type: 'commencerManche' }, cat);
    e.camps.joueur.ambiance = 100;
    e = reduire(e, { type: 'jouerChaos', carteId: 'gilets' }, cat);
    e = repondre(e, true);
    expect(e.camps.adversaire.pv).toBe(62);
    e = reduire(e, { type: 'suite' }, cat);
    // Le tour de l'IA est sauté : la main revient au joueur.
    expect(e.actif).toBe('joueur');
    expect(e.journal.some((x) => x.type === 'tourPerdu' && x.camp === 'adversaire')).toBe(true);
  });

  it('Alerte info : impossible en débat ciblé', () => {
    let e = reduire(creerCombat(config(), cat), { type: 'commencerManche' }, cat);
    e.camps.joueur.ambiance = 100;
    expect(actionsPossibles(e, cat).chaos).not.toContain('bfm');
  });

  it('légende bouclier : annule le prochain coup reçu', () => {
    let e = reduire(creerCombat(config(), cat), { type: 'commencerManche' }, cat);
    e.camps.joueur.invocation = 2;
    e = reduire(e, { type: 'invoquerLegende', legendeId: 'leg2' }, cat);
    expect(e.questionEnCours?.question.perso).toBe('leg2');
    e = repondre(e, true);
    expect(e.camps.joueur.effets.some((x) => x.type === 'bouclier')).toBe(true);
    expect(e.camps.joueur.legendes.find((l) => l.id === 'leg2')?.utilisee).toBe(true);
  });

  it('les refs ne s’appliquent que sur une bonne réponse', () => {
    let e = reduire(creerCombat(config(), cat), { type: 'commencerManche' }, cat);
    e = reduire(e, { type: 'choisirArgument', argId: actionsPossibles(e, cat).arguments[0].id }, cat);
    e = repondre(e, true);
    const attaque = e.resolution?.evenements.find((x) => x.type === 'attaque');
    expect(attaque && attaque.type === 'attaque' && attaque.ref?.id).toBe('ref-a');
  });
});
