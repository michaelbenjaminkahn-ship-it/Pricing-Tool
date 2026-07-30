// Landed-cost calculation engine.
//
// The math here is reconciled cell-by-cell against the real pricing workbooks
// (see calc.test.ts, which locks the results to those files):
//   - alro.xlsx              "YUEN CHANG TO ALRO"   — CIF, container
//   - sammyla50pct.xlsx      "YUEN CHANG TO SAMUEL" — CIF, container
//   - alro__camden_bulk.xlsx "YEOU YIH TO ALRO"     — FOB, break bulk, 3 sizes
//
// Conventions proven by those files:
//   - Section 232 / HMF / MPF are computed on the FOB value (customs basis) —
//     the CONTRACT FOB, not the weight-gain-adjusted FOB.
//   - Weight gain adjusts only the material cost line: FOB × (1 − gain%).
//   - Marine insurance applies to FOB deals only (a CIF price already includes
//     it) and is computed on the FOB value.
//   - Credit insurance is computed on the CFR value (contract + freight).
//   - LC finance and commission are computed on the contract price
//     (CIF price for CIF deals, FOB price for FOB deals).
//   - Tariff finance = tariff amount × financed% × rate × days / 360, with
//     financed% defaulting to 100.
//   - Sale price from markup: sale = landed × (1 + markup%), rounded to 3
//     decimals (the quoted price); GP% is then reported on the sale price.

import type { Deal, DealProduct, DealResult, ProductResult, CostLine } from './types';

export const MT_TO_LB = 2204.62;
export const DAYS_PER_YEAR = 360;

const money = (v: number, dp = 2) =>
  '$' + v.toLocaleString('en-US', { minimumFractionDigits: dp > 2 ? dp : 0, maximumFractionDigits: dp });

const pct = (v: number) => {
  const s = Number.isInteger(v) ? v.toString() : v.toFixed(3).replace(/\.?0+$/, '');
  return s + '%';
};

/** Freight in $/MT shared by every product on the deal. */
export function freightPerMT(deal: Deal): number {
  if (deal.incoterm === 'CIF') return deal.freightPerMT;
  if (deal.shippingType === 'container') {
    const cap = deal.handling.containerCapacityMT || 1;
    return deal.freightPerContainer / cap;
  }
  return deal.freightPerMT;
}

