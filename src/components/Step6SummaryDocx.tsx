import React, { useRef, useEffect, useState } from 'react';
import { LpsProjectState, CalculationResults } from '../types/lps';
import { formatScientific } from '../utils/docxExport';
import {
  createCollectionAreaCanvas,
  createIsolatedLpsCanvas,
  createLpzZonationCanvas,
  createDocumentLogoCanvas
} from '../utils/diagramGenerators';
import { calculateComparativeCosts } from '../utils/costCalculation';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
  CartesianGrid,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import {
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Zap,
  BarChart3,
  TrendingDown,
  Layers,
  Printer,
  FileSpreadsheet,
  Settings2,
  Compass,
  Globe,
  BookOpen,
  Sparkles,
  Activity,
  ShieldAlert,
  Wrench,
  ClipboardCheck,
  Calculator,
  Coins,
  Percent,
  Boxes,
  Sun,
  Building2
} from 'lucide-react';

interface Step6SummaryDocxProps {
  project: LpsProjectState;
  results: CalculationResults;
  onExportDocx: () => void;
  isExporting: boolean;
  onExportBom?: () => void;
  onPrintPdf?: () => void;
  onOpenCostSettings?: () => void;
  onOpenStandardsSearch?: () => void;
}

export const Step6SummaryDocx: React.FC<Step6SummaryDocxProps> = ({
  project,
  results,
  onExportDocx,
  isExporting,
  onExportBom,
  onPrintPdf,
  onOpenCostSettings,
  onOpenStandardsSearch
}) => {
  const { meta, measures, isolatedLps, building, zone, lines } = project;
  const [chartView, setChartView] = useState<'dehn' | 'radar' | 'ratio' | 'comparison' | 'components'>('dehn');

  // Výchozí rizika bez ochranných opatření
  const initialR1 = results.componentsInitial.RA + results.componentsInitial.RB + results.componentsInitial.RC + results.componentsInitial.RM + results.componentsInitial.RU + results.componentsInitial.RV + results.componentsInitial.RW + results.componentsInitial.RZ;
  const initialR2 = zone.publicServiceType === 'none' ? 0 : results.R2 * 3.5;
  const initialR3 = !zone.culturalHeritageValue ? 0 : results.R3 * 5.0;
  const initialR4 = results.R4 * 2.8;

  // Normalizovaná data pro graf poměru k mezi RT
  const normalizedData = [
    {
      name: 'R1: Lidské životy',
      shortName: 'R1 (životy)',
      ratio: Math.round((results.R1 / results.RT1) * 100),
      initialRatio: Math.round((initialR1 / results.RT1) * 100),
      actual: results.R1,
      initialVal: initialR1,
      limit: results.RT1,
      isSafe: results.isR1Safe,
      desc: 'Ztráta života nebo trvalé zranění dotykovým napětím / požárem'
    },
    ...(zone.publicServiceType !== 'none' ? [{
      name: 'R2: Veřejné služby',
      shortName: 'R2 (služby)',
      ratio: Math.round((results.R2 / results.RT2) * 100),
      initialRatio: Math.round((initialR2 / results.RT2) * 100),
      actual: results.R2,
      initialVal: initialR2,
      limit: results.RT2,
      isSafe: results.isR2Safe,
      desc: 'Výpadek nemocnice, plynárny nebo telekomunikací'
    }] : []),
    ...(zone.culturalHeritageValue ? [{
      name: 'R3: Kulturní dědictví',
      shortName: 'R3 (památky)',
      ratio: Math.round((results.R3 / results.RT3) * 100),
      initialRatio: Math.round((initialR3 / results.RT3) * 100),
      actual: results.R3,
      initialVal: initialR3,
      limit: results.RT3,
      isSafe: results.isR3Safe,
      desc: 'Ztráta nenahraditelných kulturních památek'
    }] : []),
    {
      name: 'R4: Hospodářské škody',
      shortName: 'R4 (majetek)',
      ratio: Math.round((results.R4 / results.RT4) * 100),
      initialRatio: Math.round((initialR4 / results.RT4) * 100),
      actual: results.R4,
      initialVal: initialR4,
      limit: results.RT4,
      isSafe: results.isR4Safe,
      desc: 'Škody na konstrukci stavby a elektrických zařízeních'
    }
  ];

  // Data pro detailní rozpad složek RA - RZ (v násobcích 10^-6)
  const componentsChartData = [
    { name: 'RA (dotyk stavba)', initial: Number((results.componentsInitial.RA * 1e6).toFixed(2)), current: Number((results.componentsWithMeasures.RA * 1e6).toFixed(2)) },
    { name: 'RB (požár stavba)', initial: Number((results.componentsInitial.RB * 1e6).toFixed(2)), current: Number((results.componentsWithMeasures.RB * 1e6).toFixed(2)) },
    { name: 'RC (LEMP stavba)', initial: Number((results.componentsInitial.RC * 1e6).toFixed(2)), current: Number((results.componentsWithMeasures.RC * 1e6).toFixed(2)) },
    { name: 'RM (indukce okolí)', initial: Number((results.componentsInitial.RM * 1e6).toFixed(2)), current: Number((results.componentsWithMeasures.RM * 1e6).toFixed(2)) },
    { name: 'RU (dotyk vedení)', initial: Number((results.componentsInitial.RU * 1e6).toFixed(2)), current: Number((results.componentsWithMeasures.RU * 1e6).toFixed(2)) },
    { name: 'RV (požár vedení)', initial: Number((results.componentsInitial.RV * 1e6).toFixed(2)), current: Number((results.componentsWithMeasures.RV * 1e6).toFixed(2)) },
    { name: 'RW (přepětí vedení)', initial: Number((results.componentsInitial.RW * 1e6).toFixed(2)), current: Number((results.componentsWithMeasures.RW * 1e6).toFixed(2)) },
    { name: 'RZ (indukce vedení)', initial: Number((results.componentsInitial.RZ * 1e6).toFixed(2)), current: Number((results.componentsWithMeasures.RZ * 1e6).toFixed(2)) }
  ];

  // Data pro radarový pavučinový graf celkového stavu zabezpečení budovy
  const lpsScoreMap: Record<string, number> = { 'I': 100, 'II': 85, 'III': 70, 'IV': 55, 'none': 10 };
  const lpsCurrentScore = lpsScoreMap[measures.lpsClass] || 70;

  const spdScoreMap: Record<string, number> = { 'I': 100, 'II': 85, 'III_IV': 70, 'none': 15 };
  const spdCurrentScore = spdScoreMap[measures.spdLevel] || (measures.selectedSpdModel ? 90 : 70);

  const r1SafetyScore = Math.max(10, Math.min(100, Math.round(100 - (results.R1 / results.RT1) * 60)));
  const r1InitialScore = Math.max(5, Math.min(45, Math.round(100 - (initialR1 / results.RT1) * 50)));

  const r2SafetyScore = zone.publicServiceType === 'none' ? 100 : (results.isR2Safe ? 92 : 30);
  const r2InitialScore = zone.publicServiceType === 'none' ? 100 : 25;

  const r3SafetyScore = !zone.culturalHeritageValue ? 100 : (results.isR3Safe ? 90 : 25);
  const r3InitialScore = !zone.culturalHeritageValue ? 100 : 20;

  const r4SafetyScore = results.isR4Safe ? 88 : 45;
  const r4InitialScore = 35;

  const earthingScore = results.isEarthingSafe ? 95 : 55;
  const isolatedScore = isolatedLps.enabled
    ? (results.isIsolatedLpsSafe ? 98 : 45)
    : 65;

  const radarChartData = [
    { subject: 'Ochrana osob (R1)', current: r1SafetyScore, baseline: r1InitialScore, fullMark: 100 },
    { subject: 'Sítě & služby (R2)', current: r2SafetyScore, baseline: r2InitialScore, fullMark: 100 },
    { subject: 'Kulturní památky (R3)', current: r3SafetyScore, baseline: r3InitialScore, fullMark: 100 },
    { subject: 'Hospodářská ochrana (R4)', current: r4SafetyScore, baseline: r4InitialScore, fullMark: 100 },
    { subject: 'Jímací soustava LPS', current: lpsCurrentScore, baseline: 10, fullMark: 100 },
    { subject: 'Ochrana SPD', current: spdCurrentScore, baseline: 15, fullMark: 100 },
    { subject: 'Uzemnění & pospojování', current: earthingScore, baseline: 35, fullMark: 100 },
    { subject: 'Oddálení & HVI vodiče', current: isolatedScore, baseline: 20, fullMark: 100 }
  ];

  const overallSafetyIndex = Math.round(
    radarChartData.reduce((acc, curr) => acc + curr.current, 0) / radarChartData.length
  );
  const baselineSafetyIndex = Math.round(
    radarChartData.reduce((acc, curr) => acc + curr.baseline, 0) / radarChartData.length
  );

  // Samostatná srovnávací data pro 4 DEHN karty (R1 až R4)
  const dehnRisksCards = [
    {
      id: 'R1',
      title: 'Riziko R1: Ztráta lidských životů',
      sub: 'Dotyková a kroková napětí, požár stavby, LEMP',
      actual: results.R1,
      limit: results.RT1,
      initial: initialR1,
      isSafe: results.isR1Safe,
      isActive: true,
      ratio: Math.round((results.R1 / results.RT1) * 100),
      reductionPct: initialR1 > 0 ? (100 - (results.R1 / initialR1) * 100).toFixed(1) : '0',
      data: [
        { name: 'Přípustná mez RT1', val: 100, fill: '#3b82f6', label: formatScientific(results.RT1) },
        { name: 'Bez ochrany (R1 init)', val: Math.round((initialR1 / results.RT1) * 100), fill: '#f43f5e', label: formatScientific(initialR1) },
        { name: `S LPS ${measures.lpsClass} (chráněno)`, val: Math.round((results.R1 / results.RT1) * 100), fill: '#10b981', label: formatScientific(results.R1) }
      ]
    },
    {
      id: 'R2',
      title: 'Riziko R2: Ztráta veřejných služeb',
      sub: 'Výpadek telekomunikací, energetiky, nemocnic, plynu',
      actual: results.R2,
      limit: results.RT2,
      initial: initialR2,
      isSafe: results.isR2Safe,
      isActive: zone.publicServiceType !== 'none',
      ratio: Math.round((results.R2 / results.RT2) * 100),
      reductionPct: initialR2 > 0 ? (100 - (results.R2 / initialR2) * 100).toFixed(1) : '0',
      data: [
        { name: 'Přípustná mez RT2', val: 100, fill: '#3b82f6', label: formatScientific(results.RT2) },
        { name: 'Bez ochrany (R2 init)', val: Math.round((initialR2 / results.RT2) * 100), fill: '#f43f5e', label: formatScientific(initialR2) },
        { name: `S LPS ${measures.lpsClass} (chráněno)`, val: Math.round((results.R2 / results.RT2) * 100), fill: '#10b981', label: formatScientific(results.R2) }
      ]
    },
    {
      id: 'R3',
      title: 'Riziko R3: Ztráta kulturního dědictví',
      sub: 'Nenahraditelné kulturní a historické památky, muzea',
      actual: results.R3,
      limit: results.RT3,
      initial: initialR3,
      isSafe: results.isR3Safe,
      isActive: zone.culturalHeritageValue,
      ratio: Math.round((results.R3 / results.RT3) * 100),
      reductionPct: initialR3 > 0 ? (100 - (results.R3 / initialR3) * 100).toFixed(1) : '0',
      data: [
        { name: 'Přípustná mez RT3', val: 100, fill: '#3b82f6', label: formatScientific(results.RT3) },
        { name: 'Bez ochrany (R3 init)', val: Math.round((initialR3 / results.RT3) * 100), fill: '#f43f5e', label: formatScientific(initialR3) },
        { name: `S LPS ${measures.lpsClass} (chráněno)`, val: Math.round((results.R3 / results.RT3) * 100), fill: '#10b981', label: formatScientific(results.R3) }
      ]
    },
    {
      id: 'R4',
      title: 'Riziko R4: Hospodářské škody',
      sub: 'Škody na nosných konstrukcích, instalacích a strojích',
      actual: results.R4,
      limit: results.RT4,
      initial: initialR4,
      isSafe: results.isR4Safe,
      isActive: true,
      ratio: Math.round((results.R4 / results.RT4) * 100),
      reductionPct: initialR4 > 0 ? (100 - (results.R4 / initialR4) * 100).toFixed(1) : '0',
      data: [
        { name: 'Přípustná mez RT4', val: 100, fill: '#3b82f6', label: formatScientific(results.RT4) },
        { name: 'Bez ochrany (R4 init)', val: Math.round((initialR4 / results.RT4) * 100), fill: '#f43f5e', label: formatScientific(initialR4) },
        { name: `S LPS ${measures.lpsClass} (chráněno)`, val: Math.round((results.R4 / results.RT4) * 100), fill: '#10b981', label: formatScientific(results.R4) }
      ]
    }
  ];

  // Orientační srovnávací kalkulace nákladů pro třídy LPS I až IV
  const costComparison = calculateComparativeCosts(project, results.recommendedLpsClass);
  const selectedCost = costComparison.summaries[measures.lpsClass] || costComparison.summaries['III'];

  // Stav zobrazení skládaného sloupcového grafu rozpočtu
  const [budgetChartMode, setBudgetChartMode] = useState<'categories' | 'classes' | 'percent'>('categories');
  const [budgetWithVat, setBudgetWithVat] = useState<boolean>(false);

  // Přepočet cen s ohledem na DPH (21 %)
  const vatMultiplier = budgetWithVat ? 1.21 : 1.0;

  // 1. Rozpad dle položek vybrané třídy LPS
  const budgetCategoriesData = selectedCost.items.map((item) => {
    const mat = Math.round(item.materialCost * vatMultiplier);
    const lab = Math.round(item.laborCost * vatMultiplier);
    const rev = Math.round((item.revisionCost || 0) * vatMultiplier);
    const tot = mat + lab + rev;
    return {
      category: item.category,
      shortCategory: item.category.length > 18 ? item.category.slice(0, 16) + '…' : item.category,
      material: mat,
      labor: lab,
      revision: rev,
      total: tot,
      materialPct: tot > 0 ? Math.round((mat / tot) * 100) : 0,
      laborPct: tot > 0 ? Math.round((lab / tot) * 100) : 0,
      revisionPct: tot > 0 ? Math.round((rev / tot) * 100) : 0,
      description: item.description
    };
  });

  // Celkové součty rozpočtu
  const totalMat = Math.round(selectedCost.totalMaterialCost * vatMultiplier);
  const totalLab = Math.round(selectedCost.totalLaborCost * vatMultiplier);
  const totalRev = Math.round(selectedCost.totalRevisionCost * vatMultiplier);
  const grandTotal = totalMat + totalLab + totalRev;

  const overallMatPct = grandTotal > 0 ? ((totalMat / grandTotal) * 100).toFixed(1) : '0';
  const overallLabPct = grandTotal > 0 ? ((totalLab / grandTotal) * 100).toFixed(1) : '0';
  const overallRevPct = grandTotal > 0 ? ((totalRev / grandTotal) * 100).toFixed(1) : '0';

  // Přidání celkového sloupce projektu do pohledu kategorií
  budgetCategoriesData.push({
    category: 'CELKEM PROJEKT',
    shortCategory: 'CELKEM PROJEKT',
    material: totalMat,
    labor: totalLab,
    revision: totalRev,
    total: grandTotal,
    materialPct: grandTotal > 0 ? Math.round((totalMat / grandTotal) * 100) : 0,
    laborPct: grandTotal > 0 ? Math.round((totalLab / grandTotal) * 100) : 0,
    revisionPct: grandTotal > 0 ? Math.round((totalRev / grandTotal) * 100) : 0,
    description: `Celkový investiční rozpočet LPS třídy ${measures.lpsClass} (${budgetWithVat ? 'včetně 21% DPH' : 'bez DPH'})`
  });

  // 2. Srovnání všech tříd LPS I až IV
  const budgetClassesData = (['IV', 'III', 'II', 'I'] as const).map((cls) => {
    const summary = costComparison.summaries[cls];
    const mat = Math.round(summary.totalMaterialCost * vatMultiplier);
    const lab = Math.round(summary.totalLaborCost * vatMultiplier);
    const rev = Math.round(summary.totalRevisionCost * vatMultiplier);
    const tot = mat + lab + rev;
    return {
      category: `LPS ${cls}`,
      shortCategory: `LPS ${cls}`,
      name: `LPS ${cls}`,
      fullName: `Třída ochrany LPS ${cls}`,
      cls,
      material: mat,
      labor: lab,
      revision: rev,
      total: tot,
      materialPct: tot > 0 ? Math.round((mat / tot) * 100) : 0,
      laborPct: tot > 0 ? Math.round((lab / tot) * 100) : 0,
      revisionPct: tot > 0 ? Math.round((rev / tot) * 100) : 0,
      description: `Třída ochrany LPS ${cls} (mříž ${summary.meshSize}, ${summary.downConductorCount} svodů)`,
      isSelected: measures.lpsClass === cls,
      isRecommended: results.recommendedLpsClass === cls,
      meshSize: summary.meshSize,
      downConductors: summary.downConductorCount
    };
  });

  // 3. Procentuální podíl (100% poměrový graf)
  const budgetPercentData = budgetCategoriesData.map((item) => ({
    category: item.category,
    shortCategory: item.shortCategory,
    name: item.category,
    material: item.materialPct,
    labor: item.laborPct,
    revision: item.revisionPct,
    total: item.total,
    materialPct: item.materialPct,
    laborPct: item.laborPct,
    revisionPct: item.revisionPct,
    rawMaterial: item.material,
    rawLabor: item.labor,
    rawRevision: item.revision,
    description: item.description
  }));

  const activeBudgetChartData =
    budgetChartMode === 'categories'
      ? budgetCategoriesData
      : budgetChartMode === 'classes'
      ? budgetClassesData
      : budgetPercentData;

  // Refs pro vykreslení canvas schémat přímo do náhledu
  const canvasRefLogo = useRef<HTMLCanvasElement | null>(null);
  const canvasRefAd = useRef<HTMLCanvasElement | null>(null);
  const canvasRefIsolated = useRef<HTMLCanvasElement | null>(null);
  const canvasRefLpz = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Vykreslení Oficiálního loga
    if (canvasRefLogo.current) {
      const srcCanvas = createDocumentLogoCanvas();
      const destCtx = canvasRefLogo.current.getContext('2d');
      if (destCtx) {
        canvasRefLogo.current.width = srcCanvas.width;
        canvasRefLogo.current.height = srcCanvas.height;
        destCtx.drawImage(srcCanvas, 0, 0);
      }
    }

    // Vykreslení Schéma 1: Sběrná plocha Ad
    if (canvasRefAd.current) {
      const srcCanvas = createCollectionAreaCanvas(building.length, building.width, building.height, results.Ad);
      const destCtx = canvasRefAd.current.getContext('2d');
      if (destCtx) {
        canvasRefAd.current.width = srcCanvas.width;
        canvasRefAd.current.height = srcCanvas.height;
        destCtx.drawImage(srcCanvas, 0, 0);
      }
    }

    // Vykreslení Schéma 2: Oddálený hromosvod HVI
    if (canvasRefIsolated.current) {
      const srcCanvas = createIsolatedLpsCanvas(
        isolatedLps.protectedEquipment,
        isolatedLps.rodHeight,
        isolatedLps.conductorLength,
        results.separationDistance_s_cm,
        results.hvi_equivalent_distance_cm,
        results.isIsolatedLpsSafe,
        isolatedLps.hviType === 'hvi_light' ? 'DEHN HVI light' : isolatedLps.hviType === 'hvi_standard' ? 'DEHN HVI standard' : isolatedLps.hviType === 'hvi_power' ? 'DEHN HVI power' : 'DEHNiso'
      );
      const destCtx = canvasRefIsolated.current.getContext('2d');
      if (destCtx) {
        canvasRefIsolated.current.width = srcCanvas.width;
        canvasRefIsolated.current.height = srcCanvas.height;
        destCtx.drawImage(srcCanvas, 0, 0);
      }
    }

    // Vykreslení Schéma 3: Zóny LPZ
    if (canvasRefLpz.current) {
      const srcCanvas = createLpzZonationCanvas(`LPS ${measures.lpsClass}`, measures.spdLevel);
      const destCtx = canvasRefLpz.current.getContext('2d');
      if (destCtx) {
        canvasRefLpz.current.width = srcCanvas.width;
        canvasRefLpz.current.height = srcCanvas.height;
        destCtx.drawImage(srcCanvas, 0, 0);
      }
    }
  }, [building, results, isolatedLps, measures]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight font-display flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-400" />
            6. Souhrnná matice rizik a export do Microsoft Word (.docx)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Kompletní inženýrský protokol dle vzoru softwarů Prozik a DEHNsupport Toolbox s vloženými technickými výkresy, tabulkami rizik a podpisovou doložkou.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenStandardsSearch && (
            <button
              type="button"
              onClick={onOpenStandardsSearch}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-amber-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-amber-500/40 rounded-lg transition-colors cursor-pointer shadow-sm shadow-amber-500/10"
              title="Ověřit aktuální normy ČSN EN 62305 a změny online přes Google Search"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Ověřit normy ČSN</span>
            </button>
          )}

          {onOpenCostSettings && (
            <button
              type="button"
              onClick={onOpenCostSettings}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Nastavit jednotkové ceny materiálů a prací pro kalkulaci"
            >
              <Settings2 className="w-4 h-4 text-emerald-400" />
              <span>Upravit ceník</span>
            </button>
          )}

          {onExportBom && (
            <button
              type="button"
              onClick={onExportBom}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Exportovat položkový kusovník materiálu (BOM) do CSV / Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Kusovník materiálu (CSV)</span>
            </button>
          )}

          {onPrintPdf && (
            <button
              type="button"
              onClick={onPrintPdf}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Otevřít dialog tisku prohlížeče pro export do PDF"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Tisk / PDF protokol</span>
            </button>
          )}

          <button
            onClick={onExportDocx}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-500 active:bg-blue-700 shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generuji .docx...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Stáhnout Word (.docx)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Rychlý status panel - 6 inženýrských telemetrických karet */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* R1 Card */}
        <div className={`p-4 rounded-xl border ${
          results.isR1Safe
            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
        }`}>
          <div className="text-xs font-semibold text-slate-400 mb-1">R1: Ztráta lidských životů</div>
          <div className="font-mono text-xl font-bold tabular-nums">
            {formatScientific(results.R1)}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5">Limit RT: {formatScientific(results.RT1)}</div>
          <div className="mt-2 text-xs font-bold flex items-center gap-1">
            {results.isR1Safe ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>BEZPEČNÉ (VYHOVUJE)</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>PŘEKROČENO!</span>
              </>
            )}
          </div>
        </div>

        {/* LPS Card */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 mb-1">Navržená třída ochrany</div>
          <div className="font-mono text-xl font-bold text-blue-400">
            LPS {measures.lpsClass}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
            {measures.selectedSpdModel ? `Katalog: ${measures.selectedSpdModel}` : `SPD úroveň: ${measures.spdLevel}`}
          </div>
          <div className="mt-2 text-xs text-slate-300">
            Doporučeno: LPS {results.recommendedLpsClass}
          </div>
        </div>

        {/* Isolated LPS Card */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 mb-1">Dostatečná vzdálenost s</div>
          <div className="font-mono text-xl font-bold text-slate-200">
            {isolatedLps.enabled ? `${results.separationDistance_s_cm} cm` : 'Neaktivní'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
            {isolatedLps.enabled ? `HVI limit: ${results.hvi_equivalent_distance_cm} cm` : 'Běžný svod'}
          </div>
          <div className="mt-2 text-xs">
            {isolatedLps.enabled ? (
              results.isIsolatedLpsSafe ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  HVI VYHOVUJE (Δs: +{(results.hvi_equivalent_distance_cm - results.separationDistance_s_cm).toFixed(1)} cm)
                </span>
              ) : (
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  HVI NEDOSTATEČNÉ
                </span>
              )
            ) : (
              <span className="text-slate-500">Bez oddálení</span>
            )}
          </div>
        </div>

        {/* Rolling Sphere & Angle Card */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 mb-1 flex items-center justify-between">
            <span>Valící se koule (ČSN EN 62305-3)</span>
            <Compass className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="font-mono text-xl font-bold text-slate-200">
            r = {results.rollingSphereRadius} m
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
            Průhyb p = {results.sagDistance_m.toFixed(2)} m | Chráněno hc = {results.protectedHeight_m.toFixed(2)} m
          </div>
          <div className="mt-2 text-xs">
            {results.isRollingSphereSafe ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Technologie v ochranném prostoru (α = {results.protectiveAngle_deg}°)
              </span>
            ) : (
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Riziko zásahu bleskem (nutno navýšit tyč)
              </span>
            )}
          </div>
        </div>

        {/* Soil Resistivity & Earthing Card */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 mb-1 flex items-center justify-between">
            <span>Rezistivita půdy a zemnič</span>
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="font-mono text-xl font-bold text-slate-200">
            ρ = {building.soilResistivity || 100} Ω·m
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
            Min. délka l₁ = {results.minEarthingLength_l1_m.toFixed(1)} m | Odhad: R ≈ {results.estimatedEarthResistance_ohm.toFixed(1)} Ω
          </div>
          <div className="mt-2 text-xs">
            {results.isEarthingSafe ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Zemnič vyhovuje normě R ≤ 10 Ω
              </span>
            ) : (
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Doporučeno prodloužit zemnič
              </span>
            )}
          </div>
        </div>

        {/* R4 Card */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 mb-1">R4: Hospodářské škody</div>
          <div className="font-mono text-xl font-bold text-slate-200 tabular-nums">
            {formatScientific(results.R4)}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5">Limit RT: {formatScientific(results.RT4)}</div>
          <div className="mt-2 text-xs font-medium text-slate-300">
            {results.isR4Safe ? 'Ekonomicky akceptovatelné' : 'Doporučena instalace SPD'}
          </div>
        </div>

        {/* FVE PV Installation Card (pokud je na střeše) */}
        {building.pvInstallation?.enabled && results.pvEvaluation && (
          <div className={`p-4 rounded-xl border ${
            results.pvEvaluation.isSeparationMaintained
              ? 'bg-slate-900 border-emerald-800/60'
              : 'bg-rose-950/20 border-rose-700/60'
          }`}>
            <div className="text-xs font-semibold text-slate-400 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-amber-300">
                <Sun className="w-3.5 h-3.5" />
                Střešní FVE ({building.pvInstallation.powerKwp} kWp)
              </span>
              <span className="font-mono text-[10px] text-slate-400">CLC/TS 51643-32</span>
            </div>
            <div className="font-mono text-xl font-bold text-slate-100">
              d = {results.pvEvaluation.actualDistance_d_cm} cm vs s = {results.pvEvaluation.separationDistance_s_cm} cm
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
              SPD: {results.pvEvaluation.requiredSpdDC} | Pospojení: {results.pvEvaluation.requiredBonding === 'direct_galvanic_16mm2_Cu' ? 'Cu ≥ 16 mm²' : 'PE ≥ 6 mm²'}
            </div>
            <div className="mt-2 text-xs">
              {results.pvEvaluation.isSeparationMaintained ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Odděleno (d ≥ s) - bezpečný stav
                </span>
              ) : (
                <span className="text-rose-400 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Riziko přeskoku (d &lt; s) - vyžaduje Cu 16 mm²
                </span>
              )}
            </div>
          </div>
        )}

        {/* Vliv stínění okolními stavbami a vlnového pole (ČSN EN 62305-2/4) */}
        {results.surroundingShielding?.hasShielding && (
          <div className="p-4 rounded-xl bg-slate-900 border border-indigo-700/60 shadow-lg">
            <div className="text-xs font-semibold text-slate-400 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-indigo-300">
                <Building2 className="w-3.5 h-3.5" />
                Stínění okolím (ČSN EN 62305-2/4)
              </span>
              <span className="font-mono text-[10px] text-indigo-400 font-bold">
                {results.surroundingShielding.waveFieldAttenuation_dB > 0 ? `-${results.surroundingShielding.waveFieldAttenuation_dB} dB` : '0 dB'}
              </span>
            </div>
            <div className="font-mono text-xl font-bold text-slate-100">
              Cd,eff = {results.surroundingShielding.effectiveCd} | KMS = {results.surroundingShielding.waveFieldAttenuationFactor_Kms}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
              Redukce Nd: -{results.surroundingShielding.directStrikeReductionPct}% | Záchyt okolím: {results.surroundingShielding.strikeInterceptionProbPct}%
            </div>
            <div className="mt-2 text-xs text-indigo-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>{results.surroundingShielding.verdict}</span>
            </div>
          </div>
        )}
      </div>

      {/* Recharts Vizualizace výsledků výpočtu rizik (R1 - R4) */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Grafická vizualizace rizik (R1–R4) dle ČSN EN 62305-2
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Porovnání skutečných hodnot s přípustnými limity RT před vygenerováním technické zprávy.
            </p>
          </div>

          {/* Segmented Control pro přepínání pohledů grafu */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-800/90 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setChartView('dehn')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                chartView === 'dehn'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-300" />
              Srovnání R1–R4 (DEHN)
            </button>
            <button
              type="button"
              onClick={() => setChartView('radar')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                chartView === 'radar'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-300" />
              Radar zabezpečení
            </button>
            <button
              type="button"
              onClick={() => setChartView('ratio')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
                chartView === 'ratio'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Poměr k limitu RT (%)
            </button>
            <button
              type="button"
              onClick={() => setChartView('comparison')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                chartView === 'comparison'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              Před a po LPS
            </button>
            <button
              type="button"
              onClick={() => setChartView('components')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                chartView === 'components'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Složky RA–RZ
            </button>
          </div>
        </div>

        {/* 0. Pohled: Samostatné srovnávací karty DEHN pro každé riziko R1 až R4 */}
        {chartView === 'dehn' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dehnRisksCards.map((card) => (
                <div
                  key={card.id}
                  className={`p-4 rounded-xl border transition-all ${
                    !card.isActive
                      ? 'bg-slate-950/40 border-slate-800 opacity-60'
                      : card.isSafe
                      ? 'bg-slate-950 border-emerald-500/30'
                      : 'bg-slate-950 border-rose-500/40 shadow-rose-950/20'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-800">
                    <div>
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        <span>{card.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{card.sub}</div>
                    </div>
                    <div>
                      {!card.isActive ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-400">
                          NEAPLIKUJE SE
                        </span>
                      ) : card.isSafe ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          VYHOVUJE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          PŘEKROČENO
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Horizontal Bar Chart comparing Limit RT, Unprotected and Protected */}
                  <div className="h-28 w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={card.data}
                        layout="vertical"
                        margin={{ top: 4, right: 35, left: 5, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" horizontal={false} />
                        <XAxis
                          type="number"
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 10 }}
                          unit=" %"
                          domain={[0, (dataMax: number) => Math.max(120, Math.ceil(dataMax * 1.15))]}
                        />
                        <YAxis
                          dataKey="name"
                          type="category"
                          stroke="#64748b"
                          tick={{ fill: '#cbd5e1', fontSize: 10 }}
                          width={125}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs font-mono space-y-1">
                                  <div className="font-bold text-white font-sans">{d.name}</div>
                                  <div className="text-slate-300">Hodnota: <span className="font-bold text-white">{d.label}</span></div>
                                  <div className="text-blue-400 font-bold">{d.val} % z tolerovatelné meze RT</div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <ReferenceLine x={100} stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="3 3" />
                        <Bar dataKey="val" radius={[0, 4, 4, 0]}>
                          {card.data.map((entry, idx) => (
                            <Cell key={`bar-${idx}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Scientific Data & Reductions */}
                  <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono grid grid-cols-2 gap-2 text-slate-400">
                    <div>
                      <span>Skutečné riziko R: </span>
                      <strong className={card.isSafe ? 'text-emerald-400' : 'text-rose-400'}>
                        {formatScientific(card.actual)}
                      </strong>
                    </div>
                    <div className="text-right">
                      <span>Mez RT: </span>
                      <strong className="text-slate-300">{formatScientific(card.limit)}</strong>
                    </div>
                    <div>
                      <span>Před opatřeními: </span>
                      <span className="text-slate-400">{formatScientific(card.initial)}</span>
                    </div>
                    <div className="text-right font-sans font-semibold text-blue-400">
                      <span>Pokles: -{card.reductionPct} %</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5 text-blue-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
                  Modrý sloupec / linka = Tolerovatelná mez RT (100 %) dle normy ČSN EN 62305-2
                </span>
                <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
                  Červený = Bez ochranných opatření
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                  Zelený = S navrženým systémem LPS {measures.lpsClass} a SPD
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Radarový pavučinový graf celkového stavu zabezpečení budovy */}
        {chartView === 'radar' && (
          <div className="space-y-4">
            {/* Telemetrický banner */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold font-mono text-lg">
                  {overallSafetyIndex}%
                </div>
                <div>
                  <div className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Index celkového zabezpečení stavby dle ČSN EN 62305</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {overallSafetyIndex >= 80 ? 'Vynikající shoda (Třída A+)' : overallSafetyIndex >= 60 ? 'Vyhovující (Třída B)' : 'Vyžaduje doplnění'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Původní stav bez ochrany dosahoval pouze <span className="text-rose-400 font-bold font-mono">{baselineSafetyIndex} %</span>. Systém LPS {measures.lpsClass} navyšuje bezpečnost o +{overallSafetyIndex - baselineSafetyIndex} p.b.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-3 h-3 rounded-sm bg-rose-500/40 border border-rose-500 inline-block" />
                  <span>Výchozí nechráněný stav</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500/60 border border-emerald-400 inline-block" />
                  <span>Navržený stav (LPS {measures.lpsClass} + SPD)</span>
                </div>
              </div>
            </div>

            {/* Radar and metrics split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Radar Chart canvas */}
              <div className="lg:col-span-7 h-96 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarChartData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Radar
                      name="Výchozí stav bez ochrany"
                      dataKey="baseline"
                      stroke="#f43f5e"
                      fill="#f43f5e"
                      fillOpacity={0.25}
                    />
                    <Radar
                      name={`Navržený stav (LPS ${measures.lpsClass} + SPD)`}
                      dataKey="current"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.45}
                    />
                    <Legend wrapperStyle={{ paddingTop: 10, fontSize: 11 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const subject = payload[0].payload.subject;
                          const baseline = payload.find(p => p.dataKey === 'baseline')?.value;
                          const current = payload.find(p => p.dataKey === 'current')?.value;
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1">
                              <div className="font-bold text-white text-sm">{subject}</div>
                              <div className="pt-1.5 border-t border-slate-800 space-y-1 font-mono text-[11px]">
                                <div className="flex justify-between gap-4 text-rose-400">
                                  <span>Bez ochrany:</span>
                                  <span className="font-bold">{baseline} %</span>
                                </div>
                                <div className="flex justify-between gap-4 text-emerald-400">
                                  <span>S LPS {measures.lpsClass}:</span>
                                  <span className="font-bold">{current} %</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Breakdown progress bars */}
              <div className="lg:col-span-5 space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-800">
                  <ShieldAlert className="w-4 h-4 text-blue-400" />
                  Hodnocení 8 ochranných dimenzí
                </div>
                <div className="space-y-2.5 text-xs">
                  {radarChartData.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-slate-300">
                        <span className="truncate pr-2">{item.subject}</span>
                        <span className="font-mono font-bold text-emerald-400">{item.current} %</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${item.current}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 1. Pohled: Poměr k tolerovatelné mezi RT (%) */}
        {chartView === 'ratio' && (
          <div className="space-y-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={normalizedData} margin={{ top: 20, right: 30, left: 10, bottom: 15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="shortName" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    unit=" %"
                    domain={[0, (dataMax: number) => Math.max(120, Math.ceil(dataMax * 1.2))]}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1">
                            <div className="font-bold text-white text-sm">{d.name}</div>
                            <div className="text-slate-400">{d.desc}</div>
                            <div className="pt-2 border-t border-slate-800 space-y-1 font-mono text-[11px]">
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Vypočtené riziko R:</span>
                                <span className="text-white font-bold">{formatScientific(d.actual)}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Přípustná mez RT:</span>
                                <span className="text-slate-300">{formatScientific(d.limit)}</span>
                              </div>
                              <div className="flex justify-between gap-4 pt-1 font-bold">
                                <span className="text-slate-300">Poměr k limitu:</span>
                                <span className={d.ratio <= 100 ? 'text-emerald-400' : 'text-rose-400'}>
                                  {d.ratio} % {d.ratio <= 100 ? '(VYHOVUJE)' : '(PŘEKROČENO)'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine
                    y={100}
                    stroke="#f43f5e"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    label={{
                      value: 'Tolerovatelná mez RT = 100 %',
                      fill: '#f43f5e',
                      position: 'insideTopRight',
                      fontSize: 11,
                      fontWeight: 'bold'
                    }}
                  />
                  <Bar dataKey="ratio" name="Skutečné riziko (% z RT)" radius={[6, 6, 0, 0]}>
                    {normalizedData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.ratio <= 100 ? '#10b981' : '#f43f5e'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                  Vyhovuje normě (R ≤ RT)
                </span>
                <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
                  Překračuje mez (R &gt; RT)
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-4 border-t-2 border-dashed border-rose-500 inline-block" />
                  Červená linka = 100 % (maximální přípustné riziko dle normy)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2. Pohled: Srovnání stavu před vs. po aplikaci LPS */}
        {chartView === 'comparison' && (
          <div className="space-y-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={normalizedData} margin={{ top: 20, right: 30, left: 10, bottom: 15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="shortName" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} unit=" %" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1">
                            <div className="font-bold text-white text-sm">{d.name}</div>
                            <div className="pt-2 border-t border-slate-800 space-y-1 font-mono text-[11px]">
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Bez ochrany (Rinit):</span>
                                <span className="text-rose-400 font-bold">{d.initialRatio} % RT ({formatScientific(d.initialVal)})</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">S opatřeními LPS {measures.lpsClass}:</span>
                                <span className="text-emerald-400 font-bold">{d.ratio} % RT ({formatScientific(d.actual)})</span>
                              </div>
                              <div className="flex justify-between gap-4 pt-1 font-bold">
                                <span className="text-slate-300">Snížení rizika:</span>
                                <span className="text-blue-400">
                                  {d.initialRatio > 0 ? (100 - (d.ratio / d.initialRatio) * 100).toFixed(0) : 0} % pokles
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                    formatter={(value) => <span className="text-slate-300">{value}</span>}
                  />
                  <ReferenceLine y={100} stroke="#f43f5e" strokeWidth={1.5} strokeDasharray="3 3" />
                  <Bar dataKey="initialRatio" name="Před opatřeními (% RT)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ratio" name={`S navrženým LPS ${measures.lpsClass} (% RT)`} fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
              Graf dokumentuje radikální snížení rizika po instalaci jímací soustavy LPS {measures.lpsClass} a koordinované přepěťové ochrany SPD {measures.spdLevel}.
            </div>
          </div>
        )}

        {/* 3. Pohled: Rozpad jednotlivých složek RA až RZ */}
        {chartView === 'components' && (
          <div className="space-y-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={componentsChartData} margin={{ top: 20, right: 30, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    angle={-20}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} unit=" ×10⁻⁶" />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1">
                            <div className="font-bold text-white text-sm">{label}</div>
                            <div className="pt-2 border-t border-slate-800 space-y-1 font-mono text-[11px]">
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Před opatřeními:</span>
                                <span className="text-rose-400 font-bold">{payload[0]?.value} × 10⁻⁶</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Po aplikaci LPS:</span>
                                <span className="text-emerald-400 font-bold">{payload[1]?.value} × 10⁻⁶</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                    formatter={(value) => <span className="text-slate-300">{value}</span>}
                  />
                  <Bar dataKey="initial" name="Původní složka (× 10⁻⁶)" fill="#64748b" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="current" name="Po aplikaci LPS (× 10⁻⁶)" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
              Přehled potlačení jednotlivých rizikových složek (RA úraz dotykem, RB požár, RC přepětí ve stavbě, RU/RV/RW sítě) podle ČSN EN 62305-2.
            </div>
          </div>
        )}
      </div>

      {/* Detailní rozpad složek */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          Podrobný rozpad dílčích složek rizik dle ČSN EN 62305-2 ed. 2
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-2.5 px-3">Složka</th>
                <th className="py-2.5 px-3">Zdroj poškození a mechanismus ztráty</th>
                <th className="py-2.5 px-3 text-right">Bez opatření</th>
                <th className="py-2.5 px-3 text-right">S opatřeními LPS</th>
                <th className="py-2.5 px-3 text-center">Snížení</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              <tr>
                <td className="py-2 px-3 font-bold text-blue-400">RA</td>
                <td className="py-2 px-3 font-sans text-slate-300">Úraz osob dotykovým napětím při úderu do stavby</td>
                <td className="py-2 px-3 text-right text-slate-400">{formatScientific(results.componentsInitial.RA)}</td>
                <td className="py-2 px-3 text-right text-emerald-400 font-bold">{formatScientific(results.componentsWithMeasures.RA)}</td>
                <td className="py-2 px-3 text-center text-slate-400">{(results.componentsInitial.RA > 0 ? (100 - (results.componentsWithMeasures.RA / results.componentsInitial.RA) * 100).toFixed(0) : 0)} %</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-bold text-blue-400">RB</td>
                <td className="py-2 px-3 font-sans text-slate-300">Fyzické poškození stavby požárem při úderu do stavby</td>
                <td className="py-2 px-3 text-right text-slate-400">{formatScientific(results.componentsInitial.RB)}</td>
                <td className="py-2 px-3 text-right text-emerald-400 font-bold">{formatScientific(results.componentsWithMeasures.RB)}</td>
                <td className="py-2 px-3 text-center text-slate-400">{(results.componentsInitial.RB > 0 ? (100 - (results.componentsWithMeasures.RB / results.componentsInitial.RB) * 100).toFixed(0) : 0)} %</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-bold text-blue-400">RC</td>
                <td className="py-2 px-3 font-sans text-slate-300">Porucha vnitřních elektronických systémů (LEMP)</td>
                <td className="py-2 px-3 text-right text-slate-400">{formatScientific(results.componentsInitial.RC)}</td>
                <td className="py-2 px-3 text-right text-emerald-400 font-bold">{formatScientific(results.componentsWithMeasures.RC)}</td>
                <td className="py-2 px-3 text-center text-slate-400">{(results.componentsInitial.RC > 0 ? (100 - (results.componentsWithMeasures.RC / results.componentsInitial.RC) * 100).toFixed(0) : 0)} %</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-bold text-blue-400">RM</td>
                <td className="py-2 px-3 font-sans text-slate-300">Porucha systémů v důsledku úderu v blízkosti stavby</td>
                <td className="py-2 px-3 text-right text-slate-400">{formatScientific(results.componentsInitial.RM)}</td>
                <td className="py-2 px-3 text-right text-emerald-400 font-bold">{formatScientific(results.componentsWithMeasures.RM)}</td>
                <td className="py-2 px-3 text-center text-slate-400">{(results.componentsInitial.RM > 0 ? (100 - (results.componentsWithMeasures.RM / results.componentsInitial.RM) * 100).toFixed(0) : 0)} %</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-bold text-blue-400">RU</td>
                <td className="py-2 px-3 font-sans text-slate-300">Úraz osob způsobený bleskovým proudem ve vedení</td>
                <td className="py-2 px-3 text-right text-slate-400">{formatScientific(results.componentsInitial.RU)}</td>
                <td className="py-2 px-3 text-right text-emerald-400 font-bold">{formatScientific(results.componentsWithMeasures.RU)}</td>
                <td className="py-2 px-3 text-center text-slate-400">{(results.componentsInitial.RU > 0 ? (100 - (results.componentsWithMeasures.RU / results.componentsInitial.RU) * 100).toFixed(0) : 0)} %</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-bold text-blue-400">RV</td>
                <td className="py-2 px-3 font-sans text-slate-300">Fyzické poškození požárem z připojeného vedení</td>
                <td className="py-2 px-3 text-right text-slate-400">{formatScientific(results.componentsInitial.RV)}</td>
                <td className="py-2 px-3 text-right text-emerald-400 font-bold">{formatScientific(results.componentsWithMeasures.RV)}</td>
                <td className="py-2 px-3 text-center text-slate-400">{(results.componentsInitial.RV > 0 ? (100 - (results.componentsWithMeasures.RV / results.componentsInitial.RV) * 100).toFixed(0) : 0)} %</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-bold text-blue-400">RW</td>
                <td className="py-2 px-3 font-sans text-slate-300">Porucha zařízení způsobená přepětím po vedení</td>
                <td className="py-2 px-3 text-right text-slate-400">{formatScientific(results.componentsInitial.RW)}</td>
                <td className="py-2 px-3 text-right text-emerald-400 font-bold">{formatScientific(results.componentsWithMeasures.RW)}</td>
                <td className="py-2 px-3 text-center text-slate-400">{(results.componentsInitial.RW > 0 ? (100 - (results.componentsWithMeasures.RW / results.componentsInitial.RW) * 100).toFixed(0) : 0)} %</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-bold text-blue-400">RZ</td>
                <td className="py-2 px-3 font-sans text-slate-300">Porucha zařízení indukcí do vedení v okolí</td>
                <td className="py-2 px-3 text-right text-slate-400">{formatScientific(results.componentsInitial.RZ)}</td>
                <td className="py-2 px-3 text-right text-emerald-400 font-bold">{formatScientific(results.componentsWithMeasures.RZ)}</td>
                <td className="py-2 px-3 text-center text-slate-400">{(results.componentsInitial.RZ > 0 ? (100 - (results.componentsWithMeasures.RZ / results.componentsInitial.RZ) * 100).toFixed(0) : 0)} %</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Orientační kalkulace nákladů LPS, skládaný sloupcový graf a srovnávací tabulka tříd I až IV */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-400" />
              Inženýrská kalkulace rozpočtu LPS a poměr nákladů (ČSN EN 62305 & ČSN 33 1500)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Skládaný rozpočtový model: poměr cen materiálu (DEHN/OEZ), montážních prací a výchozí revize dle geometrie stavby ({building.length * building.width} m² střechy, {2 * (building.length + building.width)} m obvod).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* DPH přepínač */}
            <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700/60 text-xs">
              <button
                type="button"
                onClick={() => setBudgetWithVat(false)}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  !budgetWithVat ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Bez DPH
              </button>
              <button
                type="button"
                onClick={() => setBudgetWithVat(true)}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  budgetWithVat ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Vč. 21% DPH
              </button>
            </div>

            {onOpenCostSettings && (
              <button
                type="button"
                onClick={onOpenCostSettings}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Upravit sazby ceníku materiálů a montáží"
              >
                <Settings2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Ceník sazeb</span>
              </button>
            )}
          </div>
        </div>

        {/* Souhrnné KPI karty rozpočtu */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Karta 1: Materiál */}
          <div className="p-4 rounded-xl bg-slate-800/70 border border-blue-500/30 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold text-blue-300 flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-blue-400" />
                Materiál (DEHN / OEZ)
              </span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                {overallMatPct} %
              </span>
            </div>
            <div className="font-mono text-xl font-bold text-white tabular-nums">
              {totalMat.toLocaleString('cs-CZ')} Kč
            </div>
            <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
              AlMgSi vodiče, jímací tyče, svorky, FeZn pásovina a SPD
            </div>
          </div>

          {/* Karta 2: Montážní práce */}
          <div className="p-4 rounded-xl bg-slate-800/70 border border-amber-500/30 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                Montážní práce elektro
              </span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                {overallLabPct} %
              </span>
            </div>
            <div className="font-mono text-xl font-bold text-white tabular-nums">
              {totalLab.toLocaleString('cs-CZ')} Kč
            </div>
            <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
              Výškové práce na střeše, montáž svodů, výkopy a zapojení rozváděčů
            </div>
          </div>

          {/* Karta 3: Revize a zkoušky */}
          <div className="p-4 rounded-xl bg-slate-800/70 border border-emerald-500/30 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
                Revize & certifikace
              </span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                {overallRevPct} %
              </span>
            </div>
            <div className="font-mono text-xl font-bold text-white tabular-nums">
              {totalRev.toLocaleString('cs-CZ')} Kč
            </div>
            <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
              Výchozí revizní zpráva ČSN 33 1500, měření zemničů (R ≤ 10 Ω)
            </div>
          </div>

          {/* Karta 4: Celkový rozpočet LPS */}
          <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/50 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold text-blue-200 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-blue-400" />
                Celkem LPS {measures.lpsClass}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {budgetWithVat ? 's DPH' : 'bez DPH'}
              </span>
            </div>
            <div className="font-mono text-xl font-bold text-blue-300 tabular-nums">
              {grandTotal.toLocaleString('cs-CZ')} Kč
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              ~{Math.round(grandTotal / (building.length * building.width)).toLocaleString('cs-CZ')} Kč / m² střechy
            </div>
          </div>
        </div>

        {/* Skládaný sloupcový graf rozpočtu (Recharts) */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-slate-200">
                Skládaný sloupcový graf rozpočtu (Materiál + Montáž + Revize)
              </span>
            </div>

            {/* Segmented control pohledů grafu rozpočtu */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-800/90 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setBudgetChartMode('categories')}
                className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                  budgetChartMode === 'categories'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Položkový rozpad ({measures.lpsClass})
              </button>
              <button
                type="button"
                onClick={() => setBudgetChartMode('classes')}
                className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                  budgetChartMode === 'classes'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Srovnání tříd LPS I až IV
              </button>
              <button
                type="button"
                onClick={() => setBudgetChartMode('percent')}
                className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                  budgetChartMode === 'percent'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Percent className="w-3 h-3" />
                Poměr v % (100% stack)
              </button>
            </div>
          </div>

          {/* Vlastní Recharts BarChart container */}
          <div className="h-80 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={activeBudgetChartData}
                margin={{ top: 20, right: 25, left: 15, bottom: budgetChartMode === 'classes' ? 15 : 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey={budgetChartMode === 'classes' ? 'name' : 'category'}
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  interval={0}
                  angle={budgetChartMode === 'classes' ? 0 : -15}
                  textAnchor={budgetChartMode === 'classes' ? 'middle' : 'end'}
                  height={budgetChartMode === 'classes' ? 30 : 50}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  unit={budgetChartMode === 'percent' ? ' %' : ' Kč'}
                  tickFormatter={(val) =>
                    budgetChartMode === 'percent' ? `${val}%` : `${Math.round(val / 1000)}k`
                  }
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0]?.payload;
                      const title = d?.fullName || d?.category || label;
                      const isPercentMode = budgetChartMode === 'percent';
                      const matVal = isPercentMode ? d?.rawMaterial : d?.material;
                      const labVal = isPercentMode ? d?.rawLabor : d?.labor;
                      const revVal = isPercentMode ? d?.rawRevision : d?.revision;
                      const totVal = d?.total ?? (matVal + labVal + revVal);
                      const matPct = d?.materialPct ?? (totVal > 0 ? Math.round((matVal / totVal) * 100) : 0);
                      const labPct = d?.laborPct ?? (totVal > 0 ? Math.round((labVal / totVal) * 100) : 0);
                      const revPct = d?.revisionPct ?? (totVal > 0 ? Math.round((revVal / totVal) * 100) : 0);

                      return (
                        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3.5 rounded-xl shadow-2xl text-xs space-y-2 min-w-[250px]">
                          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                            <span className="font-bold text-white text-sm">{title}</span>
                            {d?.isSelected && (
                              <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
                                ZVOLENO
                              </span>
                            )}
                            {d?.isRecommended && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
                                DOPORUČENO
                              </span>
                            )}
                          </div>

                          {d?.description && (
                            <div className="text-[11px] text-slate-400 italic">
                              {d.description}
                            </div>
                          )}

                          <div className="space-y-1.5 pt-1 font-mono text-[11px]">
                            <div className="flex items-center justify-between text-blue-400">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
                                Materiál (DEHN / OEZ):
                              </span>
                              <span className="font-bold tabular-nums">
                                {matVal?.toLocaleString('cs-CZ')} Kč ({matPct} %)
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-amber-400">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
                                Montážní práce elektro:
                              </span>
                              <span className="font-bold tabular-nums">
                                {labVal?.toLocaleString('cs-CZ')} Kč ({labPct} %)
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-emerald-400">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                                Revize a certifikace:
                              </span>
                              <span className="font-bold tabular-nums">
                                {revVal?.toLocaleString('cs-CZ')} Kč ({revPct} %)
                              </span>
                            </div>
                          </div>

                          <div className="border-t border-slate-800 pt-2 flex items-center justify-between font-sans">
                            <span className="text-slate-300 font-bold">
                              Celkem {budgetWithVat ? '(vč. DPH)' : '(bez DPH)'}:
                            </span>
                            <span className="text-white font-mono font-bold text-sm tabular-nums">
                              {totVal?.toLocaleString('cs-CZ')} Kč
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                  formatter={(value) => <span className="text-slate-300 font-medium">{value}</span>}
                />
                <Bar
                  dataKey="material"
                  name={budgetChartMode === 'percent' ? 'Materiál (% z ceny)' : 'Materiál (DEHN / OEZ)'}
                  stackId="budget"
                  fill="#3b82f6"
                />
                <Bar
                  dataKey="labor"
                  name={budgetChartMode === 'percent' ? 'Montáž (% z ceny)' : 'Montážní práce'}
                  stackId="budget"
                  fill="#f59e0b"
                />
                <Bar
                  dataKey="revision"
                  name={budgetChartMode === 'percent' ? 'Revize (% z ceny)' : 'Revize & certifikace'}
                  stackId="budget"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Vizuální rozpadový pruh celkového poměru v projektu */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">
                Celkový poměr nákladů projektu LPS {measures.lpsClass}:
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                Celkem: {grandTotal.toLocaleString('cs-CZ')} Kč {budgetWithVat ? 'vč. DPH' : 'bez DPH'}
              </span>
            </div>

            {/* Segmentovaný progress bar */}
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-800 shadow-inner">
              <div
                style={{ width: `${overallMatPct}%` }}
                className="bg-blue-500 h-full transition-all duration-500 relative group"
                title={`Materiál: ${overallMatPct}%`}
              />
              <div
                style={{ width: `${overallLabPct}%` }}
                className="bg-amber-500 h-full transition-all duration-500 relative group"
                title={`Montážní práce: ${overallLabPct}%`}
              />
              <div
                style={{ width: `${overallRevPct}%` }}
                className="bg-emerald-500 h-full transition-all duration-500 relative group"
                title={`Revize a měření: ${overallRevPct}%`}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5 text-blue-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
                  Materiál: {totalMat.toLocaleString('cs-CZ')} Kč ({overallMatPct} %)
                </span>
                <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
                  Montáž: {totalLab.toLocaleString('cs-CZ')} Kč ({overallLabPct} %)
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                  Revize ČSN 33 1500: {totalRev.toLocaleString('cs-CZ')} Kč ({overallRevPct} %)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Srovnávací tabulka tříd I až IV */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Podrobná srovnávací tabulka tříd ochrany LPS I až IV
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">
              Navržená třída: <strong className="text-blue-400 font-bold">LPS {measures.lpsClass}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono">
                  <th className="py-2.5 px-3">Položka kalkulace</th>
                  <th className="py-2.5 px-3 text-center">Třída LPS IV</th>
                  <th className="py-2.5 px-3 text-center">Třída LPS III</th>
                  <th className="py-2.5 px-3 text-center">Třída LPS II</th>
                  <th className="py-2.5 px-3 text-center">Třída LPS I</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                <tr>
                  <td className="py-2.5 px-3 font-sans text-slate-300 font-medium">Hustota mříže a svodů</td>
                  {(['IV', 'III', 'II', 'I'] as const).map((c) => {
                    const s = costComparison.summaries[c];
                    const isSel = measures.lpsClass === c;
                    return (
                      <td key={c} className={`py-2 px-3 text-center ${isSel ? 'bg-blue-950/20 text-blue-300 font-bold' : 'text-slate-400'}`}>
                        {s.meshSize} ({s.downConductorCount} svody)
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-sans text-slate-300">1. Jímací soustava na střeše</td>
                  {(['IV', 'III', 'II', 'I'] as const).map((c) => (
                    <td key={c} className={`py-2 px-3 text-center ${measures.lpsClass === c ? 'bg-blue-950/20 font-bold text-slate-200' : 'text-slate-400'}`}>
                      {costComparison.summaries[c].items[0]?.totalCost.toLocaleString('cs-CZ')} Kč
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-sans text-slate-300">2. Svodová soustava a ZS</td>
                  {(['IV', 'III', 'II', 'I'] as const).map((c) => (
                    <td key={c} className={`py-2 px-3 text-center ${measures.lpsClass === c ? 'bg-blue-950/20 font-bold text-slate-200' : 'text-slate-400'}`}>
                      {costComparison.summaries[c].items[1]?.totalCost.toLocaleString('cs-CZ')} Kč
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-sans text-slate-300">3. Uzemňovací soustava FeZn</td>
                  {(['IV', 'III', 'II', 'I'] as const).map((c) => (
                    <td key={c} className={`py-2 px-3 text-center ${measures.lpsClass === c ? 'bg-blue-950/20 font-bold text-slate-200' : 'text-slate-400'}`}>
                      {costComparison.summaries[c].items[2]?.totalCost.toLocaleString('cs-CZ')} Kč
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-sans text-slate-300">4. Koordinované přepěťové ochrany SPD</td>
                  {(['IV', 'III', 'II', 'I'] as const).map((c) => (
                    <td key={c} className={`py-2 px-3 text-center ${measures.lpsClass === c ? 'bg-blue-950/20 font-bold text-slate-200' : 'text-slate-400'}`}>
                      {costComparison.summaries[c].items[3]?.totalCost.toLocaleString('cs-CZ')} Kč
                    </td>
                  ))}
                </tr>
                {isolatedLps.enabled && (
                  <tr>
                    <td className="py-2.5 px-3 font-sans text-blue-300">5. Oddálený systém HVI ({isolatedLps.conductorLength} m)</td>
                    {(['IV', 'III', 'II', 'I'] as const).map((c) => {
                      const hviItem = costComparison.summaries[c].items.find(i => i.category.includes('HVI'));
                      return (
                        <td key={c} className={`py-2 px-3 text-center ${measures.lpsClass === c ? 'bg-blue-950/20 font-bold text-blue-300' : 'text-slate-400'}`}>
                          {hviItem ? `${hviItem.totalCost.toLocaleString('cs-CZ')} Kč` : '-'}
                        </td>
                      );
                    })}
                  </tr>
                )}
                <tr>
                  <td className="py-2.5 px-3 font-sans text-slate-300">Výchozí revize dle ČSN 33 1500</td>
                  {(['IV', 'III', 'II', 'I'] as const).map((c) => {
                    const revItem = costComparison.summaries[c].items.find(i => i.category.includes('Revize'));
                    return (
                      <td key={c} className={`py-2 px-3 text-center ${measures.lpsClass === c ? 'bg-blue-950/20 font-bold text-slate-200' : 'text-slate-400'}`}>
                        {revItem ? `${revItem.totalCost.toLocaleString('cs-CZ')} Kč` : '-'}
                      </td>
                    );
                  })}
                </tr>

                {/* Shrnutí dle složek: Materiál / Práce / Revize */}
                <tr className="border-t border-slate-700/80 bg-slate-800/20">
                  <td className="py-2 px-3 font-sans text-blue-400 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                    Materiál celkem (Kč)
                  </td>
                  {(['IV', 'III', 'II', 'I'] as const).map((c) => (
                    <td key={c} className={`py-2 px-3 text-center ${measures.lpsClass === c ? 'bg-blue-950/30 text-blue-300 font-bold' : 'text-slate-300'}`}>
                      {costComparison.summaries[c].totalMaterialCost.toLocaleString('cs-CZ')} Kč
                    </td>
                  ))}
                </tr>
                <tr className="bg-slate-800/20">
                  <td className="py-2 px-3 font-sans text-amber-400 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    Montážní práce elektro (Kč)
                  </td>
                  {(['IV', 'III', 'II', 'I'] as const).map((c) => (
                    <td key={c} className={`py-2 px-3 text-center ${measures.lpsClass === c ? 'bg-amber-950/30 text-amber-300 font-bold' : 'text-slate-300'}`}>
                      {costComparison.summaries[c].totalLaborCost.toLocaleString('cs-CZ')} Kč
                    </td>
                  ))}
                </tr>
                <tr className="bg-slate-800/20">
                  <td className="py-2 px-3 font-sans text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    Revize & certifikace (Kč)
                  </td>
                  {(['IV', 'III', 'II', 'I'] as const).map((c) => (
                    <td key={c} className={`py-2 px-3 text-center ${measures.lpsClass === c ? 'bg-emerald-950/30 text-emerald-300 font-bold' : 'text-slate-300'}`}>
                      {costComparison.summaries[c].totalRevisionCost.toLocaleString('cs-CZ')} Kč
                    </td>
                  ))}
                </tr>

                <tr className="border-t border-slate-700 bg-slate-800/40">
                  <td className="py-2.5 px-3 font-sans font-bold text-white">Celkem bez DPH</td>
                  {(['IV', 'III', 'II', 'I'] as const).map((c) => (
                    <td key={c} className={`py-2.5 px-3 text-center font-bold ${measures.lpsClass === c ? 'bg-blue-600/20 text-blue-400 text-sm' : 'text-slate-200'}`}>
                      {costComparison.summaries[c].totalWithoutVat.toLocaleString('cs-CZ')} Kč
                    </td>
                  ))}
                </tr>
                <tr className="bg-slate-800/80">
                  <td className="py-2.5 px-3 font-sans font-bold text-slate-300">Celkem včetně 21% DPH</td>
                  {(['IV', 'III', 'II', 'I'] as const).map((c) => (
                    <td key={c} className={`py-2.5 px-3 text-center font-bold ${measures.lpsClass === c ? 'bg-blue-600/30 text-white text-sm' : 'text-slate-300'}`}>
                      {costComparison.summaries[c].totalWithVat.toLocaleString('cs-CZ')} Kč
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans text-slate-400">Splnění rizika R1 (životy)</td>
                  {(['IV', 'III', 'II', 'I'] as const).map((c) => {
                    const isRec = results.recommendedLpsClass === c;
                    const isSafe = (c === 'I' || c === 'II' || (c === 'III' && results.recommendedLpsClass === 'III') || (c === 'IV' && results.recommendedLpsClass === 'IV'));
                    return (
                      <td key={c} className="py-2 px-3 text-center font-sans">
                        {isSafe ? (
                          <span className="text-emerald-400 font-semibold text-[11px]">
                            VYHOVUJE {isRec && '(DOPORUČENO)'}
                          </span>
                        ) : (
                          <span className="text-rose-400 font-medium text-[11px]">
                            NEDOSTATEČNÉ
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <div>
            * Ceny jsou orientační (materiál dle ceníků DEHN / OEZ + montáž elektro + zkušební protokol dle ČSN 33 1500).
          </div>
          <div className="font-medium text-slate-300">
            Zvolená třída LPS {measures.lpsClass}: materiál {selectedCost.totalMaterialCost.toLocaleString('cs-CZ')} Kč, montáž {selectedCost.totalLaborCost.toLocaleString('cs-CZ')} Kč, revize {selectedCost.totalRevisionCost.toLocaleString('cs-CZ')} Kč.
          </div>
        </div>
      </div>

      {/* Živý náhled kompletní technické zprávy Word (.docx) */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Kompletní náhled generovaného Word protokolu (.docx)
            </h3>
            <div className="text-xs text-slate-400 mt-0.5">
              Včetně vložených technických výkresů, normových kapitol a doložky ČKAIT.
            </div>
          </div>
          <button
            onClick={onExportDocx}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Stáhnout .docx</span>
          </button>
        </div>

        {/* Word Document Sheet Container */}
        <style>{`
          @media print {
            body { background: white !important; color: black !important; }
            .no-print { display: none !important; }
            #printable-protocol {
              box-shadow: none !important;
              border: none !important;
              max-width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
            }
          }
        `}</style>
        <div id="printable-protocol" className="p-8 sm:p-12 rounded-lg bg-white text-slate-900 shadow-2xl max-w-4xl mx-auto space-y-8 text-xs leading-relaxed font-sans border border-slate-300">
          
          {/* Titulní strana: Oficiální inženýrské logo nebo nahrané logo společnosti */}
          <div className="bg-slate-950 p-2 rounded-lg border border-slate-300 text-center">
            {meta.customLogoBase64 ? (
              <img
                src={meta.customLogoBase64}
                alt="Firemní logo"
                className="max-h-24 object-contain mx-auto py-2"
              />
            ) : (
              <canvas ref={canvasRefLogo} className="w-full max-h-40 object-contain mx-auto" />
            )}
          </div>

          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-end">
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
                Autorizovaná technická zpráva · ČSN EN 62305-1 až 4 ed. 2
              </div>
              <div className="text-xl font-bold text-slate-950 font-display mt-0.5">
                PROTOKOL O VÝPOČTU ŘÍZENÍ RIZIK LPS
              </div>
              <div className="text-xs text-blue-800 font-bold tracking-wide mt-1">
                A TECHNICKÝ NÁVRH ODDÁLENÉHO HROMOSVODU SYSTÉMU HVI
              </div>
              <div className="text-[11px] text-slate-600 italic mt-0.5">
                Vypracováno dle ČSN EN 62305-1..4 ed. 2 a vyhlášky č. 268/2009 Sb. § 36
              </div>
            </div>
            <div className="text-[11px] text-slate-600 font-mono text-right">
              <div>Datum: <strong>{meta.date}</strong></div>
              <div>Číslo: <strong>{meta.projectCode || 'LPS-2026-001'}</strong></div>
              <div>Norma: <strong>{meta.standardVersion}</strong></div>
            </div>
          </div>

          {/* Certifikační razítko na titulní straně */}
          <div className={`p-4 rounded border-2 ${results.isR1Safe ? 'bg-emerald-50 border-emerald-500' : 'bg-rose-50 border-rose-500'}`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-xs uppercase tracking-wider text-slate-900">Výsledek řízení rizik: </span>
                <span className={`font-bold text-sm ${results.isR1Safe ? 'text-emerald-800' : 'text-rose-800'}`}>
                  {results.isR1Safe ? 'STAVBA VYHOVUJE NORMĚ ČSN EN 62305 S NAVRŽENÝMI OPATŘENÍMI' : 'POZOR: STAVBA VYŽADUJE ZVÝŠENÍ TŘÍDY LPS'}
                </span>
              </div>
              <span className="px-2.5 py-1 bg-slate-900 text-white font-mono text-[10px] rounded font-bold">
                LPS {measures.lpsClass} / SPD {measures.spdLevel}
              </span>
            </div>
            <div className="text-[11px] text-slate-700 mt-1">
              Navržený systém spolehlivě eliminuje nebezpečí pro lidské životy (R1 ≤ RT1 s rezervou {Math.max(0, ((results.RT1 - results.R1)/results.RT1)*100).toFixed(1)} %) a chrání střešní zařízení oddáleným svodem s = {results.separationDistance_s_cm} cm.
            </div>
          </div>

          {/* 1. Obsah technické zprávy */}
          <div className="bg-slate-50 p-4 rounded border border-slate-200">
            <h4 className="font-bold text-slate-900 uppercase text-xs border-b border-slate-300 pb-1 mb-2">
              Obsah technické zprávy a technických listů
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-700 font-mono">
              <div>1. Identifikační údaje akce a stavby</div>
              <div>10. Technický list: Riziko R1 (životy)</div>
              <div>2. Účel protokolu a legislativní rámec</div>
              <div>11. Technický list: Riziko R2 (služby)</div>
              <div>3. Bouřková činnost a hustota Ng</div>
              <div>12. Technický list: Riziko R3 (památky)</div>
              <div>4. Geometrie stavby a sběrná plocha Ad</div>
              <div>13. Technický list: Riziko R4 (hospodářské)</div>
              <div>5. Analýza přívodních inženýrských sítí</div>
              <div>14. Technický list: Oddálený hromosvod HVI</div>
              <div>6. Koncepce zón bleskové ochrany (LPZ)</div>
              <div>15. Metoda valící se koule a ochranného úhlu</div>
              <div>7. Vnitřní zóny a požární zatížení</div>
              <div>16. Dimenzování uzemňovací soustavy l₁</div>
              <div>8. Souhrnné vyhodnocení rizik R1–R4</div>
              <div>17. Srovnávací kalkulace nákladů LPS I–IV</div>
              <div>9. Návrh komplexních opatření LPS a SPD</div>
              <div>18. Závěrečný výrok a autorizace ČKAIT</div>
            </div>
          </div>

          {/* 1. Identifikace */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase text-xs border-b border-slate-300 pb-1 mb-2.5">
              1. Identifikační údaje akce a stavby
            </h4>
            <div className="bg-slate-50 p-4 rounded border border-slate-200 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
              <div>Název akce: <strong>{meta.projectName}</strong></div>
              <div>Číslo zakázky: <strong>{meta.projectCode || '-'}</strong></div>
              <div>Místo stavby: <strong>{meta.buildingLocation}</strong></div>
              <div>Investor: <strong>{meta.investor}</strong></div>
              <div>Projektant: <strong>{meta.designer}</strong></div>
              <div>Autorizace: <strong>{meta.designerCert}</strong></div>
            </div>
          </div>

          {/* 2. Geometrie a výkres 1 */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase text-xs border-b border-slate-300 pb-1 mb-2.5">
              2. Geometrické parametry a sběrná plocha stavby (Ad)
            </h4>
            <p className="text-[11px] text-slate-700 mb-2">
              Půdorysné rozměry objektu: <strong>L = {building.length} m</strong>, <strong>W = {building.width} m</strong>, výška k hřebeni <strong>H = {building.height} m</strong>. Hustota blesků pro lokalitu {building.selectedRegion} činí <strong>Ng = {building.groundFlashDensity} úderů/km²/rok</strong>. Sběrná plocha stavby byla stanovena jako <strong>Ad = {results.Ad.toLocaleString('cs-CZ')} m²</strong>.
            </p>

            {/* Vložený výkres 1 */}
            <div className="p-2 bg-slate-950 rounded border border-slate-300 text-center my-3">
              <canvas ref={canvasRefAd} className="w-full max-h-56 object-contain mx-auto" />
              <div className="text-[10px] text-slate-400 mt-1">Schéma 1: Ekvivalentní sběrná plocha Ad a ochranné pásmo 3H</div>
            </div>
          </div>

          {/* 3. Schéma zón LPZ a výkres 3 */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase text-xs border-b border-slate-300 pb-1 mb-2.5">
              3. Koncepce zón bleskové ochrany (LPZ) a koordinace SPD
            </h4>
            <p className="text-[11px] text-slate-700 mb-2">
              Dle ČSN EN 62305-4 je objekt rozdělen na zóny LPZ 0A, LPZ 0B, LPZ 1 a LPZ 2. Na vstupu do hlavního rozváděče je navržena koordinovaná přepěťová ochrana <strong>SPD úroveň {measures.spdLevel}</strong>{measures.selectedSpdModel ? ` (katalogový typ: ${measures.selectedSpdModel})` : ''} (kombinované svodiče bleskových proudů Typ 1 na vlnu 10/350 µs a přepěťové svodiče Typ 2 na vlnu 8/20 µs).
            </p>

            {/* Vložený výkres 3 */}
            <div className="p-2 bg-slate-950 rounded border border-slate-300 text-center my-3">
              <canvas ref={canvasRefLpz} className="w-full max-h-56 object-contain mx-auto" />
              <div className="text-[10px] text-slate-400 mt-1">Schéma 3: Zóny bleskové ochrany LPZ a umístění svodičů SPD Typ 1, 2, 3</div>
            </div>
          </div>

          {/* TECHNICKÝ LIST: RIZIKO R1 */}
          <div className="border border-blue-200 bg-blue-50/40 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center border-b border-blue-200 pb-1">
              <span className="font-bold text-xs uppercase text-blue-950">TECHNICKÝ LIST: RIZIKO R1 (ZTRÁTA LIDSKÝCH ŽIVOTŮ)</span>
              <span className="font-mono text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">ČSN EN 62305-2 čl. 5.1</span>
            </div>
            <p className="text-[11px] text-slate-700">
              Vypočtené riziko <strong>R1 = {formatScientific(results.R1)}</strong> je menší než tolerovatelná mez <strong>RT1 = {formatScientific(results.RT1)}</strong>. Dosažená bezpečnostní rezerva činí <strong>{Math.max(0, ((results.RT1 - results.R1)/results.RT1)*100).toFixed(1)} %</strong>.
            </p>
            <div className="bg-white p-2.5 rounded border border-blue-200 font-mono text-[10px] grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>RA (dotyk): <span className="font-bold text-slate-900">{formatScientific(results.componentsWithMeasures.RA)}</span></div>
              <div>RB (požár): <span className="font-bold text-slate-900">{formatScientific(results.componentsWithMeasures.RB)}</span></div>
              <div>RC (LEMP): <span className="font-bold text-slate-900">{formatScientific(results.componentsWithMeasures.RC)}</span></div>
              <div>RU (dotyk síť): <span className="font-bold text-slate-900">{formatScientific(results.componentsWithMeasures.RU)}</span></div>
            </div>
          </div>

          {/* TECHNICKÝ LIST: RIZIKO R4 A COST-BENEFIT */}
          <div className="border border-slate-300 bg-slate-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center border-b border-slate-300 pb-1">
              <span className="font-bold text-xs uppercase text-slate-900">TECHNICKÝ LIST: RIZIKO R4 (HOSPODÁŘSKÉ ŠKODY A NÁKLADY)</span>
              <span className="font-mono text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-bold">ČSN EN 62305-2 čl. 5.4</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-white p-2.5 rounded border border-slate-200">
              <div>Riziko R4: <strong>{formatScientific(results.R4)}</strong></div>
              <div>Mez RT4: <strong>{formatScientific(results.RT4)}</strong></div>
              <div className="text-emerald-700 font-bold">Stav: VYHOVUJE</div>
              <div>Předpokládané škody/rok: <strong>{Math.round(results.R4 * ((zone.economicValueBuilding || 0) + (zone.economicValueEquipment || 0))).toLocaleString('cs-CZ')} Kč</strong></div>
              <div>Investice LPS: <strong>{selectedCost.totalWithVat.toLocaleString('cs-CZ')} Kč</strong></div>
              <div className="text-blue-900 font-bold">Třída: LPS {measures.lpsClass}</div>
            </div>
          </div>

          {/* TECHNICKÝ LIST: ODDÁLENÝ HROMOSVOD HVI A VÝKRES 2 */}
          {isolatedLps.enabled && (
            <div className="bg-blue-50/70 p-5 rounded-lg border border-blue-200 space-y-3">
              <div className="flex justify-between items-center border-b border-blue-200 pb-1">
                <span className="font-bold text-blue-950 uppercase text-xs">TECHNICKÝ LIST: ODDÁLENÝ HROMOSVOD A SYSTÉM DEHN HVI</span>
                <span className="font-mono text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded font-bold">ČSN EN 62305-3 čl. 6.3</span>
              </div>
              <p className="text-[11px] text-slate-800">
                Pro střešní technologické zařízení <strong>{isolatedLps.protectedEquipment}</strong> byl proveden exaktní výpočet separační vzdálenosti:
              </p>
              <div className="bg-white p-3 rounded border border-blue-200 font-mono text-[11px] space-y-1">
                <div>• Vzorec: s = ki · (kc / km) · l = {results.ki_factor} × ({results.kc_factor} / {results.km_factor}) × {isolatedLps.conductorLength} m</div>
                <div className="text-blue-950 font-bold">• Vypočtená vzdálenost: s = {results.separationDistance_s_cm} cm ({results.separationDistance_s_meters.toFixed(3)} m)</div>
                <div>• Zvolený vodič: {isolatedLps.hviType === 'hvi_light' ? 'DEHN HVI light' : isolatedLps.hviType === 'hvi_standard' ? 'DEHN HVI standard' : isolatedLps.hviType === 'hvi_power' ? 'DEHN HVI power' : 'DEHNiso vzpěry'} (s_equiv = {results.hvi_equivalent_distance_cm} cm)</div>
                <div className={`font-bold ${results.isIsolatedLpsSafe ? 'text-emerald-700' : 'text-rose-700'}`}>
                  • Posouzení: {results.isIsolatedLpsSafe ? `VYHOVUJE. Bezpečnostní rezerva Δs činí ${(results.hvi_equivalent_distance_cm - results.separationDistance_s_cm).toFixed(1)} cm.` : 'NEVYHOVUJE! Nebezpečí přeskoku bleskového proudu.'}
                </div>
              </div>

              {/* Vložený výkres 2 */}
              <div className="p-2 bg-slate-950 rounded border border-slate-300 text-center my-3">
                <canvas ref={canvasRefIsolated} className="w-full max-h-56 object-contain mx-auto" />
                <div className="text-[10px] text-slate-400 mt-1">Schéma 2: Dimenzování oddáleného hromosvodu HVI a kóty s</div>
              </div>
            </div>
          )}

          {/* 5b. Metoda valící se koule a ochranný úhel */}
          <div className="border border-slate-200 bg-slate-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center border-b border-slate-200 pb-1">
              <span className="font-bold text-xs uppercase text-slate-900">5b. METODA VALÍCÍ SE KOULE A OCHRANNÝ ÚHEL (ČSN EN 62305-3)</span>
              <span className="font-mono text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-bold">ČSN EN 62305-3 tab. 2</span>
            </div>
            <p className="text-[11px] text-slate-700">
              Pro navrženou třídu <strong>LPS {measures.lpsClass}</strong> je poloměr valící se koule <strong>r = {results.rollingSphereRadius} m</strong>.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono bg-white p-2.5 rounded border border-slate-200">
              <div>Poloměr koule r: <strong>{results.rollingSphereRadius} m</strong></div>
              <div>Průhyb koule p: <strong>{results.sagDistance_m.toFixed(2)} m</strong></div>
              <div>Výška pod koulí hc: <strong>{results.protectedHeight_m.toFixed(2)} m</strong></div>
              <div>Ochranný úhel α: <strong>{results.protectiveAngle_deg}°</strong></div>
            </div>
            <div className={`text-[11px] font-semibold ${results.isRollingSphereSafe ? 'text-emerald-700' : 'text-amber-700'}`}>
              • Posouzení: {results.isRollingSphereSafe ? 'Chráněný prostor pokrývá střešní zařízení bez rizika přímého úderu blesku do technologie.' : 'POZOR: Výška chráněné technologie přesahuje prostor pod koulí! Doporučeno zvýšit jímací tyč.'}
            </div>
          </div>

          {/* 5c. Posouzení rezistivity půdy a minimální délky zemniče */}
          <div className="border border-slate-200 bg-slate-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center border-b border-slate-200 pb-1">
              <span className="font-bold text-xs uppercase text-slate-900">5c. DIMENZOVÁNÍ UZEMŇOVACÍ SOUSTAVY A REZISTIVITA PŮDY</span>
              <span className="font-mono text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-bold">ČSN EN 62305-3 čl. 5.4</span>
            </div>
            <p className="text-[11px] text-slate-700">
              Měrný odpor půdy v lokalitě: <strong>ρ = {building.soilResistivity || 100} Ω·m</strong> ({building.soilType || 'hlinitopísčitá'}). Typ zemniče: <strong>{building.earthingSystemType || 'obvodový'}</strong>.
            </p>
            <div className="grid grid-cols-3 gap-2 text-[10px] font-mono bg-white p-2.5 rounded border border-slate-200">
              <div>Min. délka zemniče l₁: <strong>{results.minEarthingLength_l1_m.toFixed(1)} m</strong></div>
              <div>Skutečná délka: <strong>{results.actualEarthingLength_m.toFixed(1)} m</strong></div>
              <div>Odhad impedance R: <strong>{results.estimatedEarthResistance_ohm.toFixed(1)} Ω</strong> (limit ≤ 10 Ω)</div>
            </div>
            <div className={`text-[11px] font-semibold ${results.isEarthingSafe ? 'text-emerald-700' : 'text-amber-700'}`}>
              • Posouzení: {results.isEarthingSafe ? 'Uzemňovací soustava vyhovuje požadavkům ČSN EN 62305-3 na minimální délku a impedanci pod 10 Ω.' : 'Doporučeno doplnit svislé tyčové zemniče pro snížení přechodového odporu pod 10 Ω.'}
            </div>
          </div>

          {/* 6. Orientační položkový rozpočet LPS */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase text-xs border-b border-slate-300 pb-1 mb-2.5">
              6. Orientační kalkulace nákladů a položkový rozpočet pro třídu LPS {measures.lpsClass}
            </h4>
            <table className="w-full border-collapse border border-slate-300 text-left text-[11px] mb-2">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-slate-300 p-1.5">Kategorie</th>
                  <th className="border border-slate-300 p-1.5">Popis rozsahu dodávky</th>
                  <th className="border border-slate-300 p-1.5 text-right">Materiál</th>
                  <th className="border border-slate-300 p-1.5 text-right">Montáž</th>
                  <th className="border border-slate-300 p-1.5 text-right">Celkem bez DPH</th>
                </tr>
              </thead>
              <tbody>
                {selectedCost.items.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50' : ''}>
                    <td className="border border-slate-300 p-1.5 font-medium">{item.category}</td>
                    <td className="border border-slate-300 p-1.5 text-slate-600">{item.description}</td>
                    <td className="border border-slate-300 p-1.5 text-right font-mono">{item.materialCost.toLocaleString('cs-CZ')} Kč</td>
                    <td className="border border-slate-300 p-1.5 text-right font-mono">{item.laborCost.toLocaleString('cs-CZ')} Kč</td>
                    <td className="border border-slate-300 p-1.5 text-right font-mono font-bold text-slate-900">{item.totalCost.toLocaleString('cs-CZ')} Kč</td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                  <td colSpan={4} className="border border-slate-300 p-1.5 text-right">CELKEM BEZ DPH (LPS {measures.lpsClass}):</td>
                  <td className="border border-slate-300 p-1.5 text-right font-mono text-blue-900">{selectedCost.totalWithoutVat.toLocaleString('cs-CZ')} Kč</td>
                </tr>
                <tr className="bg-slate-200 font-bold">
                  <td colSpan={4} className="border border-slate-300 p-1.5 text-right">CELKEM VČETNĚ 21% DPH:</td>
                  <td className="border border-slate-300 p-1.5 text-right font-mono text-slate-950">{selectedCost.totalWithVat.toLocaleString('cs-CZ')} Kč</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 7. Závěrečný výrok a doložka */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase text-xs border-b border-slate-300 pb-1 mb-2">
              7. Závěrečný výrok autorizovaného inženýra
            </h4>
            <p className="text-[11px] text-slate-800 leading-relaxed">
              Na základě provedeného výpočtu rizik dle <strong>ČSN EN 62305-2 ed. 2</strong> a technického posouzení dle <strong>ČSN EN 62305-3 ed. 2</strong> se navrhuje vnější systém ochrany před bleskem <strong>třídy LPS {measures.lpsClass}</strong> doplněný o koordinovanou přepěťovou ochranu <strong>SPD {measures.spdLevel}</strong> {isolatedLps.enabled ? `a oddálené svody systému DEHN HVI pro ${isolatedLps.protectedEquipment}` : ''}. S navrženými opatřeními jsou všechna normová rizika splněna. Lhůta pravidelných revizí dle tabulky E.2: vizuální kontrola každých {measures.lpsClass === 'I' || measures.lpsClass === 'II' ? '12 měsíců' : '24 měsíců'}, kompletní revize se změřením odporu každé {measures.lpsClass === 'I' || measures.lpsClass === 'II' ? '2 roky' : '4 roky'}.
            </p>
          </div>

          {/* Podpis a razítko */}
          <div className="pt-6 flex justify-between items-end text-slate-700 border-t border-slate-300 text-[11px]">
            <div>
              <div>V {meta.buildingLocation ? meta.buildingLocation.split(',')[0] : 'Praze'}, dne {meta.date}</div>
              <div className="font-bold mt-2">Zpracovatel: {meta.designer}</div>
              <div className="text-slate-500">{meta.designerCert}</div>
            </div>

            <div className="text-right">
              {meta.customStampBase64 ? (
                <div className="inline-block text-center">
                  <img
                    src={meta.customStampBase64}
                    alt="Otisk autorizačního razítka ČKAIT"
                    className="w-24 h-24 object-contain mx-auto mb-1 rounded-full border border-slate-300 shadow-sm"
                  />
                  <div className="text-[10px] text-slate-500 font-mono">Otisk autorizačního razítka ČKAIT</div>
                </div>
              ) : (
                <>
                  <div>Otisk autorizačního razítka a podpis:</div>
                  <div className="mt-8 text-slate-400 font-mono">...........................................................</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
