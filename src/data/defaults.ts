import type {
  Supplier,
  Customer,
  Port,
  WeightGainEntry,
  DefaultRates,
  PricingInput,
  AppSettings,
} from '../types';

// Conversion constant
export const MT_TO_LB = 2204.62;
export const DAYS_PER_YEAR = 360; // Banking convention

// Weight Gains by Thickness (304/L and 316/L)
export const DEFAULT_WEIGHT_GAIN_TABLE: WeightGainEntry[] = [
  { thickness: '3/16"', sellWeight: 8.579, buyWeight: 7.74, percentGain: 10.91 },
  { thickness: '1/4"', sellWeight: 11.16, buyWeight: 10.31, percentGain: 8.21 },
  { thickness: '5/16"', sellWeight: 13.75, buyWeight: 12.89, percentGain: 6.66 },
  { thickness: '3/8"', sellWeight: 16.5, buyWeight: 15.47, percentGain: 6.66 },
  { thickness: '1/2"', sellWeight: 21.66, buyWeight: 20.63, percentGain: 5.01 },
  { thickness: '5/8"', sellWeight: 26.83, buyWeight: 25.78, percentGain: 4.06 },
  { thickness: '3/4"', sellWeight: 32.12, buyWeight: 30.94, percentGain: 3.81 },
  { thickness: '7/8"', sellWeight: 37.29, buyWeight: 36.10, percentGain: 3.30 },
  { thickness: '1"', sellWeight: 42.67, buyWeight: 41.25, percentGain: 3.43 },
  { thickness: '1 1/8"', sellWeight: 47.83, buyWeight: 46.41, percentGain: 3.06 },
  { thickness: '1 1/4"', sellWeight: 53, buyWeight: 51.57, percentGain: 2.78 },
  { thickness: '1 1/2"', sellWeight: 63.34, buyWeight: 61.88, percentGain: 2.36 },
  { thickness: '1 3/4"', sellWeight: 73.67, buyWeight: 72.20, percentGain: 2.04 },
  { thickness: '2"', sellWeight: 84.01, buyWeight: 82.51, percentGain: 1.82 },
  { thickness: '2 1/2"', sellWeight: 105.1, buyWeight: 103.14, percentGain: 1.90 },
  { thickness: '3"', sellWeight: 126.3, buyWeight: 123.76, percentGain: 2.05 },
  { thickness: '3 1/4"', sellWeight: 136.6, buyWeight: 134.08, percentGain: 1.88 },
  { thickness: '3 1/2"', sellWeight: 147, buyWeight: 144.39, percentGain: 1.81 },
  { thickness: '3 3/4"', sellWeight: 157, buyWeight: 154.70, percentGain: 1.48 },
  { thickness: '4"', sellWeight: 167, buyWeight: 165.02, percentGain: 1.20 },
];

// Drayage rates by port (per 20ft container)
export const DEFAULT_DRAYAGE_BY_PORT: Record<string, number> = {
  'Baltimore': 900,
  'Los Angeles': 1400,
  'Seattle': 1400,
  'Houston': 900,
  'Oakland': 1800,
  'Chicago': 1300,
  'Miami': 1600,
  'Newark': 1200,
};

// Storage rates by port (per MT per month)
export const DEFAULT_STORAGE_BY_PORT: Record<string, number> = {
  'Baltimore': 5.5,
  'Los Angeles': 9.5,
  'Seattle': 7.5,
  'Houston': 5.5,
  'Oakland': 5.5,
  'Chicago': 10.0,
  'Miami': 7.0,
  'Newark': 8.0,
};

// Stevedoring rates by port (for break bulk, per MT or flat)
export const DEFAULT_STEVEDORING_BY_PORT: Record<string, number> = {
  'Houston': 35,
  'Los Angeles': 35,
  'Newark': 35,
  'Baltimore': 35,
};

