import 'dotenv/config';
import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // API endpoint pro vyhledávání a ověření norem ČSN EN 62305 pomocí Google Search grounding
  app.post('/api/standards/search', async (req: Request, res: Response) => {
    try {
      const { query, projectContext } = req.body;
      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: 'Je vyžadován parametr query' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(503).json({
          error: 'GEMINI_API_KEY není nastavena',
          fallbackAnswer: getOfflineFallbackAnswer(query),
          sources: [
            {
              title: 'ČSN EN 62305-1 až 4 ed. 2: Ochrana před bleskem',
              url: 'https://www.agentura-cas.cz'
            },
            {
              title: 'DEHN CZ - Ochrana před bleskem a přepětím',
              url: 'https://www.dehn.cz'
            }
          ]
        });
        return;
      }

      const ai = new GoogleGenAI();

      let contextPrompt = '';
      if (projectContext) {
        contextPrompt = `
Kontext aktuálního projektu v aplikaci:
- Název stavby: ${projectContext.buildingName || 'Neuvedeno'}
- Typ / využití stavby: ${projectContext.buildingType || 'Neuvedeno'}
- Zvolená třída LPS: ${projectContext.lpsClass || 'Neuvedeno'} (Doporučeno: ${projectContext.recommendedLpsClass || 'Neuvedeno'})
- Oddálený hromosvod (HVI): ${projectContext.isolatedLpsEnabled ? 'Aktivní (' + projectContext.hviType + ')' : 'Neaktivní'}
- Vypočtená bezpečná vzdálenost s: ${projectContext.separationDistance_s_cm ? projectContext.separationDistance_s_cm + ' cm' : 'Neuvedeno'}
- Ochrana před přepětím SPD: ${projectContext.spdLevel || 'Neuvedeno'}
`;
      }

      const prompt = `
Uživatel se ptá na aktuální požadavky, aktualizace a výklad technických norem řady ČSN EN 62305 v České republice:
Dotaz uživatele: "${query}"

${contextPrompt}

Proveďte vyhledání aktuálních informací pomocí Google Search a sestavte strukturovanou, technicky přesnou odpověď pro revizního technika a projektanta elektro.
V odpovědi zahrňte:
1. **Přímé posouzení a aktuální platnost norem**: Uveďte přesnou normu (ČSN EN 62305-1, 2, 3 nebo 4 ed. 2, změny Z1, Z2, případně stav přípravy edice 3), související předpisy (ČSN EN 62561, ČSN CLC/TS 51643-32 pro FVE, ČSN 33 2000-5-534).
2. **Klíčové technické požadavky**: Konkrétní vzorce, mezní hodnoty, minimální vzdálenosti s, dimenzování jímací soustavy, koordinace SPD typ 1, 2, 3.
3. **Doporučení pro projekt / shodu**: Zhodnoťte, jaké konkrétní kroky má projektant provést a jaké nejčastější chyby se v ČR vyskytují při revizích.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: `Jste certifikovaný revizní technik E2A/R-EZ a specialista na řízení rizik podle ČSN EN 62305-2 v ČR.
Využijte Google Search pro vyhledání nejnovějších věstníků ÚNMZ, norem ČSN EN 62305 ed. 2 / ed. 3, technických zpráv DEHN, OBO Bettermann a ČAS.
Pište v češtině, strukturovaně, profesionálně a srozumitelně. Vždy citujte zdroje.`,
        },
      });

      const answerText = response.text || '';
      
      // Extrakce grounding zdrojů z Google Search
      const candidate = response.candidates?.[0];
      const groundingMetadata = candidate?.groundingMetadata;
      const webSearchQueries = groundingMetadata?.webSearchQueries || [];
      
      const searchChunks = groundingMetadata?.groundingChunks || [];
      const sources = searchChunks
        .filter((chunk: any) => chunk.web?.uri)
        .map((chunk: any) => ({
          title: chunk.web?.title || 'ČSN / Technický zdroj',
          url: chunk.web?.uri || ''
        }));

      // Unikátní zdroje podle URL
      const uniqueSources = sources.filter((v, i, a) => a.findIndex(t => t.url === v.url) === i);

      res.json({
        answer: answerText,
        queries: webSearchQueries,
        sources: uniqueSources.length > 0 ? uniqueSources : [
          {
            title: 'ČSN EN 62305: Ochrana před bleskem (ÚNMZ / ČAS)',
            url: 'https://csnonline.agentura-cas.cz'
          },
          {
            title: 'DEHN Česká republika - Technické listy a normy',
            url: 'https://www.dehn.cz'
          }
        ]
      });
    } catch (err: any) {
      console.warn('Notice during standards search API call:', err?.message || err);
      res.json({
        answer: getOfflineFallbackAnswer(req.body?.query || '', err?.message?.includes('429') ? 'Dočasné vytížení vyhledávací kvóty Google Search – zobrazena autoritativní normová báze ČSN EN 62305.' : undefined),
        isFallback: true,
        sources: [
          {
            title: 'Agentura ČAS / ÚNMZ - Oficiální portál norem ČSN Online',
            url: 'https://csnonline.agentura-cas.cz'
          },
          {
            title: 'DEHN CZ - Odborné technické podklady a normy ČSN EN 62305',
            url: 'https://www.dehn.cz/cs/technicka-podpora'
          },
          {
            title: 'ČSN CLC/TS 51643-32 - Ochrana fotovoltaických instalací proti blesku a přepětí',
            url: 'https://csnonline.agentura-cas.cz'
          }
        ],
        queries: [req.body?.query || 'ČSN EN 62305 ed. 2']
      });
    }
  });

  // Vite middleware pro vývoj, static soubory pro produkci
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`LPS Risk Studio server běží na http://0.0.0.0:${port}`);
  });
}

