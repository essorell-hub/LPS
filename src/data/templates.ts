/**
 * Předpřipravené inženýrské šablony staveb dle ČSN EN 62305-2 a ČSN EN 62305-3
 */

import { LpsProjectState } from '../types/lps';

export interface ProjectTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  data: LpsProjectState;
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'rd_fve',
    title: 'Rodinný dům se střešní FVE',
    category: 'Rezidenční stavby',
    description: 'Typický dvoupodlažní dům s instalovanou fotovoltaikou 10 kWp, vyžadující oddálený hromosvod k ochraně střídače a panelů.',
    data: {
      meta: {
        projectName: 'Novostavba RD s FVE elektrárnou',
        projectCode: 'LPS-2026-001',
        buildingLocation: 'Benešov u Prahy, parc. č. 452/12',
        investor: 'Ing. Jan Novák',
        designer: 'Ing. Petr Svoboda, ČKAIT 0104523',
        designerCert: 'Autorizovaný inženýr pro techniku prostředí staveb',
        date: '2026-10-27',
        standardVersion: 'ČSN EN 62305-1 až 4 ed. 2',
        notes: 'Projektová dokumentace pro stavební povolení a realizaci LPS se zaměřením na ochranu střešní FVE.'
      },
      building: {
        length: 15,
        width: 10,
        height: 7.5,
        locationFactor: 'isolated',
        groundFlashDensity: 3.0,
        selectedRegion: 'Středočeský kraj',
        structureType: 'masonry',
        pvInstallation: {
          enabled: true,
          powerKwp: 10.0,
          panelCount: 24,
          panelAreaM2: 46.8,
          mountingType: 'pitched_coplanar',
          elevationAngleDeg: 35,
          rackProtrusionHeight: 0.25,
          dcCableRouting: 'metal_shielded_tray',
          dcCableLoopArea: 'minimized_tight',
          inverterLocation: 'technical_room_ground',
          shortestDistanceToLpsCm: 55,
          conductorLengthL: 12.0,
          downConductorCount: 2,
          customKc: 0.66,
          dielectricMedium: 'air'
        }
      },
      lines: {
        powerLineType: 'underground',
        powerLineLength: 60,
        powerLineShielding: 'shielded',
        powerTransformer: false,
        telecomLineType: 'underground',
        telecomLineLength: 40,
        telecomLineShielding: 'shielded'
      },
      zone: {
        zoneName: 'Obytná zóna a střecha s FVE',
        floorSurface: 'wood',
        fireRisk: 'ordinary',
        fireProtection: 'extinguishers',
        presenceHoursPerYear: 8760,
        panicRisk: 'low',
        economicValueBuilding: 8500000,
        economicValueEquipment: 1200000,
        culturalHeritageValue: false,
        publicServiceType: 'none'
      },
      measures: {
        lpsClass: 'III',
        spdLevel: 'LPL_III',
        shieldingMesh: false,
        automaticExtinguishing: false,
        warningNotices: true,
        potentialEqualization: true
      },
      isolatedLps: {
        enabled: true,
        protectedEquipment: 'Fotovoltaické panely FVE 10 kWp a nosná konstrukce',
        hviType: 'hvi_light',
        conductorLength: 12,
        numberOfDownConductors: 2,
        customKc: 0.66,
        insulationMaterial: 'air',
        customKm: 1.0,
        rodHeight: 2.5,
        actualDistanceToInstallation: 55,
        notes: 'Oddálená jímací tyč 2,5 m na distančních vzpěrách s vysokonapěťovým vodičem DEHN HVI light svodem podél štítu.'
      }
    }
  },
  {
    id: 'industrial_hall',
    title: 'Výrobní a skladová hala',
    category: 'Průmysl a logistika',
    description: 'Průmyslový ocelový skelet s hořlavou střechou, střešními VZT jednotkami a vysokými skladovými hodnotami.',
    data: {
      meta: {
        projectName: 'Logistické a výrobní centrum LogiPark',
        projectCode: 'IND-LPS-2026-88',
        buildingLocation: 'Pardubice - Semtín, k.ú. Pardubice',
        investor: 'Apex Logistics & Assembly s.r.o.',
        designer: 'Ing. Martin Dvořák, Ph.D., ČKAIT 0209841',
        designerCert: 'Autorizovaný inženýr v oboru technologická zařízení staveb',
        date: '2026-10-27',
        standardVersion: 'ČSN EN 62305-1 až 4 ed. 2',
        notes: 'Posouzení rizik a návrh vnějšího LPS II s izolovaným připojením střešních strojoven vzduchotechniky.'
      },
      building: {
        length: 65,
        width: 32,
        height: 11.5,
        locationFactor: 'isolated',
        groundFlashDensity: 3.5,
        selectedRegion: 'Pardubický kraj',
        structureType: 'concrete_steel'
      },
      lines: {
        powerLineType: 'underground',
        powerLineLength: 180,
        powerLineShielding: 'conduit',
        powerTransformer: true,
        telecomLineType: 'underground',
        telecomLineLength: 120,
        telecomLineShielding: 'shielded'
      },
      zone: {
        zoneName: 'Skladová a montážní hala',
        floorSurface: 'concrete',
        fireRisk: 'high',
        fireProtection: 'sprinklers',
        presenceHoursPerYear: 6000,
        panicRisk: 'low',
        economicValueBuilding: 48000000,
        economicValueEquipment: 85000000,
        culturalHeritageValue: false,
        publicServiceType: 'none'
      },
      measures: {
        lpsClass: 'II',
        spdLevel: 'LPL_II',
        shieldingMesh: true,
        automaticExtinguishing: true,
        warningNotices: true,
        potentialEqualization: true
      },
      isolatedLps: {
        enabled: true,
        protectedEquipment: 'Střešní chladicí kompresory a VZT jednotky',
        hviType: 'hvi_power',
        conductorLength: 22,
        numberOfDownConductors: 4,
        customKc: 0.44,
        insulationMaterial: 'air',
        customKm: 1.0,
        rodHeight: 4.0,
        actualDistanceToInstallation: 85,
        notes: 'Vysokonapěťové vodiče DEHN HVI power pro oddálení výfuků VZT s ekvivalentní separační vzdáleností až 90 cm.'
      }
    }
  },
  {
    id: 'hospital',
    title: 'Nemocniční pavilon s urgentním příjmem',
    category: 'Zdravotnictví a kritická infrastruktura',
    description: 'Budova se ztrátou veřejných služeb (R2) a vysokou hustotou zranitelných osob, vyžadující nejvyšší třídu LPS I.',
    data: {
      meta: {
        projectName: 'Novostavba pavilonu akutní medicíny',
        projectCode: 'HOSP-2026-MED01',
        buildingLocation: 'Brno - Bohunice',
        investor: 'Fakultní nemocnice Brno',
        designer: 'Ing. Tomáš Kučera, ČKAIT 0087451',
        designerCert: 'Autorizovaný inspektor staveb a elektro LPS',
        date: '2026-10-27',
        standardVersion: 'ČSN EN 62305-1 až 4 ed. 2',
        notes: 'Návrh přísných opatření pro ochranu přístrojů JIP, heliportu a napájecích zdrojů UPS.'
      },
      building: {
        length: 75,
        width: 42,
        height: 19.0,
        locationFactor: 'isolated',
        groundFlashDensity: 3.4,
        selectedRegion: 'Jihomoravský kraj',
        structureType: 'concrete_steel'
      },
      lines: {
        powerLineType: 'underground',
        powerLineLength: 250,
        powerLineShielding: 'conduit',
        powerTransformer: true,
        telecomLineType: 'underground',
        telecomLineLength: 150,
        telecomLineShielding: 'shielded'
      },
      zone: {
        zoneName: 'Lůžková oddělení a operační sály',
        floorSurface: 'asphalt',
        fireRisk: 'ordinary',
        fireProtection: 'automatic_alarm',
        presenceHoursPerYear: 8760,
        panicRisk: 'high',
        economicValueBuilding: 195000000,
        economicValueEquipment: 310000000,
        culturalHeritageValue: false,
        publicServiceType: 'hospital'
      },
      measures: {
        lpsClass: 'I',
        spdLevel: 'LPL_I',
        shieldingMesh: true,
        automaticExtinguishing: true,
        warningNotices: true,
        potentialEqualization: true
      },
      isolatedLps: {
        enabled: true,
        protectedEquipment: 'Naváděcí antény heliportu a záložní elektrocentrály',
        hviType: 'hvi_power',
        conductorLength: 26,
        numberOfDownConductors: 6,
        customKc: 0.44,
        insulationMaterial: 'solid',
        customKm: 0.5,
        rodHeight: 3.5,
        actualDistanceToInstallation: 120,
        notes: 'Použití DEHN HVI power s uložením v betonovém podhledu a stěně.'
      }
    }
  },
  {
    id: 'school',
    title: 'Základní škola s tělocvičnou',
    category: 'Školství a shromažďovací prostory',
    description: 'Školní objekt s velkou koncentrací dětí a rizikem paniky, posuzovaný s ohledem na bezpečnost osob a dotykové napětí.',
    data: {
      meta: {
        projectName: 'Rekonstrukce a přístavba ZŠ Květnová',
        projectCode: 'EDU-LPS-2026-14',
        buildingLocation: 'Hradec Králové, k.ú. Slezské Předměstí',
        investor: 'Statutární město Hradec Králové',
        designer: 'Ing. Kateřina Blažková, ČKAIT 0341872',
        designerCert: 'Autorizovaný inženýr v oboru elektro',
        date: '2026-10-27',
        standardVersion: 'ČSN EN 62305-1 až 4 ed. 2',
        notes: 'Výpočet řízení rizik po instalaci zateplovacího systému ETICS a nové střešní krytiny.'
      },
      building: {
        length: 48,
        width: 24,
        height: 12.0,
        locationFactor: 'surrounded_by_trees',
        groundFlashDensity: 2.8,
        selectedRegion: 'Královéhradecký kraj',
        structureType: 'masonry'
      },
      lines: {
        powerLineType: 'underground',
        powerLineLength: 90,
        powerLineShielding: 'shielded',
        powerTransformer: false,
        telecomLineType: 'underground',
        telecomLineLength: 60,
        telecomLineShielding: 'shielded'
      },
      zone: {
        zoneName: 'Učebny, chodby a tělocvična',
        floorSurface: 'wood',
        fireRisk: 'ordinary',
        fireProtection: 'manual_alarm',
        presenceHoursPerYear: 3200,
        panicRisk: 'moderate',
        economicValueBuilding: 52000000,
        economicValueEquipment: 14000000,
        culturalHeritageValue: false,
        publicServiceType: 'none'
      },
      measures: {
        lpsClass: 'III',
        spdLevel: 'LPL_III',
        shieldingMesh: false,
        automaticExtinguishing: false,
        warningNotices: true,
        potentialEqualization: true
      },
      isolatedLps: {
        enabled: true,
        protectedEquipment: 'Klimatizační jednotky a internetový vysílač na střeše',
        hviType: 'hvi_standard',
        conductorLength: 16,
        numberOfDownConductors: 2,
        customKc: 0.66,
        insulationMaterial: 'air',
        customKm: 1.0,
        rodHeight: 2.0,
        actualDistanceToInstallation: 60,
        notes: 'Distanční vzpěry DEHNiso pro oddálení svodu od ocelových žebříků a světlíků.'
      }
    }
  }
];

export const CZECH_REGIONS_FLASH_DENSITY = [
  { name: 'Hlavní město Praha', density: 2.5 },
  { name: 'Středočeský kraj', density: 2.9 },
  { name: 'Jihočeský kraj', density: 3.4 },
  { name: 'Plzeňský kraj', density: 3.1 },
  { name: 'Karlovarský kraj', density: 2.8 },
  { name: 'Ústecký kraj', density: 2.6 },
  { name: 'Liberecký kraj', density: 3.5 },
  { name: 'Královéhradecký kraj', density: 3.3 },
  { name: 'Pardubický kraj', density: 3.2 },
  { name: 'Kraj Vysočina', density: 3.6 },
  { name: 'Jihomoravský kraj', density: 3.2 },
  { name: 'Olomoucký kraj', density: 3.5 },
  { name: 'Moravskoslezský kraj', density: 3.8 },
  { name: 'Zlínský kraj', density: 3.7 }
];
