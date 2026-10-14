// État global de l'application : profil du joueur (sauvegardé à chaque
// changement) et navigation entre écrans.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { Gains, Profil } from './moteur/economie';
import type { ConfigCombat, EtatCombat, SujetId } from './moteur/types';
import { activerSon } from './lib/son';
import { charger, enregistrer } from './sauvegarde';

export interface ChoixDebat {
  mode: 'cible' | 'general';
  sujet?: SujetId;
}

export type Ecran =
  | { nom: 'accueil' }
  | { nom: 'tutoriel' }
  | { nom: 'choixDebat' }
  | { nom: 'selection'; debat: ChoixDebat; tutoriel?: boolean }
  | { nom: 'deck'; debat: ChoixDebat; perso: string; adversaire: string }
  | { nom: 'combat'; config: ConfigCombat; tutoriel?: boolean }
  | { nom: 'fin'; etat: EtatCombat; gains: Gains; tutoriel?: boolean }
  | { nom: 'programmes'; perso?: string; onglet?: 'fiches' | 'comparateur' | 'entrainement' }
  | { nom: 'collection' }
  | { nom: 'boutique' }
  | { nom: 'depouillement'; urnes: string[]; retour: Ecran };

interface ContexteJeu {
  profil: Profil;
  majProfil: (f: (p: Profil) => Profil) => void;
  ecran: Ecran;
  aller: (e: Ecran) => void;
  animationsReduites: boolean;
}

const Contexte = createContext<ContexteJeu | null>(null);

export function FournisseurJeu({ children }: { children: ReactNode }) {
  const [profil, setProfil] = useState<Profil>(() => charger());
  const [ecran, setEcran] = useState<Ecran>(() => (profil.tutorielFait ? { nom: 'accueil' } : { nom: 'tutoriel' }));
  const systemeReduit = useReducedMotion();

  useEffect(() => {
    enregistrer(profil);
    activerSon(profil.reglages.son);
  }, [profil]);

  const majProfil = useCallback((f: (p: Profil) => Profil) => setProfil((p) => f(p)), []);
  const aller = useCallback((e: Ecran) => {
    setEcran(e);
    window.scrollTo(0, 0);
  }, []);

  const valeur = useMemo(
    () => ({ profil, majProfil, ecran, aller, animationsReduites: profil.reglages.animationsReduites || !!systemeReduit }),
    [profil, majProfil, ecran, aller, systemeReduit],
  );
  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useJeu(): ContexteJeu {
  const c = useContext(Contexte);
  if (!c) throw new Error('useJeu hors du FournisseurJeu');
  return c;
}
