import React from 'react';
import {
  MeasuresData,
  CalculationResults,
  LpsClass,
  SpdLevel,
  SpdClassType,
  SpdTechnologyType,
  SpdNetworkConfiguration,
  SpdDetailedConfig
} from '../types/lps';
import { formatScientific } from '../utils/docxExport';
import {
  ShieldCheck,
  Zap,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Layers,
  Sliders,
  Cpu,
  Activity,
  Info,
  Network,
  Radio,
  FileCheck,
  Building
} from 'lucide-react';

interface Step4LpsMeasuresProps {
  measures: MeasuresData;
  results: CalculationResults;
  onUpdateMeasures: (measures: Partial<MeasuresData>) => void;
}

export const Step4LpsMeasures: React.FC<Step4LpsMeasuresProps> = ({
  measures,
  results,
  onUpdateMeasures
}) => {
  // Výchozí nebo existující detailní konfigurace SPD
  const spd: SpdDetailedConfig = measures.spdConfig || {
    spdClassType: 'type_1_plus_2',
    technology: 'spark_gap',
    networkType: 'TN-C',
    iimp_kA: measures.lpsClass === 'I' ? 25 : measures.lpsClass === 'II' ? 18.75 : 12.5,
    in_kA: 25,
    up_kV: 1.5,
    uc_V: 255,
    isCoordinatedCascade: true,
    telecomSpdInstalled: true,
    hasFailureSignaling: true
  };

  const updateSpd = (patch: Partial<SpdDetailedConfig>) => {
    onUpdateMeasures({
      spdConfig: {
        ...spd,
        ...patch
      }
    });
  };

  // Normové parametry tříd LPS dle ČSN EN 62305-3
  const lpsDetails: Record<LpsClass, { meshSize: string; downConductorDist: string; sphereRadius: string; pb: string; desc: string }> = {
    none: {
      meshSize: 'Bez soustavy',
      downConductorDist: 'Žádné',
      sphereRadius: 'Bez ochrany',
      pb: 'PB = 1.0 (100% zranitelnost)',
      desc: 'Objekt je bez vnější ochrany před bleskem. Vhodné pouze pro nízké stavby bez nebezpečí pro osoby.'
    },
    IV: {
      meshSize: '20 × 20 m',
      downConductorDist: '20 m',
      sphereRadius: '60 m',
      pb: 'PB = 0.20 (80% účinnost záchytu)',
      desc: 'Základní úroveň ochrany. Vhodné pro nenáročné objekty s malým rizikem požáru a nízkou hustotou osob.'
    },
    III: {
      meshSize: '15 × 15 m',
      downConductorDist: '15 m',
      sphereRadius: '45 m',
      pb: 'PB = 0.10 (90% účinnost záchytu)',
      desc: 'Standardní třída pro běžné rodinné domy, menší bytové domy a neprůmyslové objekty.'
    },
    II: {
      meshSize: '10 × 10 m',
      downConductorDist: '10 m',
      sphereRadius: '30 m',
      pb: 'PB = 0.05 (95% účinnost záchytu)',
      desc: 'Zvýšená ochrana pro průmyslové haly, školy, sklady hořlavých látek a administrativní budovy.'
    },
    I: {
      meshSize: '5 × 5 m',
      downConductorDist: '10 m',
      sphereRadius: '20 m',
      pb: 'PB = 0.02 (98% účinnost záchytu)',
      desc: 'Nejvyšší třída ochrany vyhrazená pro nemocnice, elektrárny, provozy s nebezpečím výbuchu (Ex) a kritickou infrastrukturu.'
    }
  };

  // Katalog reálných přístrojů SPD
  const catalogSpds = [
    {
      id: 'dehn_ventil_tnc',
      brand: 'DEHN',
      name: 'DEHNventil modular M2 TNC 255 FM (obj. 951 305)',
      code: '951 305',
      type: 'Typ 1+2 (TN-C)',
      price: '17 800 Kč',
      iimp: 25,
      in: 25,
      up: 1.5,
      uc: 255,
      tech: 'spark_gap' as SpdTechnologyType,
      net: 'TN-C' as SpdNetworkConfiguration,
      spdClass: 'type_1_plus_2' as SpdClassType
    },
    {
      id: 'dehn_ventil_tns',
      brand: 'DEHN',
      name: 'DEHNventil modular M2 TNS 255 FM (obj. 951 405)',
      code: '951 405',
      type: 'Typ 1+2 (TN-S)',
      price: '21 900 Kč',
      iimp: 25,
      in: 25,
      up: 1.5,
      uc: 255,
      tech: 'spark_gap' as SpdTechnologyType,
      net: 'TN-S' as SpdNetworkConfiguration,
      spdClass: 'type_1_plus_2' as SpdClassType
    },
    {
      id: 'dehn_combo_pv',
      brand: 'DEHN',
      name: 'DEHNcombo YPV 1200 FM (obj. 900 070)',
      code: '900 070',
      type: 'Typ 1+2 pro FVE (DC)',
      price: '12 400 Kč',
      iimp: 12.5,
      in: 20,
      up: 3.8,
      uc: 1200,
      tech: 'varistor_mov' as SpdTechnologyType,
      net: 'TN-S' as SpdNetworkConfiguration,
      spdClass: 'type_1_plus_2' as SpdClassType
    },
    {
      id: 'oez_svbc_tnc',
      brand: 'OEZ',
      name: 'Minia SVBC-12,5-3-MZ (obj. OEZ:42825)',
      code: 'OEZ:42825',
      type: 'Typ 1+2 (TN-C)',
      price: '8 900 Kč',
      iimp: 12.5,
      in: 30,
      up: 1.5,
      uc: 275,
      tech: 'varistor_mov' as SpdTechnologyType,
      net: 'TN-C' as SpdNetworkConfiguration,
      spdClass: 'type_1_plus_2' as SpdClassType
    },
    {
      id: 'oez_svbc_tns',
      brand: 'OEZ',
      name: 'Minia SVBC-12,5-4-MZ (obj. OEZ:42826)',
      code: 'OEZ:42826',
      type: 'Typ 1+2 (TN-S)',
      price: '11 200 Kč',
      iimp: 12.5,
      in: 30,
      up: 1.5,
      uc: 275,
      tech: 'varistor_mov' as SpdTechnologyType,
      net: 'TN-S' as SpdNetworkConfiguration,
      spdClass: 'type_1_plus_2' as SpdClassType
    },
    {
      id: 'saltek_flp_tnc',
      brand: 'SALTEK',
      name: 'FLP-12,5 V/3+0 (obj. A03847)',
      code: 'A03847',
      type: 'Typ 1+2 (TN-C)',
      price: '7 900 Kč',
      iimp: 12.5,
      in: 30,
      up: 1.5,
      uc: 275,
      tech: 'varistor_mov' as SpdTechnologyType,
      net: 'TN-C' as SpdNetworkConfiguration,
      spdClass: 'type_1_plus_2' as SpdClassType
    },
    {
      id: 'saltek_flp_tns',
      brand: 'SALTEK',
      name: 'FLP-12,5 V/4+0 (obj. A03848)',
      code: 'A03848',
      type: 'Typ 1+2 (TN-S)',
      price: '9 800 Kč',
      iimp: 12.5,
      in: 30,
      up: 1.5,
      uc: 275,
      tech: 'varistor_mov' as SpdTechnologyType,
      net: 'TN-S' as SpdNetworkConfiguration,
      spdClass: 'type_1_plus_2' as SpdClassType
    }
  ];

  const spdEval = results.spdEvaluation;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight font-display">
          4. Návrh ochranných opatření LPS a koordinace SPD
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Zvolte třídu vnějšího systému ochrany před bleskem (LPS I až IV) a nakonfigurujte koordinované svodiče bleskových proudů a přepětí (SPD) dle ČSN EN 62305-4 pro spolehlivou ochranu vnitřních sítí.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Levý sloupec: Volba LPS třídy + Detailní modul SPD */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Třída vnějšího LPS */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                Třída vnějšího LPS dle ČSN EN 62305-3
              </h3>
              <span className="text-xs text-blue-400 font-mono font-medium">
                Doporučeno pro R1: LPS {results.recommendedLpsClass}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 text-xs">
              {(['none', 'IV', 'III', 'II', 'I'] as LpsClass[]).map((cls) => {
                const info = lpsDetails[cls];
                const isSelected = measures.lpsClass === cls;
                const isRecommended = results.recommendedLpsClass === cls;

                return (
                  <div
                    key={cls}
                    onClick={() => onUpdateMeasures({ lpsClass: cls })}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">
                          {cls === 'none' ? 'Bez systému LPS' : `Třída LPS ${cls}`}
                        </span>
                        {isRecommended && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                            Doporučeno pro R1 ≤ RT
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-slate-400 text-[11px]">{info.pb}</span>
                    </div>

                    <p className="text-slate-400 text-xs mb-2">{info.desc}</p>

                    {cls !== 'none' && (
                      <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                        <div>Oka: <span className="text-slate-200">{info.meshSize}</span></div>
                        <div>Svody: <span className="text-slate-200">{info.downConductorDist}</span></div>
                        <div>Valivá koule: <span className="text-slate-200">{info.sphereRadius}</span></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. PODROBNÝ MODUL: KOORDINOVANÉ PŘEPĚŤOVÉ OCHRANY (SPD) DLE ČSN EN 62305-4 */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Koordinace přepěťových ochran (SPD) dle ČSN EN 62305-4
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Technické parametry svodičů, úroveň LPL a vliv na redukční koeficient PSPD.
                </p>
              </div>
              <span className="text-xs font-mono px-2 py-1 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 self-start sm:self-auto">
                PSPD = {spdEval?.effectivePspd ?? 0.02}
              </span>
            </div>

            {/* Úroveň LPL pro SPD */}
            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1.5 flex items-center justify-between">
                <span>Normová úroveň koordinované ochrany SPD (LPL):</span>
                <span className="font-mono text-[11px] text-slate-400">ČSN EN 62305-2 tab. B.3</span>
              </label>
              <select
                value={measures.spdLevel}
                onChange={(e) => onUpdateMeasures({ spdLevel: e.target.value as SpdLevel })}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs font-sans focus:outline-none focus:border-amber-500"
              >
                <option value="none">Bez koordinované ochrany SPD (PSPD = 1,0 - vysoké riziko)</option>
                <option value="LPL_IV">SPD úroveň LPL IV (Základní ochrana pro menší objekty) [PSPD = 0,05]</option>
                <option value="LPL_III">SPD úroveň LPL III (Standardní ochrana pro RD a běžné budovy) [PSPD = 0,02]</option>
                <option value="LPL_II">SPD úroveň LPL II (Zvýšená ochrana citlivých technologií) [PSPD = 0,01]</option>
                <option value="LPL_I">SPD úroveň LPL I (Maximální ochrana, servery, nemocnice) [PSPD = 0,005]</option>
              </select>
            </div>

            {measures.spdLevel !== 'none' && (
              <div className="space-y-4 pt-2">
                {/* Typ svodiče + Technologie */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-blue-400" />
                      Typ svodiče (ČSN EN 61643-11)
                    </label>
                    <select
                      value={spd.spdClassType}
                      onChange={(e) => updateSpd({ spdClassType: e.target.value as SpdClassType })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs"
                    >
                      <option value="type_1_plus_2">Typ 1+2 (Kombinovaný svodič pro vstup RH)</option>
                      <option value="type_1">Typ 1 (Bleskový proud 10/350 µs)</option>
                      <option value="type_2">Typ 2 (Pouze přepěťový svodič 8/20 µs)</option>
                      <option value="type_2_plus_3">Typ 2+3 (Pro podružné rozváděče a IT)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                      Technologie zhášení
                    </label>
                    <select
                      value={spd.technology}
                      onChange={(e) => updateSpd({ technology: e.target.value as SpdTechnologyType })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs"
                    >
                      <option value="spark_gap">Jiskřiště (Spark Gap - beznapěťové, nulové vyfukování)</option>
                      <option value="varistor_mov">Varistor (MOV - rychlá odezva &lt; 25 ns)</option>
                      <option value="hybrid_gap_mov">Hybridní (Jiskřiště + Varistor v sérii)</option>
                    </select>
                  </div>
                </div>

                {/* Síťová topologie + Bleskový proud Iimp */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1.5">
                      <Network className="w-3.5 h-3.5 text-emerald-400" />
                      Síťová soustava
                    </label>
                    <select
                      value={spd.networkType}
                      onChange={(e) => updateSpd({ networkType: e.target.value as SpdNetworkConfiguration })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono"
                    >
                      <option value="TN-C">TN-C (3+0 zapojení)</option>
                      <option value="TN-S">TN-S (4+0 / 3+1 zapojení)</option>
                      <option value="TT">TT (3+1 s NPE jiskřištěm)</option>
                      <option value="IT">IT (izolovaná soustava)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">
                      Impulsní proud Iimp (10/350)
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="5"
                        max="100"
                        step="2.5"
                        value={spd.iimp_kA}
                        onChange={(e) => updateSpd({ iimp_kA: parseFloat(e.target.value) || 12.5 })}
                        className="w-full px-2.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-mono text-xs"
                      />
                      <span className="text-slate-400 font-mono text-xs">kA</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">
                      Ochranná hladina Up
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0.5"
                        max="4.0"
                        step="0.1"
                        value={spd.up_kV}
                        onChange={(e) => updateSpd({ up_kV: parseFloat(e.target.value) || 1.5 })}
                        className="w-full px-2.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-mono text-xs"
                      />
                      <span className="text-slate-400 font-mono text-xs">kV</span>
                    </div>
                  </div>
                </div>

                {/* Pokročilé přepínače koordinace */}
                <div className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-2.5 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={spd.isCoordinatedCascade}
                      onChange={(e) => updateSpd({ isCoordinatedCascade: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                    />
                    <span className="text-slate-200 font-medium">
                      Vícestupňová koordinovaná kaskáda (Typ 1 v RH → Typ 2 v patře → Typ 3 u koncových zařízení)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={spd.telecomSpdInstalled}
                      onChange={(e) => updateSpd({ telecomSpdInstalled: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                    />
                    <span className="text-slate-300">
                      Koordinovaná ochrana datových a telekomunikačních linek (svodiče D1/C2 na vstupu)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={spd.hasFailureSignaling}
                      onChange={(e) => updateSpd({ hasFailureSignaling: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                    />
                    <span className="text-slate-300">
                      Dálková bezpotenciálová signalizace poruchy svodiče (FM kontakt do MaR / EPS)
                    </span>
                  </label>
                </div>

                {/* Výběr z katalogu výrobců */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-blue-400" />
                      Rychlé nastavení z katalogu výrobců (DEHN · OEZ · SALTEK)
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">1 kliknutím přenese parametry</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 max-h-44 overflow-y-auto pr-1">
                    {catalogSpds.map((cat) => {
                      const isSel = measures.catalogSpdArticle === cat.code;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            onUpdateMeasures({
                              catalogSpdArticle: cat.code,
                              catalogSpdBrand: cat.brand as any,
                              selectedSpdModel: cat.name,
                              selectedSpdManufacturer: cat.brand,
                              selectedSpdArticleNumber: cat.code,
                              selectedSpdUp_kV: cat.up,
                              selectedSpdIimp_kA: cat.iimp,
                              spdConfig: {
                                ...spd,
                                spdClassType: cat.spdClass,
                                technology: cat.tech,
                                networkType: cat.net,
                                iimp_kA: cat.iimp,
                                in_kA: cat.in,
                                up_kV: cat.up,
                                uc_V: cat.uc
                              }
                            });
                          }}
                          className={`p-2.5 rounded-lg border text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                            isSel
                              ? 'bg-blue-600/25 border-blue-500 text-white font-medium ring-1 ring-blue-500/50'
                              : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-white">{cat.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {cat.type} · Iimp = {cat.iimp} kA · Up = {cat.up} kV
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <div className="text-blue-300 font-bold font-mono">{cat.price}</div>
                            <div className="text-[10px] text-slate-500">{cat.brand}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Doplňková opatření */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-400" />
              Doplňková ochranná a vyrovnávací opatření
            </h4>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={measures.potentialEqualization}
                  onChange={(e) => onUpdateMeasures({ potentialEqualization: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                />
                <span className="text-slate-300">
                  Hlavní ekvipotenciální pospojování (přípojnice MET / MEB dle ČSN EN 62305-3 čl. 6.2)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={measures.warningNotices}
                  onChange={(e) => onUpdateMeasures({ warningNotices: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                />
                <span className="text-slate-300">
                  Varovné výstražné tabulky a mechanické chráničky u svodů (snižuje dotykové napětí)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={measures.shieldingMesh}
                  onChange={(e) => onUpdateMeasures({ shieldingMesh: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                />
                <span className="text-slate-300">
                  Prostorové magnetické stínění LEMP (kovový skelet, armování stěn a podlah)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Pravý sloupec: Živé vyhodnocení koordinace SPD + Dopad na rizika */}
        <div className="lg:col-span-5 space-y-6">
          {/* Karta vyhodnocení koordinace SPD dle ČSN EN 62305-4 */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                Vyhodnocení koordinace SPD dle ČSN EN 62305-4
              </span>
              <span className="font-mono text-xs text-amber-400">
                {spdEval?.isCoordinated ? 'KOORDINOVÁNO' : 'NEKOORDINOVÁNO'}
              </span>
            </h3>

            {spdEval && (
              <div className="space-y-3 text-xs">
                {/* Status bar */}
                <div className={`p-3.5 rounded-lg border ${
                  spdEval.isCoordinated
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                }`}>
                  <div className="flex items-center gap-2 font-bold text-sm mb-1">
                    {spdEval.isCoordinated ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Soustava SPD vyhovuje požadavkům ČSN EN 62305-4</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span>Upozornění: Neshoda v parametrech svodičů</span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] opacity-90">
                    {spdEval.energyCoordinationVerdict}
                  </p>
                </div>

                {/* Technická srovnávací tabulka */}
                <div className="space-y-2 pt-1 font-mono text-[11px]">
                  <div className="flex justify-between p-2 rounded bg-slate-800/70 border border-slate-700/60">
                    <span className="text-slate-400">Efektivní redukce PSPD:</span>
                    <span className="font-bold text-amber-300">
                      {spdEval.effectivePspd} (pokles o {spdEval.riskReductionRatioPct} %)
                    </span>
                  </div>

                  <div className="flex justify-between p-2 rounded bg-slate-800/70 border border-slate-700/60">
                    <span className="text-slate-400">Požadovaný bleskový proud Iimp:</span>
                    <span className={spdEval.iimpAdequate ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {spd.iimp_kA} kA {spdEval.iimpAdequate ? '≥' : '<'} {spdEval.requiredIimp_kA} kA ({spdEval.iimpAdequate ? 'VYHOVUJE' : 'NEDOSTATEČNÉ'})
                    </span>
                  </div>

                  <div className="flex justify-between p-2 rounded bg-slate-800/70 border border-slate-700/60">
                    <span className="text-slate-400">Ochranná hladina Up vs. Uw:</span>
                    <span className={spdEval.protectionLevelAdequate ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {spd.up_kV} kV {spdEval.protectionLevelAdequate ? '≤ 1,5 kV' : '> 1,5 kV'} (Kat. II)
                    </span>
                  </div>
                </div>

                {/* Chráněná rozhraní LPZ */}
                {spdEval.lpzBoundariesProtected.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-slate-400 text-[11px] font-semibold">Chráněná rozhraní zón bleskové ochrany (LPZ):</span>
                    <ul className="space-y-1 text-[11px]">
                      {spdEval.lpzBoundariesProtected.map((b, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 text-indigo-300 font-mono">
                          <CheckCircle2 className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dopad na výsledná rizika R1 a R4 */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Dopad na výsledná rizika
            </h3>

            <div className="space-y-4 text-xs">
              {/* R1 Box */}
              <div className={`p-4 rounded-lg border ${
                results.isR1Safe
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-rose-950/20 border-rose-500/30'
              }`}>
                <div className="flex items-center justify-between font-bold mb-1">
                  <span className={results.isR1Safe ? 'text-emerald-400' : 'text-rose-400'}>
                    Riziko R1 (Ztráta životů)
                  </span>
                  <span className="font-mono text-sm tabular-nums">
                    {formatScientific(results.R1)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px] mb-2 font-mono">
                  <span>Přípustný limit RT:</span>
                  <span>{formatScientific(results.RT1)}</span>
                </div>
                <div className="text-[11px]">
                  {results.isR1Safe ? (
                    <span className="text-emerald-300 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      VYHOVUJE. Riziko úrazu a požáru je pod normovou mezí.
                    </span>
                  ) : (
                    <span className="text-rose-300 flex items-center gap-1 font-medium">
                      <AlertTriangle className="w-4 h-4" />
                      NEVYHOVUJE! Zvolte vyšší třídu LPS nebo instalujte koordinované SPD.
                    </span>
                  )}
                </div>
              </div>

              {/* R4 Box */}
              <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center justify-between font-semibold mb-1">
                  <span className="text-slate-300">Riziko R4 (Hospodářské škody)</span>
                  <span className="font-mono text-sm text-slate-200 tabular-nums">
                    {formatScientific(results.R4)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
                  <span>Přípustný limit RT:</span>
                  <span>{formatScientific(results.RT4)}</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-800/40 border border-slate-700/40 text-[11px] text-slate-400">
              <strong className="text-slate-300">Vyhláška č. 268/2009 Sb. § 36:</strong>
              <p className="mt-1">
                Stavba musí být chráněna před bleskem, jestliže by blesk mohl způsobit ohrožení života nebo zdraví osob, poruchu s velkými hospodářskými následky, nebo ohrožení kulturního dědictví.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
