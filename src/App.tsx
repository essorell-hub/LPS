/**
 * LPS Risk & Isolated System Manager (ČSN EN 62305-2 / ČSN EN 62305-3)
 * Hlavní aplikační komponenta
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { WizardNav, WIZARD_STEPS } from './components/WizardNav';
import { LiveRiskBadge } from './components/LiveRiskBadge';
import { Step1General } from './components/Step1General';
import { Step2Geometry } from './components/Step2Geometry';
import { Step3LinesZones } from './components/Step3LinesZones';
import { Step4LpsMeasures } from './components/Step4LpsMeasures';
import { Step5IsolatedLps } from './components/Step5IsolatedLps';
import { Step6SummaryDocx } from './components/Step6SummaryDocx';
import { CostSettingsModal } from './components/CostSettingsModal';
import { StandardsSearchModal } from './components/StandardsSearchModal';

import { LpsProjectState, LpsClass, CustomCostRates } from './types/lps';
import { PROJECT_TEMPLATES } from './data/templates';
import { calculateLpsProject } from './utils/lpsCalculations';
import { generateWordDocument, downloadDocxBlob } from './utils/docxExport';
import {
  saveProjectToFile,
  loadProjectFromFile,
  autoSaveProjectToStorage,
  loadAutoSavedProject
} from './utils/projectPersistence';
import { exportBomToCsv } from './utils/bomExport';
import { ArrowLeft, ArrowRight, Download, Check } from 'lucide-react';

export default function App() {
  // Výchozí projekt: Načtení z localStorage, nebo šablona Rodinný dům se střešní fotovoltaikou
  const [project, setProject] = useState<LpsProjectState>(() => {
    const saved = loadAutoSavedProject();
    if (saved) return saved;
    return PROJECT_TEMPLATES[0].data;
  });

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isCostModalOpen, setIsCostModalOpen] = useState<boolean>(false);
  const [isStandardsModalOpen, setIsStandardsModalOpen] = useState<boolean>(false);

  // Automatické průběžné ukládání změn projektu do paměti prohlížeče
  useEffect(() => {
    autoSaveProjectToStorage(project);
  }, [project]);

  // Přepočet všech rizik a dostatečné vzdálenosti v reálném čase
  const results = useMemo(() => {
    return calculateLpsProject(project);
  }, [project]);

  // Pomocné funkce pro aktualizaci stavu
  const updateMeta = (patch: Partial<typeof project.meta>) => {
    setProject((prev) => ({ ...prev, meta: { ...prev.meta, ...patch } }));
  };

  const updateBuilding = (patch: Partial<typeof project.building>) => {
    setProject((prev) => ({ ...prev, building: { ...prev.building, ...patch } }));
  };

  const updateLines = (patch: Partial<typeof project.lines>) => {
    setProject((prev) => ({ ...prev, lines: { ...prev.lines, ...patch } }));
  };

  const updateZone = (patch: Partial<typeof project.zone>) => {
    setProject((prev) => ({ ...prev, zone: { ...prev.zone, ...patch } }));
  };

  const updateMeasures = (patch: Partial<typeof project.measures>) => {
    setProject((prev) => ({ ...prev, measures: { ...prev.measures, ...patch } }));
  };

  const updateIsolatedLps = (patch: Partial<typeof project.isolatedLps>) => {
    setProject((prev) => ({ ...prev, isolatedLps: { ...prev.isolatedLps, ...patch } }));
  };

  const handleSaveCostRates = (rates: CustomCostRates) => {
    setProject((prev) => ({ ...prev, customCostRates: rates }));
    setNotification('Jednotkové ceny rozpočtu byly úspěšně uloženy.');
    setTimeout(() => setNotification(null), 4000);
  };

  // Načtení šablony
  const handleSelectTemplate = (templateId: string) => {
    const tpl = PROJECT_TEMPLATES.find((t) => t.id === templateId);
    if (tpl) {
      setProject(JSON.parse(JSON.stringify(tpl.data)));
      setNotification(`Šablona „${tpl.title}“ byla úspěšně načtena.`);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Uložení projektu do souboru .lpsproj
  const handleSaveProjectFile = () => {
    saveProjectToFile(project);
    setNotification('Projekt byl úspěšně exportován do souboru .lpsproj');
    setTimeout(() => setNotification(null), 4000);
  };

  // Načtení projektu ze souboru .lpsproj
  const handleLoadProjectFile = async (file: File) => {
    try {
      const loaded = await loadProjectFromFile(file);
      setProject(loaded);
      setNotification(`Projekt „${file.name}“ byl úspěšně nahrán.`);
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      console.error(err);
      setNotification('Chyba: Neplatný formát souboru projektu (.lpsproj / .json)');
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Export kusovníku materiálu BOM (CSV / Excel)
  const handleExportBom = () => {
    exportBomToCsv(project, results);
    setNotification('Kusovník materiálu (BOM) byl vygenerován do CSV.');
    setTimeout(() => setNotification(null), 4000);
  };

  // Přímý tisk / PDF protokol prohlížeče
  const handlePrintPdf = () => {
    window.print();
  };

  // Export do Wordu (.docx)
  const handleExportDocx = async () => {
    try {
      setIsExporting(true);
      const blob = await generateWordDocument(project, results);
      const safeProjectName = (project.meta.projectName || 'Protokol_LPS')
        .replace(/[^a-zA-Z0-9_\u00C0-\u017F-]/g, '_');
      const filename = `Protokol_LPS_Rizika_${safeProjectName}.docx`;
      downloadDocxBlob(blob, filename);
      setNotification(`Dokument Word byl úspěšně vygenerován: ${filename}`);
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      console.error('Chyba při exportu do Wordu:', err);
      setNotification('Chyba při generování Word dokumentu. Zkontrolujte konzoli.');
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast notifikace */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg bg-blue-600 text-white shadow-xl shadow-blue-900/40 border border-blue-400 text-xs font-medium animate-in fade-in slide-in-from-bottom-2 no-print">
          <Check className="w-4 h-4 text-white" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className="no-print">
        <Header
          project={project}
          results={results}
          onSelectTemplate={handleSelectTemplate}
          onExportDocx={handleExportDocx}
          onSaveProjectFile={handleSaveProjectFile}
          onLoadProjectFile={handleLoadProjectFile}
          isExporting={isExporting}
          onOpenStandardsSearch={() => setIsStandardsModalOpen(true)}
        />
      </div>

      {/* Wizard Steps Navigation Bar */}
      <div className="no-print">
        <WizardNav
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          isR1Safe={results.isR1Safe}
          isIsolatedSafe={results.isIsolatedLpsSafe}
          isIsolatedEnabled={project.isolatedLps.enabled}
        />
      </div>

      {/* Live Risk Telemetry Badge & LPS Quick Switcher */}
      <div className="no-print">
        <LiveRiskBadge
          results={results}
          currentLpsClass={project.measures.lpsClass}
          onLpsClassChange={(cls: LpsClass) => updateMeasures({ lpsClass: cls })}
          isIsolatedEnabled={project.isolatedLps.enabled}
        />
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === 1 && (
          <Step1General
            meta={project.meta}
            building={project.building}
            onUpdateMeta={updateMeta}
            onUpdateBuilding={updateBuilding}
          />
        )}

        {currentStep === 2 && (
          <Step2Geometry
            building={project.building}
            results={results}
            currentLpsClass={project.measures.lpsClass}
            onUpdateBuilding={updateBuilding}
          />
        )}

        {currentStep === 3 && (
          <Step3LinesZones
            lines={project.lines}
            zone={project.zone}
            onUpdateLines={updateLines}
            onUpdateZone={updateZone}
          />
        )}

        {currentStep === 4 && (
          <Step4LpsMeasures
            measures={project.measures}
            results={results}
            onUpdateMeasures={updateMeasures}
          />
        )}

        {currentStep === 5 && (
          <Step5IsolatedLps
            isolatedLps={project.isolatedLps}
            results={results}
            currentLpsClass={project.measures.lpsClass}
            buildingLength={project.building.length}
            buildingWidth={project.building.width}
            onUpdateIsolatedLps={updateIsolatedLps}
          />
        )}

        {currentStep === 6 && (
          <Step6SummaryDocx
            project={project}
            results={results}
            onExportDocx={handleExportDocx}
            isExporting={isExporting}
            onExportBom={handleExportBom}
            onPrintPdf={handlePrintPdf}
            onOpenCostSettings={() => setIsCostModalOpen(true)}
            onOpenStandardsSearch={() => setIsStandardsModalOpen(true)}
          />
        )}

        {/* Step Navigation Footer Controls */}
        <div className="max-w-5xl mx-auto mt-10 pt-6 border-t border-slate-800 flex items-center justify-between no-print">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Předchozí krok</span>
          </button>

          <div className="text-xs text-slate-400 font-mono">
            Krok {currentStep} z {WIZARD_STEPS.length}
          </div>

          {currentStep < 6 ? (
            <button
              onClick={() => setCurrentStep((prev) => Math.min(6, prev + 1))}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-500 transition-colors cursor-pointer shadow-sm shadow-blue-500/20"
            >
              <span>Další krok</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleExportDocx}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors cursor-pointer shadow-sm shadow-emerald-500/20 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Stáhnout hotový Word (.docx)</span>
            </button>
          )}
        </div>
      </main>

      {/* Ceníkový konfigurační dialog */}
      <CostSettingsModal
        isOpen={isCostModalOpen}
        onClose={() => setIsCostModalOpen(false)}
        rates={project.customCostRates || {}}
        onSave={handleSaveCostRates}
      />

      {/* Dialog vyhledávání a ověřování norem ČSN EN 62305 přes Google Search */}
      <StandardsSearchModal
        isOpen={isStandardsModalOpen}
        onClose={() => setIsStandardsModalOpen(false)}
        project={project}
        results={results}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 px-6 py-4 text-center text-xs text-slate-500 no-print">
        <div>
          LPS Risk &amp; Isolated System Manager · Výpočet rizik dle ČSN EN 62305-2 ed. 2 · Dimenzování izolovaného hromosvodu ČSN EN 62305-3 ed. 2
        </div>
      </footer>
    </div>
  );
}
