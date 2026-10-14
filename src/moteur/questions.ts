// Fabrique des questions à partir des mesures sourcées : aucune information
// nouvelle n'est créée, on ne fait que réarranger des données vérifiées.
// Les pièges sont de vraies propositions d'autres candidats sur le même sujet.

import { Alea } from './rng';
import type { Candidat, Mesure, Question, SujetId } from './types';

const MOTS_VIDES = new Set(['dans', 'pour', 'avec', 'sans', 'des', 'les', 'une', 'aux', 'par', 'sur', 'tous', 'toutes', 'plus', 'moins', 'leur', 'leurs', 'cette', 'entre']);

function mots(texte: string): Set<string> {
  return new Set(
    texte
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .split(/[^a-z0-9]+/)
      .filter((m) => m.length >= 4 && !MOTS_VIDES.has(m)),
  );
}

/** Deux mesures sont jugées proches si elles partagent beaucoup de mots (Jaccard ≥ 0,35). */
export function similaires(a: string, b: string): boolean {
  const ma = mots(a);
  const mb = mots(b);
  if (ma.size === 0 || mb.size === 0) return a.trim().toLowerCase() === b.trim().toLowerCase();
  let commun = 0;
  for (const m of ma) if (mb.has(m)) commun++;
  return commun / (ma.size + mb.size - commun) >= 0.35;
}

function hacher(texte: string): number {
  let h = 2166136261;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function placer(bonne: string, pieges: string[], graine: string): { choix: string[]; bonne: number } {
  const alea = new Alea(hacher(graine));
  const choix = alea.melanger([bonne, ...pieges]);
  return { choix, bonne: choix.indexOf(bonne) };
}

function millesime(m: Mesure): string {
  return m.millesime && m.millesime < 2027 ? ` (programme ${m.millesime})` : '';
}

export function genererQuestions(
  candidats: Candidat[],
  mesures: Mesure[],
  libelles: Record<SujetId, string>,
): Question[] {
  const ok = mesures.filter((m) => m.statut === 'ok' && m.intitule);
  const parPersoSujet = new Map<string, Mesure[]>();
  for (const m of ok) {
    const cle = `${m.perso}|${m.sujet}`;
    if (!parPersoSujet.has(cle)) parPersoSujet.set(cle, []);
    parPersoSujet.get(cle)!.push(m);
  }
  const nom = new Map(candidats.map((c) => [c.id, c.nom]));
  const res: Question[] = [];

  for (const m of ok) {
    const auteur = nom.get(m.perso);
    if (!auteur) continue;
    const siennes = parPersoSujet.get(`${m.perso}|${m.sujet}`) ?? [];
    const autres = ok.filter(
      (x) => x.sujet === m.sujet && x.perso !== m.perso && nom.has(x.perso) && !siennes.some((s) => similaires(s.intitule, x.intitule)),
    );
    const explication = `${auteur} propose : ${m.intitule}${millesime(m)}. ${m.detail}`.trim();
    const base = { perso: m.perso, sujet: m.sujet, mesure: m.id, source: m.source, statut: 'ok' as const, generee: true, explication };

    // Difficulté 1 : « Quel candidat propose… ? »
    const persosPieges = [...new Set(autres.filter((x) => !similaires(x.intitule, m.intitule)).map((x) => x.perso))];
    // On écarte aussi tout candidat qui aurait une mesure proche de celle-ci.
    const exclus = new Set(ok.filter((x) => x.perso !== m.perso && similaires(x.intitule, m.intitule)).map((x) => x.perso));
    const nomsPieges = persosPieges.filter((p) => !exclus.has(p)).map((p) => nom.get(p)!);
    if (nomsPieges.length >= 3) {
      const alea = new Alea(hacher(m.id + 'q1'));
      const { choix, bonne } = placer(auteur, alea.melanger(nomsPieges).slice(0, 3), m.id + 'p1');
      res.push({ ...base, id: `gen-${m.id}-qui`, categorie: 'programme', difficulte: 1, question: `Quel candidat propose : « ${m.intitule} » ?`, choix, bonne });
    }

    // Difficulté 2 : « Sur tel sujet, que propose X ? »
    const intitulesPieges = [...new Set(autres.map((x) => x.intitule))].filter((t) => !similaires(t, m.intitule));
    if (intitulesPieges.length >= 3) {
      const alea = new Alea(hacher(m.id + 'q2'));
      const { choix, bonne } = placer(m.intitule, alea.melanger(intitulesPieges).slice(0, 3), m.id + 'p2');
      res.push({ ...base, id: `gen-${m.id}-quoi`, categorie: 'programme', difficulte: 2, question: `${libelles[m.sujet]} : que propose ${auteur} ?`, choix, bonne });
    }
  }

  // Difficulté 3 : « Laquelle de ces mesures X ne propose PAS ? » (une par candidat et par sujet)
  for (const [cle, siennes] of parPersoSujet) {
    const [perso, sujet] = cle.split('|') as [string, SujetId];
    const auteur = nom.get(perso);
    if (!auteur || siennes.length < 3) continue;
    const intrus = ok.find(
      (x) => x.sujet === sujet && x.perso !== perso && nom.has(x.perso) && !siennes.some((s) => similaires(s.intitule, x.intitule)),
    );
    if (!intrus) continue;
    const alea = new Alea(hacher(cle + 'q3'));
    const vraies = alea.melanger(siennes).slice(0, 3).map((s) => s.intitule);
    const { choix, bonne } = placer(intrus.intitule, vraies, cle + 'p3');
    res.push({
      id: `gen-${perso}-${sujet}-intrus`,
      perso,
      sujet,
      categorie: 'programme',
      difficulte: 3,
      question: `${libelles[sujet]} : laquelle de ces mesures ${auteur} ne propose PAS ?`,
      choix,
      bonne,
      explication: `C'est une proposition de ${nom.get(intrus.perso)} : ${intrus.intitule}${millesime(intrus)}. Les trois autres figurent dans le programme de ${auteur}.`,
      mesure: intrus.id,
      source: intrus.source,
      statut: 'ok',
      generee: true,
    });
  }
  return res;
}
