// Saved data is written by whichever version of the app was live at the time.
// These tests pin the rule that anything loaded from storage is merged over the
// current defaults, so a missing key can never reach the UI and blank the page.

import { describe, it, expect } from 'vitest';
import { GLOBAL_DEFAULTS, normalizeDeal, normalizeDeals, normalizeDefaults, seedDeals } from './appDefaults';
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
