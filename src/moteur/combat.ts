// Moteur de combat-débat : un reducer pur `reduire(etat, action, catalogue)`.
// Aucun accès au DOM ni à React : rejouable, testable, et réutilisable plus tard
// côté serveur pour le duel en ligne.

import { sujetsCommuns, type Catalogue } from './catalogue';
import {
  ACTIONS_PAR_MANCHE,
  AMBIANCE_MAX,
  CHRONO,
  PENALITE_CHAOS_RATE,
  PENALITE_ERREUR,
  PUISSANCE_LEGENDE,
  PV_MAX,
  SOIN_LEGENDE,
  SUPER_MAX,
} from './constantes';
import { bonusRef, calculerDegats, refsApplicables } from './degats';
import { argumentsDisponibles, chanceIA, chaosJouables, deciderIA, tempsIA, ultimeDisponible } from './ia';
import { ambiancePleine, gagnerJauges, invocationPleine, superPleine, viderAmbiance, viderInvocation, viderSuper } from './jauges';
import { Alea } from './rng';
import { tirerManches, tirerQuestion } from './tirage';
import type {
  Action,
  Camp,
  CarteChaos,
  ConfigCombat,
  ContexteQuestion,
  EtatCamp,
  EtatCombat,
  Evenement,
  Question,
  QuestionEnCours,
  Resolution,
  SujetId,
} from './types';

export const autre = (c: Camp): Camp => (c === 'joueur' ? 'adversaire' : 'joueur');

function creerCamp(cfg: ConfigCombat['joueur']): EtatCamp {
  return {
    persoId: cfg.persoId,
    pv: PV_MAX,
    combo: 0,
    super: 0,
    invocation: 0,
    ambiance: 0,
    refs: cfg.refs.slice(0, 3),
    prochaineRef: 0,
    legendes: cfg.legendes.slice(0, 2).map((id) => ({ id, utilisee: false })),
    chaos: cfg.chaos.slice(0, 3).map((id) => ({ id, utilisee: false })),
    effets: [],
    derniereAttaque: null,
    derniereReponseFausse: false,
    bonnes: 0,
    total: 0,
    critiques: 0,
  };
}

export function creerCombat(config: ConfigCombat, cat: Catalogue): EtatCombat {
  const alea = new Alea(config.graine);
  const communs = sujetsCommuns(cat, config.joueur.persoId, config.adversaire.persoId);
  const manches = tirerManches(config.mode, communs.length > 0 ? communs : ['education'], config.sujetCible, alea);
  return {
    config,
    manches,
    manche: 0,
    actionsManche: 0,
    actif: 'joueur',
    phase: 'annonce',
    camps: { joueur: creerCamp(config.joueur), adversaire: creerCamp(config.adversaire) },
    questionEnCours: null,
    resolution: null,
    posees: [],
    mesuresDebloquees: [],
    rng: alea.etat,
    vainqueur: null,
    journal: [{ type: 'annonce', sujet: manches[0], manche: 1 }],
  };
}

export function sujetEnCours(e: EtatCombat): SujetId {
  return e.manches[Math.min(e.manche, e.manches.length - 1)];
}

/** Ce que le joueur a le droit de faire en ce moment (pour griser les boutons). */
export function actionsPossibles(e: EtatCombat, cat: Catalogue, camp: Camp = 'joueur') {
  const c = e.camps[camp];
  const sujet = sujetEnCours(e);
  const aSonTour = e.phase === 'choix' && e.actif === camp;
  return {
    arguments: aSonTour ? argumentsDisponibles(cat, c, sujet) : [],
    ultime: aSonTour && superPleine(c) && !!ultimeDisponible(cat, c, sujet),
    legendes: aSonTour && invocationPleine(c) ? c.legendes.filter((l) => !l.utilisee).map((l) => l.id) : [],
    chaos: aSonTour && ambiancePleine(c) ? chaosJouables(cat, e, c).map((x) => x.id) : [],
  };
}

// ---------------------------------------------------------------------------

