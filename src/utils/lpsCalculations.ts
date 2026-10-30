/**
 * Matematický aparát pro výpočet řízení rizik podle ČSN EN 62305-2 ed. 2
 * a výpočet dostatečné separační vzdálenosti 's' podle ČSN EN 62305-3 ed. 2
 */

import {
  LpsProjectState,
  CalculationResults,
  ComponentRisks,
  LpsClass,
  SpdLevel,
  HviType,
  BuildingData,
  PvInstallationData,
  PvLpsEvaluation,
  SurroundingShieldingData,
  SurroundingShieldingEvaluation,
  SpdEvaluation,
  HeatmapZoneInfo
} from '../types/lps';

// Tolerovatelná rizika dle ČSN EN 62305-2 (Tabulka 4)
export const RT1_LIMIT = 1.0e-5; // Ztráta lidských životů nebo trvalé zranění
export const RT2_LIMIT = 1.0e-3; // Ztráta veřejných služeb
export const RT3_LIMIT = 1.0e-4; // Ztráta kulturního dědictví
export const RT4_LIMIT = 1.0e-3; // Hospodářské ztráty

/**
 * Koeficient polohy stavby Cd (Tabulka A.1)
 */
export function getCd(locationFactor: string): number {
  switch (locationFactor) {
    case 'surrounded_by_objects':
      return 0.25; // Objekt obklopený vyššími objekty
    case 'surrounded_by_trees':
      return 0.5;  // Objekt obklopený objekty/stromy stejné výšky
    case 'on_hilltop':
      return 2.0;  // Objekt na vrcholu kopce nebo na vyvýšeném ostrohu
    case 'isolated':
    default:
      return 1.0;  // Samostatně stojící objekt na rovině
  }
}

/**
 * Koeficient rf - riziko požáru (Tabulka C.5)
 */
export function getRf(fireRisk: string): number {
  switch (fireRisk) {
    case 'low':
      return 0.001; // nehořlavé konstrukce a nízké požární zatížení
    case 'high':
      return 0.1;   // dřevěné konstrukce, hořlavá střecha, chemikálie
    case 'ordinary':
    default:
      return 0.01;  // běžné požární zatížení
  }
}

/**
 * Koeficient rp - opatření ke snížení následků požáru (Tabulka C.6)
 */
export function getRp(fireProtection: string): number {
  switch (fireProtection) {
    case 'sprinklers':
      return 0.1; // samočinné stabilní hasicí zařízení (sprinklery)
    case 'automatic_alarm':
      return 0.2; // samočinná elektrická požární signalizace (EPS)
    case 'manual_alarm':
      return 0.5; // ruční hlásiče požáru
    case 'extinguishers':
      return 0.5; // ruční hasicí přístroje
    case 'none':
    default:
      return 1.0; // bez zvláštních protipožárních opatření
  }
}

/**
 * Koeficient ra - úraz osob dotykovým a krokovým napětím (podlahová krytina)
 */
export function getRa(floorSurface: string): number {
  switch (floorSurface) {
    case 'asphalt':
      return 0.0001; // asfalt, linoleum s vysokým izolačním odporem
    case 'wood':
    case 'gravel_tile':
      return 0.001;  // dřevo, koberce, suché dlaždice
    case 'concrete':
    default:
      return 0.01;   // beton, vlhká zemina, kovové rošty
  }
}

/**
 * Koeficient ki pro výpočet separační vzdálenosti s (ČSN EN 62305-3 čl. 6.3)
 */
export function getKi(lpsClass: LpsClass): number {
  switch (lpsClass) {
    case 'I':
      return 0.08;
    case 'II':
      return 0.06;
    case 'III':
    case 'IV':
      return 0.04;
    case 'none':
    default:
      return 0.08; // Referenční bezpečnostní hodnota
  }
}

/**
 * Koeficient kc pro rozdělení bleskového proudu (ČSN EN 62305-3)
 */
export function getKc(numberOfDownConductors: number, customKc?: number): number {
  if (customKc && customKc > 0) return customKc;
  if (numberOfDownConductors <= 1) return 1.0;
  if (numberOfDownConductors === 2) return 0.66;
  return 0.44; // 3 a více svodů / mřížová soustava
}

/**
 * Ekvivalentní dostatečná vzdálenost pro DEHN HVI prvky v centimetrech
 */
export function getHviEquivalentDistanceCm(hviType: HviType, insulationMaterial: 'air' | 'solid'): number {
  const isSolid = insulationMaterial === 'solid';
  switch (hviType) {
    case 'hvi_light':
      return isSolid ? 90 : 45; // HVI light: 45 cm ve vzduchu, 90 cm v pevném dielektriku
    case 'hvi_standard':
      return isSolid ? 150 : 75; // HVI standard: 75 cm ve vzduchu, 150 cm v pevném dielektriku
    case 'hvi_power':
      return isSolid ? 180 : 90; // HVI power: 90 cm ve vzduchu, 180 cm v pevném dielektriku
    case 'dehniso_spacer':
      return isSolid ? 100 : 50; // DEHNiso distanční vzpěra GRP (typicky 50-100 cm)
  }
}

/**
 * Pomocný výpočet složek rizika pro zadanou konfiguraci LPS a SPD
 */
