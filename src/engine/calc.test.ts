// Regression suite locked to the real pricing workbooks.
//
// Every expected value below was read directly out of the Excel files
// (formulas + cached values), NOT computed by this engine. If the engine
// drifts from the spreadsheets, these tests fail.
//
// Sources:
//   alro.xlsx              — "YUEN CHANG TO ALRO"   (CIF LA, container)
//   sammyla50pct.xlsx      — "YUEN CHANG TO SAMUEL" (CIF LA, container)
//   alro__camden_bulk.xlsx — "YEOU YIH TO ALRO"     (FOB, break bulk, 3 sizes)
//
// Tolerance note: the sheets round a couple of intermediate cells
// (adjusted FOB and credit insurance to the cent); the engine keeps full
// precision. Differences are < $0.01/MT, so $/MT is asserted to the cent
// and $/lb to 5 decimal places.

import { describe, it, expect } from 'vitest';
import { calculateDeal, calculateProduct } from './calc';
import type { Deal, DealProduct } from './types';

let idCounter = 0;
const pid = () => `p${++idCounter}`;

function baseDeal(overrides: Partial<Deal>): Deal {
  return {
    id: 'test',
    name: 'test',
    supplier: '',
    customer: '',
    originPort: '',
    destinationPort: '',
    incoterm: 'FOB',
    shippingType: 'container',
    freightPerContainer: 0,
    freightPerMT: 0,
    freightAdderPerMT: 0,
    rates: { sec232Pct: 50, hmfPct: 0.335, mpfPct: 0, marineInsPct: 0, creditInsPct: 0.11 },
    finance: {
      basis: 'contract',
      lcPreCash: { enabled: true, ratePct: 3.75, days: 60 },
      lcSailing: { enabled: true, ratePct: 8.5, days: 90 },
      tariff: { enabled: true, ratePct: 8.5, days: 45, financedPct: 100 },
    },
    handling: {
      drayagePerContainer: 0,
      containerCapacityMT: 19,
      stevedorePerMT: 0,
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
    products: [],
    notes: '',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

const product = (overrides: Partial<DealProduct>): DealProduct => ({
  id: pid(),
  description: '',
  contractPrice: 0,
  weightGainPct: 0,
  salePricePerLb: null,
  quantityLbs: null,
  ...overrides,
});

describe('alro.xlsx — YUEN CHANG TO ALRO (CIF LA, container)', () => {
  // Sheet inputs: CIF LA $2,260, LA freight $110, 232 50%, HMF 0.335%,
  // LC pre-cash 3.75%×60d, LC sailing 8.5%×90d, tariff fin 8.5%×45d,
  // C.I. 0.11%, drayage $900/20ft ÷ 19, Chiu 1% of CIF, markup 4%.
  const deal = baseDeal({
    incoterm: 'CIF',
    freightPerMT: 110,
    handling: { ...baseDeal({}).handling, drayagePerContainer: 900 },
    markupPct: 4,
    products: [product({ contractPrice: 2260 })],
  });

  const r = calculateDeal(deal).products[0];

  it('backs out FOB = CIF − freight (H7 = 2150)', () => {
    expect(r.fobValue).toBe(2150);
  });

  it('matches every cost line', () => {
    const line = (key: string) => r.lines.find(l => l.key === key)?.perMT;
    expect(line('sec232')).toBeCloseTo(1075, 6);            // J7
    expect(line('hmf')).toBeCloseTo(7.2025, 6);             // K7
    expect(line('lcPreCash')).toBeCloseTo(14.125, 6);       // L7
    expect(line('lcSailing')).toBeCloseTo(48.025, 4);       // N7
    expect(line('tariffFin')).toBeCloseTo(11.421875, 6);    // P7 = 2150×50%×8.5%×45/360
    expect(line('creditIns')).toBeCloseTo(2.486, 6);        // R7
    expect(line('drayage')).toBeCloseTo(47.36842105, 6);    // S7 = 900/19
    expect(line('commission')).toBeCloseTo(22.6, 6);        // U7 = 1% × CIF (not FOB)
    expect(line('marineIns')).toBeUndefined();              // no M.I. line on CIF deals
    expect(line('mpf')).toBeUndefined();
  });

  it('matches landed cost (W7 / X7)', () => {
    expect(r.landedPerMT).toBeCloseTo(3488.228796, 2);
    expect(r.landedPerLb).toBeCloseTo(1.582235848, 5);
  });

  it('matches sale price and GP% (X9 / D7): markup on cost, rounded to 3dp', () => {
    expect(r.salePerLb).toBe(1.646);
    expect(r.gpPct).toBeCloseTo(3.873885, 3);
  });
});

describe('sammyla50pct.xlsx — YUEN CHANG TO SAMUEL (CIF LA, container)', () => {
  // Same structure; CIF $2,000, freight $90, sailing 160d, tariff fin 130d,
  // drayage $1,350, markup 10%.
  const base = baseDeal({});
  const deal = baseDeal({
    incoterm: 'CIF',
    freightPerMT: 90,
    finance: {
      ...base.finance,
      lcSailing: { enabled: true, ratePct: 8.5, days: 160 },
      tariff: { enabled: true, ratePct: 8.5, days: 130, financedPct: 100 },
    },
    handling: { ...base.handling, drayagePerContainer: 1350 },
    markupPct: 10,
    products: [product({ contractPrice: 2000 })],
  });

  const r = calculateDeal(deal).products[0];

  it('matches cost lines', () => {
    const line = (key: string) => r.lines.find(l => l.key === key)?.perMT;
    expect(r.fobValue).toBe(1910);
    expect(line('sec232')).toBeCloseTo(955, 6);
    expect(line('hmf')).toBeCloseTo(6.3985, 6);
    expect(line('lcPreCash')).toBeCloseTo(12.5, 6);
    expect(line('lcSailing')).toBeCloseTo(75.5555556, 4);
    expect(line('tariffFin')).toBeCloseTo(29.3131944, 4);
    expect(line('creditIns')).toBeCloseTo(2.2, 6);
    expect(line('drayage')).toBeCloseTo(71.0526316, 5);
    expect(line('commission')).toBeCloseTo(20, 6);
  });

  it('matches landed cost, sale, GP%', () => {
    expect(r.landedPerMT).toBeCloseTo(3172.019882, 2);
    expect(r.landedPerLb).toBeCloseTo(1.438805727, 5);
    expect(r.salePerLb).toBe(1.583);
    expect(r.gpPct).toBeCloseTo(9.108924, 3);
  });
});

describe('alro__camden_bulk.xlsx — YEOU YIH TO ALRO (FOB, break bulk, multi-size)', () => {
  // FOB Kaohsiung, break bulk $135/MT freight, stevedoring $35/MT,
  // M.I. 0.24% on FOB, C.I. 0.11% on FOB+freight, LC 3.75%×60d,
  // finance 8.5%×90d, tariff fin 8.5%×45d, Chiu 1% of FOB.
  const base = baseDeal({});
  const deal = baseDeal({
    incoterm: 'FOB',
    shippingType: 'breakBulk',
    freightPerMT: 135,
    rates: { sec232Pct: 50, hmfPct: 0.335, mpfPct: 0, marineInsPct: 0.24, creditInsPct: 0.11 },
    handling: { ...base.handling, stevedorePerMT: 35 },
    products: [
      product({ description: '1/2"', contractPrice: 2260, weightGainPct: 5.02, salePricePerLb: 1.745, quantityLbs: 70000 }),
      product({ description: '1"', contractPrice: 2430, weightGainPct: 3.3, salePricePerLb: 1.895, quantityLbs: 10000 }),
    ],
  });

  const result = calculateDeal(deal);
  const [half, one] = result.products;

  it('1/2" column: duties on CONTRACT FOB, weight gain on material only', () => {
    const line = (key: string) => half.lines.find(l => l.key === key)?.perMT;
    expect(line('material')).toBeCloseTo(2146.548, 2);      // E6 ≈ 2260×(1−5.02%)
    expect(line('freight')).toBeCloseTo(135, 6);            // E8
    expect(line('sec232')).toBeCloseTo(1130, 6);            // E10 = 2260×50% — NOT on adjusted FOB
    expect(line('hmf')).toBeCloseTo(7.571, 6);              // E11
    expect(line('marineIns')).toBeCloseTo(5.424, 6);        // E12 = 0.24% × FOB
    expect(line('creditIns')).toBeCloseTo(2.6345, 2);       // E13 = 0.11% × (FOB+freight)
    expect(line('lcSailing')).toBeCloseTo(48.025, 6);       // E14 (finance on contract FOB)
    expect(line('lcPreCash')).toBeCloseTo(14.125, 6);       // E15
    expect(line('tariffFin')).toBeCloseTo(12.00625, 6);     // E16 = 8.5%×50%×2260×45/360
    expect(line('stevedore')).toBeCloseTo(35, 6);           // E17
    expect(line('commission')).toBeCloseTo(22.6, 6);        // E18
  });

  it('1/2" column: landed cost and margin (E20/E22/E27/E29/E33)', () => {
    expect(half.landedPerMT).toBeCloseTo(3558.93125, 2);
    expect(half.landedPerLb).toBeCloseTo(1.614306, 5);
    expect(half.marginPerLb).toBeCloseTo(0.130694, 5);
    expect(half.gpPct).toBeCloseTo(7.489629, 3);
    expect(half.marginDollars).toBeCloseTo(9148.58, 0); // ±$0.50 (sheet cent-rounding × 70,000 lbs)
  });

  it('1" column: landed cost and margin (H20/H22/H27/H29/H33)', () => {
    expect(one.landedPerMT).toBeCloseTo(3855.636875, 2);
    expect(one.landedPerLb).toBeCloseTo(1.748890, 5);
    expect(one.marginPerLb).toBeCloseTo(0.146110, 5);
    expect(one.gpPct).toBeCloseTo(7.710314, 4);
    expect(one.marginDollars).toBeCloseTo(1461.10, 1);
  });

  it('5/8" column reproduces the sheet EXACTLY as-built (freight $130/19 quirk)', () => {
    // The workbook's 5/8" column (F) uses =B8/19 = $6.84/MT freight while the
    // other columns hardcode $135/MT — almost certainly a leftover formula.
    // Given the same input, the engine matches the sheet exactly (F20/F22),
    // proving the difference is the input, not the math.
    const quirk = baseDeal({
      incoterm: 'FOB',
      shippingType: 'breakBulk',
      freightPerMT: 130 / 19,
      rates: deal.rates,
      handling: deal.handling,
      products: [product({ description: '5/8"', contractPrice: 2410, weightGainPct: 3.91, salePricePerLb: 1.895 })],
    });
    const f = calculateDeal(quirk).products[0];
    expect(f.landedPerMT).toBeCloseTo(3682.30773, 2);
    expect(f.landedPerLb).toBeCloseTo(1.670269, 5);
  });

  it('rolls up total margin dollars across sizes', () => {
    // E35 = 10609.69 (E + H columns; F has no quantity). The sheet rounds
    // adjusted FOB / credit insurance to the cent; over 80,000 lbs that
    // rounding is worth ~$0.09, hence the ±$0.50 tolerance.
    expect(result.totalMarginDollars).toBeCloseTo(10609.69, 0);
    expect(result.hasQuantities).toBe(true);
  });
});

describe('engine invariants', () => {
  it('tariff finance scales with financed %', () => {
    const deal = baseDeal({ products: [product({ contractPrice: 2000 })] });
    const full = calculateProduct(deal, deal.products[0]);
    const halfDeal = {
      ...deal,
      finance: { ...deal.finance, tariff: { ...deal.finance.tariff, financedPct: 50 } },
    };
    const half = calculateProduct(halfDeal, halfDeal.products[0]);
    const tf = (r: typeof full) => r.lines.find(l => l.key === 'tariffFin')!.perMT;
    expect(tf(half)).toBeCloseTo(tf(full) / 2, 8);
  });

  it('CIF freight adder raises contract value but not FOB', () => {
    // alro.xlsx Baltimore adder: CIF = C10 + adder, FOB = C10 − freight
    const deal = baseDeal({
      incoterm: 'CIF',
      freightPerMT: 110,
      freightAdderPerMT: 50,
      products: [product({ contractPrice: 2260 })],
    });
    const r = calculateDeal(deal).products[0];
    expect(r.contractValue).toBe(2310);
    expect(r.fobValue).toBe(2150);
  });

  it('manual sale price wins over deal markup', () => {
    const deal = baseDeal({
      markupPct: 10,
      freightPerContainer: 2800,
      products: [product({ contractPrice: 2000, salePricePerLb: 1.5 })],
    });
    const r = calculateDeal(deal).products[0];
    expect(r.salePerLb).toBe(1.5);
    expect(r.saleSource).toBe('manual');
  });

  it('every cost line perMT sums to landedPerMT', () => {
    const deal = baseDeal({
      freightPerContainer: 2800,
      handling: { ...baseDeal({}).handling, drayagePerContainer: 1350, storagePerMTMonth: 5, storageMonths: 1, truckingPerFTL: 500 },
      rates: { sec232Pct: 50, hmfPct: 0.335, mpfPct: 0.125, marineInsPct: 0.24, creditInsPct: 0.11 },
      products: [product({ contractPrice: 5260, weightGainPct: 3 })],
    });
    const r = calculateDeal(deal).products[0];
    const sum = r.lines.reduce((s, l) => s + l.perMT, 0);
    expect(r.landedPerMT).toBeCloseTo(sum, 10);
  });
});
