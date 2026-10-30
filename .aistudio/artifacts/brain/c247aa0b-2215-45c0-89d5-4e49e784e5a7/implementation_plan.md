# LPS Risk & Isolated System Manager (ČSN EN 62305-2 / 62305-3)

Aplikace pro profesionální elektrotechnické projektanty, auditory a revizní techniky, která realizuje kompletní výpočet rizik $R_1$ až $R_4$, automatické stanovení a optimalizaci třídy LPS (I až IV), detailní modul výpočtu dostatečné vzdálenosti $s$ a dimenzování izolovaného hromosvodu (vodiče DEHN HVI / HVI light / HVI power, distanční vzpěry GRP) s exportem plnohodnotného protokolu do Microsoft Word (.docx).

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Na základě vašich odpovědí v úvodním dotazování byl definován následující rozsah:
> - **Rozsah rizik**: Kompletní výpočet všech normových rizik $R_1$ (ztráta lidských životů), $R_2$ (veřejné služby), $R_3$ (kulturní dědictví) a $R_4$ (hospodářské škody a návratnost investice) s porovnáním s tolerovatelnými limity $R_T$.
> - **Izolovaný hromosvod**: Exaktní matematický modul pro výpočet dostatečné separační vzdálenosti $s = k_i \cdot \frac{k_c}{k_m} \cdot l$ a dimenzování vysokonapěťových vodičů HVI (standard, light, power) i distančních vzpěr pro oddálené jímací tyče a fotovoltaiku (FVE).
> - **Uživatelské rozhraní**: Interaktivní vícekrokový průvodce (Wizard) s okamžitým přepočtem v reálném čase, živým náhledem struktury dokumentu a exportem do editovatelného formátu `.docx`.

- **Potvrzeno uživatelem**: Kompletní výpočet $R_1$–$R_4$ + třída LPS I–IV.
- **Potvrzeno uživatelem**: Výpočet bezpečné vzdálenosti $s$ a dimenzování HVI vodičů.
- **Potvrzeno uživatelem**: Interaktivní průvodce s živým náhledem a DOCX exportem.
- **Doporučený výchozí standard**: ČSN EN 62305-2 ed. 2 + ČSN EN 62305-3 ed. 2 s přednastavenými šablonami (Rodinný dům s FVE, Administrativní budova, Průmyslová výrobní hala, Škola / nemocnice) pro okamžité vyzkoušení i možnost kompletní vlastní konfigurace.

---

### 1. Overview & Core Concept

- **Co aplikace dělá**: Poskytuje kompletní inženýrský nástroj inspirovaný softwarem Prozik (OEZ) a DEHNsupport Toolbox (DEHN Risk Tool). Uživatel zadá parametry stavby (rozměry, polohu, hustotu blesků $N_g$, konstrukční materiály), charakteristiky inženýrských sítí (napájení, telekomunikace), vnitřní zóny a požární riziko. Aplikace v reálném čase spočte plochy $A_d, A_m, A_i, A_l$, frekvence úderů $N$, pravděpodobnosti $P_X$, ztráty $L_X$ a jednotlivé složky rizik $R_A$ až $R_Z$.
- **Návrh opatření & Izolovaný hromosvod**: Umožňuje volit opatření (třída LPS I–IV, koordinovaná přepěťová ochrana SPD, automatická detekce a hašení požáru). Pro citlivé technologie (např. střešní fotovoltaické elektrárny FVE, chladicí jednotky, klimatizace) nabízí specializovaný kalkulátor izolovaného hromosvodu s výpočtem separační vzdálenosti $s$ podle ČSN EN 62305-3 čl. 6.3 a výběrem odpovídajícího typu HVI vodiče či izolačních vzpěr.
- **Cílová skupina**: Projektanti elektro silnoproudu, revizní technici LPS, auditoři bezpečnosti staveb, konzultanti technických zařízení budov (TZB).
- **Klíčová hodnota**: Eliminace chyb v manuálních výpočtech, úspora desítek hodin při tvorbě projektové dokumentace a okamžité vygenerování profesionální technické zprávy ve formátu Word (.docx) připravené k orazítkování autorizovaným inženýrem.

---

