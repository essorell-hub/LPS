/**
 * Katalog reálných přístrojů přepěťových ochran (SPD)
 * Výrobci: DEHN SE, OEZ s.r.o., SALTEK s.r.o.
 */

export interface SpdProduct {
  id: string;
  manufacturer: 'DEHN' | 'OEZ' | 'SALTEK';
  name: string;
  orderCode: string;
  typeClass: 'Typ 1+2' | 'Typ 2' | 'Typ 1+2+3' | 'Typ 1+2 pro FVE';
  networkType: 'TN-C' | 'TN-S / TT' | 'DC Fotovoltaika';
  Iimp: string; // Bleskový proud vlna 10/350 µs
  In: string;   // Jmenovitý proud vlna 8/20 µs
  Up: string;   // Ochranná napěťová hladina
  Uc: string;   // Max. trvalé provozní napětí
  approxPriceCzk: number;
  description: string;
}

export const SPD_CATALOG: SpdProduct[] = [
  // --- DEHN SE ---
  {
    id: 'dehn_ventil_tnc',
    manufacturer: 'DEHN',
    name: 'DEHNventil modular M2 TNC 255 FM',
    orderCode: '951 305',
    typeClass: 'Typ 1+2',
    networkType: 'TN-C',
    Iimp: '25 kA / pól (75 kA celkem)',
    In: '25 kA / pól',
    Up: '≤ 1,5 kV',
    Uc: '264 V AC',
    approxPriceCzk: 17800,
    description: 'Kombinovaný svodič bleskových proudů a přepětí s technologií jiskřiště RADAX Flow pro sítě 230/400 V TN-C s dálkovou signalizací (FM).'
  },
  {
    id: 'dehn_ventil_tns',
    manufacturer: 'DEHN',
    name: 'DEHNventil modular M2 TNS 255 FM',
    orderCode: '951 405',
    typeClass: 'Typ 1+2',
    networkType: 'TN-S / TT',
    Iimp: '25 kA / pól (100 kA celkem)',
    In: '25 kA / pól',
    Up: '≤ 1,5 kV',
    Uc: '264 V AC',
    approxPriceCzk: 21900,
    description: 'Kombinovaný svodič Typ 1+2 pro sítě TN-S (4pólový) s bezvýfukovým jiskřištěm a nulovým následným proudem sítě.'
  },
  {
    id: 'dehn_combo_pv',
    manufacturer: 'DEHN',
    name: 'DEHNcombo YPV 1200 FM',
    orderCode: '900 070',
    typeClass: 'Typ 1+2 pro FVE',
    networkType: 'DC Fotovoltaika',
    Iimp: '12,5 kA (10/350 µs)',
    In: '20 kA (8/20 µs)',
    Up: '≤ 3,8 kV',
    Uc: '1200 V DC',
    approxPriceCzk: 12400,
    description: 'Kombinovaný svodič pro fotovoltaické systémy do 1200 V DC v zapojení Y odolný proti přeskoku a oblouku.'
  },
  {
    id: 'dehn_guard_tns',
    manufacturer: 'DEHN',
    name: 'DEHNguard M TNS 275 FM',
    orderCode: '952 405',
    typeClass: 'Typ 2',
    networkType: 'TN-S / TT',
    Iimp: '-',
    In: '20 kA / pól (max 40 kA)',
    Up: '≤ 1,5 kV',
    Uc: '275 V AC',
    approxPriceCzk: 6200,
    description: 'Modulární svodič přepětí Typ 2 pro podružné rozváděče a ochranu citlivé elektroniky a střídačů.'
  },

  // --- OEZ s.r.o. ---
  {
    id: 'oez_svbc_tnc',
    manufacturer: 'OEZ',
    name: 'Minia SVBC-12,5-3-MZ',
    orderCode: 'OEZ:42825',
    typeClass: 'Typ 1+2',
    networkType: 'TN-C',
    Iimp: '12,5 kA / pól (37,5 kA celkem)',
    In: '25 kA / pól',
    Up: '≤ 1,5 kV',
    Uc: '275 V AC',
    approxPriceCzk: 8900,
    description: 'Kombinovaný svodič bleskových proudů a přepětí OEZ Minia pro sítě TN-C s výměnnými moduly a optickou indikací stavu.'
  },
  {
    id: 'oez_svbc_tns',
    manufacturer: 'OEZ',
    name: 'Minia SVBC-12,5-4-MZ',
    orderCode: 'OEZ:42826',
    typeClass: 'Typ 1+2',
    networkType: 'TN-S / TT',
    Iimp: '12,5 kA / pól (50 kA celkem)',
    In: '25 kA / pól',
    Up: '≤ 1,5 kV',
    Uc: '275 V AC',
    approxPriceCzk: 11200,
    description: 'Kombinovaný svodič OEZ Typ 1+2 pro sítě TN-S / TT v hlavních domovních a průmyslových rozváděčích.'
  },
  {
    id: 'oez_svc_tns',
    manufacturer: 'OEZ',
    name: 'Minia SVC-350-4-M-ZS',
    orderCode: 'OEZ:42811',
    typeClass: 'Typ 2',
    networkType: 'TN-S / TT',
    Iimp: '-',
    In: '20 kA / pól',
    Up: '≤ 1,6 kV',
    Uc: '350 V AC',
    approxPriceCzk: 4600,
    description: 'Svodič přepětí OEZ Typ 2 pro podružné rozváděče s dálkovou signalizací stavu odpojovače.'
  },

  // --- SALTEK s.r.o. ---
  {
    id: 'saltek_flp_tnc',
    manufacturer: 'SALTEK',
    name: 'FLP-12,5 V/3+0',
    orderCode: 'A03847',
    typeClass: 'Typ 1+2',
    networkType: 'TN-C',
    Iimp: '12,5 kA / pól',
    In: '30 kA / pól',
    Up: '≤ 1,5 kV',
    Uc: '275 V AC',
    approxPriceCzk: 7900,
    description: 'Kombinovaný svodič přepětí SALTEK Typ 1+2 na bázi varistoru a bleskojistky pro sítě TN-C.'
  },
  {
    id: 'saltek_flp_tns',
    manufacturer: 'SALTEK',
    name: 'FLP-12,5 V/4+0',
    orderCode: 'A03848',
    typeClass: 'Typ 1+2',
    networkType: 'TN-S / TT',
    Iimp: '12,5 kA / pól (50 kA celkem)',
    In: '30 kA / pól',
    Up: '≤ 1,5 kV',
    Uc: '275 V AC',
    approxPriceCzk: 9800,
    description: 'Kombinovaný svodič bleskového proudu SALTEK pro instalaci do hlavních rozváděčů sítí TN-S.'
  },
  {
    id: 'saltek_slp_tns',
    manufacturer: 'SALTEK',
    name: 'SLP-275 V/4+0',
    orderCode: 'A03824',
    typeClass: 'Typ 2',
    networkType: 'TN-S / TT',
    Iimp: '-',
    In: '20 kA / pól (max 40 kA)',
    Up: '≤ 1,35 kV',
    Uc: '275 V AC',
    approxPriceCzk: 3950,
    description: 'Svodič přepětí SALTEK Typ 2 pro ochranu podružných rozvodů a výpočetní techniky.'
  }
];