function calculateComponents(
  project: LpsProjectState,
  targetLps: LpsClass,
  targetSpd: SpdLevel,
  Ad: number,
  Am: number,
  Al_power: number,
  Ai_power: number,
  Al_telecom: number,
  Ai_telecom: number,
  effectiveCd?: number,
  kms?: number
): { components: ComponentRisks; R1: number; R2: number; R3: number; R4: number } {
  const { building, lines, zone } = project;
  const Cd = effectiveCd !== undefined ? effectiveCd : getCd(building.locationFactor);
  const KmsFactor = kms !== undefined ? kms : 1.0;
  const Ng = building.groundFlashDensity;

  // Frekvence nebezpečných událostí
  const Nd = Ng * Ad * Cd * 1e-6;
  const Nm = Ng * Am * 1e-6;

  const Ce_power = lines.powerLineType === 'underground' ? 0.5 : 1.0;
  const Nl_power = Ng * Al_power * Ce_power * 1e-6;
  const Ni_power = Ng * Ai_power * Ce_power * 1e-6;

  const Ce_telecom = lines.telecomLineType === 'underground' ? 0.5 : 1.0;
  const Nl_telecom = lines.telecomLineType === 'none' ? 0 : Ng * Al_telecom * Ce_telecom * 1e-6;
  const Ni_telecom = lines.telecomLineType === 'none' ? 0 : Ng * Ai_telecom * Ce_telecom * 1e-6;

  const Nl = Nl_power + Nl_telecom;
  const Ni = Ni_power + Ni_telecom;

  // Pravděpodobnost škody PB dle třídy LPS (Tabulka B.2)
  let PB = 1.0;
  let PTA = 1.0;
  if (targetLps === 'I') {
    PB = 0.02;
    PTA = 0.01;
  } else if (targetLps === 'II') {
    PB = 0.05;
    PTA = 0.02;
  } else if (targetLps === 'III') {
    PB = 0.1;
    PTA = 0.05;
  } else if (targetLps === 'IV') {
    PB = 0.2;
    PTA = 0.05;
  }

  // Izolovaný svod / varovné tabulky snižují dotykové napětí
  if (project.isolatedLps.enabled || project.measures.warningNotices) {
    PTA = PTA * 0.1;
  }

  // Pravděpodobnost vnitřního přepětí PSPD dle úrovně koordinované SPD (Tabulka B.3 a ČSN EN 62305-4)
  let PSPD = 1.0;
  if (targetSpd === 'LPL_I') PSPD = 0.005;
  else if (targetSpd === 'LPL_II') PSPD = 0.01;
  else if (targetSpd === 'LPL_III') PSPD = 0.02;
  else if (targetSpd === 'LPL_IV') PSPD = 0.05;

  // Zohlednění detailní konfigurace SPD přístroje a vícestupňové koordinace dle ČSN EN 62305-4
  if (targetSpd !== 'none' && project.measures.spdConfig) {
    const spd = project.measures.spdConfig;
    if (spd.customPspd !== undefined && spd.customPspd > 0) {
      PSPD = spd.customPspd;
    } else {
      // Koordinovaná kaskáda Typ 1 + 2 + 3 redukuje zbytkové napětí
      if (spd.isCoordinatedCascade) {
        PSPD = Math.max(0.001, PSPD * 0.5);
      }
      // Beznapěťové jiskřiště (spark gap) s nulovým zbytkovým proudem
      if (spd.technology === 'spark_gap') {
        PSPD = Math.max(0.001, PSPD * 0.85);
      }
      // Pokud je u objektu s vnějším LPS použit pouze Typ 2 (bez svodiče Typ 1 s vlnou 10/350), hrozí přetížení
      if (spd.spdClassType === 'type_2' && targetLps !== 'none') {
        PSPD = Math.min(0.5, PSPD * 6.0);
      }
      // Vliv ochranné napěťové hladiny Up
      if (spd.up_kV > 0 && spd.up_kV <= 1.0) {
        PSPD = Math.max(0.001, PSPD * 0.8);
      } else if (spd.up_kV > 2.0) {
        PSPD = Math.min(0.2, PSPD * 1.5);
      }
    }
  }

  // Stínění (zahrnuje stínění mříží a útlum vlnového pole okolní zástavbou KMS dle ČSN EN 62305-4)
  let PMS = targetSpd !== 'none' ? PSPD : 1.0;
  if (project.measures.shieldingMesh) {
    PMS *= 0.1;
  }
  PMS *= KmsFactor;

  // Telekomunikační SPD redukce (kategorie D1/C2 dle ČSN EN 62305-4)
  const telecomSpdFactor = (targetSpd !== 'none' && project.measures.spdConfig?.telecomSpdInstalled) ? 0.2 : 1.0;

  // Pravděpodobnosti přenosu po vedení
  const PU = lines.powerLineShielding === 'shielded' ? 0.2 * PTA : PTA;
  const PV = lines.powerLineShielding === 'shielded' ? 0.2 * PB : PB;
  const PW = lines.powerLineShielding === 'shielded' ? 0.2 * PSPD : PSPD;
  const PZ = (lines.telecomLineShielding === 'shielded' ? 0.2 * PMS : PMS) * telecomSpdFactor;

  // Ztrátové činitele
  const hz = Math.min(1.0, Math.max(0.01, zone.presenceHoursPerYear / 8760));
  const rf = getRf(zone.fireRisk);
  const rp = getRp(zone.fireProtection);
  const ra = getRa(zone.floorSurface);

  let panicMultiplier = 1.0;
  if (zone.panicRisk === 'moderate') panicMultiplier = 2.0;
  if (zone.panicRisk === 'high') panicMultiplier = 5.0;

  // Ztráty pro R1 (ztráta lidských životů)
  const Lt1 = 1e-4 * ra * hz * panicMultiplier; // dotykové napětí
  const Lf1 = 1e-2 * rf * rp * hz * panicMultiplier; // požár/mechanické poškození
  const Lo1 = 1e-3 * hz * (zone.publicServiceType === 'hospital' ? 1.0 : 0.01); // vnitřní systémy

  // Složky rizik
  const RA = Nd * PTA * Lt1;
  const RB = Nd * PB * Lf1;
  const RC = Nd * PSPD * Lo1;
  const RM = Nm * PMS * Lo1;
  const RU = Nl * PU * Lt1;
  const RV = Nl * PV * Lf1;
  const RW = Nl * PW * Lo1;
  const RZ = Ni * PZ * Lo1;

  // Celkové riziko R1
  const R1 = RA + RB + RC + RM + RU + RV + RW + RZ;

  // Riziko R2 (ztráta veřejných služeb)
  let R2 = 0;
  if (zone.publicServiceType !== 'none') {
    const serviceWeight = zone.publicServiceType === 'hospital' ? 1.0 : 0.5;
    const Lf2 = 1e-2 * rf * rp * serviceWeight;
    const Lo2 = 1e-2 * serviceWeight;
    R2 = Nd * PB * Lf2 + Nd * PSPD * Lo2 + Nm * PMS * Lo2 + Nl * PV * Lf2 + Nl * PW * Lo2 + Ni * PZ * Lo2;
  }

  // Riziko R3 (kulturní dědictví)
  let R3 = 0;
  if (zone.culturalHeritageValue) {
    const Lf3 = 1e-1 * rf * rp;
    R3 = Nd * PB * Lf3 + Nl * PV * Lf3;
  }

  // Riziko R4 (hospodářské škody)
  const totalValue = Math.max(1, zone.economicValueBuilding + zone.economicValueEquipment);
  const buildingWeight = zone.economicValueBuilding / totalValue;
  const equipWeight = zone.economicValueEquipment / totalValue;
  const Lf4 = 0.5 * rf * rp * buildingWeight;
  const Lo4 = 0.2 * equipWeight;

  const R4 = (Nd * PB * Lf4) + (Nd * PSPD * Lo4) + (Nm * PMS * Lo4) + (Nl * PV * Lf4) + (Nl * PW * Lo4) + (Ni * PZ * Lo4);

  return {
    components: { RA, RB, RC, RM, RU, RV, RW, RZ },
    R1,
    R2,
    R3,
    R4
  };
}

/**
 * Posouzení vlivu střešní fotovoltaické instalace (FVE) na LPS
 * a výpočet dostatečné separační vzdálenosti 's' dle ČSN EN 62305-3 čl. 6.3
 * a doporučení dle ČSN CLC/TS 51643-32 a ČSN 33 2000-7-712
 */
