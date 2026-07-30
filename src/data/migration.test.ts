// Saved data is written by whichever version of the app was live at the time.
// These tests pin the rule that anything loaded from storage is merged over the
// current defaults, so a missing key can never reach the UI and blank the page.

import { describe, it, expect } from 'vitest';
import {
  GAUGE_OPTIONS,
  GLOBAL_DEFAULTS,
  THICKNESS_OPTIONS,
  gainForThickness,
  normalizeDeal,
  normalizeDeals,
  normalizeDefaults,
  seedDeals,
  sizeOptionsFor,
} from './appDefaults';
import { calculateDeal } from '../engine/calc';

describe('normalizeDefaults', () => {
  it('fills in lists a previous version never saved', () => {
    // Settings written before suppliers/originPorts/grades existed.
    const legacy = structuredClone(GLOBAL_DEFAULTS) as unknown as Record<string, unknown>;
    delete legacy.suppliers;
    delete legacy.customers;
    delete legacy.originPorts;
    delete legacy.grades;
    delete legacy.commissionAgents;
    delete legacy.destinationPorts;

    const d = normalizeDefaults(legacy);
    // Every list the UI maps over must be a real array.
    for (const list of [d.suppliers, d.customers, d.originPorts, d.grades, d.commissionAgents, d.destinationPorts]) {
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThan(0);
    }
  });

  it('keeps the user’s own edits', () => {
    const d = normalizeDefaults({
      suppliers: ['Only Mine'],
      rates: { sec232Pct: 25 },
      drayageByPort: { Houston: 1234 },
    });
    expect(d.suppliers).toEqual(['Only Mine']);
    expect(d.rates.sec232Pct).toBe(25);
    expect(d.rates.hmfPct).toBe(GLOBAL_DEFAULTS.rates.hmfPct); // untouched key filled in
    expect(d.drayageByPort.Houston).toBe(1234);
    expect(d.drayageByPort['Los Angeles']).toBe(GLOBAL_DEFAULTS.drayageByPort['Los Angeles']);
  });

  it('flattens origin ports saved as objects', () => {
    // They once carried a weight-gain column; plate now uses one column for
    // every origin, so stored objects must come back as plain names.
    const d = normalizeDefaults({
      originPorts: [{ name: 'Kaohsiung', gainBasis: 'TW' }, { name: 'Busan', gainBasis: 'JPKR' }, 'Tokyo'],
    });
    expect(d.originPorts).toEqual(['Kaohsiung', 'Busan', 'Tokyo']);
  });

  it('survives junk', () => {
    for (const junk of [null, undefined, 'nope', 42, []]) {
      const d = normalizeDefaults(junk);
      expect(d.suppliers.length).toBeGreaterThan(0);
      expect(d.finance.lcPreCash.days).toBe(GLOBAL_DEFAULTS.finance.lcPreCash.days);
    }
  });
});

describe('normalizeDeal', () => {
  it('fills missing nested sections without touching prices', () => {
    const legacy = {
      id: 'old-deal',
      name: 'Legacy',
      incoterm: 'FOB',
      products: [{ id: 'p1', description: '1/2"', contractPrice: 2260 }],
      // no rates / finance / handling at all
    };
    const deal = normalizeDeal(legacy)!;
    expect(deal.products[0].contractPrice).toBe(2260);
    expect(deal.products[0].weightGainPct).toBe(0);
    expect(deal.products[0].salePricePerLb).toBeNull();
    expect(deal.rates.sec232Pct).toBe(GLOBAL_DEFAULTS.rates.sec232Pct);
    expect(deal.finance.tariff.financedPct).toBe(GLOBAL_DEFAULTS.finance.tariff.financedPct);
    expect(deal.handling.containerCapacityMT).toBe(GLOBAL_DEFAULTS.handling.containerCapacityMT);
    // and it can actually be priced
    expect(() => calculateDeal(deal)).not.toThrow();
    expect(calculateDeal(deal).products[0].landedPerMT).toBeGreaterThan(0);
  });

  it('never yields a deal with zero products', () => {
    const deal = normalizeDeal({ id: 'x', name: 'x', products: [] })!;
    expect(deal.products.length).toBe(1);
  });

  it('rejects values that are not deals', () => {
    expect(normalizeDeal(null)).toBeNull();
    expect(normalizeDeal({ name: 'no id' })).toBeNull();
  });

  it('leaves the seeded deals byte-for-byte intact', () => {
    // Migration must not perturb the workbook-verified seeds.
    const seeds = seedDeals();
    for (const seed of seeds) {
      expect(normalizeDeal(structuredClone(seed))).toEqual(seed);
    }
  });
});

