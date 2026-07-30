import type { Deal, DealProduct, GlobalDefaults, WeightGainRow } from '../engine/types';

// ---------------------------------------------------------------------------
// Plate weight gains by thickness — 304/L and 316/L.
//
// Transcribed from the "Plate Weight Gains by Thickness" sheet. `gainPct` is
// that sheet's "% Gain TW" column, applied to every origin. Buy weights are
// kept for reference in the lookup panel; nothing calculates from them.
// ---------------------------------------------------------------------------
export const WEIGHT_GAIN_TABLE: WeightGainRow[] = [
  { thickness: '3/16"', sellWeight: 8.579, buyWeightTW: 7.74, buyWeightJP: 7.87, gainPct: 10.91 },
  { thickness: '1/4"', sellWeight: 11.16, buyWeightTW: 10.31, buyWeightJP: 10.5, gainPct: 8.21 },
  { thickness: '5/16"', sellWeight: 13.75, buyWeightTW: 12.89, buyWeightJP: 13.12, gainPct: 6.66 },
  { thickness: '3/8"', sellWeight: 16.5, buyWeightTW: 15.47, buyWeightJP: 15.74, gainPct: 6.66 },
  { thickness: '1/2"', sellWeight: 21.66, buyWeightTW: 20.63, buyWeightJP: 20.99, gainPct: 5.01 },
  { thickness: '5/8"', sellWeight: 26.83, buyWeightTW: 25.78, buyWeightJP: 26.24, gainPct: 4.06 },
  { thickness: '3/4"', sellWeight: 32.12, buyWeightTW: 30.94, buyWeightJP: 31.49, gainPct: 3.81 },
  { thickness: '7/8"', sellWeight: 37.29, buyWeightTW: 36.1, buyWeightJP: 36.73, gainPct: 3.3 },
  { thickness: '1"', sellWeight: 42.67, buyWeightTW: 41.25, buyWeightJP: 41.98, gainPct: 3.43 },
  { thickness: '1 1/8"', sellWeight: 47.83, buyWeightTW: 46.41, buyWeightJP: 47.23, gainPct: 3.06 },
  { thickness: '1 1/4"', sellWeight: 53, buyWeightTW: 51.57, buyWeightJP: 52.48, gainPct: 2.78 },
  { thickness: '1 3/8"', sellWeight: 58.17, buyWeightTW: 56.72, buyWeightJP: 57.73, gainPct: 2.55 },
  { thickness: '1 1/2"', sellWeight: 63.34, buyWeightTW: 61.88, buyWeightJP: 62.97, gainPct: 2.36 },
  { thickness: '1 3/4"', sellWeight: 73.67, buyWeightTW: 72.2, buyWeightJP: 73.47, gainPct: 2.04 },
  { thickness: '2"', sellWeight: 84.01, buyWeightTW: 82.51, buyWeightJP: 83.97, gainPct: 1.82 },
  { thickness: '2 1/4"', sellWeight: 94.7, buyWeightTW: 92.82, buyWeightJP: 94.46, gainPct: 2.02 },
  { thickness: '2 1/2"', sellWeight: 105.1, buyWeightTW: 103.14, buyWeightJP: 104.96, gainPct: 1.9 },
  { thickness: '2 3/4"', sellWeight: 115.4, buyWeightTW: 113.45, buyWeightJP: 115.45, gainPct: 1.72 },
  { thickness: '3"', sellWeight: 126.3, buyWeightTW: 123.76, buyWeightJP: 125.95, gainPct: 2.05 },
  { thickness: '3 1/4"', sellWeight: 136.6, buyWeightTW: 134.08, buyWeightJP: 136.44, gainPct: 1.88 },
  { thickness: '3 1/2"', sellWeight: 147, buyWeightTW: 144.39, buyWeightJP: 146.94, gainPct: 1.81 },
  { thickness: '3 3/4"', sellWeight: 157, buyWeightTW: 154.7, buyWeightJP: 157.44, gainPct: 1.48 },
  { thickness: '4"', sellWeight: 167, buyWeightTW: 165.018, buyWeightJP: 167.931, gainPct: 1.2 },
];

