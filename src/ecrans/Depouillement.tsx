// Ouverture de pack (d'après la maquette) : le paquet tremble, se déchire,
// puis les cartes sortent et se retournent une à une avec un éclat selon la
// rareté. Chaque citation est une vraie phrase sourcée.

import { motion } from 'framer-motion';
import { useMemo, useRef, useState } from 'react';
import { Portrait } from '../composants/Portrait';
import { contenu, nomDe } from '../donnees';
import { useJeu, type Ecran as EcranT } from '../etat';
import { jouer } from '../lib/son';
import { BONUS_REF, BONUS_REF_NIVEAU } from '../moteur/constantes';
import { ajouterObjets, type ResultatAjout } from '../moteur/economie';
import { Alea, graineAleatoire } from '../moteur/rng';
import { ouvrirUrne, RARETE_DE_REF } from '../moteur/tirage-urnes';
import type { Rarete } from '../moteur/types';
import { Particules, type ApiParticules } from '../scenes/Particules';
import { partagerTirage } from '../lib/partage';

const ETOILES: Record<Rarete, number> = { commune: 1, rare: 2, epique: 3, legendaire: 5 };
const LIBELLE: Record<Rarete, string> = { commune: 'COMMUNE', rare: 'RARE', epique: 'ÉPIQUE', legendaire: 'LÉGENDAIRE' };
const EFFETS_LEGENDE: Record<string, string> = { attaque: 'GROSSE ATTAQUE', bouclier: 'BOUCLIER', soin: 'SOIN DE 20 PV', vol_combo: 'VOL DE COMBO' };

