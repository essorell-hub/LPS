import React, { useState } from 'react';
import { LpsProjectState, CalculationResults, HeatmapZoneInfo } from '../types/lps';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  Zap,
  Activity,
  Flame,
  Maximize2,
  Eye,
  Sliders,
  Sun,
  Building,
  Server,
  FolderTree,
  FileCheck
} from 'lucide-react';

interface BuildingRiskHeatmapProps {
  project: LpsProjectState;
  results: CalculationResults;
}

export const BuildingRiskHeatmap: React.FC<BuildingRiskHeatmapProps> = ({
  project,
  results
}) => {
  const zones: HeatmapZoneInfo[] = results.heatmapZones || [];
  const [selectedZoneId, setSelectedZoneId] = useState<string>(zones[0]?.id || 'zone_roof');
  const [showMitigated, setShowMitigated] = useState<boolean>(true);
  const [riskFilter, setRiskFilter] = useState<'all' | 'R1' | 'R2' | 'R3' | 'R4'>('all');
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);

  const selectedZone = zones.find((z) => z.id === selectedZoneId) || zones[0];

  // Pomocná funkce pro zjištění aktuální barvy a skóre zóny dle režimu
  const getZoneDisplay = (zone: HeatmapZoneInfo) => {
    let score = showMitigated ? zone.mitigatedRiskPct : zone.unmitigatedRiskPct;
    let status = showMitigated ? zone.status : zone.unmitigatedStatus;

    // Filtrování specifických rizik
    if (riskFilter === 'R1') {
      const r1Ratio = Math.round((results.R1 / results.RT1) * 100);
      score = showMitigated ? Math.min(score, r1Ratio) : Math.max(score, Math.round(score * 1.3));
    } else if (riskFilter === 'R4') {
      const r4Ratio = Math.round((results.R4 / results.RT4) * 100);
      score = showMitigated ? Math.min(score, r4Ratio) : Math.max(score, Math.round(score * 1.2));
    }

    let color = '#10b981';
    let label = 'Bezpečné (R ≤ 25% RT)';
    if (score > 95) {
      color = '#f43f5e';
      label = 'Kritické (R > 95% RT)';
    } else if (score > 60) {
      color = '#f97316';
      label = 'Zvýšené (60–95% RT)';
    } else if (score > 25) {
      color = '#eab308';
      label = 'Mírné (25–60% RT)';
    }

    return { score, status, color, label };
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
      {/* Hlavička modulu */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Activity className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight font-display flex items-center gap-2">
                Risk Heatmap: Prostorové rozložení rizik v budově
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                  ČSN EN 62305-2 čl. 6
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Vizuální řez stavbou zobrazující kritická místa zranitelná přímým úderem, indukcí LEMP, dotykovým napětím a přepětím po sítích.
              </p>
            </div>
          </div>
        </div>

        {/* Přepínač stavu: Bez ochrany vs. S navrženými opatřeními */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setShowMitigated(false)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                !showMitigated
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Bez ochrany (Výchozí)</span>
            </button>
            <button
              type="button"
              onClick={() => setShowMitigated(true)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                showMitigated
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>S LPS {project.measures.lpsClass} + SPD</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ovládací lišta: Filtrování perspektivy rizik */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 text-slate-400 font-medium">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span>Perspektiva rizika:</span>
          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: 'all', label: 'Všechna rizika (Souhrn)' },
              { id: 'R1', label: 'R1: Lidské životy' },
              { id: 'R4', label: 'R4: Hospodářské škody' }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setRiskFilter(f.id as any)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer text-xs ${
                  riskFilter === f.id
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-800/70 text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Barevná škála intenzity nebezpečí */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span>Stupnice rizika (% RT):</span>
          <div className="flex items-center gap-1">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
              ≤25%
            </span>
            <span className="flex items-center gap-1 text-yellow-400 ml-1">
              <span className="w-3 h-3 rounded-sm bg-yellow-500 inline-block" />
              25–60%
            </span>
            <span className="flex items-center gap-1 text-orange-400 ml-1">
              <span className="w-3 h-3 rounded-sm bg-orange-500 inline-block" />
              60–95%
            </span>
            <span className="flex items-center gap-1 text-rose-400 ml-1">
              <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />
              &gt;95%
            </span>
          </div>
        </div>
      </div>

      {/* Hlavní obsah: Interaktivní SVG řez budovou vlevo + Telemetrický detail vpravo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Levé: Interaktivní architektonický řez budovou (SVG) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-400" />
                Schématický vertikální řez stavbou (kliknutím vyberte zónu)
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {showMitigated ? 'Stav: CHRÁNĚNO' : 'Stav: NECHRÁNĚNO'}
              </span>
            </div>

            <div className="w-full flex justify-center py-2">
              <svg
                viewBox="0 0 600 460"
                className="w-full max-w-lg select-none filter drop-shadow-md"
              >
                <defs>
                  {/* Šrafování a vzory */}
                  <pattern id="groundHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="10" stroke="#334155" strokeWidth="1.5" />
                  </pattern>
                  <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f172a" />
                    <stop offset="100%" stopColor="#1e293b" />
                  </linearGradient>
                </defs>

                {/* Pozadí oblohy */}
                <rect x="0" y="0" width="600" height="370" fill="url(#skyGrad)" rx="8" />

                {/* Terén / Zemina */}
                <rect x="0" y="370" width="600" height="90" fill="#0b1120" />
                <rect x="0" y="370" width="600" height="90" fill="url(#groundHatch)" opacity="0.6" />
                <line x1="0" y1="370" x2="600" y2="370" stroke="#64748b" strokeWidth="2" strokeDasharray="6 4" />
                <text x="30" y="388" fill="#94a3b8" fontSize="10" fontFamily="monospace">Úroveň terénu ± 0,000</text>

                {/* ========================================================= */}
                {/* ZÓNA 6: ZÁKLADY & OBVODOVÝ ZEMNIČ                         */}
                {/* ========================================================= */}
                {(() => {
                  const z6 = zones.find((z) => z.id === 'zone_foundation_earth') || zones[5];
                  const d = z6 ? getZoneDisplay(z6) : { color: '#10b981', score: 10 };
                  const isSel = selectedZoneId === 'zone_foundation_earth';
                  return (
                    <g
                      className="cursor-pointer transition-all"
                      onClick={() => setSelectedZoneId('zone_foundation_earth')}
                      onMouseEnter={() => setHoveredZoneId('zone_foundation_earth')}
                      onMouseLeave={() => setHoveredZoneId(null)}
                    >
                      {/* Základová spára */}
                      <rect
                        x="110"
                        y="370"
                        width="380"
                        height="55"
                        fill={d.color}
                        fillOpacity={isSel ? 0.45 : 0.22}
                        stroke={isSel ? '#ffffff' : d.color}
                        strokeWidth={isSel ? 2.5 : 1.5}
                        rx="4"
                      />
                      {/* Obvodový zemnič FeZn pásek */}
                      <line x1="100" y1="400" x2="500" y2="400" stroke="#cbd5e1" strokeWidth="3" strokeDasharray="8 4" />
                      <circle cx="110" cy="400" r="4" fill="#38bdf8" />
                      <circle cx="490" cy="400" r="4" fill="#38bdf8" />
                      <text x="300" y="405" fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle">
                        Z6: Základový zemnič & MET (Riziko {d.score} %)
                      </text>
                    </g>
                  );
                })()}

                {/* ========================================================= */}
                {/* ZÓNA 2: OBVODOVÝ PLÁŠŤ & FASÁDA (SVODY A BLÍZKOST OSOB)    */}
                {/* ========================================================= */}
                {(() => {
                  const z2 = zones.find((z) => z.id === 'zone_facade') || zones[1];
                  const d = z2 ? getZoneDisplay(z2) : { color: '#10b981', score: 12 };
                  const isSel = selectedZoneId === 'zone_facade';
                  return (
                    <g
                      className="cursor-pointer transition-all"
                      onClick={() => setSelectedZoneId('zone_facade')}
                      onMouseEnter={() => setHoveredZoneId('zone_facade')}
                      onMouseLeave={() => setHoveredZoneId(null)}
                    >
                      {/* Levý svod s ochranným pásmem */}
                      <rect
                        x="90"
                        y="140"
                        width="45"
                        height="230"
                        fill={d.color}
                        fillOpacity={isSel ? 0.35 : 0.15}
                        stroke={isSel ? '#ffffff' : d.color}
                        strokeWidth={isSel ? 2 : 1}
                        strokeDasharray="4 2"
                        rx="4"
                      />
                      {/* Pravý svod */}
                      <rect
                        x="465"
                        y="140"
                        width="45"
                        height="230"
                        fill={d.color}
                        fillOpacity={isSel ? 0.35 : 0.15}
                        stroke={isSel ? '#ffffff' : d.color}
                        strokeWidth={isSel ? 2 : 1}
                        strokeDasharray="4 2"
                        rx="4"
                      />
                      {/* Vodiče svodu */}
                      <line x1="130" y1="130" x2="130" y2="400" stroke="#f59e0b" strokeWidth="2.5" />
                      <line x1="470" y1="130" x2="470" y2="400" stroke="#f59e0b" strokeWidth="2.5" />
                      <text x="65" y="260" fill={d.color} fontSize="10" fontWeight="bold" transform="rotate(-90 65 260)" textAnchor="middle">
                        Z2: Fasáda & Svody ({d.score} %)
                      </text>
                    </g>
                  );
                })()}

                {/* ========================================================= */}
                {/* HLAVNÍ TĚLESO BUDOVY: VNITŘNÍ ZÓNY Z3, Z4, Z5             */}
                {/* ========================================================= */}
                <rect
                  x="135"
                  y="135"
                  width="330"
                  height="235"
                  fill="#1e293b"
                  stroke="#475569"
                  strokeWidth="2"
                  rx="2"
                />

                {/* Mezipatrový strop */}
                <line x1="135" y1="250" x2="465" y2="250" stroke="#334155" strokeWidth="3" />

                {/* ========================================================= */}
                {/* ZÓNA 3: HLAVNÍ ROZVÁDĚČ RH & VSTUP SÍTÍ (1.NP VLEVO)      */}
                {/* ========================================================= */}
                {(() => {
                  const z3 = zones.find((z) => z.id === 'zone_main_switchboard') || zones[2];
                  const d = z3 ? getZoneDisplay(z3) : { color: '#10b981', score: 15 };
                  const isSel = selectedZoneId === 'zone_main_switchboard';
                  return (
                    <g
                      className="cursor-pointer transition-all"
                      onClick={() => setSelectedZoneId('zone_main_switchboard')}
                      onMouseEnter={() => setHoveredZoneId('zone_main_switchboard')}
                      onMouseLeave={() => setHoveredZoneId(null)}
                    >
                      <rect
                        x="145"
                        y="260"
                        width="150"
                        height="100"
                        fill={d.color}
                        fillOpacity={isSel ? 0.45 : 0.22}
                        stroke={isSel ? '#ffffff' : d.color}
                        strokeWidth={isSel ? 2.5 : 1.5}
                        rx="6"
                      />
                      {/* Ikona rozváděče */}
                      <rect x="155" y="275" width="40" height="70" fill="#0f172a" stroke="#64748b" strokeWidth="1" rx="2" />
                      <line x1="160" y1="290" x2="190" y2="290" stroke="#38bdf8" strokeWidth="2" />
                      <line x1="160" y1="310" x2="190" y2="310" stroke="#f59e0b" strokeWidth="2" />
                      <Zap x="165" y="322" className="w-4 h-4" fill={d.color} stroke={d.color} />
                      <text x="205" y="290" fill="#ffffff" fontSize="10" fontWeight="bold">Rozvodna RH</text>
                      <text x="205" y="305" fill="#94a3b8" fontSize="9">LPZ 0A → 1</text>
                      <text x="205" y="325" fill={d.color} fontSize="11" fontWeight="bold">
                        Z3: {d.score} %
                      </text>
                    </g>
                  );
                })()}

                {/* ========================================================= */}
                {/* ZÓNA 4: IT SERVEROVNA & ŘÍDICÍ SYSTÉMY (2.NP VPRAVO)      */}
                {/* ========================================================= */}
                {(() => {
                  const z4 = zones.find((z) => z.id === 'zone_it_server') || zones[3];
                  const d = z4 ? getZoneDisplay(z4) : { color: '#10b981', score: 10 };
                  const isSel = selectedZoneId === 'zone_it_server';
                  return (
                    <g
                      className="cursor-pointer transition-all"
                      onClick={() => setSelectedZoneId('zone_it_server')}
                      onMouseEnter={() => setHoveredZoneId('zone_it_server')}
                      onMouseLeave={() => setHoveredZoneId(null)}
                    >
                      <rect
                        x="305"
                        y="145"
                        width="150"
                        height="95"
                        fill={d.color}
                        fillOpacity={isSel ? 0.45 : 0.22}
                        stroke={isSel ? '#ffffff' : d.color}
                        strokeWidth={isSel ? 2.5 : 1.5}
                        rx="6"
                      />
                      {/* Serverový rack symbol */}
                      <rect x="315" y="155" width="35" height="75" fill="#0f172a" stroke="#64748b" strokeWidth="1" rx="2" />
                      <line x1="320" y1="168" x2="345" y2="168" stroke="#10b981" strokeWidth="2" />
                      <line x1="320" y1="180" x2="345" y2="180" stroke="#38bdf8" strokeWidth="2" />
                      <line x1="320" y1="192" x2="345" y2="192" stroke="#38bdf8" strokeWidth="2" />
                      <text x="360" y="175" fill="#ffffff" fontSize="10" fontWeight="bold">IT Serverovna</text>
                      <text x="360" y="190" fill="#94a3b8" fontSize="9">LPZ 1 → 2/3</text>
                      <text x="360" y="210" fill={d.color} fontSize="11" fontWeight="bold">
                        Z4: {d.score} %
                      </text>
                    </g>
                  );
                })()}

                {/* ========================================================= */}
                {/* ZÓNA 5: POBYTOVÉ MÍSTNOSTI & KANCELÁŘE                    */}
                {/* ========================================================= */}
                {(() => {
                  const z5 = zones.find((z) => z.id === 'zone_occupied_rooms') || zones[4];
                  const d = z5 ? getZoneDisplay(z5) : { color: '#10b981', score: 8 };
                  const isSel = selectedZoneId === 'zone_occupied_rooms';
                  return (
                    <g
                      className="cursor-pointer transition-all"
                      onClick={() => setSelectedZoneId('zone_occupied_rooms')}
                      onMouseEnter={() => setHoveredZoneId('zone_occupied_rooms')}
                      onMouseLeave={() => setHoveredZoneId(null)}
                    >
                      {/* 2.NP vlevo */}
                      <rect
                        x="145"
                        y="145"
                        width="150"
                        height="95"
                        fill={d.color}
                        fillOpacity={isSel ? 0.35 : 0.15}
                        stroke={isSel ? '#ffffff' : d.color}
                        strokeWidth={isSel ? 2 : 1}
                        rx="6"
                      />
                      {/* 1.NP vpravo */}
                      <rect
                        x="305"
                        y="260"
                        width="150"
                        height="100"
                        fill={d.color}
                        fillOpacity={isSel ? 0.35 : 0.15}
                        stroke={isSel ? '#ffffff' : d.color}
                        strokeWidth={isSel ? 2 : 1}
                        rx="6"
                      />
                      {/* Okna */}
                      <rect x="160" y="165" width="25" height="30" fill="#0284c7" opacity="0.4" stroke="#38bdf8" strokeWidth="1" />
                      <rect x="200" y="165" width="25" height="30" fill="#0284c7" opacity="0.4" stroke="#38bdf8" strokeWidth="1" />
                      <rect x="325" y="280" width="25" height="30" fill="#0284c7" opacity="0.4" stroke="#38bdf8" strokeWidth="1" />
                      <rect x="365" y="280" width="25" height="30" fill="#0284c7" opacity="0.4" stroke="#38bdf8" strokeWidth="1" />
                      <text x="220" y="215" fill="#f8fafc" fontSize="10" fontWeight="bold" textAnchor="middle">
                        Kanceláře (Z5: {d.score} %)
                      </text>
                      <text x="380" y="330" fill="#f8fafc" fontSize="10" fontWeight="bold" textAnchor="middle">
                        Zasedačky (Z5)
                      </text>
                    </g>
                  );
                })()}

                {/* ========================================================= */}
                {/* ZÓNA 1: STŘECHA, ATIKA & TECHNOLOGIE (FVE, VZT, JÍMAČE)   */}
                {/* ========================================================= */}
                {(() => {
                  const z1 = zones.find((z) => z.id === 'zone_roof') || zones[0];
                  const d = z1 ? getZoneDisplay(z1) : { color: '#f43f5e', score: 110 };
                  const isSel = selectedZoneId === 'zone_roof';
                  return (
                    <g
                      className="cursor-pointer transition-all"
                      onClick={() => setSelectedZoneId('zone_roof')}
                      onMouseEnter={() => setHoveredZoneId('zone_roof')}
                      onMouseLeave={() => setHoveredZoneId(null)}
                    >
                      {/* Střešní plášť s atikou */}
                      <polygon
                        points="115,135 300,55 485,135"
                        fill={d.color}
                        fillOpacity={isSel ? 0.45 : 0.22}
                        stroke={isSel ? '#ffffff' : d.color}
                        strokeWidth={isSel ? 3 : 2}
                      />

                      {/* Jímací soustava na hřebeni */}
                      <line x1="120" y1="133" x2="300" y2="53" stroke="#f59e0b" strokeWidth="2.5" />
                      <line x1="300" y1="53" x2="480" y2="133" stroke="#f59e0b" strokeWidth="2.5" />

                      {/* Jímací tyč na hřebeni */}
                      <line x1="300" y1="53" x2="300" y2="15" stroke="#f59e0b" strokeWidth="3" />
                      <circle cx="300" cy="15" r="3.5" fill="#fbbf24" />

                      {/* FVE panely na střeše (pokud je v projektu FVE) */}
                      {project.building.pvInstallation?.enabled ? (
                        <g>
                          <polygon points="160,118 240,83 250,87 170,122" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
                          <polygon points="350,83 430,118 420,122 340,87" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
                          <text x="210" y="100" fill="#bae6fd" fontSize="9" fontWeight="bold">FVE</text>
                        </g>
                      ) : null}

                      {/* VZT jednotka */}
                      <rect x="270" y="65" width="30" height="20" fill="#334155" stroke="#94a3b8" strokeWidth="1" rx="2" />

                      <text x="300" y="115" fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">
                        Z1: Střecha, FVE & Nástavby (Riziko {d.score} %)
                      </text>
                    </g>
                  );
                })()}

                {/* Bleskový výboj jako ilustrace expozice */}
                {!showMitigated && (
                  <path
                    d="M 270 5 L 290 35 L 280 40 L 300 55"
                    stroke="#f43f5e"
                    strokeWidth="3.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-pulse"
                  />
                )}
              </svg>
            </div>

            {/* Indikátor vybrané zóny pod schématem */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-400" />
                Aktivní zóna: <strong className="text-white">{selectedZone?.name}</strong>
              </span>
              <span className="font-mono text-slate-400">
                Kód: <strong className="text-indigo-300">{selectedZone?.zoneCode}</strong> | Rozhraní: {selectedZone?.lpzBoundary}
              </span>
            </div>
          </div>

          {/* Rychlé přepínání zón v miniaturních kartách */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {zones.map((zone) => {
              const d = getZoneDisplay(zone);
              const isSel = selectedZoneId === zone.id;
              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => setSelectedZoneId(zone.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSel
                      ? 'bg-slate-800 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                      : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-[10px] text-slate-400">
                      {zone.zoneCode}
                    </span>
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: d.color }}
                      title={d.label}
                    />
                  </div>
                  <div className="font-semibold text-slate-200 line-clamp-1 text-[11px]">
                    {zone.name.split('&')[0]}
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono mt-1">
                    <span className="text-slate-500">{showMitigated ? 'LPS stav:' : 'Bez LPS:'}</span>
                    <span className="font-bold" style={{ color: d.color }}>
                      {d.score} % RT
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pravé: Technický telemetrický panel detailu zóny */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4 h-full flex flex-col justify-between">
            {selectedZone ? (
              <>
                <div className="space-y-3">
                  {/* Horní hlavička zóny */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-500/30">
                          {selectedZone.zoneCode}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {selectedZone.floorLevel}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">
                        {selectedZone.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {selectedZone.areaDescription}
                      </p>
                    </div>

                    {/* Vizuální indikátor intenzity rizika */}
                    {(() => {
                      const d = getZoneDisplay(selectedZone);
                      return (
                        <div
                          className="px-3 py-1.5 rounded-lg border text-right flex-shrink-0"
                          style={{
                            borderColor: d.color,
                            backgroundColor: `${d.color}15`
                          }}
                        >
                          <div className="text-[10px] uppercase tracking-wider font-bold" style={{ color: d.color }}>
                            {d.status === 'safe' ? 'Vyhovuje' : d.status === 'critical' ? 'Kritické' : 'Zvýšené'}
                          </div>
                          <div className="text-base font-bold font-mono text-white">
                            {d.score} %
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono">
                            z toler. meze RT
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Srovnání před vs. po aplikaci LPS */}
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                      <span>Účinek navržených ochranných opatření:</span>
                      <span className="text-blue-400 font-bold font-mono">
                        Pokles o {Math.max(0, 100 - Math.round((selectedZone.mitigatedRiskPct / Math.max(1, selectedZone.unmitigatedRiskPct)) * 100))} %
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[11px] font-mono">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Před aplikací LPS (nechráněno):</span>
                        <span className="text-rose-400 font-bold">{selectedZone.unmitigatedRiskPct} % RT</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 transition-all duration-500"
                          style={{ width: `${Math.min(100, selectedZone.unmitigatedRiskPct)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-slate-400 pt-1">
                        <span>S opatřeními LPS {project.measures.lpsClass} + SPD:</span>
                        <span className="text-emerald-400 font-bold">{selectedZone.mitigatedRiskPct} % RT</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${Math.min(100, selectedZone.mitigatedRiskPct)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dominantní rizikové složky v zóně */}
                  <div className="space-y-1.5">
                    <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-400" />
                      Převládající složky rizika dle ČSN EN 62305-2:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedZone.dominantRiskComponents.map((comp, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono"
                        >
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Zranitelná místa zóny */}
                  <div className="space-y-1.5">
                    <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      Zjištěné zranitelnosti a ohrožení:
                    </label>
                    <ul className="space-y-1 text-xs">
                      {selectedZone.vulnerabilities.map((v, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-amber-300/90 text-[11px]">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{v}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Aplikovaná ochranná opatření */}
                  <div className="space-y-1.5">
                    <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Aplikovaná opatření projektu:
                    </label>
                    <ul className="space-y-1 text-xs">
                      {selectedZone.appliedProtections.map((p, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-emerald-300/90 text-[11px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Spodní normové doporučení revizního technika */}
                <div className="pt-3 border-t border-slate-800/80">
                  <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/30 text-[11px] space-y-1 text-slate-300">
                    <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                      Doporučení revizního technika pro zónu {selectedZone.zoneCode}:
                    </div>
                    {selectedZone.recommendedMeasures.map((rec, i) => (
                      <p key={i} className="text-slate-400 pl-4 relative before:content-['→'] before:absolute before:left-0 before:text-indigo-400">
                        {rec}
                      </p>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
