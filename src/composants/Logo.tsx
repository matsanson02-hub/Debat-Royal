// Logo « Débat Royale » : lettrage doré à contour bleu foncé ; la couronne du É
// est remplacée par un bonnet phrygien avec une cocarde tricolore.

export function Logo({ taille = 1 }: { taille?: number }) {
  return (
    <svg className="logo" viewBox="0 0 520 210" width={520 * taille} height={210 * taille} role="img" aria-label="Débat Royale">
      <defs>
        <linearGradient id="or" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3a8" />
          <stop offset="0.45" stopColor="#ffcc33" />
          <stop offset="1" stopColor="#e08a00" />
        </linearGradient>
        <linearGradient id="bonnet" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff4d5e" />
          <stop offset="1" stopColor="#b3001b" />
        </linearGradient>
      </defs>
      {/* Bonnet phrygien posé sur le É */}
      <g transform="translate(150 -2) scale(0.9)">
        <path d="M6 44 C 2 20, 26 0, 50 6 C 66 10, 70 26, 60 34 C 54 28, 46 28, 44 36 L 46 44 Z" fill="url(#bonnet)" stroke="#0b1340" strokeWidth="5" strokeLinejoin="round" />
        <rect x="2" y="40" width="50" height="10" rx="4" fill="#ffcc33" stroke="#0b1340" strokeWidth="4" />
        <circle cx="16" cy="45" r="8" fill="#fff" stroke="#0b1340" strokeWidth="3" />
        <circle cx="16" cy="45" r="5.5" fill="#e1000f" />
        <circle cx="16" cy="45" r="3" fill="#fff" />
        <circle cx="16" cy="45" r="1.6" fill="#0055a4" />
      </g>
      <g fontFamily="'Luckiest Guy', system-ui" textAnchor="middle" strokeLinejoin="round" paintOrder="stroke">
        <text x="260" y="100" fontSize="86" fill="url(#or)" stroke="#0b1340" strokeWidth="14">DÉBAT</text>
        <text x="260" y="190" fontSize="86" fill="url(#or)" stroke="#0b1340" strokeWidth="14">ROYALE</text>
      </g>
    </svg>
  );
}