export function PaquetPack({ taille = 200 }: { taille?: number }) {
  return (
    <svg viewBox="0 0 200 230" width={taille} height={taille * 1.15} className="paquet-pack" aria-label="Pack Références politiques">
      <defs>
        <linearGradient id="alu" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0047ab" />
          <stop offset="0.36" stopColor="#2f6bff" />
          <stop offset="0.37" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#e9eefc" />
          <stop offset="0.61" stopColor="#ff4d5e" />
          <stop offset="1" stopColor="#c1121f" />
        </linearGradient>
        <linearGradient id="reflet" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M18 18 L182 10 L190 212 L12 220 Z" fill="url(#alu)" stroke="#0b1340" strokeWidth="5" strokeLinejoin="round" />
      <path d="M18 18 l12 -10 l10 10 l10 -10 l10 10 l10 -10 l10 10 l10 -10 l10 10 l10 -10 l10 10 l10 -10 l10 10 l10 -10 l10 10 l10 -10 l12 8" fill="none" stroke="#0b1340" strokeWidth="4" />
      <rect x="30" y="40" width="40" height="150" fill="url(#reflet)" transform="rotate(12 50 115)" />
      <ellipse cx="100" cy="112" rx="70" ry="60" fill="#0b1a5c" stroke="#ffffff" strokeWidth="5" />
      <text x="100" y="86" textAnchor="middle" fontFamily="Bangers, 'Luckiest Guy', system-ui" fontSize="22" fill="#fff" transform="rotate(-8 100 112)">
        PACK
      </text>
      <text x="100" y="108" textAnchor="middle" fontFamily="Bangers, 'Luckiest Guy', system-ui" fontSize="20" fill="#fff" transform="rotate(-8 100 112)">
        RÉFÉRENCES
      </text>
      <text x="100" y="130" textAnchor="middle" fontFamily="Bangers, 'Luckiest Guy', system-ui" fontSize="20" fill="#fff" transform="rotate(-8 100 112)">
        POLITIQUES
      </text>
      <g transform="translate(84 136)" fill="#fff">
        <path d="M0 10 L16 2 L32 10 Z" />
        <rect x="3" y="12" width="4" height="12" />
        <rect x="11" y="12" width="4" height="12" />
        <rect x="19" y="12" width="4" height="12" />
        <rect x="27" y="12" width="4" height="12" />
        <rect x="0" y="25" width="34" height="4" />
      </g>
    </svg>
  );
}

function infosObjet(r: ResultatAjout) {
  const c = contenu();
  const cat = c.catalogue;
  const o = r.objet;
  const statut = r.converti ? `DOUBLON → +${r.converti} PALUCHES` : r.nouveau ? 'NOUVEAU !' : r.niveau ? `FUSION → NIVEAU ${r.niveau}` : '';
  if (o.type === 'ref') {
    const ref = cat.refs.get(o.id);
    const niveau = r.niveau ?? 1;
    const bonus = ref ? Math.round((BONUS_REF[ref.rarete] + BONUS_REF_NIVEAU * (niveau - 1)) * 100) : 0;
    return {
      rarete: ref ? RARETE_DE_REF[ref.rarete] : o.rarete,
      persoId: ref?.perso ?? null,
      nom: ref ? nomDe(ref.perso) : '',
      bulle: ref?.phrase ?? '',
      icone: '⚡',
      bonus: `+${bonus} % DÉGÂTS`,
      precision: '(sur bonne réponse)',
      statut,
      source: ref?.source.libelle,
      meme: !!ref?.meme,
    };
  }
  if (o.type === 'legende') {
    const l = cat.legendes.get(o.id);
    return {
      rarete: o.rarete,
      persoId: o.id,
      nom: l?.nom ?? o.id,
      bulle: l?.entree?.replique ?? `${l?.nom ?? ''} entre en scène !`,
      icone: '👑',
      bonus: `LÉGENDE : ${EFFETS_LEGENDE[l?.effet ?? ''] ?? ''}`,
      precision: '(à invoquer en débat)',
      statut,
      source: l?.entree?.source.libelle,
    };
  }
  if (o.type === 'chaos') {
    const x = cat.chaos.get(o.id);
    return { rarete: o.rarete, persoId: null, nom: x?.nom ?? o.id, bulle: x?.description ?? '', icone: '💥', bonus: 'CARTE CHAOS', precision: '(jauge Ambiance pleine)', statut, source: undefined };
  }
  const t = c.tenues.find((x) => x.id === o.id);
  return { rarete: o.rarete, persoId: null, nom: t?.nom ?? o.id, bulle: 'Nouveau look !', icone: '👔', bonus: 'TENUE', precision: '(purement visuelle)', statut, source: undefined };
}

function CarteTirage({ r, index, reduit }: { r: ResultatAjout; index: number; reduit: boolean }) {
  const info = infosObjet(r);
  const delai = reduit ? 0 : 0.25 + index * 0.35;
  return (
    <motion.div
      className={`carte-tirage tirage-${info.rarete}`}
      initial={reduit ? { opacity: 0 } : { rotateY: 180, y: 160, scale: 0.4, opacity: 0 }}
      animate={{ rotateY: 0, y: 0, scale: 1, opacity: 1 }}
      transition={{ delay: delai, type: 'spring', stiffness: 110, damping: 14 }}
      onAnimationStart={() => {
        setTimeout(() => jouer(info.rarete === 'legendaire' ? 'legendaire' : info.rarete === 'commune' ? 'clic' : 'bonne'), delai * 1000);
      }}
    >
      <div className="tirage-onglet">
        {info.rarete === 'legendaire' && <span className="couronne">👑</span>}
        {LIBELLE[info.rarete]}
        <span className="etoiles">{'★'.repeat(ETOILES[info.rarete])}</span>
      </div>
      <div className="tirage-art">
        {info.persoId ? <Portrait id={info.persoId} taille={220} /> : <span className="tirage-icone-grande">{r.objet.type === 'chaos' ? '💥' : '👔'}</span>}
        {info.bulle && (
          <div className="tirage-bulle">
            <span>« {info.bulle} »</span>
          </div>
        )}
      </div>
      <div className="tirage-nom">{info.nom.toUpperCase()}</div>
      <div className="tirage-bonus">
        <span className="tirage-bonus-icone">{info.icone}</span>
        <span>
          <strong>{info.bonus}</strong>
          <small>{info.precision}</small>
        </span>
      </div>
      {info.statut && <span className="tirage-statut">{info.statut}</span>}
      {'meme' in info && info.meme && <span className="tirage-meme">MÈME</span>}
      {info.source && <span className="tirage-source">{info.source}</span>}
    </motion.div>
  );
}

export function Depouillement({ urnes, retour }: { urnes: string[]; retour: EcranT }) {
  const { profil, majProfil, aller, animationsReduites } = useJeu();
  const c = contenu();
  const [file] = useState(() => [...urnes]);
  const [index, setIndex] = useState(0);
  const [resultats, setResultats] = useState<ResultatAjout[] | null>(null);
  const [secoue, setSecoue] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const particules = useRef<ApiParticules>(null);
  const profilRef = useRef(profil);
  profilRef.current = profil;
  const urne = useMemo(() => c.urnes.find((u) => u.id === file[index]), [c, file, index]);
  const restantes = file.length - index;

  const ouvrir = () => {
    if (!urne || resultats || secoue) return;
    setSecoue(true);
    jouer('urne');
    setTimeout(
      () => {
        const objets = ouvrirUrne(urne, c.contenuUrnes, new Alea(graineAleatoire()));
        const p = profilRef.current;
        const i = p.urnes.indexOf(urne.id);
        const sans = i >= 0 ? { ...p, urnes: [...p.urnes.slice(0, i), ...p.urnes.slice(i + 1)] } : p;
        const r = ajouterObjets(sans, objets);
        majProfil(() => r.profil);
        setResultats(r.resultats);
        setSecoue(false);
        particules.current?.emettre('confettis', { duree: 1.6, nombre: 5 });
        if (r.resultats.some((x) => x.objet.rarete === 'legendaire')) setTimeout(() => particules.current?.emettre('etincelles', { x: 0.8, y: 0.45, nombre: 80 }), 1500);
      },
      animationsReduites ? 100 : 1000,
    );
  };

  const continuer = () => {
    jouer('clic');
    setResultats(null);
    setMessage(null);
    setIndex(index + 1);
  };

  if (!urne || restantes <= 0) {
    return (
      <main className="ecran-pack fin-pack">
        <Particules ref={particules} reduit={animationsReduites} />
        <div className="titre-pinceau grand">
          <h1>DÉPOUILLEMENT TERMINÉ !</h1>
          <p>Équipe tes nouvelles refs dans ton deck avant le prochain débat.</p>
        </div>
        <div className="fin-pack-boutons">
          <button type="button" className="bouton-cest-parti" onClick={() => aller(retour)}>
            CONTINUER
          </button>
          <button type="button" className="bouton-retour-maquette" onClick={() => aller({ nom: 'collection' })}>
            MA COLLECTION
          </button>
        </div>
      </main>
    );
  }

  const nbRefs = resultats?.filter((r) => r.objet.type === 'ref').length ?? 0;
  const aLegendaire = !!resultats?.some((r) => r.objet.rarete === 'legendaire');

  return (
    <main className="ecran-pack">
      <Particules ref={particules} reduit={animationsReduites} />

      <div className="pack-coin">
        <PaquetPack taille={150} />
      </div>

      <header className="pack-entete">
        <div className="titre-pinceau grand">
          <h1>OUVERTURE DE PACK !</h1>
          <p>
            {resultats
              ? nbRefs === resultats.length
                ? `${nbRefs} RÉFÉRENCE${nbRefs > 1 ? 'S' : ''} OBTENUE${nbRefs > 1 ? 'S' : ''} !`
                : `${resultats.length} OBJETS OBTENUS, DONT ${nbRefs} RÉFÉRENCE${nbRefs > 1 ? 'S' : ''} !`
              : `${urne.nom.toUpperCase()} · ${urne.objets} OBJETS À DÉCOUVRIR`}
          </p>
        </div>
        {aLegendaire && (
          <div className="annotation annotation-legende">
            Et si c’était
            <br />
            le moment de
            <br />
            la légende ? ↘
          </div>
        )}
      </header>

      {!resultats ? (
        <div className="pack-centre">
          <motion.button
            type="button"
            className="pack-a-ouvrir"
            onClick={ouvrir}
            animate={secoue ? { rotate: [0, -10, 10, -12, 12, -6, 0], scale: [1, 1.08, 1.12, 1.2] } : { y: [0, -10, 0], rotate: [-3, 3, -3] }}
            transition={secoue ? { duration: 1 } : { duration: 2, repeat: Infinity }}
          >
            <PaquetPack taille={260} />
          </motion.button>
          <span className="pack-compte">
            Pack {index + 1}/{file.length}
          </span>
        </div>
      ) : (
        <section className={`rangee-tirage ${resultats.length > 5 ? 'nombreux' : ''}`}>
          {resultats.map((r, i) => (
            <CarteTirage key={i} r={r} index={i} reduit={animationsReduites} />
          ))}
        </section>
      )}

      <footer className="pack-pied">
        <div className="annotation annotation-bas">
          <span className="couronne-dessin">♛</span>
          Des citations,
          <br />
          des punchlines,
          <br />
          des légendes !
        </div>
        <button type="button" className="bouton-toucher" onClick={resultats ? continuer : ouvrir}>
          {resultats ? (restantes > 1 ? 'TOUCHE POUR CONTINUER' : 'TOUCHE POUR TERMINER') : 'TOUCHE POUR OUVRIR'}
        </button>
        <button
          type="button"
          className="bulle-partage"
          disabled={!resultats}
          onClick={async () => {
            if (!resultats) return;
            const r = await partagerTirage(
              resultats.map((x) => {
                const i = infosObjet(x);
                return { rarete: LIBELLE[i.rarete], nom: i.nom, texte: i.bulle };
              }),
            );
            setMessage(r === 'echec' ? 'Partage impossible sur cet appareil.' : r === 'telecharge' ? 'Image du tirage téléchargée !' : 'Tirage partagé !');
          }}
        >
          <span className="partage-texte">
            📱 ➜ PARTAGE TON TIRAGE
            <br />
            SUR LES RÉSEAUX !
          </span>
          <span className="partage-icones" aria-hidden>
            <i className="ico ico-tiktok">♪</i>
            <i className="ico ico-insta">◎</i>
            <i className="ico ico-x">𝕏</i>
          </span>
        </button>
      </footer>
      {message && <div className="toast">{message}</div>}
    </main>
  );
}