export function reduire(etat: EtatCombat, action: Action, cat: Catalogue): EtatCombat {
  if (etat.phase === 'fin') return etat;
  const e: EtatCombat = structuredClone(etat);
  const alea = new Alea(e.rng);
  const nouveaux: Evenement[] = [];

  switch (action.type) {
    case 'commencerManche':
      if (e.phase !== 'annonce') return etat;
      debutTour(e, cat, alea, nouveaux);
      break;

    case 'choisirArgument':
    case 'lancerUltime':
    case 'invoquerLegende':
    case 'jouerChaos': {
      if (e.phase !== 'choix' || e.actif !== 'joueur') return etat;
      if (!demarrerAction(e, cat, alea, 'joueur', action)) return etat;
      break;
    }

    case 'repondre': {
      const q = e.questionEnCours;
      if (e.phase !== 'question' || !q || q.repondant !== 'joueur') return etat;
      const choix = action.choix !== null && q.retires.includes(action.choix) ? null : action.choix;
      resoudre(e, cat, alea, q, choix, Math.max(0, Math.min(q.chrono, action.tempsRestant)), nouveaux);
      break;
    }

    case 'tourIA': {
      if (e.phase !== 'choix' || e.actif !== 'adversaire') return etat;
      const decision = deciderIA(cat, e, alea);
      if (!demarrerAction(e, cat, alea, 'adversaire', decision)) {
        // Rien de jouable (contenu manquant) : l'IA passe son tour.
        finAction(e, cat, alea, nouveaux);
        break;
      }
      const q = e.questionEnCours!;
      repondreIA(e, cat, alea, q, nouveaux);
      break;
    }

    case 'suite':
      if (e.phase !== 'resultat') return etat;
      e.resolution = null;
      if (e.vainqueur) {
        e.phase = 'fin';
        break;
      }
      finAction(e, cat, alea, nouveaux);
      break;
  }

  e.rng = alea.etat;
  e.journal.push(...nouveaux);
  return e;
}

// ---------------------------------------------------------------------------

function debutTour(e: EtatCombat, cat: Catalogue, alea: Alea, ev: Evenement[]): void {
  const camp = e.camps[e.actif];
  // Brûlure (plateau en feu)
  for (const eff of camp.effets) {
    if (eff.type === 'brulure' && eff.tours > 0) {
      camp.pv = Math.max(0, camp.pv - eff.valeur);
      eff.tours--;
      ev.push({ type: 'brulure', camp: e.actif, degats: eff.valeur });
    }
    if (eff.type === 'ambianceRecharge' && eff.tours > 0) {
      eff.tours--;
      if (eff.tours === 0) camp.ambiance = AMBIANCE_MAX;
    }
    if (eff.type === 'argumentBloque' && eff.tours > 0) eff.tours--;
  }
  camp.effets = camp.effets.filter(
    (x) => !((x.type === 'brulure' || x.type === 'ambianceRecharge' || x.type === 'argumentBloque') && x.tours <= 0),
  );
  if (verifierKO(e, ev)) {
    e.phase = 'fin';
    return;
  }
  // Tour perdu (gilets jaunes)
  const perdu = camp.effets.findIndex((x) => x.type === 'tourPerdu');
  if (perdu >= 0) {
    camp.effets.splice(perdu, 1);
    ev.push({ type: 'tourPerdu', camp: e.actif });
    finAction(e, cat, alea, ev);
    return;
  }
  e.phase = 'choix';
}

function finAction(e: EtatCombat, cat: Catalogue, alea: Alea, ev: Evenement[]): void {
  e.questionEnCours = null;
  e.actionsManche++;
  if (e.actionsManche >= ACTIONS_PAR_MANCHE) {
    e.manche++;
    e.actionsManche = 0;
    if (e.manche >= e.manches.length) {
      terminerAuxPoints(e);
      return;
    }
    e.actif = 'joueur';
    e.phase = 'annonce';
    ev.push({ type: 'annonce', sujet: e.manches[e.manche], manche: e.manche + 1 });
    return;
  }
  e.actif = autre(e.actif);
  debutTour(e, cat, alea, ev);
}

function terminerAuxPoints(e: EtatCombat): void {
  const j = e.camps.joueur;
  const a = e.camps.adversaire;
  if (j.pv !== a.pv) e.vainqueur = j.pv > a.pv ? 'joueur' : 'adversaire';
  else e.vainqueur = j.bonnes >= a.bonnes ? 'joueur' : 'adversaire';
  e.phase = 'fin';
  e.manche = e.manches.length - 1;
}