export function calculateProduct(deal: Deal, product: DealProduct): ProductResult {
  const freight = freightPerMT(deal);
  const isCIF = deal.incoterm === 'CIF';
  const r = deal.rates;
  const f = deal.finance;
  const h = deal.handling;

  // --- Value bases -------------------------------------------------------
  // contractValue: what the invoice says (basis for commission & LC finance)
  // fobValue:      customs basis for duties
  // cfrValue:      contract + freight (basis for credit insurance)
  const contractValue = isCIF
    ? product.contractPrice + deal.freightAdderPerMT
    : product.contractPrice;
  const fobValue = isCIF ? product.contractPrice - deal.freightPerMT : product.contractPrice;
  const cfrValue = isCIF ? contractValue : contractValue + freight;
  const financeBase = f.basis === 'cfr' ? cfrValue : contractValue;

  const gain = product.weightGainPct / 100;
  const material = contractValue * (1 - gain);

  const lines: CostLine[] = [];
  const add = (key: string, label: string, formula: string, perMT: number) => {
    lines.push({ key, label, formula, perMT });
  };

  // --- Material + freight ------------------------------------------------
  if (gain > 0) {
    add('material', `${isCIF ? 'CIF' : 'FOB'} after ${pct(product.weightGainPct)} weight gain`,
      `${money(contractValue)} × (1 − ${pct(product.weightGainPct)})`, material);
  } else {
    add('material', `${isCIF ? 'CIF' : 'FOB'} (contract price)`, money(contractValue), material);
  }

  if (!isCIF) {
    const formula = deal.shippingType === 'container'
      ? `${money(deal.freightPerContainer)} ÷ ${h.containerCapacityMT} MT`
      : `${money(deal.freightPerMT)} / MT`;
    add('freight', 'Ocean freight', formula, freight);
  }

  // --- Duties & fees (customs basis: contract FOB) -----------------------
  const sec232 = fobValue * (r.sec232Pct / 100);
  add('sec232', 'Section 232', `${pct(r.sec232Pct)} × ${money(fobValue)} FOB`, sec232);

  if (r.hmfPct > 0) {
    add('hmf', 'HMF', `${pct(r.hmfPct)} × ${money(fobValue)} FOB`, fobValue * (r.hmfPct / 100));
  }
  if (r.mpfPct > 0) {
    add('mpf', 'MPF', `${pct(r.mpfPct)} × ${money(fobValue)} FOB`, fobValue * (r.mpfPct / 100));
  }

  // --- Insurance ---------------------------------------------------------
  // Marine insurance only on FOB deals — a CIF price already includes it.
  if (!isCIF && r.marineInsPct > 0) {
    add('marineIns', 'Marine insurance', `${pct(r.marineInsPct)} × ${money(fobValue)} FOB`,
      fobValue * (r.marineInsPct / 100));
  }
  if (r.creditInsPct > 0) {
    add('creditIns', 'Credit insurance', `${pct(r.creditInsPct)} × ${money(cfrValue)} CFR`,
      cfrValue * (r.creditInsPct / 100));
  }

  // --- Finance -----------------------------------------------------------
  const baseLabel = f.basis === 'cfr' ? 'CFR' : isCIF ? 'CIF' : 'FOB';
  if (f.lcPreCash.enabled && f.lcPreCash.ratePct > 0) {
    add('lcPreCash', 'LC — pre-cash',
      `${money(financeBase)} ${baseLabel} × ${pct(f.lcPreCash.ratePct)} × ${f.lcPreCash.days}/360`,
      financeBase * (f.lcPreCash.ratePct / 100) * f.lcPreCash.days / DAYS_PER_YEAR);
  }
  if (f.lcSailing.enabled && f.lcSailing.ratePct > 0) {
    add('lcSailing', 'LC — sailing',
      `${money(financeBase)} ${baseLabel} × ${pct(f.lcSailing.ratePct)} × ${f.lcSailing.days}/360`,
      financeBase * (f.lcSailing.ratePct / 100) * f.lcSailing.days / DAYS_PER_YEAR);
  }
  if (f.tariff.enabled && f.tariff.ratePct > 0 && sec232 > 0) {
    const fp = f.tariff.financedPct / 100;
    const fpText = f.tariff.financedPct !== 100 ? ` × ${pct(f.tariff.financedPct)}` : '';
    add('tariffFin', 'Tariff finance',
      `${money(sec232)} tariff${fpText} × ${pct(f.tariff.ratePct)} × ${f.tariff.days}/360`,
      sec232 * fp * (f.tariff.ratePct / 100) * f.tariff.days / DAYS_PER_YEAR);
  }

  // --- Handling & other --------------------------------------------------
  if (deal.shippingType === 'container') {
    if (h.drayagePerContainer > 0) {
      add('drayage', 'Drayage / destuffing',
        `${money(h.drayagePerContainer)} ÷ ${h.containerCapacityMT} MT`,
        h.drayagePerContainer / (h.containerCapacityMT || 1));
    }
  } else if (h.stevedorePerMT > 0) {
    add('stevedore', 'Stevedoring', `${money(h.stevedorePerMT)} / MT`, h.stevedorePerMT);
  }

  if (h.storagePerMTMonth > 0 && h.storageMonths > 0) {
    add('storage', 'Storage',
      `${money(h.storagePerMTMonth)}/MT × ${h.storageMonths} mo`,
      h.storagePerMTMonth * h.storageMonths);
  }
  if (h.truckingPerFTL > 0) {
    add('trucking', 'Trucking', `${money(h.truckingPerFTL)} ÷ ${h.ftlCapacityMT} MT/FTL`,
      h.truckingPerFTL / (h.ftlCapacityMT || 1));
  }
  if (h.brokerFee > 0) {
    const cap = h.containerCapacityMT || 1;
    if (h.brokerBasis === 'perMT') {
      add('broker', 'Broker', `${money(h.brokerFee)} / MT`, h.brokerFee);
    } else {
      add('broker', 'Broker', `${money(h.brokerFee)} ÷ ${cap} MT`, h.brokerFee / cap);
    }
  }
  if (h.commissionPct > 0) {
    add('commission', h.commissionName || 'Commission',
      `${pct(h.commissionPct)} × ${money(contractValue)} contract`,
      contractValue * (h.commissionPct / 100));
  }

  // --- Totals ------------------------------------------------------------
  const landedPerMT = lines.reduce((sum, l) => sum + l.perMT, 0);
  const landedPerLb = landedPerMT / MT_TO_LB;

  // --- Sale & margin -----------------------------------------------------
  let salePerLb: number | null = null;
  let saleSource: ProductResult['saleSource'] = null;
  if (product.salePricePerLb != null && product.salePricePerLb > 0) {
    salePerLb = product.salePricePerLb;
    saleSource = 'manual';
  } else if (deal.markupPct > 0) {
    // Markup on cost, rounded to the quoted price (matches ROUND(landed×(1+m),3)).
    salePerLb = Math.round(landedPerLb * (1 + deal.markupPct / 100) * 1000) / 1000;
    saleSource = 'markup';
  }

  const marginPerLb = salePerLb != null ? salePerLb - landedPerLb : null;
  const gpPct = salePerLb != null && salePerLb > 0 && marginPerLb != null
    ? (marginPerLb / salePerLb) * 100
    : null;
  const marginDollars = marginPerLb != null && product.quantityLbs != null && product.quantityLbs > 0
    ? marginPerLb * product.quantityLbs
    : null;

  return {
    productId: product.id,
    description: product.description,
    fobValue,
    contractValue,
    cfrValue,
    lines,
    landedPerMT,
    landedPerLb,
    salePerLb,
    saleSource,
    marginPerLb,
    gpPct,
    marginDollars,
  };
}

export function calculateDeal(deal: Deal): DealResult {
  const products = deal.products.map(p => calculateProduct(deal, p));
  const withQty = products.filter(p => p.marginDollars != null);
  return {
    products,
    totalMarginDollars: withQty.reduce((s, p) => s + (p.marginDollars ?? 0), 0),
    hasQuantities: withQty.length > 0,
  };
}

// --- Display helpers ------------------------------------------------------

export function fmtMoney(v: number, dp = 2): string {
  return v.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

export function fmtLb(v: number): string {
  return v.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

export function fmtPct(v: number, dp = 2): string {
  return v.toFixed(dp) + '%';
}