### 2. User Experience & Visual Design

Vizuální styl vychází z pravidel **SaaS & Enterprise Engineering Tools** (`references/3_saas_dashboard.md` a `frontend-design`):
- **Barevná paleta**:
  - Neutrální čisté plátno: Technická grafitová břidlice (`#0B1120` / `#0F172A`) v dark módu nebo exaktní inženýrská bílá s jemnými linkami (`#F8FAFC` / `#FFFFFF` a `slate-200`) v light módu.
  - Akcenty: Inženýrská modrá / safírová (`#2563EB`) pro primární akce a stav LPS, bezpečnostní jantarová (`#D97706`) pro upozornění na překročené $R > R_T$, a technická smaragdová (`#059669`) pro vyhovující stav $R \le R_T$.
- **Typografie**:
  - Nadpisy a navigace: `Plus Jakarta Sans` / `Outfit` s vysokou čitelností.
  - Tělo a popisky: `DM Sans` s čistým kontrastem.
  - Všechny vzorce, matice a čísla: `font-mono tabular-nums` (`JetBrains Mono` / systémový monospace) se zarovnáním desetinných míst.
- **Architektura obrazovky (1440px baseline)**:
  - **Horní lišta (Top Bar Contract)**: Název projektu a stav výpočtu vlevo, rychlé přepínání předvoleb / šablon a primární tlačítko `"Exportovat technickou zprávu (.docx)"` vpravo.
  - **Levý navigační panel / Průvodce**: Krok 1 (Základní údaje & Lokalita), Krok 2 (Geometrie & Konstrukce), Krok 3 (Inženýrské sítě & Přípojky), Krok 4 (Vnitřní zóny & Opatření LPS), Krok 5 (Izolovaný hromosvod & HVI), Krok 6 (Výsledná matice rizik & DOCX).
  - **Pracovní plocha (Centrální zóna)**: Formulářová pole s okamžitou validací, nápovědnými štítky s normovými referencemi (čl. normy ČSN EN 62305) a grafickým znázorněním stavby a dostatečné vzdálenosti $s$.
  - **Pravý panel živého souhrnu (Live Risk Inspector)**: Plovoucí nebo boční panel s live tachometry a porovnáním $R_1 \dots R_4$ vs. $R_T$, indikací vyhovuje/nevyhovuje a interaktivním testováním různých tříd LPS (bez nutnosti opouštět formulář).

---

### 3. Key Product Decisions & Trade-Offs

- **Generování DOCX přímo v prohlížeči (balíček `docx`)**:
  - *Zvolený přístup*: Klientské generování kompletního souboru `.docx` pomocí ověřené knihovny `docx` a stažení přes standardní Blob.
  - *Proč*: 100% spolehlivost bez nutnosti instalace Microsoft Office na serveru, nulová latence, bezpečné pro data uživatele (projektová data neopouští prohlížeč), plná podpora stylů tabulek, hlaviček, patiček, číslovaných seznamů a barevných statusových indikátorů.
- **Exaktní normová implementace vzorců ČSN EN 62305-2**:
  - *Zvolený přístup*: Modulární matematické jádro implementující přesné tabulkové koeficienty (např. $C_d$ pro polohu stavby, $r_p, r_f$ pro riziko požáru, $h_z$ pro typ osob v zóně, $P_{TA}, P_B, P_C$ pro účinnost LPS I–IV podle normových tabulek B.1 až B.8).
  - *Proč*: Shoda s auditními standardy České republiky a EU, možnost obhájit výpočet před stavebním úřadem a hasičským záchranným sborem (HZS).
- **Specializovaný modul pro Izolovaný hromosvod & HVI (DEHN standard)**:
  - *Zvolený přístup*: Integrace výpočtu $s = k_i \cdot \frac{k_c}{k_m} \cdot l$ s volbou materiálů ($k_m = 1,0$ pro vzduch, $k_m = 0,5$ pro pevné dielektrikum), volbou konfigurace svodů ($k_c = 1,0$ pro 1 svod, $0,66$ pro 2 svody, $0,44$ pro mřížovou soustavu) a automatickým porovnáním s ekvivalentní dostatečnou vzdáleností HVI vodičů ($s \le 45\text{ cm}$ pro HVI light, $s \le 75\text{ cm}$ pro HVI standard, $s \le 90\text{ cm}$ pro HVI power).
  - *Proč*: V moderní výstavbě s FVE panely, střešními VZT jednotkami a tepelnými čerpadly je klasický bleskosvod často nepoužitelný kvůli nedodržení $s$. Projektanti vyžadují přesný výpočet a specifikaci HVI pro zprávu.