function verifierKO(e: EtatCombat, ev: Evenement[]): boolean {
  for (const c of ['joueur', 'adversaire'] as Camp[]) {
    if (e.camps[c].pv <= 0 && !e.vainqueur) {
      e.vainqueur = autre(c);
      ev.push({ type: 'ko', camp: c });
      return true;
    }
  }
  return !!e.vainqueur;
}

// ---------------------------------------------------------------------------

function demarrerAction(e: EtatCombat, cat: Catalogue, alea: Alea, lanceur: Camp, action: Action): boolean {
  const camp = e.camps[lanceur];
  const cible = e.camps[autre(lanceur)];
  const sujet = sujetEnCours(e);
  const persos = [camp.persoId, cible.persoId];
  let contexte: ContexteQuestion;
  let question: Question | null = null;

  switch (action.type) {
    case 'choisirArgument': {
      const arg = argumentsDisponibles(cat, camp, sujet).find((a) => a.id === action.argId);
      if (!arg) return false;
      contexte = { type: 'argument', argId: arg.id };
      question = tirerQuestion(cat, { sujet, persos }, e.posees, alea);
      break;
    }
    case 'lancerUltime':
      if (!superPleine(camp) || !ultimeDisponible(cat, camp, sujet)) return false;
      contexte = { type: 'ultime' };
      question = tirerQuestion(cat, { sujet, persos, difficulte: 3 }, e.posees, alea);
      break;
    case 'invoquerLegende': {
      const leg = camp.legendes.find((l) => l.id === action.legendeId && !l.utilisee);
      const fiche = cat.legendes.get(action.legendeId);
      if (!invocationPleine(camp) || !leg || !fiche) return false;
      contexte = { type: 'legende', legendeId: fiche.id };
      question = tirerQuestion(cat, { sujet, persos: [fiche.id], persoForce: fiche.id }, e.posees, alea, fiche.questions);
      break;
    }
    case 'jouerChaos': {
      const carte = cat.chaos.get(action.carteId);
      const possible = chaosJouables(cat, e, camp).some((c) => c.id === action.carteId);
      if (!ambiancePleine(camp) || !carte || !possible) return false;
      contexte = { type: 'chaos', carteId: carte.id };
      question = tirerQuestion(
        cat,
        { sujet, persos, persoForce: cible.persoId, categorie: 'programme', difficulte: 3 },
        e.posees,
        alea,
      );
      break;
    }
    default:
      return false;
  }
  if (!question) return false;
  e.questionEnCours = preparerQuestion(e, alea, question, contexte, lanceur, lanceur);
  e.phase = 'question';
  return true;
}

/** Calcule le chrono et les handicaps de celui qui répond, et consomme ses effets. */
function preparerQuestion(
  e: EtatCombat,
  alea: Alea,
  question: Question,
  contexte: ContexteQuestion,
  lanceur: Camp,
  repondant: Camp,
): QuestionEnCours {
  const camp = e.camps[repondant];
  let chrono = CHRONO;
  let cachees = 0;
  let deux = false;
  const restants: typeof camp.effets = [];
  for (const eff of camp.effets) {
    if (eff.type === 'tourEclair') {
      chrono = Math.min(chrono, eff.secondes);
      restants.push(eff); // le multiplicateur est consommé à la résolution
    } else if (eff.type === 'chronoFixe') {
      chrono = Math.min(chrono, eff.secondes);
      if (eff.questions > 1) restants.push({ ...eff, questions: eff.questions - 1 });
    } else if (eff.type === 'chronoReduit') {
      chrono = Math.max(3, Math.min(chrono, CHRONO - eff.secondes));
      if (eff.questions > 1) restants.push({ ...eff, questions: eff.questions - 1 });
    } else if (eff.type === 'reponsesCachees') {
      cachees = eff.ms;
      if (eff.questions > 1) restants.push({ ...eff, questions: eff.questions - 1 });
    } else if (eff.type === 'deuxReponses') {
      deux = true;
    } else {
      restants.push(eff);
    }
  }
  camp.effets = restants;
  let retires: number[] = [];
  if (deux) {
    const fausses = question.choix.map((_, i) => i).filter((i) => i !== question.bonne);
    retires = alea.melanger(fausses).slice(0, 2);
  }
  return { question, contexte, repondant, lanceur, chrono, reponsesCacheesMs: cachees, retires };
}

