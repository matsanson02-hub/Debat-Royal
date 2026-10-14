// Sprites génériques dessinés en SVG (foule, gilets jaunes, militants,
// tracteur…). Les personnes réelles ne sont jamais dessinées : elles viennent
// des images fournies, sinon d'une silhouette avec leur nom.

import type { CSSProperties } from 'react';

const TEINTES_PEAU = ['#f2c9a5', '#d9a47c', '#a86d4a', '#7a4a2e', '#f5d6bd'];
const TENUES = ['#4c7dff', '#ff4d8d', '#22c55e', '#f59e0b', '#a855f7', '#06b6d4', '#ef4444'];

function Personne({ peau, haut, pancarte, gilet, casque }: { peau: string; haut: string; pancarte?: string; gilet?: boolean; casque?: boolean }) {
  return (
    <svg viewBox="0 0 60 90" className="sprite-svg">
      {pancarte && (
        <g>
          <rect x="34" y="2" width="4" height="40" fill="#8a5a2b" />
          <rect x="18" y="0" width="40" height="22" rx="2" fill="#fff" stroke="#0b1340" strokeWidth="2.5" />
          <text x="38" y="15" textAnchor="middle" fontFamily="'Luckiest Guy', system-ui" fontSize="9" fill="#e1000f">
            {pancarte}
          </text>
        </g>
      )}
      <path d="M14 88 L16 58 C 16 48, 44 48, 44 58 L46 88 Z" fill={gilet ? '#ffe600' : haut} stroke="#0b1340" strokeWidth="2.5" />
      {gilet && <path d="M18 66 H42 M17 74 H43" stroke="#c0c0c0" strokeWidth="3" />}
      <circle cx="30" cy="38" r="12" fill={peau} stroke="#0b1340" strokeWidth="2.5" />
      <circle cx="26" cy="37" r="1.6" fill="#0b1340" />
      <circle cx="34" cy="37" r="1.6" fill="#0b1340" />
      <path d="M25 43 Q30 47 35 43" stroke="#0b1340" strokeWidth="2" fill="none" />
      {casque && <path d="M17 34 C 17 22, 43 22, 43 34 Z" fill="#ffcc33" stroke="#0b1340" strokeWidth="2.5" />}
    </svg>
  );
}

function Tracteur() {
  return (
    <svg viewBox="0 0 140 100" className="sprite-svg">
      <rect x="20" y="30" width="70" height="36" rx="4" fill="#2e9e44" stroke="#0b1340" strokeWidth="3" />
      <rect x="60" y="8" width="34" height="34" rx="3" fill="#2e9e44" stroke="#0b1340" strokeWidth="3" />
      <rect x="66" y="14" width="22" height="18" fill="#bfe9ff" stroke="#0b1340" strokeWidth="2" />
      <rect x="2" y="24" width="24" height="26" fill="#f3d36b" stroke="#0b1340" strokeWidth="2" />
      <circle cx="98" cy="72" r="24" fill="#222" stroke="#0b1340" strokeWidth="3" />
      <circle cx="98" cy="72" r="10" fill="#ffcc33" />
      <circle cx="34" cy="80" r="14" fill="#222" stroke="#0b1340" strokeWidth="3" />
      <circle cx="34" cy="80" r="6" fill="#ffcc33" />
    </svg>
  );
}

function Canard() {
  return (
    <svg viewBox="0 0 100 90" className="sprite-svg">
      <ellipse cx="50" cy="60" rx="34" ry="22" fill="#ffe14d" stroke="#0b1340" strokeWidth="3" />
      <circle cx="72" cy="32" r="16" fill="#ffe14d" stroke="#0b1340" strokeWidth="3" />
      <path d="M86 32 L100 36 L86 40 Z" fill="#ff8a00" stroke="#0b1340" strokeWidth="2" />
      <circle cx="76" cy="28" r="2.5" fill="#0b1340" />
      <rect x="18" y="38" width="30" height="22" fill="#fff" stroke="#0b1340" strokeWidth="2" transform="rotate(-12 33 49)" />
      <path d="M22 44 H44 M22 50 H40" stroke="#888" strokeWidth="2" transform="rotate(-12 33 49)" />
    </svg>
  );
}

