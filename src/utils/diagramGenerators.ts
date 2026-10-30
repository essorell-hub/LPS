/**
 * Generátor technických výkresů a schémat pro Word (.docx) a UI náhled
 * Kreslí inženýrské diagramy na Canvas a exportuje je jako Uint8Array PNG
 */

// Pomocná funkce pro převod canvas na Uint8Array
export function canvasToUint8Array(canvas: HTMLCanvasElement): Uint8Array {
  const dataUrl = canvas.toDataURL('image/png');
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * 1. Schéma ekvivalentní sběrné plochy Ad a okolí stavby Am (ČSN EN 62305-2)
 */
export function createCollectionAreaCanvas(
  length: number,
  width: number,
  height: number,
  Ad: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 420;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Pozadí - technický inženýrský papír
  ctx.fillStyle = '#0f172a'; // Tmavý břidlicový podklad
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Mřížka
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Hlavička výkresu
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.fillText('SCHÉMA 1: EKVIVALENTNÍ SBĚRNÁ PLOCHA STAVBY Ad (ČSN EN 62305-2 ČL. A.2)', 30, 35);
  ctx.font = '12px Arial, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(`Vzorec: Ad = L·W + 6H(L+W) + 9πH²  |  Vypočtená plocha Ad = ${Ad.toLocaleString('cs-CZ')} m²`, 30, 55);

  const cx = 450;
  const cy = 230;

  // Měřítko pro půdorys stavby
  const maxDim = Math.max(length, width, 15);
  const scale = 160 / maxDim;
  const bW = Math.max(80, length * scale);
  const bH = Math.max(50, width * scale);
  const buffer3H = Math.max(35, (3 * height) * (scale * 0.5));

  // 3H Sběrná plocha (vnější zaoblený obdélník)
  ctx.save();
  ctx.fillStyle = 'rgba(37, 99, 235, 0.15)';
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);

  const x0 = cx - bW / 2 - buffer3H;
  const y0 = cy - bH / 2 - buffer3H;
  const w0 = bW + 2 * buffer3H;
  const h0 = bH + 2 * buffer3H;
  const radius = buffer3H;

  ctx.beginPath();
  ctx.moveTo(x0 + radius, y0);
  ctx.lineTo(x0 + w0 - radius, y0);
  ctx.quadraticCurveTo(x0 + w0, y0, x0 + w0, y0 + radius);
  ctx.lineTo(x0 + w0, y0 + h0 - radius);
  ctx.quadraticCurveTo(x0 + w0, y0 + h0, x0 + w0 - radius, y0 + h0);
  ctx.lineTo(x0 + radius, y0 + h0);
  ctx.quadraticCurveTo(x0, y0 + h0, x0, y0 + h0 - radius);
  ctx.lineTo(x0, y0 + radius);
  ctx.quadraticCurveTo(x0, y0, x0 + radius, y0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Půdorys samotné budovy
  ctx.fillStyle = '#334155';
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.fillRect(cx - bW / 2, cy - bH / 2, bW, bH);
  ctx.strokeRect(cx - bW / 2, cy - bH / 2, bW, bH);

  // Šrafování půdorysu
  ctx.save();
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = -bW; i < bW + bH; i += 12) {
    ctx.moveTo(cx - bW / 2 + i, cy - bH / 2);
    ctx.lineTo(cx - bW / 2 + i - bH, cy + bH / 2);
  }
  ctx.stroke();
  ctx.restore();

  // Popisky budovy
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`PŮDORYS STAVBY`, cx, cy - 8);
  ctx.font = '12px Arial, sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(`${length} m × ${width} m`, cx, cy + 12);
  ctx.fillText(`Výška H = ${height} m`, cx, cy + 28);

  // Kóta 3H
  ctx.save();
  ctx.strokeStyle = '#60a5fa';
  ctx.fillStyle = '#60a5fa';
  ctx.lineWidth = 1.5;
  const arrowY = cy - bH / 2 - buffer3H / 2;
  ctx.beginPath();
  ctx.moveTo(cx + bW / 2, arrowY);
  ctx.lineTo(cx + bW / 2 + buffer3H, arrowY);
  ctx.stroke();

  ctx.font = 'bold 11px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`3H = ${(3 * height).toFixed(1)} m`, cx + bW / 2 + buffer3H / 2, arrowY - 6);
  ctx.restore();

  // Legenda vpravo dole
  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748b';
  ctx.font = '11px Arial, sans-serif';
  ctx.fillText('■ Zastavěná plocha stavby (L × W)', 620, 360);
  ctx.fillText('--- Ochranný dosah sběrné zóny (3 × H)', 620, 380);

  return canvas;
}

