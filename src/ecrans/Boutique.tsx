import { useState } from 'react';
import { BarreHaut, Bouton, Ecran, IconePaluche, IconeParrainage } from '../composants/Interface';
import { contenu } from '../donnees';
import { useJeu } from '../etat';
import { paiement } from '../lib/paiement';
import { jouer } from '../lib/son';
import { acheterUrne, cleJour, crediterParrainages, type Monnaie } from '../moteur/economie';
import type { Urne } from '../moteur/tirage-urnes';

export function Boutique() {
  const { aller, profil, majProfil } = useJeu();
  const c = contenu();
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const urnes = c.urnes.filter((u) => !u.cachee);
  // Offre du jour : tournante selon la date.
  const offres = c.boutique.offresDuJour;
  const offre = offres[cleJour(new Date()).split('-').reduce((s, x) => s + Number(x), 0) % offres.length];
  const urneOffre = c.urnes.find((u) => u.id === offre?.urne);

  const acheter = (urne: Urne, monnaie: Monnaie, prixSpecial?: number, quantite = 1) => {
    const prix = prixSpecial ?? urne.prix[monnaie];
    if (prix === undefined || profil[monnaie] < prix) {
      setMessage('Pas assez de ' + (monnaie === 'paluches' ? 'Paluches' : 'Parrainages') + '.');
      jouer('erreur');
      return;
    }
    majProfil((p) => {
      let n = acheterUrne(p, { ...urne, prix: monnaie === 'paluches' ? { paluches: prix } : { parrainages: prix } }, monnaie);
      for (let i = 1; n && i < quantite; i++) n = { ...n, urnes: [...n.urnes, urne.id] };
      return n ?? p;
    });
    jouer('urne');
    setMessage(`${quantite > 1 ? quantite + ' × ' : ''}${urne.nom} ajoutée${quantite > 1 ? 's' : ''} à tes urnes !`);
  };

  return (
    <Ecran className="ecran-boutique">
      <BarreHaut retour={() => aller({ nom: 'accueil' })} titre="Boutique" />

      {offre && urneOffre && (
        <section className="offre-du-jour">
          <h2>Offre du jour</h2>
          <div className="carte-urne" style={{ ['--couleur' as string]: urneOffre.couleur }}>
            <UrneDessin couleur={urneOffre.couleur} />
            <strong>{offre.libelle}</strong>
            <Bouton variante="or" onClick={() => acheter(urneOffre, 'paluches', offre.prix.paluches, offre.quantite ?? 1)}>
              <IconePaluche /> {offre.prix.paluches}
            </Bouton>
          </div>
        </section>
      )}

      <h2 className="section-titre">Urnes</h2>
      <div className="grille-urnes">
        {urnes.map((u) => (
          <div key={u.id} className="carte-urne" style={{ ['--couleur' as string]: u.couleur }}>
            <UrneDessin couleur={u.couleur} />
            <strong>{u.nom}</strong>
            <small>
              {u.objets} objets{u.garanti ? ` · au moins 1 ${u.garanti === 'legendaire' ? 'légendaire' : u.garanti}` : ''}
            </small>
            <small className="chances">
              {Math.round(u.chances.commune * 100)} / {Math.round(u.chances.rare * 100)} / {Math.round(u.chances.epique * 100)} / {Math.round(u.chances.legendaire * 100)} %
            </small>
            <div className="prix">
              {u.prix.paluches !== undefined && (
                <Bouton variante="bleu" onClick={() => acheter(u, 'paluches')}>
                  <IconePaluche /> {u.prix.paluches}
                </Bouton>
              )}
              {u.prix.parrainages !== undefined && (
                <Bouton variante="rose" onClick={() => acheter(u, 'parrainages')}>
                  <IconeParrainage /> {u.prix.parrainages}
                </Bouton>
              )}
            </div>
          </div>
        ))}
      </div>

      <h2 className="section-titre">Sachets de Parrainages</h2>
      <p className="demo">Mode démo : aucun paiement réel, les Parrainages sont crédités gratuitement.</p>
      <div className="grille-urnes">
        {c.boutique.sachets.map((s) => (
          <div key={s.id} className="carte-urne sachet">
            <IconeParrainage taille={48} />
            <strong>{s.nom}</strong>
            <span className="quantite">{s.quantite.toLocaleString('fr-FR')} Parrainages</span>
            <Bouton
              variante="vert"
              disabled={enCours}
              onClick={async () => {
                if (!window.confirm(`Mode démo : créditer ${s.quantite} Parrainages (prix affiché ${s.prixAffiche}, rien ne sera débité) ?`)) return;
                setEnCours(true);
                const r = await paiement.acheter(s.id, s.quantite);
                if (r.ok) majProfil((p) => crediterParrainages(p, r.quantite));
                setMessage(r.message);
                setEnCours(false);
              }}
            >
              {s.prixAffiche} <small>(démo)</small>
            </Bouton>
          </div>
        ))}
      </div>

      {profil.urnes.length > 0 && (
        <Bouton variante="or" grand onClick={() => aller({ nom: 'depouillement', urnes: profil.urnes, retour: { nom: 'boutique' } })}>
          🗳️ Dépouiller mes {profil.urnes.length} urne{profil.urnes.length > 1 ? 's' : ''}
        </Bouton>
      )}
      {message && <div className="toast">{message}</div>}
    </Ecran>
  );
}

export function UrneDessin({ couleur, taille = 90 }: { couleur: string; taille?: number }) {
  return (
    <svg viewBox="0 0 100 110" width={taille} height={taille * 1.1} aria-hidden>
      <rect x="14" y="26" width="72" height="78" rx="6" fill="rgba(200,230,255,0.35)" stroke="#0b1340" strokeWidth="4" />
      <rect x="10" y="16" width="80" height="14" rx="4" fill={couleur} stroke="#0b1340" strokeWidth="4" />
      <rect x="36" y="20" width="28" height="5" rx="2" fill="#0b1340" />
      <rect x="30" y="50" width="22" height="30" fill="#fff" stroke="#0b1340" strokeWidth="2" transform="rotate(-12 41 65)" />
      <rect x="48" y="58" width="22" height="30" fill="#fff" stroke="#0b1340" strokeWidth="2" transform="rotate(10 59 73)" />
      <rect x="14" y="90" width="72" height="14" rx="4" fill={couleur} stroke="#0b1340" strokeWidth="4" />
    </svg>
  );
}
