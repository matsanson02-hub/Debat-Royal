// Image du score générée dans le navigateur (canvas), partagée ou téléchargée.

export interface DonneesPartage {
  victoire: boolean;
  joueur: string;
  adversaire: string;
  score: number;
  bonnes: number;
  total: number;
  mesures: number;
}

export async function genererImage(d: DonneesPartage): Promise<Blob | null> {
  const c = document.createElement('canvas');
  c.width = 1080;
  c.height = 1080;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  try {
    await document.fonts?.load('80px "Luckiest Guy"');
  } catch {
    /* police indisponible */
  }
  const g = ctx.createLinearGradient(0, 0, 0, 1080);
  g.addColorStop(0, '#1b2f8f');
  g.addColorStop(1, '#0b1340');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1080, 1080);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    ctx.moveTo(540, 1080);
    ctx.lineTo(i * 100 - 60, 0);
    ctx.lineTo(i * 100 + 0, 0);
    ctx.fill();
  }
  const texte = (t: string, y: number, taille: number, couleur = '#ffcc33') => {
    ctx.font = `${taille}px "Luckiest Guy", system-ui`;
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    ctx.lineWidth = taille / 5;
    ctx.strokeStyle = '#0b1340';
    ctx.strokeText(t, 540, y);
    ctx.fillStyle = couleur;
    ctx.fillText(t, 540, y);
  };
  texte('DÉBAT ROYALE', 150, 96);
  texte(d.victoire ? 'VICTOIRE !' : 'DÉFAITE…', 300, 120, d.victoire ? '#ffffff' : '#ff8fa8');
  ctx.font = '600 48px "Barlow Condensed", system-ui';
  ctx.fillStyle = '#e6ebff';
  ctx.textAlign = 'center';
  ctx.fillText(`${d.joueur}  vs  ${d.adversaire}`, 540, 400);
  texte(`${d.score} %`, 600, 220, '#5ec8f2');
  ctx.font = '600 44px "Barlow Condensed", system-ui';
  ctx.fillStyle = '#e6ebff';
  ctx.fillText(`de culture politique · ${d.bonnes}/${d.total} bonnes réponses`, 540, 680);
  ctx.fillText(`${d.mesures} mesure${d.mesures > 1 ? 's' : ''} de programme apprise${d.mesures > 1 ? 's' : ''}`, 540, 750);
  texte('Que le meilleur programme gagne.', 960, 54, '#ffffff');
  return new Promise((r) => c.toBlob((b) => r(b), 'image/png'));
}

export async function partager(d: DonneesPartage): Promise<'partage' | 'telecharge' | 'echec'> {
  const blob = await genererImage(d);
  if (!blob) return 'echec';
  const fichier = new File([blob], 'debat-royale-score.png', { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
  if (nav.share && nav.canShare?.({ files: [fichier] })) {
    try {
      await nav.share({ files: [fichier], title: 'Débat Royale', text: `${d.score} % de culture politique sur Débat Royale !` });
      return 'partage';
    } catch {
      /* l'utilisateur a annulé : on télécharge */
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'debat-royale-score.png';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'telecharge';
}
