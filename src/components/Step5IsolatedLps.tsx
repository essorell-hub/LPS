import React, { useState } from 'react';
import { IsolatedLpsData, CalculationResults, LpsClass, HviType, RoofLayoutElement } from '../types/lps';
import {
  Zap,
  ShieldCheck,
  AlertOctagon,
  CheckCircle2,
  Sliders,
  Info,
  Cpu,
  ArrowRight,
  Compass,
  Sun,
  Sparkles,
  Calculator,
  LayoutGrid,
  Eye,
  Check
} from 'lucide-react';
import { RoofLayoutEditor } from './RoofLayoutEditor';
import { HviVisualizerGallery } from './HviVisualizerGallery';
import { RollingSphereSagVisualizer } from './RollingSphereSagVisualizer';

interface Step5IsolatedLpsProps {
  isolatedLps: IsolatedLpsData;
  results: CalculationResults;
  currentLpsClass: LpsClass;
  buildingLength?: number;
  buildingWidth?: number;
  onUpdateIsolatedLps: (data: Partial<IsolatedLpsData>) => void;
}

export const Step5IsolatedLps: React.FC<Step5IsolatedLpsProps> = ({
  isolatedLps,
  results,
  currentLpsClass,
  buildingLength = 15,
  buildingWidth = 10,
  onUpdateIsolatedLps
}) => {
  const [activeTab, setActiveTab] = useState<'visualizer' | 'calculator' | 'rollingSphere' | 'layout2d'>('calculator');

  const hviSpecs: Record<HviType, { name: string; airLimit: number; solidLimit: number; desc: string }> = {
    hvi_light: {
      name: 'DEHN HVI light',
      airLimit: 45,
      solidLimit: 90,
      desc: 'Pro menší objekty a rodinné domy s FVE. Ekvivalentní vzdálenost s ≤ 45 cm ve vzduchu / 90 cm v pevném dielektriku.'
    },
    hvi_standard: {
      name: 'DEHN HVI standard',
      airLimit: 75,
      solidLimit: 150,
      desc: 'Univerzální vysokonapěťový izolovaný svod pro bytové domy a průmyslové technologie. Mez s ≤ 75 cm ve vzduchu.'
    },
    hvi_power: {
      name: 'DEHN HVI power',
      airLimit: 90,
      solidLimit: 180,
      desc: 'Maximální izolační odolnost pro náročné průmyslové provozy, nemocnice a vysoké stavby. Mez s ≤ 90 cm ve vzduchu.'
    },
    dehniso_spacer: {
      name: 'DEHNiso distanční vzpěry (GRP)',
      airLimit: 50,
      solidLimit: 100,
      desc: 'Oddálená jímací soustava s mechanickými vzpěrami z plastu vyztuženého skelnými vlákny bez speciálního kabelu.'
    }
  };

  const currentSpec = hviSpecs[isolatedLps.hviType];

  const handleApplyConfigFromGallery = (config: { hviType: HviType; conductorLength?: number; numberOfDownConductors?: number }) => {
    onUpdateIsolatedLps({
      enabled: true,
      hviType: config.hviType,
      numberOfDownConductors: config.numberOfDownConductors || isolatedLps.numberOfDownConductors
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Záhlaví kroku */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight font-display flex items-center gap-2">
          <Zap className="w-6 h-6 text-blue-400" />
          5. Návrh a dimenzování izolovaného hromosvodu (ČSN EN 62305-3)
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Výpočet dostatečné separační vzdálenosti <strong className="text-slate-200">s</strong>, 3D ilustrační schémata různých konfigurací svodů (HVI) na střeše budovy a 2D plánování layoutu prvků.
        </p>
      </div>

      {/* Aktivace modulu a stavový přepínač */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div>
          <div className="font-semibold text-white text-sm">
            Aktivovat modul izolovaného (oddáleného) hromosvodu v projektu
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Zahrne podrobnou samostatnou kapitolu s exaktním výpočtem vzorce s = ki · (kc/km) · l do Word technické zprávy.
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isolatedLps.enabled}
            onChange={(e) => onUpdateIsolatedLps({ enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {/* Navigační taby pro přepínání pohledů */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('visualizer')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'visualizer'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 font-bold'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>3D Schémata instalace HVI</span>
          <span className="px-1.5 py-0.2 rounded bg-blue-500/30 text-[10px] text-blue-200">
            4 konfigurace
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calculator')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'calculator'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 font-bold'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4 text-blue-300" />
          <span>Matematický kalkulátor (s)</span>
          <span className="font-mono text-[10px] text-slate-300">
            {results.separationDistance_s_cm} cm
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rollingSphere')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'rollingSphere'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 font-bold'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Compass className="w-4 h-4 text-cyan-300" />
          <span>Řez valící se koulí & Průvěs p</span>
          <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-[10px] text-cyan-300 font-mono">
            r = {results.rollingSphereRadius} m
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('layout2d')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'layout2d'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 font-bold'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <LayoutGrid className="w-4 h-4 text-emerald-300" />
          <span>2D Půdorysný editor střechy</span>
        </button>
      </div>

      {/* 1. TAB: 3D TECHNICKÁ VIZUALIZACE INSTALACÍ (HVI SCHÉMATA) */}
      {activeTab === 'visualizer' && (
        <HviVisualizerGallery
          currentLpsClass={currentLpsClass}
          currentIsolatedLps={isolatedLps}
          results={results}
          onApplyConfig={handleApplyConfigFromGallery}
        />
      )}

      {/* 2. TAB: MATEMATICKÝ KALKULÁTOR VZORCE S A VALÍCÍ SE KOULE */}
      {activeTab === 'calculator' && (
        isolatedLps.enabled ? (
          <div className="space-y-6 animate-in fade-in">
            {/* Živý kalkulátor vzorce s */}
            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                    Matematický model dostatečné vzdálenosti (s)
                  </h3>
                  <div className="text-xs text-slate-400 mt-0.5 font-mono">
                    ČSN EN 62305-3 ed. 2, článek 6.3
                  </div>
                </div>

                {/* Vzorec */}
                <div className="px-4 py-2 rounded-lg bg-blue-950/40 border border-blue-800/40 text-blue-200 font-mono text-sm font-bold flex items-center gap-2">
                  <span>s = ki · (kc / km) · l</span>
                  <span>=</span>
                  <span className="text-emerald-400">{results.separationDistance_s_cm} cm</span>
                </div>
              </div>

              {/* Vstupní proměnné vzorce */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                {/* ki */}
                <div className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">Koeficient ki (třída LPS)</span>
                    <span className="font-mono text-blue-400 font-bold">{results.ki_factor}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Odpovídá navržené třídě <strong className="text-white">LPS {currentLpsClass}</strong>.
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    LPS I: 0.08 | LPS II: 0.06 | LPS III/IV: 0.04
                  </div>
                </div>

                {/* kc */}
                <div className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">Koeficient kc (svody)</span>
                    <span className="font-mono text-blue-400 font-bold">{results.kc_factor}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Rozdělení bleskového proudu mezi svody.
                  </div>
                  <select
                    value={isolatedLps.numberOfDownConductors}
                    onChange={(e) => onUpdateIsolatedLps({ numberOfDownConductors: parseInt(e.target.value, 10), customKc: 0 })}
                    className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="1">1 svod (kc = 1.0)</option>
                    <option value="2">2 svody (kc = 0.66)</option>
                    <option value="3">3 a více svodů / mříž (kc = 0.44)</option>
                  </select>
                </div>

                {/* km */}
                <div className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">Koeficient km (materiál)</span>
                    <span className="font-mono text-blue-400 font-bold">{results.km_factor}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Izolační vlastnosti prostředí.
                  </div>
                  <select
                    value={isolatedLps.insulationMaterial}
                    onChange={(e) => onUpdateIsolatedLps({ insulationMaterial: e.target.value as 'air' | 'solid' })}
                    className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="air">Vzduch (km = 1.0)</option>
                    <option value="solid">Pevný materiál / zdivo (km = 0.5)</option>
                  </select>
                </div>

                {/* l */}
                <div className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">Délka svodu l [m]</span>
                    <span className="font-mono text-blue-400 font-bold">{isolatedLps.conductorLength} m</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Od bodu přiblížení k uzemnění / HOP.
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="0.5"
                    value={isolatedLps.conductorLength}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val > 0) onUpdateIsolatedLps({ conductorLength: val });
                    }}
                    className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Dva sloupce: Výběr HVI technologie + Vyhodnocení */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-5">
                <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-400" />
                    Výběr technologie izolovaného svodu (DEHN HVI)
                  </h3>

                  <div>
                    <label className="block text-slate-400 text-xs font-medium mb-1.5">
                      Chráněné střešní zařízení / technologie
                    </label>
                    <input
                      type="text"
                      value={isolatedLps.protectedEquipment}
                      onChange={(e) => onUpdateIsolatedLps({ protectedEquipment: e.target.value })}
                      placeholder="např. Fotovoltaická elektrárna FVE 15 kWp a DC rozvody"
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {(Object.keys(hviSpecs) as HviType[]).map((key) => {
                      const spec = hviSpecs[key];
                      const isSelected = isolatedLps.hviType === key;
                      const maxDist = isolatedLps.insulationMaterial === 'solid' ? spec.solidLimit : spec.airLimit;
                      const isSuitable = results.separationDistance_s_cm <= maxDist;

                      return (
                        <div
                          key={key}
                          onClick={() => onUpdateIsolatedLps({ hviType: key })}
                          className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600/20 border-blue-500 text-white'
                              : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-sm">{spec.name}</span>
                            <span className="font-mono text-xs font-semibold text-blue-400">
                              Ekvivalent s ≤ {maxDist} cm
                            </span>
                          </div>
                          <p className="text-slate-400 text-xs">{spec.desc}</p>
                          <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                            <span className="text-slate-400">
                              Stav pro požadovaných {results.separationDistance_s_cm} cm:
                            </span>
                            {isSuitable ? (
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Vyhovuje s rezervou {(maxDist - results.separationDistance_s_cm).toFixed(1)} cm
                              </span>
                            ) : (
                              <span className="text-rose-400 font-semibold flex items-center gap-1">
                                <AlertOctagon className="w-3.5 h-3.5" />
                                Nedostatečné o {(results.separationDistance_s_cm - maxDist).toFixed(1)} cm
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Grafické schéma a posouzení bezpečnosti */}
              <div className="lg:col-span-5 space-y-5">
                <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                    Vyhodnocení a diagram oddálení
                  </h3>

                  {/* Výsledkový verdict box */}
                  <div className={`p-4 rounded-lg border text-xs ${
                    results.isIsolatedLpsSafe
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                  }`}>
                    <div className="flex items-center gap-2 font-bold text-sm mb-1.5">
                      {results.isIsolatedLpsSafe ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span>SPLŇUJE ČSN EN 62305-3</span>
                        </>
                      ) : (
                        <>
                          <AlertOctagon className="w-5 h-5 text-rose-400" />
                          <span>NEBEZPEČÍ PŘESKOKU!</span>
                        </>
                      )}
                    </div>
                    <p className="leading-relaxed text-slate-300">
                      {results.isolatedLpsVerdict}
                    </p>
                  </div>

                  {/* Grafické schéma oddáleného hromosvodu */}
                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-center">
                    <div className="text-[11px] text-slate-400 mb-2 font-medium">
                      Schéma ochrany FVE / technologie vodičem DEHN HVI
                    </div>
                    <svg viewBox="0 0 260 170" className="w-full h-40 mx-auto">
                      <line x1="20" y1="140" x2="240" y2="140" stroke="#475569" strokeWidth="3" />
                      <polygon
                        points="100,138 180,138 160,105 80,105"
                        fill="#1e3a8a"
                        stroke="#3b82f6"
                        strokeWidth="1.5"
                      />
                      <text x="130" y="125" fill="#93c5fd" fontSize="9" textAnchor="middle" fontWeight="bold">
                        FVE panely
                      </text>
                      <line x1="50" y1="140" x2="50" y2="40" stroke="#94a3b8" strokeWidth="2.5" />
                      <polygon points="50,30 47,40 53,40" fill="#f8fafc" />
                      <path
                        d="M 50,55 Q 55,90 50,140"
                        fill="none"
                        stroke="#e11d48"
                        strokeWidth="2.5"
                        strokeDasharray="4 2"
                      />
                      <line x1="53" y1="105" x2="78" y2="105" stroke={results.isIsolatedLpsSafe ? '#10b981' : '#f43f5e'} strokeWidth="1.5" strokeDasharray="2 2" />
                      <circle cx="53" cy="105" r="2" fill={results.isIsolatedLpsSafe ? '#10b981' : '#f43f5e'} />
                      <circle cx="78" cy="105" r="2" fill={results.isIsolatedLpsSafe ? '#10b981' : '#f43f5e'} />
                      <text x="66" y="98" fill={results.isIsolatedLpsSafe ? '#34d399' : '#fb7185'} fontSize="10" textAnchor="middle" fontWeight="bold">
                        s = {results.separationDistance_s_cm} cm
                      </text>
                      <path
                        d="M 50,10 L 45,24 L 52,24 L 48,35"
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="2"
                      />
                    </svg>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Izolovaný svod DEHN HVI zamezuje bleskovému proudu vniknout do nosné konstrukce FVE.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Metoda valící se koule a ochranného úhlu s interaktivním řezem */}
            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-5">
              <RollingSphereSagVisualizer
                lpsClass={currentLpsClass}
                twoRodsDistance={isolatedLps.twoRodsDistance || 6.0}
                rodHeight={isolatedLps.rodHeight || 2.5}
                objectHeight={1.1}
                objectType="pv_panel"
                onUpdateParams={({ twoRodsDistance, rodHeight }) => {
                  const patch: Partial<IsolatedLpsData> = {};
                  if (twoRodsDistance !== undefined) patch.twoRodsDistance = twoRodsDistance;
                  if (rodHeight !== undefined) patch.rodHeight = rodHeight;
                  onUpdateIsolatedLps(patch);
                }}
              />
            </div>
          </div>
        ) : (
          <div className="p-12 text-center rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <Zap className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">
              Izolovaný hromosvod není v projektu aktivován
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Aktivujte modul pro výpočet exaktního vzorce s = ki · (kc/km) · l a ověření odstupu od střešních zařízení.
            </p>
            <button
              onClick={() => onUpdateIsolatedLps({ enabled: true })}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors cursor-pointer"
            >
              Aktivovat výpočet dostatečné vzdálenosti s
            </button>
          </div>
        )
      )}

      {/* 2. TAB: DEDIKOVANÝ ŘEZ VALÍCÍ SE KOULÍ */}
      {activeTab === 'rollingSphere' && (
        <div className="space-y-6 animate-in fade-in">
          <RollingSphereSagVisualizer
            lpsClass={currentLpsClass}
            twoRodsDistance={isolatedLps.twoRodsDistance || 6.0}
            rodHeight={isolatedLps.rodHeight || 2.5}
            objectHeight={1.1}
            objectType="pv_panel"
            onUpdateParams={({ twoRodsDistance, rodHeight }) => {
              const patch: Partial<IsolatedLpsData> = {};
              if (twoRodsDistance !== undefined) patch.twoRodsDistance = twoRodsDistance;
              if (rodHeight !== undefined) patch.rodHeight = rodHeight;
              onUpdateIsolatedLps(patch);
            }}
          />
        </div>
      )}

      {/* 3. TAB: 2D PŮDORYSNÝ EDITOR STŘECHY */}
      {activeTab === 'layout2d' && (
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                2D Interaktivní půdorys střechy a ověření odstupu prvků
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Rozmístěte FVE panely, střídač a jímací tyče tažením myši. Aplikace v reálném čase kontroluje minimální vzdálenost s = {results.separationDistance_s_cm} cm.
              </p>
            </div>
          </div>

          <RoofLayoutEditor
            length={buildingLength}
            width={buildingWidth}
            elements={isolatedLps.roofElements || [
              { id: 'el_pv1', type: 'pv_array', x: 2, y: 1.5, width: 7, height: 3.5, name: 'FVE pole Jih' },
              { id: 'el_rod1', type: 'air_rod', x: 10, y: 3, width: 0.6, height: 0.6, name: 'Jímací tyč JT1' }
            ]}
            onChange={(els) => onUpdateIsolatedLps({ roofElements: els })}
            separationDistance_s_cm={results.separationDistance_s_cm}
          />
        </div>
      )}
    </div>
  );
};
