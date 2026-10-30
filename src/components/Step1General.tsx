import React from 'react';
import { ProjectMeta, BuildingData } from '../types/lps';
import { CZECH_REGIONS_FLASH_DENSITY } from '../data/templates';
import { Building, MapPin, User, Calendar, FileText, Info } from 'lucide-react';

interface Step1GeneralProps {
  meta: ProjectMeta;
  building: BuildingData;
  onUpdateMeta: (meta: Partial<ProjectMeta>) => void;
  onUpdateBuilding: (building: Partial<BuildingData>) => void;
}

export const Step1General: React.FC<Step1GeneralProps> = ({
  meta,
  building,
  onUpdateMeta,
  onUpdateBuilding
}) => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Title & Introduction */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight font-display">
          1. Identifikace projektu a lokalita v ČR
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Zadejte základní identifikační údaje pro technickou zprávu a zvolte lokalitu pro stanovení hustoty bleskových výbojů do země (Ng) dle ČSN EN 62305-2.
        </p>
      </div>

      {/* Identifikační údaje zakázky */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-6">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          Základní údaje pro titulní list Word dokumentu
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1.5">
              Název stavby / akce *
            </label>
            <input
              type="text"
              value={meta.projectName}
              onChange={(e) => onUpdateMeta({ projectName: e.target.value })}
              placeholder="např. Novostavba rodinného domu s FVE"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1.5">
              Číslo zakázky / projektu
            </label>
            <input
              type="text"
              value={meta.projectCode}
              onChange={(e) => onUpdateMeta({ projectCode: e.target.value })}
              placeholder="např. LPS-2026-042"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Místo stavby / adresa / parcelní číslo
            </label>
            <input
              type="text"
              value={meta.buildingLocation}
              onChange={(e) => onUpdateMeta({ buildingLocation: e.target.value })}
              placeholder="např. Benešov, parc. č. 452/12"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Investor / objednatel
            </label>
            <input
              type="text"
              value={meta.investor}
              onChange={(e) => onUpdateMeta({ investor: e.target.value })}
              placeholder="např. Ing. Jan Novák"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1.5">
              Zpracovatel / projektant elektro
            </label>
            <input
              type="text"
              value={meta.designer}
              onChange={(e) => onUpdateMeta({ designer: e.target.value })}
              placeholder="např. Ing. Petr Svoboda, ČKAIT 0104523"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1.5">
              Autorizace / osvědčení projektanta
            </label>
            <input
              type="text"
              value={meta.designerCert}
              onChange={(e) => onUpdateMeta({ designerCert: e.target.value })}
              placeholder="např. Autorizovaný inženýr ČKAIT"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Datum vyhotovení zprávy
            </label>
            <input
              type="date"
              value={meta.date}
              onChange={(e) => onUpdateMeta({ date: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1.5">
              Použitá norma
            </label>
            <input
              type="text"
              value={meta.standardVersion}
              onChange={(e) => onUpdateMeta({ standardVersion: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>
        </div>
      </div>

      {/* Lokalita a hustota bleskových výbojů Ng */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              Lokalita a hustota úderů blesku do země (Ng)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              ČSN EN 62305-2 ed. 2 Národní příloha NA stanoví hustotu bleskových výbojů Ng [údery/km²/rok] pro území České republiky.
            </p>
          </div>
          <div className="p-2 rounded-lg bg-blue-950/40 border border-blue-800/40 text-blue-300 text-xs font-mono shrink-0">
            Ng = {building.groundFlashDensity.toFixed(1)} /km²/rok
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Výběr kraje v ČR */}
          <div>
            <label className="block text-slate-400 font-medium mb-2">
              Rychlý výběr kraje ČR (přednastavená průměrná hodnota Ng):
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {CZECH_REGIONS_FLASH_DENSITY.map((region) => {
                const isSelected = building.selectedRegion === region.name;
                return (
                  <button
                    key={region.name}
                    type="button"
                    onClick={() => {
                      onUpdateBuilding({
                        selectedRegion: region.name,
                        groundFlashDensity: region.density
                      });
                    }}
                    className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white font-medium'
                        : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="truncate text-xs">{region.name}</div>
                    <div className="text-[11px] font-mono text-slate-400">
                      {region.density} údery/km²
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manuální zadání Ng */}
          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">
                Přesná hodnota Ng [údery/km²/rok]
              </label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="10.0"
                value={building.groundFlashDensity}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val > 0) {
                    onUpdateBuilding({ groundFlashDensity: val });
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-mono text-sm focus:outline-none focus:border-blue-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                V České republice se typická hodnota Ng pohybuje v rozmezí 2,0 až 4,2 údery/km²/rok.
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700/50 flex gap-3 text-slate-400 text-xs">
              <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-300">Normové upozornění:</strong>
                <p className="mt-0.5">
                  Podle ČSN EN 62305-2 je frekvence úderů blesku do stavby Nd přímo úměrná hustotě Ng a ekvivalentní sběrné ploše Ad stavby (Nd = Ng · Ad · Cd · 10⁻⁶).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Vlastní firemní logo a razítko ČKAIT */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-6">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          Vlastní firemní logo a autorizační razítko / podpis
        </h3>
        <p className="text-xs text-slate-400">
          Nahrané logo a podpis budou automaticky vloženy na titulní stranu a do závěrečného protokolu Word dokumentu.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Logo firmy */}
          <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-3">
            <label className="block text-slate-300 font-medium">
              Firemní logo projektanta / kanceláře:
            </label>
            {meta.customLogoBase64 ? (
              <div className="flex items-center gap-4">
                <img
                  src={meta.customLogoBase64}
                  alt="Logo firmy"
                  className="h-16 max-w-[200px] object-contain bg-white/90 p-1.5 rounded border border-slate-600"
                />
                <button
                  type="button"
                  onClick={() => onUpdateMeta({ customLogoBase64: undefined })}
                  className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded hover:bg-rose-900/40 transition-colors cursor-pointer"
                >
                  Odstranit logo
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/svg+xml"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        onUpdateMeta({ customLogoBase64: ev.target?.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Doporučený formát PNG s průhledným pozadím, max. 2 MB.
                </span>
              </div>
            )}
          </div>

          {/* Razítko a podpis */}
          <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-3">
            <label className="block text-slate-300 font-medium">
              Sken autorizačního razítka ČKAIT / podpisu:
            </label>
            {meta.customStampBase64 ? (
              <div className="flex items-center gap-4">
                <img
                  src={meta.customStampBase64}
                  alt="Razítko ČKAIT"
                  className="h-16 max-w-[140px] object-contain bg-white/90 p-1.5 rounded border border-slate-600"
                />
                <button
                  type="button"
                  onClick={() => onUpdateMeta({ customStampBase64: undefined })}
                  className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded hover:bg-rose-900/40 transition-colors cursor-pointer"
                >
                  Odstranit razítko
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        onUpdateMeta({ customStampBase64: ev.target?.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Kulaté razítko ČKAIT a podpis projektanta.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Půdní podmínky a měrný odpor půdy rho pro uzemnění */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-400" />
              Půdní podmínky a měrný odpor zeminy (ρ) dle ČSN EN 62305-3
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Měrný odpor půdy ρ [Ω·m] je rozhodující pro minimální délku zemniče l1 a splnění výsledného odporu R ≤ 10 Ω.
            </p>
          </div>
          <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-300 text-xs font-mono shrink-0">
            ρ = {building.soilResistivity || 200} Ω·m
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-2">
              Typ základové půdy v lokalitě:
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {[
                { type: 'humus_peat', name: 'Zahradní ornice / rašelina', rho: 50 },
                { type: 'clay', name: 'Jíl a sprašové hlíny', rho: 100 },
                { type: 'loam', name: 'Písčitá hlína / ornice (běžná půda)', rho: 200 },
                { type: 'sand_gravel', name: 'Písek a štěrk', rho: 1000 },
                { type: 'rock', name: 'Skalnaté a kamenité podloží', rho: 2500 }
              ].map((s) => {
                const isSel = (building.soilResistivity || 200) === s.rho;
                return (
                  <button
                    key={s.type}
                    type="button"
                    onClick={() => onUpdateBuilding({ soilType: s.type as any, soilResistivity: s.rho })}
                    className={`p-2.5 rounded-lg text-left border flex items-center justify-between transition-colors cursor-pointer ${
                      isSel
                        ? 'bg-amber-600/20 border-amber-500 text-white font-medium'
                        : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{s.name}</span>
                    <span className="font-mono text-xs text-amber-400 font-bold">{s.rho} Ω·m</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">
                Vlastní měřená hodnota ρ [Ω·m]:
              </label>
              <input
                type="number"
                min="10"
                max="5000"
                value={building.soilResistivity || 200}
                onChange={(e) => onUpdateBuilding({ soilResistivity: Math.max(10, Number(e.target.value)) })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-mono text-sm focus:outline-none focus:border-amber-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Zjištěno měřením rezistivity půdy Wennerovou metodou nebo odhadem dle geologického průzkumu.
              </span>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1.5">
                Délka instalovaného zemniče [m]:
              </label>
              <input
                type="number"
                min="5"
                max="500"
                value={building.earthingLength || 2 * (building.length + building.width)}
                onChange={(e) => onUpdateBuilding({ earthingLength: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-mono text-sm focus:outline-none focus:border-amber-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Přednastaven obvod budovy: 2 × ({building.length} + {building.width}) = {2 * (building.length + building.width)} m.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

