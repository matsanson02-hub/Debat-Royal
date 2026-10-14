import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { BarreHaut, Bouton, Ecran, LienSource } from '../composants/Interface';
import { Portrait } from '../composants/Portrait';
import { contenu, infoSujet, nomDe } from '../donnees';
import { useJeu } from '../etat';
import { questionsEntrainement } from '../moteur/tirage';
import { Alea, graineAleatoire } from '../moteur/rng';
import type { Mesure, Question, SujetId } from '../moteur/types';
import { SUJETS } from '../moteur/types';

type Onglet = 'fiches' | 'comparateur' | 'entrainement';

export function Programmes({ perso: persoInitial, onglet: ongletInitial }: { perso?: string; onglet?: Onglet }) {
  const { aller, profil } = useJeu();
  const [onglet, setOnglet] = useState<Onglet>(ongletInitial ?? 'fiches');
  return (
    <Ecran className="ecran-programmes">
      <BarreHaut retour={() => aller({ nom: 'accueil' })} titre="Programmes" />
      <div className="onglets">
        {(['fiches', 'comparateur', 'entrainement'] as Onglet[]).map((o) => (
          <button key={o} type="button" className={`onglet ${onglet === o ? 'actif' : ''}`} onClick={() => setOnglet(o)}>
            {o === 'fiches' ? 'Fiches' : o === 'comparateur' ? 'Comparateur' : 'Entraînement'}
          </button>
        ))}
      </div>
      <p className="petit">
        {profil.mesures.length} mesure{profil.mesures.length > 1 ? 's' : ''} débloquée{profil.mesures.length > 1 ? 's' : ''} sur {contenu().catalogue.mesures.size}. Les mesures se débloquent en répondant juste, en combat ou en entraînement.
      </p>
      {onglet === 'fiches' && <Fiches persoInitial={persoInitial} />}
      {onglet === 'comparateur' && <Comparateur />}
      {onglet === 'entrainement' && <Entrainement />}
    </Ecran>
  );
}

function CarteMesure({ m, debloquee }: { m: Mesure; debloquee: boolean }) {
  return (
    <div className={`carte-mesure ${debloquee ? '' : 'verrouillee'}`}>
      <strong>{m.intitule}</strong>
      {debloquee ? (
        <>
          <p>{m.detail}</p>
          <div className="mesure-meta">
            {m.millesime < 2027 && <span className="millesime">Programme {m.millesime}</span>}
            <LienSource source={m.source} />
          </div>
        </>
      ) : (
        <p className="verrou">🔒 Réponds juste à une question sur cette mesure pour la débloquer.</p>
      )}
    </div>
  );
}

