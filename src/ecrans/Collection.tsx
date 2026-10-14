import { useState } from 'react';
import { BarreHaut, Ecran, LienSource, Rarete } from '../composants/Interface';
import { Portrait } from '../composants/Portrait';
import { contenu, nomDe } from '../donnees';
import { useJeu } from '../etat';
import { niveauXP } from '../moteur/economie';

type Onglet = 'legendes' | 'chaos' | 'refs' | 'tenues';

export function Collection() {
  const { aller, profil, majProfil } = useJeu();
  const c = contenu();
  const cat = c.catalogue;
  const [onglet, setOnglet] = useState<Onglet>('legendes');
  const [persoTenue, setPersoTenue] = useState(c.candidats[0]?.id ?? '');

  const legendes = [...cat.legendes.values()];
  const chaos = [...cat.chaos.values()];
  const refs = [...cat.refs.values()];
  const compte = {
    legendes: `${profil.collection.legendes.length}/${legendes.length}`,
    chaos: `${profil.collection.chaos.length}/${chaos.length}`,
    refs: `${Object.keys(profil.collection.refs).length}/${refs.length}`,
    tenues: `${profil.collection.tenues.length}/${c.tenues.filter((t) => !t.niveauRequis).length}`,
  };

  const niveauPerso = niveauXP(profil.xp[persoTenue] ?? 0);
  const tenuesDispo = c.tenues.filter((t) => (t.niveauRequis ? niveauPerso >= t.niveauRequis : profil.collection.tenues.includes(t.id)));

  return (
    <Ecran className="ecran-collection">
      <BarreHaut retour={() => aller({ nom: 'accueil' })} titre="Collection" />
      <div className="onglets">
        {(['legendes', 'chaos', 'refs', 'tenues'] as Onglet[]).map((o) => (
          <button key={o} type="button" className={`onglet ${onglet === o ? 'actif' : ''}`} onClick={() => setOnglet(o)}>
            {o === 'legendes' ? 'Légendes' : o === 'chaos' ? 'Chaos' : o === 'refs' ? 'Refs' : 'Tenues'} <small>{compte[o]}</small>
          </button>
        ))}
      </div>

      {onglet === 'legendes' && (
        <div className="grille-collection">
          {legendes.map((l) => {
            const possede = profil.collection.legendes.includes(l.id);
            return (
              <div key={l.id} className={`carte-collection ${possede ? '' : 'manquante'} rarete-bord-${l.rarete}`}>
                <Portrait id={l.id} variante="legende" taille={90} />
                <strong>{l.nom}</strong>
                <small>{l.role}</small>
                <Rarete rarete={l.rarete} />
                {!possede && <span className="badge">À trouver</span>}
              </div>
            );
          })}
        </div>
      )}

      {onglet === 'chaos' && (
        <div className="grille-collection">
          {chaos.map((x) => {
            const possede = profil.collection.chaos.includes(x.id);
            return (
              <div key={x.id} className={`carte-collection chaos ${possede ? '' : 'manquante'} rarete-bord-${x.rarete}`}>
                <span className="carte-chaos-icone">💥</span>
                <strong>{x.nom}</strong>
                <small>{x.description}</small>
                <Rarete rarete={x.rarete} />
                {!possede && <span className="badge">À trouver</span>}
              </div>
            );
          })}
        </div>
      )}

      {onglet === 'refs' && (
        <div className="grille-collection">
          {refs.map((r) => {
            const possede = profil.collection.refs[r.id];
            return (
              <div key={r.id} className={`carte-collection ref ${possede ? '' : 'manquante'} rarete-bord-ref-${r.rarete}`}>
                <span className="ref-phrase">{possede ? `« ${r.phrase} »` : '« … »'}</span>
                <small>
                  {nomDe(r.perso)}
                  {r.date ? ` · ${r.date}` : ''}
                </small>
                <Rarete rarete={r.rarete} />
                {possede ? (
                  <>
                    <span className="niveau">Niv. {possede.niveau}/5</span>
                    {r.contexte && <small>{r.contexte}</small>}
                    <LienSource source={r.source} />
                  </>
                ) : (
                  <span className="badge">À trouver</span>
                )}
              </div>
            );
          })}
          {refs.length === 0 && <p className="message-vide">Aucune ref sourcée pour l’instant.</p>}
        </div>
      )}

      {onglet === 'tenues' && (
        <div>
          <label>
            Candidat{' '}
            <select value={persoTenue} onChange={(e) => setPersoTenue(e.target.value)}>
              {c.candidats.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.nom} (niv. {niveauXP(profil.xp[x.id] ?? 0)})
                </option>
              ))}
            </select>
          </label>
          <p className="petit">Les tenues sont purement visuelles : elles ne donnent jamais de puissance en plus.</p>
          <div className="grille-collection">
            <button type="button" className={`carte-collection ${!profil.tenuesPortees[persoTenue] ? 'active' : ''}`} onClick={() => majProfil((p) => ({ ...p, tenuesPortees: { ...p.tenuesPortees, [persoTenue]: '' } }))}>
              <Portrait id={persoTenue} variante="pied" taille={80} />
              <strong>Tenue normale</strong>
            </button>
            {c.tenues.map((t) => {
              const dispo = tenuesDispo.includes(t);
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={!dispo}
                  className={`carte-collection ${dispo ? '' : 'manquante'} ${profil.tenuesPortees[persoTenue] === t.id ? 'active' : ''} rarete-bord-${t.rarete}`}
                  onClick={() => majProfil((p) => ({ ...p, tenuesPortees: { ...p.tenuesPortees, [persoTenue]: t.id } }))}
                >
                  <Portrait id={persoTenue} variante="pied" taille={80} tenue={t.id} />
                  <strong>{t.nom}</strong>
                  <Rarete rarete={t.rarete} />
                  {!dispo && <span className="badge">{t.niveauRequis ? `Niveau ${t.niveauRequis}` : 'À trouver'}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Ecran>
  );
}
