/**
 * Modul pro orientační inženýrskou kalkulaci nákladů LPS systému
 * na základě třídy ochrany (LPS I až IV), geometrie objektu a instalace HVI
 */

import { LpsClass, SpdLevel, HviType, LpsProjectState } from '../types/lps';

export interface LpsCostItem {
  category: string;
  description: string;
  materialCost: number; // v Kč bez DPH
  laborCost: number;    // v Kč bez DPH
  revisionCost?: number;// v Kč bez DPH (revizní zkoušky a certifikace)
  totalCost: number;    // v Kč bez DPH
}

export interface LpsClassCostSummary {
  lpsClass: LpsClass;
  isRecommended: boolean;
  isSelected: boolean;
  roofArea: number;           // m²
  perimeter: number;          // m
  downConductorCount: number; // počet svodů
  meshSize: string;           // velikost ok mříže
  items: LpsCostItem[];
  totalMaterialCost: number;  // celkem materiál v Kč bez DPH
  totalLaborCost: number;     // celkem montážní práce v Kč bez DPH
  totalRevisionCost: number;  // celkem revizní zkoušky a certifikace v Kč bez DPH
  totalWithoutVat: number;    // v Kč bez DPH
  vatAmount: number;          // 21% DPH
  totalWithVat: number;       // v Kč vč. DPH
}

export interface ComparativeCosts {
  summaries: Record<LpsClass, LpsClassCostSummary>;
  selectedClass: LpsClass;
  hviAddition: number; // příplatek za HVI systém
}

/**
 * Spočte orientační položkový rozpočet pro danou třídu LPS
 */