function Fiches({ persoInitial }: { persoInitial?: string }) {
  const { profil } = useJeu();
  const c = contenu();
  const cat = c.catalogue;
  const avecMesures = c.candidats.filter((x) => [...cat.mesures.values()].some((m) => m.perso === x.id));
  const [perso, setPerso] = useState(persoInitial ?? avecMesures[0]?.id);
  const fiche = c.candidats.find((x) => x.id === perso);
  const mesures = [...cat.mesures.values()].filter((m) => m.perso === perso);
  const debloquees = new Set(profil.mesures);

  if (!fiche) return <p className="message-vide">Aucun programme sourcé pour l’instant.</p>;
  return (
    <div className="fiches">
      <div className="liste-persos-horizontale">
        {avecMesures.map((x) => (
          <button key={x.id} type="button" className={`vignette-perso ${perso === x.id ? 'active' : ''}`} onClick={() => setPerso(x.id)}>
            <Portrait id={x.id} taille={48} className="portrait-rond" />
            <span>{x.nom}</span>
          </button>
        ))}
      </div>
      <div className="fiche-entete" style={{ borderColor: fiche.couleur }}>
        <Portrait id={fiche.id} taille={80} className="portrait-rond" />
        <div>
          <h2>{fiche.nom}</h2>
          <p>
            {fiche.parti} · « {fiche.surnom} »
          </p>
          {fiche.statut_note && <p className="petit">{fiche.statut_note}</p>}
          <p className="petit">
            {mesures.filter((m) => debloquees.has(m.id)).length}/{mesures.length} mesures débloquées
          </p>
        </div>
      </div>
      {SUJETS.map((s) => {
        const ms = mesures.filter((m) => m.sujet === s);
        if (ms.length === 0) return null;
        const info = infoSujet(s);
        return (
          <section key={s} className="fiche-sujet">
            <h3>
              {info.icone} {info.libelle}
            </h3>
            <div className="grille-mesures">
              {ms.map((m) => (
                <CarteMesure key={m.id} m={m} debloquee={debloquees.has(m.id)} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Comparateur() {
  const { profil } = useJeu();
  const c = contenu();
  const [sujet, setSujet] = useState<SujetId>('education');
  const [tout, setTout] = useState(false);
  const debloquees = new Set(profil.mesures);
  const parPerso = c.candidats
    .map((x) => ({ x, ms: [...c.catalogue.mesures.values()].filter((m) => m.perso === x.id && m.sujet === sujet) }))
    .filter((e) => e.ms.length > 0);
  return (
    <div className="comparateur">
      <div className="grille-sujets">
        {c.sujets.map((s) => (
          <button key={s.id} type="button" className={`pastille-sujet ${sujet === s.id ? 'active' : ''}`} style={{ ['--couleur' as string]: s.couleur }} onClick={() => setSujet(s.id)}>
            {s.icone} {s.court}
          </button>
        ))}
      </div>
      <label className="interrupteur">
        <input type="checkbox" checked={tout} onChange={(e) => setTout(e.target.checked)} /> Tout afficher (même les mesures pas encore débloquées)
      </label>
      <div className="colonnes-comparateur">
        {parPerso.map(({ x, ms }) => (
          <div key={x.id} className="colonne" style={{ borderTopColor: x.couleur }}>
            <div className="colonne-tete">
              <Portrait id={x.id} taille={40} className="portrait-rond" />
              <strong>{x.nom}</strong>
            </div>
            {ms.map((m) => (
              <CarteMesure key={m.id} m={m} debloquee={tout || debloquees.has(m.id)} />
            ))}
          </div>
        ))}
        {parPerso.length === 0 && <p className="message-vide">Aucune mesure sourcée sur ce sujet pour l’instant.</p>}
      </div>
    </div>
  );
}

function Entrainement() {
  const { majProfil } = useJeu();
  const c = contenu();
  const [perso, setPerso] = useState<string>('');
  const [sujet, setSujet] = useState<SujetId | ''>('');
  const [serie, setSerie] = useState<Question[] | null>(null);
  const [i, setI] = useState(0);
  const [choix, setChoix] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const persos = c.candidats.filter((x) => c.catalogue.questions.some((q) => q.perso === x.id));

  const disponibles = useMemo(() => questionsEntrainement(c.catalogue, { perso: perso || undefined, sujet: sujet || undefined }), [c, perso, sujet]);

  const demarrer = () => {
    setSerie(new Alea(graineAleatoire()).melanger(disponibles).slice(0, 10));
    setI(0);
    setChoix(null);
    setScore(0);
  };

  if (!serie) {
    return (
      <div className="entrainement-config">
        <label>
          Candidat
          <select value={perso} onChange={(e) => setPerso(e.target.value)}>
            <option value="">Tous</option>
            {persos.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nom}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sujet
          <select value={sujet} onChange={(e) => setSujet(e.target.value as SujetId | '')}>
            <option value="">Tous</option>
            {c.sujets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.libelle}
              </option>
            ))}
          </select>
        </label>
        <p className="petit">{disponibles.length} questions disponibles · séries de 10, sans chrono.</p>
        <Bouton variante="or" disabled={disponibles.length === 0} onClick={demarrer}>
          Commencer
        </Bouton>
      </div>
    );
  }

  if (i >= serie.length) {
    return (
      <div className="entrainement-fin">
        <h2>
          {score}/{serie.length}
        </h2>
        <p>{score === serie.length ? 'Sans faute !' : score >= serie.length / 2 ? 'Bien joué !' : 'Continue à réviser !'}</p>
        <Bouton variante="or" onClick={demarrer}>
          Nouvelle série
        </Bouton>
        <Bouton variante="gris" onClick={() => setSerie(null)}>
          Changer de filtre
        </Bouton>
      </div>
    );
  }

  const q = serie[i];
  const repondre = (k: number) => {
    if (choix !== null) return;
    setChoix(k);
    if (k === q.bonne) {
      setScore((s) => s + 1);
      if (q.mesure) majProfil((p) => (p.mesures.includes(q.mesure!) ? p : { ...p, mesures: [...p.mesures, q.mesure!] }));
    }
  };

  return (
    <motion.div key={q.id} className="panneau-question entrainement" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
      <span className="question-contexte">
        Question {i + 1}/{serie.length} · {nomDe(q.perso)} · {infoSujet(q.sujet).court}
      </span>
      <p className="question-texte">{q.question}</p>
      <div className="choix">
        {q.choix.map((ch, k) => (
          <button
            key={k}
            type="button"
            className={`bouton-choix ${choix !== null && k === q.bonne ? 'bonne' : ''} ${choix === k && k !== q.bonne ? 'fausse' : ''}`}
            disabled={choix !== null}
            onClick={() => repondre(k)}
          >
            <span className="lettre">{'ABCD'[k]}</span> {ch}
          </button>
        ))}
      </div>
      {choix !== null && (
        <div className="resultat-entrainement">
          <p className="resultat-explication">{q.explication}</p>
          <LienSource source={q.source} />
          <Bouton
            variante="or"
            onClick={() => {
              setI(i + 1);
              setChoix(null);
            }}
          >
            Suivante
          </Bouton>
        </div>
      )}
    </motion.div>
  );
}