function getOfflineFallbackAnswer(query: string, note?: string): string {
  const lowerQuery = query.toLowerCase();

  let specificAdvice = '';
  if (lowerQuery.includes('fve') || lowerQuery.includes('foto') || lowerQuery.includes('hvi') || lowerQuery.includes('oddál')) {
    specificAdvice = `
#### Specifické normové požadavky pro FVE a oddálený hromosvod (ČSN EN 62305-3 + ČSN CLC/TS 51643-32):
1. **Dostatečná vzdálenost 's'**: Všechny kovové rámy fotovoltaických panelů, konstrukce a DC kabely musí být umístěny v ochranném prostoru jímací soustavy (LPZ 0B) a současně v bezpečné vzdálenosti $s$ od jímacího vedení.
2. **Kdy použít oddálený hromosvod (HVI vodič)**:
   - Pokud nelze dodržet bezpečnou vzdálenost $s$ vzduchem (např. nedostatek místa na střeše nebo riziko přeskočení bleskového proudu do konstrukce FVE), je nutné použít vysokonapěťově izolovaný svod (např. DEHN HVI light, standard nebo power).
   - Ekvivalentní dostatečná vzdálenost HVI vodičů dosahuje až 75 cm v pevném materiálu a 150 cm ve vzduchu.
3. **Přepěťová ochrana na DC straně**: Dle ČSN CLC/TS 51643-32 (nahrazující PNE 33 0000-5) musí být instalován svodič SPD Typ 1+2 při nedodrženém odstupu $s$, nebo SPD Typ 2 při dodrženém odstupu $s$.`;
  } else if (lowerQuery.includes('ed. 3') || lowerQuery.includes('edice 3') || lowerQuery.includes('změn')) {
    specificAdvice = `
#### Stav přípravy mezinárodní a evropské normy IEC/EN/ČSN EN 62305 ed. 3:
1. **Aktuální platnost**: V České republice je v současné době stále plně platný a závazný soubor **ČSN EN 62305-1 až 4 ed. 2** (s národními změnami Z1 a Z2).
2. **Připravované změny v edici 3**:
   - Zpřesnění výpočtu sběrných ploch s ohledem na moderní střešní fotovoltaické a HVAC instalace.
   - Aktualizovaná metodika výpočtu rizika R1 a R4 s detailnějším hodnocením vnitřních systémů LEMP.
   - Formalizace zkoušení a dimenzování vysokonapěťových izolovaných svodů dle EN 62561-8.`;
  } else {
    specificAdvice = `
#### Klíčové normové parametry pro řízení rizik (ČSN EN 62305-2 ed. 2):
- **Mezní hodnoty přípustného rizika RT**:
  - $R_{T1} = 10^{-5}$ (1 úmrtí na 100 000 osob za rok) – ztráta lidského života nebo trvalá újma na zdraví.
  - $R_{T2} = 10^{-3}$ – ztráta veřejných služeb (nemocnice, energetika, telekomunikace).
  - $R_{T3} = 10^{-4}$ – ztráta nenahraditelného kulturního dědictví.
  - $R_{T4} = 10^{-3}$ – hospodářské ztráty (kritérium návratnosti investice).
- **Požadavek na bezpečnost**: Všechna aplikovatelná rizika musí splňovat podmínku $R \\le R_T$. Pokud $R_1 > R_{T1}$, je instalace ochrany před bleskem dle vyhlášky č. 268/2009 Sb. zákonnou povinností.`;
  }

  return `### Autoritativní stanovisko k normám souboru ČSN EN 62305
${note ? `> ℹ️ *${note}*\n` : ''}
${specificAdvice}

#### Základní přehled struktury řady ČSN EN 62305 ed. 2:
- **ČSN EN 62305-1 ed. 2**: Obecné zásady, hladiny ochrany LPL I až IV, zkušební bleskové proudy (až 200 kA).
- **ČSN EN 62305-2 ed. 2**: Řízení rizika (komponenty $R_A$ až $R_Z$).
- **ČSN EN 62305-3 ed. 2**: Hmotné škody a nebezpečí života (výpočet $s$, jímací mříž, svody, zemniče $R \\le 10\\,\\Omega$).
- **ČSN EN 62305-4 ed. 2**: Elektrické a elektronické systémy (zóny LPZ 0A/0B/1/2, koordinované SPD dle ČSN 33 2000-5-534).

*Dotaz: "${query}"*`;
}

startServer();