// Default suppliers
export const DEFAULT_SUPPLIERS: Supplier[] = [
  {
    id: 'pvst',
    name: 'PVST',
    defaultOriginCountry: 'Taiwan',
    defaultOriginPort: 'Kaohsiung',
    defaultIncoterm: 'FOB',
    weightBasis: 'theoretical',
    defaultWeightGainPercent: 5.0,
    agentName: 'Tradehansa',
    agentFeePercent: 0.5,
  },
  {
    id: 'stanch',
    name: 'Stanch',
    defaultOriginCountry: 'Taiwan',
    defaultOriginPort: 'Kaohsiung',
    defaultIncoterm: 'FOB',
    weightBasis: 'actual',
    defaultWeightGainPercent: 0,
    agentName: 'Chiu',
    agentFeePercent: 1.0,
  },
  {
    id: 'yeou-yih',
    name: 'Yeou Yih',
    defaultOriginCountry: 'Taiwan',
    defaultOriginPort: 'Kaohsiung',
    defaultIncoterm: 'FOB',
    weightBasis: 'theoretical',
    defaultWeightGainPercent: 5.0,
    agentName: 'Chiu',
    agentFeePercent: 1.0,
  },
  {
    id: 'yuen-chang',
    name: 'Yuen Chang',
    defaultOriginCountry: 'Taiwan',
    defaultOriginPort: 'Kaohsiung',
    defaultIncoterm: 'CIF',
    weightBasis: 'actual',
    defaultWeightGainPercent: 0,
    agentName: 'Chiu',
    agentFeePercent: 1.0,
  },
  {
    id: 'wuu-jing',
    name: 'Wuu Jing',
    defaultOriginCountry: 'Taiwan',
    defaultOriginPort: 'Kaohsiung',
    defaultIncoterm: 'FOB',
    weightBasis: 'actual',
    defaultWeightGainPercent: 0,
    agentName: 'Chiu',
    agentFeePercent: 1.0,
  },
];

// Default customers
export const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'basic-metals',
    name: 'Basic Metals',
    defaultDestinationPort: 'Houston',
    creditInsuranceRate: 0.11,
    paymentTermsDays: 30,
  },
  {
    id: 'alro',
    name: 'Alro',
    defaultDestinationPort: 'Chicago',
    creditInsuranceRate: 0.11,
    paymentTermsDays: 30,
  },
  {
    id: 'oneal',
    name: 'Oneal',
    defaultDestinationPort: 'Houston',
    creditInsuranceRate: 0.11,
    paymentTermsDays: 30,
  },
  {
    id: 'samuel',
    name: 'Samuel',
    defaultDestinationPort: 'Los Angeles',
    creditInsuranceRate: 0.11,
    paymentTermsDays: 30,
  },
];

// Default ports
export const DEFAULT_PORTS: Port[] = [
  // Origin ports
  { id: 'kaohsiung', name: 'Kaohsiung', country: 'Taiwan', type: 'origin' },
  { id: 'taipei', name: 'Taipei', country: 'Taiwan', type: 'origin' },
  { id: 'mumbai', name: 'Mumbai', country: 'India', type: 'origin' },
  { id: 'chennai', name: 'Chennai', country: 'India', type: 'origin' },

  // Destination ports (US)
  { id: 'los-angeles', name: 'Los Angeles', country: 'USA', type: 'destination', drayageRate: 1400, storageRatePerMonth: 9.5, stevedoringRate: 35 },
  { id: 'houston', name: 'Houston', country: 'USA', type: 'destination', drayageRate: 900, storageRatePerMonth: 5.5, stevedoringRate: 35 },
  { id: 'newark', name: 'Newark', country: 'USA', type: 'destination', drayageRate: 1200, storageRatePerMonth: 8.0, stevedoringRate: 35 },
  { id: 'baltimore', name: 'Baltimore', country: 'USA', type: 'destination', drayageRate: 900, storageRatePerMonth: 5.5, stevedoringRate: 35 },
  { id: 'seattle', name: 'Seattle', country: 'USA', type: 'destination', drayageRate: 1400, storageRatePerMonth: 7.5, stevedoringRate: 35 },
  { id: 'oakland', name: 'Oakland', country: 'USA', type: 'destination', drayageRate: 1800, storageRatePerMonth: 5.5, stevedoringRate: 35 },
  { id: 'chicago', name: 'Chicago', country: 'USA', type: 'destination', drayageRate: 1300, storageRatePerMonth: 10.0, stevedoringRate: 35 },
  { id: 'miami', name: 'Miami', country: 'USA', type: 'destination', drayageRate: 1600, storageRatePerMonth: 7.0, stevedoringRate: 35 },
];

