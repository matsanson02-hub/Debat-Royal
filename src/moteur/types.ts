// Types partagés du moteur. Aucun import React ici : le moteur doit pouvoir
// tourner côté serveur plus tard (duel en ligne, défi du jour).

export type SujetId =
  | 'education'
  | 'retraites'
  | 'pouvoir-achat'
  | 'immigration'
  | 'ecologie'
  | 'sante'
  | 'securite'
  | 'europe';

export const SUJETS: SujetId[] = [
  'education',
  'retraites',
  'pouvoir-achat',
  'immigration',
  'ecologie',
  'sante',
  'securite',
  'europe',
];

export type StatutContenu = 'ok' | 'a_completer';
export type StatutCandidat = 'declare' | 'a_verifier' | 'retire';
export type Rarete = 'commune' | 'rare' | 'epique' | 'legendaire';
export type RareteRef = 'petite_phrase' | 'punchline' | 'moment_culte' | 'replique_historique';
export type Categorie = 'programme' | 'parcours' | 'culte';
export type Difficulte = 1 | 2 | 3;
export type NiveauIA = 'facile' | 'normal' | 'difficile';

export interface Source {
  url: string;
  libelle: string;
  date?: string;
}

export interface Replique {
  replique: string;
  contexte?: string;
  date?: string;
  source: Source;
}

export interface Argument {
  id: string;
  nom: string;
  bulle: string;
  puissance: number;
  mesure: string;
}

export interface Candidat {
  id: string;
  nom: string;
  parti: string;
  statut: StatutCandidat;
  statut_note?: string;
  verifie_le: string;
  surnom: string;
  couleur: string;
  entree: Replique | null;
  arguments: Partial<Record<SujetId, Argument[]>>;
  ultimes: Partial<Record<SujetId, Argument>>;
}

export interface Mesure {
  id: string;
  perso: string;
  sujet: SujetId;
  intitule: string;
  detail: string;
  millesime: number;
  source: Source | null;
  verifie_le: string;
  statut: StatutContenu;
}

export interface Question {
  id: string;
  perso: string;
  sujet: SujetId;
  categorie: Categorie;
  difficulte: Difficulte;
  question: string;
  choix: string[];
  bonne: number;
  explication: string;
  mesure?: string;
  source: Source | null;
  statut: StatutContenu;
  /** true pour les questions fabriquées par le jeu à partir des mesures */
  generee?: boolean;
}

export type EffetLegende = 'attaque' | 'bouclier' | 'soin' | 'vol_combo';

export interface Legende {
  id: string;
  nom: string;
  parti: string;
  role: string;
  couleur: string;
  rarete: Rarete;
  effet: EffetLegende;
  surnom: string;
  entree: Replique | null;
  questions: Question[];
}

export interface Ref {
  id: string;
  /** réplique culte ou mème sans source officielle : affichée avec l'étiquette « Mème » */
  meme?: boolean;
  /** nom affiché quand la personne n'est ni candidate ni légende */
  nom?: string;
  /** « tous » : équipable sur n'importe quel candidat */
  equipable?: 'tous';
  perso: string;
  rarete: RareteRef;
  phrase: string;
  contexte?: string;
  date?: string;
  sujet: SujetId | null;
  source: Source;
}

/** Une ref possédée ou équipée, avec son niveau de fusion (1 à 5). */
export interface RefNiveau {
  id: string;
  niveau: number;
}

// ---------- Cartes chaos ----------

export type EffetChaos =
  | { type: 'degats'; valeur: number }
  | { type: 'tourPerdu' }
  | { type: 'brulure'; valeur: number; tours: number }
  | { type: 'chronoFixe'; secondes: number; questions: number }
  | { type: 'chronoReduit'; secondes: number; questions: number }
  | { type: 'superMoins'; valeur: number }
  | { type: 'argumentBloque'; tours: number }
  | { type: 'reponsesCachees'; ms: number; questions: number }
  | { type: 'annuleUltime' }
  | { type: 'soin'; valeur: number }
  | { type: 'superPlus'; valeur: number }
  | { type: 'mediapart'; degats: number }
  | { type: 'moitieDegats' }
  | { type: 'changeSujet' }
  | { type: 'rejoueDouble' }
  | { type: 'tourEclair'; secondes: number; multiplicateur: number }
  | { type: 'siErreur'; degats: number }
  | { type: 'deuxReponses' }
  | { type: 'ambianceRecharge'; tours: number };

export interface ActeurScene {
  sprite: string;
  nombre: number;
  entree: 'gauche' | 'droite' | 'fond' | 'haut' | 'gradins';
  trajet: 'centre' | 'cible' | 'traverse' | 'ronde' | 'lanceur' | 'tombe';
  duree: number;
  delai?: number;
  echelle?: number;
  pancartes?: string[];
  /** nom affiché sur la silhouette si l'image manque */
  nom?: string;
}

export interface SceneChaos {
  acteurs: ActeurScene[];
  effets: string[];
  bandeau?: string;
  moderateur: string;
  public: 'applaudit' | 'hue' | 'scande' | 'panique' | 'rit';
  son: string;
}

