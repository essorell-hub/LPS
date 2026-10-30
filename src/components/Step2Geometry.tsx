import React, { useState } from 'react';
import {
  BuildingData,
  LocationFactorType,
  CalculationResults,
  LpsClass,
  PvInstallationData,
  PvMountingType,
  PvDcRoutingType,
  PvInverterLocation
} from '../types/lps';
import { getCd, calculatePvEvaluation } from '../utils/lpsCalculations';
import { HviVisualizerGallery } from './HviVisualizerGallery';
import { SurroundingShieldingModule } from './SurroundingShieldingModule';
import {
  Maximize2,
  Compass,
  Layers,
  Sun,
  ShieldAlert,
  ShieldCheck,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Info,
  Sliders,
  Cable,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface Step2GeometryProps {
  building: BuildingData;
  results: CalculationResults;
  currentLpsClass?: LpsClass;
  onUpdateBuilding: (building: Partial<BuildingData>) => void;
}

export const Step2Geometry: React.FC<Step2GeometryProps> = ({
  building,
  results,
  currentLpsClass = 'III',
  onUpdateBuilding
}) => {
  const cdValue = getCd(building.locationFactor);
  const [isHviModalOpen, setIsHviModalOpen] = useState<boolean>(false);

  // Výchozí nebo existující data FVE
  const pv: PvInstallationData = building.pvInstallation || {
    enabled: false,
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
    conductorLengthL: Math.max(2, Math.round((building.height + 2) * 10) / 10),
    downConductorCount: 2,
    customKc: 0.66,
    dielectricMedium: 'air'
  };

  // Výpočet parametrů FVE pro aktuální stav
  const pvEval = results.pvEvaluation || calculatePvEvaluation(building, currentLpsClass, pv);

  const updatePv = (patch: Partial<PvInstallationData>) => {
    const updated: PvInstallationData = { ...pv, ...patch };
    // Pokud se změní počet panelů a nebyla zadána specifická plocha, dopočítat
    if (patch.panelCount && !patch.panelAreaM2) {
      updated.panelAreaM2 = Math.round(patch.panelCount * 1.95 * 10) / 10;
    }
    onUpdateBuilding({ pvInstallation: updated });
  };

  const roofArea = Math.round(building.length * building.width * 10) / 10;
  const pvCoveragePct = pv.enabled
    ? Math.min(100, Math.round(((pv.panelAreaM2 || pv.panelCount * 1.95) / Math.max(1, roofArea)) * 1000) / 10)
    : 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Nadpis sekce */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight font-display flex items-center gap-2">
          <Maximize2 className="w-5 h-5 text-blue-400" />
          2. Geometrie stavby, sběrná plocha (Ad) a střešní FVE
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Zadejte vnější rozměry objektu, polohový koeficient Cd a posuďte vliv instalované střešní fotovoltaické elektrárny na sběrnou plochu stavby a dostatečnou oddělovací vzdálenost <strong>s</strong> dle ČSN EN 62305-2, ČSN EN 62305-3 a ČSN CLC/TS 51643-32.
        </p>
      </div>

      {/* 1. Základní geometrie stavby a sběrná plocha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulářová pole stavby */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-5">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-blue-400" />
              Vnější rozměry stavby [m]
            </h3>

            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1.5">
                  Délka (L) [m]
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={building.length}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0) onUpdateBuilding({ length: val });
                  }}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1.5">
                  Šířka (W) [m]
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={building.width}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0) onUpdateBuilding({ width: val });
                  }}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1.5">
                  Výška (H) [m]
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={building.height}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0) onUpdateBuilding({ height: val });
                  }}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-mono text-sm focus:outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">k hřebeni / atice</span>
              </div>
            </div>

            {/* Činitel polohy Cd */}
            <div className="pt-3 border-t border-slate-800">
              <label className="text-slate-400 text-xs font-medium mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-blue-400" />
                  Činitel polohy stavby (Cd dle tabulky A.1)
                </span>
                <span className="font-mono text-xs font-semibold">
                  {results.surroundingShielding?.hasShielding ? (
                    <span className="text-indigo-300">
                      Cd,eff = {results.surroundingShielding.effectiveCd} <span className="text-slate-500 font-normal">(pův. {cdValue})</span>
                    </span>
                  ) : (
                    <span className="text-blue-400">Cd = {cdValue}</span>
                  )}
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'isolated', label: 'Samostatně stojící objekt', cd: 'Cd = 1.0', desc: 'Na rovině bez okolních vyšších překážek' },
                  { id: 'on_hilltop', label: 'Na vrcholu kopce / ostrohu', cd: 'Cd = 2.0', desc: 'Zvýšená expozice bleskům' },
                  { id: 'surrounded_by_trees', label: 'Obklopený objekty stejné výšky', cd: 'Cd = 0.5', desc: 'Běžná zástavba / stromy' },
                  { id: 'surrounded_by_objects', label: 'Obklopený vyššími objekty', cd: 'Cd = 0.25', desc: 'Hustá městská zástavba' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onUpdateBuilding({ locationFactor: item.id as LocationFactorType })}
                    className={`p-3 rounded-lg text-left border transition-all cursor-pointer ${
                      building.locationFactor === item.id
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span>{item.label}</span>
                      <span className="font-mono text-[11px] text-blue-400">{item.cd}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Typ konstrukce stavby */}
            <div className="pt-3 border-t border-slate-800">
              <label className="block text-slate-400 text-xs font-medium mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                Konstrukční materiál objektu
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'masonry', label: 'Zděná / cihla' },
                  { id: 'concrete_steel', label: 'Železobeton / ocel' },
                  { id: 'wood', label: 'Dřevostavba' },
                  { id: 'flammable_roof', label: 'Hořlavá střecha' }
                ].map((mat) => (
                  <button
                    key={mat.id}
                    type="button"
                    onClick={() => onUpdateBuilding({ structureType: mat.id as any })}
                    className={`p-2 rounded-lg text-center border transition-all cursor-pointer ${
                      building.structureType === mat.id
                        ? 'bg-blue-600/20 border-blue-500 text-white font-medium'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {mat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Vypočtené sběrné plochy a grafické schéma */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Výsledné sběrné plochy a frekvence
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/70 border border-slate-700/60">
                <div>
                  <div className="text-slate-400 font-medium">Sběrná plocha stavby (Ad)</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {pv.enabled && pv.rackProtrusionHeight > 0
                      ? `Ad (Heff = ${(building.height + pv.rackProtrusionHeight).toFixed(2)} m)`
                      : 'Ad = L·W + 6H(L+W) + 9πH²'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-base font-bold text-white tabular-nums">
                    {results.Ad.toLocaleString('cs-CZ')} m²
                  </div>
                  {pv.enabled && pvEval.deltaAd_m2 > 0 && (
                    <div className="text-[10px] text-amber-400 flex items-center justify-end gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +{pvEval.deltaAd_m2} m² vlivem FVE
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/70 border border-slate-700/60">
                <div>
                  <div className="text-slate-400 font-medium">Sběrná plocha okolí stavby (Am)</div>
                  <div className="text-[11px] text-slate-500 font-mono">Am = 1000(L+W) + π·500²</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-base font-bold text-slate-300 tabular-nums">
                    {(results.Am / 1000).toFixed(0)} tis. m²
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-950/30 border border-blue-800/40">
                <div>
                  <div className="text-blue-300 font-medium">Frekvence úderů do stavby (Nd)</div>
                  <div className="text-[11px] text-blue-400/80 font-mono">Nd = Ng · Ad · Cd · 10⁻⁶</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-bold text-blue-200 tabular-nums">
                    {results.Nd.toExponential(3)} /rok
                  </div>
                  <div className="text-[10px] text-slate-400">
                    1 úder za {(1 / Math.max(0.00001, results.Nd)).toFixed(0)} let
                  </div>
                </div>
              </div>
            </div>

            {/* Schéma 3H zóny */}
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400 mb-2 font-medium">
                Schéma sběrné plochy Ad (dosah 3 × výška H = {(3 * (pv.enabled && pv.rackProtrusionHeight > 0 ? building.height + pv.rackProtrusionHeight : building.height)).toFixed(1)} m)
              </div>
              <svg viewBox="0 0 240 140" className="w-full h-28 mx-auto text-slate-400">
                {/* 3H buffer zone */}
                <rect
                  x="30"
                  y="15"
                  width="180"
                  height="110"
                  rx="30"
                  fill="#1e3a8a"
                  fillOpacity="0.25"
                  stroke="#3b82f6"
                  strokeDasharray="3 3"
                />
                {/* Building footprint */}
                <rect
                  x="75"
                  y="40"
                  width="90"
                  height="60"
                  fill="#334155"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                />
                {/* FVE indicator on footprint */}
                {pv.enabled && (
                  <rect
                    x="85"
                    y="48"
                    width="70"
                    height="44"
                    fill="#0284c7"
                    fillOpacity="0.35"
                    stroke="#38bdf8"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}
                <text x="120" y="65" fill="#f8fafc" fontSize="10" textAnchor="middle" fontWeight="bold">
                  {building.length} × {building.width} m
                </text>
                <text x="120" y="78" fill={pv.enabled ? "#7dd3fc" : "#94a3b8"} fontSize="8" textAnchor="middle">
                  {pv.enabled ? `FVE ${pv.powerKwp} kWp (${pvCoveragePct} % střechy)` : `H = ${building.height} m`}
                </text>
                <text x="120" y="27" fill="#60a5fa" fontSize="8" textAnchor="middle">
                  3H buffer ({ (3 * (pv.enabled && pv.rackProtrusionHeight > 0 ? building.height + pv.rackProtrusionHeight : building.height)).toFixed(1) } m)
                </text>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. MODUL: VLIV OKOLNÍCH STAVEB, STÍNĚNÍ A VLNOVÉHO POLE      */}
      {/* ============================================================ */}
      <SurroundingShieldingModule
        building={building}
        evaluation={results.surroundingShielding}
        onUpdateBuilding={onUpdateBuilding}
      />

      {/* ============================================================ */}
      {/* 3. PODROBNÝ MODUL: STŘEŠNÍ FOTOVOLTAICKÁ INSTALACE (FVE)      */}
      {/* ============================================================ */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl">
        {/* Horní hlavička modulu s přepínačem */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl ${pv.enabled ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400'}`}>
              <Sun className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Střešní fotovoltaická instalace (FVE) & Posouzení rizik LPS
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  ČSN EN 62305-3 / CLC/TS 51643-32
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Výpočet vlivu na sběrnou plochu stavby a ověření nutnosti navýšení oddělovací vzdálenosti <strong>s</strong> pro zamezení přeskoku bleskového proudu na DC rozvody.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={pv.enabled}
              onChange={(e) => updatePv({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            <span className="ml-2.5 text-xs font-semibold text-slate-200">
              {pv.enabled ? 'FVE aktivní' : 'Bez FVE'}
            </span>
          </label>
        </div>

        {pv.enabled ? (
          <div className="space-y-6">
            {/* Status bar se souhrnem klíčových ukazatelů */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-medium">Instalovaný výkon</div>
                <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">{pv.powerKwp} kWp</div>
                <div className="text-[10px] text-slate-500">{pv.panelCount} panelů ({pv.panelAreaM2 || Math.round(pv.panelCount * 1.95)} m²)</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-medium">Pokrytí plochy střechy</div>
                <div className="text-lg font-bold text-white font-mono mt-0.5">{pvCoveragePct} %</div>
                <div className="text-[10px] text-slate-500">ze střechy {roofArea} m²</div>
              </div>

              <div className={`p-3 rounded-xl border ${
                pvEval.isSeparationMaintained
                  ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                  : 'bg-rose-950/30 border-rose-800/50 text-rose-300'
              }`}>
                <div className="text-[11px] font-medium opacity-80">Oddělovací vzdálenost s</div>
                <div className="text-lg font-bold font-mono mt-0.5">
                  d = {pv.shortestDistanceToLpsCm} cm {pvEval.isSeparationMaintained ? '≥' : '<'} {pvEval.separationDistance_s_cm} cm
                </div>
                <div className="text-[10px] font-semibold">
                  {pvEval.isSeparationMaintained ? '✓ VYHOVUJE (ODDĚLENO)' : '⚠ NEVYHOVUJE (PŘESKOK)'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-medium">Požadovaná SPD ochrana</div>
                <div className="text-base font-bold text-blue-400 font-mono mt-0.5">{pvEval.requiredSpdDC}</div>
                <div className="text-[10px] text-slate-500">
                  {pvEval.isSeparationMaintained ? 'Typ 2 postačuje' : 'Povinný Typ 1+2 (Iimp)'}
                </div>
              </div>
            </div>

            {/* Dva sloupce: Parametry FVE + Výpočet separační vzdálenosti */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Levé: Technická specifikace a geometrické převýšení FVE */}
              <div className="lg:col-span-6 space-y-4">
                <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-4">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-400" />
                    Geometrické parametry FVE instalace
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 font-medium mb-1">
                        Výkon FVE [kWp]
                      </label>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={pv.powerKwp}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val > 0) updatePv({ powerKwp: val });
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-medium mb-1">
                        Počet modulů [ks]
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={pv.panelCount}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val > 0) updatePv({ panelCount: val });
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Způsob montáže konstrukce */}
                  <div className="text-xs space-y-1.5">
                    <label className="block text-slate-400 font-medium">
                      Typ nosné konstrukce a orientace
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'pitched_coplanar', label: 'Šikmá střecha koplanární', hDef: 0.2 },
                        { id: 'flat_elevated', label: 'Plochá střecha se sklonem', hDef: 0.8 },
                        { id: 'integrated_bipv', label: 'BIPV integrovaná krytina', hDef: 0.0 },
                        { id: 'facade', label: 'Fasádní systém', hDef: 0.3 }
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => updatePv({
                            mountingType: m.id as PvMountingType,
                            rackProtrusionHeight: m.hDef
                          })}
                          className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                            pv.mountingType === m.id
                              ? 'bg-amber-500/20 border-amber-500 text-amber-200 font-medium'
                              : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="text-[11px] font-semibold">{m.label}</div>
                          <div className="text-[10px] text-slate-400">ΔH = {m.hDef} m</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Převýšení nad střechou ΔH a vliv na výšku budovy */}
                  <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-800/80">
                    <div>
                      <label className="block text-slate-400 font-medium mb-1">
                        Sklon panelů [°]
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="90"
                        step="5"
                        value={pv.elevationAngleDeg}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) updatePv({ elevationAngleDeg: val });
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-medium mb-1 flex items-center justify-between">
                        <span>Převýšení ΔH [m]</span>
                        <span className="text-[10px] text-amber-400 font-mono">
                          Heff = {(building.height + pv.rackProtrusionHeight).toFixed(2)} m
                        </span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.05"
                        value={pv.rackProtrusionHeight}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val >= 0) updatePv({ rackProtrusionHeight: val });
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {pv.rackProtrusionHeight > 0 && (
                    <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-800/40 text-[11px] text-amber-300 flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>Vliv na sběrnou plochu:</strong> Vyvýšená konstrukce panelů o {pv.rackProtrusionHeight} m zvyšuje efektivní výšku budovy na <strong>{(building.height + pv.rackProtrusionHeight).toFixed(2)} m</strong>, což rozšiřuje sběrnou plochu stavby Ad o <strong>+{pvEval.deltaAd_m2} m²</strong> (z původních {pvEval.baseAd_m2} m² na {pvEval.effectiveAd_m2} m²).
                      </div>
                    </div>
                  )}
                </div>

                {/* DC kabeláž a požární riziko dle ČSN CLC/TS 51643-32 */}
                <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Cable className="w-4 h-4 text-blue-400" />
                    Kabelové trasy DC a umístění střídače
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 font-medium mb-1">
                        Uložení DC vedení ze střechy
                      </label>
                      <select
                        value={pv.dcCableRouting}
                        onChange={(e) => updatePv({ dcCableRouting: e.target.value as PvDcRoutingType })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="metal_shielded_tray">Stíněný plechový žlab (uzemněný)</option>
                        <option value="interior_shaft">Požárně odolná šachta uvnitř</option>
                        <option value="unshielded_exterior">Nestíněný venkovní svod po fasádě</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-medium mb-1">
                        Plocha indukční smyčky vodičů
                      </label>
                      <select
                        value={pv.dcCableLoopArea}
                        onChange={(e) => updatePv({ dcCableLoopArea: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="minimized_tight">Minimalizovaná (DC+ a DC- v souběhu)</option>
                        <option value="large_loops">Rozvolněná (velká plocha smyčky)</option>
                      </select>
                    </div>
                  </div>

                  <div className="text-xs">
                    <label className="block text-slate-400 font-medium mb-1">
                      Umístění střídače (inverteru)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'technical_room_ground', label: 'Tech. místnost (1.NP)' },
                        { id: 'cellar', label: 'Suterén / sklep' },
                        { id: 'attic_under_roof', label: 'Podkroví / půda' },
                        { id: 'exterior_roof', label: 'Venku na střeše' }
                      ].map((loc) => (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => updatePv({ inverterLocation: loc.id as PvInverterLocation })}
                          className={`p-2 rounded-lg text-center border text-[11px] cursor-pointer transition-all ${
                            pv.inverterLocation === loc.id
                              ? 'bg-blue-600/20 border-blue-500 text-white font-medium'
                              : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {loc.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {pv.dcCableLoopArea === 'large_loops' && (
                    <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-800/40 text-[11px] text-rose-300 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>Varování ČSN CLC/TS 51643-32:</strong> Velká plocha smyčky mezi kladným a záporným pólem DC vodičů mnohonásobně zvyšuje indukované přepětí při blízkém úderu blesku! Vodiče DC+ a DC- musí být vedeny v těsném souběhu.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Pravé: Výpočet a posouzení separační vzdálenosti 's' */}
              <div className="lg:col-span-6 space-y-4">
                <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-400" />
                      Výpočet oddělovací vzdálenosti s (ČSN EN 62305-3)
                    </h4>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-700/50">
                      s = ki · (kc / km) · l
                    </span>
                  </div>

                  {/* Interaktivní parametry výpočtu s */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 font-medium mb-1">
                        Třída LPS (koeficient ki)
                      </label>
                      <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center justify-between font-mono">
                        <span className="text-slate-300">Třída {currentLpsClass}</span>
                        <span className="text-blue-400 font-bold">ki = {pvEval.ki_factor}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">LPS I: 0.08, II: 0.06, III/IV: 0.04</span>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-medium mb-1">
                        Počet svodů (koeficient kc)
                      </label>
                      <select
                        value={pv.downConductorCount}
                        onChange={(e) => updatePv({ downConductorCount: parseInt(e.target.value, 10) })}
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="1">1 svod (kc = 1.0)</option>
                        <option value="2">2 svody (kc = 0.66)</option>
                        <option value="3">3 svody (kc = 0.44)</option>
                        <option value="4">4 a více svodů / mříž (kc = 0.44)</option>
                      </select>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Dělí bleskový proud do svodů</span>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-medium mb-1">
                        Materiál dielektrika (km)
                      </label>
                      <select
                        value={pv.dielectricMedium}
                        onChange={(e) => updatePv({ dielectricMedium: e.target.value as 'air' | 'solid' })}
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="air">Vzduch (km = 1.0)</option>
                        <option value="solid">Pevný materiál / zdivo (km = 0.5)</option>
                      </select>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">V pevném izolantu se s zdvojnásobuje</span>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-medium mb-1">
                        Délka svodu k zemi (l) [m]
                      </label>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={pv.conductorLengthL}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val > 0) updatePv({ conductorLengthL: val });
                        }}
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">k nejbližšímu pospojení/uzemnění</span>
                    </div>
                  </div>

                  {/* Výsledná vypočtená hodnota s */}
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400 font-medium">Vypočtená dostatečná vzdálenost:</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        s = {pvEval.ki_factor} · ({pvEval.kc_factor} / {pvEval.km_factor}) · {pvEval.conductorLength_l_m} m
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-extrabold text-blue-400 font-mono">
                        s = {pvEval.separationDistance_s_cm} cm
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        ({pvEval.separationDistance_s_meters} m)
                      </div>
                    </div>
                  </div>

                  {/* Interaktivní nastavení a porovnání skutečné vzdálenosti d */}
                  <div className="pt-2 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <label className="text-slate-300 font-semibold">
                        Skutečná vzdálenost d od hromosvodu:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="300"
                          step="1"
                          value={pv.shortestDistanceToLpsCm}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val >= 0) updatePv({ shortestDistanceToLpsCm: val });
                          }}
                          className="w-20 px-2 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-center text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                        />
                        <span className="text-slate-400 text-xs">cm</span>
                      </div>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="150"
                      step="1"
                      value={pv.shortestDistanceToLpsCm}
                      onChange={(e) => updatePv({ shortestDistanceToLpsCm: parseFloat(e.target.value) })}
                      className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                    />

                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span>0 cm (přímý kontakt)</span>
                      <span className="text-blue-400 font-semibold">s = {pvEval.separationDistance_s_cm} cm</span>
                      <span>150 cm (velký odstup)</span>
                    </div>
                  </div>

                  {/* Technické vyhodnocení verdiktu (Dodrženo vs Nedodrženo) */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    pvEval.isSeparationMaintained
                      ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-950/30 border-rose-500/50 text-rose-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      {pvEval.isSeparationMaintained ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-1.5 text-xs">
                        <div className="font-bold text-sm tracking-tight flex items-center gap-2">
                          {pvEval.isSeparationMaintained ? (
                            <span className="text-emerald-400">
                              ODDĚLOVACÍ VZDÁLENOST DODRŽENA (d ≥ s)
                            </span>
                          ) : (
                            <span className="text-rose-400">
                              POZOR: ODDĚLOVACÍ VZDÁLENOST NEDODRŽENA (d &lt; s)
                            </span>
                          )}
                          <span className="text-[11px] font-mono opacity-80 font-normal">
                            (rezerva: {pvEval.isSeparationMaintained ? `+${(pv.shortestDistanceToLpsCm - pvEval.separationDistance_s_cm).toFixed(1)} cm` : `${(pv.shortestDistanceToLpsCm - pvEval.separationDistance_s_cm).toFixed(1)} cm`})
                          </span>
                        </div>

                        <p className="text-[11px] leading-relaxed text-slate-300">
                          {pvEval.verdict}
                        </p>

                        <div className="pt-2 border-t border-slate-700/50 space-y-1 text-[11px]">
                          <div className="font-semibold text-white">Technická opatření pro tento stav:</div>
                          <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                            {pvEval.recommendations.map((rec, idx) => (
                              <li key={idx} className="leading-snug">{rec}</li>
                            ))}
                          </ul>

                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => setIsHviModalOpen(true)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 text-xs font-semibold cursor-pointer transition-all shadow-md"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              <span>Zobrazit 3D ilustrační schémata instalace HVI</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Inženýrské grafické schéma: Řez střechou a vizualizace vzdálenosti s vs d */}
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-400" />
                  Technický řez instalací: Ochranný prostor jímací tyče vs. separační mezera (d vs. s)
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Měřítko schéma: s = {pvEval.separationDistance_s_cm} cm | d = {pv.shortestDistanceToLpsCm} cm
                </div>
              </div>

              <div className="w-full bg-slate-900/90 rounded-lg p-3 border border-slate-800/80">
                <svg viewBox="0 0 760 260" className="w-full h-56 text-slate-300 select-none">
                  <defs>
                    <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0f172a" />
                      <stop offset="100%" stopColor="#1e293b" />
                    </linearGradient>
                    <linearGradient id="pvPanelGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#1e3a8a" />
                      <stop offset="100%" stopColor="#0284c7" />
                    </linearGradient>
                    <pattern id="pvGrid" width="16" height="12" patternUnits="userSpaceOnUse">
                      <path d="M 16 0 L 0 0 0 12" fill="none" stroke="#38bdf8" strokeWidth="0.5" strokeOpacity="0.4" />
                    </pattern>
                  </defs>

                  {/* Pozadí */}
                  <rect x="0" y="0" width="760" height="260" fill="url(#skyGrad)" rx="8" />

                  {/* Střecha budovy */}
                  <polygon points="120,190 640,190 640,240 120,240" fill="#334155" stroke="#475569" strokeWidth="2" />
                  <line x1="120" y1="190" x2="640" y2="190" stroke="#94a3b8" strokeWidth="3" />
                  <text x="380" y="220" fill="#94a3b8" fontSize="11" textAnchor="middle" fontWeight="bold">
                    Střešní konstrukce objektu (Šířka {building.width} m × Výška H = {building.height} m)
                  </text>

                  {/* LPS Jímací tyč vlevo */}
                  <line x1="200" y1="60" x2="200" y2="190" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
                  {/* Hrot jímací tyče */}
                  <polygon points="196,65 204,65 200,50" fill="#e2e8f0" />
                  {/* Patka tyče */}
                  <rect x="192" y="186" width="16" height="6" fill="#64748b" />
                  <text x="200" y="44" fill="#e2e8f0" fontSize="10" textAnchor="middle" fontWeight="bold">
                    Jímací tyč LPS
                  </text>

                  {/* Ochranný úhel alpha - ochranný kužel */}
                  <polygon points="200,60 520,190 200,190" fill="#3b82f6" fillOpacity="0.08" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 4" />
                  <text x="240" y="105" fill="#60a5fa" fontSize="9" fontWeight="semibold">
                    Ochranný kužel (LPS {currentLpsClass})
                  </text>

                  {/* FV Konstrukce a panely */}
                  {/* Nosná konstrukce */}
                  <line x1="330" y1="190" x2="350" y2="140" stroke="#94a3b8" strokeWidth="3" />
                  <line x1="470" y1="190" x2="490" y2="140" stroke="#94a3b8" strokeWidth="3" />
                  <line x1="320" y1="190" x2="480" y2="190" stroke="#64748b" strokeWidth="2" />

                  {/* FV Panely (nakloněné pod úhlem) */}
                  <g transform="translate(320, 150) rotate(-18)">
                    <rect x="0" y="0" width="180" height="14" rx="2" fill="url(#pvPanelGrad)" stroke="#38bdf8" strokeWidth="1.5" />
                    <rect x="0" y="0" width="180" height="14" rx="2" fill="url(#pvGrid)" />
                  </g>
                  <text x="420" y="130" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">
                    FV Panely {pv.powerKwp} kWp (sklon {pv.elevationAngleDeg}°)
                  </text>
                  <text x="420" y="144" fill="#94a3b8" fontSize="9" textAnchor="middle">
                    Převýšení ΔH = {pv.rackProtrusionHeight} m
                  </text>

                  {/* Vzdálenost d (skutečná) mezi jímací tyčí (x=200) a nejbližším okrajem panelu (x=320) */}
                  <line x1="200" y1="120" x2="320" y2="120" stroke={pvEval.isSeparationMaintained ? "#10b981" : "#f43f5e"} strokeWidth="2" strokeDasharray="3 3" />
                  <circle cx="200" cy="120" r="3" fill="#cbd5e1" />
                  <circle cx="320" cy="120" r="3" fill="#38bdf8" />
                  {/* Kóta d */}
                  <text x="260" y="112" fill={pvEval.isSeparationMaintained ? "#34d399" : "#fb7185"} fontSize="11" textAnchor="middle" fontWeight="bold">
                    d = {pv.shortestDistanceToLpsCm} cm
                  </text>

                  {/* Mez separační vzdálenosti s od tyče */}
                  {/* Vypočtená pozice s ve vizualizaci */}
                  {(() => {
                    const sVisualX = Math.min(310, Math.max(220, 200 + (pvEval.separationDistance_s_cm * 1.5)));
                    return (
                      <g>
                        <line x1={sVisualX} y1="75" x2={sVisualX} y2="175" stroke="#f59e0b" strokeWidth="2" strokeDasharray="2 2" />
                        <rect x={sVisualX - 42} y="75" width="84" height="16" rx="4" fill="#1e293b" stroke="#f59e0b" strokeWidth="1" />
                        <text x={sVisualX} y="87" fill="#fbbf24" fontSize="9" textAnchor="middle" fontWeight="bold">
                          Mez s = {pvEval.separationDistance_s_cm} cm
                        </text>
                      </g>
                    );
                  })()}

                  {/* Pokud d < s -> Jiskrový elektrický přeskok */}
                  {!pvEval.isSeparationMaintained && (
                    <g>
                      <path
                        d="M 200 120 L 235 110 L 250 128 L 285 114 L 300 130 L 320 120"
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="animate-pulse"
                      />
                      <circle cx="260" cy="120" r="14" fill="#f43f5e" fillOpacity="0.25" />
                      <text x="260" y="148" fill="#f43f5e" fontSize="10" textAnchor="middle" fontWeight="bold">
                        ⚡ PŘESKOK! (d &lt; s)
                      </text>
                    </g>
                  )}

                  {/* Pokud d >= s -> Zelený symbol bezpečné vzdálenosti */}
                  {pvEval.isSeparationMaintained && (
                    <g>
                      <rect x="230" y="128" width="60" height="16" rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
                      <text x="260" y="140" fill="#34d399" fontSize="9" textAnchor="middle" fontWeight="bold">
                        ✓ Bezpečno
                      </text>
                    </g>
                  )}

                  {/* DC Trasa a Střídač */}
                  <path
                    d="M 370 160 L 370 200 L 520 200 L 520 230"
                    fill="none"
                    stroke={pv.dcCableRouting === 'metal_shielded_tray' ? "#38bdf8" : "#f59e0b"}
                    strokeWidth="2.5"
                  />
                  <text x="445" y="212" fill="#94a3b8" fontSize="8" textAnchor="middle">
                    DC trasa ({pv.dcCableRouting === 'metal_shielded_tray' ? 'stíněný žlab' : 'nestíněné'})
                  </text>

                  {/* Inverter Box */}
                  <rect x="500" y="215" width="45" height="22" rx="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="522" y="229" fill="#38bdf8" fontSize="8" textAnchor="middle" fontWeight="bold">
                    Střídač
                  </text>

                  {/* Ochrana SPD badge */}
                  <rect
                    x="560"
                    y="215"
                    width="100"
                    height="22"
                    rx="3"
                    fill={pvEval.isSeparationMaintained ? "#064e3b" : "#4c0519"}
                    stroke={pvEval.isSeparationMaintained ? "#10b981" : "#f43f5e"}
                    strokeWidth="1.5"
                  />
                  <text
                    x="610"
                    y="229"
                    fill={pvEval.isSeparationMaintained ? "#34d399" : "#fda4af"}
                    fontSize="9"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    SPD: {pvEval.requiredSpdDC}
                  </text>
                </svg>
              </div>
            </div>
          </div>
        ) : (
          /* Stav kdy je FVE vypnuta */
          <div className="p-8 text-center rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-3">
            <Sun className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="text-slate-300 font-semibold text-sm">
              Na střeše objektu není zapnuta fotovoltaická elektrárna
            </div>
            <p className="text-xs text-slate-500 max-w-lg mx-auto">
              Pokud je objekt vybaven nebo v budoucnu plánuje střešní FVE, aktivujte přepínač nahoře pro automatické posouzení dostatečné vzdálenosti <strong>s</strong> a dimenzování přepěťových ochran DC/AC dle ČSN CLC/TS 51643-32.
            </p>
            <button
              type="button"
              onClick={() => updatePv({ enabled: true })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer transition-all shadow-md shadow-blue-900/30"
            >
              <Sun className="w-4 h-4 text-amber-300" />
              Aktivovat posouzení střešní FVE
            </button>
          </div>
        )}
      </div>

      {/* Celoobrazovkový modál s 3D ilustračními schématy HVI */}
      {isHviModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 flex flex-col p-4 sm:p-6 overflow-y-auto backdrop-blur-md animate-in fade-in">
          <div className="max-w-5xl w-full mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  3D Ilustrační schémata konfigurací izolovaných svodů (HVI)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHviModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
              >
                Zavřít [Esc]
              </button>
            </div>
            <HviVisualizerGallery
              currentLpsClass={currentLpsClass}
              results={results}
            />
          </div>
        </div>
      )}
    </div>
  );
};
