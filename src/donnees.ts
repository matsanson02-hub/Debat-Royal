// Chargement et validation du contenu (src/data). Les entrées a_completer et
// tout ce qui n'a pas de source sont masqués : le jeu n'affiche jamais une
// information non sourcée.

import type { Catalogue } from './moteur/catalogue';
import type { Plateau, Tenue } from './moteur/economie';
import { genererQuestions } from './moteur/questions';
import type { ContenuUrnes, Urne } from './moteur/tirage-urnes';
import { RARETE_DE_REF, RARETES } from './moteur/tirage-urnes';
import type { Argument, Candidat, CarteChaos, Legende, Mesure, Question, Ref, SujetId } from './moteur/types';
import { SUJETS } from './moteur/types';

import boutiqueJson from './data/boutique.json';
import chaosJson from './data/chaos.json';
import moderateurJson from './data/moderateur.json';
import plateauxJson from './data/plateaux.json';
import sujetsJson from './data/sujets.json';
import tenuesJson from './data/tenues.json';
import urnesJson from './data/urnes.json';

const fichiersCandidats = import.meta.glob('./data/candidats/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;
const fichiersProgrammes = import.meta.glob('./data/programmes/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;
const fichiersQuestions = import.meta.glob('./data/questions/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;
const fichiersLegendes = import.meta.glob('./data/legendes.json', { eager: true, import: 'default' }) as Record<string, unknown>;
const fichiersRefs = import.meta.glob('./data/refs.json', { eager: true, import: 'default' }) as Record<string, unknown>;

export interface InfoSujet {
  id: SujetId;
  libelle: string;
  court: string;
  icone: string;
  couleur: string;
  annonces: string[];
}

export interface Sachet {
  id: string;
  nom: string;
  quantite: number;
  prixAffiche: string;
}

export interface OffreJour {
  id: string;
  type: 'urne' | 'lot';
  urne: string;
  quantite?: number;
  prix: { paluches?: number; parrainages?: number };
  libelle: string;
}

export type Moderateur = Record<string, string[]> & { nom: string[] };

export interface Contenu {
  catalogue: Catalogue;
  sujets: InfoSujet[];
  /** tous les candidats, jouables ou non (pour la sélection et les fiches) */
  candidats: Candidat[];
  /** toutes les mesures, y compris a_completer (masquées à l'affichage) */
  toutesMesures: Mesure[];
  urnes: Urne[];
  plateaux: Plateau[];
  tenues: Tenue[];
  boutique: { offresDuJour: OffreJour[]; sachets: Sachet[] };
  moderateur: Record<string, string[] | string>;
  contenuUrnes: ContenuUrnes;
  problemes: string[];
}

function tableaux<T>(fichiers: Record<string, unknown>): T[] {
  return Object.values(fichiers).flatMap((v) => (Array.isArray(v) ? (v as T[]) : v ? [v as T] : []));
}

function sourceValide(s: unknown): boolean {
  return !!s && typeof s === 'object' && typeof (s as { url?: unknown }).url === 'string' && /^https?:\/\//.test((s as { url: string }).url);
}

function questionValide(q: Question): boolean {
  return (
    q.statut !== 'a_completer' &&
    !!q.question &&
    Array.isArray(q.choix) &&
    q.choix.length === 4 &&
    q.choix.every((c) => typeof c === 'string' && c.trim() !== '') &&
    new Set(q.choix).size === 4 &&
    Number.isInteger(q.bonne) &&
    q.bonne >= 0 &&
    q.bonne < 4 &&
    sourceValide(q.source) &&
    SUJETS.includes(q.sujet)
  );
}

export function construireContenu(): Contenu {
  const problemes: string[] = [];
  const sujets = sujetsJson as InfoSujet[];
  const libelles = Object.fromEntries(sujets.map((s) => [s.id, s.libelle])) as Record<SujetId, string>;

  const toutesMesures = tableaux<Mesure>(fichiersProgrammes);
  const mesuresOk = toutesMesures.filter((m) => m.statut === 'ok' && !!m.intitule && sourceValide(m.source) && SUJETS.includes(m.sujet));
  const idsMesuresOk = new Set(mesuresOk.map((m) => m.id));

  // Candidats : on ne garde que les arguments dont la mesure est sourcée.
  const candidats = tableaux<Candidat>(fichiersCandidats).map((c) => {
    const args: Candidat['arguments'] = {};
    const ultimes: Candidat['ultimes'] = {};
    for (const s of SUJETS) {
      const liste = (c.arguments?.[s] ?? []).filter((a: Argument) => {
        const ok = idsMesuresOk.has(a.mesure);
        if (!ok) problemes.push(`Argument ${a.id} masqué : mesure ${a.mesure} absente ou à compléter`);
        return ok;
      });
      if (liste.length > 0) args[s] = liste;
      const u = c.ultimes?.[s];
      if (u && idsMesuresOk.has(u.mesure)) ultimes[s] = u;
    }
    const entree = c.entree && c.entree.replique && sourceValide(c.entree.source) ? c.entree : null;
    return { ...c, entree, arguments: args, ultimes };
  });
  const nomFamille = (n: string) => n.split(' ').slice(1).join(' ');
  candidats.sort((a, b) => nomFamille(a.nom).localeCompare(nomFamille(b.nom), 'fr'));

  const legendes = tableaux<Legende>(fichiersLegendes).map((l) => ({
    ...l,
    entree: l.entree && l.entree.replique && sourceValide(l.entree.source) ? l.entree : null,
    questions: (l.questions ?? []).filter((q) => {
      const ok = questionValide(q);
      if (!ok) problemes.push(`Question ${q.id} masquée (légende ${l.id})`);
      return ok;
    }),
  }));

  const refs = tableaux<Ref>(fichiersRefs).filter((r) => {
    const ok = !!r.phrase && (r.meme || sourceValide(r.source)) && r.rarete in RARETE_DE_REF;
    if (!ok) problemes.push(`Ref ${r.id} masquée : source manquante`);
    return ok;
  });

  const manuelles = tableaux<Question>(fichiersQuestions).filter((q) => {
    const ok = questionValide(q) && (!q.mesure || idsMesuresOk.has(q.mesure) || q.categorie !== 'programme');
    if (!ok) problemes.push(`Question ${q.id} masquée`);
    return ok;
  });
  const generees = genererQuestions(candidats, mesuresOk, libelles);

  const chaos = chaosJson as unknown as CarteChaos[];
  const tenues = tenuesJson as Tenue[];

  const catalogue: Catalogue = {
    candidats: new Map(candidats.map((c) => [c.id, c])),
    mesures: new Map(mesuresOk.map((m) => [m.id, m])),
    questions: [...manuelles, ...generees],
    legendes: new Map(legendes.map((l) => [l.id, l])),
    chaos: new Map(chaos.map((c) => [c.id, c])),
    refs: new Map(refs.map((r) => [r.id, r])),
    libellesSujets: libelles,
  };

  const vide = () => Object.fromEntries(RARETES.map((r) => [r, [] as string[]])) as ContenuUrnes['ref'];
  const contenuUrnes: ContenuUrnes = { ref: vide(), legende: vide(), chaos: vide(), tenue: vide() };
  for (const r of refs) contenuUrnes.ref[RARETE_DE_REF[r.rarete]].push(r.id);
  for (const l of legendes) contenuUrnes.legende[l.rarete].push(l.id);
  for (const c of chaos) contenuUrnes.chaos[c.rarete].push(c.id);
  for (const t of tenues) if (!t.niveauRequis) contenuUrnes.tenue[t.rarete].push(t.id);

  return {
    catalogue,
    sujets,
    candidats,
    toutesMesures,
    urnes: urnesJson as unknown as Urne[],
    plateaux: plateauxJson as unknown as Plateau[],
    tenues,
    boutique: boutiqueJson as unknown as Contenu['boutique'],
    moderateur: moderateurJson as unknown as Record<string, string[] | string>,
    contenuUrnes,
    problemes,
  };
}

let cache: Contenu | null = null;
export function contenu(): Contenu {
  if (!cache) cache = construireContenu();
  return cache;
}

export function infoSujet(id: SujetId): InfoSujet {
  return contenu().sujets.find((s) => s.id === id)!;
}

/** Une réplique du modérateur au hasard, avec remplacement de {nom}. */
export function replique(cle: string, vars: Record<string, string> = {}): string {
  const lignes = contenu().moderateur[cle];
  const liste = Array.isArray(lignes) ? lignes : [String(lignes ?? '')];
  const l = liste[Math.floor(Math.random() * liste.length)] ?? '';
  return l.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '');
}

export function nomDe(id: string): string {
  const c = contenu();
  return c.catalogue.candidats.get(id)?.nom ?? c.catalogue.legendes.get(id)?.nom ?? [...c.catalogue.refs.values()].find((r) => r.perso === id && r.nom)?.nom ?? id;
}

export function couleurDe(id: string): string {
  const c = contenu();
  return c.catalogue.candidats.get(id)?.couleur ?? c.catalogue.legendes.get(id)?.couleur ?? '#888';
}
