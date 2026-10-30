import React, { useState } from 'react';
import {
  IsolatedLpsData,
  CalculationResults,
  HviType,
  LpsClass
} from '../types/lps';
import {
  Zap,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Maximize2,
  Layers,
  Sun,
  Flame,
  ArrowRight,
  Info,
  Check,
  ZoomIn,
  FileCheck,
  Wrench,
  Sparkles
} from 'lucide-react';

export interface HviConfigScheme {
  id: string;
  title: string;
  subtitle: string;
  category: 'pv_commercial' | 'hvac_industrial' | 'pv_residential' | 'sparkover_hazard';
  imageSrc: string;
  badge: string;
  badgeColor: 'emerald' | 'blue' | 'amber' | 'rose';
  hviType: HviType;
  recommendedLpsClass: LpsClass;
  typicalSeparationS: string;
  airLimit: number;
  solidLimit: number;
  description: string;
  problemSolved: string;
  keyAdvantages: string[];
  billOfMaterials: { item: string; spec: string }[];
  standardRefs: string[];
  safetyState: 'safe' | 'hazard';
}

const HVI_SCHEMES: HviConfigScheme[] = [
  {
    id: 'pv_commercial',
    title: 'Komerční střecha s fotovoltaikou (FVE)',
    subtitle: 'Izolovaná jímací soustava s vodiči DEHN HVI na distančních vzpěrách GRP',
    category: 'pv_commercial',
    imageSrc: '/src/assets/images/hvi_pv_rooftop_1793296705907.jpg',
    badge: 'DOPORUČENO PRO FVE',
    badgeColor: 'emerald',
    hviType: 'hvi_standard',
    recommendedLpsClass: 'II',
    typicalSeparationS: 's ≤ 75 cm (vzduch) / 150 cm (dielektrikum)',
    airLimit: 75,
    solidLimit: 150,
    description: 'Plochá střecha administrativní nebo komerční budovy s rozsáhlým FV polem. Jímací soustava je realizována izolovanými jímacími tyčemi osazenými na dielektrických sklolaminátových vzpěrách (GRP). Svod je proveden kabelem DEHN HVI se speciálním polovodivým pláštěm pro řízení elektrického pole.',
    problemSolved: 'Panely zabírají většinu plochy střechy a nelze dodržet dostatečnou vzdálenost od klasického drátu AlMgSi bez nákladného přímého pospojování a rizika zničení střídače.',
    keyAdvantages: [
      'Bleskový proud je bezpečně sveden do země bez rizika přeskoku na nosné rámy panelů.',
      'Na DC straně střídače a v AC rozváděči plně postačuje levnější přepěťová ochrana Typ 2 (ČSN CLC/TS 51643-32).',
      'Do vnitřních DC a AC instalací nevnikají ničivé dílčí bleskové proudy Iimp.',
      'Rámy FVE jsou uzemněny pouze funkčním pospojením PE (Cu 6 mm²) pro ochranu před úrazem el. proudem.'
    ],
    billOfMaterials: [
      { item: 'Vysokonapěťový vodič', spec: 'DEHN HVI standard (ekvivalent s ≤ 75 cm)' },
      { item: 'Izolovaná jímací tyč', spec: 'Al/nerez délky 2,5 m na statické trojnožce' },
      { item: 'Distanční vzpěry', spec: 'DEHNiso GRP plast vyztužený skelnými vlákny' },
      { item: 'Koncovky a těsnění', spec: 'HVI ukončovací sada pro řízení el. pole' }
    ],
    standardRefs: ['ČSN EN 62305-3 čl. 6.3', 'ČSN CLC/TS 51643-32 čl. 6.2', 'Příloha E ČSN EN 62305-3'],
    safetyState: 'safe'
  },
  {
    id: 'hvac_industrial',
    title: 'Průmyslová střecha s VZT a chladicími chillery',
    subtitle: 'Vysokovýkonný systém HVI power s ochrannou valící se koulí R = 30 m',
    category: 'hvac_industrial',
    imageSrc: '/src/assets/images/hvi_hvac_industrial_1793296705708.jpg',
    badge: 'TĚŽKÝ PRŮMYSL & TZB',
    badgeColor: 'blue',
    hviType: 'hvi_power',
    recommendedLpsClass: 'I',
    typicalSeparationS: 's ≤ 90 cm (vzduch) / 180 cm (dielektrikum)',
    airLimit: 90,
    solidLimit: 180,
    description: 'Průmyslová hala nebo datacentrum s hustě osazenými střešními klimatizačními a chladicími jednotkami. Jímací soustava je dimenzována metodou valící se koule (R = 20 m až 30 m pro LPS I/II). Vodiče DEHN HVI power jsou vedeny podél obvodových atik a kabelových lávek přímo k uzemňovací soustavě.',
    problemSolved: 'Ochrana citlivých elektronických desek, kompresorů a řídicích jednotek VZT před elektromagnetickou indukcí a přímým výbojem do pláště strojovny.',
    keyAdvantages: [
      'Maximální izolační odolnost s ekvivalentem s až 90 cm ve vzduchu a 180 cm v pevném dielektriku.',
      'Kompletní ochrana zóny LPZ 0B: technologie je bezpečně pod pláštěm valící se koule.',
      'Svod může být uložen přímo na kovové konstrukce nebo v kabelových trasách bez rizika přeskoku.',
      'Umožňuje koordinaci SPD stupňů LPZ 1 → LPZ 2 bez nutnosti nákladných lokálních oddělovacích transformátorů.'
    ],
    billOfMaterials: [
      { item: 'Vysokonapěťový vodič', spec: 'DEHN HVI power (max. izolační třída, s ≤ 90 cm)' },
      { item: 'Jímací stožáry', spec: 'Teleskopické jímače 4,0 m s kotevními základnami' },
      { item: 'Podpěry a příchytky', spec: 'Nerezové montážní třmeny s pryžovou vložkou' },
      { item: 'Připojení na zemnič', spec: 'Ekvipotenciální přípojnice a svorky RD 8-10 mm' }
    ],
    standardRefs: ['ČSN EN 62305-3 čl. 5.2.2 (Valící se koule)', 'ČSN EN 62305-4 (Vnitřní systémy LEMP)'],
    safetyState: 'safe'
  },
  {
    id: 'pv_residential',
    title: 'Rezidenční rodinný dům se sedlovou střechou',
    subtitle: 'Subtilní oddálený jímací systém DEHN HVI light pro rodinné domy',
    category: 'pv_residential',
    imageSrc: '/src/assets/images/hvi_residential_roof_1793296705642.jpg',
    badge: 'RODINNÉ DOMY & NZÚ',
    badgeColor: 'amber',
    hviType: 'hvi_light',
    recommendedLpsClass: 'III',
    typicalSeparationS: 's ≤ 45 cm (vzduch) / 90 cm (dielektrikum)',
    airLimit: 45,
    solidLimit: 90,
    description: 'Moderní rodinný dům se šikmou střechou a instalovanou FVE elektrárnou (5 až 15 kWp). Jímací tyč je namontována na izolační distanční vzpěře u štítu. Vodič HVI light je veden podél štítové hrany střechy a fasády dolů k zemniči, aniž by došlo k přeskoku na okapový žlab a svodovou rouru.',
    problemSolved: 'Klasický hromosvod na rodinném domě bývá často ve vzdálenosti pouze 10–25 cm od panelů nebo okapu, což je hrubé porušení normy. HVI light problém řeší s minimálním zásahem do architektury.',
    keyAdvantages: [
      'Subtilní průměr vodiče a možnost lakování do barvy fasády či střechy.',
      'Bezpečný odstup od kovových okapů a střešních oken bez nutnosti jejich vodivého spojování.',
      'Splňuje podmínky dotací Nová zelená úsporám (NZÚ) a požadavky pojišťoven na bezpečný LPS.',
      'Výrazně levnější varianta pro menší stavby s délkou svodu l do 15 metrů.'
    ],
    billOfMaterials: [
      { item: 'Izolovaný vodič', spec: 'DEHN HVI light šedý / černý (s ≤ 45 cm)' },
      { item: 'Jímací hrot', spec: 'AlMgSi délka 1,5–2,0 m' },
      { item: 'Distanční vzpěra', spec: 'DEHNiso vzpěra na krokev / laťování' },
      { item: 'Ochranná trubka', spec: 'Plastová chránička pro mechanickou ochranu na fasádě' }
    ],
    standardRefs: ['ČSN 33 2000-7-712 (Fotovoltaické systémy)', 'ČSN EN 62305-3 čl. 6.3'],
    safetyState: 'safe'
  },
  {
    id: 'sparkover_hazard',
    title: 'Riziko porušení vzdálenosti s (Neizolovaný stav)',
    subtitle: 'Názorné schéma fyzikálního přeskoku a následků nedodržení d ≥ s',
    category: 'sparkover_hazard',
    imageSrc: '/src/assets/images/hvi_sparkover_risk_1793296705721.jpg',
    badge: 'RIZIKO PŘESKOKU & POŽÁRU',
    badgeColor: 'rose',
    hviType: 'hvi_light',
    recommendedLpsClass: 'III',
    typicalSeparationS: 'd < s (Kritické nedodržení)',
    airLimit: 0,
    solidLimit: 0,
    description: 'Fyzikální vizualizace havarijního stavu: Klasický holý svod hromosvodu vedený v těsné blízkosti kovových rámů fotovoltaických panelů (vzdálenost d je menší než potřebná mez s). Při zásahu bleskem vzniká na svodu napětí desítek kilovoltů, které způsobí jiskrový přeskok bleskového oblouku přímo na rámy panelů.',
    problemSolved: 'Tento model ilustruje, proč revizní technici odmítají schválit stavby s nedodrženým s bez pospojení nebo HVI.',
    keyAdvantages: [
      'Jasné vizuální vysvětlení pro investora a montážní firmu, proč nelze panely montovat těsně k drátu.',
      'Přeskok způsobuje propálení střešní hydroizolace a vznik elektrického oblouku s teplotou přes 10 000 °C.',
      'Bleskový proud je zavlečen přímo po DC kabelech do střídače a elektroinstalace domu.',
      'Pokud nelze dosáhnout d ≥ s pomocí HVI, je ZÁKONNOU POVINNOSTÍ provést masivní přímé pospojení Cu 16 mm² a osadit Typ 1+2 SPD.'
    ],
    billOfMaterials: [
      { item: 'Následek', spec: 'Zničení střídače a požár střešního pláště' },
      { item: 'Nutné opatření 1', spec: 'Okamžitá instalace izolovaného svodu HVI nebo oddálených tyčí' },
      { item: 'Alternativní opatření 2', spec: 'Přímé galvanické propojení vodičem Cu ≥ 16 mm² nebo FeZn ø 8 mm' },
      { item: 'Požadavek na SPD', spec: 'Povinná instalace kombinovaného svodiče Typ 1+2 (Iimp ≥ 12.5 kA / 5 kA)' }
    ],
    standardRefs: ['ČSN EN 62305-3 čl. 6.3 (Přeskoly)', 'ČSN CLC/TS 51643-32', 'Vyhláška č. 268/2009 Sb. § 36'],
    safetyState: 'hazard'
  }
];