- **Předpřipravené šablony objektů**:
  - *Zvolený přístup*: Uživatel může jedním kliknutím načíst typické vzory (RD s FVE, Výrobní skladová hala, Nemocnice, Škola), což umožňuje okamžité vyzkoušení i zrychlení práce.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LPS Risk & HVI Studio                           │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌─────────────────────────────────────┐   ┌───────────────────────────────────┐
│     Project State & Store           │   │    ČSN EN 62305 Calculation Core  │
│  - Building Geometry (L, W, H, Cd)  │   │  - Collection Areas (Ad, Am, Al) │
│  - Flash Density Ng & Location      │◄──┤  - Dangerous Events (Nd, Nm, Nl)  │
│  - External Lines (Power, Telecom)  │   │  - Risk Probabilities (Px)        │
│  - Internal Zones & Fire Risk       │   │  - Risk Matrices (R1, R2, R3, R4) │
│  - Selected LPS Class (I - IV, None)│   │  - Separation Distance 's' & HVI  │
│  - Isolated LPS & HVI Parameters    │   └─────────────────┬─────────────────┘
└──────────────────┬──────────────────┘                     │
                   │                                        │
                   ▼                                        ▼
┌─────────────────────────────────────┐   ┌───────────────────────────────────┐
│        Interactive UI Views         │   │     DOCX Report Generator         │
│  - Step 1: Objekt & Poloha          │   │  - Titulní list & Identifikace    │
│  - Step 2: Sítě & Vnitřní zóny      │──►│  - Vstupní data & Sběrné plochy   │
│  - Step 3: Ochranná opatření (LPS)  │   │  - Analýza rizik R1-R4 s tabulkou │
│  - Step 4: Izolovaný hromosvod & HVI│   │  - Výpočet vzdálenosti s & HVI    │
│  - Step 5: Výsledky & DOCX náhled   │   │  - Závěrečný výrok revize / razítko│
└─────────────────────────────────────┘   └───────────────────────────────────┘
```

#### Datový model projektu (`LpsProjectState`):
- `projectMeta`: název stavby, investor, projektant, číslo zakázky, datum, katastrální území.
- `building`: délka $L$, šířka $W$, výška $H$, koeficient polohy $C_d$ (samostatná, obklopená stromy, na kopci), hustota blesků $N_g$ (např. 2.0 až 4.5 úderů/km²/rok v ČR).
- `lines`: napájecí síť (podzemní kabel / vrchní vedení, stínění, trafo), telekomunikační síť.
- `zones`: typ povrchu podlahy, požární zatížení, detekce a hašení požáru, přítomnost osob ($h_z$), panika, ekonomické hodnoty.
- `measures`: navržená třída LPS (None, IV, III, II, I), úroveň SPD (koordinovaná LPL I–IV), protipožární opatření.
- `isolatedLps`: výška jímací tyče, délka svodu $l$ k uzemnění, počet paralelních svodů (pro $k_c$), izolační materiál ($k_m$ vzduch/pevný), navržená technologie HVI / distanční vzpěry, vyhodnocení $s_{vypočteno}$ vs. $s_{dovoleno}$.
- `results`: vypočtená rizika $R_1, R_2, R_3, R_4$, jednotlivé složky ($R_A \dots R_Z$), tolerovatelná rizika $R_T$, výsledné doporučení třídy LPS.

#### Plánované knihovny:
- `docx`: Tvorba profesionálního formátu `.docx` přímo v prohlížeči.
- `lucide-react`: Precizní technické ikony (blesk, budova, štít, kabeláž, pravítko, export).
- `file-saver` (nebo bezpečný inline Blob download): Stažení vygenerovaného dokumentu bez externích závislostí.