export interface CarteChaos {
  id: string;
  nom: string;
  type: 'public' | 'intervenant';
  rarete: Rarete;
  description: string;
  effets: EffetChaos[];
  /** jouable uniquement en débat général */
  generalSeulement?: boolean;
  scene: SceneChaos;
}

// ---------- Combat ----------

export type Camp = 'joueur' | 'adversaire';

export type EffetActif =
  | { type: 'brulure'; valeur: number; tours: number }
  | { type: 'chronoFixe'; secondes: number; questions: number }
  | { type: 'chronoReduit'; secondes: number; questions: number }
  | { type: 'argumentBloque'; argId: string; tours: number }
  | { type: 'reponsesCachees'; ms: number; questions: number }
  | { type: 'tourPerdu' }
  | { type: 'bouclier' }
  | { type: 'moitieDegats' }
  | { type: 'deuxReponses' }
  | { type: 'tourEclair'; secondes: number; multiplicateur: number }
  | { type: 'ambianceRecharge'; tours: number };

export interface EtatCamp {
  persoId: string;
  pv: number;
  combo: number;
  super: number;
  invocation: number;
  ambiance: number;
  refs: RefNiveau[];
  /** index de la prochaine ref à se déclencher (rotation) */
  prochaineRef: number;
  legendes: { id: string; utilisee: boolean }[];
  chaos: { id: string; utilisee: boolean }[];
  effets: EffetActif[];
  derniereAttaque: { degats: number; nom: string; bulle: string } | null;
  derniereReponseFausse: boolean;
  bonnes: number;
  total: number;
  critiques: number;
}

export type ContexteQuestion =
  | { type: 'argument'; argId: string }
  | { type: 'ultime' }
  | { type: 'legende'; legendeId: string }
  | { type: 'chaos'; carteId: string }
  | { type: 'mediapart'; lanceur: Camp };

export interface QuestionEnCours {
  question: Question;
  contexte: ContexteQuestion;
  /** camp qui doit répondre */
  repondant: Camp;
  /** camp qui a déclenché l'action */
  lanceur: Camp;
  chrono: number;
  reponsesCacheesMs: number;
  /** indices des choix retirés (HugoDécrypte) */
  retires: number[];
}

export type Evenement =
  | { type: 'annonce'; sujet: SujetId; manche: number }
  | { type: 'attaque'; camp: Camp; nom: string; bulle: string; degats: number; critique: boolean; ultime: boolean; ref?: { id: string; phrase: string; source: Source } }
  | { type: 'erreur'; camp: Camp; degats: number }
  | { type: 'bouclier'; camp: Camp }
  | { type: 'legende'; camp: Camp; legendeId: string; reussi: boolean; effet: EffetLegende; valeur: number }
  | { type: 'chaos'; camp: Camp; carteId: string; reussi: boolean; degats: number }
  | { type: 'brulure'; camp: Camp; degats: number }
  | { type: 'tourPerdu'; camp: Camp }
  | { type: 'soin'; camp: Camp; valeur: number }
  | { type: 'mesure'; mesureId: string }
  | { type: 'changeSujet'; sujet: SujetId }
  | { type: 'ko'; camp: Camp };

export interface Resolution {
  questionId: string;
  question: Question;
  repondant: Camp;
  choix: number | null;
  correct: boolean;
  bonne: number;
  explication: string;
  source: Source | null;
  tempsRestant: number;
  evenements: Evenement[];
}

export type Phase = 'annonce' | 'choix' | 'question' | 'resultat' | 'fin';

export interface ConfigCombat {
  mode: 'cible' | 'general';
  sujetCible?: SujetId;
  niveauIA: NiveauIA;
  joueur: { persoId: string; legendes: string[]; chaos: string[]; refs: RefNiveau[] };
  adversaire: { persoId: string; legendes: string[]; chaos: string[]; refs: RefNiveau[] };
  graine: number;
}

export interface EtatCombat {
  config: ConfigCombat;
  manches: SujetId[];
  manche: number;
  /** nombre d'actions jouées dans la manche (2 tours = 4 actions) */
  actionsManche: number;
  actif: Camp;
  phase: Phase;
  camps: Record<Camp, EtatCamp>;
  questionEnCours: QuestionEnCours | null;
  resolution: Resolution | null;
  posees: string[];
  mesuresDebloquees: string[];
  rng: number;
  vainqueur: Camp | null;
  /** tous les événements depuis le début, pour les animations et l'écran de fin */
  journal: Evenement[];
}

export type Action =
  | { type: 'commencerManche' }
  | { type: 'choisirArgument'; argId: string }
  | { type: 'lancerUltime' }
  | { type: 'invoquerLegende'; legendeId: string }
  | { type: 'jouerChaos'; carteId: string }
  | { type: 'repondre'; choix: number | null; tempsRestant: number }
  | { type: 'tourIA' }
  | { type: 'suite' };
