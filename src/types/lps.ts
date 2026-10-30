/**
 * Datové typy pro výpočet rizik ČSN EN 62305-2 a izolovaného hromosvodu ČSN EN 62305-3
 */

export type LpsClass = 'none' | 'IV' | 'III' | 'II' | 'I';
export type SpdLevel = 'none' | 'LPL_IV' | 'LPL_III' | 'LPL_II' | 'LPL_I';

export interface ProjectMeta {
  projectName: string;
  projectCode: string;
  buildingLocation: string;
  investor: string;
  designer: string;
  designerCert: string;
  date: string;
  standardVersion: string;
  notes: string;
  customLogoBase64?: string;
  customStampBase64?: string;
}

export type LocationFactorType = 'isolated' | 'surrounded_by_objects' | 'surrounded_by_trees' | 'on_hilltop';
export type SoilType = 'humus_peat' | 'clay' | 'loam' | 'sand_gravel' | 'rock';
export type EarthingSystemType = 'type_b_ring' | 'type_b_foundation' | 'type_a_rods';
export type PvMountingType = 'pitched_coplanar' | 'flat_elevated' | 'integrated_bipv' | 'facade';
export type PvDcRoutingType = 'metal_shielded_tray' | 'unshielded_exterior' | 'interior_shaft';
export type PvInverterLocation = 'exterior_roof' | 'attic_under_roof' | 'technical_room_ground' | 'cellar';

export type PvSystemType = 'roof_residential' | 'roof_commercial' | 'ground_mounted_freestanding' | 'ground_mounted_tracker' | 'bipv_facade';

export interface PvInstallationData {
  enabled: boolean;
  systemType?: PvSystemType;     // Typ instalace (rezidenční střecha, komerční, pozemní volně stojící...)
  powerKwp: number;              // Výkon FVE [kWp] např. 10 kWp
  panelCount: number;            // Počet panelů, např. 24
  panelAreaM2?: number;          // Celková plocha panelů [m²]
  mountingType: PvMountingType;
  elevationAngleDeg: number;     // Úhel sklonu panelů [°], např. 25°
  rackProtrusionHeight: number;  // Výška konstrukce nad atikou/střechou ΔH [m], např. 0.4 m
  dcCableRouting: PvDcRoutingType;
  dcCableLoopArea: 'minimized_tight' | 'large_loops'; // ČSN CLC/TS 51643-32
  inverterLocation: PvInverterLocation;
  shortestDistanceToLpsCm: number; // Skutečná/projektovaná vzdálenost d k hromosvodu [cm]
  conductorLengthL: number;      // Délka svodu l k referenčnímu bodu/uzemnění [m]
  downConductorCount: number;    // Počet svodů (pro kc: 1, 2, 4+)
  customKc?: number;
  dielectricMedium: 'air' | 'solid'; // km (vzduch = 1.0, zedivo/izolant = 0.5)

  // Pokročilé elektrotechnické DC parametry dle ČSN EN 62305-3 Příloha U & CLC/TS 50539-12
  stringVoltageUoc_V?: number;   // Napětí stringu naprázdno Uoc_STC [V] (např. 600 V, 800 V, 1000 V, 1500 V)
  stringCount?: number;          // Počet DC stringů připojených k MPPT
  stringIsc_A?: number;          // Zkratový proud stringu Isc_STC [A] (např. 13.5 A)
  dcCableLength_m?: number;      // Délka DC vedení od panelů ke střídači [m] (> 10 m vyžaduje duální SPD)
  hasDcSwitchNearInverter?: boolean; // DC odpínač v dosahu střídače
  pvSpdModelPreset?: string;     // Model doporučeného DC svodiče
}

export interface BuildingData {
  length: number; // L [m]
  width: number;  // W [m]
  height: number; // H [m]
  locationFactor: LocationFactorType; // Cd
  groundFlashDensity: number; // Ng [údery/km^2/rok]
  selectedRegion: string; // ČR kraj/oblast
  structureType: 'concrete_steel' | 'masonry' | 'wood' | 'flammable_roof';
  soilType?: SoilType;
  soilResistivity?: number; // [Ohm.m]
  earthingType?: EarthingSystemType;
  earthingSystemType?: EarthingSystemType; // alias pro earthingType
  earthingLength?: number; // [m]
  pvInstallation?: PvInstallationData;
  surroundingShielding?: SurroundingShieldingData;
}

