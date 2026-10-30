/**
 * Generátor kusovníku materiálu (BOM - Bill of Materials) do formátu CSV / Excel
 * pro velkoobchody elektro a montážní rozpočty
 */

import { LpsProjectState, CalculationResults } from '../types/lps';
import { SPD_CATALOG } from '../data/catalogSpd';

export interface BomItem {
  itemNumber: number;
  category: string;
  name: string;
  specification: string;
  catalogCode: string;
  manufacturer: string;
  quantity: number;
  unit: string;
  unitPriceCzk: number;
  totalPriceCzk: number;
}

export function generateBomItems(
  project: LpsProjectState,
  results: CalculationResults
): BomItem[] {
  const { building, measures, isolatedLps } = project;
  const L = building.length;
  const W = building.width;
  const H = building.height;
  const perimeter = 2 * (L + W);
  const roofArea = L * W;

  const items: BomItem[] = [];
  let itemNum = 1;

  // 1. Mřížová soustava
  const meshWireLength = Math.round(roofArea * 0.7 + perimeter * 1.1);
  items.push({
    itemNumber: itemNum++,
    category: 'Jímací soustava',
    name: 'Jímací drát pro mřížovou soustavu',
    specification: 'Drát AlMgSi ø 8 mm polotvrdý (cca 0,135 kg/m)',
    catalogCode: 'DEHN:840018 / OEZ',
    manufacturer: 'DEHN / OEZ',
    quantity: meshWireLength,
    unit: 'm',
    unitPriceCzk: 48,
    totalPriceCzk: meshWireLength * 48
  });

  const roofSupports = Math.round(meshWireLength / 1.0);
  items.push({
    itemNumber: itemNum++,
    category: 'Jímací soustava',
    name: 'Podpěry jímacího vedení na střešní krytinu',
    specification: 'Vzpěra s plastovou příchytkou na krytinu pro drát ø 8 mm',
    catalogCode: 'DEHN:202249',
    manufacturer: 'DEHN',
    quantity: roofSupports,
    unit: 'ks',
    unitPriceCzk: 62,
    totalPriceCzk: roofSupports * 62
  });

  // 2. Svody
  const downConductors = isolatedLps.numberOfDownConductors || Math.max(2, Math.round(perimeter / 15));
  const downConductorWireLength = Math.round(downConductors * (H + 2));
  items.push({
    itemNumber: itemNum++,
    category: 'Svodová soustava',
    name: 'Vodič svodů po fasádě',
    specification: 'Drát FeZn ø 8 mm žárově zinkovaný',
    catalogCode: 'FeZn-8',
    manufacturer: 'Standard ČSN EN 62561-2',
    quantity: downConductorWireLength,
    unit: 'm',
    unitPriceCzk: 42,
    totalPriceCzk: downConductorWireLength * 42
  });

  items.push({
    itemNumber: itemNum++,
    category: 'Svodová soustava',
    name: 'Podpěry vedení do zdiva / zateplení',
    specification: 'Podpěra s vrutem a hmoždinkou l = 160–200 mm',
    catalogCode: 'DEHN:273020',
    manufacturer: 'DEHN / OEZ',
    quantity: Math.round(downConductors * (H / 1.0)),
    unit: 'ks',
    unitPriceCzk: 54,
    totalPriceCzk: Math.round(downConductors * (H / 1.0)) * 54
  });

  items.push({
    itemNumber: itemNum++,
    category: 'Svodová soustava',
    name: 'Ochranný úhelník / trubka svodu L-O-K',
    specification: 'Ochranná trubka 1,8 m s příchytkami pro ochranu před mechanickým poškozením',
    catalogCode: 'DEHN:728518',
    manufacturer: 'DEHN',
    quantity: downConductors,
    unit: 'ks',
    unitPriceCzk: 480,
    totalPriceCzk: downConductors * 480
  });

  items.push({
    itemNumber: itemNum++,
    category: 'Svodová soustava',
    name: 'Zkušební svorka ZS',
    specification: 'Dvoušroubová zkušební svorka FeZn s očíslováním',
    catalogCode: 'DEHN:390050',
    manufacturer: 'DEHN',
    quantity: downConductors,
    unit: 'ks',
    unitPriceCzk: 125,
    totalPriceCzk: downConductors * 125
  });

  // 3. Uzemnění
  const earthingLength = results.actualEarthingLength_m || perimeter;
  items.push({
    itemNumber: itemNum++,
    category: 'Uzemňovací soustava',
    name: 'Obvodový / základový zemnič',
    specification: 'Pásek FeZn 30×4 mm žárově zinkovaný (cca 0,95 kg/m)',
    catalogCode: 'FeZn-30x4',
    manufacturer: 'ČSN EN 62561-2',
    quantity: earthingLength,
    unit: 'm',
    unitPriceCzk: 98,
    totalPriceCzk: earthingLength * 98
  });

  const earthClamps = downConductors * 2 + 6;
  items.push({
    itemNumber: itemNum++,
    category: 'Uzemňovací soustava',
    name: 'Křížové a spojovací svorky zemniče SK',
    specification: 'Křížová svorka pásek-drát FeZn',
    catalogCode: 'DEHN:318201',
    manufacturer: 'DEHN',
    quantity: earthClamps,
    unit: 'ks',
    unitPriceCzk: 88,
    totalPriceCzk: earthClamps * 88
  });

  items.push({
    itemNumber: itemNum++,
    category: 'Uzemňovací soustava',
    name: 'Antikorozní páska pro podzemní přechody',
    specification: 'Petrolátová hydroizolační páska šíře 50 mm (ochrana proti korozi na výstupu ze země)',
    catalogCode: 'DEHN:563050',
    manufacturer: 'DEHN',
    quantity: Math.max(1, Math.ceil(downConductors / 3)),
    unit: 'role (10m)',
    unitPriceCzk: 460,
    totalPriceCzk: Math.max(1, Math.ceil(downConductors / 3)) * 460
  });

  // 4. Přepěťové ochrany SPD
  const selectedSpd = SPD_CATALOG.find(s => s.orderCode === measures.catalogSpdArticle) ||
    SPD_CATALOG.find(s => s.typeClass.includes('Typ 1+2') && s.networkType.includes('TN-C')) ||
    SPD_CATALOG[0];

  items.push({
    itemNumber: itemNum++,
    category: 'Přepěťová ochrana SPD',
    name: selectedSpd.name,
    specification: `${selectedSpd.typeClass}, ${selectedSpd.networkType}, Iimp = ${selectedSpd.Iimp}, Up = ${selectedSpd.Up}`,
    catalogCode: selectedSpd.orderCode,
    manufacturer: selectedSpd.manufacturer,
    quantity: 1,
    unit: 'ks',
    unitPriceCzk: selectedSpd.approxPriceCzk,
    totalPriceCzk: selectedSpd.approxPriceCzk
  });

  // Podružné SPD Typ 2
  const spdType2 = SPD_CATALOG.find(s => s.typeClass === 'Typ 2') || SPD_CATALOG[3];
  items.push({
    itemNumber: itemNum++,
    category: 'Přepěťová ochrana SPD',
    name: spdType2.name,
    specification: `${spdType2.typeClass}, ${spdType2.networkType}, In = ${spdType2.In}, Up = ${spdType2.Up}`,
    catalogCode: spdType2.orderCode,
    manufacturer: spdType2.manufacturer,
    quantity: 1,
    unit: 'ks',
    unitPriceCzk: spdType2.approxPriceCzk,
    totalPriceCzk: spdType2.approxPriceCzk
  });

  // 5. Oddálený hromosvod HVI
  if (isolatedLps.enabled) {
    const isPower = isolatedLps.hviType === 'hvi_power';
    const isStandard = isolatedLps.hviType === 'hvi_standard';
    const hviCode = isPower ? 'DEHN:819025 (HVI power)' : isStandard ? 'DEHN:819020 (HVI standard)' : 'DEHN:819015 (HVI light)';
    const hviPrice = isPower ? 1800 : isStandard ? 1450 : 1200;

    items.push({
      itemNumber: itemNum++,
      category: 'Oddálený systém HVI',
      name: `Vysokonapěťový izolovaný vodič DEHN ${isolatedLps.hviType === 'hvi_power' ? 'HVI power' : isolatedLps.hviType === 'hvi_standard' ? 'HVI standard' : 'HVI light'}`,
      specification: `Ekvivalentní izolační vzdálenost s = ${results.hvi_equivalent_distance_cm} cm, polovodivý vnější plášť`,
      catalogCode: hviCode,
      manufacturer: 'DEHN SE',
      quantity: isolatedLps.conductorLength,
      unit: 'm',
      unitPriceCzk: hviPrice,
      totalPriceCzk: isolatedLps.conductorLength * hviPrice
    });

    items.push({
      itemNumber: itemNum++,
      category: 'Oddálený systém HVI',
      name: 'Těsnicí koncovková sada vodiče HVI',
      specification: 'Smršťovací dielektrická koncovka s kontaktním prvkem a zkušebním těsněním',
      catalogCode: 'DEHN:819131',
      manufacturer: 'DEHN SE',
      quantity: 1,
      unit: 'sada',
      unitPriceCzk: 5500,
      totalPriceCzk: 5500
    });

    items.push({
      itemNumber: itemNum++,
      category: 'Oddálený systém HVI',
      name: 'Jímací tyč a izolační podpůrná trubka GRP',
      specification: `Jímací tyč AlMgSi h = ${isolatedLps.rodHeight} m s podpůrnou izolační trubkou z plastu vyztuženého skelnými vlákny`,
      catalogCode: 'DEHN:105342',
      manufacturer: 'DEHN SE',
      quantity: 1,
      unit: 'sada',
      unitPriceCzk: 6500,
      totalPriceCzk: 6500
    });
  }

  // 6. Montážní a revizní položky
  const laborHours = Math.round(30 + (roofArea / 20) + (downConductors * 4));
  items.push({
    itemNumber: itemNum++,
    category: 'Montážní práce',
    name: 'Elektromontážní práce vnějšího a vnitřního LPS',
    specification: 'Instalace jímací soustavy, svodů, propojení MET, montáž a zapojení SPD v rozváděči',
    catalogCode: 'MONT-LPS',
    manufacturer: 'Autorizovaná elektroinstalační firma',
    quantity: laborHours,
    unit: 'hod',
    unitPriceCzk: 650,
    totalPriceCzk: laborHours * 650
  });

  items.push({
    itemNumber: itemNum++,
    category: 'Revize a zkoušky',
    name: 'Výchozí revize LPS a měření zemního odporu',
    specification: 'Měření přechodových odporů spojů, měření zemního odporu a vypracování zprávy dle ČSN 33 1500',
    catalogCode: 'REV-331500',
    manufacturer: 'Revizní technik ev. č. ČKAIT / TIČR',
    quantity: 1,
    unit: 'protokol',
    unitPriceCzk: 4800,
    totalPriceCzk: 4800
  });

  return items;
}

