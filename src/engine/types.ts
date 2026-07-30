// Domain types for the deal-centric pricing engine.
//
// A Deal is one supplier→customer lane with shared freight/rates/finance and
// one or more product lines (sizes). This mirrors how the pricing spreadsheets
// are actually structured (e.g. "YEOU YIH TO ALRO" with 1/2", 5/8", 1" columns).

export type Incoterm = 'FOB' | 'CIF';
/** Plate is sized in inches; sheet in gauges. Descriptive — no effect on the math. */
export type ProductForm = 'plate' | 'sheet';
export type ShippingType = 'container' | 'breakBulk';

/** Base value used for LC finance charges.
 *  'contract' = the contract price (FOB or CIF as quoted) — matches alro__camden_bulk.xlsx.
 *  'cfr'      = contract price + freight (some newer sheets finance the CFR value). */
export type FinanceBasis = 'contract' | 'cfr';

export type BrokerBasis = 'perMT' | 'perContainer' | 'flat';

export interface DealProduct {
  id: string;
  /** e.g. '1/2"' or '304/L 5/8"' */
  description: string;
  /** $/MT — FOB price for FOB deals, CIF price for CIF deals */
  contractPrice: number;
  /** % — theoretical vs mill weight variance; reduces the material cost line only.
   *  Duties/fees stay on the contract price (customs basis). */
  weightGainPct: number;
  /** True when weightGainPct came from the lookup table rather than being typed.
   *  Auto values are re-derived or cleared when the size or origin changes; a
   *  hand-entered figure is never overwritten. */
  weightGainAuto?: boolean;
  /** $/lb — quoted sale price. If absent, the deal-level markup% is used. */
  salePricePerLb: number | null;
  /** lbs — used to roll up total margin dollars for the quote */
  quantityLbs: number | null;
}

export interface DealRates {
  sec232Pct: number;      // % of FOB value
  hmfPct: number;         // % of FOB value
  mpfPct: number;         // % of FOB value
  marineInsPct: number;   // % of FOB value — FOB deals only (CIF already includes it)
  creditInsPct: number;   // % of CFR value (contract + freight)
}

export interface FinanceLeg {
  enabled: boolean;
  ratePct: number;  // annual %
  days: number;
}

export interface DealFinance {
  basis: FinanceBasis;
  lcPreCash: FinanceLeg;
  lcSailing: FinanceLeg;
  /** Finance cost on the Section 232 tariff itself.
   *  cost = tariff amount × financedPct × rate × days / 360.
   *  financedPct defaults to 100 (the sheets finance the full tariff). */
  tariff: FinanceLeg & { financedPct: number };
}

export interface DealHandling {
  /** $/container — container shipping only */
  drayagePerContainer: number;
  /** MT per container — divisor for freight and drayage (sheets use 19) */
  containerCapacityMT: number;
  /** $/MT — break bulk only */
  stevedorePerMT: number;
  storagePerMTMonth: number;
  storageMonths: number;
  /** $ per full truckload, spread over ftlCapacityMT */
  truckingPerFTL: number;
  ftlCapacityMT: number;
  brokerFee: number;
  brokerBasis: BrokerBasis;
  /** e.g. "Chiu" (1%) or "Tradehansa" (0.5%) — % of the contract price */
  commissionName: string;
  commissionPct: number;
}

export interface Deal {
  id: string;
  name: string;
  supplier: string;
  customer: string;
  /** e.g. '304/L' — descriptive only, does not affect the math */
  grade?: string;
  /** Drives which size list the quote picks from (inches vs gauges). */
  productForm: ProductForm;
  originPort: string;
  destinationPort: string;
  incoterm: Incoterm;
  shippingType: ShippingType;
  /** FOB + container: $/container (divided by containerCapacityMT) */
  freightPerContainer: number;
  /** FOB + break bulk: $/MT directly. CIF: the freight embedded in the CIF
   *  price, used to back out FOB for the duty calculation. */
  freightPerMT: number;
  /** CIF only: extra freight on top of the CIF price (e.g. Baltimore adder).
   *  Raises the contract value; FOB stays CIF − embedded freight. */
  freightAdderPerMT: number;
  rates: DealRates;
  finance: DealFinance;
  handling: DealHandling;
  /** % markup on landed cost → sale price, used when a product has no manual
   *  sale price. (Sheets compute sale = landed × (1 + markup).) */
  markupPct: number;
  products: DealProduct[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/** One line of the cost breakdown, with the formula spelled out for auditing. */
export interface CostLine {
  key: string;
  label: string;
  /** Human-readable formula, e.g. "50% × $2,150 (FOB)" */
  formula: string;
  perMT: number;
}

export interface ProductResult {
  productId: string;
  description: string;
  /** FOB value (contract for FOB deals; backed out of CIF for CIF deals) */
  fobValue: number;
  /** The contract price incl. CIF freight adder — basis for commission/finance */
  contractValue: number;
  /** contract + freight (≈ CIF) — basis for credit insurance */
  cfrValue: number;
  lines: CostLine[];
  landedPerMT: number;
  landedPerLb: number;
  salePerLb: number | null;
  saleSource: 'manual' | 'markup' | null;
  marginPerLb: number | null;
  gpPct: number | null;
  marginDollars: number | null;
}

export interface DealResult {
  products: ProductResult[];
  totalMarginDollars: number;
  hasQuantities: boolean;
}

/**
 * Weight gain lookup row for plate.
 *
 * `gainPct` is the "% Gain TW" column from the pricing sheet, used for every
 * origin. Buy weights are carried for reference only — nothing reads them.
 */
export interface WeightGainRow {
  thickness: string;
  sellWeight: number;
  buyWeightTW: number;
  buyWeightJP: number;
  gainPct: number;
}

/** Global defaults applied to new deals (deals snapshot their own copies). */
export interface GlobalDefaults {
  rates: DealRates;
  finance: DealFinance;
  handling: DealHandling;
  markupPct: number;
  drayageByPort: Record<string, number>;
  storageByPort: Record<string, number>;
  destinationPorts: string[];
  // Pick-lists — keep free text out of the day-to-day screens.
  suppliers: string[];
  customers: string[];
  originPorts: string[];
  grades: string[];
  commissionAgents: { name: string; pct: number }[];
}