export function calculatePvEvaluation(
  building: BuildingData,
  lpsClass: LpsClass,
  pv?: PvInstallationData
): PvLpsEvaluation {
  const L = building.length;
  const W = building.width;
  const H = building.height;
  const roofArea_m2 = Math.round(L * W * 10) / 10;
  const baseAd_m2 = Math.round(((L * W) + (6 * H * (L + W)) + (Math.PI * Math.pow(3 * H, 2))) * 10) / 10;

  if (!pv || !pv.enabled) {
    return {
      hasPv: false,
      systemType: 'roof_residential',
      effectiveHeight_m: H,
      baseAd_m2,
      effectiveAd_m2: baseAd_m2,
      deltaAd_m2: 0,
      pvArea_m2: 0,
      roofArea_m2,
      roofCoveragePct: 0,
      ki_factor: getKi(lpsClass),
      kc_factor: 0.66,
      km_factor: 1.0,
      conductorLength_l_m: H + 2,
      separationDistance_s_meters: 0,
      separationDistance_s_cm: 0,
      actualDistance_d_cm: 100,
      isSeparationMaintained: true,
      requiredBonding: 'potential_equalization_6mm2_Cu',
      requiredSpdDC: 'Typ 2',
      requiredSpdAC: 'Typ 2',
      fireRiskEvaluation: 'ordinary',
      minSpdVoltageUcpv_V: 1000,
      isDualSpdRequired: false,
      galvanicBondingDiameterMm: '6 mm² Cu',
      pneStandardCompliance: 'Bez instalované FVE - normy pro výrobny se neuplatňují.',
      recommendedSpdCatalogModel: 'Není požadováno',
      verdict: 'Na střeše objektu není evidována fotovoltaická instalace.',
      recommendations: ['V případě budoucí instalace FVE je nutné posoudit dodržení oddělovací vzdálenosti s.']
    };
  }

  const protrusion = pv.rackProtrusionHeight || 0;
  const effectiveHeight_m = Math.round((H + protrusion) * 100) / 100;
  const effectiveAd_m2 = Math.round(((L * W) + (6 * effectiveHeight_m * (L + W)) + (Math.PI * Math.pow(3 * effectiveHeight_m, 2))) * 10) / 10;
  const deltaAd_m2 = Math.max(0, Math.round((effectiveAd_m2 - baseAd_m2) * 10) / 10);

  const panelCount = pv.panelCount || 24;
  const pvArea_m2 = pv.panelAreaM2 || Math.round(panelCount * 1.95 * 10) / 10;
  const roofCoveragePct = Math.min(100, Math.round((pvArea_m2 / Math.max(1, roofArea_m2)) * 1000) / 10);

  // DC parametry stringů
  const uoc = pv.stringVoltageUoc_V || 800; // [V]
  const minSpdVoltageUcpv_V = Math.round(uoc * 1.2); // ČSN CLC/TS 50539-12 čl. 5.3: Ucpv ≥ 1.2 * Uoc_STC
  const dcLength = pv.dcCableLength_m || 15; // [m]
  const isDualSpdRequired = dcLength > 10; // ČSN CLC/TS 51643-32: Pokud je délka DC trasy > 10 m, vyžaduje se SPD na obou koncích

  // Výpočet dostatečné vzdálenosti s = ki * (kc / km) * l dle ČSN EN 62305-3 čl. 6.3
  const ki = getKi(lpsClass);
  const kc = getKc(pv.downConductorCount, pv.customKc);
  const km = pv.dielectricMedium === 'solid' ? 0.5 : 1.0;
  const l = Math.max(0.5, pv.conductorLengthL || (H + 2));

  const s_meters = ki * (kc / km) * l;
  const s_cm = Math.round(s_meters * 100 * 10) / 10;
  const d_cm = pv.shortestDistanceToLpsCm;

  const isSeparationMaintained = d_cm >= s_cm;

  // Vyhodnocení pospojení a SPD
  const requiredBonding = isSeparationMaintained
    ? 'potential_equalization_6mm2_Cu'
    : 'direct_galvanic_16mm2_Cu';
  const galvanicBondingDiameterMm = isSeparationMaintained
    ? 'min. 6 mm² Cu (vyrovnání potenciálů)'
    : 'min. 16 mm² Cu / FeZn 50 mm² (bleskový proud)';

  let requiredSpdDC: 'Typ 2' | 'Typ 1+2 (Iimp ≥ 12.5 kA)' | 'Typ 1+2 (Iimp ≥ 5 kA)' = 'Typ 2';
  if (!isSeparationMaintained) {
    if (lpsClass === 'I' || lpsClass === 'II') {
      requiredSpdDC = 'Typ 1+2 (Iimp ≥ 12.5 kA)';
    } else {
      requiredSpdDC = 'Typ 1+2 (Iimp ≥ 5 kA)';
    }
  }

  const requiredSpdAC = isSeparationMaintained ? 'Typ 2' : 'Typ 1+2';

  const fireRiskEvaluation = (!isSeparationMaintained || pv.dcCableRouting === 'unshielded_exterior' || pv.dcCableLoopArea === 'large_loops')
    ? 'high'
    : 'ordinary';

  // Doporučený katalogový model SPD dle Ucpv a typu
  let recommendedSpdCatalogModel = '';
  if (requiredSpdDC.includes('Typ 1+2')) {
    if (minSpdVoltageUcpv_V <= 1000) {
      recommendedSpdCatalogModel = 'DEHNcombo YPV SCI 1000 (Iimp = 12.5 kA, Ucpv = 1000 V) / SALTEK FLP-PV-1000 V';
    } else if (minSpdVoltageUcpv_V <= 1200) {
      recommendedSpdCatalogModel = 'DEHNcombo YPV SCI 1200 (Iimp = 12.5 kA, Ucpv = 1200 V) / SALTEK FLP-PV-1200 V';
    } else {
      recommendedSpdCatalogModel = 'DEHNcombo YPV SCI 1500 (Iimp = 12.5 kA, Ucpv = 1500 V) pro velká fotovoltaická pole';
    }
  } else {
    if (minSpdVoltageUcpv_V <= 1000) {
      recommendedSpdCatalogModel = 'DEHNguard M YPV SCI 1000 (In = 12.5 kA, Ucpv = 1000 V) / SALTEK SLP-PV-1000 V';
    } else {
      recommendedSpdCatalogModel = 'DEHNguard M YPV SCI 1200 / 1500 (In = 15 kA, Ucpv = 1500 V)';
    }
  }

  // Posouzení shody s podnikovou normou PNE 33 0000-8 (připojování výroben FVE k distribuční soustavě ČEZ/E.GD/PRE)
  let pneStandardCompliance = '';
  if (isSeparationMaintained) {
    pneStandardCompliance = 'PLNĚ VYHOVUJE PNE 33 0000-8: Hromosvod je v oddáleném provedení s dodržením vzdálenosti s. Konstrukce FVE pospojována PE min. 6 mm² Cu, DC a AC přepěťové ochrany splňují připojovací podmínky PDS.';
  } else {
    pneStandardCompliance = 'VYŽADUJE OPATŘENÍ DLE PNE 33 0000-8: Z důvodu nedodržení vzdálenosti s musí být rámy panelů galvanicky propojeny s hromosvodem (Cu min. 16 mm²) a na DC i AC straně musí být osazen kombinovaný svodič bleskových proudů Typ 1+2.';
  }

  let verdict = '';
  const recommendations: string[] = [];

  if (isSeparationMaintained) {
    verdict = `VYHOVUJE. Dostatečná vzdálenost s = ${s_cm} cm je dodržena (naměřeno d = ${d_cm} cm, bezpečná rezerva +${(d_cm - s_cm).toFixed(1)} cm). Hromosvod je vůči FVE v oddáleném provedení.`;
    recommendations.push('Na DC vstupu střídače a v AC rozváděči postačuje přepěťová ochrana Typ 2 (ČSN CLC/TS 51643-32).');
    recommendations.push(`Minimální předepsané provozní napětí DC svodiče činí Ucpv ≥ ${minSpdVoltageUcpv_V} V DC (1,2 × Uoc = ${uoc} V dle CLC/TS 50539-12).`);
    recommendations.push('Kovové nosné konstrukce FVE spojte ochranným pospojením s hlavní uzemňovací přípojnicí vodičem PE Cu ≥ 6 mm².');
    if (isDualSpdRequired) {
      recommendations.push(`Délka DC trasy (${dcLength} m > 10 m): Dle normy ČSN CLC/TS 51643-32 čl. 5.3 je povinné osadit dvě sady SPD - jednu u střídače a druhou v podružném DC rozváděči u panelů na střeše!`);
    }
    recommendations.push('Udržujte minimalizovanou plochu indukčních smyček vedením DC vodičů (+ a -) v těsném souběhu.');
  } else {
    verdict = `NEVYHOVUJE! Dostatečná vzdálenost s = ${s_cm} cm NENÍ dodržena (skutečná vzdálenost d = ${d_cm} cm, deficit ${(s_cm - d_cm).toFixed(1)} cm). Vzniká bezprostřední nebezpečí elektrického přeskoku bleskového proudu na rámy FVE a zavlečení výboje do objektu!`;
    recommendations.push(`POVINNÉ OPATŘENÍ DLE ČSN EN 62305-3 Příloha U: Proveďte přímé galvanické propojení nosné konstrukce a rámů FV panelů s jímací soustavou hromosvodu vodičem Cu ≥ 16 mm² nebo FeZn ≥ 50 mm² (ø 8 mm).`);
    recommendations.push(`POVINNÁ OCHRANA SPD: Na vstupu DC vedení do budovy i na AC straně střídače musí být instalován koordinovaný kombinovaný svodič bleskových proudů a přepětí ${requiredSpdDC} s Ucpv ≥ ${minSpdVoltageUcpv_V} V.`);
    if (isDualSpdRequired) {
      recommendations.push(`Délka DC vedení (${dcLength} m > 10 m): Je nutné osadit svodiče Typ 1+2 na obou koncích trasy (střešní DC box u panelů i u střídače).`);
    }
    recommendations.push(`DOPORUČENÍ: Pro zachování odděleného hromosvodu zvažte úpravu polohy panelů, instalaci oddálených jímacích tyčí na vzpěrách DEHNiso, nebo použití izolovaného vysokonapěťového vodiče DEHN HVI.`);
    if (pv.dcCableRouting === 'unshielded_exterior') {
      recommendations.push('Doporučujeme uložit DC kabely do uzemněného plechového stínicího žlabu k omezení elektromagnetické indukce.');
    }
  }

  return {
    hasPv: true,
    systemType: pv.systemType || 'roof_residential',
    effectiveHeight_m,
    baseAd_m2,
    effectiveAd_m2,
    deltaAd_m2,
    pvArea_m2,
    roofArea_m2,
    roofCoveragePct,
    ki_factor: ki,
    kc_factor: kc,
    km_factor: km,
    conductorLength_l_m: l,
    separationDistance_s_meters: Math.round(s_meters * 1000) / 1000,
    separationDistance_s_cm: s_cm,
    actualDistance_d_cm: d_cm,
    isSeparationMaintained,
    requiredBonding,
    requiredSpdDC,
    requiredSpdAC,
    fireRiskEvaluation,
    minSpdVoltageUcpv_V,
    isDualSpdRequired,
    galvanicBondingDiameterMm,
    pneStandardCompliance,
    recommendedSpdCatalogModel,
    verdict,
    recommendations
  };
}

/**
 * Posouzení vlivu okolních staveb (stínění), koeficientů vlnového pole a pravděpodobnosti zásahu
 * dle ČSN EN 62305-2 Příloha A (A.2, A.4) a ČSN EN 62305-4 čl. A.2
 */
