import type { Deal, DealProduct, GainBasis, GlobalDefaults, WeightGainRow } from '../engine/types';

// ---------------------------------------------------------------------------
// Weight gains by thickness — 304/L and 316/L plate.
// "% gain" = theoretical (sell) vs mill (buy) weight; differs by mill origin.
// Values from the current pricing sheet (TW and JP/KR columns).
// ---------------------------------------------------------------------------
export const WEIGHT_GAIN_TABLE: WeightGainRow[] = [
  { thickness: '3/16"', sellWeight: 8.579, buyWeightTW: 7.74, gainPctTW: 10.91, buyWeightJP: 7.87, gainPctJP: 8.24 },
  { thickness: '1/4"', sellWeight: 11.16, buyWeightTW: 10.31, gainPctTW: 8.21, buyWeightJP: 10.5, gainPctJP: 5.95 },
  { thickness: '5/16"', sellWeight: 13.75, buyWeightTW: 12.89, gainPctTW: 6.66, buyWeightJP: 13.12, gainPctJP: 4.58 },
  { thickness: '3/8"', sellWeight: 16.5, buyWeightTW: 15.47, gainPctTW: 6.66, buyWeightJP: 15.74, gainPctJP: 4.58 },
  { thickness: '1/2"', sellWeight: 21.66, buyWeightTW: 20.63, gainPctTW: 5.01, buyWeightJP: 20.99, gainPctJP: 3.09 },
  { thickness: '5/8"', sellWeight: 26.83, buyWeightTW: 25.78, gainPctTW: 4.06, buyWeightJP: 26.24, gainPctJP: 2.2 },
  { thickness: '3/4"', sellWeight: 32.12, buyWeightTW: 30.94, gainPctTW: 3.81, buyWeightJP: 31.49, gainPctJP: 1.97 },
  { thickness: '7/8"', sellWeight: 37.29, buyWeightTW: 36.1, gainPctTW: 3.3, buyWeightJP: 36.73, gainPctJP: 1.49 },
  { thickness: '1"', sellWeight: 42.67, buyWeightTW: 41.25, gainPctTW: 3.43, buyWeightJP: 41.98, gainPctJP: 1.61 },
  { thickness: '1 1/8"', sellWeight: 47.83, buyWeightTW: 46.41, gainPctTW: 3.06, buyWeightJP: 47.23, gainPctJP: 1.25 },
  { thickness: '1 1/4"', sellWeight: 53, buyWeightTW: 51.57, gainPctTW: 2.78, buyWeightJP: 52.48, gainPctJP: 0.98 },
  { thickness: '1 3/8"', sellWeight: 58.17, buyWeightTW: 56.72, gainPctTW: 2.55, buyWeightJP: 57.73, gainPctJP: 0.76 },
  { thickness: '1 1/2"', sellWeight: 63.34, buyWeightTW: 61.88, gainPctTW: 2.36, buyWeightJP: 62.97, gainPctJP: 0.58 },
  { thickness: '1 3/4"', sellWeight: 73.67, buyWeightTW: 72.2, gainPctTW: 2.04, buyWeightJP: 73.47, gainPctJP: 0.27 },
  { thickness: '2"', sellWeight: 84.01, buyWeightTW: 82.51, gainPctTW: 1.82, buyWeightJP: 83.97, gainPctJP: 0.05 },
  { thickness: '2 1/4"', sellWeight: 94.7, buyWeightTW: 92.82, gainPctTW: 2.02, buyWeightJP: 94.46, gainPctJP: 0.25 },
  { thickness: '2 1/2"', sellWeight: 105.1, buyWeightTW: 103.14, gainPctTW: 1.9, buyWeightJP: 104.96, gainPctJP: 0.14 },
  { thickness: '2 3/4"', sellWeight: 115.4, buyWeightTW: 113.45, gainPctTW: 1.72, buyWeightJP: 115.45, gainPctJP: -0.05 },
  { thickness: '3"', sellWeight: 126.3, buyWeightTW: 123.76, gainPctTW: 2.05, buyWeightJP: 125.95, gainPctJP: 0.28 },
  { thickness: '3 1/4"', sellWeight: 136.6, buyWeightTW: 134.08, gainPctTW: 1.88, buyWeightJP: 136.44, gainPctJP: 0.11 },
  { thickness: '3 1/2"', sellWeight: 147, buyWeightTW: 144.39, gainPctTW: 1.81, buyWeightJP: 146.94, gainPctJP: 0.04 },
  { thickness: '3 3/4"', sellWeight: 157, buyWeightTW: 154.7, gainPctTW: 1.48, buyWeightJP: 157.44, gainPctJP: -0.28 },
  { thickness: '4"', sellWeight: 167, buyWeightTW: 165.02, gainPctTW: 1.2, buyWeightJP: 167.93, gainPctJP: -0.56 },
];

export const THICKNESS_OPTIONS = WEIGHT_GAIN_TABLE.map(r => r.thickness);

/** Weight gain % for a thickness, using the mill origin's column. */
export function gainForThickness(thickness: string, basis: GainBasis): number | null {
  const row = WEIGHT_GAIN_TABLE.find(r => r.thickness === thickness);
  if (!row) return null;
  return basis === 'JPKR' ? row.gainPctJP : row.gainPctTW;
}

/** Which gain column applies to a deal's origin port (Taiwan unless known otherwise). */
export function gainBasisForPort(port: string, defaults: GlobalDefaults): GainBasis {
  return defaults.originPorts.find(p => p.name === port)?.gainBasis ?? 'TW';
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
  originPorts: [
    { name: 'Kaohsiung', gainBasis: 'TW' },
    { name: 'Taipei', gainBasis: 'TW' },
    { name: 'Tokyo', gainBasis: 'JPKR' },
    { name: 'Busan', gainBasis: 'JPKR' },
    { name: 'Mumbai', gainBasis: 'TW' },
  ],
  grades: ['304/L', '316/L', '304/L & 316/L'],
  commissionAgents: [
    { name: 'Chiu', pct: 1 },
    { name: 'Tradehansa', pct: 0.5 },
    { name: 'None', pct: 0 },
  ],
};

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
    products: [newProduct({ description: 'Plate', contractPrice: 2260 })],
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
    products: [newProduct({ description: 'Plate', contractPrice: 2000 })],
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