// Default rates
export const DEFAULT_RATES: DefaultRates = {
  section232Rate: 50, // 50% as specified
  hmfRate: 0.335,
  mpfRate: 0.125,
  marineInsuranceRate: 0.24,
  creditInsuranceRate: 0.11,
  lcRate: 3.5, // LC Pre-Cash rate
  financingRate: 7.75, // LC Sailing / Post-sailing rate
  tariffFinanceRate: 7.75,
  defaultCommissionRate: 1.0,
  defaultContainerCapacity20ft: 19,
  defaultContainerCapacity40ft: 38,
  defaultDestuffCapacity: 18,
};

// Default pricing input state
export const DEFAULT_PRICING_INPUT: PricingInput = {
  // Deal parameters
  supplierId: '',
  customerId: '',
  originCountry: 'Taiwan',
  originPort: 'Kaohsiung',
  destinationPort: 'Los Angeles',
  incoterm: 'FOB',
  shippingType: 'container',
  containerSize: '20ft',

  // Pricing
  basePrice: 0,
  oceanFreight: 3000,
  containerCapacity: 19,

  // Product details
  productGrade: '304/L',
  productSize: '',
  weightGainPercent: 0,

  // Duties & fees
  section232Rate: DEFAULT_RATES.section232Rate,
  hmfRate: DEFAULT_RATES.hmfRate,
  mpfRate: DEFAULT_RATES.mpfRate,

  // Insurance
  marineInsuranceRate: DEFAULT_RATES.marineInsuranceRate,
  creditInsuranceRate: DEFAULT_RATES.creditInsuranceRate,

  // Finance - LC Pre Cash
  includeLCFinance: true,
  lcRate: DEFAULT_RATES.lcRate,
  lcDays: 60,

  // Finance - Post Sailing
  includeFinancing: true,
  financingRate: DEFAULT_RATES.financingRate,
  waterDays: 60,
  termsDays: 30,
  bufferDays: 15,

  // Finance - Tariff
  includeTariffFinance: true,
  tariffFinancePercent: 50,
  tariffFinanceRate: DEFAULT_RATES.tariffFinanceRate,
  tariffFinanceDays: 45,

  // Handling - Container
  drayagePerContainer: 1350,
  destuffCapacity: DEFAULT_RATES.defaultDestuffCapacity,

  // Handling - Break Bulk
  stevedoringPerMT: 35,

  // Storage
  storagePerMTPerMonth: 0,
  storageMonths: 0,

  // Broker
  brokerFee: 0,
  brokerFeeType: 'perMT',
  brokerContainers: 1,

  // Commission
  commissionName: 'Chiu',
  commissionRate: 1.0,

  // Margin
  targetMarginPercent: 0,
  targetSalePrice: 0,
};

// Full default app settings
export const DEFAULT_APP_SETTINGS: AppSettings = {
  suppliers: DEFAULT_SUPPLIERS,
  customers: DEFAULT_CUSTOMERS,
  ports: DEFAULT_PORTS,
  weightGainTable: DEFAULT_WEIGHT_GAIN_TABLE,
  defaultRates: DEFAULT_RATES,
  drayageByPort: DEFAULT_DRAYAGE_BY_PORT,
  storageByPort: DEFAULT_STORAGE_BY_PORT,
  stevedoringByPort: DEFAULT_STEVEDORING_BY_PORT,
};

// Origin countries list
export const ORIGIN_COUNTRIES = ['Taiwan', 'India', 'China', 'South Korea', 'Japan'];

// Get destination ports for dropdown
export const getDestinationPorts = (ports: Port[]): Port[] => {
  return ports.filter(p => p.type === 'destination' || p.type === 'both');
};

// Get origin ports for dropdown
export const getOriginPorts = (ports: Port[]): Port[] => {
  return ports.filter(p => p.type === 'origin' || p.type === 'both');
};