export function calculateSurroundingShielding(
  building: BuildingData
): SurroundingShieldingEvaluation {
  const baseCd = getCd(building.locationFactor);
  const H = building.height;
  const Ng = building.groundFlashDensity || 3.0;
  const L = building.length;
  const W = building.width;
  const baseAd = (L * W) + (6 * H * (L + W)) + (Math.PI * Math.pow(3 * H, 2));
  const baseNd = Ng * baseAd * baseCd * 1e-6;

  const data = building.surroundingShielding;
  if (!data || !data.enabled) {
    return {
      hasShielding: false,
      environmentPreset: 'open_field',
      baseCd,
      effectiveCd: baseCd,
      shieldingRatioPct: 0,
      maxShieldingAngleDeg: 0,
      waveFieldAttenuationFactor_Kms: 1.0,
      waveFieldAttenuation_dB: 0.0,
      strikeInterceptionProbPct: 0,
      directStrikeReductionPct: 0,
      baseNd,
      shieldedNd: baseNd,
      verdict: 'Stavba je posuzována bez zohlednění stínění okolními objekty (volné pole / standardní Cd).',
      technicalNotes: ['Pro zohlednění útlumu magnetického pole a záchytu blesku sousedními objekty aktivujte modul stínění.']
    };
  }

  // Přednastavené profily prostředí
  let presetCd = baseCd;
  let presetKms = 1.0;

  switch (data.environmentPreset) {
    case 'open_field':
      presetCd = 1.0;
      presetKms = 1.0;
      break;
    case 'suburban_houses':
      presetCd = Math.min(baseCd, 0.5);
      presetKms = 0.75;
      break;
    case 'urban_mixed':
      presetCd = Math.min(baseCd, 0.35);
      presetKms = 0.50;
      break;
    case 'taller_buildings':
      presetCd = Math.min(baseCd, 0.25);
      presetKms = 0.35;
      break;
    case 'urban_canyon':
      presetCd = Math.min(baseCd, 0.15);
      presetKms = 0.20;
      break;
    case 'adjacent_tower':
      presetCd = Math.min(baseCd, 0.10);
      presetKms = 0.25;
      break;
    case 'custom':
    default:
      presetCd = baseCd;
      presetKms = 0.70;
      break;
  }

  // Detailní výpočet ze seznamu konkrétních okolních staveb
  let maxAngleDeg = 0;
  let dominantObj: { name: string; height: number; distance: number; angleDeg: number; material: string } | undefined;
  let materialDamping = 1.0;

  if (data.structures && data.structures.length > 0) {
    let bestShieldScore = 0;

    data.structures.forEach((st) => {
      const deltaH = Math.max(0, st.height - H);
      const dist = Math.max(1, st.distance);
      const angle = Math.round(Math.atan2(deltaH, dist) * (180 / Math.PI) * 10) / 10;

      if (angle > maxAngleDeg) {
        maxAngleDeg = angle;
      }

      const score = st.height / dist;
      if (score > bestShieldScore) {
        bestShieldScore = score;
        dominantObj = {
          name: st.name || `Stavba ${st.direction}`,
          height: st.height,
          distance: st.distance,
          angleDeg: angle,
          material: st.material
        };
      }

      // Vliv materiálu na útlum vlnového pole
      let mFactor = 0.85;
      if (st.material === 'reinforced_concrete') mFactor = 0.35;
      else if (st.material === 'steel_frame') mFactor = 0.25;
      else if (st.material === 'masonry') mFactor = 0.65;
      else if (st.material === 'trees_vegetation') mFactor = 0.85;

      materialDamping = Math.min(materialDamping, mFactor);
    });
  }

  // Výpočet stínícího poměru (0 % až 88 %)
  let shieldingRatio = 0;
  if (data.environmentPreset !== 'custom') {
    shieldingRatio = Math.max(0, Math.min(0.9, 1 - (presetCd / Math.max(0.1, baseCd))));
  } else if (maxAngleDeg > 0) {
    shieldingRatio = Math.min(0.88, Math.max(0.1, (maxAngleDeg / 75) * 0.85));
  } else {
    shieldingRatio = 0.2;
  }

  const shieldingRatioPct = Math.round(shieldingRatio * 100);

  // Efektivní Cd
  let effectiveCd = data.environmentPreset === 'custom'
    ? Math.max(0.10, Math.round(baseCd * (1 - shieldingRatio) * 100) / 100)
    : presetCd;

  // Koeficient útlumu vlnového pole K_MS (0.10 až 1.0)
  let kms = data.manualKms !== undefined && data.manualKms > 0
    ? data.manualKms
    : data.environmentPreset === 'custom'
      ? Math.max(0.15, Math.min(1.0, Math.round(materialDamping * (1 - shieldingRatio * 0.3) * 100) / 100))
      : presetKms;

  kms = Math.max(0.10, Math.min(1.0, Math.round(kms * 100) / 100));

  // Útlum vlnového pole v dB: A_dB = -20 * log10(K_MS)
  const waveFieldAttenuation_dB = Math.max(0, Math.round((-20 * Math.log10(kms)) * 10) / 10);

  // Záchyt blesku okolím a snížení Nd
  const strikeInterceptionProbPct = Math.min(90, Math.round(shieldingRatio * 95));
  const directStrikeReductionPct = Math.max(0, Math.min(90, Math.round(((baseCd - effectiveCd) / Math.max(0.01, baseCd)) * 100)));

  const shieldedNd = Ng * baseAd * effectiveCd * 1e-6;

  let verdict = '';
  const technicalNotes: string[] = [];

  if (directStrikeReductionPct >= 50) {
    verdict = `VÝRAZNÉ STÍNĚNÍ OKOLÍM: Okolní zástavba zachytí cca ${strikeInterceptionProbPct} % potenciálních výbojů. Pravděpodobnost přímého zásahu do stavby klesá o ${directStrikeReductionPct} % (Cd redukováno z ${baseCd} na ${effectiveCd}). Vlnové pole LEMP je tlumeno o ${waveFieldAttenuation_dB} dB (Kms = ${kms}).`;
  } else if (directStrikeReductionPct > 0) {
    verdict = `MÍRNÉ STÍNĚNÍ OKOLÍM: Okolní objekty snižují pravděpodobnost přímého zásahu do stavby o ${directStrikeReductionPct} % (Cd = ${effectiveCd} oproti výchozímu ${baseCd}). Elektromagnetické vlnové pole v okolí je tlumeno o ${waveFieldAttenuation_dB} dB (Kms = ${kms}).`;
  } else {
    verdict = `BEZ VÝZNAMNÉHO STÍNĚNÍ: Objekt je z hlediska záchytu blesků exponován jako volně stojící (Cd = ${baseCd}, Kms = 1.0).`;
  }

  technicalNotes.push(`Snížení četnosti přímých úderů Nd z ${baseNd.toExponential(2)} na ${shieldedNd.toExponential(2)} úderů/rok.`);
  technicalNotes.push(`Útlum elektromagnetického vlnového pole KMS = ${kms} (-${waveFieldAttenuation_dB} dB) přímo redukuje indukované napětí na vnitřních rozvodech a složku rizika RM (ČSN EN 62305-4).`);
  if (dominantObj) {
    technicalNotes.push(`Dominantní stínící objekt: ${dominantObj.name} (výška ${dominantObj.height} m, odstup ${dominantObj.distance} m, stínící úhel ${dominantObj.angleDeg}°).`);
  }

  return {
    hasShielding: true,
    environmentPreset: data.environmentPreset,
    baseCd,
    effectiveCd,
    shieldingRatioPct,
    maxShieldingAngleDeg: maxAngleDeg,
    dominantObject: dominantObj,
    waveFieldAttenuationFactor_Kms: kms,
    waveFieldAttenuation_dB,
    strikeInterceptionProbPct,
    directStrikeReductionPct,
    baseNd,
    shieldedNd,
    verdict,
    technicalNotes
  };
}

/**
 * Podrobné posouzení parametrů svodičů bleskových proudů a přepětí (SPD)
 * dle ČSN EN 62305-4 ed. 2 a ČSN CLC/TS 51643-32
 */