function repondreIA(e: EtatCombat, cat: Catalogue, alea: Alea, q: QuestionEnCours, ev: Evenement[]): void {
  const reussite = alea.chance(chanceIA(e.config.niveauIA, q.chrono, CHRONO, q.reponsesCacheesMs > 0, q.retires.length > 0));
  const fausses = q.question.choix.map((_, i) => i).filter((i) => i !== q.question.bonne && !q.retires.includes(i));
  const choix = reussite ? q.question.bonne : alea.choisir(fausses);
  resoudre(e, cat, alea, q, choix, tempsIA(q.chrono, alea), ev);
}

// ---------------------------------------------------------------------------

/** Applique des dégâts en tenant compte du bouclier de la cible. */
function infliger(e: EtatCombat, cible: Camp, degats: number, ev: Evenement[]): number {
  const c = e.camps[cible];
  const i = c.effets.findIndex((x) => x.type === 'bouclier');
  if (i >= 0 && degats > 0) {
    c.effets.splice(i, 1);
    ev.push({ type: 'bouclier', camp: cible });
    return 0;
  }
  c.pv = Math.max(0, c.pv - degats);
  return degats;
}

/** Fuite du Canard enchaîné : la prochaine attaque du camp visé est divisée par deux. */
function modulerSortants(c: EtatCamp, degats: number): number {
  const i = c.effets.findIndex((x) => x.type === 'moitieDegats');
  if (i < 0) return degats;
  c.effets.splice(i, 1);
  return Math.round(degats / 2);
}

function consommerEclair(c: EtatCamp): number {
  const i = c.effets.findIndex((x) => x.type === 'tourEclair');
  if (i < 0) return 1;
  const eff = c.effets[i];
  c.effets.splice(i, 1);
  return eff.type === 'tourEclair' ? eff.multiplicateur : 1;
}

