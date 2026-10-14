import { motion } from 'framer-motion';
import { AMBIANCE_MAX, INVOCATION_MAX, PV_MAX, SUPER_MAX } from '../moteur/constantes';

export function BarreVie({ pv, camp }: { pv: number; camp: 'joueur' | 'adversaire' }) {
  const pct = Math.max(0, (pv / PV_MAX) * 100);
  const danger = pct <= 25;
  return (
    <div className={`barre-vie ${camp} ${danger ? 'danger' : ''}`} role="meter" aria-valuemin={0} aria-valuemax={PV_MAX} aria-valuenow={pv} aria-label="Points de vie">
      <motion.div className="barre-vie-retard" animate={{ width: `${pct}%` }} transition={{ delay: 0.35, duration: 0.6 }} />
      <motion.div className="barre-vie-remplie" animate={{ width: `${pct}%` }} transition={{ duration: 0.25 }} />
      <span className="barre-vie-texte">{pv} PV</span>
    </div>
  );
}

export function JaugeSegments({ valeur, max, libelle, classe }: { valeur: number; max: number; libelle: string; classe: string }) {
  return (
    <div className={`jauge-segments ${classe} ${valeur >= max ? 'pleine' : ''}`} aria-label={`${libelle} ${valeur}/${max}`}>
      <span className="jauge-libelle">{libelle}</span>
      <div className="segments">
        {Array.from({ length: max }, (_, i) => (
          <motion.span key={i} className={`segment ${i < valeur ? 'on' : ''}`} animate={i < valeur ? { scale: [1.3, 1] } : { scale: 1 }} />
        ))}
      </div>
    </div>
  );
}

export function JaugeAmbiance({ valeur }: { valeur: number }) {
  const pct = Math.min(100, (valeur / AMBIANCE_MAX) * 100);
  return (
    <div className={`jauge-ambiance ${pct >= 100 ? 'pleine' : ''}`} aria-label={`Ambiance ${Math.round(pct)} %`}>
      <span className="jauge-libelle">Ambiance</span>
      <div className="ambiance-piste">
        <motion.div className="ambiance-remplie" animate={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Jauges({ superV, invocation, ambiance }: { superV: number; invocation: number; ambiance: number }) {
  return (
    <div className="jauges">
      <JaugeSegments valeur={superV} max={SUPER_MAX} libelle="Super" classe="super" />
      <JaugeSegments valeur={invocation} max={INVOCATION_MAX} libelle="Invoc." classe="invocation" />
      <JaugeAmbiance valeur={ambiance} />
    </div>
  );
}