export const THICKNESS_OPTIONS = WEIGHT_GAIN_TABLE.map(r => r.thickness);

// ---------------------------------------------------------------------------
// Sheet gauges 10–26, with the standard nominal decimal thickness for
// stainless sheet shown as a reference only.
//
// No weight-gain figures here on purpose: the plate table above came from the
// pricing sheets, and there is no equivalent source for sheet. Picking a gauge
// therefore leaves weight gain alone rather than filling in a made-up number.
// ---------------------------------------------------------------------------
// Even gauges only, plus 13 — the sizes actually traded.
export const SHEET_GAUGES: { gauge: string; nominalIn: number }[] = [
  { gauge: '10 GA', nominalIn: 0.1406 },
  { gauge: '12 GA', nominalIn: 0.1094 },
  { gauge: '13 GA', nominalIn: 0.0938 },
  { gauge: '14 GA', nominalIn: 0.0781 },
  { gauge: '16 GA', nominalIn: 0.0625 },
  { gauge: '18 GA', nominalIn: 0.05 },
  { gauge: '20 GA', nominalIn: 0.0375 },
  { gauge: '22 GA', nominalIn: 0.0313 },
  { gauge: '24 GA', nominalIn: 0.025 },
  { gauge: '26 GA', nominalIn: 0.0188 },
];

export const GAUGE_OPTIONS = SHEET_GAUGES.map(g => g.gauge);

/** Size list for a deal's product form. */
export function sizeOptionsFor(form: 'plate' | 'sheet'): string[] {
  return form === 'sheet' ? GAUGE_OPTIONS : THICKNESS_OPTIONS;
}

/** Weight gain % for a plate thickness. Null for anything not in the table. */
export function gainForThickness(thickness: string): number | null {
  return WEIGHT_GAIN_TABLE.find(r => r.thickness === thickness)?.gainPct ?? null;
}

// ---------------------------------------------------------------------------
// Global defaults — seed values for new deals. Deals snapshot their own copy,
// so editing these never silently changes an existing deal.
// ---------------------------------------------------------------------------
export const GLOBAL_DEFAULTS: GlobalDefaults = {
  rates: { sec232Pct: 50, hmfPct: 0.335, mpfPct: 0.125, marineInsPct: 0.24, creditInsPct: 0.11 },
  finance: {
    basis: 'contract',
    lcPreCash: { enabled: true, ratePct: 3.5, days: 60 },
    lcSailing: { enabled: true, ratePct: 7.5, days: 90 },
    tariff: { enabled: true, ratePct: 7.5, days: 45, financedPct: 100 },
  },
  handling: {
    drayagePerContainer: 1350,
    containerCapacityMT: 19,
    stevedorePerMT: 35,
    storagePerMTMonth: 0,
    storageMonths: 0,
    truckingPerFTL: 0,
    ftlCapacityMT: 19,
    brokerFee: 0,
    brokerBasis: 'perMT',
    commissionName: 'Chiu',
    commissionPct: 1,
  },
  markupPct: 0,
  drayageByPort: {
    Baltimore: 950, 'Los Angeles': 1350, Seattle: 1500, Houston: 950,
    Oakland: 1600, Chicago: 1300, Miami: 1600, 'New York': 1400,
  },
  storageByPort: {
    Baltimore: 5.5, 'Los Angeles': 9.5, Seattle: 7.5, Houston: 5.5,
    Oakland: 5.5, Chicago: 10, Miami: 7, 'New York': 8,
  },
  destinationPorts: ['Los Angeles', 'Houston', 'Baltimore', 'Seattle', 'Oakland', 'Chicago', 'Miami', 'New York', 'Camden'],
  suppliers: ['PVST', 'Stanch', 'Yeou Yih', 'Yuen Chang', 'Wuu Jing'],
  customers: ['Alro', 'Basic Metals', 'Oneal', 'Samuel'],
  originPorts: ['Kaohsiung', 'Taipei', 'Tokyo', 'Busan', 'Mumbai'],
  grades: ['304/L', '316/L', '304/L & 316/L'],
  commissionAgents: [
    { name: 'Chiu', pct: 1 },
    { name: 'Tradehansa', pct: 0.5 },
    { name: 'None', pct: 0 },
  ],
};