function resoudre(
  e: EtatCombat,
  cat: Catalogue,
  alea: Alea,
  q: QuestionEnCours,
  choix: number | null,
  tempsRestant: number,
  ev: Evenement[],
): void {
  const correct = choix !== null && choix === q.question.bonne;
  const repondant = e.camps[q.repondant];
  const L = q.lanceur;
  const C = autre(L);
  const lanceur = e.camps[L];
  const sujet = sujetEnCours(e);
  const debut = ev.length;

  repondant.total++;
  if (correct) repondant.bonnes++;
  repondant.derniereReponseFausse = !correct;
  if (!e.posees.includes(q.question.id)) e.posees.push(q.question.id);
  if (correct && q.repondant === 'joueur' && q.question.mesure && !e.mesuresDebloquees.includes(q.question.mesure)) {
    e.mesuresDebloquees.push(q.question.mesure);
    ev.push({ type: 'mesure', mesureId: q.question.mesure });
  }
  const multiplicateur = consommerEclair(repondant);
  e.questionEnCours = null;

  switch (q.contexte.type) {
    case 'argument':
    case 'ultime': {
      const ultime = q.contexte.type === 'ultime';
      const argId = q.contexte.type === 'argument' ? q.contexte.argId : '';
      const arg = ultime
        ? ultimeDisponible(cat, lanceur, sujet)
        : (cat.candidats.get(lanceur.persoId)?.arguments[sujet] ?? []).find((a) => a.id === argId);
      if (ultime) viderSuper(lanceur);
      if (correct && arg) {
        const idsLegendes = new Set(cat.legendes.keys());
        const refs = refsApplicables(lanceur.refs, lanceur.persoId, cat.refs, idsLegendes);
        let refDeclenchee: { ref: (typeof refs)[number]['ref']; niveau: number } | undefined;
        if (refs.length > 0) {
          refDeclenchee = refs[lanceur.prochaineRef % refs.length];
          lanceur.prochaineRef++;
        }
        const surAdverse = q.question.perso === e.camps[C].persoId;
        const { degats, critique } = calculerDegats({
          puissance: arg.puissance,
          tempsRestant,
          chronoMax: q.chrono,
          combo: lanceur.combo,
          surProgrammeAdverse: surAdverse,
          bonusRefs: refDeclenchee ? bonusRef(refDeclenchee.ref, refDeclenchee.niveau, sujet) : 0,
          multiplicateur,
        });
        const inflige = infliger(e, C, modulerSortants(lanceur, degats), ev);
        lanceur.combo++;
        if (critique) lanceur.critiques++;
        if (!ultime) gagnerJauges(lanceur, q.question.categorie, critique);
        lanceur.derniereAttaque = { degats: inflige || degats, nom: arg.nom, bulle: arg.bulle };
        ev.push({
          type: 'attaque',
          camp: L,
          nom: arg.nom,
          bulle: arg.bulle,
          degats: inflige,
          critique,
          ultime,
          ref: refDeclenchee
            ? { id: refDeclenchee.ref.id, phrase: refDeclenchee.ref.phrase, source: refDeclenchee.ref.source }
            : undefined,
        });
      } else {
        lanceur.pv = Math.max(0, lanceur.pv - PENALITE_ERREUR);
        lanceur.combo = 0;
        ev.push({ type: 'erreur', camp: L, degats: PENALITE_ERREUR });
      }
      break;
    }

    case 'legende': {
      const legendeId = q.contexte.legendeId;
      const fiche = cat.legendes.get(legendeId);
      viderInvocation(lanceur);
      const slot = lanceur.legendes.find((l) => l.id === legendeId);
      if (slot) slot.utilisee = true;
      if (!fiche) break;
      let valeur = 0;
      if (correct) {
        switch (fiche.effet) {
          case 'attaque': {
            const { degats } = calculerDegats({ puissance: PUISSANCE_LEGENDE, tempsRestant, chronoMax: q.chrono, combo: 0, surProgrammeAdverse: false });
            valeur = infliger(e, C, modulerSortants(lanceur, degats), ev);
            break;
          }
          case 'bouclier':
            lanceur.effets.push({ type: 'bouclier' });
            break;
          case 'soin':
            valeur = Math.min(SOIN_LEGENDE, PV_MAX - lanceur.pv);
            lanceur.pv += valeur;
            break;
          case 'vol_combo':
            valeur = e.camps[C].combo;
            lanceur.combo += valeur;
            e.camps[C].combo = 0;
            break;
        }
      }
      ev.push({ type: 'legende', camp: L, legendeId: fiche.id, reussi: correct, effet: fiche.effet, valeur });
      break;
    }

    case 'chaos': {
      const carteId = q.contexte.carteId;
      const carte = cat.chaos.get(carteId);
      viderAmbiance(lanceur);
      const slot = lanceur.chaos.find((c) => c.id === carteId);
      if (slot) slot.utilisee = true;
      if (!carte) break;
      if (correct) {
        const degats = appliquerChaos(e, cat, alea, carte, L, ev);
        ev.splice(debut, 0, { type: 'chaos', camp: L, carteId: carte.id, reussi: true, degats });
      } else {
        lanceur.pv = Math.max(0, lanceur.pv - PENALITE_CHAOS_RATE);
        ev.push({ type: 'chaos', camp: L, carteId: carte.id, reussi: false, degats: PENALITE_CHAOS_RATE });
      }
      break;
    }

    case 'mediapart': {
      // Le camp visé a répondu à une question sur son propre programme.
      const carte = cat.chaos.get('mediapart');
      const eff = carte?.effets.find((x) => x.type === 'mediapart');
      const degats = !correct && eff && eff.type === 'mediapart' ? infliger(e, q.repondant, eff.degats, ev) : 0;
      ev.push({ type: 'chaos', camp: q.contexte.lanceur, carteId: 'mediapart', reussi: !correct, degats });
      break;
    }
  }

  const resolution: Resolution = {
    questionId: q.question.id,
    question: q.question,
    repondant: q.repondant,
    choix,
    correct,
    bonne: q.question.bonne,
    explication: q.question.explication,
    source: q.question.source,
    tempsRestant,
    evenements: ev.slice(debut),
  };
  e.resolution = resolution;

  verifierKO(e, ev);
  // Mediapart lancé contre le joueur : il doit répondre tout de suite.
  if (!e.vainqueur && e.questionEnCours) {
    e.phase = 'question';
    return;
  }
  e.questionEnCours = null;
  e.phase = 'resultat';
}