export function evaluateSpdProtection(project: LpsProjectState): SpdEvaluation {
  const { measures } = project;
  const spd = measures.spdConfig;
  const lps = measures.lpsClass;

  // Požadovaný impulsní bleskový proud Iimp dle třídy LPS (LPL) ČSN EN 62305-1 tab. 3 a 4
  let requiredIimp = 12.5; // [kA] pro LPS III a IV
  if (lps === 'I') requiredIimp = 25.0;
  else if (lps === 'II') requiredIimp = 18.75;
  else if (lps === 'none') requiredIimp = 5.0;

  // Základní hodnota PSPD dle vybrané úrovně LPL (Tabulka B.3)
  let nominalPspd = 1.0;
  if (measures.spdLevel === 'LPL_I') nominalPspd = 0.005;
  else if (measures.spdLevel === 'LPL_II') nominalPspd = 0.01;
  else if (measures.spdLevel === 'LPL_III') nominalPspd = 0.02;
  else if (measures.spdLevel === 'LPL_IV') nominalPspd = 0.05;

  let effectivePspd = nominalPspd;
  let isCoordinated = measures.spdLevel !== 'none';
  let iimpAdequate = true;
  let protectionLevelAdequate = true;
  const recommendations: string[] = [];
  const lpzBoundaries: string[] = [];

  if (spd) {
    if (spd.customPspd !== undefined && spd.customPspd > 0) {
      effectivePspd = spd.customPspd;
    } else {
      // 1. Zkouška typu svodiče a bleskového proudu Iimp
      if (lps !== 'none') {
        if (spd.spdClassType === 'type_2' || spd.spdClassType === 'type_3') {
          iimpAdequate = false;
          effectivePspd = Math.min(0.5, nominalPspd * 6.0);
          recommendations.push(
            `Objekt má vnější LPS třídy ${lps}, na vstupu budovy (rozhraní LPZ 0A/1) je proto povinný svodič bleskových proudů Typ 1 nebo kombinovaný Typ 1+2 schopný svést proud s vlnou 10/350 µs!`
          );
        } else if (spd.iimp_kA < requiredIimp) {
          iimpAdequate = false;
          effectivePspd = Math.min(0.2, nominalPspd * (requiredIimp / Math.max(1, spd.iimp_kA)));
          recommendations.push(
            `Instalovaný bleskový proud Iimp = ${spd.iimp_kA} kA je nižší než normový požadavek pro LPS ${lps} (${requiredIimp} kA na pól dle ČSN EN 62305-1 tab. 3).`
          );
        }
      }

      // 2. Ochranná napěťová hladina Up
      if (spd.up_kV > 1.5) {
        protectionLevelAdequate = false;
        effectivePspd = Math.min(0.2, effectivePspd * 1.4);
        recommendations.push(
          `Ochranná hladina Up = ${spd.up_kV} kV překračuje doporučenou mez 1,5 kV pro koncová zařízení kategorie přepětí II dle ČSN EN 60664-1.`
        );
      } else if (spd.up_kV <= 1.0) {
        effectivePspd = Math.max(0.001, effectivePspd * 0.8);
      }

      // 3. Technologie - jiskřiště vs. varistory
      if (spd.technology === 'spark_gap') {
        effectivePspd = Math.max(0.001, effectivePspd * 0.85);
      }

      // 4. Koordinovaná kaskáda
      if (spd.isCoordinatedCascade) {
        effectivePspd = Math.max(0.001, effectivePspd * 0.5);
        lpzBoundaries.push('LPZ 0A → LPZ 1 (Hlavní rozváděč RH: Typ 1+2)');
        lpzBoundaries.push('LPZ 1 → LPZ 2 (Podružné rozváděče: Typ 2)');
        lpzBoundaries.push('LPZ 2 → LPZ 3 (Zásuvková hnízda a IT: Typ 3)');
      } else {
        lpzBoundaries.push('LPZ 0A → LPZ 1 (Vstupní rozváděč RH)');
      }

      // 5. Telekomunikace
      if (spd.telecomSpdInstalled) {
        lpzBoundaries.push('LPZ 0B → LPZ 1 (Datové a telekomunikační vstupy D1/C2)');
      }
    }
  } else {
    // Výchozí stav dle spdLevel
    if (measures.spdLevel !== 'none') {
      lpzBoundaries.push('LPZ 0A → LPZ 1 (Vstupní koordinované SPD)');
    }
  }

  effectivePspd = Math.round(effectivePspd * 10000) / 10000;
  const riskReductionRatioPct = Math.round((1 - effectivePspd) * 1000) / 10;

  isCoordinated = measures.spdLevel !== 'none' && iimpAdequate && protectionLevelAdequate;

  let verdict = '';
  if (measures.spdLevel === 'none') {
    verdict = 'Objekt je bez koordinované ochrany před přepětím (PSPD = 1,0). Vnitřní elektrické a IT systémy jsou vysoce zranitelné.';
    recommendations.push('Navrhněte osazení kombinovaného svodiče bleskových proudů a přepětí Typ 1+2 na vstupu do objektu.');
  } else if (isCoordinated) {
    verdict = `SPD soustava je plně koordinovaná dle ČSN EN 62305-4 (PSPD = ${effectivePspd}, redukce rizik přepětí o ${riskReductionRatioPct} %). Vnitřní systémy v LPZ 1 a LPZ 2 jsou spolehlivě chráněny.`;
  } else {
    verdict = `SPD soustava vykazuje dílčí neshody s normou ČSN EN 62305-4 (PSPD = ${effectivePspd}). Je nutné zkontrolovat parametry Iimp a koordinaci.`;
  }

  return {
    isCoordinated,
    effectivePspd,
    nominalPspd,
    riskReductionRatioPct,
    requiredIimp_kA: requiredIimp,
    iimpAdequate,
    protectionLevelAdequate,
    energyCoordinationVerdict: verdict,
    lpzBoundariesProtected: lpzBoundaries,
    recommendations
  };
}

/**
 * Výpočet zón budovy pro interaktivní prvek Risk Heatmap
 * Rozděluje stavbu na 6 technických zón dle ČSN EN 62305-2 čl. 6
 */
