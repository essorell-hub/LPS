import React from 'react';
import { LineData, ZoneData } from '../types/lps';
import { Network, Flame, Users, Landmark, Coins, ShieldAlert } from 'lucide-react';

interface Step3LinesZonesProps {
  lines: LineData;
  zone: ZoneData;
  onUpdateLines: (lines: Partial<LineData>) => void;
  onUpdateZone: (zone: Partial<ZoneData>) => void;
}

export const Step3LinesZones: React.FC<Step3LinesZonesProps> = ({
  lines,
  zone,
  onUpdateLines,
  onUpdateZone
}) => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight font-display">
          3. Připojená vedení a charakteristika zóny
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Definujte napájecí a telekomunikační přípojky a parametry vnitřní zóny (požární zatížení, přítomnost osob a ekonomické hodnoty) dle ČSN EN 62305-2.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Přípojky a inženýrské sítě */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-5">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Network className="w-4 h-4 text-blue-400" />
            Inženýrské sítě vstupující do stavby
          </h3>

          {/* Silové napájení NN */}
          <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-3 text-xs">
            <div className="font-semibold text-slate-200 flex items-center justify-between">
              <span>Silové napájecí vedení (NN / VN)</span>
              <span className="text-blue-400 font-mono">Přípojka 230/400V</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Typ vedení</label>
                <select
                  value={lines.powerLineType}
                  onChange={(e) => onUpdateLines({ powerLineType: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-slate-200"
                >
                  <option value="underground">Kabel v zemi (podzemní)</option>
                  <option value="overhead">Venkovní vrchní vedení (na sloupech)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Délka vedení [m]</label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={lines.powerLineLength}
                  onChange={(e) => onUpdateLines({ powerLineLength: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-slate-400 mb-1">Stínění / uložení</label>
                <select
                  value={lines.powerLineShielding}
                  onChange={(e) => onUpdateLines({ powerLineShielding: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-slate-200"
                >
                  <option value="none">Standardní (bez stínění)</option>
                  <option value="shielded">Stíněný kabel / pancíř</option>
                  <option value="conduit">Kovová chránička v zemi</option>
                </select>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="trafo"
                  checked={lines.powerTransformer}
                  onChange={(e) => onUpdateLines({ powerTransformer: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="trafo" className="text-slate-300 cursor-pointer">
                  Vlastní trafo VN/NN
                </label>
              </div>
            </div>
          </div>

          {/* Telekomunikační a datové vedení */}
          <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-3 text-xs">
            <div className="font-semibold text-slate-200 flex items-center justify-between">
              <span>Telekomunikační / datová přípojka</span>
              <span className="text-blue-400 font-mono">Sd vedení</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Typ datové přípojky</label>
                <select
                  value={lines.telecomLineType}
                  onChange={(e) => onUpdateLines({ telecomLineType: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-slate-200"
                >
                  <option value="underground">Podzemní metalický kabel</option>
                  <option value="overhead">Venkovní vrchní metalické</option>
                  <option value="none">Optický kabel / bez metaliky</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Délka vedení [m]</label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  disabled={lines.telecomLineType === 'none'}
                  value={lines.telecomLineLength}
                  onChange={(e) => onUpdateLines({ telecomLineLength: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-slate-200 font-mono disabled:opacity-40"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Charakteristika vnitřní zóny a požár */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-5">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            Požární a provozní parametry zóny
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Název zóny</label>
              <input
                type="text"
                value={zone.zoneName}
                onChange={(e) => onUpdateZone({ zoneName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Riziko požáru (rf dle Tab. C.5)
                </label>
                <select
                  value={zone.fireRisk}
                  onChange={(e) => onUpdateZone({ fireRisk: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                >
                  <option value="low">Nízké požární zatížení (rf = 0,001)</option>
                  <option value="ordinary">Běžné požární zatížení (rf = 0,01)</option>
                  <option value="high">Vysoké / hořlavá střecha (rf = 0,1)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Protipožární ochrana (rp)
                </label>
                <select
                  value={zone.fireProtection}
                  onChange={(e) => onUpdateZone({ fireProtection: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                >
                  <option value="none">Bez zvláštní ochrany (rp = 1,0)</option>
                  <option value="extinguishers">Ruční hasicí přístroje (rp = 0,5)</option>
                  <option value="manual_alarm">Manuální hlásiče požáru (rp = 0,5)</option>
                  <option value="automatic_alarm">Samočinná signalizace EPS (rp = 0,2)</option>
                  <option value="sprinklers">Stabilní hašení / sprinklery (rp = 0,1)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Povrch podlahy (činitel ra)
                </label>
                <select
                  value={zone.floorSurface}
                  onChange={(e) => onUpdateZone({ floorSurface: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                >
                  <option value="concrete">Beton, dlažba, zemina (ra = 0,01)</option>
                  <option value="wood">Dřevo, plovoucí podlaha (ra = 0,001)</option>
                  <option value="asphalt">Asfalt, izolační koberec (ra = 0,0001)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Přítomnost osob [hod/rok]
                </label>
                <input
                  type="number"
                  min="100"
                  max="8760"
                  step="100"
                  value={zone.presenceHoursPerYear}
                  onChange={(e) => onUpdateZone({ presenceHoursPerYear: parseInt(e.target.value) || 8760 })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Trvalé bydlení: 8 760 h, Kanceláře: 2 000 h
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  Riziko paniky
                </label>
                <select
                  value={zone.panicRisk}
                  onChange={(e) => onUpdateZone({ panicRisk: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                >
                  <option value="low">Nízké (běžný rodinný dům, sklad)</option>
                  <option value="moderate">Střední (škola, administrativní budova)</option>
                  <option value="high">Vysoké (nemocnice, obchodní dům)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-slate-400" />
                  Hodnota stavby + technologie [Kč]
                </label>
                <input
                  type="number"
                  min="0"
                  step="500000"
                  value={zone.economicValueBuilding + zone.economicValueEquipment}
                  onChange={(e) => {
                    const total = parseFloat(e.target.value) || 0;
                    onUpdateZone({
                      economicValueBuilding: total * 0.7,
                      economicValueEquipment: total * 0.3
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-mono"
                />
              </div>
            </div>

            {/* Speciální klasifikace R2 / R3 */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={zone.culturalHeritageValue}
                  onChange={(e) => onUpdateZone({ culturalHeritageValue: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                />
                <span className="text-slate-300 flex items-center gap-1">
                  <Landmark className="w-3.5 h-3.5 text-amber-400" />
                  Objekt kulturního dědictví (hodnotí se riziko R3)
                </span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Veřejná služba (R2):</span>
                <select
                  value={zone.publicServiceType}
                  onChange={(e) => onUpdateZone({ publicServiceType: e.target.value as any })}
                  className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 text-xs"
                >
                  <option value="none">Nehodnotí se</option>
                  <option value="hospital">Zdravotnictví / nemocnice</option>
                  <option value="water_gas">Vodárna / plynárna</option>
                  <option value="telecom_power">Energetika / telekomunikace</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
