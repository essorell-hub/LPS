import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  X,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  HelpCircle,
  Layers
} from 'lucide-react';
import { LpsProjectState, CalculationResults } from '../types/lps';

interface StandardsSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: LpsProjectState;
  results: CalculationResults;
}

interface SearchSource {
  title: string;
  url: string;
}

interface SearchResultData {
  answer: string;
  queries?: string[];
  sources?: SearchSource[];
}

export const StandardsSearchModal: React.FC<StandardsSearchModalProps> = ({
  isOpen,
  onClose,
  project,
  results
}) => {
  const [query, setQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<SearchResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const quickPrompts = [
    {
      label: 'FVE a oddálený hromosvod HVI',
      prompt: 'Jaké jsou aktuální normové požadavky pro instalaci fotovoltaiky na střeše s oddáleným hromosvodem a vodiči HVI dle ČSN EN 62305-3 a ČSN CLC/TS 51643-32?'
    },
    {
      label: 'Stav přípravy ČSN EN 62305 ed. 3',
      prompt: 'Jaký je aktuální stav přípravy a harmonizace normy ČSN EN 62305 ed. 3 v ČR a jaké hlavní změny přináší oproti edici 2?'
    },
    {
      label: 'Meze tolerovatelného rizika RT1-RT4',
      prompt: 'Jaké jsou normové mezní hodnoty tolerovatelného rizika RT1, RT2, RT3, RT4 podle ČSN EN 62305-2 ed. 2 a jak se prokazuje bezpečnost stavby?'
    },
    {
      label: 'Výpočet vzdálenosti s a koeficienty',
      prompt: 'Jak se přesně počítá dostatečná vzdálenost s = ki * (kc / km) * l podle ČSN EN 62305-3 ed. 2 a jaké hodnoty ki, kc, km se uvažují pro třídy LPS I až IV?'
    },
    {
      label: 'Koordinace přepěťových ochran SPD',
      prompt: 'Jaké jsou požadavky na koordinaci přepěťových ochran SPD Typ 1, Typ 2 a Typ 3 dle ČSN EN 62305-4 ed. 2 a ČSN 33 2000-5-534?'
    }
  ];

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/standards/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          projectContext: {
            buildingName: project.meta.projectName,
            buildingType: project.building.structureType,
            lpsClass: project.measures.lpsClass,
            recommendedLpsClass: results.recommendedLpsClass,
            isolatedLpsEnabled: project.isolatedLps.enabled,
            hviType: project.isolatedLps.hviType,
            separationDistance_s_cm: results.separationDistance_s_cm,
            spdLevel: project.measures.spdLevel
          }
        })
      });

      const data = await response.json();
      if (!response.ok && !data.fallbackAnswer) {
        throw new Error(data.error || 'Nastala chyba při vyhledávání v normách.');
      }

      setResult({
        answer: data.answer || data.fallbackAnswer || '',
        queries: data.queries || [],
        sources: data.sources || []
      });
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se načíst data o normách.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.answer) return;
    navigator.clipboard.writeText(result.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display flex items-center gap-2">
                <span>Ověřování norem a aktualizací ČSN EN 62305</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Google Search Grounding
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Živé vyhledání aktuálních požadavků norem ČSN EN 62305-1 až 4, změn ÚNMZ a technických pravidel v ČR
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Search Box */}
          <div className="space-y-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch(query);
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Zadejte dotaz na normu (např. 'Požadavky na vzdálenost s pro fotovoltaiku')"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-sm rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Ověřuji...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Vyhledat</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Prompts Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                Časté dotazy:
              </span>
              {quickPrompts.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuery(item.prompt);
                    handleSearch(item.prompt);
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Context Preview */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Aktivní projekt: <strong className="text-slate-200">{project.meta.projectName}</strong></span>
            </div>
            <div className="flex items-center gap-4 font-mono text-[11px]">
              <span>Třída: <strong className="text-blue-400">LPS {project.measures.lpsClass}</strong></span>
              <span>Oddálení: <strong className={project.isolatedLps.enabled ? 'text-emerald-400' : 'text-slate-500'}>
                {project.isolatedLps.enabled ? `HVI (${results.separationDistance_s_cm} cm)` : 'Neaktivní'}
              </strong></span>
              <span>R1 status: <strong className={results.isR1Safe ? 'text-emerald-400' : 'text-rose-400'}>
                {results.isR1Safe ? 'Vyhovuje' : 'Překročeno'}
              </strong></span>
            </div>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <div className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-sm font-medium text-slate-300">
                Prohledávám věstníky ÚNMZ, ČAS a technické normy ČSN EN 62305...
              </p>
              <p className="text-xs text-slate-500">
                Dotazuji Google Search pro ověření nejnovějších změn a edic.
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 flex items-start gap-3 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <strong className="font-semibold block mb-0.5">Chyba při vyhledávání</strong>
                {error}
              </div>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Answer card */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    Odborné inženýrské stanovisko a normový přehled
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Zkopírováno</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Kopírovat text</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Formatted Text */}
                <div className="text-xs text-slate-300 leading-relaxed space-y-2 whitespace-pre-line font-sans">
                  {result.answer}
                </div>
              </div>

              {/* Citations & Sources */}
              {result.sources && result.sources.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                    Zdroje a odkazy z Google Search grounding:
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {result.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-blue-400 transition-colors group"
                      >
                        <span className="truncate pr-2 font-medium">{src.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-500 group-hover:text-blue-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Queries performed */}
              {result.queries && result.queries.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                  <span>Použité vyhledávací dotazy:</span>
                  {result.queries.map((q, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">
                      {q}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <span>Zdroj: ČSN EN 62305 ed. 2, věstníky ÚNMZ &amp; technické podklady DEHN SE</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer"
          >
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );
};
