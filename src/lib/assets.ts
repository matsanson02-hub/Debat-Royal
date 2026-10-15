// Images fournies par l'utilisateur dans public/ (.webp ou .png).
// Chaque emplacement a une liste de fichiers essayés dans l'ordre ; si aucun
// n'existe, les composants affichent une silhouette colorée avec le nom.

const ext = (base: string) => [`${base}.webp`, `${base}.png`];

export const sourcesPortrait = (id: string) => ext(`/persos/${id}-portrait`);
export const sourcesPied = (id: string) => ext(`/persos/${id}-pied`);
export const sourcesLegende = (id: string) => [...ext(`/legendes/${id}-carte`), ...sourcesPortrait(id)];
export const sourcesModerateur = () => [...ext('/decor/bouleau-pied'), ...ext('/decor/bouleau-bureau')];
export const sourcesFondPlateau = () => ext('/decor/plateau');
export const sourcesIntervenant = (fichier: string) => {
  const base = `/${fichier.replace(/\.(webp|png)$/, '')}`;
  return ext(base);
};

// Compatibilité avec l'ancien code
export const cheminPortrait = (id: string) => sourcesPortrait(id)[0];
export const cheminPied = (id: string) => sourcesPied(id)[0];
export const cheminLegende = (id: string) => sourcesLegende(id)[0];
export const cheminModerateur = () => sourcesModerateur()[0];

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

/** Toutes les sources possibles d'un personnage, pour le préchargement. */
export const toutesSources = (id: string) => [...sourcesPortrait(id), ...sourcesPied(id)];
