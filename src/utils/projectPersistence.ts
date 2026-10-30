/**
 * Správa perzistence a ukládání projektů
 * Ukládání do souboru .lpsproj (JSON), načítání ze souboru a auto-save do LocalStorage
 */

import { LpsProjectState } from '../types/lps';

const LOCAL_STORAGE_KEY = 'lps_project_autosave_v2';

export function saveProjectToFile(project: LpsProjectState): void {
  const data = JSON.stringify(project, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const filename = `${(project.meta.projectName || 'LPS_projekt').replace(/\s+/g, '_')}_${project.meta.projectCode || '2026'}.lpsproj`;
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function loadProjectFromFile(file: File): Promise<LpsProjectState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content) as LpsProjectState;
        if (!parsed.meta || !parsed.building || !parsed.measures) {
          throw new Error('Neplatná struktura souboru LPS projektu.');
        }
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Chyba při čtení souboru.'));
    reader.readAsText(file);
  });
}

export function autoSaveProjectToStorage(project: LpsProjectState): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(project));
  } catch {
    // ignorujeme quota exceeded chyby
  }
}

export function loadAutoSavedProject(): LpsProjectState | null {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as LpsProjectState;
  } catch {
    return null;
  }
}
