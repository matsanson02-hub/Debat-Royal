import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BarreVie, JaugeAmbiance, JaugeSegments } from '../composants/Jauges';
import { Chrono } from '../composants/Chrono';
import { Bouton, LienSource } from '../composants/Interface';
import { Portrait } from '../composants/Portrait';
import { contenu, infoSujet, nomDe, replique } from '../donnees';
import { useJeu } from '../etat';
import { precharger, sourcesIntervenant, sourcesLegende, sourcesModerateur, toutesSources } from '../lib/assets';
import { jouer } from '../lib/son';
import { actionsPossibles, creerCombat, reduire, scoreCulture, sujetEnCours } from '../moteur/combat';
import { appliquerCombat, plateauActuel } from '../moteur/economie';
import type { Camp, CarteChaos, ConfigCombat, EffetLegende, EtatCombat, Evenement, SujetId } from '../moteur/types';
import { ChaosScene } from '../scenes/ChaosScene';
import { Plateau, type ApiPlateau, type Degat } from '../scenes/Plateau';
import type { Reaction } from '../scenes/Public';

const attendre = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const EFFETS_LEGENDE: Record<EffetLegende, string> = {
  attaque: 'Grosse attaque',
  bouclier: 'Bouclier : annule le prochain coup',
  soin: 'Soin de 20 PV',
  vol_combo: 'Vole le combo adverse',
};

const ECRAN_CHAOS: Record<string, 'alerte' | 'pub' | 'zapping' | 'gresille'> = {
  bfmtv: 'alerte',
  'coupure-pub': 'pub',
  quotidien: 'zapping',
  mediapart: 'gresille',
};