export function calculateBuildingHeatmapZones(
  project: LpsProjectState,
  results: {
    R1: number;
    RT1: number;
    componentsInitial: ComponentRisks;
    componentsWithMeasures: ComponentRisks;
    pvEvaluation?: PvLpsEvaluation;
    spdEvaluation?: SpdEvaluation;
    surroundingShielding?: SurroundingShieldingEvaluation;
  }
): HeatmapZoneInfo[] {
  const { building, measures, isolatedLps } = project;
  const cInit = results.componentsInitial;
  const cCurr = results.componentsWithMeasures;
  const RT = results.RT1;

  const getStatus = (ratioPct: number): 'safe' | 'moderate' | 'elevated' | 'critical' => {
    if (ratioPct <= 25) return 'safe';
    if (ratioPct <= 60) return 'moderate';
    if (ratioPct <= 95) return 'elevated';
    return 'critical';
  };

  const getColor = (status: 'safe' | 'moderate' | 'elevated' | 'critical'): string => {
    switch (status) {
      case 'safe': return '#10b981';      // Emerald green
      case 'moderate': return '#eab308';  // Amber yellow
      case 'elevated': return '#f97316';  // Warm orange
      case 'critical': return '#f43f5e';  // Rose red
    }
  };

  // 1. ZÓNA 1: Střecha a nástavby
  const roofInitPct = Math.round(((cInit.RA * 1.2 + cInit.RB * 1.5 + cInit.RC) / RT) * 100);
  let roofMitPct = Math.round(((cCurr.RA * 1.2 + cCurr.RB * 1.5 + cCurr.RC) / RT) * 100);
  if (results.pvEvaluation?.hasPv && !results.pvEvaluation.isSeparationMaintained) {
    roofMitPct = Math.max(roofMitPct, 78); // Penalizace za nedodrženou oddělovací vzdálenost
  }
  const roofStatus = getStatus(roofMitPct);
  const roofInitStatus = getStatus(roofInitPct);

  const roofVulns: string[] = [];
  if (measures.lpsClass === 'none') roofVulns.push('Chybí vnější jímací soustava na střeše');
  if (results.pvEvaluation?.hasPv && !results.pvEvaluation.isSeparationMaintained) {
    roofVulns.push('Porušena oddělovací vzdálenost s (d < s) u FVE panelů - nebezpečí přeskoku');
  }
  if (!isolatedLps.enabled && results.pvEvaluation?.hasPv) {
    roofVulns.push('Chybí oddálený svod HVI pro technologické nástavby');
  }

  const roofProts: string[] = [];
  if (measures.lpsClass !== 'none') roofProts.push(`Mřížová soustava LPS ${measures.lpsClass}`);
  if (isolatedLps.enabled) roofProts.push(`Oddálený systém HVI (${isolatedLps.protectedEquipment})`);
  if (results.pvEvaluation?.isSeparationMaintained) roofProts.push('Oddělovací vzdálenost d ≥ s dodržena');

  // 2. ZÓNA 2: Fasáda a svody
  const facadeInitPct = Math.round(((cInit.RA * 1.4 + cInit.RU * 0.8) / RT) * 100);
  const facadeMitPct = Math.round(((cCurr.RA * 1.4 + cCurr.RU * 0.8) / RT) * 100);
  const facadeStatus = getStatus(facadeMitPct);
  const facadeInitStatus = getStatus(facadeInitPct);

  const facadeVulns: string[] = [];
  if (!measures.warningNotices && !isolatedLps.enabled) {
    facadeVulns.push('Volně přístupné neizolované svody v dosahu osob (riziko dotykového napětí)');
  }
  const facadeProts: string[] = [];
  if (measures.warningNotices) facadeProts.push('Výstražné tabulky a mechanické chráničky svodů');
  if (isolatedLps.enabled) facadeProts.push('Izolované svody HVI s nulovým vnějším polem');

  // 3. ZÓNA 3: Hlavní rozváděč RH
  const swbInitPct = Math.round(((cInit.RV * 1.8 + cInit.RW * 1.5 + cInit.RU * 0.9) / RT) * 100);
  const swbMitPct = Math.round(((cCurr.RV * 1.8 + cCurr.RW * 1.5 + cCurr.RU * 0.9) / RT) * 100);
  const swbStatus = getStatus(swbMitPct);
  const swbInitStatus = getStatus(swbInitPct);

  const swbVulns: string[] = [];
  if (measures.spdLevel === 'none') {
    swbVulns.push('Chybí svodič bleskových proudů Typ 1 na vstupu do objektu');
    swbVulns.push('Přímé riziko proražení izolace rozvodů NN vlnou 10/350 µs');
  }
  const swbProts: string[] = [];
  if (measures.spdLevel !== 'none') swbProts.push(`Koordinované SPD ${measures.spdLevel}`);
  if (measures.potentialEqualization) swbProts.push('Hlavní ekvipotenciální přípojnice MET');

  // 4. ZÓNA 4: IT a řídicí systémy
  const itInitPct = Math.round(((cInit.RC * 2.0 + cInit.RM * 1.8 + cInit.RZ * 1.2) / RT) * 100);
  const itMitPct = Math.round(((cCurr.RC * 2.0 + cCurr.RM * 1.8 + cCurr.RZ * 1.2) / RT) * 100);
  const itStatus = getStatus(itMitPct);
  const itInitStatus = getStatus(itInitPct);

  const itVulns: string[] = [];
  if (!measures.shieldingMesh && measures.spdLevel === 'none') {
    itVulns.push('Nechráněná indukční smyčka LEMP v datové kabeláži');
    itVulns.push('Citlivé polovodičové řídicí obvody bez jemné ochrany Typ 3');
  }
  const itProts: string[] = [];
  if (measures.shieldingMesh) itProts.push('Prostorové magnetické stínění armováním');
  if (results.spdEvaluation?.isCoordinated) itProts.push('Jemná vícestupňová koordinace SPD');
  if (results.surroundingShielding?.hasShielding) {
    itProts.push(`Útlum vnějšího pole okolím (-${results.surroundingShielding.waveFieldAttenuation_dB} dB)`);
  }

  // 5. ZÓNA 5: Pobytové místnosti
  const roomsInitPct = Math.round(((cInit.RB * 1.1 + cInit.RA * 0.6) / RT) * 100);
  const roomsMitPct = Math.round(((cCurr.RB * 1.1 + cCurr.RA * 0.6) / RT) * 100);
  const roomsStatus = getStatus(roomsMitPct);
  const roomsInitStatus = getStatus(roomsInitPct);

  const roomsVulns: string[] = [];
  if (project.zone.panicRisk === 'high') roomsVulns.push('Vysoké riziko paniky při bouřce a výpadku světel');
  if (project.zone.fireRisk === 'high') roomsVulns.push('Zvýšené požární zatížení hořlavými materiály');
  const roomsProts: string[] = [];
  if (project.zone.fireProtection !== 'none') roomsProts.push(`Požární ochrana: ${project.zone.fireProtection}`);

  // 6. ZÓNA 6: Základy a zemnič
  const earthInitPct = Math.round(((cInit.RA * 0.7 + cInit.RU * 1.1) / RT) * 100);
  const earthMitPct = Math.round(((cCurr.RA * 0.7 + cCurr.RU * 1.1) / RT) * 100);
  const earthStatus = getStatus(earthMitPct);
  const earthInitStatus = getStatus(earthInitPct);

  const earthVulns: string[] = [];
  const soilRho = building.soilResistivity || 200;
  if (soilRho > 400) {
    earthVulns.push(`Vysoká rezistivita půdy (ρ = ${soilRho} Ω·m)`);
  }
  const earthProts: string[] = [
    `Obvodový zemnič FeZn délky ${building.earthingLength || 2 * (building.length + building.width)} m`,
    'Základové vyrovnání potenciálů'
  ];

  return [
    {
      id: 'zone_roof',
      name: 'Střecha & technologické nástavby (FVE, VZT, antény)',
      zoneCode: 'Z1-ROOF',
      areaDescription: 'Střešní plášť, atika, hřeben, fotovoltaická pole a vzduchotechnické jednotky',
      lpzBoundary: 'LPZ 0A / LPZ 0B',
      floorLevel: `+${building.height} m (Střecha)`,
      dominantRiskComponents: ['RA (přímý úder)', 'RB (požár krytiny)', 'RC (LEMP střešní kabeláž)'],
      unmitigatedRiskPct: Math.max(15, roofInitPct),
      mitigatedRiskPct: Math.max(2, roofMitPct),
      status: roofStatus,
      unmitigatedStatus: roofInitStatus,
      color: getColor(roofStatus),
      unmitigatedColor: getColor(roofInitStatus),
      vulnerabilities: roofVulns.length > 0 ? roofVulns : ['Žádné kritické slabiny'],
      appliedProtections: roofProts.length > 0 ? roofProts : ['Bez ochranných prvků'],
      recommendedMeasures: [
        'Udržovat oddělovací vzdálenost s mezi jímači a kovovými konstrukcemi',
        'Provádět pravidelné revize spojů jímací sítě dle ČSN EN 62305-3'
      ]
    },
    {
      id: 'zone_facade',
      name: 'Fasáda, vnější svody & okolí vstupů',
      zoneCode: 'Z2-FACADE',
      areaDescription: 'Obvodové stěny, vnější svodová vedení a pásmo ohrožení dotykovým napětím',
      lpzBoundary: 'LPZ 0B vnější',
      floorLevel: `0.0 až +${building.height} m`,
      dominantRiskComponents: ['RA (dotykové napětí)', 'RU (krokové napětí)'],
      unmitigatedRiskPct: Math.max(10, facadeInitPct),
      mitigatedRiskPct: Math.max(2, facadeMitPct),
      status: facadeStatus,
      unmitigatedStatus: facadeInitStatus,
      color: getColor(facadeStatus),
      unmitigatedColor: getColor(facadeInitStatus),
      vulnerabilities: facadeVulns.length > 0 ? facadeVulns : ['Žádné kritické slabiny'],
      appliedProtections: facadeProts.length > 0 ? facadeProts : ['Standardní svodový drát'],
      recommendedMeasures: [
        'V místech pohybu osob instalovat výstražné tabulky a mechanické chráničky',
        'U vstupních dveří zajistit asfaltovou nebo štěrkovou úpravu s vysokou rezistivitou'
      ]
    },
    {
      id: 'zone_main_switchboard',
      name: 'Hlavní rozváděč NN & vstup inženýrských sítí',
      zoneCode: 'Z3-MAIN-SWB',
      areaDescription: 'Hlavní elektrorozvodna RH, přípojková skříň, vstup kabelů NN a telekomunikací',
      lpzBoundary: 'LPZ 0A → LPZ 1',
      floorLevel: '1.NP / Technický suterén',
      dominantRiskComponents: ['RV (požár rozváděče)', 'RW (přepětí po síti)', 'RU (dotyk vedení)'],
      unmitigatedRiskPct: Math.max(20, swbInitPct),
      mitigatedRiskPct: Math.max(3, swbMitPct),
      status: swbStatus,
      unmitigatedStatus: swbInitStatus,
      color: getColor(swbStatus),
      unmitigatedColor: getColor(swbInitStatus),
      vulnerabilities: swbVulns.length > 0 ? swbVulns : ['Vstup spolehlivě ošetřen'],
      appliedProtections: swbProts.length > 0 ? swbProts : ['Bez ochranných prvků'],
      recommendedMeasures: [
        'Osadit kombinovaný svodič Typ 1+2 (Iimp ≥ 12,5 kA / 25 kA) v bezprostřední blízkosti vstupu kabelu',
        'Propojit hlavní ochrannou svorkovnici PE s přípojnicí MET vodičem Cu min. 16 mm²'
      ]
    },
    {
      id: 'zone_it_server',
      name: 'IT serverovna, řídicí systémy & MaR',
      zoneCode: 'Z4-IT-ROOM',
      areaDescription: 'Datové rozváděče, servery, EPS ústředna, MaR a citlivá elektronika',
      lpzBoundary: 'LPZ 1 → LPZ 2 / LPZ 3',
      floorLevel: '2.NP / IT centrum',
      dominantRiskComponents: ['RC (LEMP indukce)', 'RM (magnetické pole)', 'RZ (datové linky)'],
      unmitigatedRiskPct: Math.max(15, itInitPct),
      mitigatedRiskPct: Math.max(2, itMitPct),
      status: itStatus,
      unmitigatedStatus: itInitStatus,
      color: getColor(itStatus),
      unmitigatedColor: getColor(itInitStatus),
      vulnerabilities: itVulns.length > 0 ? itVulns : ['Citlivá elektronika zabezpečena'],
      appliedProtections: itProts.length > 0 ? itProts : ['Základní jištění'],
      recommendedMeasures: [
        'Aplikovat jemné svodiče přepětí Typ 3 (Up ≤ 1,0 kV) u napájení serverů a switchů',
        'Uložit datové rozvody do uzavřených plechových stínicích žlabů'
      ]
    },
    {
      id: 'zone_occupied_rooms',
      name: 'Pobytové místnosti, kanceláře & shromažďovací prostory',
      zoneCode: 'Z5-OFFICES',
      areaDescription: 'Kanceláře, zasedací místnosti, chodby a evakuační cesty',
      lpzBoundary: 'LPZ 1 vnitřní',
      floorLevel: `1.NP až ${Math.max(1, Math.round(building.height / 3.5))}.NP`,
      dominantRiskComponents: ['RB (požár a kouř)', 'RA (panika osob)', 'RV (sekundární požár)'],
      unmitigatedRiskPct: Math.max(10, roomsInitPct),
      mitigatedRiskPct: Math.max(2, roomsMitPct),
      status: roomsStatus,
      unmitigatedStatus: roomsInitStatus,
      color: getColor(roomsStatus),
      unmitigatedColor: getColor(roomsInitStatus),
      vulnerabilities: roomsVulns.length > 0 ? roomsVulns : ['Minimální zbytková rizika'],
      appliedProtections: roomsProts.length > 0 ? roomsProts : ['Standardní stavební provedení'],
      recommendedMeasures: [
        'Udržovat volné únikové cesty a funkční nouzové osvětlení',
        'Pravidelně kontrolovat hasicí přístroje a hlásiče kouře'
      ]
    },
    {
      id: 'zone_foundation_earth',
      name: 'Základy, obvodový zemnič & vyrovnání potenciálů',
      zoneCode: 'Z6-EARTHING',
      areaDescription: 'Základová spára, FeZn obvodový zemnič typu B a přípojnice pospojování',
      lpzBoundary: 'Podzemní LPZ 0A / uzemnění',
      floorLevel: '-1.2 m (Základy)',
      dominantRiskComponents: ['RA (krokové napětí)', 'RU (potenciál zemniče)'],
      unmitigatedRiskPct: Math.max(10, earthInitPct),
      mitigatedRiskPct: Math.max(2, earthMitPct),
      status: earthStatus,
      unmitigatedStatus: earthInitStatus,
      color: getColor(earthStatus),
      unmitigatedColor: getColor(earthInitStatus),
      vulnerabilities: earthVulns.length > 0 ? earthVulns : ['Zemnič vyhovuje požadavkům'],
      appliedProtections: earthProts,
      recommendedMeasures: [
        'Dodržet normový zemní odpor R ≤ 10 Ω pro frekvenci blesku',
        'Při vysoké rezistivitě půdy doplnit svislé tyčové stroje FeZn / Cu'
      ]
    }
  ];
}