export type SurroundingStructureMaterial = 'reinforced_concrete' | 'steel_frame' | 'masonry' | 'trees_vegetation';
export type CompassDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export interface SurroundingStructureItem {
  id: string;
  name: string;
  direction: CompassDirection;
  height: number;      // H_surr [m]
  distance: number;    // d_surr [m]
  material: SurroundingStructureMaterial;
}

export interface SurroundingShieldingData {
  enabled: boolean;
  environmentPreset: 'open_field' | 'suburban_houses' | 'urban_mixed' | 'taller_buildings' | 'urban_canyon' | 'adjacent_tower' | 'custom';
  structures: SurroundingStructureItem[];
  manualKms?: number;
}

export interface LineData {
  powerLineType: 'underground' | 'overhead';
  powerLineLength: number; // [m]
  powerLineShielding: 'none' | 'shielded' | 'conduit';
  powerTransformer: boolean;
  telecomLineType: 'underground' | 'overhead' | 'none';
  telecomLineLength: number; // [m]
  telecomLineShielding: 'none' | 'shielded';
}

export interface ZoneData {
  zoneName: string;
  floorSurface: 'concrete' | 'asphalt' | 'wood' | 'gravel_tile'; // ovlivňuje Lt a úraz dotykovým napětím
  fireRisk: 'low' | 'ordinary' | 'high'; // rf koeficient požáru
  fireProtection: 'none' | 'extinguishers' | 'manual_alarm' | 'automatic_alarm' | 'sprinklers'; // rp koeficient
  presenceHoursPerYear: number; // doba zdržování osob za rok (max 8760)
  panicRisk: 'low' | 'moderate' | 'high'; // např. školy, nemocnice, nákupní centra
  economicValueBuilding: number; // v Kč
  economicValueEquipment: number; // v Kč
  culturalHeritageValue: boolean; // pro R3
  publicServiceType: 'none' | 'water_gas' | 'hospital' | 'telecom_power'; // pro R2
}

export type SpdClassType = 'type_1' | 'type_1_plus_2' | 'type_2' | 'type_2_plus_3' | 'type_3';
export type SpdTechnologyType = 'spark_gap' | 'varistor_mov' | 'hybrid_gap_mov';
export type SpdNetworkConfiguration = 'TN-C' | 'TN-S' | 'TT' | 'IT';

export interface SpdDetailedConfig {
  spdClassType: SpdClassType;
  technology: SpdTechnologyType;
  networkType: SpdNetworkConfiguration;
  iimp_kA: number; // Impulsní proud Iimp (10/350 µs) [kA]
  in_kA: number;   // Jmenovitý výbojový proud In (8/20 µs) [kA]
  up_kV: number;   // Ochranná napěťová hladina Up [kV]
  uc_V: number;    // Nejvyšší trvalé provozní napětí Uc [V]
  isCoordinatedCascade: boolean; // Dvoustupňová / třístupňová koordinace dle ČSN EN 62305-4
  telecomSpdInstalled: boolean;  // Ochrana datových/sdělovacích linek (kategorie D1/C2)
  telecomSpdType?: string;
  hasFailureSignaling: boolean;  // Dálková signalizace poruchy (FM kontakt)
  customPspd?: number;           // Manuální redukční koeficient PSPD
}

export interface SpdEvaluation {
  isCoordinated: boolean;
  effectivePspd: number;
  nominalPspd: number;
  riskReductionRatioPct: number;
  requiredIimp_kA: number;
  iimpAdequate: boolean;
  protectionLevelAdequate: boolean;
  energyCoordinationVerdict: string;
  lpzBoundariesProtected: string[];
  recommendations: string[];
}

export interface HeatmapZoneInfo {
  id: string;
  name: string;
  zoneCode: string;
  areaDescription: string;
  lpzBoundary: string;
  dominantRiskComponents: string[];
  unmitigatedRiskPct: number;
  mitigatedRiskPct: number;
  status: 'safe' | 'moderate' | 'elevated' | 'critical';
  unmitigatedStatus: 'safe' | 'moderate' | 'elevated' | 'critical';
  color: string;
  unmitigatedColor: string;
  vulnerabilities: string[];
  appliedProtections: string[];
  recommendedMeasures: string[];
  floorLevel: string;
}

export interface MeasuresData {
  lpsClass: LpsClass;
  spdLevel: SpdLevel;
  shieldingMesh: boolean;
  automaticExtinguishing: boolean;
  warningNotices: boolean;
  potentialEqualization: boolean;
  catalogSpdBrand?: 'DEHN' | 'OEZ' | 'SALTEK';
  catalogSpdArticle?: string;
  selectedSpdModel?: string;
  selectedSpdManufacturer?: string;
  selectedSpdArticleNumber?: string;
  selectedSpdUp_kV?: number;
  selectedSpdIimp_kA?: number;
  spdConfig?: SpdDetailedConfig;
}

