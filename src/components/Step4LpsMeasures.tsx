import React from 'react';
import { MeasuresData, CalculationResults, LpsClass, SpdLevel } from '../types/lps';
import { formatScientific } from '../utils/docxExport';
import { ShieldCheck, Zap, ShieldAlert, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

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

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight font-display">
          4. Návrh ochranných opatření LPS a koordinace SPD
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Zvolte třídu vnějšího systému ochrany před bleskem (LPS I až IV) a úroveň přepěťových ochran (SPD) pro snížení rizik R1 až R4 pod normové meze RT.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Volba LPS třídy */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                Třída vnějšího LPS dle ČSN EN 62305-3
              </h3>
              <span className="text-xs text-blue-400 font-mono">
                Doporučeno: LPS {results.recommendedLpsClass}
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
                        ? 'bg-blue-600/20 border-blue-500 text-white'
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

            {/* SPD úroveň */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <label className="block text-slate-200 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Koordinovaná ochrana před přepětím (SPD) dle ČSN EN 62305-4
                </span>
                <span className="text-slate-400 font-mono text-xs">LPL I až IV</span>
              </label>

              <select
                value={measures.spdLevel}
                onChange={(e) => onUpdateMeasures({ spdLevel: e.target.value as SpdLevel })}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs font-sans"
              >
                <option value="none">Bez koordinované ochrany SPD (PSPD = 1,0)</option>
                <option value="LPL_IV">SPD úroveň LPL IV (Typ 1+2 svodiče na vstupu) [PSPD = 0,05]</option>
                <option value="LPL_III">SPD úroveň LPL III (Koordinovaná ochrana pro RD) [PSPD = 0,02]</option>
                <option value="LPL_II">SPD úroveň LPL II (Zvýšená ochrana citlivých technologií) [PSPD = 0,01]</option>
                <option value="LPL_I">SPD úroveň LPL I (Maximální ochrana, IT sály, nemocnice) [PSPD = 0,005]</option>
              </select>
            </div>

            {/* Katalog reálných přístrojů SPD (DEHN, OEZ, SALTEK) */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-slate-200 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-blue-400" />
                  Výběr přístroje SPD z reálného katalogu výrobců
                </label>
                <span className="text-[11px] text-blue-400 font-mono">DEHN · OEZ · SALTEK</span>
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                {[
                  { id: 'dehn_ventil_tnc', brand: 'DEHN', name: 'DEHNventil modular M2 TNC 255 FM (obj. 951 305)', code: '951 305', type: 'Typ 1+2 (TN-C)', price: '17 800 Kč', iimp: '25 kA (10/350)' },
                  { id: 'dehn_ventil_tns', brand: 'DEHN', name: 'DEHNventil modular M2 TNS 255 FM (obj. 951 405)', code: '951 405', type: 'Typ 1+2 (TN-S)', price: '21 900 Kč', iimp: '25 kA (10/350)' },
                  { id: 'dehn_combo_pv', brand: 'DEHN', name: 'DEHNcombo YPV 1200 FM (obj. 900 070)', code: '900 070', type: 'Typ 1+2 pro FVE', price: '12 400 Kč', iimp: '12,5 kA (10/350)' },
                  { id: 'oez_svbc_tnc', brand: 'OEZ', name: 'Minia SVBC-12,5-3-MZ (obj. OEZ:42825)', code: 'OEZ:42825', type: 'Typ 1+2 (TN-C)', price: '8 900 Kč', iimp: '12,5 kA (10/350)' },
                  { id: 'oez_svbc_tns', brand: 'OEZ', name: 'Minia SVBC-12,5-4-MZ (obj. OEZ:42826)', code: 'OEZ:42826', type: 'Typ 1+2 (TN-S)', price: '11 200 Kč', iimp: '12,5 kA (10/350)' },
                  { id: 'saltek_flp_tnc', brand: 'SALTEK', name: 'FLP-12,5 V/3+0 (obj. A03847)', code: 'A03847', type: 'Typ 1+2 (TN-C)', price: '7 900 Kč', iimp: '12,5 kA (10/350)' },
                  { id: 'saltek_flp_tns', brand: 'SALTEK', name: 'FLP-12,5 V/4+0 (obj. A03848)', code: 'A03848', type: 'Typ 1+2 (TN-S)', price: '9 800 Kč', iimp: '12,5 kA (10/350)' }
                ].map(spd => {
                  const isSel = measures.catalogSpdArticle === spd.code;
                  return (
                    <button
                      key={spd.id}
                      type="button"
                      onClick={() => onUpdateMeasures({ catalogSpdArticle: spd.code, catalogSpdBrand: spd.brand as any })}
                      className={`p-2.5 rounded-lg border text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                        isSel
                          ? 'bg-blue-600/25 border-blue-500 text-white font-medium'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-white">{spd.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{spd.type} · Iimp = {spd.iimp}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-blue-300 font-bold font-mono">{spd.price}</div>
                        <div className="text-[10px] text-slate-500">{spd.brand}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Doplňková opatření */}
            <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={measures.potentialEqualization}
                  onChange={(e) => onUpdateMeasures({ potentialEqualization: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                />
                <span className="text-slate-300">
                  Hlavní ekvipotenciální pospojování (přípojnice MET / MEB dle čl. 6.2)
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
                  Varovné výstražné tabulky a fyzická ochrana u svodů (snižuje dotykové napětí)
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
                  Prostorové magnetické stínění LEMP (kovový skelet, armování stěn)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Živý dopad opatření na rizika */}
        <div className="lg:col-span-5 space-y-6">
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
