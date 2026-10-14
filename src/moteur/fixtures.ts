// Petit catalogue fictif utilisé uniquement par les tests du moteur.
import type { Catalogue } from './catalogue';
import { genererQuestions } from './questions';
import type { Candidat, CarteChaos, Legende, Mesure, Question, Ref, SujetId } from './types';
import { SUJETS } from './types';

export const LIBELLES = Object.fromEntries(SUJETS.map((s) => [s, s.toUpperCase()])) as Record<SujetId, string>;

function candidat(id: string, sujets: SujetId[]): Candidat {
  const args: Candidat['arguments'] = {};
  const ult: Candidat['ultimes'] = {};
  for (const s of sujets) {
    args[s] = [14, 16, 18].map((p, i) => ({ id: `${id}-${s}-${i + 1}`, nom: `Arg ${i + 1}`, bulle: 'Bulle', puissance: p, mesure: `${id}-${s}-${i + 1}` }));
    ult[s] = { id: `${id}-${s}-u`, nom: 'Ultime', bulle: 'Ultime !', puissance: 32, mesure: `${id}-${s}-u` };
  }
  return { id, nom: `Nom ${id}`, parti: 'Parti', statut: 'declare', verifie_le: '2026-10-14', surnom: 'Surnom', couleur: '#123456', entree: null, arguments: args, ultimes: ult };
}

const THEMES = ['tablettes numeriques', 'cantines gratuites', 'internats ruraux', 'apprentissage precoce', 'stages obligatoires', 'chorales scolaires', 'langues regionales', 'olympiades mathematiques', 'potagers scolaires', 'echecs obligatoires', 'theatre lycee', 'robotique college'];

function mesures(id: string, sujets: SujetId[], decalage: number): Mesure[] {
  const res: Mesure[] = [];
  for (const s of sujets) {
    ['1', '2', '3', 'u'].forEach((n, i) => {
      res.push({ id: `${id}-${s}-${n}`, perso: id, sujet: s, intitule: `Mesure ${THEMES[(decalage + i) % THEMES.length]} ${s}`, detail: 'Détail.', millesime: 2027, source: { url: 'https://exemple.fr', libelle: 'Exemple' }, verifie_le: '2026-10-14', statut: 'ok' });
    });
  }
  return res;
}

function questionsManuelles(id: string, sujets: SujetId[]): Question[] {
  return sujets.flatMap((s) =>
    [1, 2, 3].map((d) => ({
      id: `${id}-q-${s}-${d}`,
      perso: id,
      sujet: s,
      categorie: d === 1 ? ('parcours' as const) : ('programme' as const),
      difficulte: d as 1 | 2 | 3,
      question: `Question ${d}`,
      choix: ['A', 'B', 'C', 'D'],
      bonne: 0,
      explication: 'Car.',
      mesure: d === 1 ? undefined : `${id}-${s}-1`,
      source: { url: 'https://exemple.fr', libelle: 'Exemple' },
      statut: 'ok' as const,
    })),
  );
}

export function catalogueTest(): Catalogue {
  const sujets: SujetId[] = ['education', 'retraites', 'sante', 'europe', 'ecologie'];
  const ids = ['a', 'b', 'c', 'd'];
  const cands = ids.map((id) => candidat(id, sujets));
  const mes = ids.flatMap((id, i) => mesures(id, sujets, i * 3));
  const legende: Legende = {
    id: 'leg',
    nom: 'Légende',
    parti: 'P',
    role: 'Rôle',
    couleur: '#000',
    rarete: 'commune',
    effet: 'soin',
    surnom: 'S',
    entree: null,
    questions: [1, 2, 3].map((i) => ({ id: `leg-q-${i}`, perso: 'leg', sujet: 'education' as const, categorie: 'parcours' as const, difficulte: 2 as const, question: 'Q', choix: ['A', 'B', 'C', 'D'], bonne: 1, explication: 'E', source: null, statut: 'ok' as const })),
  };
  const bouclier: Legende = { ...legende, id: 'leg2', effet: 'bouclier', questions: legende.questions.map((q) => ({ ...q, id: q.id + 'b', perso: 'leg2' })) };
  const chaos: CarteChaos[] = [
    { id: 'invasion', nom: 'Invasion', type: 'public', rarete: 'commune', description: '', effets: [{ type: 'degats', valeur: 30 }], scene: { acteurs: [], effets: [], moderateur: '', public: 'panique', son: '' } },
    { id: 'gilets', nom: 'Gilets', type: 'public', rarete: 'legendaire', description: '', effets: [{ type: 'degats', valeur: 38 }, { type: 'tourPerdu' }], scene: { acteurs: [], effets: [], moderateur: '', public: 'scande', son: '' } },
    { id: 'feu', nom: 'Feu', type: 'public', rarete: 'rare', description: '', effets: [{ type: 'brulure', valeur: 15, tours: 2 }], scene: { acteurs: [], effets: [], moderateur: '', public: 'panique', son: '' } },
    { id: 'bfm', nom: 'BFM', type: 'intervenant', rarete: 'rare', description: '', generalSeulement: true, effets: [{ type: 'changeSujet' }], scene: { acteurs: [], effets: [], moderateur: '', public: 'rit', son: '' } },
  ];
  const refs: Ref[] = [
    { id: 'ref-a', perso: 'a', rarete: 'replique_historique', phrase: 'Phrase', sujet: 'education', source: { url: 'https://exemple.fr', libelle: 'Ex' } },
    { id: 'ref-leg', perso: 'leg', rarete: 'petite_phrase', phrase: 'Slogan', sujet: null, source: { url: 'https://exemple.fr', libelle: 'Ex' } },
    { id: 'ref-b', perso: 'b', rarete: 'punchline', phrase: 'Punch', sujet: null, source: { url: 'https://exemple.fr', libelle: 'Ex' } },
  ];
  const questions = [...ids.flatMap((id) => questionsManuelles(id, sujets)), ...genererQuestions(cands, mes, LIBELLES)];
  return {
    candidats: new Map(cands.map((c) => [c.id, c])),
    mesures: new Map(mes.map((m) => [m.id, m])),
    questions,
    legendes: new Map([legende, bouclier].map((l) => [l.id, l])),
    chaos: new Map(chaos.map((c) => [c.id, c])),
    refs: new Map(refs.map((r) => [r.id, r])),
    libellesSujets: LIBELLES,
  };
}