export type HviType = 'hvi_light' | 'hvi_standard' | 'hvi_power' | 'dehniso_spacer';

export interface RoofLayoutElement {
  id: string;
  type: 'pv_array' | 'inverter' | 'hvac' | 'antenna' | 'air_rod';
  x: number; // v metrech od levého horního rohu střechy
  y: number; // v metrech
  width: number; // rozměr v metrech
  height: number;
  name: string;
}

export interface IsolatedLpsData {
  enabled: boolean;
  protectedEquipment: string; // např. "Fotovoltaická elektrárna (FVE) 30 kWp" nebo "VZT jednotka střešní"
  hviType: HviType;
  conductorLength: number; // l [m] délka svodu k uzemnění / referenčnímu bodu
  numberOfDownConductors: number; // počet paralelních svodů (pro kc)
  customKc: number; // 1.0 (1 svod), 0.66 (2 svody), 0.44 (mříž)
  insulationMaterial: 'air' | 'solid'; // km (vzduch = 1.0, pevný izolant = 0.5)
  customKm: number;
  rodHeight: number; // výška jímací tyče [m]
  actualDistanceToInstallation: number; // skutečná vzdálenost instalace od svodu [cm]
  notes: string;
  twoRodsDistance?: number; // [m] rozteč tyčí pro metodu valící se koule
  roofElements?: RoofLayoutElement[];
}

export interface ComponentRisks {
  RA: number; // Úder do stavby - úraz osob dotykovým a krokovým napětím
  RB: number; // Úder do stavby - fyzické poškození požárem/výbuchem
  RC: number; // Úder do stavby - porucha vnitřních systémů (LEMP)
  RM: number; // Úder v blízkosti stavby - porucha vnitřních systémů (indukce)
  RU: number; // Úder do připojené sítě - úraz osob
  RV: number; // Úder do připojené sítě - fyzické škody (požár)
  RW: number; // Úder do připojené sítě - porucha vnitřních elektrických zařízení
  RZ: number; // Úder v blízkosti sítě - porucha zařízení
}

export interface CalculationResults {
  // Sběrné plochy [m^2]
  Ad: number; // sběrná plocha stavby
  Am: number; // sběrná plocha okolí stavby
  Al_power: number; // sběrná plocha silového vedení
  Ai_power: number;
  Al_telecom: number;
  Ai_telecom: number;

  // Frekvence nebezpečných událostí [1/rok]
  Nd: number;
  Nm: number;
  Nl: number;
  Ni: number;

  // Pravděpodobnosti
  PA: number;
  PB: number;
  PC: number;
  PM: number;
  PU: number;
  PV: number;
  PW: number;
  PZ: number;

  // Složky rizik pro stav bez přídavných opatření vs. s opatřeními
  componentsInitial: ComponentRisks;
  componentsWithMeasures: ComponentRisks;

  // Celková rizika s aplikovanými opatřeními
  R1: number; // Riziko ztráty lidských životů
  R2: number; // Riziko ztráty veřejných služeb
  R3: number; // Riziko ztráty kulturního dědictví
  R4: number; // Riziko hospodářských ztrát

  // Tolerovatelná rizika dle normy
  RT1: number; // 1.0e-5
  RT2: number; // 1.0e-3
  RT3: number; // 1.0e-4
  RT4: number; // 1.0e-3

  // Vyhodnocení bezpečnosti
  isR1Safe: boolean;
  isR2Safe: boolean;
  isR3Safe: boolean;
  isR4Safe: boolean;

  recommendedLpsClass: LpsClass;

  // Výpočet dostatečné vzdálenosti s (ČSN EN 62305-3)
  separationDistance_s_meters: number; // [m]
  separationDistance_s_cm: number;     // [cm]
  ki_factor: number;
  kc_factor: number;
  km_factor: number;
  hvi_equivalent_distance_cm: number; // maximální přípustná ekvivalentní vzdálenost HVI [cm]
  isIsolatedLpsSafe: boolean;
  isolatedLpsVerdict: string;