/**
 * Hlavní kalkulátor pro projekt
 */
export function calculateLpsProject(project: LpsProjectState): CalculationResults {
  const { building, lines, measures, isolatedLps } = project;

  const L = building.length;
  const W = building.width;
  const H = building.height;
  const Cd = getCd(building.locationFactor);
  const Ng = building.groundFlashDensity;

  // Vyhodnocení vlivu FVE instalace
  const pvEvaluation = calculatePvEvaluation(building, measures.lpsClass, building.pvInstallation);

  // Vyhodnocení stínění okolními stavbami a vlnového pole
  const surroundingShielding = calculateSurroundingShielding(building);
  const activeCd = surroundingShielding.hasShielding ? surroundingShielding.effectiveCd : Cd;
  const activeKms = surroundingShielding.hasShielding ? surroundingShielding.waveFieldAttenuationFactor_Kms : 1.0;

  // 1. Sběrná plocha stavby Ad [m^2] dle ČSN EN 62305-2 čl. A.2
  // Pokud je FVE vyvýšená nad střechu, zohlední se efektivní výška stavby
  const effectiveH = (pvEvaluation.hasPv && pvEvaluation.effectiveHeight_m > H)
    ? pvEvaluation.effectiveHeight_m
    : H;
  const Ad = (L * W) + (6 * effectiveH * (L + W)) + (Math.PI * Math.pow(3 * effectiveH, 2));

  // 2. Sběrná plocha okolí stavby Am [m^2] dle čl. A.3
  // Am = 2 * 500 * (L+W) + PI * 500^2
  const Am = (1000 * (L + W)) + (Math.PI * Math.pow(500, 2));

  // 3. Sběrná plocha silového vedení Al, Ai [m^2] dle čl. A.4
  // Al = 40 * Lc pro nadzemní vedení, 0 pro podzemní stíněné
  const powerLineLength = lines.powerLineLength;
  const Al_power = lines.powerLineType === 'overhead' ? (40 * powerLineLength) : (10 * powerLineLength);
  const Ai_power = 1000 * powerLineLength;

  // 4. Sběrná plocha telekomunikačního vedení
  const telecomLength = lines.telecomLineType === 'none' ? 0 : lines.telecomLineLength;
  const Al_telecom = lines.telecomLineType === 'overhead' ? (40 * telecomLength) : (10 * telecomLength);
  const Ai_telecom = 1000 * telecomLength;

  // Frekvence úderů (zahrnuje efektivní Cd po započtení stínění okolními stavbami)
  const Nd = Ng * Ad * activeCd * 1e-6;
  const Nm = Ng * Am * 1e-6;
  const Ce_power = lines.powerLineType === 'underground' ? 0.5 : 1.0;
  const Nl = (Ng * Al_power * Ce_power * 1e-6) + (lines.telecomLineType === 'none' ? 0 : (Ng * Al_telecom * 0.5 * 1e-6));
  const Ni = (Ng * Ai_power * Ce_power * 1e-6) + (lines.telecomLineType === 'none' ? 0 : (Ng * Ai_telecom * 0.5 * 1e-6));

  // Výpočet stavu bez opatření (LPS: none, SPD: none) se zohledněním stínění
  const initial = calculateComponents(
    project,
    'none',
    'none',
    Ad,
    Am,
    Al_power,
    Ai_power,
    Al_telecom,
    Ai_telecom,
    activeCd,
    activeKms
  );

  // Výpočet stavu se zvolenými opatřeními
  const withMeasures = calculateComponents(
    project,
    measures.lpsClass,
    measures.spdLevel,
    Ad,
    Am,
    Al_power,
    Ai_power,
    Al_telecom,
    Ai_telecom,
    activeCd,
    activeKms
  );

  // Doporučená optimální třída LPS
  const classesToTest: LpsClass[] = ['none', 'IV', 'III', 'II', 'I'];
  let recommendedLpsClass: LpsClass = 'I';

  for (const testClass of classesToTest) {
    const testCalc = calculateComponents(
      project,
      testClass,
      measures.spdLevel === 'none' && testClass !== 'none' ? 'LPL_IV' : measures.spdLevel,
      Ad,
      Am,
      Al_power,
      Ai_power,
      Al_telecom,
      Ai_telecom,
      activeCd,
      activeKms
    );
    if (testCalc.R1 <= RT1_LIMIT && (!project.zone.culturalHeritageValue || testCalc.R3 <= RT3_LIMIT)) {
      recommendedLpsClass = testClass;
      break;
    }
  }

  // ==========================================
  // Výpočet dostatečné separační vzdálenosti s dle ČSN EN 62305-3 čl. 6.3
  // Vzorec: s = ki * (kc / km) * l
  // ==========================================
  const ki = getKi(measures.lpsClass);
  const kc = getKc(isolatedLps.numberOfDownConductors, isolatedLps.customKc);
  const km = isolatedLps.insulationMaterial === 'solid' ? 0.5 : 1.0;
  const l = Math.max(0.5, isolatedLps.conductorLength);

  const separationDistance_s_meters = ki * (kc / km) * l;
  const separationDistance_s_cm = Math.round(separationDistance_s_meters * 100 * 10) / 10; // na 1 desetinné místo

  const hvi_equivalent_distance_cm = getHviEquivalentDistanceCm(
    isolatedLps.hviType,
    isolatedLps.insulationMaterial
  );

  const isIsolatedLpsSafe = separationDistance_s_cm <= hvi_equivalent_distance_cm;
  let isolatedLpsVerdict = '';
  if (!isolatedLps.enabled) {
    isolatedLpsVerdict = 'Izolovaný hromosvod není v projektu aktivován.';
  } else if (isIsolatedLpsSafe) {
    isolatedLpsVerdict = `VYHOVUJE. Vypočtená dostatečná vzdálenost s = ${separationDistance_s_cm} cm je menší nebo rovna ekvivalentní bezpečné vzdálenosti navrženého vodiče ${isolatedLps.hviType} (${hvi_equivalent_distance_cm} cm). Nebezpečí elektrického přeskoku na ${isolatedLps.protectedEquipment} je vyloučeno.`;
  } else {
    isolatedLpsVerdict = `NEVYHOVUJE! Vypočtená vzdálenost s = ${separationDistance_s_cm} cm překračuje mez navrženého řešení (${hvi_equivalent_distance_cm} cm). Je nutné zvýšit počet paralelních svodů (snížit kc), zkrátit délku svodu 'l', nebo použít vodič s vyšší izolací (např. DEHN HVI power s limitem 90 cm ve vzduchu / 180 cm v pevném dielektriku).`;
  }

  // Pravdivostní vyhodnocení rizik
  const isR1Safe = withMeasures.R1 <= RT1_LIMIT;
  const isR2Safe = withMeasures.R2 <= RT2_LIMIT;
  const isR3Safe = withMeasures.R3 <= RT3_LIMIT;
  const isR4Safe = withMeasures.R4 <= RT4_LIMIT;

  // Odhad pravděpodobností pro souhrnnou tabulku
  let PB_curr = 1.0;
  let PTA_curr = 1.0;
  if (measures.lpsClass === 'I') { PB_curr = 0.02; PTA_curr = 0.01; }
  else if (measures.lpsClass === 'II') { PB_curr = 0.05; PTA_curr = 0.02; }
  else if (measures.lpsClass === 'III') { PB_curr = 0.1; PTA_curr = 0.05; }
  else if (measures.lpsClass === 'IV') { PB_curr = 0.2; PTA_curr = 0.05; }

  let PSPD_curr = 1.0;
  if (measures.spdLevel === 'LPL_I') PSPD_curr = 0.005;
  else if (measures.spdLevel === 'LPL_II') PSPD_curr = 0.01;
  else if (measures.spdLevel === 'LPL_III') PSPD_curr = 0.02;
  else if (measures.spdLevel === 'LPL_IV') PSPD_curr = 0.05;

  // Metoda valící se koule a ochranného úhlu dle ČSN EN 62305-3
  let rollingSphereRadius = 60; // LPS IV / none
  if (measures.lpsClass === 'I') rollingSphereRadius = 20;
  else if (measures.lpsClass === 'II') rollingSphereRadius = 30;
  else if (measures.lpsClass === 'III') rollingSphereRadius = 45;

  const twoRodsDistance = isolatedLps.twoRodsDistance || 6.0; // [m]
  const halfDist = twoRodsDistance / 2;
  const sagDistance_m = halfDist < rollingSphereRadius
    ? Math.round((rollingSphereRadius - Math.sqrt(rollingSphereRadius * rollingSphereRadius - halfDist * halfDist)) * 1000) / 1000
    : rollingSphereRadius;

  const rodH = isolatedLps.rodHeight || 2.0;
  const protectedHeight_m = Math.max(0, Math.round((rodH - sagDistance_m) * 100) / 100);
  const isRollingSphereSafe = protectedHeight_m > 0.5; // chráněný prostor nad technologií alespoň 50 cm

  // Ochranný úhel alpha dle Tabulky 2 ČSN EN 62305-3
  let protectiveAngle_deg = 55;
  if (measures.lpsClass === 'I') {
    protectiveAngle_deg = rodH <= 2 ? 70 : rodH <= 10 ? 45 : 30;
  } else if (measures.lpsClass === 'II') {
    protectiveAngle_deg = rodH <= 2 ? 72 : rodH <= 10 ? 55 : 40;
  } else if (measures.lpsClass === 'III') {
    protectiveAngle_deg = rodH <= 2 ? 76 : rodH <= 10 ? 62 : 50;
  } else {
    protectiveAngle_deg = rodH <= 2 ? 79 : rodH <= 10 ? 68 : 55;
  }

  // Dimenzování uzemňovací soustavy dle měrného odporu půdy rho (ČSN EN 62305-3 čl. 5.4 a obr. 3)
  const rho = building.soilResistivity || 200; // [Ohm.m]
  let minEarthingLength_l1_m = 5.0; // minimální délka pro LPS III a IV je vždy 5 m
  if (measures.lpsClass === 'I') {
    if (rho <= 500) minEarthingLength_l1_m = Math.max(5.0, rho / 50);
    else minEarthingLength_l1_m = Math.min(80.0, 5.0 + (rho - 500) * 0.05);
  } else if (measures.lpsClass === 'II') {
    if (rho <= 500) minEarthingLength_l1_m = Math.max(5.0, rho / 75);
    else minEarthingLength_l1_m = Math.min(60.0, 5.0 + (rho - 500) * 0.035);
  }
  minEarthingLength_l1_m = Math.round(minEarthingLength_l1_m * 10) / 10;

  const actualEarthingLength_m = building.earthingLength || 2 * (L + W);
  const isEarthingSafe = actualEarthingLength_m >= minEarthingLength_l1_m;

  // Odhad zemního odporu pro obvodový zemnič R approx = 2 * rho / L_e
  const estimatedEarthResistance_ohm = Math.round((2 * rho / Math.max(10, actualEarthingLength_m)) * 10) / 10;

  // Vyhodnocení svodičů bleskových proudů a přepětí (SPD) dle ČSN EN 62305-4
  const spdEvaluation = evaluateSpdProtection(project);

  // Výpočet zón budovy pro interaktivní prvek Risk Heatmap
  const heatmapZones = calculateBuildingHeatmapZones(project, {
    R1: withMeasures.R1,
    RT1: RT1_LIMIT,
    componentsInitial: initial.components,
    componentsWithMeasures: withMeasures.components,
    pvEvaluation,
    spdEvaluation,
    surroundingShielding
  });

  return {
    Ad: Math.round(Ad * 10) / 10,
    Am: Math.round(Am * 10) / 10,
    Al_power: Math.round(Al_power * 10) / 10,
    Ai_power: Math.round(Ai_power * 10) / 10,
    Al_telecom: Math.round(Al_telecom * 10) / 10,
    Ai_telecom: Math.round(Ai_telecom * 10) / 10,

    Nd,
    Nm,
    Nl,
    Ni,

    PA: PTA_curr,
    PB: PB_curr,
    PC: PB_curr * PSPD_curr,
    PM: PSPD_curr,
    PU: PTA_curr,
    PV: PB_curr,
    PW: PSPD_curr,
    PZ: PSPD_curr,

    componentsInitial: initial.components,
    componentsWithMeasures: withMeasures.components,

    R1: withMeasures.R1,
    R2: withMeasures.R2,
    R3: withMeasures.R3,
    R4: withMeasures.R4,

    RT1: RT1_LIMIT,
    RT2: RT2_LIMIT,
    RT3: RT3_LIMIT,
    RT4: RT4_LIMIT,

    isR1Safe,
    isR2Safe,
    isR3Safe,
    isR4Safe,

    recommendedLpsClass,

    separationDistance_s_meters,
    separationDistance_s_cm,
    ki_factor: ki,
    kc_factor: kc,
    km_factor: km,
    hvi_equivalent_distance_cm,
    isIsolatedLpsSafe,
    isolatedLpsVerdict,

    rollingSphereRadius,
    sagDistance_m,
    protectedHeight_m,
    protectiveAngle_deg,
    isRollingSphereSafe,

    minEarthingLength_l1_m,
    actualEarthingLength_m,
    isEarthingSafe,
    estimatedEarthResistance_ohm,

    pvEvaluation,
    surroundingShielding,

    spdEvaluation,
    heatmapZones
  };
}
