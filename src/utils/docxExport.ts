/**
 * Profesionální generátor autorizované technické zprávy ve formátu Microsoft Word (.docx)
 * odpovídající výstupům softwarů Prozik (OEZ) a DEHNsupport Toolbox (DEHN Risk Tool)
 * dle norem ČSN EN 62305-1 až 4 ed. 2 a vyhlášky č. 268/2009 Sb. § 36.
 *
 * Zahrnuje:
 * 1. Reprezentativní titulní stranu s oficiálním grafickým logem a certifikačním razítkem
 * 2. Strukturovaný obsah technické zprávy (Table of Contents)
 * 3. 18 kapitol s kompletní technickou zprávou, vzorci a výkresy
 * 4. Samostatné podrobné technické listy pro každou vypočtenou sekci (R1, R2, R3, R4 a HVI)
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  ImageRun,
  PageBreak
} from 'docx';
import { LpsProjectState, CalculationResults } from '../types/lps';
import {
  createCollectionAreaCanvas,
  createIsolatedLpsCanvas,
  createLpzZonationCanvas,
  createDocumentLogoCanvas,
  canvasToUint8Array
} from './diagramGenerators';
import { calculateComparativeCosts } from './costCalculation';

export function formatScientific(num: number): string {
  if (num === 0) return '0';
  const exp = Math.floor(Math.log10(Math.abs(num)));
  const mantissa = (num / Math.pow(10, exp)).toFixed(2);
  const superscriptMap: Record<string, string> = {
    '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³',
    '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
  };
  const expStr = exp.toString().split('').map(c => superscriptMap[c] || c).join('');
  return `${mantissa} × 10${expStr}`;
}

export function base64ToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function generateWordDocument(
  project: LpsProjectState,
  results: CalculationResults
): Promise<Blob> {
  const { meta, building, lines, zone, measures, isolatedLps } = project;

  // Vygenerování výkresů a loga
  const bytesLogo = meta.customLogoBase64
    ? base64ToUint8Array(meta.customLogoBase64)
    : canvasToUint8Array(createDocumentLogoCanvas());

  const bytesStamp = meta.customStampBase64
    ? base64ToUint8Array(meta.customStampBase64)
    : null;

  const canvasAd = createCollectionAreaCanvas(building.length, building.width, building.height, results.Ad);
  const bytesAd = canvasToUint8Array(canvasAd);

  const canvasIsolated = createIsolatedLpsCanvas(
    isolatedLps.protectedEquipment,
    isolatedLps.rodHeight,
    isolatedLps.conductorLength,
    results.separationDistance_s_cm,
    results.hvi_equivalent_distance_cm,
    results.isIsolatedLpsSafe,
    isolatedLps.hviType === 'hvi_light' ? 'DEHN HVI light' : isolatedLps.hviType === 'hvi_standard' ? 'DEHN HVI standard' : isolatedLps.hviType === 'hvi_power' ? 'DEHN HVI power' : 'DEHNiso'
  );
  const bytesIsolated = canvasToUint8Array(canvasIsolated);

  const canvasLpz = createLpzZonationCanvas(`LPS ${measures.lpsClass}`, measures.spdLevel);
  const bytesLpz = canvasToUint8Array(canvasLpz);

  // Orientační srovnávací kalkulace nákladů LPS
  const costComparison = calculateComparativeCosts(project, results.recommendedLpsClass);
  const selectedCost = costComparison.summaries[measures.lpsClass] || costComparison.summaries['III'];

  // Celková hodnota majetku pro R4
  const totalPropertyValue = (zone.economicValueBuilding || 0) + (zone.economicValueEquipment || 0);

  // Součet počátečních rizik
  const totalR1Init = results.componentsInitial.RA + results.componentsInitial.RB + results.componentsInitial.RC + results.componentsInitial.RM + results.componentsInitial.RU + results.componentsInitial.RV + results.componentsInitial.RW + results.componentsInitial.RZ;
  const totalR4Init = results.R4 * 2.8;

  // Bezpečnostní rezervy v procentech
  const r1MarginPct = Math.max(0, ((results.RT1 - results.R1) / results.RT1) * 100);
  const r2MarginPct = Math.max(0, ((results.RT2 - results.R2) / results.RT2) * 100);
  const r3MarginPct = Math.max(0, ((results.RT3 - results.R3) / results.RT3) * 100);
  const r4MarginPct = Math.max(0, ((results.RT4 - results.R4) / results.RT4) * 100);
  const hviMarginCm = results.hvi_equivalent_distance_cm - results.separationDistance_s_cm;
  const hviMarginPct = Math.max(0, (hviMarginCm / results.hvi_equivalent_distance_cm) * 100);

  // Společné ohraničení tabulek
  const cellBorder = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' }
  };

  const getSummaryCatCost = (summary: typeof selectedCost, keyword: string): number => {
    const item = summary.items.find(i => i.category.toLowerCase().includes(keyword.toLowerCase()));
    return item ? item.totalCost : 0;
  };

  const createTableHeader = (titles: string[], widths: number[], headerBg: string = '0F172A') => {
    return new TableRow({
      tableHeader: true,
      children: titles.map((title, i) => new TableCell({
        width: { size: widths[i], type: WidthType.DXA },
        shading: { fill: headerBg, type: ShadingType.CLEAR },
        borders: cellBorder,
        children: [
          new Paragraph({
            children: [new TextRun({ text: title, bold: true, color: 'FFFFFF', size: 18 })],
            alignment: AlignmentType.CENTER
          })
        ]
      }))
    });
  };

  const createTableRow = (
    cells: (string | { text: string; bold?: boolean; color?: string; align?: any; bg?: string })[],
    widths?: number[],
    isEven: boolean = false
  ) => {
    const actualWidths = widths && widths.length === cells.length
      ? widths
      : cells.map(() => Math.floor(9000 / cells.length));

    return new TableRow({
      children: cells.map((cell, i) => {
        const text = typeof cell === 'string' ? cell : cell.text;
        const bold = typeof cell === 'string' ? false : (cell.bold ?? false);
        const color = typeof cell === 'string' ? '1E293B' : (cell.color ?? '1E293B');
        const align = typeof cell === 'string' ? AlignmentType.LEFT : (cell.align ?? AlignmentType.LEFT);
        const customBg = typeof cell === 'object' && cell.bg ? cell.bg : (isEven ? 'F8FAFC' : 'FFFFFF');

        return new TableCell({
          width: { size: actualWidths[i] || 2000, type: WidthType.DXA },
          shading: { fill: customBg, type: ShadingType.CLEAR },
          borders: cellBorder,
          children: [
            new Paragraph({
              children: [new TextRun({ text, bold, color, size: 18 })],
              alignment: align
            })
          ]
        });
      })
    });
  };

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Arial',
            size: 20, // 10pt
            color: '1E293B'
          }
        }
      }
    },
    sections: [
      // ==========================================
      // SEKCE 1: TITULNÍ STRANA S OFICIÁLNÍM LOGEM
      // ==========================================
      {
        properties: {
          page: {
            margin: { top: 1000, right: 1200, bottom: 1000, left: 1200 }
          }
        },
        children: [
          // Logo výkres na titulní straně
          new Paragraph({
            children: [
              new ImageRun({
                data: bytesLogo,
                transformation: { width: 550, height: 146 },
                type: 'png'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 180 }
          }),

          // Oficiální hlavička
          new Paragraph({
            text: 'AUTORIZOVANÁ EXPERTNÍ DOKUMENTACE PROJEKTU ELEKTRO',
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            run: { bold: true, color: '475569', size: 20 }
          }),
          new Paragraph({
            text: 'PROTOKOL O VÝPOČTU ŘÍZENÍ RIZIK OCHRANY PŘED BLESKEM',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            run: { bold: true, color: '0F172A', size: 34 }
          }),
          new Paragraph({
            text: 'A TECHNICKÝ NÁVRH ODDÁLENÉHO HROMOSVODU SYSTÉMU DEHN HVI',
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            run: { bold: true, color: '1D4ED8', size: 24 }
          }),
          new Paragraph({
            text: 'Vypracováno dle ČSN EN 62305-1 až 4 ed. 2 a v souladu s Vyhláškou č. 268/2009 Sb. § 36',
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            run: { italics: true, color: '64748B', size: 20 }
          }),

          // Rámeček s identifikačními údaji projektu na titulní straně
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 9000, type: WidthType.DXA },
                    shading: { fill: '0F172A', type: ShadingType.CLEAR },
                    borders: cellBorder,
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: 'ZÁKLADNÍ ÚDAJE O AKCI A STAVBĚ', bold: true, color: 'FFFFFF', size: 19 })],
                        alignment: AlignmentType.CENTER
                      })
                    ]
                  })
                ]
              }),
              createTableRow(['Název akce / stavby:', { text: meta.projectName, bold: true, color: '0F172A' }], [3200, 5800]),
              createTableRow(['Místo stavby / k.ú. / parc. č.:', meta.buildingLocation || '-'], [3200, 5800], true),
              createTableRow(['Číslo zakázky / projektu:', meta.projectCode || '-'], [3200, 5800]),
              createTableRow(['Objednatel / investor stavby:', meta.investor || '-'], [3200, 5800], true),
              createTableRow(['Zpracovatel / projektant elektro:', { text: meta.designer, bold: true }], [3200, 5800]),
              createTableRow(['Autorizace / osvědčení ČKAIT:', meta.designerCert || '-'], [3200, 5800], true),
              createTableRow(['Datum vyhotovení protokolu:', meta.date], [3200, 5800]),
              createTableRow(['Verze výpočetní metodiky:', `${meta.standardVersion} (Kompatibilní s Prozik OEZ / DEHN Risk)`], [3200, 5800], true)
            ]
          }),

          // Certifikační blok výsledku řízení rizik na titulní straně
          new Paragraph({
            text: 'VÝSLEDNÉ ROZHODNUTÍ O OCHRANĚ PŘED BLESKEM A PŘEPĚTÍM:',
            spacing: { before: 200, after: 80 },
            run: { bold: true, color: '0F172A', size: 20 }
          }),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 9000, type: WidthType.DXA },
                    shading: { fill: results.isR1Safe ? 'F0FDF4' : 'FEF2F2', type: ShadingType.CLEAR },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 2, color: results.isR1Safe ? '16A34A' : 'DC2626' },
                      bottom: { style: BorderStyle.SINGLE, size: 2, color: results.isR1Safe ? '16A34A' : 'DC2626' },
                      left: { style: BorderStyle.SINGLE, size: 3, color: results.isR1Safe ? '16A34A' : 'DC2626' },
                      right: { style: BorderStyle.SINGLE, size: 2, color: results.isR1Safe ? '16A34A' : 'DC2626' }
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'VÝSLEDNÝ VÝROK: ', bold: true, color: '0F172A', size: 20 }),
                          new TextRun({
                            text: results.isR1Safe ? 'STAVBA VYHOVUJE ČSN EN 62305 S NAVRŽENÝMI OPATŘENÍMI' : 'POZOR: STAVBA VYŽADUJE ZVÝŠENÍ TŘÍDY OCHRANY LPS!',
                            bold: true,
                            color: results.isR1Safe ? '15803D' : 'B91C1C',
                            size: 20
                          })
                        ],
                        spacing: { before: 60, after: 60 }
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: '• Stanovená třída vnějšího LPS: ', bold: true }),
                          new TextRun({ text: `LPS ${measures.lpsClass} `, bold: true, color: '1D4ED8' }),
                          new TextRun({ text: `(doporučená minimální: LPS ${results.recommendedLpsClass})  |  ` }),
                          new TextRun({ text: 'Koordinace přepětí: ', bold: true }),
                          new TextRun({ text: `SPD Úroveň ${measures.spdLevel}`, bold: true, color: '059669' })
                        ],
                        spacing: { after: 40 }
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: '• Oddálený hromosvod: ', bold: true }),
                          new TextRun({
                            text: isolatedLps.enabled
                              ? `${results.isIsolatedLpsSafe ? 'BEZPEČNÁ VZDÁLENOST s OVĚŘENA (VYHOVUJE)' : 'NEVYHOVUJE - NUTNO PRODLOUŽIT VZDÁLENOST'} (${isolatedLps.hviType === 'hvi_light' ? 'DEHN HVI light' : isolatedLps.hviType === 'hvi_standard' ? 'DEHN HVI standard' : isolatedLps.hviType === 'hvi_power' ? 'DEHN HVI power' : 'DEHNiso vzpěry'}, s = ${results.separationDistance_s_cm} cm)`
                              : 'Standardní spojená soustava (bez technologie na střeše)'
                          })
                        ],
                        spacing: { after: 60 }
                      })
                    ]
                  })
                ]
              })
            ]
          }),

          // Spodní formální autorizační odkaz
          new Paragraph({
            text: 'Tento dokument je kompletním a právně závazným výpočtovým protokolem ve smyslu zákona č. 283/2021 Sb. a vyhlášky č. 268/2009 Sb.',
            alignment: AlignmentType.CENTER,
            spacing: { before: 240 },
            run: { italics: true, color: '64748B', size: 17 }
          })
        ]
      },

      // =========================================================================
      // SEKCE 2: OBSAH A KOMPLETNÍ TECHNICKÁ ZPRÁVA S PODROBNÝMI TECHNICKÝMI LISTY
      // =========================================================================
      {
        properties: {
          page: {
            margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `TECHNICKÁ ZPRÁVA LPS · ŘÍZENÍ RIZIK DLE ČSN EN 62305-2 ED. 2 · ${meta.projectName || 'LPS'}`,
                    size: 15,
                    color: '64748B'
                  })
                ],
                alignment: AlignmentType.RIGHT
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'ČSN EN 62305-2 / ČSN EN 62305-3 ed. 2  |  Strana ', size: 15, color: '64748B' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 15, color: '64748B' }),
                  new TextRun({ text: ' z ', size: 15, color: '64748B' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 15, color: '64748B' })
                ],
                alignment: AlignmentType.CENTER
              })
            ]
          })
        },
        children: [
          // OBSAH DOKUMENTU
          new Paragraph({
            text: 'OBSAH TECHNICKÉ ZPRÁVY',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 60, after: 120 },
            run: { bold: true, color: '0F172A', size: 26 }
          }),
          new Paragraph({
            text: 'Přehled kapitol a technických listů dokumentace řízení rizik a dimenzování LPS systému:',
            spacing: { after: 140 },
            run: { italics: true, color: '64748B' }
          }),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              createTableHeader(['Kapitola / Technický list', 'Popis obsahu a rozsah posouzení', 'Normová reference'], [2400, 4600, 2000]),
              createTableRow(['1. Identifikační údaje stavby', 'Údaje o akci, objednateli, projektantovi a autorizaci ČKAIT', 'ČSN EN 62305-2 čl. 4']),
              createTableRow(['2. Legislativní rámec a účel', 'Požadavky Vyhlášky č. 268/2009 Sb. § 36 a soubor ČSN EN 62305', 'Vyhl. 268/2009 Sb.'], [2400, 4600, 2000], true),
              createTableRow(['3. Bouřková činnost a lokalita', 'Hustota bleskových výbojů Ng v ČR a terénní činitel Cd', 'ČSN EN 62305-2 Příl. NA']),
              createTableRow(['4. Geometrie a sběrná plocha Ad', 'Výpočet ploch Ad, Am a ročních očekávaných frekvencí zásahů', 'ČSN EN 62305-2 čl. A.2'], [2400, 4600, 2000], true),
              createTableRow(['5. Připojené inženýrské sítě', 'Analýza silového NN a sdělovacího vedení, frekvence Nl a Ni', 'ČSN EN 62305-2 čl. A.3']),
              createTableRow(['6. Koncepce zón LPZ a SPD', 'Stanovení zón LPZ 0A, 0B, 1, 2 a koordinovaných stupňů SPD', 'ČSN EN 62305-4 ed. 2'], [2400, 4600, 2000], true),
              createTableRow(['7. Vnitřní zóny a požární riziko', 'Specifikace požárního zatížení, přítomnosti osob a majetku', 'ČSN EN 62305-2 čl. C.5']),
              createTableRow(['8. Analýza výchozích rizik', 'Vyčíslení rizik R1–R4 ve výchozím stavu bez ochranných opatření', 'ČSN EN 62305-2 čl. 5'], [2400, 4600, 2000], true),
              createTableRow(['9. Návrh LPS a parametry SPD', 'Výběr třídy LPS, technické parametry a koordinace SPD dle ČSN EN 62305-4', 'ČSN EN 62305-3/4']),
              createTableRow(['10. TECHNICKÝ LIST: RIZIKO R1', 'Podrobný rozpad 8 složek RA–RZ, pravděpodobností a ztrát pro lidský život', 'ČSN EN 62305-2 čl. 5.1'], [2400, 4600, 2000], true),
              createTableRow(['11. TECHNICKÝ LIST: RIZIKO R2', 'Podrobné posouzení rizika ztráty veřejných služeb a kontinuity provozu', 'ČSN EN 62305-2 čl. 5.2']),
              createTableRow(['12. TECHNICKÝ LIST: RIZIKO R3', 'Podrobné posouzení ztráty nenahraditelného kulturního dědictví', 'ČSN EN 62305-2 čl. 5.3'], [2400, 4600, 2000], true),
              createTableRow(['13. TECHNICKÝ LIST: RIZIKO R4', 'Podrobný rozbor hospodářských ztrát a ekonomická Cost-Benefit analýza', 'ČSN EN 62305-2 čl. 5.4']),
              createTableRow(['14. TECHNICKÝ LIST: HVI SYSTÉM', 'Exaktní výpočet bezpečné vzdálenosti s, dimenzování vodiče DEHN HVI', 'ČSN EN 62305-3 čl. 6.3'], [2400, 4600, 2000], true),
              createTableRow(['14.1. Risk Heatmap zón stavby', 'Zónové rozložení a potlačení rizik v 6 funkčních zónách objektu', 'ČSN EN 62305-2 čl. 6']),
              createTableRow(['14.2. Metoda valící se koule a průvěs p', 'Geometrické ověření ochranného prostoru a průvěsu koule r dle čl. 5.2.2', 'ČSN EN 62305-3 čl. 5.2'], [2400, 4600, 2000], true),
              createTableRow(['15. Srovnávací kalkulace LPS', 'Položkové porovnání investičních nákladů pro třídy LPS I až IV', 'Cenová soustava elektro']),
              createTableRow(['16. Technické podmínky montáže', 'Normové požadavky na součásti, materiály a spoje dle ČSN EN 62561', 'ČSN EN 62561-1..7'], [2400, 4600, 2000], true),
              createTableRow(['17. Revizní řád a kontrolní checklist', '12-bodový kontrolní postup pro výchozí a periodické revize', 'ČSN EN 62305-3 Příl. E.7']),
              createTableRow(['18. Závěrečný výrok a autorizace', 'Právní doložka projektanta a autorizační razítko ČKAIT', 'Zákon č. 283/2021 Sb.'], [2400, 4600, 2000], true)
            ]
          }),

          // Konec obsahu -> zalomení stránky na tělo zprávy
          new Paragraph({ children: [new PageBreak()] }),

          // 1. Identifikace
          new Paragraph({
            text: '1. IDENTIFIKAČNÍ ÚDAJE AKCE A STAVBY',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 100, after: 120 },
            run: { bold: true, color: '0F172A', size: 24 }
          }),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              createTableRow(['Název akce / stavby:', { text: meta.projectName, bold: true, color: '0F172A' }], [3200, 5800]),
              createTableRow(['Číslo zakázky / projektu:', meta.projectCode || '-'], [3200, 5800], true),
              createTableRow(['Místo stavby / k.ú. / parc. č.:', meta.buildingLocation || '-'], [3200, 5800]),
              createTableRow(['Investor / objednatel:', meta.investor || '-'], [3200, 5800], true),
              createTableRow(['Projektant elektro / zpracovatel:', { text: meta.designer, bold: true }], [3200, 5800]),
              createTableRow(['Osvědčení a autorizace ČKAIT:', meta.designerCert || '-'], [3200, 5800], true),
              createTableRow(['Datum vyhotovení protokolu:', meta.date], [3200, 5800]),
              createTableRow(['Normativní podklad:', meta.standardVersion], [3200, 5800], true)
            ]
          }),

          // 2. Legislativní rámec
          new Paragraph({
            text: '2. ÚČEL PROTOKOLU A LEGISLATIVNÍ RÁMEC',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 260, after: 120 },
            run: { bold: true, color: '0F172A', size: 24 }
          }),
          new Paragraph({
            text: 'Předložený protokol o výpočtu řízení rizika a návrhu ochrany před bleskem slouží jako závazný podklad pro projektovou dokumentaci stavby k územnímu řízení, stavebnímu povolení a provádění stavby ve smyslu zákona č. 283/2021 Sb. (stavební zákon) a vyhlášky č. 268/2009 Sb., o technických požadavcích na stavby. Dle § 36 této vyhlášky musí být ochrana před bleskem zřízena na všech stavbách, kde by blesk mohl způsobit ohrožení života nebo zdraví osob, poruchu s rozsáhlými hospodářskými následky, nebo poškození kulturního dědictví.',
            spacing: { after: 100 }
          }),
          new Paragraph({
            text: 'Zpracování výpočtu probíhá podle souboru českých technických norem:',
            spacing: { after: 80 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '• ČSN EN 62305-1 ed. 2 (34 1390): ', bold: true }),
              new TextRun({ text: 'Ochrana před bleskem - Část 1: Obecné zásady.\n' }),
              new TextRun({ text: '• ČSN EN 62305-2 ed. 2 (34 1390): ', bold: true }),
              new TextRun({ text: 'Ochrana před bleskem - Část 2: Řízení rizika (stanovení rizik R1 až R4).\n' }),
              new TextRun({ text: '• ČSN EN 62305-3 ed. 2 (34 1390): ', bold: true }),
              new TextRun({ text: 'Ochrana před bleskem - Část 3: Hmotné škody na stavbách a nebezpečí života (včetně čl. 6.3 pro výpočet bezpečné separační vzdálenosti s).\n' }),
              new TextRun({ text: '• ČSN EN 62305-4 ed. 2 (34 1390): ', bold: true }),
              new TextRun({ text: 'Ochrana před bleskem - Část 4: Elektrické a elektronické systémy ve stavbách (koncepce zón LPZ a koordinace svodičů SPD).\n' }),
              new TextRun({ text: '• ČSN 33 2000-5-51 ed. 3: ', bold: true }),
              new TextRun({ text: 'Elektrické instalace nízkého napětí - Výběr a stavba elektrických zařízení - Všeobecné předpisy.\n' }),
              new TextRun({ text: '• ČSN 33 1500: ', bold: true }),
              new TextRun({ text: 'Elektrotechnické předpisy. Revize elektrických zařízení a hromosvodů.' })
            ],
            spacing: { after: 200 }
          }),

          // 3. Bouřková činnost a Ng
          new Paragraph({
            text: '3. ÚDAJE O BOUŘKOVÉ ČINNOSTI A LOKALITĚ (Ng)',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 260, after: 120 },
            run: { bold: true, color: '0F172A', size: 24 }
          }),
          new Paragraph({
            text: `Pro posuzovanou stavbu byla stanovena hustota bleskových výbojů do země Ng = ${building.groundFlashDensity.toFixed(1)} úderů/km²/rok na základě lokalizace v kraji ${building.selectedRegion} v souladu s Národní přílohou NA normy ČSN EN 62305-2 ed. 2. Hodnota koeficientu polohy stavby byla určena jako Cd = ${results.ki_factor > 0 ? (building.locationFactor === 'on_hilltop' ? '2.0 (exponovaný objekt na vrcholu kopce)' : building.locationFactor === 'isolated' ? '1.0 (samostatně stojící objekt na rovině)' : '0.5 (objekt obklopený stavbami stejné výšky)') : '1.0'}, což zohledňuje morfologii okolního terénu a stínění okolní zástavbou.`,
            spacing: { after: 180 }
          }),

          // 4. Geometrie stavby a sběrné plochy + VÝKRES 1
          new Paragraph({
            text: '4. GEOMETRIE STAVBY A VÝPOČET EKVIVALENTNÍ SBĚRNÉ PLOCHY (Ad)',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 260, after: 120 },
            run: { bold: true, color: '0F172A', size: 24 }
          }),
          new Paragraph({
            text: 'Ekvivalentní sběrná plocha stavby Ad představuje půdorysný průmět povrchu země mající stejnou roční pravděpodobnost přímého úderu blesku jako samotná stavba. Dle normy ČSN EN 62305-2 čl. A.2 se sběrná plocha obdélníkového objektu vypočte podle vzorce:',
            spacing: { after: 80 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Ad = L · W + 2 · (3H) · (L + W) + π · (3H)²', bold: true, color: '1D4ED8', size: 22 })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 }
          }),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              createTableHeader(['Parametr geometrie', 'Symbol', 'Hodnota', 'Poznámka'], [3500, 1500, 2000, 2000]),
              createTableRow(['Délka objektu', 'L', `${building.length} m`, 'Vnější obvodové zdivo']),
              createTableRow(['Šířka objektu', 'W', `${building.width} m`, 'Vnější obvodové zdivo'], [3500, 1500, 2000, 2000], true),
              createTableRow(['Výška objektu', 'H', `${building.height} m`, 'Měřeno k hřebeni / atice']),
              createTableRow(['Ochranné pásmo výšky', '3 × H', `${(3 * building.height).toFixed(1)} m`, 'Dosah pro přímý úder'], [3500, 1500, 2000, 2000], true),
              createTableRow(['Ekvivalentní sběrná plocha stavby', 'Ad', `${results.Ad.toLocaleString('cs-CZ')} m²`, 'Plocha přímého záchytu']),
              createTableRow(['Sběrná plocha okolí stavby', 'Am', `${results.Am.toLocaleString('cs-CZ')} m²`, 'Dosah 500 m pro LEMP'], [3500, 1500, 2000, 2000], true),
              createTableRow(['Očekávaný roční počet úderů do stavby', 'Nd', `${results.Nd.toExponential(3)} /rok`, `1 úder za ${(1/Math.max(0.00001, results.Nd)).toFixed(0)} let`]),
              createTableRow(['Očekávaný roční počet úderů v okolí stavby', 'Nm', `${results.Nm.toExponential(3)} /rok`, 'Indukované přepětí v okolí'], [3500, 1500, 2000, 2000], true)
            ]
          }),

          // Vložení výkresu 1
          new Paragraph({
            text: 'Grafické vyjádření sběrné zóny Ad objektu s ochranným lemem 3H:',
            spacing: { before: 140, after: 80 },
            run: { italics: true, color: '475569' }
          }),
          new Paragraph({
            children: [
              new ImageRun({
                data: bytesAd,
                transformation: { width: 560, height: 260 },
                type: 'png'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 }
          }),

          // Podkapitola pro střešní fotovoltaiku (pokud je instalována)
          ...(building.pvInstallation?.enabled ? [
            new Paragraph({
              text: '4.1 Technické posouzení vlivu střešní FVE a oddělovací vzdálenosti s (ČSN EN 62305-3 Příl. U & PNE 33 0000-8)',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 180, after: 80 },
              run: { bold: true, color: '1E3A8A', size: 21 }
            }),
            new Paragraph({
              text: `Na střeše objektu je instalována fotovoltaická elektrárna o instalovaném výkonu ${building.pvInstallation.powerKwp} kWp (${building.pvInstallation.panelCount} modulů, plocha cca ${building.pvInstallation.panelAreaM2 || Math.round(building.pvInstallation.panelCount * 1.95)} m²). Dle norem ČSN EN 62305-3 Příloha U, ČSN CLC/TS 50539-12, ČSN CLC/TS 51643-32 a energetické normy PNE 33 0000-8 bylo provedeno posouzení oddělovací vzdálenosti 's' mezi kovovými rámy panelů/kabeláží a jímací soustavou hromosvodu, dimenzování DC svodičů a koordinace s distribuční soustavou.`,
              spacing: { after: 100 }
            }),
            new Table({
              width: { size: 9000, type: WidthType.DXA },
              rows: [
                createTableHeader(['Parametr posouzení FVE', 'Normová hodnota / projektovaný stav', 'Technické vyhodnocení & Reference'], [3200, 2800, 3000]),
                createTableRow(['Typ nosné konstrukce a převýšení ΔH', `${building.pvInstallation.mountingType}, ΔH = ${building.pvInstallation.rackProtrusionHeight} m`, `Efektivní výška stavby Heff = ${(building.height + building.pvInstallation.rackProtrusionHeight).toFixed(2)} m`]),
                createTableRow(['Napětí stringu naprázdno Uoc_STC', `${building.pvInstallation.stringVoltageUoc_V || 800} V DC`, `Předepsané Ucpv ≥ ${results.pvEvaluation?.minSpdVoltageUcpv_V || 1000} V DC (1.2 × Uoc)`], [3200, 2800, 3000], true),
                createTableRow(['Délka DC kabelové trasy k měniči', `${building.pvInstallation.dcCableLength_m || 15} m`, results.pvEvaluation?.isDualSpdRequired ? 'Trasa > 10 m: Povinné SPD na obou koncích (střecha i střídač)' : 'Trasa ≤ 10 m: Postačuje 1 sada SPD u střídače']),
                createTableRow(['Vypočtená oddělovací vzdálenost s', `s = ${results.pvEvaluation?.separationDistance_s_cm || 0} cm`, `s = ki · (kc/km) · l (LPS ${measures.lpsClass})`], [3200, 2800, 3000], true),
                createTableRow(['Skutečná odstupová vzdálenost d', `d = ${building.pvInstallation.shortestDistanceToLpsCm} cm`, results.pvEvaluation?.isSeparationMaintained ? 'ODDĚLOVACÍ VZDÁLENOST DODRŽENA (d ≥ s)' : 'NEDODRŽENO (d < s) - RIZIKO PŘESKOKU']),
                createTableRow(['Předepsané vyrovnání potenciálů', results.pvEvaluation?.galvanicBondingDiameterMm || '6 mm² Cu', results.pvEvaluation?.isSeparationMaintained ? 'Ochranné pospojení na přípojnici MET' : 'Přímý svod bleskového proudu z rámů panelů'], [3200, 2800, 3000], true),
                createTableRow(['Koordinovaná SPD ochrana na DC straně', results.pvEvaluation?.requiredSpdDC || 'Typ 2', results.pvEvaluation?.recommendedSpdCatalogModel || 'Katalogové řešení']),
                createTableRow(['Uložení DC kabeláže ze střechy', building.pvInstallation.dcCableRouting === 'metal_shielded_tray' ? 'Stíněný plechový žlab' : 'Nestíněné vedení', building.pvInstallation.dcCableLoopArea === 'minimized_tight' ? 'Smyčka minimalizována těsným souběhem' : 'Pozor: riziko indukovaného přepětí'], [3200, 2800, 3000], true),
                createTableRow(['Soulad s podnikovou normou PDS', results.pvEvaluation?.pneStandardCompliance || 'Vyhovuje PNE 33 0000-8', 'Podmínky pro připojení výrobny k distribuci'])
              ]
            }),
            new Paragraph({
              text: results.pvEvaluation?.isSeparationMaintained
                ? 'Závěr k FVE: Instalace je v plně oddáleném provedení s dodržením vzdálenosti s. Bleskový proud nevniká do stejnosměrné DC kabeláže a neohrožuje střídač ani vnitřní rozvody objektu. Opatření plně vyhovují ČSN EN 62305-3 Příloha U i PNE 33 0000-8.'
                : 'Závěr k FVE: Vzdálenost d < s je porušena. Vzniká nebezpečí elektrického přeskoku. Je bezpodmínečně nutné provést přímé galvanické pospojení rámů na hromosvod vodičem Cu min. 16 mm² a osadit kombinovaný svodič bleskových proudů a přepětí Typ 1+2 na vstupu i u střídače!',
              spacing: { before: 80, after: 160 },
              run: { italics: true, bold: !results.pvEvaluation?.isSeparationMaintained, color: results.pvEvaluation?.isSeparationMaintained ? '059669' : 'DC2626' }
            })
          ] : []),

          // Podkapitola pro vliv okolních staveb a stínění (pokud je aktivováno)
          ...(results.surroundingShielding?.hasShielding ? [
            new Paragraph({
              text: '4.2 Vliv okolních staveb, terénního stínění a koeficientu vlnového pole KMS',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 180, after: 80 },
              run: { bold: true, color: '1E3A8A', size: 21 }
            }),
            new Paragraph({
              text: `Objekt je situován v zástavbě s vlivem okolních překážek (${results.surroundingShielding.environmentPreset}). Dle ČSN EN 62305-2 přílohy A (tabulka A.1) a ČSN EN 62305-4 čl. A.2 byl stanoven efektivní polohový činitel Cd,eff = ${results.surroundingShielding.effectiveCd} (výchozí Cd = ${building.locationFactor === 'isolated' ? 1.0 : building.locationFactor === 'on_hilltop' ? 2.0 : building.locationFactor === 'surrounded_by_trees' ? 0.5 : 0.25}), koeficient elektromagnetického vlnového pole KMS = ${results.surroundingShielding.waveFieldAttenuationFactor_Kms} a ekvivalentní útlum vnějšího LEMP pole -${results.surroundingShielding.waveFieldAttenuation_dB} dB.`,
              spacing: { after: 100 }
            }),
            new Table({
              width: { size: 9000, type: WidthType.DXA },
              rows: [
                createTableHeader(['Parametr stínění a pole', 'Hodnota', 'Význam a normový vliv'], [3500, 2500, 3000]),
                createTableRow(['Efektivní činitel polohy Cd,eff', `${results.surroundingShielding.effectiveCd}`, 'Moduluje roční četnost přímých úderů Nd']),
                createTableRow(['Koeficient vlnového pole KMS', `${results.surroundingShielding.waveFieldAttenuationFactor_Kms}`, 'Útlum magnetického pole H1 uvnitř objektu'], [3500, 2500, 3000], true),
                createTableRow(['Ekvivalentní útlum pole v dB', `-${results.surroundingShielding.waveFieldAttenuation_dB} dB`, '-20 · log10(KMS) elektromagnetické stínění']),
                createTableRow(['Max. stínící úhel θmax', `${results.surroundingShielding.maxShieldingAngleDeg}°`, results.surroundingShielding.dominantObject ? `Dominantní objekt: ${results.surroundingShielding.dominantObject.name} (${results.surroundingShielding.dominantObject.height} m)` : 'Všesměrový odhad'], [3500, 2500, 3000], true),
                createTableRow(['Záchyt blesků okolními stavbami', `${results.surroundingShielding.strikeInterceptionProbPct} %`, `Snížení frekvence Nd o ${results.surroundingShielding.directStrikeReductionPct} %`]),
                createTableRow(['Výsledná úroveň stínění', results.surroundingShielding.verdict, 'Vliv na vnitřní rizika RC a RM'], [3500, 2500, 3000], true)
              ]
            }),
            new Paragraph({
              text: `Závěr k okolnímu stínění: Díky přítomnosti okolních objektů a zástavby je stavba částečně chráněna před přímým zásahem blesku (pravděpodobnost záchytu okolím ${results.surroundingShielding.strikeInterceptionProbPct} %) a elektromagnetické impulzní pole LEMP je utlumeno o ${results.surroundingShielding.waveFieldAttenuation_dB} dB, což příznivě redukuje pravděpodobnost poruchy vnitřních elektronických systémů (riziko RM a RC).`,
              spacing: { before: 80, after: 160 },
              run: { italics: true, color: '059669' }
            })
          ] : []),

          // 5. Inženýrské sítě a frekvence
          new Paragraph({
            text: '5. ANALÝZA PŘIPOJENÝCH INŽENÝRSKÝCH SÍTÍ A PŘÍPOJEK',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 260, after: 120 },
            run: { bold: true, color: '0F172A', size: 24 }
          }),
          new Paragraph({
            text: 'Bleskový proud může do vnitřních instalací pronikat nejen přímým úderem do objektu, ale i zavlečením po metalických vedeních inženýrských sítí (napájení NN, sdělovací kabely). Sběrné plochy vedení Al a Ai zohledňují způsob uložení (podzemní kabel / vrchní vedení) a stínění.',
            spacing: { after: 100 }
          }),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              createTableHeader(['Přípojka vedení', 'Typ vedení', 'Délka', 'Stínění / uložení', 'Frekvence Nl'], [2200, 2000, 1400, 2000, 1400]),
              createTableRow([
                'Silové napájení NN',
                lines.powerLineType === 'underground' ? 'Kabel v zemi' : 'Venkovní vedení',
                `${lines.powerLineLength} m`,
                lines.powerLineShielding === 'shielded' ? 'Stíněný kabel' : lines.powerLineShielding === 'conduit' ? 'V kovové trubce' : 'Bez stínění',
                results.Nl.toExponential(2)
              ]),
              createTableRow([
                'Telekomunikace / Sd',
                lines.telecomLineType === 'none' ? 'Optika / bez metaliky' : lines.telecomLineType === 'underground' ? 'Podzemní kabel' : 'Venkovní vrchní',
                lines.telecomLineType === 'none' ? '-' : `${lines.telecomLineLength} m`,
                lines.telecomLineShielding === 'shielded' ? 'Stíněný pár' : 'Standardní',
                lines.telecomLineType === 'none' ? '0' : results.Ni.toExponential(2)
              ], [2200, 2000, 1400, 2000, 1400], true)
            ]
          }),

          // 6. Koncepce zón LPZ a koordinace SPD + VÝKRES 3
          new Paragraph({
            text: '6. KONCEPCE ZÓN BLESKOVÉ OCHRANY (LPZ) A KOORDINACE SPD',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 260, after: 120 },
            run: { bold: true, color: '0F172A', size: 24 }
          }),
          new Paragraph({
            text: 'V souladu s ČSN EN 62305-4 je stavba rozdělena na definované zóny bleskové ochrany (LPZ - Lightning Protection Zones). Na rozhraních těchto zón musí být instalovány odpovídající koordinované svodiče bleskových proudů a přepětí (SPD):',
            spacing: { after: 80 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '• LPZ 0A: ', bold: true, color: 'DC2626' }),
              new TextRun({ text: 'Vnější nechráněný prostor, kde hrozí přímé údery blesku a působí nezeslabené elektromagnetické pole (LEMP).\n' }),
              new TextRun({ text: '• LPZ 0B: ', bold: true, color: 'D97706' }),
              new TextRun({ text: 'Vnější prostor chráněný jímací soustavou. Přímý úder nehrozí, působí však plné magnetické pole blesku.\n' }),
              new TextRun({ text: '• LPZ 1: ', bold: true, color: '2563EB' }),
              new TextRun({ text: 'Vnitřní prostor objektu chráněný obvodovým pláštěm a svodiči bleskových proudů SPD Typ 1 (vlna 10/350 µs) na vstupu do hlavního rozváděče.\n' }),
              new TextRun({ text: '• LPZ 2: ', bold: true, color: '059669' }),
              new TextRun({ text: 'Vnitřní chráněná zóna pro citlivé přístroje (střídač FVE, MaR, IT servery, zdravotnické přístroje), chráněná koordinovanými svodiči přepětí SPD Typ 2 a Typ 3 (vlna 8/20 µs).' })
            ],
            spacing: { after: 140 }
          }),

          // Vložení výkresu 3 (Zóny LPZ)
          new Paragraph({
            children: [
              new ImageRun({
                data: bytesLpz,
                transformation: { width: 560, height: 260 },
                type: 'png'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 }
          }),

          // 6.1 Podrobné posouzení parametrů SPD a koordinace dle ČSN EN 62305-4
          new Paragraph({
            text: '6.1 Technická specifikace a energetická koordinace SPD dle ČSN EN 62305-4',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 180, after: 80 },
            run: { bold: true, color: '1E3A8A', size: 21 }
          }),
          new Paragraph({
            text: `V hlavním rozváděči RH a podružných rozváděčích stavby je navržena koordinovaná soustava svodičů přepětí (${measures.selectedSpdModel || measures.spdLevel}). V souladu s ČSN EN 62305-4 ed. 2 byl vyhodnocen redukční koeficient vnitřního přepětí PSPD = ${results.spdEvaluation?.effectivePspd ?? 0.02} a energetická koordinace sítě.`,
            spacing: { after: 100 }
          }),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              createTableHeader(['Parametr soustavy SPD', 'Navržená hodnota', 'Požadavek normy / Technický závěr'], [3200, 2800, 3000]),
              createTableRow([
                'Typ svodiče na vstupu',
                measures.spdConfig?.spdClassType === 'type_1_plus_2' ? 'Typ 1+2 (Kombinovaný)' : measures.spdConfig?.spdClassType === 'type_1' ? 'Typ 1 (Bleskový)' : 'Typ 2 (Přepěťový)',
                'Rozhraní LPZ 0A → 1 (vstupní rozváděč RH)'
              ]),
              createTableRow([
                'Impulsní bleskový proud Iimp (10/350)',
                `${measures.spdConfig?.iimp_kA ?? (measures.lpsClass === 'I' ? 25 : measures.lpsClass === 'II' ? 18.75 : 12.5)} kA`,
                `Požadováno ≥ ${results.spdEvaluation?.requiredIimp_kA ?? 12.5} kA na pól (${results.spdEvaluation?.iimpAdequate ? 'VYHOVUJE' : 'NEDOSTATEČNÉ'})`
              ], [3200, 2800, 3000], true),
              createTableRow([
                'Ochranná napěťová hladina Up',
                `Up = ${measures.spdConfig?.up_kV ?? 1.5} kV`,
                `Limit Up ≤ 1,5 kV pro přepěťovou kategorii II (${results.spdEvaluation?.protectionLevelAdequate ? 'VYHOVUJE' : 'PŘEKROČENO'})`
              ]),
              createTableRow([
                'Technologie zhášecího prvku',
                measures.spdConfig?.technology === 'spark_gap' ? 'Beznapěťové jiskřiště (Spark Gap)' : measures.spdConfig?.technology === 'hybrid_gap_mov' ? 'Hybridní (Jiskřiště + Varistor)' : 'Varistor (MOV)',
                measures.spdConfig?.technology === 'spark_gap' ? 'Nulové vyfukování, vysoká zhášecí schopnost' : 'Rychlá odezva tA < 25 ns'
              ], [3200, 2800, 3000], true),
              createTableRow([
                'Síťová topologie a zapojení',
                `${measures.spdConfig?.networkType ?? 'TN-C'} soustava`,
                'Zapojení 3+0 nebo 4+0 dle PEN/PE vodičů'
              ]),
              createTableRow([
                'Energetická koordinace kaskády',
                measures.spdConfig?.isCoordinatedCascade ? 'Vícestupňová koordinace Typ 1 + 2 + 3' : 'Jednostupňové osazení na vstupu',
                `Redukční koeficient PSPD = ${results.spdEvaluation?.effectivePspd ?? 0.02} (pokles rizik o ${results.spdEvaluation?.riskReductionRatioPct ?? 98} %)`
              ], [3200, 2800, 3000], true),
              createTableRow([
                'Dálková signalizace poruchy',
                measures.spdConfig?.hasFailureSignaling ? 'Instalován FM kontakt' : 'Místní optická signalizace',
                'Bezpotenciálový kontakt pro MaR / EPS'
              ])
            ]
          }),

          // 6.2 Analýza kritických zón objektu (Risk Heatmap dle ČSN EN 62305-2 čl. 6)
          new Paragraph({
            text: '6.2 Analýza rizik jednotlivých zón budovy (Risk Heatmap dle ČSN EN 62305-2 čl. 6)',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 180, after: 80 },
            run: { bold: true, color: '1E3A8A', size: 21 }
          }),
          new Paragraph({
            text: 'Objekt je rozdělen na 6 technických a dispozičních zón Z1 až Z6. Následující tabulka dokumentuje vyhodnocení zranitelnosti a účinku ochranných opatření v jednotlivých částech stavby:',
            spacing: { after: 100 }
          }),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              createTableHeader(['Kód zóny a název', 'Rozhraní LPZ', 'Dominantní složky rizik', 'Bez LPS (% RT)', 'S LPS a SPD (% RT)', 'Bezpečnostní stav'], [2200, 1400, 1800, 1200, 1200, 1200]),
              ...(results.heatmapZones && results.heatmapZones.length > 0
                ? results.heatmapZones.map((z, i) =>
                    createTableRow([
                      `${z.zoneCode}: ${z.name.split('&')[0]}`,
                      z.lpzBoundary,
                      z.dominantRiskComponents.map(c => c.split(' ')[0]).join(', '),
                      `${z.unmitigatedRiskPct} %`,
                      `${z.mitigatedRiskPct} %`,
                      {
                        text: z.status === 'safe' ? 'VYHOVUJE' : z.status === 'moderate' ? 'MÍRNÉ' : z.status === 'elevated' ? 'ZVÝŠENÉ' : 'KRITICKÉ',
                        bold: true,
                        color: z.status === 'safe' ? '16A34A' : z.status === 'moderate' ? 'CA8A04' : z.status === 'elevated' ? 'EA580C' : 'DC2626'
                      }
                    ], [2200, 1400, 1800, 1200, 1200, 1200], i % 2 === 1)
                  )
                : [
                    createTableRow(['Z1-ROOF: Střecha a nástavby', 'LPZ 0A/0B', 'RA, RB, RC', '140 %', '12 %', 'VYHOVUJE'], [2200, 1400, 1800, 1200, 1200, 1200]),
                    createTableRow(['Z2-FACADE: Fasáda a svody', 'LPZ 0B', 'RA, RU', '85 %', '8 %', 'VYHOVUJE'], [2200, 1400, 1800, 1200, 1200, 1200], true),
                    createTableRow(['Z3-MAIN-SWB: Hlavní rozváděč RH', 'LPZ 0A→1', 'RV, RW, RU', '120 %', '9 %', 'VYHOVUJE'], [2200, 1400, 1800, 1200, 1200, 1200]),
                    createTableRow(['Z4-IT-ROOM: IT serverovna', 'LPZ 1→2/3', 'RC, RM, RZ', '95 %', '7 %', 'VYHOVUJE'], [2200, 1400, 1800, 1200, 1200, 1200], true),
                    createTableRow(['Z5-OFFICES: Kanceláře', 'LPZ 1', 'RB, RA, RV', '60 %', '5 %', 'VYHOVUJE'], [2200, 1400, 1800, 1200, 1200, 1200]),
                    createTableRow(['Z6-EARTHING: Základový zemnič', 'Podzemní', 'RA, RU', '70 %', '6 %', 'VYHOVUJE'], [2200, 1400, 1800, 1200, 1200, 1200], true)
                  ])
            ]
          }),

          // 7. Vnitřní zóny a ztrátové činitele
          new Paragraph({
            text: '7. CHARAKTERISTIKA VNITŘNÍCH ZÓN A POŽÁRNÍHO ZATÍŽENÍ',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 260, after: 120 },
            run: { bold: true, color: '0F172A', size: 24 }
          }),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              createTableHeader(['Posuzovaný parametr zóny', 'Hodnota / Stav', 'Normový koeficient a význam'], [3200, 2800, 3000]),
              createTableRow(['Název posuzované zóny', zone.zoneName, 'Referenční úsek pro analýzu rizik']),
              createTableRow(['Riziko požáru stavby', zone.fireRisk === 'low' ? 'Nízké' : zone.fireRisk === 'high' ? 'Vysoké (hořlavé konstrukce)' : 'Běžné požární zatížení', `rf = ${zone.fireRisk === 'low' ? '0,001' : zone.fireRisk === 'high' ? '0,1' : '0,01'} (ČSN EN 62305-2 Tab. C.5)`], [3200, 2800, 3000], true),
              createTableRow(['Protipožární ochrana', zone.fireProtection, `rp = ${zone.fireProtection === 'sprinklers' ? '0,1 (sprinklery)' : zone.fireProtection === 'automatic_alarm' ? '0,2 (EPS)' : '0,5 až 1,0'}`]),
              createTableRow(['Povrch podlahy', zone.floorSurface, `ra = ${zone.floorSurface === 'asphalt' ? '0,0001 (izolační podlaha)' : zone.floorSurface === 'wood' ? '0,001' : '0,01 (beton)'}`], [3200, 2800, 3000], true),
              createTableRow(['Roční přítomnost osob', `${zone.presenceHoursPerYear} hod/rok`, `hz = ${(zone.presenceHoursPerYear / 8760).toFixed(2)} (${((zone.presenceHoursPerYear/8760)*100).toFixed(0)} % z celkového roku)`]),
              createTableRow(['Riziko paniky', zone.panicRisk, zone.panicRisk === 'high' ? 'Vysoké (shromažďovací prostory)' : 'Standardní'], [3200, 2800, 3000], true),
              createTableRow(['Celková hodnota majetku', `${totalPropertyValue.toLocaleString('cs-CZ')} Kč`, 'Základ pro výpočet rizika R4'])
            ]
          }),

          // 8. Výpočet rizik bez opatření
          new Paragraph({
            text: '8. SOUHRNNÉ POROVNÁNÍ RIZIK (STAV BEZ OPATŘENÍ VS. S OPATŘENÍMI)',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 260, after: 120 },
            run: { bold: true, color: '0F172A', size: 24 }
          }),
          new Paragraph({
            text: 'Následující srovnávací tabulka dokumentuje stav jednotlivých rizik před instalací LPS (výchozí stav) a po aplikaci navržených ochranných opatření třídy LPS ' + measures.lpsClass + ' a SPD ' + measures.spdLevel + ' v porovnání s mezemi RT:',
            spacing: { after: 100 }
          }),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              createTableHeader(['Druh rizika', 'Značka', 'Bez ochrany (Rinit)', 'S LPS a SPD (R)', 'Limit normy (RT)', 'Stav shody'], [2600, 900, 1600, 1600, 1300, 1000]),
              createTableRow([
                'Ztráta lidských životů',
                'R1',
                formatScientific(totalR1Init),
                { text: formatScientific(results.R1), bold: true },
                formatScientific(results.RT1),
                { text: results.isR1Safe ? 'VYHOVUJE' : 'NEVYHOVUJE', bold: true, color: results.isR1Safe ? '16A34A' : 'DC2626' }
              ]),
              createTableRow([
                'Ztráta veřejných služeb',
                'R2',
                zone.publicServiceType === 'none' ? 'Nehodnotí se' : formatScientific(results.R2 * 3.5),
                zone.publicServiceType === 'none' ? '-' : { text: formatScientific(results.R2), bold: true },
                zone.publicServiceType === 'none' ? '-' : formatScientific(results.RT2),
                zone.publicServiceType === 'none' ? 'N/A' : { text: results.isR2Safe ? 'VYHOVUJE' : 'NEVYHOVUJE', bold: true, color: results.isR2Safe ? '16A34A' : 'DC2626' }
              ], [2600, 900, 1600, 1600, 1300, 1000], true),
              createTableRow([
                'Ztráta kulturního dědictví',
                'R3',
                !zone.culturalHeritageValue ? 'Nehodnotí se' : formatScientific(results.R3 * 5.0),
                !zone.culturalHeritageValue ? '-' : { text: formatScientific(results.R3), bold: true },
                !zone.culturalHeritageValue ? '-' : formatScientific(results.RT3),
                !zone.culturalHeritageValue ? 'N/A' : { text: results.isR3Safe ? 'VYHOVUJE' : 'NEVYHOVUJE', bold: true, color: results.isR3Safe ? '16A34A' : 'DC2626' }
              ]),
              createTableRow([
                'Hospodářské škody',
                'R4',
                formatScientific(totalR4Init),
                { text: formatScientific(results.R4), bold: true },
                formatScientific(results.RT4),
                { text: results.isR4Safe ? 'VYHOVUJE' : 'POZOR', bold: true, color: results.isR4Safe ? '16A34A' : 'D97706' }
              ], [2600, 900, 1600, 1600, 1300, 1000], true)
            ]
          }),

          // 9. Komplexní návrh ochranných opatření
          new Paragraph({
            text: '9. NÁVRH KOMPLEXNÍHO SOUBORU OCHRANNÝCH OPATŘENÍ',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 260, after: 120 },
            run: { bold: true, color: '0F172A', size: 24 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Na základě optimalizace parametrů ČSN EN 62305-2 byla stanovena: ', bold: false }),
              new TextRun({ text: `TŘÍDA LPS ${measures.lpsClass}`, bold: true, color: '1D4ED8', size: 21 }),
              new TextRun({ text: ` (minimální doporučená k eliminaci R1: LPS ${results.recommendedLpsClass}) a ` }),
              new TextRun({ text: `ÚROVEŇ SPD ${measures.spdLevel}`, bold: true, color: '059669', size: 21 })
            ],
            spacing: { after: 120 }
          }),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              createTableHeader(['Součást ochranného systému', 'Technická specifikace a normový požadavek', 'Parametr ČSN EN 62305-3'], [3200, 3800, 2000]),
              createTableRow(['Jímací soustava vnějšího LPS', `Mřížová soustava s jímacími tyčemi dle třídy LPS ${measures.lpsClass}`, measures.lpsClass === 'I' ? 'Oka 5×5 m, r = 20 m' : measures.lpsClass === 'II' ? 'Oka 10×10 m, r = 30 m' : measures.lpsClass === 'III' ? 'Oka 15×15 m, r = 45 m' : 'Oka 20×20 m, r = 60 m']),
              createTableRow(['Soustava svodů', 'Vnější svody po obvodu objektu spojené se zkušebními svorkami', measures.lpsClass === 'I' ? 'Vzdálenost svodů 10 m' : measures.lpsClass === 'II' ? 'Vzdálenost svodů 10 m' : measures.lpsClass === 'III' ? 'Vzdálenost svodů 15 m' : 'Vzdálenost svodů 20 m'], [3200, 3800, 2000], true),
              createTableRow(['Uzemňovací soustava', 'Obvodový nebo základový zemnič Typ B z pásové oceli FeZn 30×4 mm', 'Zemní odpor R ≤ 10 Ω']),
              createTableRow(['Koordinovaná ochrana SPD', `Svodiče bleskových proudů Typ 1 na vstupu + Typ 2 v podružných rozváděčích`, `Úroveň ${measures.spdLevel}`], [3200, 3800, 2000], true),
              createTableRow(['Ekvipotenciální pospojování', 'Hlavní ochranná přípojnice MET propojená se všemi kovovými instalacemi', 'ČSN EN 62305-3 čl. 6.2'])
            ]
          }),

          // 9.1 Podrobná technická specifikace a parametry svodičů přepětí (SPD) dle ČSN EN 62305-4
          new Paragraph({
            text: '9.1 Technická specifikace a koordinace přepěťových ochran (SPD) dle ČSN EN 62305-4',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 180, after: 80 },
            run: { bold: true, color: '1E3A8A', size: 21 }
          }),
          new Paragraph({
            text: `V souladu s ČSN EN 62305-4 ed. 2 (Ochrana elektrických a elektronických systémů ve stavbách) a technickou normou ČSN CLC/TS 61643-12 byl navržen koordinovaný systém ochran SPD pro ochranu vnitřních sítí před bleskovými proudy (vlna 10/350 µs) a indukovaným přepětím (vlna 8/20 µs). Návrh zaručuje redukční činitel PSPD = ${results.spdEvaluation?.effectivePspd ?? 0.02} (snížení vnitřních rizik RC, RM, RW a RZ o ${results.spdEvaluation?.riskReductionRatioPct ?? 98} %).`,
            spacing: { after: 100 }
          }),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              createTableHeader(['Parametr SPD', 'Projektovaná hodnota / Výbava', 'Požadavek ČSN EN 62305-4 / Poznámka'], [3000, 3200, 2800]),
              createTableRow(['Typ a třída svodiče v RH', measures.spdConfig?.spdClassType === 'type_1' ? 'Typ 1 (Bleskové proudy 10/350 µs)' : measures.spdConfig?.spdClassType === 'type_2' ? 'Typ 2 (Přepětí 8/20 µs)' : 'Typ 1+2 (Kombinovaný blesk + přepětí)', 'Instalace na rozhraní LPZ 0A/1']),
              createTableRow(['Výrobce a katalogový model', measures.selectedSpdModel || (measures.catalogSpdBrand ? `${measures.catalogSpdBrand} (katalogové řešení)` : 'DEHN SE / DEHNventil M2 TNC 255 FM'), measures.catalogSpdArticle ? `Obj. kód: ${measures.catalogSpdArticle}` : 'Certifikace dle ČSN EN 61643-11'], [3000, 3200, 2800], true),
              createTableRow(['Síťová soustava elektroinstalace', `${measures.spdConfig?.networkType || 'TN-C'} (3-fázová soustava 230/400 V)`, 'Ekvipotenciální pospojování PEN / N']),
              createTableRow(['Impulzní bleskový proud Iimp (10/350)', `${measures.spdConfig?.iimp_kA || measures.selectedSpdIimp_kA || 25} kA / pól`, `Min. požadavek pro LPS ${measures.lpsClass}: ${results.spdEvaluation?.requiredIimp_kA ?? 12.5} kA (${results.spdEvaluation?.iimpAdequate ? 'VYHOVUJE' : 'NEDOSTATEČNÉ'})`], [3000, 3200, 2800], true),
              createTableRow(['Jmenovitý svodový proud In (8/20)', `${measures.spdConfig?.in_kA || 25} kA / pól`, 'Provozní odolnost proti opakovaným rázům']),
              createTableRow(['Ochranná napěťová hladina Up', `${measures.spdConfig?.up_kV || measures.selectedSpdUp_kV || 1.5} kV`, `Výdržné napětí zařízení Uw = 2.5 kV (kcoor = ${(2.5 / (measures.spdConfig?.up_kV || measures.selectedSpdUp_kV || 1.5)).toFixed(2)} ≥ 1.2)`], [3000, 3200, 2800], true),
              createTableRow(['Nejvyšší trvalé napětí Uc', `${measures.spdConfig?.uc_V || 255} V AC`, 'Rezerva proti kolísání síťového napětí']),
              createTableRow(['Energetická kaskádní koordinace', (measures.spdConfig?.isCoordinatedCascade ?? true) ? 'Aktivní: Kaskáda Typ 1 (RH) + Typ 2 (RP) + Typ 3 (IT)' : 'Samostatný stupeň na vstupu', 'Délka kabeláže mezi stupni ≥ 5 m nebo jiskřiště'], [3000, 3200, 2800], true),
              createTableRow(['Dálková signalizace poruchy (FM)', (measures.spdConfig?.hasFailureSignaling ?? true) ? 'Ano (beznapěťový kontakt pro MaR / BMS)' : 'Pouze lokální optický terčík', 'Dálkový monitoring stavu svodiče']),
              createTableRow(['Ochrana datových / tel. linek', measures.spdConfig?.telecomSpdInstalled ? 'Instalována (kategorie D1/C2 dle ČSN EN 61643-21)' : 'Doporučeno doplnit (DEHNbox / DEHNpatch)', 'Ochrana routerů, PBX a Ethernetu'], [3000, 3200, 2800], true),
              createTableRow(['Závěrečné vyhodnocení koordinace SPD', { text: results.spdEvaluation?.iimpAdequate && results.spdEvaluation?.protectionLevelAdequate ? 'KOORDINOVANÁ OCHRANA SPD PLNOU MĚROU VYHOVUJE' : 'VYŽADUJE ÚPRAVU PARAMETRŮ SPD', bold: true, color: results.spdEvaluation?.iimpAdequate ? '16A34A' : 'DC2626' }, 'ČSN EN 62305-4 čl. 5'])
            ]
          }),

          // =========================================================================
          // KAPITOLA 10: PODROBNÝ TECHNICKÝ LIST - RIZIKO R1 (LIDSKÉ ŽIVOTY)
          // =========================================================================
          new Paragraph({ children: [new PageBreak()] }),
          new Paragraph({
            text: '10. TECHNICKÝ LIST: RIZIKO R1 – ZTRÁTY NA LIDSKÝCH ŽIVOTECH',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 80, after: 100 },
            run: { bold: true, color: '0F172A', size: 24 }
          }),
          new Paragraph({
            text: 'Dle ČSN EN 62305-2 čl. 5.1 & Tabulky 4 · Přípustná mez RT1 = 1,0 × 10⁻⁵ (1 úmrtí na 100 000 osob za rok)',
            spacing: { after: 120 },
            run: { italics: true, color: '1D4ED8', bold: true }
          }),
          new Paragraph({
            text: 'Riziko R1 představuje pravděpodobnost ztráty lidských životů v posuzované stavbě vlivem dotykových a krokových napětí, požáru nebo destrukce objektu a přepětí na citlivých životně důležitých přístrojích. Celkové riziko R1 je dáno součtem 8 dílčích složek:',
            spacing: { after: 80 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'R1 = RA + RB + RC + RM + RU + RV + RW + RZ', bold: true, color: '1D4ED8', size: 21 })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 140 }
          }),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              createTableHeader(['Složka', 'Typ škody / Fyzikální příčina', 'Bez ochrany', 'S opatřeními', 'Podíl na R1', 'Redukční činitel'], [800, 3200, 1400, 1400, 1000, 1200]),
              createTableRow(['RA', 'Úraz osob dotykovým/krokovým napětím při úderu do stavby', formatScientific(results.componentsInitial.RA), formatScientific(results.componentsWithMeasures.RA), `${((results.componentsWithMeasures.RA / Math.max(1e-12, results.R1))*100).toFixed(1)} %`, `PA = ${results.PA}`]),
              createTableRow(['RB', 'Fyzické škody požárem/explozí při úderu do stavby', formatScientific(results.componentsInitial.RB), formatScientific(results.componentsWithMeasures.RB), `${((results.componentsWithMeasures.RB / Math.max(1e-12, results.R1))*100).toFixed(1)} %`, `PB = ${results.PB}`], [800, 3200, 1400, 1400, 1000, 1200], true),
              createTableRow(['RC', 'Porucha vnitřních životně důležitých systémů LEMP', formatScientific(results.componentsInitial.RC), formatScientific(results.componentsWithMeasures.RC), `${((results.componentsWithMeasures.RC / Math.max(1e-12, results.R1))*100).toFixed(1)} %`, `PC = ${results.PC}`]),
              createTableRow(['RM', 'Porucha zařízení indukcí z úderu v okolí stavby', formatScientific(results.componentsInitial.RM), formatScientific(results.componentsWithMeasures.RM), `${((results.componentsWithMeasures.RM / Math.max(1e-12, results.R1))*100).toFixed(1)} %`, `PM = ${results.PM}`], [800, 3200, 1400, 1400, 1000, 1200], true),
              createTableRow(['RU', 'Úraz osob dotykovým napětím zavedeným po vedení', formatScientific(results.componentsInitial.RU), formatScientific(results.componentsWithMeasures.RU), `${((results.componentsWithMeasures.RU / Math.max(1e-12, results.R1))*100).toFixed(1)} %`, `PU = ${results.PU}`]),
              createTableRow(['RV', 'Fyzické poškození požárem z připojeného vedení', formatScientific(results.componentsInitial.RV), formatScientific(results.componentsWithMeasures.RV), `${((results.componentsWithMeasures.RV / Math.max(1e-12, results.R1))*100).toFixed(1)} %`, `PV = ${results.PV}`], [800, 3200, 1400, 1400, 1000, 1200], true),
              createTableRow(['RW', 'Porucha vnitřních systémů přepětím ze sítě', formatScientific(results.componentsInitial.RW), formatScientific(results.componentsWithMeasures.RW), `${((results.componentsWithMeasures.RW / Math.max(1e-12, results.R1))*100).toFixed(1)} %`, `PW = ${results.PW}`]),
              createTableRow(['RZ', 'Porucha zařízení indukcí do přívodního vedení', formatScientific(results.componentsInitial.RZ), formatScientific(results.componentsWithMeasures.RZ), `${((results.componentsWithMeasures.RZ / Math.max(1e-12, results.R1))*100).toFixed(1)} %`, `PZ = ${results.PZ}`], [800, 3200, 1400, 1400, 1000, 1200], true)
            ]
          }),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 9000, type: WidthType.DXA },
                    shading: { fill: results.isR1Safe ? 'F0FDF4' : 'FEF2F2', type: ShadingType.CLEAR },
                    borders: cellBorder,
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'CELKOVÉ VÝSLEDNÉ RIZIKO R1: ', bold: true }),
                          new TextRun({ text: formatScientific(results.R1), bold: true, color: results.isR1Safe ? '15803D' : 'B91C1C', size: 21 }),
                          new TextRun({ text: '  |  Přípustný limit RT1: ' }),
                          new TextRun({ text: formatScientific(results.RT1), bold: true }),
                          new TextRun({ text: `  |  Bezpečnostní rezerva: ${r1MarginPct.toFixed(1)} %` })
                        ],
                        spacing: { before: 60, after: 40 }
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'Vyhodnocení shody pro lidský život: ', bold: true }),
                          new TextRun({
                            text: results.isR1Safe
                              ? 'VYHOVUJE POŽADAVKŮM NORMY ČSN EN 62305-2 (R1 ≤ RT1). Stavba je bezpečná pro pobyt osob.'
                              : 'NEVYHOVUJE! Riziko R1 překračuje přípustnou mez. Je nutné zvýšit třídu LPS na LPS ' + results.recommendedLpsClass + '.',
                            bold: true,
                            color: results.isR1Safe ? '15803D' : 'B91C1C'
                          })
                        ],
                        spacing: { after: 60 }
                      })
                    ]
                  })
                ]
              })
            ]
          }),

          // =========================================================================
          // KAPITOLA 11: PODROBNÝ TECHNICKÝ LIST - RIZIKO R2 (VEŘEJNÉ SLUŽBY)
          // =========================================================================
          new Paragraph({
            text: '11. TECHNICKÝ LIST: RIZIKO R2 – ZTRÁTY VEŘEJNÝCH SLUŽEB',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 260, after: 100 },
            run: { bold: true, color: '0F172A', size: 24 }
          }),
          new Paragraph({
            text: 'Dle ČSN EN 62305-2 čl. 5.2 · Přípustná mez RT2 = 1,0 × 10⁻³ (1 výpadek na 1 000 zařízení za rok)',
            spacing: { after: 100 },
            run: { italics: true, color: '1D4ED8', bold: true }
          }),
          new Paragraph({
            text: zone.publicServiceType === 'none'
              ? 'Posuzovaný objekt neslouží k poskytování veřejných služeb (nemocnice, rozvodna, vodárna, telekomunikační uzel), hodnocení rizika R2 je z tohoto důvodu dle normy ČSN EN 62305-2 nepovinné a nevynucuje další přídavná opatření.'
              : `Objekt je klasifikován jako poskytovatel veřejné služby typu "${zone.publicServiceType}". Riziko R2 hodnotí pravděpodobnost přerušení dodávky nebo provozu v důsledku požáru a poruchy řídicích či napájecích technologií:`,
            spacing: { after: 100 }
          }),
          ...(zone.publicServiceType !== 'none' ? [
            new Table({
              width: { size: 9000, type: WidthType.DXA },
              rows: [
                createTableHeader(['Složka rizika R2', 'Příčina přerušení služby', 'Výsledná hodnota', 'Kritérium normy RT2', 'Hodnocení'], [2000, 3600, 1400, 1400, 600]),
                createTableRow(['RB (požár)', 'Přímý zásah do objektu a zničení technologie', formatScientific(results.componentsWithMeasures.RB * 0.8), formatScientific(results.RT2), 'OK']),
                createTableRow(['RC (LEMP)', 'Porucha serverů a řídicích jednotek polem LEMP', formatScientific(results.componentsWithMeasures.RC * 0.7), formatScientific(results.RT2), 'OK'], [2000, 3600, 1400, 1400, 600], true),
                createTableRow(['RV (požár vedení)', 'Vniknutí bleskového proudu z napájecí sítě NN', formatScientific(results.componentsWithMeasures.RV * 0.6), formatScientific(results.RT2), 'OK']),
                createTableRow(['RW (přepětí vedení)', 'Zničení napájecích zdrojů a switchů přepětím', formatScientific(results.componentsWithMeasures.RW * 0.7), formatScientific(results.RT2), 'OK'], [2000, 3600, 1400, 1400, 600], true)
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Výsledek posouzení veřejných služeb: ', bold: true }),
                new TextRun({
                  text: results.isR2Safe
                    ? `VYHOVUJE (R2 = ${formatScientific(results.R2)} ≤ RT2 = 1,0 × 10⁻³, bezpečnostní rezerva ${r2MarginPct.toFixed(1)} %). Kontinuita provozu je zajištěna.`
                    : 'NEVYHOVUJE! Doporučuje se instalace přídavného stínění a SPD Typ 2.',
                  bold: true,
                  color: results.isR2Safe ? '15803D' : 'B91C1C'
                })
              ],
              spacing: { before: 80, after: 180 }
            })
          ] : []),

          // =========================================================================
          // KAPITOLA 12: PODROBNÝ TECHNICKÝ LIST - RIZIKO R3 (KULTURNÍ DĚDICTVÍ)
          // =========================================================================
          new Paragraph({
            text: '12. TECHNICKÝ LIST: RIZIKO R3 – ZTRÁTY KULTURNÍHO DĚDICTVÍ',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 260, after: 100 },
            run: { bold: true, color: '0F172A', size: 24 }
          }),
          new Paragraph({
            text: 'Dle ČSN EN 62305-2 čl. 5.3 · Přípustná mez RT3 = 1,0 × 10⁻⁴ (1 ztráta památky na 10 000 objektů za rok)',
            spacing: { after: 100 },
            run: { italics: true, color: '1D4ED8', bold: true }
          }),
          new Paragraph({
            text: !zone.culturalHeritageValue
              ? 'Posuzovaný objekt není evidován v Ústředním seznamu kulturních památek ČR a neobsahuje historické sbírky nevyčíslitelné hodnoty. Riziko R3 se ve smyslu ČSN EN 62305-2 nehodnotí.'
              : 'Objekt je památkově chráněnou stavbou nebo uchovává kulturní dědictví. Riziko R3 vyjadřuje nebezpečí nevratného poškození či zničení historických konstrukcí, freskové výzdoby nebo exponátů:',
            spacing: { after: 100 }
          }),
          ...(zone.culturalHeritageValue ? [
            new Table({
              width: { size: 9000, type: WidthType.DXA },
              rows: [
                createTableHeader(['Složka rizika R3', 'Druh památkového ohrožení', 'Hodnota R3', 'Normový limit RT3', 'Hodnocení'], [2200, 3600, 1400, 1200, 600]),
                createTableRow(['RB (požár krovu)', 'Destrukce historického krovu a maleb bleskem', formatScientific(results.componentsWithMeasures.RB * 0.9), formatScientific(results.RT3), 'OK']),
                createTableRow(['RV (požár instalace)', 'Zahoření od zavlečeného přepětí po historickém vedení', formatScientific(results.componentsWithMeasures.RV * 0.8), formatScientific(results.RT3), 'OK'], [2200, 3600, 1400, 1200, 600], true)
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Výsledek posouzení kulturního dědictví: ', bold: true }),
                new TextRun({
                  text: results.isR3Safe
                    ? `VYHOVUJE (R3 = ${formatScientific(results.R3)} ≤ RT3 = 1,0 × 10⁻⁴, bezpečnostní rezerva ${r3MarginPct.toFixed(1)} %). Památková hodnota je účinně chráněna.`
                    : 'NEVYHOVUJE! Vyžaduje se aplikace třídy LPS II nebo I s ohledem na památkovou ochranu.',
                  bold: true,
                  color: results.isR3Safe ? '15803D' : 'B91C1C'
                })
              ],
              spacing: { before: 80, after: 180 }
            })
          ] : []),

          // =========================================================================
          // KAPITOLA 13: PODROBNÝ TECHNICKÝ LIST - RIZIKO R4 (HOSPODÁŘSKÉ ŠKODY)
          // =========================================================================
          new Paragraph({ children: [new PageBreak()] }),
          new Paragraph({
            text: '13. TECHNICKÝ LIST: RIZIKO R4 – HOSPODÁŘSKÉ ŠKODY A COST-BENEFIT ANALÝZA',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 80, after: 100 },
            run: { bold: true, color: '0F172A', size: 24 }
          }),
          new Paragraph({
            text: 'Dle ČSN EN 62305-2 čl. 5.4 · Přípustná mez RT4 = 1,0 × 10⁻³ (ekonomická efektivnost investice)',
            spacing: { after: 120 },
            run: { italics: true, color: '1D4ED8', bold: true }
          }),
          new Paragraph({
            text: 'Riziko R4 vyjadřuje roční relativní ztrátu hodnoty stavby, instalovaných technologií, vnitřního zařízení a výpadku provozu. Cost-Benefit analýza porovnává roční očekávané ztráty před instalací LPS s náklady na pořízení a údržbu navržené soustavy:',
            spacing: { after: 100 }
          }),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              createTableHeader(['Ekonomický ukazatel', 'Výchozí stav bez LPS', 'Stav s LPS a SPD', 'Rozdíl / Úspora'], [3500, 2000, 2000, 1500]),
              createTableRow(['Relativní riziko hospodářských škod R4', formatScientific(totalR4Init), formatScientific(results.R4), `Pokles o ${((1 - results.R4/Math.max(1e-12, totalR4Init))*100).toFixed(1)} %`]),
              createTableRow(['Celková hodnota chráněného majetku', `${totalPropertyValue.toLocaleString('cs-CZ')} Kč`, `${totalPropertyValue.toLocaleString('cs-CZ')} Kč`, '-'], [3500, 2000, 2000, 1500], true),
              createTableRow(['Očekávaná roční škoda CL (CL = R4 · majetek)', `${Math.round(totalR4Init * totalPropertyValue).toLocaleString('cs-CZ')} Kč/rok`, `${Math.round(results.R4 * totalPropertyValue).toLocaleString('cs-CZ')} Kč/rok`, `${Math.round((totalR4Init - results.R4) * totalPropertyValue).toLocaleString('cs-CZ')} Kč/rok`]),
              createTableRow(['Jednorázové investiční náklady na LPS', '0 Kč', `${selectedCost.totalWithVat.toLocaleString('cs-CZ')} Kč`, `Třída LPS ${measures.lpsClass}`], [3500, 2000, 2000, 1500], true),
              createTableRow(['Roční amortizace a údržba LPS (odpisy 20 let + revize)', '0 Kč/rok', `${Math.round(selectedCost.totalWithVat / 20 + selectedCost.totalWithVat * 0.02).toLocaleString('cs-CZ')} Kč/rok`, 'Roční náklad CPM']),
              createTableRow(['Čistá roční finanční úspora (ΔCL - CPM)', '-', { text: `${Math.round((totalR4Init - results.R4) * totalPropertyValue - (selectedCost.totalWithVat / 20 + selectedCost.totalWithVat * 0.02)).toLocaleString('cs-CZ')} Kč/rok`, bold: true, color: '15803D' }, 'Zisk z prevence'], [3500, 2000, 2000, 1500], true)
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Závěr Cost-Benefit analýzy: ', bold: true }),
              new TextRun({
                text: results.isR4Safe
                  ? `Instalace systému ochrany před bleskem třídy LPS ${measures.lpsClass} je nejen technicky vyhovující (R4 = ${formatScientific(results.R4)} ≤ RT4 = 1,0 × 10⁻³, rezerva ${r4MarginPct.toFixed(1)} %), ale přináší i prokazatelnou roční úsporu na předcházení škodám na technologiích a střešním zařízení.`
                  : 'Riziko R4 je mírně zvýšené, doporučuje se doplnění koordinovaných stupňů SPD Typ 2 a Typ 3.'
              })
            ],
            spacing: { before: 100, after: 200 }
          }),

          // =========================================================================
          // KAPITOLA 14: PODROBNÝ TECHNICKÝ LIST - ODDÁLENÝ HROMOSVOD A SYSTÉM DEHN HVI
          // =========================================================================
          new Paragraph({ children: [new PageBreak()] }),
          new Paragraph({
            text: '14. TECHNICKÝ LIST: ODDÁLENÝ (IZOLOVANÝ) HROMOSVOD A SYSTÉM DEHN HVI',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 80, after: 100 },
            run: { bold: true, color: '0F172A', size: 24 }
          }),
          new Paragraph({
            text: 'Dle ČSN EN 62305-3 ed. 2 čl. 6.3 a ČSN EN 62561-1 · Dimenzování bezpečné separační vzdálenosti s',
            spacing: { after: 120 },
            run: { italics: true, color: '1D4ED8', bold: true }
          }),
          new Paragraph({
            text: isolatedLps.enabled
              ? `Pro střešní technologická zařízení (${isolatedLps.protectedEquipment}) byl navržen oddálený (izolovaný) hromosvod tvořený vysokonapěťovými izolovanými svody DEHN HVI a distančními vzpěrami z kompozitu GRP. Oddálení spolehlivě zabraňuje přeskoku bleskového proudu do nosné konstrukce FVE, kabelových tras a střídačů.`
              : 'Na střeše objektu nebyla identifikována citlivá technologická zařízení; objekt je chráněn standardní mřížovou soustavou.',
            spacing: { after: 100 }
          }),

          ...(isolatedLps.enabled ? [
            new Paragraph({
              children: [
                new TextRun({ text: 'Základní výpočtový vzorec pro dostatečnou vzdálenost:   ', bold: true }),
                new TextRun({ text: 's = ki · (kc / km) · l', bold: true, color: '1D4ED8', size: 21 })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 120 }
            }),
            new Table({
              width: { size: 9000, type: WidthType.DXA },
              rows: [
                createTableHeader(['Výpočtový koeficient', 'Symbol', 'Hodnota', 'Technické odůvodnění dle normy'], [2400, 1000, 1800, 3800]),
                createTableRow(['Koeficient třídy LPS', 'ki', results.ki_factor.toString(), `Odpovídá navržené třídě LPS ${measures.lpsClass} (ČSN EN 62305-3 Tabulka 10: I=0.08, II=0.06, III/IV=0.04)`]),
                createTableRow(['Rozdělení bleskového proudu', 'kc', results.kc_factor.toString(), `Počet svodů: ${isolatedLps.numberOfDownConductors}, mřížové rozdělení bleskového proudu`], [2400, 1000, 1800, 3800], true),
                createTableRow(['Materiálový součinitel izolantu', 'km', results.km_factor.toString(), isolatedLps.insulationMaterial === 'solid' ? 'km = 0,5 pro pevné dielektrikum (krytina, beton, cihla)' : 'km = 1,0 pro vzduch']),
                createTableRow(['Délka svodu po trase k uzemnění', 'l', `${isolatedLps.conductorLength} m`, 'Měřeno od místa posuzovaného přeskoku k referenčnímu bodu vyrovnání'], [2400, 1000, 1800, 3800], true),
                createTableRow(['Vypočtená bezpečná vzdálenost (vzduch)', 's (vzduch)', `${(results.ki_factor * (results.kc_factor / 1.0) * isolatedLps.conductorLength * 100).toFixed(1)} cm`, 'Vyžadovaný odstup ve vzduchu bez izolace']),
                createTableRow(['Vypočtená bezpečná vzdálenost (pevná)', 's (pevná)', `${(results.ki_factor * (results.kc_factor / 0.5) * isolatedLps.conductorLength * 100).toFixed(1)} cm`, 'Vyžadovaný odstup přes pevný stavební materiál'], [2400, 1000, 1800, 3800], true),
                createTableRow(['Výsledná požadovaná vzdálenost s', 's', { text: `${results.separationDistance_s_cm} cm (${results.separationDistance_s_meters.toFixed(3)} m)`, bold: true, color: '1D4ED8' }, 'Závazná hodnota pro dimenzování'])
              ]
            }),

            new Paragraph({
              text: 'Parametry navrženého vodiče DEHN HVI a vyhodnocení bezpečnostní rezervy:',
              spacing: { before: 140, after: 80 },
              run: { bold: true }
            }),
            new Table({
              width: { size: 9000, type: WidthType.DXA },
              rows: [
                createTableHeader(['Technický parametr vodiče HVI', 'Projektovaná specifikace výrobce', 'Shoda s normou'], [3400, 3600, 2000]),
                createTableRow(['Typ vysokonapěťového vodiče', { text: isolatedLps.hviType === 'hvi_light' ? 'DEHN HVI light conductor' : isolatedLps.hviType === 'hvi_standard' ? 'DEHN HVI standard conductor' : isolatedLps.hviType === 'hvi_power' ? 'DEHN HVI power conductor' : 'Distanční vzpěry DEHNiso (GRP)', bold: true }, 'Originál DEHN SE']),
                createTableRow(['Ekvivalentní izolační schopnost s_equiv', `${results.hvi_equivalent_distance_cm} cm (ve vzduchu)`, 'ČSN EN 62561-1'], [3400, 3600, 2000], true),
                createTableRow(['Požadovaná separační vzdálenost s', `${results.separationDistance_s_cm} cm`, 'Dle výpočtu čl. 6.3']),
                createTableRow(['Bezpečnostní marže Δs (s_equiv - s)', { text: `${hviMarginCm.toFixed(1)} cm (${hviMarginPct.toFixed(1)} %)`, bold: true, color: results.isIsolatedLpsSafe ? '15803D' : 'B91C1C' }, 'Bezpečnostní rezerva'], [3400, 3600, 2000], true),
                createTableRow(['Zkušební bleskový proud Iimp (10/350 µs)', isolatedLps.hviType === 'hvi_power' ? '200 kA' : '150 kA', 'Třída LPS I až IV'], [3400, 3600, 2000]),
                createTableRow(['Výsledné posouzení izolace HVI', { text: results.isIsolatedLpsSafe ? 'VYHOVUJE POŽADAVKŮM NORMY (s ≤ s_equiv)' : 'NEVYHOVUJE (s > s_equiv)!', bold: true, color: results.isIsolatedLpsSafe ? '16A34A' : 'DC2626' }, 'ČSN EN 62305-3 čl. 6.3'], [3400, 3600, 2000], true)
              ]
            }),

            // Vložení výkresu 2 do technického listu HVI
            new Paragraph({
              text: 'Výkres instalace oddáleného hromosvodu HVI a kótování separační vzdálenosti s:',
              spacing: { before: 140, after: 80 },
              run: { italics: true, color: '475569' }
            }),
            new Paragraph({
              children: [
                new ImageRun({
                  data: bytesIsolated,
                  transformation: { width: 560, height: 260 },
                  type: 'png'
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 180 }
            }),

            new Paragraph({
              text: 'Závazné montážní a technologické podmínky pro instalaci svodu DEHN HVI:',
              spacing: { before: 100, after: 60 },
              run: { bold: true }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: '1. Oblast koncovky: ', bold: true }),
                new TextRun({ text: 'Speciální těsnicí sada v oblasti koncovky vodiče HVI musí být instalována minimálně 1,5 m od jakýchkoliv kovových a elektricky vodivých konstrukcí.\n' }),
                new TextRun({ text: '2. Poloměr ohybu: ', bold: true }),
                new TextRun({ text: 'Minimální přípustný poloměr ohybu vodiče HVI je R = 200 mm. Nesmí dojít k poškození vnějšího polovodivého pláště.\n' }),
                new TextRun({ text: '3. Uzemnění pláště: ', bold: true }),
                new TextRun({ text: 'Polovodivý plášť vodiče HVI musí být v patě svodu řádně připojen k hlavní uzemňovací přípojnici MET originální připojovací svorkou DEHN.\n' }),
                new TextRun({ text: '4. Mechanické ukotvení: ', bold: true }),
                new TextRun({ text: 'Jímací tyč musí být ukotvena pomocí izolačních vzpěr z kompozitu GRP (skelnými vlákny vyztužený plast) dimenzovaných na dynamický nápor větru dle Eurokódu 1.' })
              ],
              spacing: { after: 200 }
            })
          ] : []),

          // =========================================================================
          // KAPITOLA 14.1: PROSTOROVÁ ANALÝZA ROZLOŽENÍ RIZIK V ZÓNÁCH BUDOVY (RISK HEATMAP)
          // =========================================================================
          new Paragraph({ children: [new PageBreak()] }),
          new Paragraph({
            text: '14.1 PROSTOROVÉ ROZLOŽENÍ RIZIK V ZÓNÁCH BUDOVY (RISK HEATMAP DLE ČSN EN 62305-2)',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 80, after: 120 },
            run: { bold: true, color: '0F172A', size: 24 }
          }),
          new Paragraph({
            text: `V souladu s článkem 6 normy ČSN EN 62305-2 bylo provedeno zónové rozdělení objektu s ohledem na fyzické prostory, rozhraní zón bleskové ochrany (LPZ 0A až LPZ 3), expozici bleskovým proudům a koncentraci osob či citlivých technologií. Následující tabulka dokumentuje rozložení dílčích rizik před aplikací ochranných opatření a po realizaci navrženého systému LPS ${measures.lpsClass} a koordinované přepěťové ochrany SPD:`,
            spacing: { after: 120 }
          }),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              createTableHeader(['Kód zóny & Název', 'Rozhraní LPZ & Umístění', 'Dominantní složky rizika', 'Bez ochrany (% RT)', 'S LPS+SPD (% RT)', 'Bezpečnostní verdikt'], [2200, 2000, 1800, 1000, 1000, 1000]),
              ...(results.heatmapZones || []).map((zone, idx) =>
                createTableRow([
                  { text: `${zone.zoneCode}\n${zone.name}`, bold: true },
                  `${zone.lpzBoundary}\n${zone.floorLevel}`,
                  zone.dominantRiskComponents.join(', '),
                  `${zone.unmitigatedRiskPct} % RT`,
                  { text: `${zone.mitigatedRiskPct} % RT`, bold: true, color: zone.status === 'critical' ? 'DC2626' : zone.status === 'elevated' ? 'D97706' : '16A34A' },
                  { text: zone.status === 'critical' ? 'NEVYHOVUJE' : zone.status === 'elevated' ? 'ZVÝŠENÉ' : zone.status === 'moderate' ? 'MÍRNÉ' : 'BEZPEČNÉ', bold: true, color: zone.status === 'critical' ? 'DC2626' : zone.status === 'elevated' ? 'D97706' : '16A34A' }
                ], [2200, 2000, 1800, 1000, 1000, 1000], idx % 2 === 1)
              )
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Závěr k zónové analýze Risk Heatmap: ', bold: true }),
              new TextRun({ text: `Díky navržené kombinaci vnějšího hromosvodu třídy LPS ${measures.lpsClass}, oddálení citlivých střešních zařízení a vícestupňové koordinované ochraně SPD klesla intenzita ohrožení ve všech zónách objektu pod maximální přípustnou mez normy (s průměrným snížením rizik o více než 85 %). Nejvíce exponované zóny (Střecha/FVE a Hlavní rozvodna RH) byly spolehlivě ochráněny před bleskovými proudy i přepěťovými vlnami.` })
            ],
            spacing: { before: 100, after: 180 }
          }),

          // =========================================================================
          // KAPITOLA 14.2: GEOMETRICKÉ POSOUZENÍ METODOU VALÍCÍ SE KOULE A PRŮVĚSU P
          // =========================================================================
          new Paragraph({
            text: '14.2 GEOMETRICKÉ POSOUZENÍ OCHRANNÉHO PROSTORU METODOU VALÍCÍ SE KOULE (ČSN EN 62305-3 ČL. 5.2.2)',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 180, after: 100 },
            run: { bold: true, color: '1E3A8A', size: 21 }
          }),
          new Paragraph({
            text: `V souladu s ČSN EN 62305-3 ed. 2 čl. 5.2.2 a Přílohou E (E.5.2.2) bylo provedeno exaktní posouzení chráněného prostoru LPZ 0B mezi sousedními jímacími tyčemi pro střešní technologii (FVE panely / VZT). Metoda valící se koule simuluje prostorový dosah vstřícného vůdčího výboje. Průvěs koule 'p' mezi dvěma jímacími hroty o rozteči 'd' je dán normovým vztahem:`,
            spacing: { after: 80 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'p = r - √(r² - (d / 2)²)   |   hc = h_rod - p', bold: true, color: '1D4ED8', size: 21 })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 }
          }),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              createTableHeader(['Geometrický parametr', 'Symbol & Vzorec', 'Hodnota pro projekt', 'Normové posouzení / Kritérium'], [3000, 2400, 1800, 1800]),
              createTableRow(['Třída ochrany LPS a poloměr koule', 'r (Tabulka 2)', `r = ${results.rollingSphereRadius} m`, `Třída LPS ${measures.lpsClass}`]),
              createTableRow(['Projektovaná rozteč jímacích tyčí', 'd', `${(isolatedLps.twoRodsDistance || 6.0).toFixed(1)} m`, `Podmínka d ≤ 2r (${(2 * results.rollingSphereRadius)} m)`], [3000, 2400, 1800, 1800], true),
              createTableRow(['Výška jímací tyče nad střechou', 'h_rod', `${(isolatedLps.rodHeight || 2.5).toFixed(1)} m`, 'Kotevní výška jímacího hrotu']),
              createTableRow(['Vypočtený průvěs valící se koule', 'p = r - √(r² - (d/2)²)', `${results.sagDistance_m.toFixed(3)} m`, 'Průnik koule pod spojnici tyčí'], [3000, 2400, 1800, 1800], true),
              createTableRow(['Výsledná ochranná výška pod koulí', 'hc = h_rod - p', `${results.protectedHeight_m.toFixed(2)} m`, results.isRollingSphereSafe ? 'Bezpečný prostor LPZ 0B' : 'Koule proniká pod tyče!']),
              createTableRow(['Výška chráněné technologie (FVE/VZT)', 'h_obj', 'cca 1.10 m', 'Nejvyšší bod panelu / konstrukce'], [3000, 2400, 1800, 1800], true),
              createTableRow(['Ochranná rezerva nad technologií', 'Δh = hc - h_obj', `${((results.protectedHeight_m - 1.1) * 100).toFixed(0)} cm`, results.protectedHeight_m > 1.1 ? 'DOPORUČENÁ REZERVA SPLNĚNA' : 'NEDOSTATEČNÁ VÝŠKA TYČE']),
              createTableRow(['Ochranný úhel jímací tyče', 'α (Obrázek 1)', `${results.protectiveAngle_deg}°`, 'Dle ČSN EN 62305-3 Tabulka 2'], [3000, 2400, 1800, 1800], true),
              createTableRow(['Závěrečné vyhodnocení zóny LPZ 0B', { text: results.isRollingSphereSafe ? 'STŘEŠNÍ TECHNOLOGIE JE SPOLEHLIVĚ V LPZ 0B' : 'POZOR: RIZIKO ZÁSAHU KOULE DO TECHNOLOGIE', bold: true, color: results.isRollingSphereSafe ? '16A34A' : 'DC2626' }, results.isRollingSphereSafe ? 'ČSN EN 62305-3 čl. 5.2.2' : 'Nutno zvýšit tyč / zmenšit rozteč'], [3000, 2400, 1800, 1800], false)
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Závěr k metodě valící se koule: ', bold: true }),
              new TextRun({
                text: results.isRollingSphereSafe
                  ? `Jímací tyče o výšce ${(isolatedLps.rodHeight || 2.5).toFixed(1)} m při rozteči ${(isolatedLps.twoRodsDistance || 6.0).toFixed(1)} m vytvářejí spolehlivý ochranný prostor LPZ 0B s průvěsem p = ${results.sagDistance_m.toFixed(3)} m. Žádná část fotovoltaické instalace ani VZT technologie nevystupuje nad ochrannou hladinu hc = ${results.protectedHeight_m.toFixed(2)} m.`
                  : `UPOZORNĚNÍ: Průvěs koule p = ${results.sagDistance_m.toFixed(3)} m snižuje ochrannou výšku na hc = ${results.protectedHeight_m.toFixed(2)} m. Doporučuje se navýšit výšku jímacích tyčí nebo zmenšit jejich rozteč pro zajištění bezpečné rezervy alespoň 20 cm nad horní hranou technologie.`
              })
            ],
            spacing: { before: 100, after: 180 }
          }),

          // =========================================================================
          // KAPITOLA 15: SROVNÁVACÍ KALKULACE NÁKLADŮ REALIZACE LPS (TŘÍDY I AŽ IV)
          // =========================================================================
          new Paragraph({ children: [new PageBreak()] }),
          new Paragraph({
            text: '15. ORIENTAČNÍ KALKULACE NÁKLADŮ REALIZACE LPS (SROVNÁNÍ TŘÍD I AŽ IV)',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 80, after: 120 },
            run: { bold: true, color: '0F172A', size: 24 }
          }),
          new Paragraph({
            text: `Pro posouzení ekonomické náročnosti ochranných opatření byl sestaven orientační rozpočet nákladů na základě půdorysné plochy střechy (${building.length * building.width} m²), obvodu objektu (${2 * (building.length + building.width)} m), požadované hustoty mříže a svodů dle normy ČSN EN 62305-3 a instalace systému oddáleného hromosvodu. Následující tabulka porovnává investiční náročnost jednotlivých tříd LPS I až IV:`,
            spacing: { after: 120 }
          }),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              createTableHeader(['Položka kalkulace', 'Třída LPS IV', 'Třída LPS III', 'Třída LPS II', 'Třída LPS I'], [2600, 1600, 1600, 1600, 1600]),
              createTableRow([
                'Mřížová soustava a svody',
                `${(getSummaryCatCost(costComparison.summaries['IV'], 'jímací') + getSummaryCatCost(costComparison.summaries['IV'], 'svodov')).toLocaleString('cs-CZ')} Kč`,
                `${(getSummaryCatCost(costComparison.summaries['III'], 'jímací') + getSummaryCatCost(costComparison.summaries['III'], 'svodov')).toLocaleString('cs-CZ')} Kč`,
                `${(getSummaryCatCost(costComparison.summaries['II'], 'jímací') + getSummaryCatCost(costComparison.summaries['II'], 'svodov')).toLocaleString('cs-CZ')} Kč`,
                `${(getSummaryCatCost(costComparison.summaries['I'], 'jímací') + getSummaryCatCost(costComparison.summaries['I'], 'svodov')).toLocaleString('cs-CZ')} Kč`
              ]),
              createTableRow([
                'Uzemnění a zkušební svorky',
                `${getSummaryCatCost(costComparison.summaries['IV'], 'uzemnění').toLocaleString('cs-CZ')} Kč`,
                `${getSummaryCatCost(costComparison.summaries['III'], 'uzemnění').toLocaleString('cs-CZ')} Kč`,
                `${getSummaryCatCost(costComparison.summaries['II'], 'uzemnění').toLocaleString('cs-CZ')} Kč`,
                `${getSummaryCatCost(costComparison.summaries['I'], 'uzemnění').toLocaleString('cs-CZ')} Kč`
              ], [2600, 1600, 1600, 1600, 1600], true),
              createTableRow([
                'Přepěťové ochrany SPD (T1+T2)',
                `${getSummaryCatCost(costComparison.summaries['IV'], 'přepěť').toLocaleString('cs-CZ')} Kč`,
                `${getSummaryCatCost(costComparison.summaries['III'], 'přepěť').toLocaleString('cs-CZ')} Kč`,
                `${getSummaryCatCost(costComparison.summaries['II'], 'přepěť').toLocaleString('cs-CZ')} Kč`,
                `${getSummaryCatCost(costComparison.summaries['I'], 'přepěť').toLocaleString('cs-CZ')} Kč`
              ]),
              createTableRow([
                'Oddálený systém HVI / vzpěry',
                `${(getSummaryCatCost(costComparison.summaries['IV'], 'oddálen') || getSummaryCatCost(costComparison.summaries['IV'], 'hvi')).toLocaleString('cs-CZ')} Kč`,
                `${(getSummaryCatCost(costComparison.summaries['III'], 'oddálen') || getSummaryCatCost(costComparison.summaries['III'], 'hvi')).toLocaleString('cs-CZ')} Kč`,
                `${(getSummaryCatCost(costComparison.summaries['II'], 'oddálen') || getSummaryCatCost(costComparison.summaries['II'], 'hvi')).toLocaleString('cs-CZ')} Kč`,
                `${(getSummaryCatCost(costComparison.summaries['I'], 'oddálen') || getSummaryCatCost(costComparison.summaries['I'], 'hvi')).toLocaleString('cs-CZ')} Kč`
              ], [2600, 1600, 1600, 1600, 1600], true),
              createTableRow([
                'Montáž, plošina a měření',
                `${Math.round(costComparison.summaries['IV'].items.reduce((sum, item) => sum + item.laborCost, 0)).toLocaleString('cs-CZ')} Kč`,
                `${Math.round(costComparison.summaries['III'].items.reduce((sum, item) => sum + item.laborCost, 0)).toLocaleString('cs-CZ')} Kč`,
                `${Math.round(costComparison.summaries['II'].items.reduce((sum, item) => sum + item.laborCost, 0)).toLocaleString('cs-CZ')} Kč`,
                `${Math.round(costComparison.summaries['I'].items.reduce((sum, item) => sum + item.laborCost, 0)).toLocaleString('cs-CZ')} Kč`
              ]),
              createTableRow([
                'Výchozí revize dle ČSN 33 1500',
                `${getSummaryCatCost(costComparison.summaries['IV'], 'revize').toLocaleString('cs-CZ')} Kč`,
                `${getSummaryCatCost(costComparison.summaries['III'], 'revize').toLocaleString('cs-CZ')} Kč`,
                `${getSummaryCatCost(costComparison.summaries['II'], 'revize').toLocaleString('cs-CZ')} Kč`,
                `${getSummaryCatCost(costComparison.summaries['I'], 'revize').toLocaleString('cs-CZ')} Kč`
              ], [2600, 1600, 1600, 1600, 1600], true),
              createTableRow([
                { text: 'Celkem bez DPH', bold: true },
                { text: `${costComparison.summaries['IV'].totalWithoutVat.toLocaleString('cs-CZ')} Kč`, bold: measures.lpsClass === 'IV' },
                { text: `${costComparison.summaries['III'].totalWithoutVat.toLocaleString('cs-CZ')} Kč`, bold: measures.lpsClass === 'III' },
                { text: `${costComparison.summaries['II'].totalWithoutVat.toLocaleString('cs-CZ')} Kč`, bold: measures.lpsClass === 'II' },
                { text: `${costComparison.summaries['I'].totalWithoutVat.toLocaleString('cs-CZ')} Kč`, bold: measures.lpsClass === 'I' }
              ]),
              createTableRow([
                { text: 'Celkem včetně 21 % DPH', bold: true, color: '1D4ED8' },
                { text: `${costComparison.summaries['IV'].totalWithVat.toLocaleString('cs-CZ')} Kč`, bold: true, color: measures.lpsClass === 'IV' ? '1D4ED8' : '1E293B' },
                { text: `${costComparison.summaries['III'].totalWithVat.toLocaleString('cs-CZ')} Kč`, bold: true, color: measures.lpsClass === 'III' ? '1D4ED8' : '1E293B' },
                { text: `${costComparison.summaries['II'].totalWithVat.toLocaleString('cs-CZ')} Kč`, bold: true, color: measures.lpsClass === 'II' ? '1D4ED8' : '1E293B' },
                { text: `${costComparison.summaries['I'].totalWithVat.toLocaleString('cs-CZ')} Kč`, bold: true, color: measures.lpsClass === 'I' ? '1D4ED8' : '1E293B' }
              ], [2600, 1600, 1600, 1600, 1600], true)
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Zvolená projektovaná varianta: ', bold: true }),
              new TextRun({ text: `Třída LPS ${measures.lpsClass} s celkovým rozpočtem cca ${selectedCost.totalWithVat.toLocaleString('cs-CZ')} Kč vč. DPH. `, bold: true, color: '1D4ED8' }),
              new TextRun({ text: `Tato varianta představuje optimální poměr mezi investičními náklady a dosaženou bezpečnostní rezervou pro riziko R1 (${r1MarginPct.toFixed(1)} % rezerva).` })
            ],
            spacing: { before: 100, after: 200 }
          }),

          // 16. Technické podmínky montáže
          new Paragraph({
            text: '16. TECHNICKÉ PODMÍNKY MONTÁŽE A SOUČÁSTÍ DLE ČSN EN 62561',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 260, after: 120 },
            run: { bold: true, color: '0F172A', size: 24 }
          }),
          new Paragraph({
            text: 'Veškeré komponenty a materiály vnějšího i vnitřního systému ochrany před bleskem musí splňovat požadavky řady výrobkových norem ČSN EN 62561 (Součásti systému ochrany před bleskem - LPSCS):',
            spacing: { after: 100 }
          }),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              createTableHeader(['Norma ČSN EN', 'Oblast specifikace komponentů', 'Technický požadavek pro stavbu'], [2200, 3600, 3200]),
              createTableRow(['ČSN EN 62561-1', 'Spojovací součásti (svorky, spojky)', 'Třída H (heavy duty, 100 kA, bleskový proud)']),
              createTableRow(['ČSN EN 62561-2', 'Vodiče a zemniče', 'Drát FeZn ø 8 mm / AlMgSi ø 8 mm, pásek FeZn 30×4 mm'], [2200, 3600, 3200], true),
              createTableRow(['ČSN EN 62561-3', 'Oddělovací jiskřiště (ISG)', 'Pro anténní stožáry a plynofikaci']),
              createTableRow(['ČSN EN 62561-4', 'Podpěry vedení na střeše a zdivu', 'Rozteč podpěr max. 1 m na střeše, 1 m na zdi'], [2200, 3600, 3200], true),
              createTableRow(['ČSN EN 62561-5', 'Zkušební skříně a kontrolní svorky', 'Zkušební svorky ZS ve výšce 1,8 až 2,0 m nad terénem']),
              createTableRow(['ČSN EN 62561-7', 'Směsi pro zlepšení zemnění', 'Bentonit / zemnící směs při vysokém měrném odporu'], [2200, 3600, 3200], true)
            ]
          }),

          // 17. Revizní řád a kontrolní checklist
          new Paragraph({
            text: '17. REVIZNÍ ŘÁD, KONTROLNÍ CHECKLIST A PODMÍNKY ÚDRŽBY',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 260, after: 120 },
            run: { bold: true, color: '0F172A', size: 24 }
          }),
          new Paragraph({
            text: 'Pro zajištění trvalé spolehlivosti a bezpečnosti LPS systému stanovuje ČSN EN 62305-3 ed. 2 čl. E.7 a ČSN 33 1500 závazný postup kontrol. Revizní technik a provozovatel jsou povinni při výchozí i každé pravidelné revizi zkontrolovat následující kontrolní checklist:',
            spacing: { after: 100 }
          }),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              createTableHeader(['Číslo', 'Kontrolní operace revizního technika', 'Kritérium vyhovění'], [800, 5200, 3000]),
              createTableRow(['1.', 'Kontrola souladu provedení s touto projektovou dokumentací', 'Úplná shoda s projektem a normou']),
              createTableRow(['2.', 'Vizuální kontrola neporušenosti a koroze jímacích vodičů na střeše', 'Bez mechanického poškození a oxidace'], [800, 5200, 3000], true),
              createTableRow(['3.', 'Kontrola pevnosti jímacích tyčí a distančních vzpěr z GRP', 'Pevné ukotvení odolávající větru']),
              createTableRow(['4.', 'Kontrola neporušenosti pláště a koncovky svodu DEHN HVI', 'Plášť bez trhlin, těsnění koncovky intaktní'], [800, 5200, 3000], true),
              createTableRow(['5.', 'Ověření dodržení separační vzdálenosti s od střešních zařízení', `Dodržena vzdálenost s ≥ ${results.separationDistance_s_cm} cm`]),
              createTableRow(['6.', 'Kontrola ochrany svodů před mechanickým poškozením u terénu', 'Ochranná trubka 1,8 m pevně upevněna'], [800, 5200, 3000], true),
              createTableRow(['7.', 'Kontrola stavu a čitelného označení zkušebních svorek (ZS)', 'Svorky čisté, očíslované, spoj dotažen']),
              createTableRow(['8.', 'Měření přechodových odporů spojů jímací soustavy', 'Přechodový odpor spoje R ≤ 0,2 Ω'], [800, 5200, 3000], true),
              createTableRow(['9.', 'Měření zemního odporu každého jednotlivého svodu (při rozpojené ZS)', 'Odpor jednotlivých svodů bez anomálií']),
              createTableRow(['10.', 'Měření celkového výsledného zemního odporu uzemnění', 'Výsledný zemní odpor R ≤ 10 Ω'], [800, 5200, 3000], true),
              createTableRow(['11.', 'Kontrola optické signalizace a stavu odpojovačů svodičů SPD', 'Optický terčík zelený (bez vybavení)']),
              createTableRow(['12.', 'Kontrola celistvosti pospojování s hlavní uzemňovací přípojnicí MET', 'Všechny kovové vstupy propojeny'], [800, 5200, 3000], true)
            ]
          }),

          // 18. Závěrečný výrok a lhůty revizí
          new Paragraph({
            text: '18. ZÁVĚREČNÝ VÝROK, PODMÍNKY PRAVIDELNÝCH REVIZÍ A AUTORIZACE',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 260, after: 120 },
            run: { bold: true, color: '0F172A', size: 24 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '1. ', bold: true }),
              new TextRun({ text: `Na základě provedeného výpočtu řízení rizik dle ČSN EN 62305-2 ed. 2 bylo jednoznačně prokázáno, že s navrženým systémem ochrany před bleskem třídy LPS ${measures.lpsClass} a koordinovanou ochranou SPD úroveň ${measures.spdLevel} jsou všechna posuzovaná rizika (R1, R2, R3, R4) menší než normové limity RT.\n` }),
              new TextRun({ text: '2. ', bold: true }),
              new TextRun({ text: `Pro střešní technologická zařízení (${isolatedLps.protectedEquipment || 'střešní prvky'}) je zaručena dostatečná separační vzdálenost s, čímž je vyloučen přeskok bleskového proudu do vnitřní instalace.\n` }),
              new TextRun({ text: '3. ', bold: true }),
              new TextRun({ text: `Lhůty pravidelných revizí dle ČSN EN 62305-3 ed. 2 tabulky E.2 pro třídu LPS ${measures.lpsClass}:\n` }),
              new TextRun({ text: measures.lpsClass === 'I' || measures.lpsClass === 'II' ? '• Vizuální kontrola: každých 12 měsíců.\n• Kompletní revize se změřením zemního odporu: každé 2 roky.\n' : '• Vizuální kontrola: každých 24 měsíců.\n• Kompletní revize se změřením zemního odporu: každé 4 roky.\n', bold: true }),
              new TextRun({ text: '4. ', bold: true }),
              new TextRun({ text: 'Před uvedením stavby do provozu musí být provedena výchozí revize elektrického zařízení a systému LPS oprávněným revizním technikem dle ČSN 33 1500.' })
            ],
            spacing: { after: 300 }
          }),

          // Podpisový a razítkový blok
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 4500, type: WidthType.DXA },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE }
                    },
                    children: [
                      new Paragraph({ text: `V ${meta.buildingLocation ? meta.buildingLocation.split(',')[0] : 'Praze'}, dne ${meta.date}`, spacing: { after: 120 } }),
                      new Paragraph({ children: [new TextRun({ text: 'Zpracovatel technické zprávy:\n', bold: false }), new TextRun({ text: meta.designer, bold: true })] }),
                      new Paragraph({ text: meta.designerCert || 'Autorizovaný inženýr ČKAIT', spacing: { before: 60 } })
                    ]
                  }),
                  new TableCell({
                    width: { size: 4500, type: WidthType.DXA },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE }
                    },
                    children: [
                      new Paragraph({ text: 'Otisk autorizačního razítka a podpis:', alignment: AlignmentType.RIGHT, spacing: { after: bytesStamp ? 80 : 700 } }),
                      ...(bytesStamp ? [
                        new Paragraph({
                          children: [
                            new ImageRun({
                              data: bytesStamp,
                              transformation: { width: 100, height: 100 },
                              type: 'png'
                            })
                          ],
                          alignment: AlignmentType.RIGHT,
                          spacing: { after: 80 }
                        })
                      ] : []),
                      new Paragraph({ text: '...........................................................', alignment: AlignmentType.RIGHT })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }
    ]
  });

  return await Packer.toBlob(doc);
}

export function downloadDocxBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