  // Metoda valící se koule a ochranného úhlu (ČSN EN 62305-3)
  rollingSphereRadius: number; // [m] r = 20 (I), 30 (II), 45 (III), 60 (IV)
  sagDistance_m: number;       // [m] p = r - sqrt(r^2 - (d/2)^2)
  protectedHeight_m: number;   // [m] hc = h_rod - p
  protectiveAngle_deg: number; // [°] ochranný úhel alpha
  isRollingSphereSafe: boolean;

  // Dimenzování uzemňovací soustavy (ČSN EN 62305-3 čl. 5.4)
  minEarthingLength_l1_m: number; // [m] l1 z diagramu dle rho
  actualEarthingLength_m: number; // [m] skutečná délka zemniče
  isEarthingSafe: boolean;
  estimatedEarthResistance_ohm: number; // [Ohm]

  // Posouzení vlivu střešní fotovoltaické instalace (FVE) na LPS
  pvEvaluation?: PvLpsEvaluation;

  // Posouzení stínění okolními stavbami a vlnového pole
  surroundingShielding?: SurroundingShieldingEvaluation;

  // Vyhodnocení svodičů bleskových proudů a přepětí (SPD) dle ČSN EN 62305-4
  spdEvaluation?: SpdEvaluation;

  // Zóny budovy pro interaktivní Risk Heatmap
  heatmapZones?: HeatmapZoneInfo[];
}

export interface PvLpsEvaluation {
  hasPv: boolean;
  systemType?: PvSystemType;
  effectiveHeight_m: number;
  baseAd_m2: number;
  effectiveAd_m2: number;
  deltaAd_m2: number;
  pvArea_m2: number;
  roofArea_m2: number;
  roofCoveragePct: number;
  ki_factor: number;
  kc_factor: number;
  km_factor: number;
  conductorLength_l_m: number;
  separationDistance_s_meters: number;
  separationDistance_s_cm: number;
  actualDistance_d_cm: number;
  isSeparationMaintained: boolean;
  requiredBonding: 'potential_equalization_6mm2_Cu' | 'direct_galvanic_16mm2_Cu';
  requiredSpdDC: 'Typ 2' | 'Typ 1+2 (Iimp ≥ 12.5 kA)' | 'Typ 1+2 (Iimp ≥ 5 kA)';
  requiredSpdAC: 'Typ 2' | 'Typ 1+2';
  fireRiskEvaluation: 'ordinary' | 'high';
  minSpdVoltageUcpv_V: number;       // Minimální trvalé provozní napětí svodiče Ucpv ≥ 1.2 * Uoc
  isDualSpdRequired: boolean;         // Vyžadována druhá sada SPD (délka DC kabelu > 10 m dle ČSN CLC/TS 51643-32)
  galvanicBondingDiameterMm: string;  // Předepsaný průřez Cu (6 mm² vs 16 mm²)
  pneStandardCompliance: string;      // Posouzení shody s podnikovou normou PNE 33 0000-8
  recommendedSpdCatalogModel: string;// Doporučený konkrétní typ z katalogu
  verdict: string;
  recommendations: string[];
}

export interface SurroundingShieldingEvaluation {
  hasShielding: boolean;
  environmentPreset: string;
  baseCd: number;
  effectiveCd: number;
  shieldingRatioPct: number;          // Stínící poměr (0 - 100 %)
  maxShieldingAngleDeg: number;       // Maximální stínící úhel [°]
  dominantObject?: { name: string; height: number; distance: number; angleDeg: number; material: string };
  waveFieldAttenuationFactor_Kms: number; // K_MS koeficient stínění vlnového pole (0.1 - 1.0)
  waveFieldAttenuation_dB: number;    // Útlum elektromagnetického pole v dB
  strikeInterceptionProbPct: number;  // Pravděpodobnost, že blesk zachytí okolní vyšší stavby (%)
  directStrikeReductionPct: number;   // O kolik % klesá pravděpodobnost přímého zásahu naší stavby
  baseNd: number;
  shieldedNd: number;
  verdict: string;
  technicalNotes: string[];
}

export interface CustomCostRates {
  airTerminationRate?: number; // Kč/m²
  conductorMeterRate?: number; // Kč/m
  hviStandardRate?: number;    // Kč/m
  hviPowerRate?: number;       // Kč/m
  laborHourlyRate?: number;    // Kč/hod
  revisionBaseCost?: number;   // Kč
}

export interface LpsProjectState {
  meta: ProjectMeta;
  building: BuildingData;
  lines: LineData;
  zone: ZoneData;
  measures: MeasuresData;
  isolatedLps: IsolatedLpsData;
  customCostRates?: CustomCostRates;
}

