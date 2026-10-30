import React, { useState } from 'react';
import { CalculationResults, HeatmapZoneInfo, LpsProjectState } from '../types/lps';
import { formatScientific } from '../utils/docxExport';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Building2,
  Layers,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Maximize2,
  Activity,
  Flame,
  Radio,
  Server,
  Home,
  Anchor
} from 'lucide-react';

interface RiskHeatmapProps {
  project: LpsProjectState;
  results: CalculationResults;
  className?: string;
}

export const RiskHeatmap: React.FC<RiskHeatmapProps> = ({
  project,
  results,
  className = ''
}) => {
  const { building, measures, isolatedLps } = project;
  const zones: HeatmapZoneInfo[] = results.heatmapZones || [];

  const [activeZoneId, setActiveZoneId] = useState<string>('zone_roof');
  const [viewState, setViewState] = useState<'mitigated' | 'unmitigated'>('mitigated');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<'all' | 'R1' | 'R2' | 'R3' | 'R4'>('all');

  const activeZone = zones.find((z) => z.id === activeZoneId) || zones[0];

  // Helper icons for zones
  const getZoneIcon = (id: string) => {
    switch (id) {
      case 'zone_roof':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'zone_facade':
        return <Layers className="w-4 h-4 text-blue-400" />;
      case 'zone_main_switchboard':
        return <Flame className="w-4 h-4 text-rose-400" />;
      case 'zone_it_server':
        return <Server className="w-4 h-4 text-purple-400" />;
      case 'zone_occupied_rooms':
        return <Home className="w-4 h-4 text-emerald-400" />;
      case 'zone_foundation_earth':
        return <Anchor className="w-4 h-4 text-slate-400" />;
      default:
        return <Building2 className="w-4 h-4 text-slate-400" />;
    }
  };

  // Status text and badge style
  const getStatusBadge = (status: 'safe' | 'moderate' | 'elevated' | 'critical') => {
    switch (status) {
      case 'critical':
        return {
          text: 'KRITICKÉ RIZIKO (R > RT)',
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          dot: 'bg-rose-500 animate-pulse'
        };
      case 'elevated':
        return {
          text: 'ZVÝŠENÉ RIZIKO (50–100 % RT)',
          bg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          dot: 'bg-orange-500'
        };
      case 'moderate':
        return {
          text: 'STŘEDNÍ RIZIKO (20–50 % RT)',
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dot: 'bg-amber-500'
        };
      case 'safe':
      default:
        return {
          text: 'BEZPEČNÁ ZÓNA (R ≤ 20 % RT)',
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          dot: 'bg-emerald-500'
        };
    }
  };

  // Compute thermal indices
  const criticalCount = zones.filter((z) => (viewState === 'mitigated' ? z.status : z.unmitigatedStatus) === 'critical').length;
  const safeCount = zones.filter((z) => (viewState === 'mitigated' ? z.status : z.unmitigatedStatus) === 'safe').length;
  const avgIntensityPct = Math.round(
    zones.reduce((sum, z) => sum + (viewState === 'mitigated' ? z.mitigatedRiskPct : z.unmitigatedRiskPct), 0) / Math.max(1, zones.length)
  );

  return (
    <div className={`p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-6 ${className}`}>
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-400" />
              Prostorová teplotní mapa rizik budovy (Risk Heatmap)
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              ČSN EN 62305-2 &amp; 4
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Zónová analýza rozložení dílčích rizik stavby dle fyzického uspořádání, rozhraní LPZ a expozice bleskovým proudům.
          </p>
        </div>

        {/* State Toggle & Risk Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Stav před vs po opatřeních */}
          <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700/60 text-xs">
            <button
              type="button"
              onClick={() => setViewState('unmitigated')}
              className={`px-3 py-1 rounded font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                viewState === 'unmitigated'
                  ? 'bg-rose-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400 inline-block animate-ping" />
              Stav bez ochrany
            </button>
            <button
              type="button"
              onClick={() => setViewState('mitigated')}
              className={`px-3 py-1 rounded font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                viewState === 'mitigated'
                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
              S LPS {measures.lpsClass} + SPD
            </button>
          </div>

          {/* Riziko Filter */}
          <select
            value={selectedRiskFilter}
            onChange={(e) => setSelectedRiskFilter(e.target.value as any)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono"
            title="Filtrovat zobrazené riziko"
          >
            <option value="all">Všechna rizika (Kombinované)</option>
            <option value="R1">R1: Lidské životy</option>
            <option value="R2">R2: Veřejné služby</option>
            <option value="R3">R3: Kulturní památky</option>
            <option value="R4">R4: Hospodářské škody</option>
          </select>
        </div>
      </div>

      {/* Thermographic Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Průměrná intenzita:</span>
          <span className={`font-mono font-bold text-sm ${avgIntensityPct > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {avgIntensityPct} % RT
          </span>
        </div>
        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Kritické zóny (R &gt; RT):</span>
          <span className={`font-mono font-bold text-sm ${criticalCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
            {criticalCount} zón
          </span>
        </div>
        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Bezpečné zóny (R ≤ 20%):</span>
          <span className="font-mono font-bold text-sm text-emerald-400">
            {safeCount} zón
          </span>
        </div>
        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Třída ochrany:</span>
          <span className="font-mono font-bold text-sm text-blue-400">
            LPS {measures.lpsClass} ({measures.spdLevel})
          </span>
        </div>
      </div>

      {/* Visual Architectural Elevation + Detailed Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Architectural Cutaway Heatmap (SVG) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative bg-slate-950 rounded-xl border border-slate-800 p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                Interaktivní řez objektem ({building.length} × {building.width} m, výška {building.height} m)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Kliknutím na zónu zobrazíte podrobnou diagnostiku
              </span>
            </div>

            {/* SVG Architectural Cutaway */}
            <svg
              viewBox="0 0 600 420"
              className="w-full h-auto select-none rounded-lg"
              style={{ background: 'radial-gradient(ellipse at 50% 20%, #0f172a 0%, #020617 100%)' }}
            >
              <defs>
                {/* Heatmap gradients for critical vs safe zones */}
                <linearGradient id="gradCritical" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#991b1b" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient id="gradElevated" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#c2410c" stopOpacity="0.65" />
                </linearGradient>
                <linearGradient id="gradModerate" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#eab308" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#854d0e" stopOpacity="0.6" />
                </linearGradient>
                <linearGradient id="gradSafe" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#047857" stopOpacity="0.6" />
                </linearGradient>

                {/* Filter for glowing zone boundary on hover */}
                <filter id="heatGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Sky background / grid */}
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.4" />
              </pattern>
              <rect width="600" height="340" fill="url(#grid)" />

              {/* Ground level line (y = 330) */}
              <line x1="20" y1="330" x2="580" y2="330" stroke="#475569" strokeWidth="3" strokeDasharray="6 3" />
              <text x="30" y="324" fill="#64748b" fontSize="10" fontFamily="monospace">±0.00 Terén</text>

              {/* Down conductors (Svody) on left and right */}
              <path
                d="M 120 70 L 120 330 M 480 70 L 480 330"
                stroke={viewState === 'mitigated' && measures.lpsClass !== 'none' ? '#38bdf8' : '#f43f5e'}
                strokeWidth={viewState === 'mitigated' && measures.lpsClass !== 'none' ? '2.5' : '1.5'}
                strokeDasharray={viewState === 'mitigated' && isolatedLps.enabled ? '4 2' : 'none'}
              />

              {/* Lightning rods on roof */}
              <line x1="120" y1="70" x2="120" y2="40" stroke="#f59e0b" strokeWidth="3" />
              <line x1="300" y1="50" x2="300" y2="20" stroke="#f59e0b" strokeWidth="3" />
              <line x1="480" y1="70" x2="480" y2="40" stroke="#f59e0b" strokeWidth="3" />
              <circle cx="120" cy="40" r="3" fill="#f59e0b" />
              <circle cx="300" cy="20" r="3" fill="#f59e0b" />
              <circle cx="480" cy="40" r="3" fill="#f59e0b" />
              <text x="306" y="24" fill="#fbbf24" fontSize="9" fontFamily="monospace" fontWeight="bold">Jímač LPZ 0A</text>

              {/* Rolling sphere arc illustration */}
              <path
                d="M 120 40 Q 210 65 300 20 Q 390 65 480 40"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                opacity="0.6"
              />

              {/* ==================================================== */}
              {/* ZONE 1: Střecha a FVE (Z1-ROOF) */}
              {/* ==================================================== */}
              {(() => {
                const z = zones.find((item) => item.id === 'zone_roof') || zones[0];
                const isSel = activeZoneId === 'zone_roof';
                const curStatus = viewState === 'mitigated' ? z.status : z.unmitigatedStatus;
                const fillGrad =
                  curStatus === 'critical'
                    ? 'url(#gradCritical)'
                    : curStatus === 'elevated'
                    ? 'url(#gradElevated)'
                    : curStatus === 'moderate'
                    ? 'url(#gradModerate)'
                    : 'url(#gradSafe)';

                return (
                  <g
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => setActiveZoneId('zone_roof')}
                  >
                    {/* Roof zone shape (trapezoid roof outline) */}
                    <polygon
                      points="110,70 300,50 490,70 480,105 120,105"
                      fill={fillGrad}
                      stroke={isSel ? '#ffffff' : '#38bdf8'}
                      strokeWidth={isSel ? '3' : '1.5'}
                      filter={isSel ? 'url(#heatGlow)' : undefined}
                    />
                    {/* PV panels representation */}
                    {building.pvInstallation?.enabled && (
                      <g opacity="0.9">
                        <rect x="150" y="70" width="55" height="18" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1" />
                        <rect x="220" y="65" width="55" height="18" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1" />
                        <rect x="325" y="65" width="55" height="18" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1" />
                        <rect x="395" y="70" width="55" height="18" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1" />
                      </g>
                    )}
                    <text
                      x="300"
                      y="95"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      Z1: STŘECHA &amp; FVE {building.pvInstallation?.enabled ? `(${building.pvInstallation.powerKwp} kWp)` : ''}
                    </text>
                    <text
                      x="300"
                      y="108"
                      textAnchor="middle"
                      fill="#fef08a"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {viewState === 'mitigated' ? `${z.mitigatedRiskPct} % RT` : `${z.unmitigatedRiskPct} % RT (INIT)`}
                    </text>
                  </g>
                );
              })()}

              {/* ==================================================== */}
              {/* ZONE 4: IT Serverovna & MaR (Z4-IT-ROOM) */}
              {/* ==================================================== */}
              {(() => {
                const z = zones.find((item) => item.id === 'zone_it_server') || zones[0];
                const isSel = activeZoneId === 'zone_it_server';
                const curStatus = viewState === 'mitigated' ? z.status : z.unmitigatedStatus;
                const fillGrad =
                  curStatus === 'critical'
                    ? 'url(#gradCritical)'
                    : curStatus === 'elevated'
                    ? 'url(#gradElevated)'
                    : curStatus === 'moderate'
                    ? 'url(#gradModerate)'
                    : 'url(#gradSafe)';

                return (
                  <g
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => setActiveZoneId('zone_it_server')}
                  >
                    <rect
                      x="310"
                      y="115"
                      width="160"
                      height="85"
                      rx="4"
                      fill={fillGrad}
                      stroke={isSel ? '#ffffff' : '#a855f7'}
                      strokeWidth={isSel ? '3' : '1.5'}
                      filter={isSel ? 'url(#heatGlow)' : undefined}
                    />
                    {/* Server rack graphic icons */}
                    <rect x="325" y="130" width="30" height="55" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1" />
                    <line x1="328" y1="140" x2="352" y2="140" stroke="#38bdf8" strokeWidth="1" />
                    <line x1="328" y1="150" x2="352" y2="150" stroke="#38bdf8" strokeWidth="1" />
                    <line x1="328" y1="160" x2="352" y2="160" stroke="#38bdf8" strokeWidth="1" />
                    <line x1="328" y1="170" x2="352" y2="170" stroke="#38bdf8" strokeWidth="1" />

                    <text x="400" y="145" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                      Z4: IT SERVEROVNA
                    </text>
                    <text x="400" y="160" textAnchor="middle" fill="#e2e8f0" fontSize="9">
                      LPZ 2/3 · Sál MaR &amp; UPS
                    </text>
                    <text x="400" y="180" textAnchor="middle" fill="#fef08a" fontSize="10" fontFamily="monospace" fontWeight="bold">
                      {viewState === 'mitigated' ? `${z.mitigatedRiskPct} % RT` : `${z.unmitigatedRiskPct} % RT`}
                    </text>
                  </g>
                );
              })()}

              {/* ==================================================== */}
              {/* ZONE 5: Pobytové místnosti & Kanceláře (Z5-OFFICES) */}
              {/* ==================================================== */}
              {(() => {
                const z = zones.find((item) => item.id === 'zone_occupied_rooms') || zones[0];
                const isSel = activeZoneId === 'zone_occupied_rooms';
                const curStatus = viewState === 'mitigated' ? z.status : z.unmitigatedStatus;
                const fillGrad =
                  curStatus === 'critical'
                    ? 'url(#gradCritical)'
                    : curStatus === 'elevated'
                    ? 'url(#gradElevated)'
                    : curStatus === 'moderate'
                    ? 'url(#gradModerate)'
                    : 'url(#gradSafe)';

                return (
                  <g
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => setActiveZoneId('zone_occupied_rooms')}
                  >
                    <rect
                      x="130"
                      y="115"
                      width="170"
                      height="85"
                      rx="4"
                      fill={fillGrad}
                      stroke={isSel ? '#ffffff' : '#10b981'}
                      strokeWidth={isSel ? '3' : '1.5'}
                      filter={isSel ? 'url(#heatGlow)' : undefined}
                    />
                    {/* Office windows */}
                    <rect x="145" y="130" width="30" height="25" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
                    <rect x="190" y="130" width="30" height="25" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
                    <rect x="235" y="130" width="30" height="25" fill="#0f172a" stroke="#64748b" strokeWidth="1" />

                    <text x="215" y="175" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                      Z5: KANCELÁŘE &amp; PATRA
                    </text>
                    <text x="215" y="190" textAnchor="middle" fill="#fef08a" fontSize="10" fontFamily="monospace" fontWeight="bold">
                      {viewState === 'mitigated' ? `${z.mitigatedRiskPct} % RT` : `${z.unmitigatedRiskPct} % RT`}
                    </text>
                  </g>
                );
              })()}

              {/* ==================================================== */}
              {/* ZONE 3: Hlavní elektrorozvodna RH (Z3-MAIN-SWB) */}
              {/* ==================================================== */}
              {(() => {
                const z = zones.find((item) => item.id === 'zone_main_switchboard') || zones[0];
                const isSel = activeZoneId === 'zone_main_switchboard';
                const curStatus = viewState === 'mitigated' ? z.status : z.unmitigatedStatus;
                const fillGrad =
                  curStatus === 'critical'
                    ? 'url(#gradCritical)'
                    : curStatus === 'elevated'
                    ? 'url(#gradElevated)'
                    : curStatus === 'moderate'
                    ? 'url(#gradModerate)'
                    : 'url(#gradSafe)';

                return (
                  <g
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => setActiveZoneId('zone_main_switchboard')}
                  >
                    <rect
                      x="130"
                      y="210"
                      width="180"
                      height="110"
                      rx="4"
                      fill={fillGrad}
                      stroke={isSel ? '#ffffff' : '#f43f5e'}
                      strokeWidth={isSel ? '3' : '1.5'}
                      filter={isSel ? 'url(#heatGlow)' : undefined}
                    />
                    {/* Switchboard cabinet icon */}
                    <rect x="145" y="225" width="40" height="75" fill="#020617" stroke="#f43f5e" strokeWidth="1.5" />
                    <line x1="145" y1="260" x2="185" y2="260" stroke="#f43f5e" strokeWidth="1" />
                    <circle cx="165" cy="242" r="3" fill="#f59e0b" />
                    <text x="165" y="285" textAnchor="middle" fill="#f43f5e" fontSize="8" fontFamily="monospace" fontWeight="bold">RH</text>

                    {/* Incoming underground power service */}
                    <path d="M 50 310 L 145 300" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="3 3" />
                    <text x="60" y="300" fill="#f59e0b" fontSize="8" fontFamily="monospace">Kabel NN 400V</text>

                    <text x="240" y="245" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                      Z3: HLAVNÍ ROZVODNA RH
                    </text>
                    <text x="240" y="262" textAnchor="middle" fill="#e2e8f0" fontSize="9">
                      Vstup sítí · Přípojnice MET
                    </text>
                    <text x="240" y="280" textAnchor="middle" fill="#fef08a" fontSize="10" fontFamily="monospace" fontWeight="bold">
                      {viewState === 'mitigated' ? `${z.mitigatedRiskPct} % RT` : `${z.unmitigatedRiskPct} % RT`}
                    </text>
                    <text x="240" y="298" textAnchor="middle" fill="#93c5fd" fontSize="9" fontFamily="monospace">
                      SPD {measures.spdLevel}
                    </text>
                  </g>
                );
              })()}

              {/* ==================================================== */}
              {/* ZONE 2: Fasáda & Vstupy & Svody (Z2-FACADE) */}
              {/* ==================================================== */}
              {(() => {
                const z = zones.find((item) => item.id === 'zone_facade') || zones[0];
                const isSel = activeZoneId === 'zone_facade';
                const curStatus = viewState === 'mitigated' ? z.status : z.unmitigatedStatus;
                const fillGrad =
                  curStatus === 'critical'
                    ? 'url(#gradCritical)'
                    : curStatus === 'elevated'
                    ? 'url(#gradElevated)'
                    : curStatus === 'moderate'
                    ? 'url(#gradModerate)'
                    : 'url(#gradSafe)';

                return (
                  <g
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => setActiveZoneId('zone_facade')}
                  >
                    <rect
                      x="320"
                      y="210"
                      width="150"
                      height="110"
                      rx="4"
                      fill={fillGrad}
                      stroke={isSel ? '#ffffff' : '#38bdf8'}
                      strokeWidth={isSel ? '3' : '1.5'}
                      filter={isSel ? 'url(#heatGlow)' : undefined}
                    />
                    {/* Entrance door */}
                    <rect x="365" y="260" width="35" height="60" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.5" />
                    <circle cx="392" cy="292" r="2" fill="#f59e0b" />

                    <text x="395" y="235" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                      Z2: VSTUPY &amp; FASÁDA
                    </text>
                    <text x="395" y="250" textAnchor="middle" fill="#e2e8f0" fontSize="9">
                      Svody &amp; dotykové napětí
                    </text>
                    <text x="420" y="295" textAnchor="middle" fill="#fef08a" fontSize="10" fontFamily="monospace" fontWeight="bold">
                      {viewState === 'mitigated' ? `${z.mitigatedRiskPct} % RT` : `${z.unmitigatedRiskPct} % RT`}
                    </text>
                  </g>
                );
              })()}

              {/* ==================================================== */}
              {/* ZONE 6: Základy & Obvodový zemnič (Z6-EARTHING) */}
              {/* ==================================================== */}
              {(() => {
                const z = zones.find((item) => item.id === 'zone_foundation_earth') || zones[0];
                const isSel = activeZoneId === 'zone_foundation_earth';
                const curStatus = viewState === 'mitigated' ? z.status : z.unmitigatedStatus;
                const fillGrad =
                  curStatus === 'critical'
                    ? 'url(#gradCritical)'
                    : curStatus === 'elevated'
                    ? 'url(#gradElevated)'
                    : curStatus === 'moderate'
                    ? 'url(#gradModerate)'
                    : 'url(#gradSafe)';

                return (
                  <g
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => setActiveZoneId('zone_foundation_earth')}
                  >
                    {/* Foundation strip beneath the building */}
                    <rect
                      x="110"
                      y="335"
                      width="380"
                      height="45"
                      rx="4"
                      fill={fillGrad}
                      stroke={isSel ? '#ffffff' : '#64748b'}
                      strokeWidth={isSel ? '3' : '1.5'}
                      filter={isSel ? 'url(#heatGlow)' : undefined}
                    />
                    {/* Earthing tape FeZn icon line */}
                    <line x1="120" y1="355" x2="480" y2="355" stroke="#94a3b8" strokeWidth="3" strokeDasharray="8 4" />
                    <text x="300" y="350" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                      Z6: ZÁKLADOVÝ &amp; OBVODOVÝ ZEMNIČ TYP B (FeZn 30×4 mm)
                    </text>
                    <text x="300" y="370" textAnchor="middle" fill="#fef08a" fontSize="10" fontFamily="monospace" fontWeight="bold">
                      {viewState === 'mitigated' ? `${z.mitigatedRiskPct} % RT` : `${z.unmitigatedRiskPct} % RT`} · R = {results.estimatedEarthResistance_ohm} Ω
                    </text>
                  </g>
                );
              })()}
            </svg>

            {/* Thermal Color Legend Bar */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
              <span className="font-sans font-medium text-slate-300">Teplotní stupnice ohrožení:</span>
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                  ≤ 20 % RT (Bezpečné)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
                  20–50 % RT (Střední)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-orange-500 inline-block" />
                  50–100 % RT (Zvýšené)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-rose-500 inline-block animate-pulse" />
                  &gt; 100 % RT (Kritické / Nepřípustné)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Zone Selector Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {zones.map((z) => {
              const isSel = z.id === activeZoneId;
              const curStatus = viewState === 'mitigated' ? z.status : z.unmitigatedStatus;
              const curVal = viewState === 'mitigated' ? z.mitigatedRiskPct : z.unmitigatedRiskPct;
              const badge = getStatusBadge(curStatus);

              return (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => setActiveZoneId(z.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                    isSel
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/50'
                      : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {getZoneIcon(z.id)}
                    <div className="truncate">
                      <div className="font-semibold text-xs truncate">{z.zoneCode}</div>
                      <div className="text-[10px] text-slate-400 truncate">{z.floorLevel}</div>
                    </div>
                  </div>
                  <div className="text-right pl-2 shrink-0">
                    <span className="font-mono text-xs font-bold text-white tabular-nums">
                      {curVal} %
                    </span>
                    <span className={`block w-2 h-2 rounded-full mx-auto mt-0.5 ${badge.dot}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Zone Deep Diagnostic Inspector */}
        <div className="lg:col-span-5 space-y-4">
          {activeZone && (
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              {/* Zone title & status badge */}
              <div className="space-y-1.5 pb-3 border-b border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-blue-400">
                    {activeZone.zoneCode} · {activeZone.lpzBoundary}
                  </span>
                  {(() => {
                    const badge = getStatusBadge(viewState === 'mitigated' ? activeZone.status : activeZone.unmitigatedStatus);
                    return (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1.5 ${badge.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.text}
                      </span>
                    );
                  })()}
                </div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  {getZoneIcon(activeZone.id)}
                  {activeZone.name}
                </h4>
                <p className="text-xs text-slate-400">{activeZone.areaDescription}</p>
              </div>

              {/* Risk comparison metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Před ochranou:</div>
                  <div className="text-base font-bold text-rose-400 mt-0.5">
                    {activeZone.unmitigatedRiskPct} % RT
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Stav bez LPS/SPD</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Po aplikaci LPS:</div>
                  <div className="text-base font-bold text-emerald-400 mt-0.5">
                    {activeZone.mitigatedRiskPct} % RT
                  </div>
                  <div className="text-[10px] text-emerald-500/80 mt-0.5">
                    Pokles o {activeZone.unmitigatedRiskPct > 0 ? (100 - (activeZone.mitigatedRiskPct / activeZone.unmitigatedRiskPct) * 100).toFixed(0) : 0} %
                  </div>
                </div>
              </div>

              {/* Dominant Risk Components */}
              <div className="space-y-1.5 text-xs">
                <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Dominantní složky rizik v zóně:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeZone.dominantRiskComponents.map((comp, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono text-[11px]"
                    >
                      {comp}
                    </span>
                  ))}
                </div>
              </div>

              {/* Vulnerabilities (Identifikované slabiny) */}
              <div className="space-y-1.5 text-xs">
                <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-rose-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Kritická nebezpečí a zranitelnosti:
                </span>
                <ul className="space-y-1 text-slate-400 text-xs">
                  {activeZone.vulnerabilities.map((vuln, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{vuln}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Applied protections in project */}
              <div className="space-y-1.5 text-xs">
                <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Aplikovaná ochranná opatření:
                </span>
                <ul className="space-y-1 text-slate-400 text-xs">
                  {activeZone.appliedProtections.map((prot, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{prot}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Specific normative recommendations per ČSN EN 62305 */}
              <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-500/30 text-xs space-y-1.5">
                <div className="font-semibold text-blue-300 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                  Doporučení normy ČSN EN 62305 pro tuto zónu:
                </div>
                <ul className="space-y-1 text-slate-300 text-[11px]">
                  {activeZone.recommendedMeasures.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <ArrowRight className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