// ---------------------------------------------------------------------------
// Migration — saved data is written by whichever version was live at the time,
// so anything loaded from localStorage may be missing keys this version reads.
// Everything is merged over the current defaults before it reaches the UI; a
// missing key must never be able to blank the screen.
// ---------------------------------------------------------------------------

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Keep only the numeric entries of a stored port-rate map. */
const numMap = (v: unknown): Record<string, number> =>
  isObj(v)
    ? Object.fromEntries(Object.entries(v).filter(([, n]) => typeof n === 'number')) as Record<string, number>
    : {};

export function normalizeDefaults(stored: unknown): GlobalDefaults {
  const d = isObj(stored) ? stored : {};
  const base = GLOBAL_DEFAULTS;
  const arr = <T>(v: unknown, fallback: T[]): T[] => (Array.isArray(v) ? (v as T[]) : fallback);
  const leg = (v: unknown, fallback: GlobalDefaults['finance']['lcPreCash']) => ({
    ...fallback,
    ...(isObj(v) ? v : {}),
  });
  const finance = isObj(d.finance) ? d.finance : {};

  return {
    rates: { ...base.rates, ...(isObj(d.rates) ? d.rates : {}) },
    finance: {
      basis: (finance.basis as GlobalDefaults['finance']['basis']) ?? base.finance.basis,
      lcPreCash: leg(finance.lcPreCash, base.finance.lcPreCash),
      lcSailing: leg(finance.lcSailing, base.finance.lcSailing),
      tariff: { ...base.finance.tariff, ...(isObj(finance.tariff) ? finance.tariff : {}) },
    },
    handling: { ...base.handling, ...(isObj(d.handling) ? d.handling : {}) },
    markupPct: typeof d.markupPct === 'number' ? d.markupPct : base.markupPct,
    drayageByPort: { ...base.drayageByPort, ...numMap(d.drayageByPort) },
    storageByPort: { ...base.storageByPort, ...numMap(d.storageByPort) },
    destinationPorts: arr(d.destinationPorts, base.destinationPorts),
    suppliers: arr(d.suppliers, base.suppliers),
    customers: arr(d.customers, base.customers),
    // Origin ports were once objects carrying a weight-gain column; plate now
    // uses one column for every origin, so flatten anything stored that way.
    originPorts: Array.isArray(d.originPorts)
      ? d.originPorts
          .map(p => (typeof p === 'string' ? p : isObj(p) && typeof p.name === 'string' ? p.name : null))
          .filter((p): p is string => p !== null)
      : base.originPorts,
    grades: arr(d.grades, base.grades),
    commissionAgents: arr(d.commissionAgents, base.commissionAgents),
  };
}

export function normalizeDeal(stored: unknown): Deal | null {
  if (!isObj(stored) || typeof stored.id !== 'string') return null;
  const base = newDeal(GLOBAL_DEFAULTS);
  const d = stored;
  const finance = isObj(d.finance) ? d.finance : {};
  const products = Array.isArray(d.products) ? d.products : [];

  return {
    ...base,
    ...(d as Partial<Deal>),
    rates: { ...base.rates, ...(isObj(d.rates) ? d.rates : {}) },
    finance: {
      basis: (finance.basis as Deal['finance']['basis']) ?? base.finance.basis,
      lcPreCash: { ...base.finance.lcPreCash, ...(isObj(finance.lcPreCash) ? finance.lcPreCash : {}) },
      lcSailing: { ...base.finance.lcSailing, ...(isObj(finance.lcSailing) ? finance.lcSailing : {}) },
      tariff: { ...base.finance.tariff, ...(isObj(finance.tariff) ? finance.tariff : {}) },
    },
    handling: { ...base.handling, ...(isObj(d.handling) ? d.handling : {}) },
    products: (products.length ? products : [newProduct()]).map(p => {
      const product = { ...newProduct(), ...(isObj(p) ? p : {}) };
      // Sizes come from a fixed list per form. Anything else — a free-text
      // label from an older version, or a gauge left over from a form switch —
      // is dropped so the stored value always matches what the dropdown shows.
      const form = (d.productForm as Deal['productForm']) ?? base.productForm;
      if (!sizeOptionsFor(form).includes(product.description)) product.description = '';
      return product;
    }),
  };
}

