import React, { useRef } from 'react';
import { ShieldAlert, Download, Upload, Save, CheckCircle2, AlertTriangle, BookOpen, Sparkles } from 'lucide-react';
import { PROJECT_TEMPLATES } from '../data/templates';
import { LpsProjectState, CalculationResults } from '../types/lps';

interface HeaderProps {
  project: LpsProjectState;
  results: CalculationResults;
  onSelectTemplate: (templateId: string) => void;
  onExportDocx: () => void;
  onSaveProjectFile: () => void;
  onLoadProjectFile: (file: File) => void;
  isExporting: boolean;
  onOpenStandardsSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  results,
  onSelectTemplate,
  onExportDocx,
  onSaveProjectFile,
  onLoadProjectFile,
  isExporting,
  onOpenStandardsSearch
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadProjectFile(file);
      e.target.value = ''; // reset pro možnost opětovného nahrání stejného souboru
    }
  };

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 px-6 py-3 bg-slate-900 border-b border-slate-800 text-white backdrop-blur-md">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-500/20">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-white font-display">
            LPS Risk & Isolated Studio
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            ČSN EN 62305-2 &amp; 62305-3 ed. 2
          </span>
        </div>
      </div>

      {/* Zone 2: Template switcher & Persistence buttons */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {/* Šablony */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
          <span className="text-slate-400">Předloha:</span>
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) onSelectTemplate(e.target.value);
            }}
            className="bg-transparent text-slate-200 font-medium cursor-pointer focus:outline-none pr-1"
          >
            <option value="" disabled className="bg-slate-900 text-slate-400">
              Načíst šablonu stavby...
            </option>
            {PROJECT_TEMPLATES.map((tpl) => (
              <option key={tpl.id} value={tpl.id} className="bg-slate-900 text-slate-200">
                {tpl.title}
              </option>
            ))}
          </select>
        </div>

        {/* Uložit do souboru .lpsproj */}
        <button
          type="button"
          onClick={onSaveProjectFile}
          title="Uložit rozpracovaný projekt do souboru .lpsproj"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
        >
          <Save className="w-3.5 h-3.5 text-blue-400" />
          <span>Uložit projekt</span>
        </button>

        {/* Nahrát ze souboru */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".lpsproj,.json"
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Otevřít uložený projekt ze souboru .lpsproj"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-amber-400" />
          <span>Nahrát projekt</span>
        </button>

        {/* Ověření norem ČSN EN 62305 přes Google Search */}
        {onOpenStandardsSearch && (
          <button
            type="button"
            onClick={onOpenStandardsSearch}
            title="Ověřit aktuální požadavky a aktualizace norem ČSN EN 62305 pomocí Google Search"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white border border-amber-500/40 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Ověřit normy ČSN</span>
          </button>
        )}

        {/* Global status text */}
        <div className="hidden xl:flex items-center gap-2 text-xs pl-2 border-l border-slate-800">
          <span className="text-slate-400">Stav R1:</span>
          {results.isR1Safe ? (
            <span className="flex items-center gap-1 font-semibold text-emerald-400 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              VYHOVUJE (LPS {project.measures.lpsClass})
            </span>
          ) : (
            <span className="flex items-center gap-1 font-semibold text-rose-400 font-mono">
              <AlertTriangle className="w-3.5 h-3.5" />
              PŘEKROČENO
            </span>
          )}
        </div>
      </div>

      {/* Zone 3: Primary Action (Export Word .docx) */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onExportDocx}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 active:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20 whitespace-nowrap disabled:opacity-50 cursor-pointer"
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Generuji .docx...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Exportovat Word (.docx)</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
