import React from 'react';
import {
  Building2,
  Maximize2,
  Network,
  ShieldCheck,
  Zap,
  FileCheck2
} from 'lucide-react';

export interface StepDef {
  id: number;
  title: string;
  shortDesc: string;
  icon: React.ElementType;
}

export const WIZARD_STEPS: StepDef[] = [
  { id: 1, title: 'Lokalita a stavba', shortDesc: 'Základní údaje, Ng mapa ČR', icon: Building2 },
  { id: 2, title: 'Geometrie a plocha', shortDesc: 'Rozměry L, W, H, sběrná plocha Ad', icon: Maximize2 },
  { id: 3, title: 'Sítě a vnitřní zóny', shortDesc: 'Přípojky NN/Sd, požár, osoby', icon: Network },
  { id: 4, title: 'Ochranná opatření', shortDesc: 'Třída LPS I-IV, koordinace SPD', icon: ShieldCheck },
  { id: 5, title: 'Izolovaný hromosvod', shortDesc: 'Dostatečná vzdálenost s & HVI vodiče', icon: Zap },
  { id: 6, title: 'Souhrn rizik a DOCX', shortDesc: 'Matice R1-R4, generování Word protokolu', icon: FileCheck2 }
];

interface WizardNavProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  isR1Safe: boolean;
  isIsolatedSafe: boolean;
  isIsolatedEnabled: boolean;
}

export const WizardNav: React.FC<WizardNavProps> = ({
  currentStep,
  onStepChange,
  isR1Safe,
  isIsolatedSafe,
  isIsolatedEnabled
}) => {
  return (
    <div className="w-full bg-slate-900/90 border-b border-slate-800 px-6 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1 overflow-x-auto py-1">
        {WIZARD_STEPS.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <button
              key={step.id}
              onClick={() => onStepChange(step.id)}
              className={`flex items-center gap-3 px-3.5 py-2 rounded-lg text-left transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : isCompleted
                  ? 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  : 'text-slate-500 hover:bg-slate-800/40 hover:text-slate-300'
              }`}
            >
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-md text-xs font-mono font-bold ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : isCompleted
                    ? 'bg-slate-800 text-slate-300 border border-slate-700'
                    : 'bg-slate-800/50 text-slate-500 border border-slate-800'
                }`}
              >
                {step.id}
              </div>

              <div className="flex flex-col">
                <span className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-slate-200'}`}>
                  {step.title}
                </span>
                <span className="text-[10px] text-slate-400 max-w-[140px] truncate">
                  {step.shortDesc}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