/** Applique les effets d'une carte chaos réussie. Renvoie les dégâts directs infligés. */
function appliquerChaos(e: EtatCombat, cat: Catalogue, alea: Alea, carte: CarteChaos, L: Camp, ev: Evenement[]): number {
  const C = autre(L);
  const lanceur = e.camps[L];
  const cible = e.camps[C];
  const sujet = sujetEnCours(e);
  let total = 0;
  for (const eff of carte.effets) {
    switch (eff.type) {
      case 'degats':
        total += infliger(e, C, eff.valeur, ev);
        break;
      case 'tourPerdu':
        cible.effets.push({ type: 'tourPerdu' });
        break;
      case 'brulure':
        cible.effets.push({ type: 'brulure', valeur: eff.valeur, tours: eff.tours });
        break;
      case 'chronoFixe':
        cible.effets.push({ type: 'chronoFixe', secondes: eff.secondes, questions: eff.questions });
        break;
      case 'chronoReduit':
        cible.effets.push({ type: 'chronoReduit', secondes: eff.secondes, questions: eff.questions });
        break;
      case 'superMoins':
        cible.super = Math.max(0, cible.super - eff.valeur);
        break;
      case 'argumentBloque': {
        const args = cat.candidats.get(cible.persoId)?.arguments[sujet] ?? [];
        const meilleur = [...args].sort((a, b) => b.puissance - a.puissance)[0];
        if (meilleur) cible.effets.push({ type: 'argumentBloque', argId: meilleur.id, tours: eff.tours + 1 });
        break;
      }
      case 'reponsesCachees':
        cible.effets.push({ type: 'reponsesCachees', ms: eff.ms, questions: eff.questions });
        break;
      case 'annuleUltime':
        cible.super = 0;
        break;
      case 'soin': {
        const v = Math.min(eff.valeur, PV_MAX - lanceur.pv);
        lanceur.pv += v;
        ev.push({ type: 'soin', camp: L, valeur: v });
        break;
      }
      case 'superPlus':
        lanceur.super = Math.min(SUPER_MAX, lanceur.super + eff.valeur);
        break;
      case 'mediapart': {
        const q = tirerQuestion(cat, { sujet, persos: [cible.persoId], persoForce: cible.persoId, categorie: 'programme' }, e.posees, alea);
        if (!q) break;
        const qe = preparerQuestion(e, alea, q, { type: 'mediapart', lanceur: L }, L, C);
        if (C === 'joueur') {
          e.questionEnCours = qe;
        } else {
          // L'IA répond immédiatement à la question sur son propre programme.
          const reussite = alea.chance(chanceIA(e.config.niveauIA, qe.chrono, CHRONO, false, false));
          if (!e.posees.includes(q.id)) e.posees.push(q.id);
          cible.total++;
          if (reussite) cible.bonnes++;
          else total += infliger(e, C, eff.degats, ev);
        }
        break;
      }
      case 'moitieDegats':
        cible.effets.push({ type: 'moitieDegats' });
        break;
      case 'changeSujet': {
        if (e.config.mode !== 'general') break;
        const communs = sujetsCommuns(cat, lanceur.persoId, cible.persoId).filter((s) => !e.manches.includes(s));
        if (communs.length === 0) break;
        const nouveau = alea.choisir(communs);
        e.manches[e.manche] = nouveau;
        ev.push({ type: 'changeSujet', sujet: nouveau });
        break;
      }
      case 'rejoueDouble':
        if (lanceur.derniereAttaque) total += infliger(e, C, lanceur.derniereAttaque.degats * 2, ev);
        break;
      case 'tourEclair':
        lanceur.effets.push({ type: 'tourEclair', secondes: eff.secondes, multiplicateur: eff.multiplicateur });
        cible.effets.push({ type: 'tourEclair', secondes: eff.secondes, multiplicateur: eff.multiplicateur });
        break;
      case 'siErreur':
        if (cible.derniereReponseFausse) total += infliger(e, C, eff.degats, ev);
        break;
      case 'deuxReponses':
        lanceur.effets.push({ type: 'deuxReponses' });
        break;
      case 'ambianceRecharge':
        lanceur.effets.push({ type: 'ambianceRecharge', tours: eff.tours + 1 });
        break;
    }
  }
  return total;
}

/** Score de culture politique du joueur, en %. */
export function scoreCulture(e: EtatCombat): number {
  const j = e.camps.joueur;
  return j.total === 0 ? 0 : Math.round((j.bonnes / j.total) * 100);
}
