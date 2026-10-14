// Sons du jeu avec Howler.js. Si un fichier de public/sons/ manque, on joue
// un petit son de synthèse (Web Audio) pour ne jamais bloquer le jeu.

import { Howl } from 'howler';

let actif = true;
const cache = new Map<string, Howl | 'absent'>();
let ctx: AudioContext | null = null;

export function activerSon(v: boolean): void {
  actif = v;
}

type Synthe = { freq: number; duree: number; type: OscillatorType; bruit?: boolean; glisse?: number };

const SYNTHES: Record<string, Synthe> = {
  clic: { freq: 660, duree: 0.06, type: 'square' },
  bonne: { freq: 880, duree: 0.18, type: 'triangle', glisse: 1320 },
  erreur: { freq: 220, duree: 0.3, type: 'sawtooth', glisse: 110 },
  coup: { freq: 140, duree: 0.2, type: 'square', bruit: true },
  critique: { freq: 300, duree: 0.35, type: 'sawtooth', bruit: true, glisse: 900 },
  applaudissements: { freq: 0, duree: 1.2, type: 'sine', bruit: true },
  huees: { freq: 120, duree: 0.8, type: 'sawtooth', glisse: 90 },
  ovation: { freq: 0, duree: 1.8, type: 'sine', bruit: true },
  foule: { freq: 0, duree: 1.5, type: 'sine', bruit: true },
  alarme: { freq: 880, duree: 0.9, type: 'square', glisse: 660 },
  alerte: { freq: 990, duree: 0.6, type: 'square', glisse: 740 },
  jingle: { freq: 523, duree: 0.5, type: 'triangle', glisse: 784 },
  ding: { freq: 1046, duree: 0.25, type: 'sine' },
  tic: { freq: 1200, duree: 0.03, type: 'square' },
  ko: { freq: 200, duree: 1, type: 'sawtooth', glisse: 50 },
  legendaire: { freq: 523, duree: 1.2, type: 'triangle', glisse: 1046 },
  urne: { freq: 300, duree: 0.15, type: 'triangle', bruit: true },
};

function synthe(nom: string): void {
  const s = SYNTHES[nom] ?? SYNTHES.clic;
  try {
    ctx ??= new AudioContext();
    const t = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + s.duree);
    gain.connect(ctx.destination);
    if (s.bruit) {
      const n = Math.floor(ctx.sampleRate * s.duree);
      const buffer = ctx.createBuffer(1, n, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(gain);
      src.start(t);
    }
    if (s.freq > 0) {
      const osc = ctx.createOscillator();
      osc.type = s.type;
      osc.frequency.setValueAtTime(s.freq, t);
      if (s.glisse) osc.frequency.exponentialRampToValueAtTime(s.glisse, t + s.duree);
      osc.connect(gain);
      osc.start(t);
      osc.stop(t + s.duree);
    }
  } catch {
    /* audio indisponible */
  }
}

export function jouer(nom: string): void {
  if (!actif || !nom) return;
  const deja = cache.get(nom);
  if (deja === 'absent') return synthe(nom);
  if (deja) {
    deja.play();
    return;
  }
  const howl = new Howl({
    src: [`/sons/${nom}.mp3`],
    volume: 0.6,
    onloaderror: () => {
      cache.set(nom, 'absent');
      synthe(nom);
    },
  });
  cache.set(nom, howl);
  howl.once('load', () => howl.play());
}
