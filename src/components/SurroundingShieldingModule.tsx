import React from 'react';
import {
  BuildingData,
  SurroundingShieldingData,
  SurroundingShieldingEvaluation,
  SurroundingStructureItem,
  SurroundingStructureMaterial,
  CompassDirection
} from '../types/lps';
import {
  Building2,
  Shield,
  Radio,
  Compass,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  Waves,
  Zap,
  Info,
  Layers,
  Sparkles
} from 'lucide-react';

interface SurroundingShieldingModuleProps {
  building: BuildingData;
  evaluation?: SurroundingShieldingEvaluation;
  onUpdateBuilding: (patch: Partial<BuildingData>) => void;
}

export const SurroundingShieldingModule: React.FC<SurroundingShieldingModuleProps> = ({
  building,
  evaluation,
  onUpdateBuilding
}) => {
  // Výchozí struktura stínění
  const shielding: SurroundingShieldingData = building.surroundingShielding || {
    enabled: false,
    environmentPreset: 'urban_mixed',
    structures: [
      {
        id: 'surr_1',
        name: 'Severní bytový dům',
        direction: 'N',
        height: 24,
        distance: 18,
        material: 'reinforced_concrete'
      },
      {
        id: 'surr_2',
        name: 'Východní administrativní budova',
        direction: 'E',
        height: 16,
        distance: 15,
        material: 'steel_frame'
      }
    ]
  };

  const updateShielding = (patch: Partial<SurroundingShieldingData>) => {
    onUpdateBuilding({
      surroundingShielding: { ...shielding, ...patch }
    });
  };

  const addStructure = () => {
    const newId = `surr_${Date.now()}`;
    const newItems: SurroundingStructureItem[] = [
      ...shielding.structures,
      {
        id: newId,
        name: `Okolní objekt ${shielding.structures.length + 1}`,
        direction: 'W',
        height: Math.round(building.height * 1.5 * 10) / 10,
        distance: 20,
        material: 'reinforced_concrete'
      }
    ];
    updateShielding({ structures: newItems, environmentPreset: 'custom' });
  };

  const removeStructure = (id: string) => {
    const updated = shielding.structures.filter((s) => s.id !== id);
    updateShielding({ structures: updated });
  };

  const updateStructureItem = (id: string, patch: Partial<SurroundingStructureItem>) => {
    const updated = shielding.structures.map((s) => (s.id === id ? { ...s, ...patch } : s));
    updateShielding({ structures: updated });
  };

  const presets = [
    {
      id: 'open_field',
      label: 'Volné pole / osamocená',
      cd: 'Cd = 1.0',
      kms: 'Kms = 1.00 (0 dB)',
      desc: 'Bez okolních objektů a stínění'
    },
    {
      id: 'suburban_houses',
      label: 'Předměstská zástavba',
      cd: 'Cd = 0.50',
      kms: 'Kms = 0.75 (-2.5 dB)',
      desc: 'Rodinné domy stejné výšky (do 10 m)'
    },
    {
      id: 'urban_mixed',
      label: 'Městská smíšená zástavba',
      cd: 'Cd = 0.35',
      kms: 'Kms = 0.50 (-6.0 dB)',
      desc: 'Běžná zástavba, částečně vyšší domy'
    },
    {
      id: 'taller_buildings',
      label: 'Obklopeno vyššími domy',
      cd: 'Cd = 0.25',
      kms: 'Kms = 0.35 (-9.1 dB)',
      desc: 'Vícepodlažní stavby (výška 20–35 m)'
    },
    {
      id: 'urban_canyon',
      label: 'Hustý městský kaňon',
      cd: 'Cd = 0.15',
      kms: 'Kms = 0.20 (-14.0 dB)',
      desc: 'Železobetonové výškové komplexy'
    },
    {
      id: 'adjacent_tower',
      label: 'Dominantní vysoká věž / komín',
      cd: 'Cd = 0.10',
      kms: 'Kms = 0.25 (-12.0 dB)',
      desc: 'Věž, komín či panelák > 40 m v blízkosti'
    },
    {
      id: 'custom',
      label: 'Vlastní směrový model',
      cd: evaluation ? `Cd = ${evaluation.effectiveCd}` : 'Vlastní',
      kms: evaluation ? `Kms = ${evaluation.waveFieldAttenuationFactor_Kms}` : 'Dle prvků',
      desc: 'Zadání konkrétních okolních objektů'
    }
  ];

  return (
    <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl">
      {/* Záhlaví s přepínačem */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl ${shielding.enabled ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-400'}`}>
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Vliv okolních staveb, terénní stínění & Koeficienty vlnového pole
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                ČSN EN 62305-2 Příl. A / ČSN EN 62305-4
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Exaktní posouzení ochranného stínění sousedními objekty, útlumu elektromagnetického vlnového pole (LEMP) v dB a snížení pravděpodobnosti přímého zásahu bleskem do stavby.
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={shielding.enabled}
            onChange={(e) => updateShielding({ enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          <span className="ml-2.5 text-xs font-semibold text-slate-200">
            {shielding.enabled ? 'Stínění aktivní' : 'Bez stínění'}
          </span>
        </label>
      </div>

      {shielding.enabled ? (
        <div className="space-y-6">
          {/* Klíčové vypočtené ukazatele (KPIs) */}
          {evaluation && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-medium">Efektivní činitel polohy</div>
                <div className="text-lg font-bold text-indigo-400 font-mono mt-0.5">
                  Cd = {evaluation.effectiveCd}
                </div>
                <div className="text-[10px] text-slate-500">
                  Původní bez stínění: {evaluation.baseCd}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-medium">Záchyt blesku okolím</div>
                <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                  {evaluation.strikeInterceptionProbPct} %
                </div>
                <div className="text-[10px] text-slate-500">
                  Pokles přímých úderů: -{evaluation.directStrikeReductionPct} %
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                  <span>Útlum vlnového pole (Kms)</span>
                  <Waves className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="text-lg font-bold text-blue-400 font-mono mt-0.5">
                  -{evaluation.waveFieldAttenuation_dB} dB
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Kms = {evaluation.waveFieldAttenuationFactor_Kms} (útlum LEMP)
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-medium">Četnost úderů Nd</div>
                <div className="text-base font-bold text-white font-mono mt-0.5">
                  {evaluation.shieldedNd.toExponential(2)} /rok
                </div>
                <div className="text-[10px] text-slate-500">
                  1 úder za {(1 / Math.max(0.00001, evaluation.shieldedNd)).toFixed(0)} let
                </div>
              </div>
            </div>
          )}

          {/* Volba profilu okolního prostředí (Presets) */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              1. Typ okolní zástavby a konfigurace prostředí
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {presets.map((p) => {
                const isSelected = shielding.environmentPreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => updateShielding({ environmentPreset: p.id as any })}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500/30'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{p.label}</span>
                      <span className="font-mono text-[11px] text-indigo-400 font-semibold">{p.cd}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">{p.desc}</div>
                    <div className="text-[10px] text-blue-400 font-mono mt-1.5 pt-1 border-t border-slate-800/60">
                      {p.kms}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Seznam konkrétních sousedních staveb (Směrová analýza N, E, S, W) */}
          <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Compass className="w-4 h-4 text-indigo-400" />
                  2. Směrové okolní objekty ve vzdálenosti do 3H (3 × {building.height} = {(3 * building.height).toFixed(0)} m)
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Zadejte parametry okolních staveb. Aplikace automaticky spočte stínící úhel &theta; a útlum vlnového pole K_MS.
                </p>
              </div>

              <button
                type="button"
                onClick={addStructure}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                Přidat okolní stavbu
              </button>
            </div>

            {shielding.structures.length > 0 ? (
              <div className="space-y-3">
                {shielding.structures.map((st, index) => {
                  const deltaH = Math.max(0, st.height - building.height);
                  const angleDeg = Math.round(Math.atan2(deltaH, Math.max(1, st.distance)) * (180 / Math.PI) * 10) / 10;
                  const isTaller = st.height > building.height;

                  return (
                    <div
                      key={st.id}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/90 grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs"
                    >
                      {/* Název a směr */}
                      <div className="md:col-span-3 space-y-1">
                        <input
                          type="text"
                          value={st.name}
                          onChange={(e) => updateStructureItem(st.id, { name: e.target.value })}
                          placeholder="Název objektu"
                          className="w-full px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-100 font-medium focus:outline-none focus:border-indigo-500 text-xs"
                        />
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] text-slate-400">Směr:</label>
                          <select
                            value={st.direction}
                            onChange={(e) => updateStructureItem(st.id, { direction: e.target.value as CompassDirection })}
                            className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-indigo-300 font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                          >
                            <option value="N">Sever (N)</option>
                            <option value="NE">Severovýchod (NE)</option>
                            <option value="E">Východ (E)</option>
                            <option value="SE">Jihovýchod (SE)</option>
                            <option value="S">Jih (S)</option>
                            <option value="SW">Jihozápad (SW)</option>
                            <option value="W">Západ (W)</option>
                            <option value="NW">Severozápad (NW)</option>
                          </select>
                        </div>
                      </div>

                      {/* Výška objektu */}
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[11px] text-slate-400 block font-medium">Výška H [m]</label>
                        <input
                          type="number"
                          min="1"
                          max="200"
                          step="0.5"
                          value={st.height}
                          onChange={(e) => updateStructureItem(st.id, { height: parseFloat(e.target.value) || 1 })}
                          className="w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      {/* Vzdálenost */}
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[11px] text-slate-400 block font-medium">Vzdálenost d [m]</label>
                        <input
                          type="number"
                          min="1"
                          max="500"
                          step="1"
                          value={st.distance}
                          onChange={(e) => updateStructureItem(st.id, { distance: parseFloat(e.target.value) || 1 })}
                          className="w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      {/* Materiál konstrukce */}
                      <div className="md:col-span-3 space-y-1">
                        <label className="text-[11px] text-slate-400 block font-medium">Materiál stavby</label>
                        <select
                          value={st.material}
                          onChange={(e) => updateStructureItem(st.id, { material: e.target.value as SurroundingStructureMaterial })}
                          className="w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                        >
                          <option value="reinforced_concrete">Železobeton (vysoký útlum)</option>
                          <option value="steel_frame">Ocelový skelet (vysoký útlum)</option>
                          <option value="masonry">Cihla / zdivo (střední útlum)</option>
                          <option value="trees_vegetation">Vzrostlé stromy / zeleň</option>
                        </select>
                      </div>

                      {/* Vypočtený stínící úhel a smazání */}
                      <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                        <div className="text-right">
                          <div className={`font-mono font-bold text-xs ${isTaller ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {isTaller ? `θ = ${angleDeg}°` : 'Nižší'}
                          </div>
                          <div className="text-[9px] text-slate-500">
                            {isTaller ? `ΔH = +${deltaH.toFixed(1)} m` : `ΔH = -${(building.height - st.height).toFixed(1)} m`}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeStructure(st.id)}
                          className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Odstranit stavbu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center rounded-lg bg-slate-900/60 border border-dashed border-slate-800 text-xs text-slate-400">
                Zatím nebyly zadány žádné konkrétní okolní stavby. Klikněte na tlačítko výše pro přidání.
              </div>
            )}
          </div>

          {/* 3. Inženýrské grafické schéma stínění (SVG) */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                Vektorový řez stínění: Ochranný stínící úhel okolní zástavby vs. naše stavba
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Útlum vlnového pole LEMP: {evaluation?.waveFieldAttenuation_dB || 0} dB
              </div>
            </div>

            <div className="w-full bg-slate-900/90 rounded-lg p-3 border border-slate-800/80">
              <svg viewBox="0 0 760 250" className="w-full h-56 text-slate-300 select-none">
                <defs>
                  <linearGradient id="shieldSky" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#090d16" />
                    <stop offset="100%" stopColor="#1e1b4b" />
                  </linearGradient>
                  <linearGradient id="shieldConeGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#4338ca" stopOpacity="0.05" />
                  </linearGradient>
                </defs>

                {/* Sky background */}
                <rect x="0" y="0" width="760" height="250" fill="url(#shieldSky)" rx="8" />

                {/* Ground plane */}
                <line x1="50" y1="210" x2="710" y2="210" stroke="#475569" strokeWidth="3" />

                {/* Sousední vyšší stavba vlevo (pokud existuje nebo default) */}
                {(() => {
                  const tallH = evaluation?.dominantObject ? Math.min(150, Math.max(90, evaluation.dominantObject.height * 4)) : 130;
                  const tallX = 140;
                  const tallW = 100;
                  const tallY = 210 - tallH;

                  // Naše stavba
                  const ourH = Math.min(100, Math.max(50, building.height * 5));
                  const ourW = 140;
                  const ourX = 420;
                  const ourY = 210 - ourH;

                  return (
                    <g>
                      {/* Stínící kužel pod úhlem theta z vrcholu sousední stavby */}
                      <polygon
                        points={`${tallX + tallW},${tallY} 680,210 ${tallX + tallW},210`}
                        fill="url(#shieldConeGrad)"
                        stroke="#818cf8"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />

                      {/* Sousední vyšší budova */}
                      <rect
                        x={tallX}
                        y={tallY}
                        width={tallW}
                        height={tallH}
                        fill="#312e81"
                        stroke="#6366f1"
                        strokeWidth="2"
                        rx="2"
                      />
                      {/* Okna sousední budovy */}
                      <pattern id="tallGrid" width="16" height="20" patternUnits="userSpaceOnUse">
                        <rect x="4" y="4" width="8" height="10" fill="#a5b4fc" fillOpacity="0.3" rx="1" />
                      </pattern>
                      <rect x={tallX + 4} y={tallY + 10} width={tallW - 8} height={tallH - 14} fill="url(#tallGrid)" />

                      <text x={tallX + tallW / 2} y={tallY - 14} fill="#c7d2fe" fontSize="10" textAnchor="middle" fontWeight="bold">
                        {evaluation?.dominantObject?.name || 'Vyšší sousední objekt'}
                      </text>
                      <text x={tallX + tallW / 2} y={tallY - 3} fill="#818cf8" fontSize="9" textAnchor="middle" font-family="monospace">
                        H = {evaluation?.dominantObject?.height || 28} m
                      </text>

                      {/* Naše posuzovaná stavba */}
                      <rect
                        x={ourX}
                        y={ourY}
                        width={ourW}
                        height={ourH}
                        fill="#1e293b"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                        rx="3"
                      />
                      <pattern id="ourGrid" width="22" height="18" patternUnits="userSpaceOnUse">
                        <rect x="5" y="4" width="12" height="10" fill="#38bdf8" fillOpacity="0.25" rx="1" />
                      </pattern>
                      <rect x={ourX + 6} y={ourY + 8} width={ourW - 12} height={ourH - 12} fill="url(#ourGrid)" />

                      <text x={ourX + ourW / 2} y={ourY + ourH / 2 - 4} fill="#f8fafc" fontSize="11" textAnchor="middle" fontWeight="bold">
                        Naše stavba ({building.length} × {building.width} m)
                      </text>
                      <text x={ourX + ourW / 2} y={ourY + ourH / 2 + 10} fill="#38bdf8" fontSize="10" textAnchor="middle" font-family="monospace">
                        H = {building.height} m (Cd,eff = {evaluation?.effectiveCd || 0.35})
                      </text>

                      {/* Blesk směrovaný na dominantní vyšší stavbu */}
                      <path
                        d="M 190,15 L 182,45 L 195,45 L 187,80"
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="187" cy="80" r="10" fill="#fbbf24" fillOpacity="0.3" />
                      <text x="215" y="45" fill="#fef08a" fontSize="10" fontWeight="bold">
                        Blesk přednostně zachycen sousedním objektem ({evaluation?.strikeInterceptionProbPct || 70} %)
                      </text>

                      {/* Zvlněné magnetické pole LEMP s útlumem */}
                      <path
                        d={`M ${tallX + tallW + 20},${tallY + 30} Q ${tallX + tallW + 60},${tallY + 10} ${tallX + tallW + 100},${tallY + 30} T ${ourX},${tallY + 30}`}
                        fill="none"
                        stroke="#818cf8"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                      />
                      <text x={(tallX + tallW + ourX) / 2} y={tallY + 22} fill="#a5b4fc" fontSize="9" textAnchor="middle" font-family="monospace">
                        Vlnové pole LEMP tlumeno o -{evaluation?.waveFieldAttenuation_dB || 6} dB (KMS = {evaluation?.waveFieldAttenuationFactor_Kms || 0.5})
                      </text>

                      {/* Kóta vzdálenosti */}
                      <line x1={tallX + tallW} y1="225" x2={ourX} y2="225" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
                      <circle cx={tallX + tallW} cy="225" r="2.5" fill="#94a3b8" />
                      <circle cx={ourX} cy="225" r="2.5" fill="#94a3b8" />
                      <text x={(tallX + tallW + ourX) / 2} y="221" fill="#cbd5e1" fontSize="10" textAnchor="middle" font-family="monospace">
                        Odstup d = {evaluation?.dominantObject?.distance || 18} m (Stínící úhel θ = {evaluation?.maxShieldingAngleDeg || 35}°)
                      </text>
                    </g>
                  );
                })()}
              </svg>
            </div>
          </div>

          {/* 4. Výsledkový technický verdikt a normové zdůvodnění */}
          {evaluation && (
            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/40 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-indigo-300">
                <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                <span>Normové vyhodnocení stínění stavby a vlnového pole:</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-xs">
                {evaluation.verdict}
              </p>
              <div className="pt-2 border-t border-indigo-800/40 space-y-1 text-[11px] text-slate-400 font-mono">
                {evaluation.technicalNotes.map((note, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="text-indigo-400">•</span>
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Vypnutý stav modulu stínění */
        <div className="p-8 text-center rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-3">
          <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="text-slate-300 font-semibold text-sm">
            Vliv okolních staveb a terénního stínění není v projektu aktivován
          </div>
          <p className="text-xs text-slate-500 max-w-lg mx-auto">
            Pokud se objekt nachází v městské zástavbě, průmyslovém areálu nebo v blízkosti vyšších budov či stromů, aktivujte modul pro automatický přepočet koeficientů vlnového pole K_MS, útlumu v dB a snížení pravděpodobnosti přímého zásahu stavby bleskem Nd.
          </p>
          <button
            type="button"
            onClick={() => updateShielding({ enabled: true })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer transition-all shadow-md shadow-indigo-900/30"
          >
            <Building2 className="w-4 h-4 text-indigo-200" />
            Aktivovat posouzení vlivu okolních staveb
          </button>
        </div>
      )}
    </div>
  );
};