/**
 * 2. Schéma oddáleného hromosvodu DEHN HVI a dostatečné vzdálenosti s (ČSN EN 62305-3)
 */
export function createIsolatedLpsCanvas(
  equipment: string,
  rodHeight: number,
  conductorLength: number,
  s_cm: number,
  s_equiv_cm: number,
  isSafe: boolean,
  hviName: string
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 420;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Podklad
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Mřížka
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Titulek
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.fillText('SCHÉMA 2: DIMENZOVÁNÍ ODDÁLENÉHO HROMOSVODU HVI (ČSN EN 62305-3 ČL. 6.3)', 30, 35);
  ctx.font = '12px Arial, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(`Posouzení separační vzdálenosti pro: ${equipment || 'Střešní technologie / FVE'}`, 30, 55);

  // Úroveň střechy a podkladu
  const roofY = 320;
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(60, roofY);
  ctx.lineTo(840, roofY);
  ctx.stroke();

  // Konstrukce střechy - šrafy
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 60; x <= 840; x += 20) {
    ctx.moveTo(x, roofY);
    ctx.lineTo(x - 15, roofY + 25);
  }
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '11px Arial, sans-serif';
  ctx.fillText('Střešní plášť objektu / nosná konstrukce', 70, roofY + 40);

  // 1. Chráněné zařízení (např. Fotovoltaické panely FVE)
  const pvX = 380;
  ctx.fillStyle = '#1e3a8a';
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pvX, roofY);
  ctx.lineTo(pvX + 220, roofY);
  ctx.lineTo(pvX + 180, roofY - 75);
  ctx.lineTo(pvX - 40, roofY - 75);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // PV grid čáry
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pvX + 90, roofY);
  ctx.lineTo(pvX + 70, roofY - 75);
  ctx.moveTo(pvX - 20, roofY - 37);
  ctx.lineTo(pvX + 200, roofY - 37);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CHRÁNĚNÁ TECHNOLOGIE / FVE', pvX + 90, roofY - 30);
  ctx.font = '10px Arial, sans-serif';
  ctx.fillStyle = '#93c5fd';
  ctx.fillText('Nesmí dojít k přeskoku bleskového proudu!', pvX + 90, roofY - 15);

  // 2. Izolovaná jímací tyč a stožár
  const mastX = 220;
  const mastTopY = 120;

  // Nosná trubka / vzpěra z GRP (distanční materiál)
  ctx.fillStyle = '#475569';
  ctx.fillRect(mastX - 4, mastTopY + 70, 8, roofY - (mastTopY + 70));

  // Izolační distanční vzpěra
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(mastX - 6, mastTopY + 110, 12, 50);
  ctx.fillStyle = '#38bdf8';
  ctx.font = '10px Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Izolační tyč GRP', mastX - 15, mastTopY + 135);

  // Jímací tyč nahoře (kovová)
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(mastX - 3, mastTopY, 6, 70);
  // Hrot tyče
  ctx.beginPath();
  ctx.moveTo(mastX, mastTopY - 20);
  ctx.lineTo(mastX - 4, mastTopY);
  ctx.lineTo(mastX + 4, mastTopY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 11px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Jímací tyč ${rodHeight} m`, mastX, mastTopY - 30);

  // Ochranný úhel jímací tyče (kužel)
  ctx.save();
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(mastX, mastTopY - 20);
  ctx.lineTo(mastX + 290, roofY);
  ctx.stroke();

  ctx.fillStyle = 'rgba(250, 204, 21, 0.08)';
  ctx.beginPath();
  ctx.moveTo(mastX, mastTopY - 20);
  ctx.lineTo(mastX + 290, roofY);
  ctx.lineTo(mastX - 100, roofY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 3. Vysokonapěťový izolovaný svod DEHN HVI (červený kabel se stíněním)
  ctx.save();
  ctx.strokeStyle = '#e11d48';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(mastX, mastTopY + 40);
  ctx.bezierCurveTo(mastX - 30, mastTopY + 120, mastX - 40, roofY - 50, mastX - 40, roofY);
  ctx.stroke();

  // Oblast koncovky HVI
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(mastX - 6, mastTopY + 30, 12, 18);
  ctx.font = '10px Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('HVI koncovka (těsnění)', mastX - 15, mastTopY + 42);
  ctx.restore();

  // 4. Kóta separační vzdálenosti 's'
  const distY = roofY - 60;
  const p1X = mastX;
  const p2X = pvX - 35;

  ctx.save();
  ctx.strokeStyle = isSafe ? '#10b981' : '#f43f5e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p1X, distY);
  ctx.lineTo(p2X, distY);
  ctx.stroke();

  // Šipky
  ctx.fillStyle = isSafe ? '#10b981' : '#f43f5e';
  ctx.beginPath();
  ctx.moveTo(p1X, distY);
  ctx.lineTo(p1X + 8, distY - 4);
  ctx.lineTo(p1X + 8, distY + 4);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(p2X, distY);
  ctx.lineTo(p2X - 8, distY - 4);
  ctx.lineTo(p2X - 8, distY + 4);
  ctx.closePath();
  ctx.fill();

  // Text kóty
  ctx.textAlign = 'center';
  ctx.font = 'bold 13px Arial, sans-serif';
  ctx.fillText(`s = ${s_cm} cm`, (p1X + p2X) / 2, distY - 10);
  ctx.font = '11px Arial, sans-serif';
  ctx.fillText(`(Dovolená ekvivalentní mez: s ≤ ${s_equiv_cm} cm)`, (p1X + p2X) / 2, distY + 20);
  ctx.restore();

  // Blesk - grafický symbol
  ctx.save();
  ctx.strokeStyle = '#fbbf24';
  ctx.fillStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mastX, mastTopY - 90);
  ctx.lineTo(mastX - 8, mastTopY - 55);
  ctx.lineTo(mastX + 4, mastTopY - 55);
  ctx.lineTo(mastX, mastTopY - 20);
  ctx.stroke();
  ctx.restore();

  // Razítko shody vpravo
  ctx.save();
  const stampX = 720;
  const stampY = 160;
  ctx.strokeStyle = isSafe ? '#10b981' : '#f43f5e';
  ctx.fillStyle = isSafe ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)';
  ctx.lineWidth = 2;
  ctx.strokeRect(stampX - 90, stampY - 45, 180, 90);
  ctx.fillRect(stampX - 90, stampY - 45, 180, 90);

  ctx.textAlign = 'center';
  ctx.fillStyle = isSafe ? '#34d399' : '#fb7185';
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.fillText(isSafe ? 'VYHOVUJE NORMĚ' : 'NEVYHOVUJE!', stampX, stampY - 15);
  ctx.font = '11px Arial, sans-serif';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText(`s = ${s_cm} cm ≤ ${s_equiv_cm} cm`, stampX, stampY + 5);
  ctx.fillText(hviName, stampX, stampY + 25);
  ctx.restore();

  return canvas;
}

/**
 * 3. Schéma zón bleskové ochrany LPZ a koordinace SPD (ČSN EN 62305-4)
 */
export function createLpzZonationCanvas(
  lpsClass: string,
  spdLevel: string
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 420;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Podklad
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Mřížka
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Titulek
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.fillText('SCHÉMA 3: KONCEPCE ZÓN BLESKOVÉ OCHRANY (LPZ) A KOORDINACE SPD (ČSN EN 62305-4)', 30, 35);
  ctx.font = '12px Arial, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(`Návrh pro třídu LPS: ${lpsClass}  |  Koordinace SPD: ${spdLevel}`, 30, 55);

  // LPZ 0A - Venkovní nechráněný prostor
  ctx.fillStyle = '#f87171';
  ctx.font = 'bold 13px Arial, sans-serif';
  ctx.fillText('ZÓNA LPZ 0A', 90, 110);
  ctx.font = '11px Arial, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Přímé údery blesku, plné LEMP pole', 90, 128);

  // LPZ 0B - Prostor chráněný jímací soustavou
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 13px Arial, sans-serif';
  ctx.fillText('ZÓNA LPZ 0B', 90, 175);
  ctx.font = '11px Arial, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Chráněno jímačem, netlumené mag. pole', 90, 193);

  // Budova - Zóna LPZ 1 (obálka budovy)
  const bX = 360;
  const bY = 100;
  const bW = 480;
  const bH = 280;

  ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;
  ctx.fillRect(bX, bY, bW, bH);
  ctx.strokeRect(bX, bY, bW, bH);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.fillText('ZÓNA LPZ 1 (VNITŘEK STAVBY)', bX + 20, bY + 30);
  ctx.font = '11px Arial, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Tlumené elektromagnetické pole, svodiče bleskových proudů na vstupu', bX + 20, bY + 48);

  // Vnitřní chráněná Zóna LPZ 2 (např. IT místnost, střídač, technologie)
  const iX = bX + 160;
  const iY = bY + 80;
  const iW = 280;
  const iH = 170;

  ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  ctx.fillRect(iX, iY, iW, iH);
  ctx.strokeRect(iX, iY, iW, iH);
  ctx.setLineDash([]);

  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 13px Arial, sans-serif';
  ctx.fillText('ZÓNA LPZ 2 (CITLIVÉ TECHNOLOGIE)', iX + 15, iY + 28);
  ctx.font = '10px Arial, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Střídač FVE, MaR, servery, UPS, zdravotnické přístroje', iX + 15, iY + 45);

  // SPD Typ 1 - na hranici LPZ 0 / LPZ 1
  const spd1X = bX;
  const spd1Y = bY + 160;
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(spd1X - 25, spd1Y - 20, 50, 40);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SPD Typ 1', spd1X, spd1Y - 3);
  ctx.fillText('(10/350)', spd1X, spd1Y + 11);

  // Přívodní vedení NN
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(60, spd1Y);
  ctx.lineTo(spd1X - 25, spd1Y);
  ctx.moveTo(spd1X + 25, spd1Y);
  ctx.lineTo(iX, spd1Y);
  ctx.stroke();

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '11px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Vstupní silové vedení 230/400 V', 80, spd1Y - 8);

  // SPD Typ 2 + 3 - na vstupu do LPZ 2
  const spd2X = iX;
  const spd2Y = spd1Y;
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(spd2X - 22, spd2Y - 18, 44, 36);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SPD T2+T3', spd2X, spd2Y - 2);
  ctx.fillText('(8/20 µs)', spd2X, spd2Y + 10);

  // Pospojování MET
  const metY = bY + 240;
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(bX + 30, metY);
  ctx.lineTo(bX + 250, metY);
  ctx.stroke();

  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 11px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Hlavní uzemňovací přípojnice MET / MEB', bX + 30, metY - 8);

  // Zemnicí propojení k SPD
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(spd1X, spd1Y + 20);
  ctx.lineTo(spd1X, metY);
  ctx.lineTo(bX + 30, metY);
  ctx.stroke();
  ctx.setLineDash([]);

  return canvas;
}

/**
 * 4. Oficiální inženýrské logo / hlavička pro titulní stranu Word dokumentu (.docx)
 */
export function createDocumentLogoCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 240;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Pozadí s jemným gradientem a rámečkem
  const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bgGrad.addColorStop(0, '#091322');
  bgGrad.addColorStop(0.5, '#0f172a');
  bgGrad.addColorStop(1, '#1e293b');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Zlatavě-modrý ozdobný lem
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 3;
  ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

  ctx.strokeStyle = 'rgba(217, 119, 6, 0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

  // Levý erb / štít s bleskem
  const emblemCenterX = 120;
  const emblemCenterY = 120;

  // Vnější kruh štítu
  ctx.beginPath();
  ctx.arc(emblemCenterX, emblemCenterY, 78, 0, Math.PI * 2);
  ctx.fillStyle = '#0b192c';
  ctx.fill();
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Vnitřní soustředný kruh
  ctx.beginPath();
  ctx.arc(emblemCenterX, emblemCenterY, 68, 0, Math.PI * 2);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Vnitřní štít
  ctx.beginPath();
  ctx.moveTo(emblemCenterX, emblemCenterY - 48);
  ctx.lineTo(emblemCenterX + 38, emblemCenterY - 26);
  ctx.lineTo(emblemCenterX + 34, emblemCenterY + 18);
  ctx.quadraticCurveTo(emblemCenterX, emblemCenterY + 54, emblemCenterX, emblemCenterY + 54);
  ctx.quadraticCurveTo(emblemCenterX, emblemCenterY + 54, emblemCenterX - 34, emblemCenterY + 18);
  ctx.lineTo(emblemCenterX - 38, emblemCenterY - 26);
  ctx.closePath();
  ctx.fillStyle = '#1e3a8a';
  ctx.fill();
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Symbol blesku uvnitř štítu
  ctx.beginPath();
  ctx.moveTo(emblemCenterX + 4, emblemCenterY - 40);
  ctx.lineTo(emblemCenterX - 14, emblemCenterY - 6);
  ctx.lineTo(emblemCenterX + 1, emblemCenterY - 6);
  ctx.lineTo(emblemCenterX - 6, emblemCenterY + 36);
  ctx.lineTo(emblemCenterX + 16, emblemCenterY + 2);
  ctx.lineTo(emblemCenterX + 2, emblemCenterY + 2);
  ctx.lineTo(emblemCenterX + 14, emblemCenterY - 40);
  ctx.closePath();
  ctx.fillStyle = '#fbbf24';
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0; // reset stínu

  // Text v kruhu kolem erbu
  ctx.font = 'bold 9px Arial, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'center';
  ctx.fillText('ČSN EN 62305 · DEHN HVI · PROZIK', emblemCenterX, emblemCenterY + 68);

  // Pravá textová a certifikační část
  const textX = 230;

  // Horní štítek
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 11px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('AUTORIZOVANÁ EXPERTNÍ DOKUMENTACE PROJEKTU ELEKTRO', textX, 48);

  // Hlavní název softwaru / protokolu
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px Arial, sans-serif';
  ctx.fillText('LPS RISK ASSESSMENT & ISOLATED SYSTEM', textX, 82);

  // Podtitul
  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px Arial, sans-serif';
  ctx.fillText('Řízení rizik dle ČSN EN 62305-2 ed. 2 a dimenzování oddálených hromosvodů dle ČSN EN 62305-3 ed. 2', textX, 108);

  // Dělící linka
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(textX, 126);
  ctx.lineTo(canvas.width - 40, 126);
  ctx.stroke();

  // Spodní technické odznaky
  const badges = [
    { label: 'NORMA ČSN EN 62305-1..4', bg: '#1e3a8a', text: '#93c5fd' },
    { label: 'RIZIKA R1 až R4 OVĚŘENA', bg: '#064e3b', text: '#6ee7b7' },
    { label: 'SEPARAČNÍ VZDÁLENOST s (HVI)', bg: '#701a75', text: '#f0abfc' },
    { label: 'ČKAIT AUDIT PROTOKOL', bg: '#78350f', text: '#fde68a' }
  ];

  let curBadgeX = textX;
  badges.forEach((b) => {
    ctx.font = 'bold 10px Arial, sans-serif';
    const textWidth = ctx.measureText(b.label).width;
    const badgeW = textWidth + 18;
    const badgeH = 26;
    const badgeY = 150;

    // Zaoblený obdélník odznaku
    ctx.fillStyle = b.bg;
    ctx.beginPath();
    ctx.roundRect(curBadgeX, badgeY, badgeW, badgeH, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = b.text;
    ctx.textAlign = 'center';
    ctx.fillText(b.label, curBadgeX + badgeW / 2, badgeY + 17);

    curBadgeX += badgeW + 12;
  });

  // Spodní doplňující text
  ctx.fillStyle = '#64748b';
  ctx.font = '11px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Garantovaný soulad s technickými požadavky na stavby dle vyhlášky č. 268/2009 Sb. § 36', textX, 202);

  return canvas;
}