export function normalizeDeals(stored: unknown): Deal[] {
  if (!Array.isArray(stored)) return seedDeals();
  return stored.flatMap(entry => {
    const deal = normalizeDeal(entry);
    if (!deal) return [];
    if (deal.products.length <= 1) return [deal];
    // A deal prices one item. A quote saved with several sizes becomes one deal
    // per size so nothing is hidden behind a UI that only shows the first.
    return deal.products.map((product, i) => ({
      ...deal,
      id: i === 0 ? deal.id : makeId('deal'),
      name: product.description ? `${deal.name} — ${product.description}` : `${deal.name} (${i + 1})`,
      products: [product],
    }));
  });
}

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------
let seq = 0;
export function makeId(prefix = 'id'): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}-${Math.random().toString(36).slice(2, 7)}`;
}

export function newProduct(partial: Partial<DealProduct> = {}): DealProduct {
  return {
    id: makeId('prod'),
    description: '',
    contractPrice: 0,
    weightGainPct: 0,
    salePricePerLb: null,
    quantityLbs: null,
    ...partial,
  };
}

export function newDeal(defaults: GlobalDefaults, partial: Partial<Deal> = {}): Deal {
  const now = new Date().toISOString();
  return {
    id: makeId('deal'),
    name: 'New deal',
    supplier: '',
    customer: '',
    grade: '304/L',
    originPort: 'Kaohsiung',
    destinationPort: 'Los Angeles',
    productForm: 'plate',
    incoterm: 'FOB',
    shippingType: 'container',
    freightPerContainer: 2800,
    freightPerMT: 0,
    freightAdderPerMT: 0,
    rates: { ...defaults.rates },
    finance: {
      basis: defaults.finance.basis,
      lcPreCash: { ...defaults.finance.lcPreCash },
      lcSailing: { ...defaults.finance.lcSailing },
      tariff: { ...defaults.finance.tariff },
    },
    handling: { ...defaults.handling },
    markupPct: defaults.markupPct,
    products: [newProduct()],
    notes: '',
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

// ---------------------------------------------------------------------------
// Seed deals — the three real workbooks, reproduced exactly. First launch
// shows numbers the team already trusts (verified by src/engine/calc.test.ts).
// ---------------------------------------------------------------------------
export function seedDeals(): Deal[] {
  const now = new Date().toISOString();
  const base = {
    productForm: 'plate' as const,
    freightAdderPerMT: 0,
    markupPct: 0,
    notes: '',
    createdAt: now,
    updatedAt: now,
  };

  const yuenChangAlro: Deal = {
    ...base,
    id: 'seed-yuenchang-alro',
    name: 'Yuen Chang → Alro',
    supplier: 'Yuen Chang',
    customer: 'Alro',
    grade: '304/L',
    originPort: 'Kaohsiung',
    destinationPort: 'Los Angeles',
    incoterm: 'CIF',
    shippingType: 'container',
    freightPerContainer: 0,
    freightPerMT: 110,
    rates: { sec232Pct: 50, hmfPct: 0.335, mpfPct: 0, marineInsPct: 0.24, creditInsPct: 0.11 },
    finance: {
      basis: 'contract',
      lcPreCash: { enabled: true, ratePct: 3.75, days: 60 },
      lcSailing: { enabled: true, ratePct: 8.5, days: 90 },
      tariff: { enabled: true, ratePct: 8.5, days: 45, financedPct: 100 },
    },
    handling: {
      drayagePerContainer: 900, containerCapacityMT: 19, stevedorePerMT: 0,
      storagePerMTMonth: 0, storageMonths: 0, truckingPerFTL: 0, ftlCapacityMT: 19,
      brokerFee: 0, brokerBasis: 'perMT', commissionName: 'Chiu', commissionPct: 1,
    },
    markupPct: 4,
    products: [newProduct({ contractPrice: 2260 })],
    notes: 'Imported from alro.xlsx — verified against the workbook to the cent.',
  };

  const yuenChangSamuel: Deal = {
    ...base,
    id: 'seed-yuenchang-samuel',
    name: 'Yuen Chang → Samuel',
    supplier: 'Yuen Chang',
    customer: 'Samuel',
    grade: '304/L',
    originPort: 'Kaohsiung',
    destinationPort: 'Los Angeles',
    incoterm: 'CIF',
    shippingType: 'container',
    freightPerContainer: 0,
    freightPerMT: 90,
    rates: { sec232Pct: 50, hmfPct: 0.335, mpfPct: 0, marineInsPct: 0.24, creditInsPct: 0.11 },
    finance: {
      basis: 'contract',
      lcPreCash: { enabled: true, ratePct: 3.75, days: 60 },
      lcSailing: { enabled: true, ratePct: 8.5, days: 160 },
      tariff: { enabled: true, ratePct: 8.5, days: 130, financedPct: 100 },
    },
    handling: {
      drayagePerContainer: 1350, containerCapacityMT: 19, stevedorePerMT: 0,
      storagePerMTMonth: 0, storageMonths: 0, truckingPerFTL: 0, ftlCapacityMT: 19,
      brokerFee: 0, brokerBasis: 'perMT', commissionName: 'Chiu', commissionPct: 1,
    },
    markupPct: 10,
    products: [newProduct({ contractPrice: 2000 })],
    notes: 'Imported from sammyla50pct.xlsx — verified against the workbook to the cent.',
  };

  const yeouYihAlro: Deal = {
    ...base,
    id: 'seed-yeouyih-alro',
    name: 'Yeou Yih → Alro (Camden bulk)',
    supplier: 'Yeou Yih',
    customer: 'Alro',
    grade: '304/L',
    originPort: 'Kaohsiung',
    destinationPort: 'Camden',
    incoterm: 'FOB',
    shippingType: 'breakBulk',
    freightPerContainer: 0,
    freightPerMT: 135,
    rates: { sec232Pct: 50, hmfPct: 0.335, mpfPct: 0, marineInsPct: 0.24, creditInsPct: 0.11 },
    finance: {
      basis: 'contract',
      lcPreCash: { enabled: true, ratePct: 3.75, days: 60 },
      lcSailing: { enabled: true, ratePct: 8.5, days: 90 },
      tariff: { enabled: true, ratePct: 8.5, days: 45, financedPct: 100 },
    },
    handling: {
      drayagePerContainer: 0, containerCapacityMT: 19, stevedorePerMT: 35,
      storagePerMTMonth: 0, storageMonths: 0, truckingPerFTL: 0, ftlCapacityMT: 19,
      brokerFee: 0, brokerBasis: 'perMT', commissionName: 'Chiu', commissionPct: 1,
    },
    products: [
      newProduct({ description: '1/2"', contractPrice: 2260, weightGainPct: 5.02, salePricePerLb: 1.745, quantityLbs: 70000 }),
      newProduct({ description: '5/8"', contractPrice: 2410, weightGainPct: 3.91, salePricePerLb: 1.895 }),
      newProduct({ description: '1"', contractPrice: 2430, weightGainPct: 3.3, salePricePerLb: 1.895, quantityLbs: 10000 }),
    ],
    notes: 'Imported from alro__camden_bulk.xlsx. Note: the workbook’s 5/8" column used $6.84/MT freight (a leftover =130/19 formula) while the other sizes used $135/MT — this deal uses $135 for all sizes, so the 5/8" landed cost here is ~$0.058/lb higher than the sheet showed.',
  };

  return [yuenChangAlro, yuenChangSamuel, yeouYihAlro];
}
