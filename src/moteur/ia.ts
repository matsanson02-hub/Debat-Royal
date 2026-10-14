import type { Catalogue } from './catalogue';
import { REUSSITE_IA } from './constantes';
import { ambiancePleine, invocationPleine, superPleine } from './jauges';
import type { Alea } from './rng';
import type { Action, EtatCamp, EtatCombat, NiveauIA, SujetId } from './types';

/** Arguments jouables d'un camp sur un sujet (sans ceux bloqués par des militants). */
export function argumentsDisponibles(cat: Catalogue, camp: EtatCamp, sujet: SujetId) {
  const tous = cat.candidats.get(camp.persoId)?.arguments[sujet] ?? [];
  const bloques = new Set(camp.effets.flatMap((e) => (e.type === 'argumentBloque' ? [e.argId] : [])));
  return tous.filter((a) => !bloques.has(a.id));
}

export function ultimeDisponible(cat: Catalogue, camp: EtatCamp, sujet: SujetId) {
  return cat.candidats.get(camp.persoId)?.ultimes[sujet] ?? null;
}

export function chaosJouables(cat: Catalogue, etat: EtatCombat, camp: EtatCamp) {
  return camp.chaos.filter((c) => {
    if (c.utilisee) return false;
    const carte = cat.chaos.get(c.id);
    if (!carte) return false;
    if (carte.generalSeulement && etat.config.mode !== 'general') return false;
    return true;
  });
}

/** L'IA lance son ultime, ses légendes et ses cartes chaos dès que ses jauges sont pleines. */
export function deciderIA(cat: Catalogue, etat: EtatCombat, alea: Alea): Action {
  const camp = etat.camps.adversaire;
  const sujet = etat.manches[etat.manche];
  if (superPleine(camp) && ultimeDisponible(cat, camp, sujet)) return { type: 'lancerUltime' };
  const legende = camp.legendes.find((l) => !l.utilisee && cat.legendes.has(l.id));
  if (invocationPleine(camp) && legende) return { type: 'invoquerLegende', legendeId: legende.id };
  const chaos = chaosJouables(cat, etat, camp);
  if (ambiancePleine(camp) && chaos.length > 0) return { type: 'jouerChaos', carteId: alea.choisir(chaos).id };
  const args = argumentsDisponibles(cat, camp, sujet);
  if (args.length === 0) {
    const tous = cat.candidats.get(camp.persoId)?.arguments[sujet] ?? [];
    return { type: 'choisirArgument', argId: tous[0]?.id ?? '' };
  }
  return { type: 'choisirArgument', argId: alea.choisir(args).id };
}

/** Probabilité de bonne réponse de l'IA, ajustée par les effets subis. */
export function chanceIA(niveau: NiveauIA, chrono: number, chronoNormal: number, cachees: boolean, deuxReponses: boolean): number {
  let p = REUSSITE_IA[niveau];
  if (chrono < chronoNormal) p -= 0.1;
  if (cachees) p -= 0.05;
  if (deuxReponses) p += 0.15;
  return Math.max(0.2, Math.min(0.95, p));
}

/** Temps restant simulé quand l'IA répond (entre 20 % et 85 % du chrono). */
export function tempsIA(chrono: number, alea: Alea): number {
  return Math.round(chrono * (0.2 + alea.nombre() * 0.65) * 10) / 10;
}
