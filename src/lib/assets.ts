// Images fournies par l'utilisateur dans public/. Tant qu'un fichier manque,
// les composants affichent une silhouette colorée avec le nom.

export const cheminPortrait = (id: string) => `/persos/${id}-portrait.webp`;
export const cheminPied = (id: string) => `/persos/${id}-pied.webp`;
export const cheminLegende = (id: string) => `/legendes/${id}-carte.webp`;
export const cheminModerateur = () => `/decor/bouleau-bureau.webp`;

const etat = new Map<string, boolean>();

export function imageDisponible(src: string): boolean | undefined {
  return etat.get(src);
}

export function precharger(sources: string[]): Promise<void> {
  return Promise.all(
    sources.map(
      (src) =>
        new Promise<void>((resolve) => {
          if (etat.has(src)) return resolve();
          const img = new Image();
          const fin = (ok: boolean) => {
            etat.set(src, ok);
            resolve();
          };
          img.onload = () => fin(true);
          img.onerror = () => fin(false);
          img.src = src;
          setTimeout(() => {
            if (!etat.has(src)) fin(false);
          }, 4000);
        }),
    ),
  ).then(() => undefined);
}
