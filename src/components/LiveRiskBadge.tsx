import React from 'react';
import { CalculationResults, LpsClass } from '../types/lps';
import { formatScientific } from '../utils/docxExport';
import { CheckCircle2, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface LiveRiskBadgeProps {
  results: CalculationResults;
  currentLpsClass: LpsClass;
  onLpsClassChange: (newClass: LpsClass) => void;
  isIsolatedEnabled: boolean;
}

export const LiveRiskBadge: React.FC<LiveRiskBadgeProps> = ({
  results,
  currentLpsClass,
  onLpsClassChange,
  isIsolatedEnabled
}) => {
  return (
    <div className="w-full bg-slate-900 border-b border-slate-800 px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Quick LPS class selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            Třída LPS:
          </span>
          <div className="flex items-center gap-1 p-0.5 bg-slate-800/80 rounded-lg border border-slate-700/60">
            {(['none', 'IV', 'III', 'II', 'I'] as LpsClass[]).map((cls) => (
              <button
                key={cls}
                onClick={() => onLpsClassChange(cls)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  currentLpsClass === cls
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {cls === 'none' ? 'Bez LPS' : `LPS ${cls}`}
              </button>
            ))}
          </div>

          {results.recommendedLpsClass !== currentLpsClass && (
            <span className="text-[11px] text-amber-400/90 font-mono hidden md:inline ml-1">
              (Doporučeno: LPS {results.recommendedLpsClass})
            </span>
          )}
        </div>

        {/* Live Metrics R1 - R4 and Isolated LPS */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          {/* R1: Ztráta životů */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <span className="text-slate-400 font-medium">R1 (životy):</span>
            <span className="font-mono tabular-nums font-semibold text-slate-200">
              {formatScientific(results.R1)}
            </span>
            <span className="text-slate-500 font-mono">/ RT {formatScientific(results.RT1)}</span>
            {results.isR1Safe ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                OK
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                Překročeno
              </span>
            )}
          </div>

          {/* R4: Hospodářské škody */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <span className="text-slate-400 font-medium">R4 (hospodářské):</span>
            <span className="font-mono tabular-nums font-semibold text-slate-200">
              {formatScientific(results.R4)}
            </span>
            <span className="text-slate-500 font-mono">/ RT {formatScientific(results.RT4)}</span>
            {results.isR4Safe ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                OK
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-amber-400">
                Nákladné
              </span>
            )}
          </div>

          {/* Izolovaný hromosvod s & HVI indicator */}
          {isIsolatedEnabled && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
              results.isIsolatedLpsSafe
                ? 'bg-slate-800/60 border-emerald-500/30'
                : 'bg-rose-950/30 border-rose-500/40'
            }`}>
              <Zap className={`w-3.5 h-3.5 ${results.isIsolatedLpsSafe ? 'text-blue-400' : 'text-rose-400'}`} />
              <span className="text-slate-400 font-medium">Vzdálenost s:</span>
              <span className="font-mono tabular-nums font-bold text-slate-200">
                {results.separationDistance_s_cm} cm
              </span>
              <span className="text-slate-500 font-mono">
                ≤ {results.hvi_equivalent_distance_cm} cm
              </span>
              {results.isIsolatedLpsSafe ? (
                <span className="text-emerald-400 font-semibold text-[11px]">VYHOVUJE</span>
              ) : (
                <span className="text-rose-400 font-bold text-[11px]">PŘESKOK!</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