export function calculateClassCost(
  cls: LpsClass,
  project: LpsProjectState,
  isRecommended: boolean
): LpsClassCostSummary {
  const { building, measures, isolatedLps } = project;
  const L = building.length;
  const W = building.width;
  const H = building.height;
  const roofArea = L * W;
  const perimeter = 2 * (L + W);

  // Uživatelské přizpůsobení sazeb, pokud bylo v nastavení změněno
  const custom = project.customCostRates;

  // Počet svodů dle normové vzdálenosti svodů (ČSN EN 62305-3)
  let maxDownConductorSpacing = 20; // LPS IV
  let meshSize = '20 × 20 m';
  let airTerminationRate = custom?.airTerminationRate ? custom.airTerminationRate * 0.75 : 240; // Kč/m²
  let spdBaseCost = 14000;      // LPL IV

  if (cls === 'III') {
    maxDownConductorSpacing = 15;
    meshSize = '15 × 15 m';
    airTerminationRate = custom?.airTerminationRate || 320;
    spdBaseCost = 21000;
  } else if (cls === 'II') {
    maxDownConductorSpacing = 10;
    meshSize = '10 × 10 m';
    airTerminationRate = custom?.airTerminationRate ? custom.airTerminationRate * 1.4 : 450;
    spdBaseCost = 38000;
  } else if (cls === 'I') {
    maxDownConductorSpacing = 10;
    meshSize = '5 × 5 m';
    airTerminationRate = custom?.airTerminationRate ? custom.airTerminationRate * 2.1 : 680;
    spdBaseCost = 65000;
  } else if (cls === 'none') {
    maxDownConductorSpacing = 0;
    meshSize = 'Bez ochrany';
    airTerminationRate = 0;
    spdBaseCost = 0;
  }

  const downConductorCount = cls === 'none' ? 0 : Math.max(2, Math.ceil(perimeter / maxDownConductorSpacing));
  const laborMultiplier = custom?.laborHourlyRate ? (custom.laborHourlyRate / 650) : 1.0;

  // 1. Jímací soustava na střeše (AlMgSi 8 mm, podpěry na krytinu, jímací tyče, svorky)
  const airTerminationMat = Math.round(roofArea * airTerminationRate);
  const airTerminationLab = Math.round(airTerminationMat * 0.40 * laborMultiplier);

  // 2. Svodová soustava (svody, distanční podpěry, ochranné úhelníky L-O-K, zkušební svorky)
  const conductorPerUnitMat = 3200 + H * 120; // svod, trubka, svorka
  const conductorPerUnitLab = Math.round((2100 + H * 90) * laborMultiplier);
  const downConductorsMat = downConductorCount * conductorPerUnitMat;
  const downConductorsLab = downConductorCount * conductorPerUnitLab;

  // 3. Uzemňovací soustava (obvodový / základový zemnič FeZn 30x4, antikorozní páska, zemní svorky)
  const earthMat = Math.round(perimeter * 380);
  const earthLab = Math.round(perimeter * 220 * laborMultiplier);

  // 4. Koordinovaná ochrana před přepětím SPD (hlavní a podružný rozváděč)
  const spdMat = spdBaseCost;
  const spdLab = cls === 'none' ? 0 : Math.round(3500 * laborMultiplier);

  // 5. Příplatek za izolovaný systém HVI (pokud je zvolen a třída není 'none')
  let hviMat = 0;
  let hviLab = 0;
  if (isolatedLps.enabled && cls !== 'none') {
    const hviLength = isolatedLps.conductorLength;
    const defaultMeterRate = isolatedLps.hviType === 'hvi_power' ? 1800 : isolatedLps.hviType === 'hvi_standard' ? 1450 : 1200;
    const hviPerMeter = (isolatedLps.hviType === 'hvi_power' && custom?.hviPowerRate) ? custom.hviPowerRate : (isolatedLps.hviType === 'hvi_standard' && custom?.hviStandardRate) ? custom.hviStandardRate : defaultMeterRate;
    const sealingKitCost = 5500; // koncovka a těsnění
    const mastGrpCost = 6500;    // podpůrná trubka GRP

    hviMat = (hviLength * hviPerMeter) + sealingKitCost + mastGrpCost;
    hviLab = Math.round((4500 + Math.round(hviLength * 350)) * laborMultiplier);
  }

  // 6. Výchozí revize, měření přechodových odporů a dokumentace
  const baseRevCost = custom?.revisionBaseCost || 4500;
  const revisionCost = cls === 'none' ? 0 : Math.round(baseRevCost + (perimeter * 25) + (downConductorCount * 400));

  const items: LpsCostItem[] = [
    {
      category: 'Jímací soustava',
      description: `Mřížová soustava ${meshSize}, jímací tyče, podpěry vedení na krytině AlMgSi 8 mm`,
      materialCost: airTerminationMat,
      laborCost: airTerminationLab,
      totalCost: airTerminationMat + airTerminationLab
    },
    {
      category: 'Svodová soustava',
      description: `${downConductorCount} svodů po obvodu, ochranné trubky L-O-K 1,8 m, zkušební svorky ZS`,
      materialCost: downConductorsMat,
      laborCost: downConductorsLab,
      totalCost: downConductorsMat + downConductorsLab
    },
    {
      category: 'Uzemnění',
      description: `Obvodový / základový zemnič FeZn 30×4 mm, délka ${perimeter} m, antikorozní ochrana spojů`,
      materialCost: earthMat,
      laborCost: earthLab,
      totalCost: earthMat + earthLab
    },
    {
      category: 'Přepěťová ochrana SPD',
      description: `Koordinované svodiče bleskových proudů a přepětí Typ 1+2 v rozváděči`,
      materialCost: spdMat,
      laborCost: spdLab,
      totalCost: spdMat + spdLab
    },
    ...(isolatedLps.enabled && cls !== 'none' ? [{
      category: 'Oddálený systém HVI',
      description: `Vysokonapěťový svod ${isolatedLps.hviType} (${isolatedLps.conductorLength} m), koncovka, podpůrná trubka GRP`,
      materialCost: hviMat,
      laborCost: hviLab,
      totalCost: hviMat + hviLab
    }] : []),
    {
      category: 'Revize a dokumentace',
      description: `Výchozí revize dle ČSN 33 1500, měření zemního odporu a předávací protokol`,
      materialCost: 0,
      laborCost: 0,
      revisionCost: revisionCost,
      totalCost: revisionCost
    }
  ];

  const totalMaterialCost = items.reduce((acc, item) => acc + item.materialCost, 0);
  const totalLaborCost = items.reduce((acc, item) => acc + item.laborCost, 0);
  const totalRevisionCost = items.reduce((acc, item) => acc + (item.revisionCost || 0), 0);
  const totalWithoutVat = totalMaterialCost + totalLaborCost + totalRevisionCost;
  const vatAmount = Math.round(totalWithoutVat * 0.21);
  const totalWithVat = totalWithoutVat + vatAmount;

  return {
    lpsClass: cls,
    isRecommended,
    isSelected: measures.lpsClass === cls,
    roofArea,
    perimeter,
    downConductorCount,
    meshSize,
    items,
    totalMaterialCost,
    totalLaborCost,
    totalRevisionCost,
    totalWithoutVat,
    vatAmount,
    totalWithVat
  };
}

/**
 * Spočte srovnávací kalkulaci pro všechny třídy LPS I až IV
 */
export function calculateComparativeCosts(
  project: LpsProjectState,
  recommendedClass: LpsClass
): ComparativeCosts {
  const classes: LpsClass[] = ['IV', 'III', 'II', 'I'];
  const summaries: Record<string, LpsClassCostSummary> = {};

  for (const cls of classes) {
    summaries[cls] = calculateClassCost(cls, project, cls === recommendedClass);
  }

  // Příplatek za HVI
  let hviAddition = 0;
  if (project.isolatedLps.enabled) {
    const len = project.isolatedLps.conductorLength;
    hviAddition = (len * 1500) + 12000;
  }

  return {
    summaries: summaries as Record<LpsClass, LpsClassCostSummary>,
    selectedClass: project.measures.lpsClass,
    hviAddition
  };
}
