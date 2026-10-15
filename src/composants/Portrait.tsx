import { useState } from 'react';
import { sourcesLegende, sourcesPied, sourcesPortrait } from '../lib/assets';
import { contenu } from '../donnees';

interface Props {
  id: string;
  variante?: 'portrait' | 'pied' | 'legende';
  taille?: number;
  tenue?: string;
  className?: string;
  miroir?: boolean;
}

/** Image fournie par l'utilisateur, ou silhouette colorée avec le nom en attendant. */
export function Portrait({ id, variante = 'portrait', taille = 96, tenue, className = '', miroir }: Props) {
  const c = contenu();
  const fiche = c.catalogue.candidats.get(id) ?? c.catalogue.legendes.get(id) ?? c.candidats.find((x) => x.id === id);
  const nom = fiche?.nom ?? id;
  const couleur = fiche?.couleur ?? '#7a86b8';
  // En pied : image en pied, sinon le portrait affiché en buste, sinon la silhouette.
  const sources = variante === 'pied' ? [...sourcesPied(id), ...sourcesPortrait(id)] : variante === 'legende' ? sourcesLegende(id) : sourcesPortrait(id);
  const [essai, setEssai] = useState(0);
  const manquante = essai >= sources.length;
  const src = sources[Math.min(essai, sources.length - 1)];
  const buste = variante === 'pied' && !manquante && !src.includes('-pied');
  const t = tenue ? c.tenues.find((x) => x.id === tenue) : undefined;
  const ratio = variante === 'pied' ? 1.25 : variante === 'legende' ? 1.333 : 1;
  const style = {
    width: taille,
    height: taille * ratio,
    filter: t?.filtre,
    transform: miroir ? 'scaleX(-1)' : undefined,
  };
  return (
    <div className={`portrait portrait-${variante} ${buste ? 'portrait-buste' : ''} ${className}`} style={{ ...style, ['--couleur' as string]: couleur }} title={nom}>
      {manquante ? (
        <Silhouette nom={nom} couleur={couleur} pied={variante === 'pied'} miroir={miroir} />
      ) : (
        <img key={src} src={src} alt={nom} draggable={false} onError={() => setEssai((e) => e + 1)} />
      )}
      {t?.accessoire && <Accessoire type={t.accessoire} />}
    </div>
  );
}

export function Silhouette({ nom, couleur, pied, miroir }: { nom: string; couleur: string; pied?: boolean; miroir?: boolean }) {
  const initiales = nom
    .split(/[\s-]+/)
    .filter((m) => m.length > 2 || /^[A-ZÉ]/.test(m))
    .map((m) => m[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <svg viewBox={pied ? '0 0 100 125' : '0 0 100 100'} className="silhouette" aria-label={nom}>
      <defs>
        <radialGradient id={`g-${initiales}`} cx="0.5" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.15" />
        </radialGradient>
      </defs>
      {pied ? (
        <g>
          <ellipse cx="50" cy="120" rx="30" ry="4" fill="#000" opacity="0.25" />
          <path d="M22 118 C 22 78, 30 62, 50 62 C 70 62, 78 78, 78 118 Z" fill={couleur} stroke="#0b1340" strokeWidth="3" />
          <circle cx="50" cy="38" r="22" fill={couleur} stroke="#0b1340" strokeWidth="3" />
          <circle cx="50" cy="38" r="22" fill={`url(#g-${initiales})`} />
        </g>
      ) : (
        <g>
          <rect width="100" height="100" fill={couleur} opacity="0.35" />
          <path d="M14 100 C 14 72, 30 62, 50 62 C 70 62, 86 72, 86 100 Z" fill={couleur} stroke="#0b1340" strokeWidth="3" />
          <circle cx="50" cy="38" r="22" fill={couleur} stroke="#0b1340" strokeWidth="3" />
        </g>
      )}
      <text
        x="50"
        y={pied ? 96 : 92}
        textAnchor="middle"
        fontFamily="'Luckiest Guy', system-ui"
        fontSize="16"
        fill="#fff"
        stroke="#0b1340"
        strokeWidth="3"
        paintOrder="stroke"
        transform={miroir ? 'translate(100 0) scale(-1 1)' : undefined}
      >
        {initiales}
      </text>
    </svg>
  );
}

function Accessoire({ type }: { type: string }) {
  const contenu: Record<string, JSX.Element> = {
    echarpe: <path d="M20 70 L80 92 L76 100 L18 78 Z" fill="#0055a4" stroke="#0b1340" strokeWidth="2" />,
    cocarde: (
      <g transform="translate(70 70)">
        <circle r="9" fill="#0055a4" />
        <circle r="6" fill="#fff" />
        <circle r="3" fill="#e1000f" />
      </g>
    ),
    lunettes: (
      <g fill="#111" stroke="#0b1340" strokeWidth="1.5">
        <rect x="32" y="32" width="15" height="9" rx="3" />
        <rect x="53" y="32" width="15" height="9" rx="3" />
        <rect x="46" y="35" width="8" height="2" />
      </g>
    ),
    micro: (
      <g transform="translate(78 60) rotate(-20)">
        <rect x="-3" y="0" width="6" height="22" rx="2" fill="#333" />
        <circle r="7" fill="#ffcc33" stroke="#0b1340" strokeWidth="2" />
      </g>
    ),
    couronne: <path d="M30 18 C 28 4, 56 -2, 66 8 C 72 14, 70 22, 64 24 L 30 24 Z" fill="#ffcc33" stroke="#0b1340" strokeWidth="2.5" />,
  };
  return (
    <svg viewBox="0 0 100 100" className="accessoire" aria-hidden>
      {contenu[type]}
    </svg>
  );
}