function Une({ titre = 'RÉVÉLATIONS' }: { titre?: string }) {
  return (
    <svg viewBox="0 0 120 150" className="sprite-svg">
      <rect x="4" y="4" width="112" height="142" fill="#fafafa" stroke="#0b1340" strokeWidth="3" />
      <rect x="10" y="10" width="100" height="18" fill="#e1000f" />
      <text x="60" y="24" textAnchor="middle" fontFamily="'Luckiest Guy', system-ui" fontSize="12" fill="#fff">
        {titre}
      </text>
      {[40, 52, 64, 76, 88, 100, 112, 124].map((y) => (
        <rect key={y} x="12" y={y} width={y % 24 === 4 ? 70 : 96} height="5" fill="#bbb" />
      ))}
    </svg>
  );
}

function Tampon() {
  return (
    <svg viewBox="0 0 120 70" className="sprite-svg">
      <rect x="6" y="6" width="108" height="58" rx="8" fill="none" stroke="#e1000f" strokeWidth="7" transform="rotate(-10 60 35)" />
      <text x="60" y="48" textAnchor="middle" fontFamily="'Luckiest Guy', system-ui" fontSize="36" fill="#e1000f" transform="rotate(-10 60 35)">
        FAUX
      </text>
    </svg>
  );
}

function Casserole() {
  return (
    <svg viewBox="0 0 70 40" className="sprite-svg">
      <ellipse cx="26" cy="20" rx="22" ry="16" fill="#c9ced6" stroke="#0b1340" strokeWidth="3" />
      <rect x="44" y="16" width="26" height="7" rx="3" fill="#333" />
    </svg>
  );
}

function Feuille() {
  return (
    <svg viewBox="0 0 40 50" className="sprite-svg">
      <rect x="2" y="2" width="36" height="46" fill="#fff" stroke="#0b1340" strokeWidth="2" />
      <path d="M8 12 H32 M8 20 H32 M8 28 H26" stroke="#aaa" strokeWidth="2" />
    </svg>
  );
}

function Notif() {
  return (
    <svg viewBox="0 0 60 30" className="sprite-svg">
      <rect x="2" y="2" width="56" height="26" rx="13" fill="#ff2d55" stroke="#0b1340" strokeWidth="2" />
      <text x="30" y="20" textAnchor="middle" fontFamily="'Barlow Condensed', system-ui" fontWeight="800" fontSize="14" fill="#fff">
        ♥ +1k
      </text>
    </svg>
  );
}

/** Rend un sprite SVG générique. `graine` varie les couleurs d'un même sprite. */
export function SpriteSvg({ nom, graine = 0, pancarte, style }: { nom: string; graine?: number; pancarte?: string; style?: CSSProperties }) {
  const peau = TEINTES_PEAU[graine % TEINTES_PEAU.length];
  const haut = TENUES[(graine * 7) % TENUES.length];
  let rendu: JSX.Element;
  switch (nom) {
    case 'gilet':
      rendu = <Personne peau={peau} haut={haut} gilet pancarte={pancarte} />;
      break;
    case 'militant':
      rendu = <Personne peau={peau} haut="#22c55e" pancarte={pancarte} />;
      break;
    case 'technicien':
      rendu = <Personne peau={peau} haut="#334155" casque />;
      break;
    case 'agriculteur':
      rendu = <Personne peau={peau} haut="#2563eb" casque />;
      break;
    case 'tracteur':
      rendu = <Tracteur />;
      break;
    case 'canard':
      rendu = <Canard />;
      break;
    case 'une':
      rendu = <Une />;
      break;
    case 'tampon':
      rendu = <Tampon />;
      break;
    case 'casserole':
      rendu = <Casserole />;
      break;
    case 'feuilles':
      rendu = <Feuille />;
      break;
    case 'notif':
      rendu = <Notif />;
      break;
    default:
      rendu = <Personne peau={peau} haut={haut} pancarte={pancarte} />;
  }
  return (
    <div className="sprite" style={style}>
      {rendu}
    </div>
  );
}