export function exportBomToCsv(
  project: LpsProjectState,
  results: CalculationResults
): void {
  const items = generateBomItems(project, results);

  // UTF-8 BOM pro správné otevření v českém Microsoft Excelu
  let csvContent = '\uFEFF';
  csvContent += `KUSOVNÍK MATERIÁLU LPS SYSTÉMU (ČSN EN 62305)\n`;
  csvContent += `Projekt;${project.meta.projectName};Číslo zakázky;${project.meta.projectCode || '-'}\n`;
  csvContent += `Investor;${project.meta.investor};Zpracovatel;${project.meta.designer}\n`;
  csvContent += `Třída LPS;LPS ${project.measures.lpsClass};Stupeň SPD;${project.measures.spdLevel};Datum;${project.meta.date}\n\n`;

  // Hlavička tabulky
  csvContent += `Položka;Kategorie;Název prvku;Technická specifikace;Objednací kód;Výrobce;Množství;Jednotka;Jedn. cena (Kč);Celkem bez DPH (Kč)\n`;

  let sumWithoutVat = 0;
  items.forEach(it => {
    sumWithoutVat += it.totalPriceCzk;
    const line = [
      it.itemNumber,
      `"${it.category}"`,
      `"${it.name}"`,
      `"${it.specification}"`,
      `"${it.catalogCode}"`,
      `"${it.manufacturer}"`,
      it.quantity,
      it.unit,
      it.unitPriceCzk,
      it.totalPriceCzk
    ].join(';');
    csvContent += line + '\n';
  });

  const vatAmount = Math.round(sumWithoutVat * 0.21);
  const totalWithVat = sumWithoutVat + vatAmount;

  csvContent += `\n;;;;;;;;CELKEM BEZ DPH;${sumWithoutVat} Kč\n`;
  csvContent += `;;;;;;;;DPH 21 %;${vatAmount} Kč\n`;
  csvContent += `;;;;;;;;CELKEM VČETNĚ DPH;${totalWithVat} Kč\n`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Kusovnik_LPS_${project.meta.projectCode || 'zakazka'}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
