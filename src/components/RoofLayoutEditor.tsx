import React, { useState, useRef } from 'react';
import { RoofLayoutElement } from '../types/lps';
import { Sun, Wind, Radio, Shield, Plus, Trash2, Move, AlertCircle, CheckCircle2 } from 'lucide-react';

interface RoofLayoutEditorProps {
  length: number; // m
  width: number;  // m
  elements: RoofLayoutElement[];
  onChange: (elements: RoofLayoutElement[]) => void;
  separationDistance_s_cm: number;
}

export const RoofLayoutEditor: React.FC<RoofLayoutEditorProps> = ({
  length,
  width,
  elements,
  onChange,
  separationDistance_s_cm
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Měřítko pro zobrazení
  const canvasW = 680;
  const canvasH = 340;
  const padding = 30;

  const innerW = canvasW - padding * 2;
  const innerH = canvasH - padding * 2;

  const scaleX = innerW / Math.max(1, length);
  const scaleY = innerH / Math.max(1, width);
  const scale = Math.min(scaleX, scaleY);

  const roofPixelW = length * scale;
  const roofPixelH = width * scale;
  const roofOffsetX = (canvasW - roofPixelW) / 2;
  const roofOffsetY = (canvasH - roofPixelH) / 2;

  // Přidání nového prvku
  const handleAddElement = (type: RoofLayoutElement['type']) => {
    let w = 2;
    let h = 2;
    let name = 'Prvek';

    if (type === 'pv_array') {
      w = Math.min(6, length * 0.4);
      h = Math.min(3, width * 0.3);
      name = `FVE pole #${elements.filter(e => e.type === 'pv_array').length + 1}`;
    } else if (type === 'hvac') {
      w = 2.5;
      h = 2;
      name = 'VZT jednotka';
    } else if (type === 'inverter') {
      w = 1.2;
      h = 0.8;
      name = 'Střídač FVE';
    } else if (type === 'antenna') {
      w = 0.8;
      h = 0.8;
      name = 'Anténní stožár';
    } else if (type === 'air_rod') {
      w = 0.6;
      h = 0.6;
      name = `Jímací tyč #${elements.filter(e => e.type === 'air_rod').length + 1}`;
    }

    const newEl: RoofLayoutElement = {
      id: `el_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type,
      x: Math.max(0.5, length * 0.3),
      y: Math.max(0.5, width * 0.3),
      width: Math.round(w * 10) / 10,
      height: Math.round(h * 10) / 10,
      name
    };

    const next = [...elements, newEl];
    onChange(next);
    setSelectedId(newEl.id);
  };

  const handleDelete = (id: string) => {
    onChange(elements.filter(e => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // Drag and Drop manipulace
  const handlePointerDown = (id: string, e: React.PointerEvent) => {
    e.stopPropagation();
    setSelectedId(id);
    setIsDragging(true);

    const el = elements.find(item => item.id === id);
    if (!el || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left - roofOffsetX) / scale;
    const clickY = (e.clientY - rect.top - roofOffsetY) / scale;

    setDragOffset({
      x: clickX - el.x,
      y: clickY - el.y
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !selectedId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const currX = (e.clientX - rect.left - roofOffsetX) / scale;
    const currY = (e.clientY - rect.top - roofOffsetY) / scale;

    const targetEl = elements.find(item => item.id === selectedId);
    if (!targetEl) return;

    const newX = Math.max(0, Math.min(length - targetEl.width, currX - dragOffset.x));
    const newY = Math.max(0, Math.min(width - targetEl.height, currY - dragOffset.y));

    onChange(
      elements.map(item =>
        item.id === selectedId
          ? { ...item, x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 }
          : item
      )
    );
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Výpočet vzdálenosti mezi jímací tyčí a nejbližším zařízením
  const airRods = elements.filter(e => e.type === 'air_rod');
  const equipments = elements.filter(e => e.type !== 'air_rod');

  let closestDistanceCm: number | null = null;
  if (airRods.length > 0 && equipments.length > 0) {
    let minD = Infinity;
    airRods.forEach(rod => {
      equipments.forEach(eq => {
        // Střed tyče
        const rodCenterX = rod.x + rod.width / 2;
        const rodCenterY = rod.y + rod.height / 2;
        // Nejbližší bod obdélníku zařízení
        const clampX = Math.max(eq.x, Math.min(rodCenterX, eq.x + eq.width));
        const clampY = Math.max(eq.y, Math.min(rodCenterY, eq.y + eq.height));
        const distM = Math.hypot(rodCenterX - clampX, rodCenterY - clampY);
        if (distM < minD) minD = distM;
      });
    });
    closestDistanceCm = Math.round(minD * 100);
  }

  const isClearanceSafe = closestDistanceCm !== null ? closestDistanceCm >= separationDistance_s_cm : true;

  return (
    <div className="space-y-4">
      {/* Nástrojová lišta */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-800/80 rounded-lg border border-slate-700/80">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-300 mr-1">Přidat na střechu:</span>
          <button
            type="button"
            onClick={() => handleAddElement('pv_array')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 rounded text-xs transition-colors cursor-pointer"
          >
            <Sun className="w-3.5 h-3.5" />
            <span>FVE pole</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddElement('air_rod')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 rounded text-xs transition-colors cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Jímací tyč</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddElement('hvac')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 rounded text-xs transition-colors cursor-pointer"
          >
            <Wind className="w-3.5 h-3.5" />
            <span>VZT / chladič</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddElement('inverter')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 rounded text-xs transition-colors cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Střídač</span>
          </button>
        </div>

        {/* Status separační vzdálenosti na střeše */}
        {closestDistanceCm !== null && (
          <div className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-mono font-bold ${isClearanceSafe ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/50' : 'bg-rose-950 text-rose-300 border border-rose-600/50'}`}>
            {isClearanceSafe ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>Odstup: {closestDistanceCm} cm (min. s = {separationDistance_s_cm} cm)</span>
          </div>
        )}
      </div>

      {/* Interaktivní plátno střechy */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative w-full h-[360px] bg-slate-950 rounded-xl border border-slate-700/80 overflow-hidden select-none cursor-crosshair shadow-inner"
      >
        {/* Mřížka pozadí */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `radial-gradient(#3b82f6 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        />

        {/* Půdorys střechy */}
        <div
          className="absolute border-2 border-slate-600 bg-slate-900/90 shadow-2xl transition-all"
          style={{
            left: `${roofOffsetX}px`,
            top: `${roofOffsetY}px`,
            width: `${roofPixelW}px`,
            height: `${roofPixelH}px`
          }}
        >
          {/* Kótovací popisky rozměrů */}
          <div className="absolute -top-5 left-0 right-0 text-center font-mono text-[10px] text-slate-400">
            Délka L = {length} m
          </div>
          <div className="absolute -left-12 top-0 bottom-0 flex items-center justify-center font-mono text-[10px] text-slate-400 -rotate-90">
            Šířka W = {width} m
          </div>

          {/* Hřeben / atika */}
          <div className="absolute inset-x-0 top-1/2 border-t border-slate-700/60 border-dashed" />

          {/* Prvky na střeše */}
          {elements.map(el => {
            const isSel = el.id === selectedId;
            const elW = el.width * scale;
            const elH = el.height * scale;
            const elLeft = el.x * scale;
            const elTop = el.y * scale;

            let bgColor = 'bg-blue-600/30 border-blue-400';
            let icon = <Sun className="w-3.5 h-3.5 text-blue-300" />;

            if (el.type === 'air_rod') {
              bgColor = 'bg-amber-500/40 border-amber-400 rounded-full';
              icon = <Shield className="w-3.5 h-3.5 text-amber-300" />;
            } else if (el.type === 'hvac') {
              bgColor = 'bg-cyan-600/30 border-cyan-400';
              icon = <Wind className="w-3.5 h-3.5 text-cyan-300" />;
            } else if (el.type === 'inverter') {
              bgColor = 'bg-purple-600/30 border-purple-400';
              icon = <Radio className="w-3.5 h-3.5 text-purple-300" />;
            } else if (el.type === 'antenna') {
              bgColor = 'bg-emerald-600/30 border-emerald-400';
              icon = <Radio className="w-3.5 h-3.5 text-emerald-300" />;
            }

            return (
              <div
                key={el.id}
                onPointerDown={e => handlePointerDown(el.id, e)}
                className={`absolute border flex flex-col items-center justify-center cursor-move transition-shadow ${bgColor} ${isSel ? 'ring-2 ring-white shadow-lg z-20' : 'hover:border-white/80 z-10'}`}
                style={{
                  left: `${elLeft}px`,
                  top: `${elTop}px`,
                  width: `${Math.max(24, elW)}px`,
                  height: `${Math.max(24, elH)}px`
                }}
              >
                {/* Ochranný kužel pro jímací tyč */}
                {el.type === 'air_rod' && (
                  <div
                    className="absolute rounded-full border border-amber-400/30 bg-amber-500/10 pointer-events-none -z-10"
                    style={{
                      width: `${Math.max(60, 4.0 * scale)}px`,
                      height: `${Math.max(60, 4.0 * scale)}px`,
                      left: `-${(Math.max(60, 4.0 * scale) - Math.max(24, elW)) / 2}px`,
                      top: `-${(Math.max(60, 4.0 * scale) - Math.max(24, elH)) / 2}px`
                    }}
                  />
                )}

                <div className="flex items-center gap-1 pointer-events-none">
                  {icon}
                  {elW > 50 && (
                    <span className="text-[10px] font-bold text-white truncate max-w-[80px]">
                      {el.name}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spodní info vybraného prvku a akce */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div>
          {selectedId ? (
            <div className="flex items-center gap-3">
              <span className="text-slate-300 font-semibold">
                Vybráno: {elements.find(e => e.id === selectedId)?.name}
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                Pozice: [{elements.find(e => e.id === selectedId)?.x} m, {elements.find(e => e.id === selectedId)?.y} m]
              </span>
              <button
                type="button"
                onClick={() => handleDelete(selectedId)}
                className="flex items-center gap-1 text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Odstranit</span>
              </button>
            </div>
          ) : (
            <span>Kliknutím na prvek jej vyberete, tažením myši jej umístíte na střechu.</span>
          )}
        </div>
        <div className="text-[11px] text-slate-500">
          Tip: Umístěte jímací tyč tak, aby odstup od FVE panelů činil minimálně s = {separationDistance_s_cm} cm.
        </div>
      </div>
    </div>
  );
};
