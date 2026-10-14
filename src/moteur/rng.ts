// Générateur pseudo-aléatoire à graine (mulberry32). Pur : renvoie la valeur
// et le nouvel état, pour que le combat reste rejouable et testable.

export function suivant(etat: number): [number, number] {
  const nouvelEtat = (etat + 0x6d2b79f5) | 0;
  let t = nouvelEtat;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const valeur = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [valeur, nouvelEtat];
}

/** Petit wrapper mutable, pratique à l'intérieur d'une fonction pure. */
export class Alea {
  constructor(public etat: number) {}

  nombre(): number {
    const [v, e] = suivant(this.etat);
    this.etat = e;
    return v;
  }

  entier(max: number): number {
    return Math.floor(this.nombre() * max);
  }

  choisir<T>(liste: readonly T[]): T {
    return liste[this.entier(liste.length)];
  }

  melanger<T>(liste: readonly T[]): T[] {
    const copie = [...liste];
    for (let i = copie.length - 1; i > 0; i--) {
      const j = this.entier(i + 1);
      [copie[i], copie[j]] = [copie[j], copie[i]];
    }
    return copie;
  }

  chance(probabilite: number): boolean {
    return this.nombre() < probabilite;
  }
}

export function graineAleatoire(): number {
  return Math.floor(Math.random() * 2 ** 31);
}