describe('size lists', () => {
  it('plate is sized in inches, sheet in even gauges 10–26 plus 13', () => {
    expect(sizeOptionsFor('plate')).toBe(THICKNESS_OPTIONS);
    expect(sizeOptionsFor('plate')).toContain('1/2"');
    expect(sizeOptionsFor('sheet')).toBe(GAUGE_OPTIONS);
    expect(GAUGE_OPTIONS).toEqual([
      '10 GA', '12 GA', '13 GA', '14 GA', '16 GA', '18 GA', '20 GA', '22 GA', '24 GA', '26 GA',
    ]);
  });

  it('keeps the two size vocabularies separate', () => {
    // No inch value may appear under sheet, and no gauge under plate.
    for (const size of sizeOptionsFor('sheet')) expect(sizeOptionsFor('plate')).not.toContain(size);
    for (const size of sizeOptionsFor('plate')) expect(sizeOptionsFor('sheet')).not.toContain(size);
  });

  it('drops a stored size that does not belong to the deal’s form', () => {
    const sheet = normalizeDeal({
      id: 'd', name: 'd', productForm: 'sheet',
      products: [{ id: 'p', description: '1/2"', contractPrice: 2000 }],
    })!;
    expect(sheet.products[0].description).toBe('');
    expect(sheet.products[0].contractPrice).toBe(2000); // price is untouched

    const plate = normalizeDeal({
      id: 'd', name: 'd', productForm: 'plate',
      products: [{ id: 'p', description: '12 GA' }, { id: 'q', description: '1/2"' }],
    })!;
    expect(plate.products[0].description).toBe('');
    expect(plate.products[1].description).toBe('1/2"'); // valid size survives
  });

  it('has no invented gain figures for gauges', () => {
    // Sheet gain is unknown, so a gauge must never resolve to a number.
    for (const gauge of GAUGE_OPTIONS) {
      expect(gainForThickness(gauge)).toBeNull();
    }
  });

  it('applies the % Gain TW column from the pricing sheet', () => {
    // Spot-checked against "Plate Weight Gains by Thickness".
    const expected: Record<string, number> = {
      '3/16"': 10.91, '1/4"': 8.21, '1/2"': 5.01, '1"': 3.43,
      '1 3/8"': 2.55, '2"': 1.82, '3"': 2.05, '4"': 1.2,
    };
    for (const [thickness, gain] of Object.entries(expected)) {
      expect(gainForThickness(thickness)).toBe(gain);
    }
    expect(gainForThickness('nonsense')).toBeNull();
  });

  it('defaults a deal saved before the plate/sheet split to plate', () => {
    const deal = normalizeDeal({ id: 'old', name: 'old', products: [{ id: 'p', description: '1/2"' }] })!;
    expect(deal.productForm).toBe('plate');
  });
});

describe('normalizeDeals', () => {
  it('seeds when storage holds nothing usable', () => {
    expect(normalizeDeals(undefined).length).toBeGreaterThan(0);
    expect(normalizeDeals('garbage').length).toBeGreaterThan(0);
  });

  it('drops unusable entries instead of crashing', () => {
    const deals = normalizeDeals([null, { id: 'ok', name: 'ok', products: [] }, 'junk']);
    expect(deals.length).toBe(1);
    expect(deals[0].id).toBe('ok');
  });
});