export function Combat({ config, tutoriel }: { config: ConfigCombat; tutoriel?: boolean }) {
  const { profil, majProfil, aller, animationsReduites: reduit } = useJeu();
  const c = contenu();
  const cat = c.catalogue;
  const plateauInfo = plateauActuel(profil.sondage, c.plateaux);

  const [etat, setEtat] = useState<EtatCombat>(() => creerCombat(config, cat));
  const etatRef = useRef(etat);
  etatRef.current = etat;
  if (import.meta.env.DEV) {
    // Outils de test en développement uniquement (absents du build de production).
    const w = window as unknown as { __etat: EtatCombat; __forcer: (f: (e: EtatCombat) => void) => void };
    w.__etat = etat;
    w.__forcer = (f) =>
      setEtat((e) => {
        const copie = structuredClone(e);
        f(copie);
        return copie;
      });
  }
  const envoyer = useCallback(
    (a: Parameters<typeof reduire>[1]) => {
      setEtat((e) => reduire(e, a, cat));
    },
    [cat],
  );

  // --- état d'affichage ---
  const [anime, setAnime] = useState(false);
  const [pret, setPret] = useState(false);
  const [bulles, setBulles] = useState<Partial<Record<Camp | 'moderateur', ReactNode>>>({});
  const [texteModo, setTexteModo] = useState(replique('ouverture'));
  const [degats, setDegats] = useState<Degat[]>([]);
  const [reactions, setReactions] = useState<Record<Camp, Reaction>>({ joueur: 'calme', adversaire: 'calme' });
  const [frappe, setFrappe] = useState<Camp | null>(null);
  const [legendeEntree, setLegendeEntree] = useState<{ id: string; camp: Camp } | null>(null);
  const [ecranSpecial, setEcranSpecial] = useState<'alerte' | 'pub' | 'zapping' | 'gresille' | null>(null);
  const [chaos, setChaos] = useState<{ carte: CarteChaos; lanceur: Camp; reussi: boolean; degats: number } | null>(null);
  const [mesuresNouvelles, setMesuresNouvelles] = useState<string[]>([]);
  const [ko, setKo] = useState(false);
  const plateauRef = useRef<ApiPlateau>(null);
  const racine = useRef<HTMLElement>(null);
  const consoleRef = useRef<HTMLElement>(null);

  // Le bandeau du modérateur se cale juste au-dessus de la console, quelle que soit sa hauteur.
  useEffect(() => {
    const el = consoleRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => racine.current?.style.setProperty('--hauteur-console', `${el.offsetHeight}px`));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const finChaos = useRef<(() => void) | null>(null);
  const vus = useRef(0);
  const idDegat = useRef(0);
  const tempsRestant = useRef(12);
  const fileEvenements = useRef<Promise<void>>(Promise.resolve());
  const enAttente = useRef(0);

  // Toutes les animations passent par cette file : une seule à la fois, dans l'ordre.
  const enchainer = (f: () => Promise<void>) => {
    enAttente.current++;
    setAnime(true);
    fileEvenements.current = fileEvenements.current.then(f).catch(() => undefined).then(() => {
      enAttente.current--;
      if (enAttente.current === 0) setAnime(false);
    });
  };

  const vitesse = reduit ? 0.5 : 1;
  const nomCamp = (camp: Camp) => nomDe(etatRef.current.camps[camp].persoId);

  const direModo = (texte: string) => {
    setTexteModo(texte);
    setBulles((b) => ({ ...b, moderateur: texte }));
  };

  const ajouterDegat = (d: Omit<Degat, 'id'>) => {
    const id = ++idDegat.current;
    setDegats((l) => [...l, { ...d, id }]);
    setTimeout(() => setDegats((l) => l.filter((x) => x.id !== id)), 1400);
  };

  const reagir = (camp: Camp, r: Reaction, ms = 1400) => {
    setReactions((x) => ({ ...x, [camp]: r }));
    setTimeout(() => setReactions((x) => ({ ...x, [camp]: 'calme' })), ms);
  };

  // --- préchargement des images du combat ---
  useEffect(() => {
    const ids = [config.joueur.persoId, config.adversaire.persoId];
    const legs = [...config.joueur.legendes, ...config.adversaire.legendes];
    const intervenants = [...config.joueur.chaos, ...config.adversaire.chaos]
      .flatMap((id) => cat.chaos.get(id)?.scene.acteurs ?? [])
      .filter((a) => !a.sprite.startsWith('svg:'))
      .flatMap((a) => sourcesIntervenant(a.sprite));
    precharger([...ids.flatMap(toutesSources), ...legs.flatMap(sourcesLegende), ...sourcesModerateur(), ...intervenants]).then(() => setPret(true));
    jouer('ovation');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- entrée des candidats avec leur réplique culte ---
  useEffect(() => {
    if (!pret) return;
    enchainer(async () => {
      for (const camp of ['joueur', 'adversaire'] as Camp[]) {
        const fiche = cat.candidats.get(etatRef.current.camps[camp].persoId);
        if (fiche?.entree) {
          setBulles((b) => ({ ...b, [camp]: <RepliqueSourcee texte={fiche.entree!.replique} source={fiche.entree!.source} /> }));
          reagir(camp, 'applaudit');
          await attendre(1800 * vitesse);
          setBulles((b) => ({ ...b, [camp]: undefined }));
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pret]);

  // --- lecture des événements du journal, dans l'ordre ---
  const jouerEvenement = async (ev: Evenement) => {
    const e = etatRef.current;
    switch (ev.type) {
      case 'annonce': {
        const sujet = infoSujet(ev.sujet);
        const derniere = ev.manche === e.manches.length && ev.manche > 1;
        jouer('ding');
        direModo(`${derniere ? replique('derniereManche') + ' ' : ''}${sujet.annonces[(ev.manche - 1) % sujet.annonces.length]}`);
        await attendre(1500 * vitesse);
        break;
      }
      case 'attaque': {
        const cible: Camp = ev.camp === 'joueur' ? 'adversaire' : 'joueur';
        if (ev.ultime) {
          direModo(replique('ultime'));
          await attendre(500 * vitesse);
        }
        setBulles((b) => ({
          ...b,
          [ev.camp]: {
            choc: true,
            contenu: (
            <>
              <strong>{ev.bulle}</strong>
              {ev.ref && <RepliqueSourcee texte={ev.ref.phrase} source={ev.ref.source} petite />}
            </>
            ),
          },
        }));
        setFrappe(ev.camp);
        jouer(ev.critique ? 'critique' : 'coup');
        await attendre(300 * vitesse);
        ajouterDegat({ camp: cible, valeur: ev.degats, critique: ev.critique });
        if (ev.critique || ev.ultime) plateauRef.current?.secouer(ev.ultime ? 1.6 : 1);
        reagir(ev.camp, ev.critique ? 'debout' : 'applaudit');
        if (ev.critique) {
          direModo(replique('critique'));
          plateauRef.current?.particules()?.emettre('etincelles', { x: cible === 'joueur' ? 0.24 : 0.76, y: 0.5, nombre: 50 });
        }
        await attendre(1300 * vitesse);
        setFrappe(null);
        setBulles((b) => ({ ...b, [ev.camp]: undefined }));
        break;
      }
      case 'erreur':
        setBulles((b) => ({ ...b, [ev.camp]: 'Euh… je… enfin…' }));
        jouer('erreur');
        ajouterDegat({ camp: ev.camp, valeur: ev.degats });
        reagir(ev.camp, 'hue');
        direModo(replique('erreur'));
        await attendre(1300 * vitesse);
        setBulles((b) => ({ ...b, [ev.camp]: undefined }));
        break;
      case 'bouclier':
        ajouterDegat({ camp: ev.camp, valeur: 0, texte: 'BLOQUÉ !' });
        direModo(replique('bouclier'));
        await attendre(900 * vitesse);
        break;
      case 'legende': {
        const fiche = cat.legendes.get(ev.legendeId);
        if (!fiche) break;
        if (ev.reussi) {
          setLegendeEntree({ id: fiche.id, camp: ev.camp });
          direModo(replique('legende'));
          jouer('applaudissements');
          setReactions({ joueur: 'applaudit', adversaire: 'applaudit' });
          setBulles((b) => ({
            ...b,
            [ev.camp]: fiche.entree ? <RepliqueSourcee texte={fiche.entree.replique} source={fiche.entree.source} /> : <strong>{fiche.nom} entre sur le plateau !</strong>,
          }));
          await attendre(1600 * vitesse);
          const cible: Camp = ev.camp === 'joueur' ? 'adversaire' : 'joueur';
          if (ev.effet === 'attaque') {
            ajouterDegat({ camp: cible, valeur: ev.valeur });
            plateauRef.current?.secouer();
          } else if (ev.effet === 'soin') ajouterDegat({ camp: ev.camp, valeur: ev.valeur, soin: true });
          else if (ev.effet === 'bouclier') ajouterDegat({ camp: ev.camp, valeur: 0, texte: 'BOUCLIER' });
          else ajouterDegat({ camp: ev.camp, valeur: ev.valeur, texte: `COMBO +${ev.valeur}` });
          await attendre(1000 * vitesse);
          setLegendeEntree(null);
          setReactions({ joueur: 'calme', adversaire: 'calme' });
          setBulles((b) => ({ ...b, [ev.camp]: undefined }));
        } else {
          direModo(replique('legendeRatee'));
          await attendre(1000 * vitesse);
        }
        break;
      }
      case 'chaos': {
        const carte = cat.chaos.get(ev.carteId);
        if (!carte) break;
        if (ECRAN_CHAOS[carte.id] && ev.reussi) setEcranSpecial(ECRAN_CHAOS[carte.id]);
        await new Promise<void>((resolve) => {
          finChaos.current = resolve;
          setChaos({ carte, lanceur: ev.camp, reussi: ev.reussi, degats: ev.degats });
        });
        setChaos(null);
        setEcranSpecial(null);
        const cible: Camp = ev.reussi ? (ev.camp === 'joueur' ? 'adversaire' : 'joueur') : ev.camp;
        if (ev.degats > 0) ajouterDegat({ camp: cible, valeur: ev.degats });
        if (!ev.reussi) direModo(replique('chaosRate'));
        await attendre(600 * vitesse);
        break;
      }
      case 'brulure':
        plateauRef.current?.particules()?.emettre('feu', { x: ev.camp === 'joueur' ? 0.24 : 0.76, y: 0.7, largeur: 0.08, duree: 0.8, nombre: 2 });
        ajouterDegat({ camp: ev.camp, valeur: ev.degats });
        direModo(replique('brulure'));
        await attendre(1000 * vitesse);
        break;
      case 'tourPerdu':
        direModo(replique('tourPerdu'));
        setBulles((b) => ({ ...b, [ev.camp]: '…' }));
        await attendre(1300 * vitesse);
        setBulles((b) => ({ ...b, [ev.camp]: undefined }));
        break;
      case 'soin':
        ajouterDegat({ camp: ev.camp, valeur: ev.valeur, soin: true });
        await attendre(500 * vitesse);
        break;
      case 'mesure':
        setMesuresNouvelles((l) => [...l, ev.mesureId]);
        break;
      case 'changeSujet':
        direModo(`On m'apprend qu'on change de sujet ! Place à : ${infoSujet(ev.sujet).libelle}.`);
        await attendre(1200 * vitesse);
        break;
      case 'ko':
        setKo(true);
        jouer('ko');
        direModo(replique('ko'));
        plateauRef.current?.particules()?.emettre('confettis', { duree: 2, nombre: 5 });
        setReactions({ joueur: ev.camp === 'joueur' ? 'hue' : 'debout', adversaire: ev.camp === 'adversaire' ? 'hue' : 'debout' });
        await attendre(2200 * vitesse);
        break;
    }
  };

  useEffect(() => {
    if (!pret) return;
    const nouveaux = etat.journal.slice(vus.current);
    vus.current = etat.journal.length;
    if (nouveaux.length === 0) return;
    enchainer(async () => {
      for (const ev of nouveaux) await jouerEvenement(ev);
      setBulles((b) => ({ ...b, moderateur: undefined }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etat.journal.length, pret]);

  // --- enchaînements automatiques ---
  useEffect(() => {
    if (!pret || anime) return;
    if (etat.phase === 'annonce') {
      const t = setTimeout(() => envoyer({ type: 'commencerManche' }), 300);
      return () => clearTimeout(t);
    }
    if (etat.phase === 'choix' && etat.actif === 'adversaire') {
      direModo(replique('aVous', { nom: nomCamp('adversaire') }));
      const t = setTimeout(() => envoyer({ type: 'tourIA' }), 1100 * vitesse);
      return () => clearTimeout(t);
    }
    if (etat.phase === 'choix' && etat.actif === 'joueur') setTexteModo(replique('aVous', { nom: nomCamp('joueur') }));
    if (etat.phase === 'fin') {
      const victoire = etat.vainqueur === 'joueur';
      const j = etat.camps.joueur;
      const { profil: nouveau, gains } = appliquerCombat(
        profil,
        { victoire, bonnes: j.bonnes, total: j.total, critiques: j.critiques, scorePct: scoreCulture(etat), persoId: j.persoId, mesures: etat.mesuresDebloquees },
        c.plateaux,
      );
      majProfil(() => (tutoriel ? { ...nouveau, tutorielFait: true } : nouveau));
      jouer(victoire ? 'ovation' : 'huees');
      aller({ nom: 'fin', etat, gains, tutoriel });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etat, anime, pret]);

  // Réponse de l'IA : on la laisse lisible un moment, puis on continue.
  useEffect(() => {
    if (pret && !anime && etat.phase === 'resultat' && etat.resolution?.repondant === 'adversaire') {
      const t = setTimeout(() => envoyer({ type: 'suite' }), 3800 * vitesse);
      return () => clearTimeout(t);
    }
  }, [etat.phase, etat.resolution, anime, pret, envoyer, vitesse]);

  const repondre = useCallback(
    (choix: number | null) => {
      const t = Math.round(tempsRestant.current * 10) / 10;
      jouer(choix !== null && choix === etatRef.current.questionEnCours?.question.bonne ? 'bonne' : 'erreur');
      envoyer({ type: 'repondre', choix, tempsRestant: t });
    },
    [envoyer],
  );
  const finChrono = useCallback(() => repondre(null), [repondre]);
  const tick = useCallback((t: number) => {
    tempsRestant.current = t;
  }, []);

  // --- rendu ---
  const sujet = sujetEnCours(etat);
  const infoS = infoSujet(sujet);
  const J = etat.camps.joueur;
  const A = etat.camps.adversaire;
  const possibles = actionsPossibles(etat, cat, 'joueur');
  const peutAgir = pret && !anime && etat.phase === 'choix' && etat.actif === 'joueur';
  const q = etat.questionEnCours;
  const ficheJ = cat.candidats.get(J.persoId)!;
  const ficheA = cat.candidats.get(A.persoId)!;
  const argsJ = ficheJ.arguments[sujet] ?? [];
  const argsA = ficheA.arguments[sujet] ?? [];
  const bloques = new Set(J.effets.flatMap((x) => (x.type === 'argumentBloque' ? [x.argId] : [])));
  const enQuestion = !!q && q.repondant === 'joueur' && !anime;
  const enResultat = etat.phase === 'resultat' && !!etat.resolution && !anime;
  const tuto = tutoriel ? texteTutoriel(etat, anime) : null;

  return (
    <main ref={racine} className={`ecran-combat ${reduit ? 'reduit' : ''}`}>
      <div className="scene-combat">
        <Plateau
          ref={plateauRef}
          decor={plateauInfo.decor}
          nomPlateau={plateauInfo.nom}
          sujet={sujet}
          ecran={ecranSpecial}
          joueur={J.persoId}
          adversaire={A.persoId}
          tenueJoueur={profil.tenuesPortees[J.persoId]}
          reactions={reactions}
          bulles={bulles}
          degats={degats}
          frappe={frappe}
          legendeEntree={legendeEntree}
          reduit={reduit}
        >
          {chaos && (
            <ChaosScene
              key={chaos.carte.id + chaos.lanceur}
              carte={chaos.carte}
              lanceur={chaos.lanceur}
              reussi={chaos.reussi}
              degats={chaos.degats}
              reduit={reduit}
              particules={() => plateauRef.current?.particules() ?? null}
              onReaction={(r) => setReactions({ joueur: r, adversaire: r })}
              onSecousse={() => plateauRef.current?.secouer(1.3)}
              onModerateur={direModo}
              onFin={() => finChaos.current?.()}
            />
          )}
          {ko && <div className="ko-texte">K.O. !</div>}
          {!pret && <div className="chargement-plateau">Installation du plateau…</div>}
        </Plateau>

        {/* HUD façon jeu de combat */}
        <header className="hud">
          <HudCamp camp="joueur" persoId={J.persoId} nom={ficheJ.nom} surnom={ficheJ.surnom} pv={J.pv} />
          <div className="hud-centre">
            <span className="ruban-manche">
              MANCHE {Math.min(etat.manche + 1, etat.manches.length)}
              <small>/{etat.manches.length}</small>
            </span>
            <span className="vs-bloc">
              <span className="eclair">⚡</span>
              <span className="vs">VS</span>
              <span className="eclair eclair-d">⚡</span>
            </span>
            {J.combo >= 2 && <span className="combo">COMBO ×{J.combo}</span>}
          </div>
          <HudCamp camp="adversaire" persoId={A.persoId} nom={ficheA.nom} surnom={ficheA.surnom} pv={A.pv} />
        </header>

        <div className="tiers-bas">
          <span className="tiers-bas-nom">GILLES BOULEAU</span>
          <span className="tiers-bas-texte">{texteModo}</span>
          <span className="tiers-bas-sujet" style={{ background: infoS.couleur }}>
            {infoS.icone} {infoS.court}
          </span>
        </div>

        {peutAgir && !enQuestion && (
          <motion.div className="sticker sticker-tap" initial={{ scale: 0 }} animate={{ scale: 1, rotate: [-4, 4, -4] }} transition={{ rotate: { duration: 1.2, repeat: Infinity } }}>
            📱 <strong>TAP TAP</strong> <small>pour débattre !</small>
          </motion.div>
        )}
      </div>

      {/* Console du bas */}
      <section className="console" ref={consoleRef}>
        {enQuestion && q ? (
          <PanneauQuestion key={q.question.id} q={q} onRepondre={repondre} onFin={finChrono} onTick={tick} />
        ) : enResultat ? (
          <PanneauResultat key={etat.resolution!.questionId + etat.resolution!.repondant} etat={etat} onSuite={() => envoyer({ type: 'suite' })} />
        ) : (
          <div className="console-grille">
            <div className="console-camp console-joueur">
              <div className="badges">
                <BadgeSuper valeur={J.super} camp="joueur" />
                <div className="mini-jauges">
                  <JaugeSegments valeur={J.invocation} max={2} libelle="Invoc." classe="invocation" />
                  <JaugeAmbiance valeur={J.ambiance} />
                </div>
              </div>
              <div className="cartes-attaque">
                {argsJ.map((a, i) => {
                  const mesure = cat.mesures.get(a.mesure);
                  const bloque = bloques.has(a.id);
                  return (
                    <motion.button
                      key={a.id}
                      type="button"
                      className={`carte-attaque ${bloque ? 'bloque' : ''}`}
                      disabled={!peutAgir || bloque}
                      whileHover={peutAgir ? { y: -6 } : undefined}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => envoyer({ type: 'choisirArgument', argId: a.id })}
                    >
                      <span className="carte-attaque-art">{iconeArgument(sujet, i)}</span>
                      <span className="carte-attaque-nom">{a.nom}</span>
                      <span className="carte-attaque-effet">« {a.bulle} »</span>
                      <span className="carte-attaque-puissance">⚡ {a.puissance}</span>
                      {mesure && mesure.millesime < 2027 && <span className="millesime">Prog. {mesure.millesime}</span>}
                      {bloque && <span className="argument-bloque">Bloqué !</span>}
                    </motion.button>
                  );
                })}
                <motion.button
                  type="button"
                  className={`carte-attaque ultime ${possibles.ultime ? 'prete' : ''}`}
                  disabled={!peutAgir || !possibles.ultime}
                  whileHover={peutAgir && possibles.ultime ? { y: -6 } : undefined}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => envoyer({ type: 'lancerUltime' })}
                >
                  <span className="carte-attaque-art">👑</span>
                  <span className="carte-attaque-nom">{ficheJ.ultimes[sujet]?.nom ?? 'Ultime'}</span>
                  <span className="carte-attaque-effet">{possibles.ultime ? 'PRÊT !' : `Super ${J.super}/3`}</span>
                  <span className="carte-attaque-puissance">⚡ {ficheJ.ultimes[sujet]?.puissance ?? '—'}</span>
                </motion.button>
              </div>
            </div>

            <div className="console-centre">
              {J.legendes.map((l) => {
                const fiche = cat.legendes.get(l.id);
                const ok = possibles.legendes.includes(l.id);
                return (
                  <button
                    key={l.id}
                    type="button"
                    className={`vignette-roster ${l.utilisee ? 'utilisee' : ''} ${ok ? 'prete' : ''}`}
                    disabled={!peutAgir || !ok}
                    title={fiche ? `${fiche.nom} — ${EFFETS_LEGENDE[fiche.effet]} (jauge Invocation)` : l.id}
                    onClick={() => envoyer({ type: 'invoquerLegende', legendeId: l.id })}
                  >
                    <Portrait id={l.id} taille={64} />
                    <span>{fiche?.nom.split(' ').slice(-1)[0]}</span>
                  </button>
                );
              })}
              {J.chaos.map((x) => {
                const carte = cat.chaos.get(x.id);
                const ok = possibles.chaos.includes(x.id);
                return (
                  <button
                    key={x.id}
                    type="button"
                    className={`vignette-roster chaos rarete-bord-${carte?.rarete} ${x.utilisee ? 'utilisee' : ''} ${ok ? 'prete' : ''}`}
                    disabled={!peutAgir || !ok}
                    title={carte ? `${carte.nom} — ${carte.description} (jauge Ambiance)` : x.id}
                    onClick={() => envoyer({ type: 'jouerChaos', carteId: x.id })}
                  >
                    <span className="vignette-chaos-icone">{iconeChaos(x.id)}</span>
                    <span>{carte?.nom}</span>
                  </button>
                );
              })}
            </div>

            <div className="console-camp console-adversaire">
              <div className="cartes-attaque">
                {argsA.map((a, i) => (
                  <div key={a.id} className="carte-attaque adverse" title="Argument de l’adversaire (visible pour apprendre)">
                    <span className="carte-attaque-art">{iconeArgument(sujet, i + 3)}</span>
                    <span className="carte-attaque-nom">{a.nom}</span>
                    <span className="carte-attaque-effet">« {a.bulle} »</span>
                  </div>
                ))}
              </div>
              <div className="badges">
                <BadgeSuper valeur={A.super} camp="adversaire" />
                {etat.actif === 'adversaire' && etat.phase === 'choix' && <span className="ia-reflechit">{ficheA.nom.split(' ').slice(-1)[0]} prépare sa réponse…</span>}
              </div>
            </div>
          </div>
        )}
        {mesuresNouvelles.length > 0 && (
          <div className="toast-mesures">
            📘 {mesuresNouvelles.length} mesure{mesuresNouvelles.length > 1 ? 's' : ''} débloquée{mesuresNouvelles.length > 1 ? 's' : ''}
          </div>
        )}
        {tuto && <div className="astuce-tutoriel">💡 {tuto}</div>}
      </section>

      <div className="sticker sticker-club" aria-hidden>
        <span>👑</span> POLITIQUE <br />
        FIGHT CLUB
      </div>
      <div className="sticker sticker-memes" aria-hidden>
        Mêmes politiques,
        <br /> nouveaux combats ♥
      </div>
      <button type="button" className="bouton-abandon" onClick={() => aller({ nom: 'accueil' })} title="Quitter le débat">
        ✕ Quitter
      </button>
    </main>
  );
}

const ICONES_SUJETS: Record<SujetId, string[]> = {
  education: ['📚', '🎒', '🏫', '✏️', '🎓', '📝'],
  retraites: ['👵', '⏳', '💶', '🧓', '📅', '🪑'],
  'pouvoir-achat': ['🛒', '💶', '⛽', '🧾', '💳', '🏷️'],
  immigration: ['🛂', '📜', '🌍', '🚧', '🗂️', '🛃'],
  ecologie: ['🌱', '⚡', '🌍', '♻️', '🚆', '☀️'],
  sante: ['🏥', '🩺', '💊', '🚑', '❤️', '🧪'],
  securite: ['⚖️', '🚓', '🛡️', '🔒', '🏛️', '📹'],
  europe: ['🇪🇺', '🌐', '🤝', '🛡️', '📈', '🗳️'],
};

function iconeArgument(sujet: SujetId, i: number): string {
  const l = ICONES_SUJETS[sujet];
  return l[i % l.length];
}

const ICONES_CHAOS: Record<string, string> = {
  invasion: '🏃',
  'gilets-jaunes': '🦺',
  feu: '🔥',
  casserolade: '🍳',
  tracteurs: '🚜',
  'militants-climat': '🪧',
  greve: '🔦',
  'coupure-pub': '📺',
  prompteur: '📄',
  scande: '📣',
  praud: '🎙️',
  mediapart: '📰',
  canard: '🦆',
  bfmtv: '🚨',
  quotidien: '🎬',
  hanouna: '🪩',
  decodeurs: '❌',
  hugodecrypte: '📱',
  brut: '📈',
};

function iconeChaos(id: string): string {
  return ICONES_CHAOS[id] ?? '💥';
}

function HudCamp({ camp, persoId, nom, surnom, pv }: { camp: Camp; persoId: string; nom: string; surnom: string; pv: number }) {
  const nomCourt = nom.split(' ').slice(1).join(' ') || nom;
  return (
    <div className={`hud-camp hud-${camp}`}>
      <div className="hud-avatar">
        <Portrait id={persoId} taille={92} className="portrait-rond" />
      </div>
      <div className="hud-infos">
        <strong className="hud-nom">{nomCourt.toUpperCase()}</strong>
        <BarreVie pv={pv} camp={camp} />
        <em className="hud-surnom">{surnom.toUpperCase()}</em>
      </div>
    </div>
  );
}

function BadgeSuper({ valeur, camp }: { valeur: number; camp: Camp }) {
  const plein = valeur >= 3;
  return (
    <div className={`badge-super badge-${camp} ${plein ? 'plein' : ''}`} aria-label={`Super ${valeur}/3`}>
      <span className="badge-super-valeur">{valeur}</span>
      <span className="badge-super-libelle">SUPER</span>
      <span className="badge-super-eclair">⚡</span>
      <svg viewBox="0 0 100 100" className="badge-super-anneau" aria-hidden>
        <circle cx="50" cy="50" r="44" className="anneau-fond" />
        <circle cx="50" cy="50" r="44" className="anneau-plein" strokeDasharray={276} strokeDashoffset={276 * (1 - Math.min(1, valeur / 3))} transform="rotate(-90 50 50)" />
      </svg>
    </div>
  );
}

function RepliqueSourcee({ texte, source, petite }: { texte: string; source: { url: string; libelle: string; date?: string }; petite?: boolean }) {
  return (
    <span className={`replique-sourcee ${petite ? 'petite' : ''}`}>
      « {texte} »<small>{source.libelle}</small>
    </span>
  );
}

function PanneauQuestion({
  q,
  onRepondre,
  onFin,
  onTick,
}: {
  q: NonNullable<EtatCombat['questionEnCours']>;
  onRepondre: (c: number | null) => void;
  onFin: () => void;
  onTick: (t: number) => void;
}) {
  const [cache, setCache] = useState(q.reponsesCacheesMs > 0);
  const [repondu, setRepondu] = useState(false);
  useEffect(() => {
    if (!cache) return;
    const t = setTimeout(() => setCache(false), q.reponsesCacheesMs);
    return () => clearTimeout(t);
  }, [cache, q.reponsesCacheesMs]);

  const contexte = useMemo(() => {
    switch (q.contexte.type) {
      case 'ultime':
        return 'Attaque ultime — question difficile';
      case 'legende':
        return `Invocation de ${nomDe(q.contexte.legendeId)}`;
      case 'chaos':
        return 'Carte chaos — question sur le programme adverse';
      case 'mediapart':
        return 'Révélations ! Question sur ton propre programme';
      default:
        return null;
    }
  }, [q]);

  const choisir = (i: number | null) => {
    if (repondu) return;
    setRepondu(true);
    onRepondre(i);
  };
  const finChrono = useCallback(() => {
    if (!repondu) {
      setRepondu(true);
      onFin();
    }
  }, [repondu, onFin]);

  return (
    <motion.div className="panneau-question" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="question-tete">
        <Chrono duree={q.chrono} actif={!repondu} onFin={finChrono} onTick={onTick} />
        <div>
          {contexte && <span className="question-contexte">{contexte}</span>}
          <p className="question-texte">{q.question.question}</p>
          <span className="question-meta">
            {q.question.categorie === 'programme' ? 'Programme' : q.question.categorie === 'parcours' ? 'Parcours' : 'Moment culte'} · {'★'.repeat(q.question.difficulte)}
          </span>
        </div>
      </div>
      <div className="choix">
        {cache ? (
          <div className="choix-caches">🔦 Lumières coupées… les réponses arrivent</div>
        ) : (
          q.question.choix.map((c, i) => {
            const retire = q.retires.includes(i);
            return (
              <motion.button key={i} type="button" className={`bouton-choix ${retire ? 'retire' : ''}`} disabled={retire || repondu} whileTap={{ scale: 0.96 }} onClick={() => choisir(i)}>
                <span className="lettre">{'ABCD'[i]}</span> {c}
              </motion.button>
            );
          })
        )}
      </div>
    </motion.div>
  );
}

function PanneauResultat({ etat, onSuite }: { etat: EtatCombat; onSuite: () => void }) {
  const r = etat.resolution!;
  const q = r.question;
  const parIA = r.repondant === 'adversaire';
  return (
    <motion.div className={`panneau-resultat ${r.correct ? 'juste' : 'faux'}`} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="resultat-tete">
        <span className="resultat-verdict">
          {parIA ? `${nomDe(etat.camps.adversaire.persoId)} : ${r.correct ? 'bonne réponse' : 'raté !'}` : r.correct ? 'Bonne réponse !' : r.choix === null ? 'Temps écoulé !' : 'Mauvaise réponse'}
        </span>
      </div>
      <p className="resultat-question">{q.question}</p>
      <p className="resultat-bonne">✔ {q.choix[r.bonne]}</p>
      <p className="resultat-explication">{r.explication}</p>
      <LienSource source={r.source} />
      <Bouton variante={parIA ? 'gris' : 'or'} onClick={onSuite}>
        Continuer
      </Bouton>
    </motion.div>
  );
}

function texteTutoriel(e: EtatCombat, anime: boolean): string | null {
  if (anime) return null;
  if (e.phase === 'choix' && e.actif === 'joueur') {
    if (e.camps.joueur.total === 0) return 'Choisis un argument de ton candidat sur le sujet annoncé.';
    if (e.camps.joueur.super >= 3) return 'Ta jauge Super est pleine : lance ton ULTIME !';
    if (e.camps.joueur.ambiance >= 100) return 'Ambiance pleine : joue une carte chaos (question sur le programme adverse).';
    if (e.camps.joueur.invocation >= 2) return 'Jauge Invocation pleine : appelle une légende sur le plateau.';
    return 'Les arguments de l’adversaire sont visibles en bas : c’est aussi pour apprendre !';
  }
  if (e.phase === 'question' && e.questionEnCours?.repondant === 'joueur') return 'Réponds vite : plus il reste de temps, plus tu frappes fort (coup critique au-delà de 60 %).';
  if (e.phase === 'resultat' && e.resolution?.repondant === 'joueur') return 'Chaque bonne réponse débloque une mesure dans les fiches Programmes.';
  return null;
}