interface HviVisualizerGalleryProps {
  currentLpsClass?: LpsClass;
  currentIsolatedLps?: IsolatedLpsData;
  results?: CalculationResults;
  onApplyConfig?: (config: { hviType: HviType; conductorLength?: number; numberOfDownConductors?: number }) => void;
}

export const HviVisualizerGallery: React.FC<HviVisualizerGalleryProps> = ({
  currentLpsClass = 'III',
  currentIsolatedLps,
  results,
  onApplyConfig
}) => {
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>('pv_commercial');
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState<boolean>(false);
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

  const activeScheme = HVI_SCHEMES.find((s) => s.id === selectedSchemeId) || HVI_SCHEMES[0];

  const handleApply = (scheme: HviConfigScheme) => {
    if (onApplyConfig) {
      onApplyConfig({
        hviType: scheme.hviType,
        numberOfDownConductors: scheme.category === 'hvac_industrial' ? 4 : scheme.category === 'pv_commercial' ? 2 : 1
      });
      setAppliedNotification(`Parametry konfigurace „${scheme.title}“ byly aplikovány do vašeho projektu.`);
      setTimeout(() => setAppliedNotification(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast notifikace po aplikaci */}
      {appliedNotification && (
        <div className="p-3 rounded-lg bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2 shadow-lg animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>{appliedNotification}</span>
        </div>
      )}

      {/* Záhlaví vizualizátoru */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            3D Technická vizualizace instalací izolovaného hromosvodu (HVI)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Ilustrační inženýrská schémata generovaná dle norem ČSN EN 62305-3 a ČSN CLC/TS 51643-32 pro pochopení dopadu navržených oddálených opatření na střechách budov.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-mono">
            Vypočtená mez projektu: <strong className="text-blue-300">{results?.separationDistance_s_cm || 32} cm</strong>
          </span>
        </div>
      </div>

      {/* Přepínač 4 schémat (Tlačítkové karty) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {HVI_SCHEMES.map((scheme) => {
          const isSelected = scheme.id === selectedSchemeId;
          const isHazard = scheme.safetyState === 'hazard';

          return (
            <button
              key={scheme.id}
              type="button"
              onClick={() => setSelectedSchemeId(scheme.id)}
              className={`p-3 rounded-xl text-left border transition-all cursor-pointer relative overflow-hidden group ${
                isSelected
                  ? isHazard
                    ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/30'
                    : 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/30'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              {/* Náhledový obrázek */}
              <div className="w-full h-24 rounded-lg overflow-hidden mb-2.5 relative bg-slate-950">
                <img
                  src={scheme.imageSrc}
                  alt={scheme.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <span className={`absolute top-1.5 right-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                  scheme.badgeColor === 'emerald' ? 'bg-emerald-500 text-slate-950' :
                  scheme.badgeColor === 'blue' ? 'bg-blue-500 text-white' :
                  scheme.badgeColor === 'amber' ? 'bg-amber-500 text-slate-950' :
                  'bg-rose-500 text-white'
                }`}>
                  {scheme.badge}
                </span>
              </div>

              <div className="font-bold text-xs text-slate-100 line-clamp-1">
                {scheme.title}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                {scheme.subtitle}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                <span className={isHazard ? 'text-rose-400 font-bold' : 'text-blue-400 font-bold'}>
                  {scheme.hviType}
                </span>
                <span className="text-slate-400">
                  {scheme.airLimit > 0 ? `s ≤ ${scheme.airLimit} cm` : 'd < s!'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail aktivního schématu (Velký pohled) */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Levý sloupec: Velká vizualizace s možností fullscreen */}
          <div className="lg:col-span-7 space-y-3">
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 group shadow-2xl">
              <img
                src={activeScheme.imageSrc}
                alt={activeScheme.title}
                referrerPolicy="no-referrer"
                className="w-full h-auto aspect-video object-cover"
              />

              {/* Tlačítko zvětšení na celou obrazovku */}
              <button
                type="button"
                onClick={() => setIsFullscreenModalOpen(true)}
                className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700/80 backdrop-blur cursor-pointer shadow-lg transition-all"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                Zvětšit schéma
              </button>

              {/* Stavový badge v obrázku */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider backdrop-blur shadow-md ${
                  activeScheme.safetyState === 'safe'
                    ? 'bg-emerald-600/90 text-white border border-emerald-400/50'
                    : 'bg-rose-600/90 text-white border border-rose-400/50 animate-pulse'
                }`}>
                  {activeScheme.safetyState === 'safe' ? '✓ Bezpečný stav oddělení' : '⚠ Nebezpečí přeskoku & oblouku'}
                </span>
              </div>
            </div>

            {/* Stručný popisek pod obrázkem */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
              <span>Technické 3D schéma dle ČSN EN 62305-3</span>
              <span>Izolační schopnost: {activeScheme.typicalSeparationS}</span>
            </div>
          </div>

          {/* Pravý sloupec: Technický rozbor a dopad opatření */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-white tracking-tight">
                  {activeScheme.title}
                </h4>
              </div>
              <p className="text-xs text-blue-300 mt-0.5 font-medium">
                {activeScheme.subtitle}
              </p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {activeScheme.description}
            </p>

            {/* Řešený technický problém */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-400" />
                Inženýrský kontext a řešený problém:
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {activeScheme.problemSolved}
              </p>
            </div>

            {/* Klíčové přínosy a dopady opatření */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Dopad navržených opatření na objekt:
              </div>
              <ul className="space-y-1 text-xs text-slate-300">
                {activeScheme.keyAdvantages.map((adv, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold mt-0.5 shrink-0">•</span>
                    <span className="leading-snug">{adv}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Doporučený kusovník komponent */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-blue-400" />
                Typické komponenty systému:
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-xs font-mono">
                {activeScheme.billOfMaterials.map((bom, idx) => (
                  <div key={idx} className="p-2 rounded bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-300">{bom.item}:</span>
                    <span className="text-blue-300 text-[11px]">{bom.spec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tlačítko pro aplikaci konfigurace do projektu */}
            {onApplyConfig && activeScheme.safetyState === 'safe' && (
              <button
                type="button"
                onClick={() => handleApply(activeScheme)}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-900/40 transition-all mt-3"
              >
                <CheckCircle2 className="w-4 h-4" />
                Aplikovat konfiguraci {activeScheme.hviType} do výpočtu projektu
              </button>
            )}
          </div>
        </div>

        {/* Spodní srovnávací tabulka: Porovnání izolačních schopností systémů */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Srovnávací matice izolačních schopností HVI systémů dle ČSN EN 62305-3
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Vzorec: s = ki · (kc / km) · l
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2">Typ vodiče / systém</th>
                  <th className="px-3 py-2">Ekvivalent ve vzduchu (km = 1.0)</th>
                  <th className="px-3 py-2">Ekvivalent v pevném dielektriku (km = 0.5)</th>
                  <th className="px-3 py-2">Typické použití na stavbách</th>
                  <th className="px-3 py-2 text-right">Požadavek na SPD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                <tr className={activeScheme.hviType === 'hvi_light' && activeScheme.safetyState === 'safe' ? 'bg-blue-950/20 font-semibold text-white' : ''}>
                  <td className="px-3 py-2 text-blue-400 font-bold">DEHN HVI light</td>
                  <td className="px-3 py-2">s ≤ 45 cm</td>
                  <td className="px-3 py-2">s ≤ 90 cm</td>
                  <td className="px-3 py-2 text-slate-400 font-sans">Rodinné domy, menší FVE do 20 kWp, tepelná čerpadla</td>
                  <td className="px-3 py-2 text-right text-emerald-400">Typ 2 postačuje</td>
                </tr>
                <tr className={activeScheme.hviType === 'hvi_standard' && activeScheme.safetyState === 'safe' ? 'bg-blue-950/20 font-semibold text-white' : ''}>
                  <td className="px-3 py-2 text-blue-400 font-bold">DEHN HVI standard</td>
                  <td className="px-3 py-2">s ≤ 75 cm</td>
                  <td className="px-3 py-2">s ≤ 150 cm</td>
                  <td className="px-3 py-2 text-slate-400 font-sans">Bytové domy, komerční střechy, FVE pole, VZT strojovny</td>
                  <td className="px-3 py-2 text-right text-emerald-400">Typ 2 postačuje</td>
                </tr>
                <tr className={activeScheme.hviType === 'hvi_power' ? 'bg-blue-950/20 font-semibold text-white' : ''}>
                  <td className="px-3 py-2 text-blue-400 font-bold">DEHN HVI power</td>
                  <td className="px-3 py-2">s ≤ 90 cm</td>
                  <td className="px-3 py-2">s ≤ 180 cm</td>
                  <td className="px-3 py-2 text-slate-400 font-sans">Průmysl, nemocnice, telekomunikační stožáry, LPS I</td>
                  <td className="px-3 py-2 text-right text-emerald-400">Typ 2 postačuje</td>
                </tr>
                <tr className="bg-rose-950/20 text-rose-300">
                  <td className="px-3 py-2 text-rose-400 font-bold">Neizolovaný svod (d &lt; s)</td>
                  <td className="px-3 py-2 text-rose-400">0 cm (přeskok!)</td>
                  <td className="px-3 py-2 text-rose-400">0 cm (přeskok!)</td>
                  <td className="px-3 py-2 text-slate-400 font-sans">Chybná montáž bez dodržení odstupu nebo bez pospojení</td>
                  <td className="px-3 py-2 text-right text-rose-400 font-bold">POVINNÝ Typ 1+2 (Iimp)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal pro celoobrazovkové zvětšení */}
      {isFullscreenModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col p-4 sm:p-8 animate-in fade-in backdrop-blur-md">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white">{activeScheme.title}</h3>
              <p className="text-xs text-slate-400">{activeScheme.subtitle} | {activeScheme.typicalSeparationS}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreenModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
            >
              Zavřít náhled [Esc]
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            <img
              src={activeScheme.imageSrc}
              alt={activeScheme.title}
              referrerPolicy="no-referrer"
              className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl border border-slate-800"
            />
          </div>
        </div>
      )}
    </div>
  );
};
