// Shipping and trade types
export type Incoterm = 'FOB' | 'CIF';
export type ShippingType = 'container' | 'breakBulk';
export type ContainerSize = '20ft' | '40ft';
export type BrokerFeeType = 'perMT' | 'perContainer' | 'flat';

// Supplier configuration
export interface Supplier {
  id: string;
  name: string;
  defaultOriginCountry: string;
  defaultOriginPort: string;
  defaultIncoterm: Incoterm;
  weightBasis: 'actual' | 'theoretical';
  defaultWeightGainPercent: number;
  agentName: string;
  agentFeePercent: number;
}

// Customer configuration
export interface Customer {
  id: string;
  name: string;
  defaultDestinationPort: string;
  creditInsuranceRate: number;
  paymentTermsDays: number;
}

// Port configuration with rates
export interface Port {
  id: string;
  name: string;
  country: string;
  type: 'origin' | 'destination' | 'both';
  drayageRate?: number;
  storageRatePerMonth?: number;
  stevedoringRate?: number;
}

// Weight gain lookup table entry
export interface WeightGainEntry {
  thickness: string;
  sellWeight: number;
  buyWeight: number;
  percentGain: number;
}

// Product line for multi-product pricing
export interface ProductLine {
  id: string;
  description: string;
  fobPrice: number;
  weightGainPercent: number;
  targetSalePrice?: number;
}

// Main pricing input state
export interface PricingInput {
  // Deal parameters
  supplierId: string;
  customerId: string;
  originCountry: string;
  originPort: string;
  destinationPort: string;
  incoterm: Incoterm;
  shippingType: ShippingType;
  containerSize: ContainerSize;

  // Pricing
  basePrice: number;
  oceanFreight: number;
  containerCapacity: number;

  // Product details
  productGrade: string;
  productSize: string;
  weightGainPercent: number;

  // Duties & fees
  section232Rate: number;
  hmfRate: number;
  mpfRate: number;

  // Insurance
  marineInsuranceRate: number;
  creditInsuranceRate: number;

  // Finance - LC Pre Cash
  includeLCFinance: boolean;
  lcRate: number;
  lcDays: number;

  // Finance - Post Sailing
  includeFinancing: boolean;
  financingRate: number;
  waterDays: number;
  termsDays: number;
  bufferDays: number;

  // Finance - Tariff
  includeTariffFinance: boolean;
  tariffFinancePercent: number;
  tariffFinanceRate: number;
  tariffFinanceDays: number;

  // Handling - Container
  drayagePerContainer: number;
  destuffCapacity: number;

  // Handling - Break Bulk
  stevedoringPerMT: number;

  // Storage
  storagePerMTPerMonth: number;
  storageMonths: number;

  // Broker
  brokerFee: number;
  brokerFeeType: BrokerFeeType;
  brokerContainers: number;

  // Commission
  commissionName: string;
  commissionRate: number;

  // Margin
  targetMarginPercent: number;
  targetSalePrice: number;
}

// Individual cost line item
export interface CostLineItem {
  label: string;
  description?: string;
  amountPerMT: number;
  amountPerLb: number;
}

// Full cost breakdown result
export interface CostBreakdown {
  // Base values
  fobValue: number;
  adjustedFOB: number;
  freightPerMT: number;
  cifValue: number;

  // Line items
  lineItems: CostLineItem[];

  // Totals
  totalLandedCostMT: number;
  totalLandedCostLb: number;

  // Margin calculations
  marginAmount: number;
  marginPercent: number;
  targetSalePrice: number;
}

// Saved scenario for comparison
export interface Scenario {
  id: string;
  name: string;
  createdAt: string;
  input: PricingInput;
  breakdown: CostBreakdown;
}

// Default rates configuration
export interface DefaultRates {
  section232Rate: number;
  hmfRate: number;
  mpfRate: number;
  marineInsuranceRate: number;
  creditInsuranceRate: number;
  lcRate: number;
  financingRate: number;
  tariffFinanceRate: number;
  defaultCommissionRate: number;
  defaultContainerCapacity20ft: number;
  defaultContainerCapacity40ft: number;
  defaultDestuffCapacity: number;
}

// Full application settings
export interface AppSettings {
  suppliers: Supplier[];
  customers: Customer[];
  ports: Port[];
  weightGainTable: WeightGainEntry[];
  defaultRates: DefaultRates;
  drayageByPort: Record<string, number>;
  storageByPort: Record<string, number>;
  stevedoringByPort: Record<string, number>;
}

// Calculation history entry
export interface CalculationHistory {
  id: string;
  timestamp: string;
  supplierName: string;
  customerName: string;
  landedCostLb: number;
  input: PricingInput;
}
