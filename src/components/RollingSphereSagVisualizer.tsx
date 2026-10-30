import React, { useState } from 'react';
import { LpsClass } from '../types/lps';
import {
  Compass,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Zap,
  Info,
  Maximize2,
  Wand2,
  Layers,
  Sun,
  Fan
} from 'lucide-react';

interface RollingSphereSagVisualizerProps {
  lpsClass: LpsClass;
  twoRodsDistance?: number;
  rodHeight?: number;
  objectHeight?: number;
  objectType?: 'pv_panel' | 'hvac_unit' | 'antenna';
  onUpdateParams?: (params: { twoRodsDistance?: number; rodHeight?: number }) => void;
}

export const RollingSphereSagVisualizer: React.FC<RollingSphereSagVisualizerProps> = ({
  lpsClass,
  twoRodsDistance = 8.0,
  rodHeight = 3.0,
  objectHeight = 1.2,
  objectType = 'pv_panel',
  onUpdateParams
}) => {
  // Lokální nebo řízený stav
  const [d, setD] = useState<number>(twoRodsDistance);
  const [hRod, setHRod] = useState<number>(rodHeight);
  const [hObj, setHObj] = useState<number>(objectHeight);
  const [selectedTarget, setSelectedTarget] = useState<'pv_panel' | 'hvac_unit' | 'antenna'>(objectType);

  // Poloměr valící se koule r [m] dle ČSN EN 62305-3 Tabulka 2
  const r: number = (() => {
    switch (lpsClass) {
      case 'I':
        return 20;
      case 'II':
        return 30;
      case 'III':
        return 45;
      case 'IV':
      default:
        return 60;
    }
  })();

  // Geometrické výpočty průvěsu p a ochranné výšky hc
  const halfD = d / 2;
  const isGeometryFeasible = halfD < r;
  
  // Průvěs p = r - sqrt(r^2 - (d/2)^2)
  const sag_m = isGeometryFeasible
    ? Math.round((r - Math.sqrt(r * r - halfD * halfD)) * 1000) / 1000
    : r;
  
  // Ochranná výška pod koulí hc = h_rod - p
  const hc_m = Math.round((hRod - sag_m) * 100) / 100;
  
  // Bezpečnostní rezerva nad objektem Δh = hc - h_obj
  const clearance_m = Math.round((hc_m - hObj) * 100) / 100;
  const isProtected = clearance_m > 0 && isGeometryFeasible;

  // Minimální nutná výška tyče pro ochranu daného objektu
  const minRequiredRodH = Math.round((hObj + sag_m + 0.1) * 10) / 10;

  // Max rozteč tyčí d_max pro danou výšku tyče (kdy se koule dotkne střechy)
  const maxFeasibleD = Math.min(2 * r - 0.5, Math.round(2 * Math.sqrt(2 * r * hRod - hRod * hRod) * 10) / 10);

  const handleDistanceChange = (val: number) => {
    setD(val);
    onUpdateParams?.({ twoRodsDistance: val });
  };

  const handleRodHeightChange = (val: number) => {
    setHRod(val);
    onUpdateParams?.({ rodHeight: val });
  };

  const handleAutoOptimize = () => {
    const optimizedH = Math.max(1.5, minRequiredRodH);
    setHRod(optimizedH);
    onUpdateParams?.({ rodHeight: optimizedH });
  };

  // SVG Parametry pro vykreslení řezu (dynamické měřítko)
  const svgWidth = 720;
  const svgHeight = 340;
  const groundY = 270; // souřadnice Y střechy
  const scaleX = (svgWidth - 140) / Math.max(10, d + 4); // px na metr
  const scaleY = 32; // px na metr výšky

  const rod1X = (svgWidth - d * scaleX) / 2;
  const rod2X = rod1X + d * scaleX;
  const rod1TopY = groundY - hRod * scaleY;
  const rod2TopY = rod1TopY;

  // Vrchol oblouku koule uprostřed (nejnižší bod koule = průvěs)
  const midX = (rod1X + rod2X) / 2;
  const sagY = groundY - hc_m * scaleY;

  // Výška objektu v pixelech
  const objHeightPx = hObj * scaleY;
  const objWidthPx = Math.max(20, (d - 1.5) * scaleX * 0.65);
  const objX = midX - objWidthPx / 2;
  const objY = groundY - objHeightPx;

  // Výpočet SVG Arc pro valící se kouli
  // Poloměr v px: R_px = r * scaleX
  const rPx = r * scaleX;
  // Sweep flag a large arc
  const arcPath = `M ${rod1X} ${rod1TopY} A ${rPx} ${rPx} 0 0 0 ${rod2X} ${rod2TopY}`;
  // Plocha chráněného prostoru LPZ 0B pod obloukem
  const lpzZonePath = `M ${rod1X} ${groundY} L ${rod1X} ${rod1TopY} A ${rPx} ${rPx} 0 0 0 ${rod2X} ${rod2TopY} L ${rod2X} ${groundY} Z`;

  return (
    <div className="space-y-6">
      {/* Záhlaví kalkulátoru */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white tracking-wide">
              Kalkulátor & Geometrický řez: Metoda valící se koule (ČSN EN 62305-3 čl. 5.2.2)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Stanovení průvěsu koule <strong>p</strong> a ověření ochranného prostoru <strong>LPZ 0B</strong> mezi jímacími tyčemi pro FVE a střešní technologie.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-blue-950 border border-blue-800/80 text-blue-300 font-mono text-xs font-bold">
            Třída LPS {lpsClass} → Poloměr r = {r} m
          </span>
          <button
            type="button"
            onClick={handleAutoOptimize}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
            title="Nastaví výšku jímací tyče tak, aby byl objekt spolehlivě v LPZ 0B"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Automaticky navrhnout výšku tyče
          </button>
        </div>
      </div>

      {/* Ovládací panely & Interaktivní posuvníky */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        {/* 1. Rozteč tyčí d */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Rozteč tyčí (d)</span>
            <span className="font-mono text-blue-400 font-bold text-sm">{d.toFixed(1)} m</span>
          </div>
          <input
            type="range"
            min="2"
            max={Math.min(28, Math.round(r * 1.5))}
            step="0.5"
            value={d}
            onChange={(e) => handleDistanceChange(parseFloat(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>2.0 m</span>
            <span>Max doporučeno {maxFeasibleD.toFixed(1)} m</span>
          </div>
        </div>

        {/* 2. Výška jímacích tyčí h_rod */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Výška tyčí (h_rod)</span>
            <span className="font-mono text-blue-400 font-bold text-sm">{hRod.toFixed(1)} m</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="8.0"
            step="0.2"
            value={hRod}
            onChange={(e) => handleRodHeightChange(parseFloat(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>1.0 m</span>
            <span>8.0 m</span>
          </div>
        </div>

        {/* 3. Výška chráněného objektu */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Výška technologie (h_obj)</span>
            <span className="font-mono text-amber-400 font-bold text-sm">{hObj.toFixed(2)} m</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="4.0"
            step="0.1"
            value={hObj}
            onChange={(e) => setHObj(parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0.2 m (panely)</span>
            <span>4.0 m (VZT)</span>
          </div>
        </div>

        {/* 4. Typ technologie */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="text-slate-400 font-medium block">Chráněná technologie</span>
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => { setSelectedTarget('pv_panel'); setHObj(1.1); }}
              className={`px-2 py-1.5 rounded text-[11px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer ${
                selectedTarget === 'pv_panel'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-300" />
              FVE pole
            </button>
            <button
              type="button"
              onClick={() => { setSelectedTarget('hvac_unit'); setHObj(2.2); }}
              className={`px-2 py-1.5 rounded text-[11px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer ${
                selectedTarget === 'hvac_unit'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Fan className="w-3.5 h-3.5 text-cyan-300" />
              VZT klima
            </button>
          </div>
        </div>
      </div>

      {/* Matematické vyhodnocení stavu */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Průvěs p */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 block font-medium">
            Průvěs koule (p)
          </span>
          <div className="text-xl font-bold font-mono text-blue-400">
            p = {sag_m.toFixed(3)} m
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">
            p = {r} - √({r}² - ({halfD.toFixed(1)})²)
          </span>
        </div>

        {/* Ochranná výška hc */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 block font-medium">
            Ochranná výška (hc)
          </span>
          <div className={`text-xl font-bold font-mono ${hc_m > 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
            hc = {hc_m.toFixed(2)} m
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">
            hc = {hRod.toFixed(1)} - {sag_m.toFixed(3)}
          </span>
        </div>

        {/* Bezpečnostní rezerva */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 block font-medium">
            Rezerva nad technologií (Δh)
          </span>
          <div className={`text-xl font-bold font-mono ${isProtected ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isProtected ? `+${(clearance_m * 100).toFixed(0)} cm` : `${(clearance_m * 100).toFixed(0)} cm`}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">
            {isProtected ? 'Ochranný odstup v normě' : 'Průnik koule do zařízení!'}
          </span>
        </div>

        {/* Stavový verdikt */}
        <div className={`p-4 rounded-xl border flex flex-col justify-center ${
          isProtected
            ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
            : 'bg-rose-950/30 border-rose-500/50 text-rose-300'
        }`}>
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider mb-1">
            {isProtected ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>CHRANĚNO V LPZ 0B</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>PRŮNIK KOULE DO OBJEKTU</span>
              </>
            )}
          </div>
          <div className="text-[11px] text-slate-300 leading-snug">
            {isProtected
              ? `Celá technologie je bezpečně pod obloukem valící se koule o poloměru r = ${r} m.`
              : `Zvýšit jímací tyč alespoň na ${minRequiredRodH.toFixed(1)} m nebo zmenšit rozteč pod ${maxFeasibleD.toFixed(1)} m!`}
          </div>
        </div>
      </div>

      {/* Vizuální technický řez (SVG grafika) */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-2 pb-1 border-b border-slate-800/80">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            Vektorový řez jímací soustavou: Dvě jímací tyče, oblouk valící se koule a chráněný prostor LPZ 0B
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            Měřítko 1 m ≈ {Math.round(scaleX)} px
          </span>
        </div>

        <div className="relative overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-72 mx-auto select-none"
          >
            <defs>
              {/* Šrafování zóny LPZ 0B */}
              <pattern id="lpzPattern" width="12" height="12" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="12" stroke="#10b981" strokeWidth="1.2" strokeOpacity="0.25" />
              </pattern>
              {/* Šrafování nechráněného průniku */}
              <pattern id="dangerPattern" width="12" height="12" patternTransform="rotate(-45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="12" stroke="#f43f5e" strokeWidth="1.5" strokeOpacity="0.35" />
              </pattern>
              <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0b1329" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>
            </defs>

            {/* Pozadí */}
            <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="url(#skyGrad)" rx="8" />

            {/* Střešní deska budovy */}
            <rect x="30" y={groundY} width={svgWidth - 60} height="50" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
            <line x1="20" y1={groundY} x2={svgWidth - 20} y2={groundY} stroke="#64748b" strokeWidth="2.5" />
            <text x="50" y={groundY + 22} fill="#64748b" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
              ROVINA STŘECHY OBJEKTU (LPZ 0A)
            </text>

            {/* Chráněný prostor LPZ 0B (zeleně šrafovaná plocha) */}
            {isGeometryFeasible && (
              <path d={lpzZonePath} fill="url(#lpzPattern)" />
            )}

            {/* Oblouk valící se koule */}
            {isGeometryFeasible && (
              <path
                d={arcPath}
                fill="none"
                stroke={isProtected ? '#3b82f6' : '#f43f5e'}
                strokeWidth="2.5"
                strokeDasharray="6 3"
              />
            )}

            {/* Chráněný objekt (FVE panely nebo VZT jednotka) */}
            {selectedTarget === 'pv_panel' ? (
              // FVE panely na nosné konstrukci
              <g>
                {/* Nosná konstrukce */}
                <line x1={objX} y1={groundY} x2={objX + 15} y2={objY} stroke="#94a3b8" strokeWidth="2" />
                <line x1={objX + objWidthPx} y1={groundY} x2={objX + objWidthPx - 15} y2={objY} stroke="#94a3b8" strokeWidth="2" />
                <line x1={midX} y1={groundY} x2={midX} y2={objY} stroke="#94a3b8" strokeWidth="2" />
                {/* FV panely se sklonem */}
                <polygon
                  points={`${objX},${objY + 12} ${objX + objWidthPx},${objY + 12} ${objX + objWidthPx - 18},${objY} ${objX + 18},${objY}`}
                  fill={isProtected ? '#1e3a8a' : '#881337'}
                  stroke={isProtected ? '#38bdf8' : '#fb7185'}
                  strokeWidth="2"
                />
                <text
                  x={midX}
                  y={objY + 26}
                  fill={isProtected ? '#bae6fd' : '#fecdd3'}
                  fontSize="11"
                  textAnchor="middle"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  FVE fotovoltaické pole (výška {hObj.toFixed(2)} m)
                </text>
              </g>
            ) : (
              // VZT jednotka / klimatizace
              <g>
                <rect
                  x={objX}
                  y={objY}
                  width={objWidthPx}
                  height={objHeightPx}
                  rx="4"
                  fill={isProtected ? '#1e293b' : '#4c0519'}
                  stroke={isProtected ? '#0ea5e9' : '#e11d48'}
                  strokeWidth="2"
                />
                <circle cx={midX} cy={objY + objHeightPx / 2} r="18" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 2" />
                <text
                  x={midX}
                  y={objY + objHeightPx / 2 + 4}
                  fill="#bae6fd"
                  fontSize="10"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  VZT / Strojovna
                </text>
              </g>
            )}

            {/* 1. Jímací tyč JT1 */}
            <g>
              <line x1={rod1X} y1={groundY} x2={rod1X} y2={rod1TopY} stroke="#cbd5e1" strokeWidth="4" />
              <polygon points={`${rod1X},${rod1TopY - 14} ${rod1X - 5},${rod1TopY} ${rod1X + 5},${rod1TopY}`} fill="#f8fafc" />
              <circle cx={rod1X} cy={rod1TopY} r="3" fill="#3b82f6" />
              <text x={rod1X - 12} y={groundY - (hRod * scaleY) / 2} fill="#94a3b8" fontSize="10" textAnchor="end" fontWeight="bold">
                JT1 ({hRod.toFixed(1)} m)
              </text>
            </g>

            {/* 2. Jímací tyč JT2 */}
            <g>
              <line x1={rod2X} y1={groundY} x2={rod2X} y2={rod2TopY} stroke="#cbd5e1" strokeWidth="4" />
              <polygon points={`${rod2X},${rod2TopY - 14} ${rod2X - 5},${rod2TopY} ${rod2X + 5},${rod2TopY}`} fill="#f8fafc" />
              <circle cx={rod2X} cy={rod2TopY} r="3" fill="#3b82f6" />
              <text x={rod2X + 12} y={groundY - (hRod * scaleY) / 2} fill="#94a3b8" fontSize="10" textAnchor="start" fontWeight="bold">
                JT2 ({hRod.toFixed(1)} m)
              </text>
            </g>

            {/* Kóta rozteče d mezi tyčemi */}
            <g>
              <line x1={rod1X} y1={groundY + 20} x2={rod2X} y2={groundY + 20} stroke="#3b82f6" strokeWidth="1.5" />
              <line x1={rod1X} y1={groundY + 12} x2={rod1X} y2={groundY + 28} stroke="#3b82f6" strokeWidth="1.5" />
              <line x1={rod2X} y1={groundY + 12} x2={rod2X} y2={groundY + 28} stroke="#3b82f6" strokeWidth="1.5" />
              <rect x={midX - 35} y={groundY + 11} width="70" height="18" fill="#0f172a" rx="4" />
              <text x={midX} y={groundY + 24} fill="#60a5fa" fontSize="11" textAnchor="middle" fontWeight="bold" fontFamily="monospace">
                d = {d.toFixed(1)} m
              </text>
            </g>

            {/* Kóta průvěsu p od vrcholu tyčí dolů k oblouku */}
            <g>
              <line x1={midX} y1={rod1TopY} x2={midX} y2={sagY} stroke="#f59e0b" strokeWidth="1.8" strokeDasharray="3 2" />
              <circle cx={midX} cy={rod1TopY} r="2.5" fill="#f59e0b" />
              <circle cx={midX} cy={sagY} r="2.5" fill="#f59e0b" />
              <text x={midX + 8} y={(rod1TopY + sagY) / 2 + 4} fill="#fbbf24" fontSize="10" fontWeight="bold" fontFamily="monospace">
                p = {sag_m.toFixed(2)} m
              </text>
            </g>

            {/* Kóta ochranné výšky hc od střechy k oblouku */}
            <g>
              <line x1={midX - 50} y1={groundY} x2={midX - 50} y2={sagY} stroke="#10b981" strokeWidth="1.5" />
              <line x1={midX - 55} y1={groundY} x2={midX - 45} y2={groundY} stroke="#10b981" strokeWidth="1.5" />
              <line x1={midX - 55} y1={sagY} x2={midX - 45} y2={sagY} stroke="#10b981" strokeWidth="1.5" />
              <text x={midX - 58} y={(groundY + sagY) / 2 + 4} fill="#34d399" fontSize="10" textAnchor="end" fontWeight="bold" fontFamily="monospace">
                hc = {hc_m.toFixed(2)} m
              </text>
            </g>

            {/* Varovný blesk při průniku */}
            {!isProtected && (
              <g>
                <path
                  d={`M ${midX} 20 L ${midX - 10} 70 L ${midX + 5} 70 L ${midX - 8} ${objY + 5}`}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3.5"
                />
                <circle cx={midX - 8} cy={objY + 5} r="7" fill="#ef4444" fillOpacity="0.4" />
                <text x={midX} y={55} fill="#fca5a5" fontSize="11" textAnchor="middle" fontWeight="bold">
                  PŘÍMÝ ÚDER BLESKU DO FVE!
                </text>
              </g>
            )}

            {/* Informační štítek poloměru koule */}
            <text x={svgWidth - 40} y={35} fill="#94a3b8" fontSize="11" textAnchor="end" fontFamily="sans-serif">
              Poloměr koule: <tspan fill="#60a5fa" fontWeight="bold">r = {r} m</tspan> (ČSN EN 62305-3)
            </text>
          </svg>
        </div>

        {/* Legenda k řezu */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] text-slate-400 border-t border-slate-900">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500"></span>
              Zóna ochrany LPZ 0B (pod valící se koulí)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-400"></span>
              Oblouk koule r = {r} m
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Průvěs p = {sag_m.toFixed(3)} m
            </span>
          </div>
          <span className="text-slate-500">
            hc = h_rod - p &nbsp;|&nbsp; Bezpečná rezerva Δh = {(clearance_m * 100).toFixed(0)} cm
          </span>
        </div>
      </div>
    </div>
  );
};
