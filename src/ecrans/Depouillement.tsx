// Ouverture des urnes = le dépouillement : l'urne tremble, les bulletins
// sortent un par un et se retournent avec un éclat selon la rareté.

import { motion } from 'framer-motion';
import { useMemo, useRef, useState } from 'react';
import { Bouton, Ecran, Rarete } from '../composants/Interface';
import { Portrait } from '../composants/Portrait';
import { contenu, nomDe, replique } from '../donnees';
import { useJeu, type Ecran as EcranT } from '../etat';
import { jouer } from '../lib/son';
import { ajouterObjets, type ResultatAjout } from '../moteur/economie';
import { Alea, graineAleatoire } from '../moteur/rng';
import { ouvrirUrne } from '../moteur/tirage-urnes';
import { Particules, type ApiParticules } from '../scenes/Particules';
import { UrneDessin } from './Boutique';

export function Depouillement({ urnes, retour }: { urnes: string[]; retour: EcranT }) {
  const { profil, majProfil, aller, animationsReduites } = useJeu();
  const c = contenu();
  const [file] = useState(() => [...urnes]);
  const [index, setIndex] = useState(0);
  const [resultats, setResultats] = useState<ResultatAjout[] | null>(null);
  const [revele, setRevele] = useState(0);
  const [secoue, setSecoue] = useState(false);
  const [dore, setDore] = useState(false);
  const particules = useRef<ApiParticules>(null);
  const profilRef = useRef(profil);
  profilRef.current = profil;
  const urne = useMemo(() => c.urnes.find((u) => u.id === file[index]), [c, file, index]);
  const restantes = file.length - index;

  const ouvrir = () => {
    if (!urne || resultats) return;
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
        setRevele(0);
        setSecoue(false);
      },
      animationsReduites ? 100 : 900,
    );
  };

  const suivant = () => {
    if (!resultats) return;
    if (revele < resultats.length) {
      const o = resultats[revele].objet;
      setRevele(revele + 1);
      if (o.rarete === 'legendaire') {
        setDore(true);
        jouer('legendaire');
        particules.current?.emettre('confettis', { duree: 1.5, nombre: 6 });
        setTimeout(() => setDore(false), 1800);
      } else {
        jouer(o.rarete === 'epique' ? 'critique' : o.rarete === 'rare' ? 'bonne' : 'clic');
        if (o.rarete !== 'commune') particules.current?.emettre('etincelles', { x: 0.5, y: 0.45, nombre: 40 });
      }
      return;
    }
    setResultats(null);
    setIndex(index + 1);
  };

  if (!urne || restantes <= 0) {
    return (
      <Ecran className="ecran-depouillement">
        <h1 className="titre-ecran">Dépouillement terminé !</h1>
        <p>Ta collection s’est agrandie. Équipe tes nouvelles refs dans ton deck avant le prochain débat.</p>
        <Bouton variante="or" grand onClick={() => aller(retour)}>
          Continuer
        </Bouton>
        <Bouton variante="gris" onClick={() => aller({ nom: 'collection' })}>
          Voir ma collection
        </Bouton>
        <span className="petit">{profil.urnes.length} urne(s) restante(s)</span>
      </Ecran>
    );
  }

  const courant = resultats && revele > 0 ? resultats[revele - 1] : null;

  return (
    <Ecran className={`ecran-depouillement ${dore ? 'ecran-dore' : ''}`}>
      <Particules ref={particules} reduit={animationsReduites} />
      <div className="bulle bulle-moderateur statique">{resultats ? (courant?.objet.rarete === 'legendaire' ? replique('legendaire') : replique('depouillement')) : 'Le dépouillement commence !'}</div>
      <h1 className="titre-ecran">{urne.nom}</h1>
      <span className="petit">
        Urne {index + 1}/{file.length}
      </span>

      {!resultats ? (
        <motion.button type="button" className="urne-a-ouvrir" onClick={ouvrir} animate={secoue ? { rotate: [0, -8, 8, -8, 8, 0], scale: [1, 1.05, 1] } : { y: [0, -8, 0] }} transition={secoue ? { duration: 0.5, repeat: 1 } : { duration: 1.6, repeat: Infinity }}>
          <UrneDessin couleur={urne.couleur} taille={180} />
          <span>Touchez pour ouvrir</span>
        </motion.button>
      ) : (
        <button type="button" className="zone-bulletins" onClick={suivant}>
          <>
            {courant ? (
              <motion.div
                key={revele}
                className={`bulletin rarete-bord-${courant.objet.rarete}`}
                initial={{ rotateY: 180, y: 120, scale: 0.4 }}
                animate={{ rotateY: 0, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 120, damping: 14 }}
              >
                <Objet r={courant} />
              </motion.div>
            ) : (
              <motion.div key="pret" className="bulletin dos" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                <span>🗳️</span>
                <span>{resultats.length} bulletins</span>
              </motion.div>
            )}
          </>
          <span className="indication">{revele < resultats.length ? `Touchez pour révéler (${resultats.length - revele} restants)` : restantes > 1 ? 'Urne suivante ▸' : 'Terminer ▸'}</span>
        </button>
      )}

      {resultats && revele > 0 && (
        <div className="recap-bulletins">
          {resultats.slice(0, revele).map((r, i) => (
            <span key={i} className={`mini-bulletin rarete-fond-${r.objet.rarete}`} title={r.objet.id} />
          ))}
        </div>
      )}
    </Ecran>
  );
}

function Objet({ r }: { r: ResultatAjout }) {
  const cat = contenu().catalogue;
  const o = r.objet;
  const statut = r.converti ? `Doublon → +${r.converti} Paluches` : r.nouveau ? 'Nouveau !' : r.niveau ? `Fusion → niveau ${r.niveau}` : '';
  if (o.type === 'ref') {
    const ref = cat.refs.get(o.id);
    return (
      <>
        <span className="type-objet">Ref</span>
        <span className="ref-phrase">« {ref?.phrase} »</span>
        <small>{ref ? nomDe(ref.perso) : ''}</small>
        {ref && <Rarete rarete={ref.rarete} />}
        <strong className="statut-objet">{statut}</strong>
      </>
    );
  }
  if (o.type === 'legende') {
    const l = cat.legendes.get(o.id);
    return (
      <>
        <span className="type-objet">Légende</span>
        <Portrait id={o.id} variante="legende" taille={100} />
        <strong>{l?.nom}</strong>
        <Rarete rarete={o.rarete} />
        <strong className="statut-objet">{statut}</strong>
      </>
    );
  }
  if (o.type === 'chaos') {
    const x = cat.chaos.get(o.id);
    return (
      <>
        <span className="type-objet">Carte chaos</span>
        <span className="carte-chaos-icone">💥</span>
        <strong>{x?.nom}</strong>
        <small>{x?.description}</small>
        <Rarete rarete={o.rarete} />
        <strong className="statut-objet">{statut}</strong>
      </>
    );
  }
  const t = contenu().tenues.find((x) => x.id === o.id);
  return (
    <>
      <span className="type-objet">Tenue</span>
      <span className="carte-chaos-icone">👔</span>
      <strong>{t?.nom}</strong>
      <Rarete rarete={o.rarete} />
      <strong className="statut-objet">{statut}</strong>
    </>
  );
}
