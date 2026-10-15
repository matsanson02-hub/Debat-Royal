import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { jouer } from '../lib/son';
import { contenu } from '../donnees';
import { plateauActuel } from '../moteur/economie';
import { useJeu } from '../etat';

export function Bouton({
  children,
  onClick,
  variante = 'bleu',
  disabled,
  grand,
  className = '',
  titre,
}: {
  children: ReactNode;
  onClick?: () => void;
  variante?: 'bleu' | 'or' | 'rose' | 'vert' | 'gris';
  disabled?: boolean;
  grand?: boolean;
  className?: string;
  titre?: string;
}) {
  return (
    <motion.button
      type="button"
      className={`bouton bouton-${variante} ${grand ? 'bouton-grand' : ''} ${className}`}
      whileTap={disabled ? undefined : { scale: 0.94, y: 2 }}
      disabled={disabled}
      title={titre}
      onClick={() => {
        if (disabled) return;
        jouer('clic');
        onClick?.();
      }}
    >
      {children}
    </motion.button>
  );
}

export function IconePaluche({ taille = 20 }: { taille?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={taille} height={taille} aria-hidden>
      <path d="M9 30 C 5 26, 4 20, 6 16 L 6 9 C 6 7, 9 7, 9 9 L 9 15 L 10 5 C 10 3, 13 3, 13 5 L 13 14 L 14 3 C 14 1, 17 1, 17 3 L 17 14 L 18 5 C 18 3, 21 3, 21 5 L 21 16 L 23 12 C 24 10, 27 11, 26 13 L 23 22 C 21 27, 18 30, 14 30 Z" fill="#ffd27a" stroke="#0b1340" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function IconeParrainage({ taille = 20 }: { taille?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={taille} height={taille} aria-hidden>
      <rect x="5" y="3" width="20" height="26" rx="2" fill="#f4f1ff" stroke="#0b1340" strokeWidth="2" />
      <path d="M9 9 H21 M9 13 H21 M9 17 H16" stroke="#7a86b8" strokeWidth="2" />
      <circle cx="21" cy="22" r="6" fill="#b46cff" stroke="#0b1340" strokeWidth="2" />
      <path d="M18 22 L20 24 L24 20" stroke="#fff" strokeWidth="2" fill="none" />
    </svg>
  );
}

export function IconeSondage({ taille = 20 }: { taille?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={taille} height={taille} aria-hidden>
      <rect x="4" y="18" width="6" height="10" fill="#5ec8f2" stroke="#0b1340" strokeWidth="2" />
      <rect x="13" y="11" width="6" height="17" fill="#ffcc33" stroke="#0b1340" strokeWidth="2" />
      <rect x="22" y="5" width="6" height="23" fill="#ff4d8d" stroke="#0b1340" strokeWidth="2" />
    </svg>
  );
}

export function BarreHaut({ retour, titre }: { retour?: () => void; titre?: string }) {
  const { profil } = useJeu();
  const plateau = plateauActuel(profil.sondage, contenu().plateaux);
  return (
    <header className="barre-haut">
      {retour ? (
        <Bouton variante="gris" onClick={retour} className="bouton-retour" titre="Retour">
          ←
        </Bouton>
      ) : (
        <span />
      )}
      {titre && <h1 className="titre-ecran">{titre}</h1>}
      <div className="monnaies">
        <span className="monnaie" title="Paluches">
          <IconePaluche /> {profil.paluches.toLocaleString('fr-FR')}
        </span>
        <span className="monnaie parrainages" title="Parrainages">
          <IconeParrainage /> {profil.parrainages.toLocaleString('fr-FR')}
        </span>
        <span className="monnaie sondage" title={`Points de sondage — ${plateau.nom}`}>
          <IconeSondage /> {profil.sondage}
        </span>
      </div>
    </header>
  );
}

export function Rarete({ rarete }: { rarete: string }) {
  const libelles: Record<string, string> = {
    commune: 'Commune',
    rare: 'Rare',
    epique: 'Épique',
    legendaire: 'Légendaire',
    petite_phrase: 'Petite phrase',
    punchline: 'Punchline',
    moment_culte: 'Moment culte',
    replique_historique: 'Réplique historique',
  };
  return <span className={`rarete rarete-${rarete}`}>{libelles[rarete] ?? rarete}</span>;
}

export function LienSource({ source }: { source: { url: string; libelle: string; date?: string } | null | undefined }) {
  if (!source) return null;
  if (!source.url) return <span className="lien-source sans-lien">{source.libelle}</span>;
  return (
    <a className="lien-source" href={source.url} target="_blank" rel="noreferrer">
      Source : {source.libelle}
      {source.date ? ` (${source.date})` : ''}
    </a>
  );
}

export function Ecran({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <main className={`ecran ${className}`}>{children}</main>
  );
}
