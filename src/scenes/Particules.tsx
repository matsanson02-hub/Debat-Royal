// Petit moteur de particules sur canvas, posé au-dessus du plateau.
// Feu, fumée, confettis, paille, papier, étincelles.

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export type TypeParticule = 'feu' | 'fumee' | 'confettis' | 'paille' | 'papier' | 'etincelles' | 'coup';

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  vie: number;
  vieMax: number;
  taille: number;
  couleur: string;
  type: TypeParticule;
  rot: number;
  vrot: number;
}

export interface ApiParticules {
  emettre: (type: TypeParticule, opts?: { x?: number; y?: number; nombre?: number; duree?: number; largeur?: number }) => void;
  vider: () => void;
}

const COULEURS: Record<TypeParticule, string[]> = {
  feu: ['#ffdd55', '#ff9a1f', '#ff4d1f', '#e1000f'],
  fumee: ['#555b66', '#6b7280', '#3f4450'],
  confettis: ['#ffcc33', '#ff4d8d', '#4c7dff', '#22c55e', '#ffffff', '#e1000f'],
  paille: ['#f3d36b', '#e6be4a', '#d9a73a'],
  papier: ['#ffffff', '#f1f1f1', '#e5e7eb'],
  etincelles: ['#fff6a0', '#ffd23f', '#ffffff'],
  coup: ['#ffffff', '#ffe14d', '#ff9a1f'],
};

const MAX = 600;

export const Particules = forwardRef<ApiParticules, { reduit?: boolean }>(function Particules({ reduit }, ref) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const parts = useRef<P[]>([]);
  const emetteurs = useRef<{ type: TypeParticule; x: number; y: number; largeur: number; jusque: number; debit: number }[]>([]);

  useImperativeHandle(ref, () => ({
    emettre(type, opts = {}) {
      if (reduit) return;
      const c = canvas.current;
      if (!c) return;
      const x = (opts.x ?? 0.5) * c.width;
      const y = (opts.y ?? 0.5) * c.height;
      const largeur = (opts.largeur ?? 0.1) * c.width;
      if (opts.duree) {
        emetteurs.current.push({ type, x, y, largeur, jusque: performance.now() + opts.duree * 1000, debit: opts.nombre ?? 4 });
      } else {
        for (let i = 0; i < (opts.nombre ?? 40); i++) ajouter(type, x, y, largeur);
      }
    },
    vider() {
      parts.current = [];
      emetteurs.current = [];
    },
  }));

  function ajouter(type: TypeParticule, x: number, y: number, largeur: number) {
    if (parts.current.length >= MAX) return;
    const couleurs = COULEURS[type];
    const a = Math.random() * Math.PI * 2;
    const v = Math.random();
    const base: P = {
      x: x + (Math.random() - 0.5) * largeur,
      y,
      vx: 0,
      vy: 0,
      vie: 0,
      vieMax: 1,
      taille: 4,
      couleur: couleurs[Math.floor(Math.random() * couleurs.length)],
      type,
      rot: Math.random() * 6,
      vrot: (Math.random() - 0.5) * 0.3,
    };
    switch (type) {
      case 'feu':
        Object.assign(base, { vx: (Math.random() - 0.5) * 40, vy: -60 - v * 120, vieMax: 0.6 + v * 0.6, taille: 8 + v * 14 });
        break;
      case 'fumee':
        Object.assign(base, { vx: (Math.random() - 0.5) * 30, vy: -30 - v * 50, vieMax: 1.6 + v * 1.4, taille: 18 + v * 26 });
        break;
      case 'confettis':
        Object.assign(base, { x: Math.random() * (canvas.current?.width ?? 0), y: -10, vx: (Math.random() - 0.5) * 80, vy: 60 + v * 120, vieMax: 3, taille: 5 + v * 5 });
        break;
      case 'paille':
        Object.assign(base, { vx: Math.cos(a) * 200 * v, vy: -120 - v * 200, vieMax: 1.8, taille: 10 + v * 8 });
        break;
      case 'papier':
        Object.assign(base, { vx: Math.cos(a) * 180 * v, vy: -100 - v * 160, vieMax: 2, taille: 8 + v * 8 });
        break;
      case 'etincelles':
      case 'coup':
        Object.assign(base, { vx: Math.cos(a) * 320 * (0.3 + v), vy: Math.sin(a) * 320 * (0.3 + v), vieMax: 0.4 + v * 0.4, taille: 2 + v * 3 });
        break;
    }
    parts.current.push(base);
  }

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const redim = () => {
      const r = c.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = Math.max(1, r.width * dpr);
      c.height = Math.max(1, r.height * dpr);
    };
    redim();
    const obs = new ResizeObserver(redim);
    obs.observe(c);
    let raf = 0;
    let avant = performance.now();
    const boucle = (t: number) => {
      const dt = Math.min(0.05, (t - avant) / 1000);
      avant = t;
      emetteurs.current = emetteurs.current.filter((e) => e.jusque > t);
      for (const e of emetteurs.current) for (let i = 0; i < e.debit; i++) ajouter(e.type, e.x, e.y, e.largeur);
      ctx.clearRect(0, 0, c.width, c.height);
      const vivantes: P[] = [];
      for (const p of parts.current) {
        p.vie += dt;
        if (p.vie >= p.vieMax) continue;
        const gravite = p.type === 'feu' || p.type === 'fumee' ? -10 : p.type === 'confettis' ? 20 : 380;
        p.vy += gravite * dt;
        if (p.type === 'confettis' || p.type === 'papier') p.vx += Math.sin(t / 300 + p.rot) * 4;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vrot;
        const k = 1 - p.vie / p.vieMax;
        ctx.globalAlpha = p.type === 'fumee' ? 0.45 * k : Math.min(1, k * 1.6);
        ctx.fillStyle = p.couleur;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        if (p.type === 'feu' || p.type === 'fumee') {
          ctx.beginPath();
          ctx.arc(0, 0, p.taille * (p.type === 'feu' ? k : 1.5 - k * 0.5), 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'paille') {
          ctx.fillRect(-p.taille / 2, -1, p.taille, 2.5);
        } else if (p.type === 'confettis' || p.type === 'papier') {
          ctx.fillRect(-p.taille / 2, -p.taille / 3, p.taille, (p.taille * 2) / 3);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.taille, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        vivantes.push(p);
      }
      parts.current = vivantes;
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(boucle);
    };
    raf = requestAnimationFrame(boucle);
    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
    };
  }, []);

  return <canvas ref={canvas} className="couche-particules" aria-hidden />;
});
