import React, { useState } from 'react';
import { CustomCostRates } from '../types/lps';
import { X, RotateCcw, Check, DollarSign } from 'lucide-react';

interface CostSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rates: CustomCostRates;
  onSave: (rates: CustomCostRates) => void;
}

const DEFAULT_RATES: CustomCostRates = {
  airTerminationRate: 320,
  conductorMeterRate: 42,
  hviStandardRate: 1450,
  hviPowerRate: 1800,
  laborHourlyRate: 650,
  revisionBaseCost: 4800
};

export const CostSettingsModal: React.FC<CostSettingsModalProps> = ({
  isOpen,
  onClose,
  rates,
  onSave
}) => {
  const [localRates, setLocalRates] = useState<CustomCostRates>({
    ...DEFAULT_RATES,
    ...rates
  });

  if (!isOpen) return null;

  const handleReset = () => {
    setLocalRates(DEFAULT_RATES);
  };

  const handleSave = () => {
    onSave(localRates);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-6 text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              Uživatelské nastavení jednotkových cen kalkulace LPS
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Upravte jednotkové ceny a hodinové sazby montáže dle svých velkoobchodních nákupních cen a interního ceníku. Všechny ceny jsou bez DPH.
        </p>

        <div className="space-y-4 text-xs font-mono">
          <div className="grid grid-cols-2 gap-4 items-center">
            <label className="text-slate-300 font-sans">
              Mřížová soustava (Kč/m² střechy):
            </label>
            <input
              type="number"
              value={localRates.airTerminationRate || 320}
              onChange={e => setLocalRates({ ...localRates, airTerminationRate: Number(e.target.value) })}
              className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-right focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 items-center">
            <label className="text-slate-300 font-sans">
              Vodič svodů FeZn / AlMgSi (Kč/m):
            </label>
            <input
              type="number"
              value={localRates.conductorMeterRate || 42}
              onChange={e => setLocalRates({ ...localRates, conductorMeterRate: Number(e.target.value) })}
              className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-right focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 items-center">
            <label className="text-slate-300 font-sans">
              DEHN HVI standard vodič (Kč/m):
            </label>
            <input
              type="number"
              value={localRates.hviStandardRate || 1450}
              onChange={e => setLocalRates({ ...localRates, hviStandardRate: Number(e.target.value) })}
              className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-right focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 items-center">
            <label className="text-slate-300 font-sans">
              Sazba montážní práce (Kč/hod):
            </label>
            <input
              type="number"
              value={localRates.laborHourlyRate || 650}
              onChange={e => setLocalRates({ ...localRates, laborHourlyRate: Number(e.target.value) })}
              className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-right focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 items-center">
            <label className="text-slate-300 font-sans">
              Základní cena výchozí revize ČSN 33 1500 (Kč):
            </label>
            <input
              type="number"
              value={localRates.revisionBaseCost || 4800}
              onChange={e => setLocalRates({ ...localRates, revisionBaseCost: Number(e.target.value) })}
              className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-right focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Obnovit výchozí ceník</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Zrušit
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-600/30 transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Uložit a přepočítat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
