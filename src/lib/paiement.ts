// Paiement des Parrainages.
// Version 1 : simulation (« mode démo »), aucun argent réel.
// Plus tard : remplacer `paiementDemo` par une implémentation qui appelle une
// fonction serveur Vercel (/api/checkout) créant une session Stripe Checkout,
// puis crédite le compte joueur via un webhook. L'économie ne change pas.

export interface ResultatPaiement {
  ok: boolean;
  quantite: number;
  message: string;
}

export interface Paiement {
  readonly demo: boolean;
  acheter(sachetId: string, quantite: number): Promise<ResultatPaiement>;
}

export const paiementDemo: Paiement = {
  demo: true,
  async acheter(_sachetId, quantite) {
    await new Promise((r) => setTimeout(r, 400));
    return { ok: true, quantite, message: `Mode démo : ${quantite} Parrainages crédités, aucun paiement réel.` };
  },
};

export const paiement: Paiement = paiementDemo;
