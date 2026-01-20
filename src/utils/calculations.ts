import type { PricingInput, CostBreakdown, CostLineItem } from '../types';
import { MT_TO_LB, DAYS_PER_YEAR } from '../data/defaults';

/**
 * Calculate the complete cost breakdown for a pricing input
 */
export function calculateCostBreakdown(input: PricingInput): CostBreakdown {
  const lineItems: CostLineItem[] = [];

  // ============================================
  // STEP 1: Calculate base FOB and CIF values
  // ============================================

  // Freight per MT (for container shipping)
  const freightPerMT = input.shippingType === 'container'
    ? input.oceanFreight / input.containerCapacity
    : input.oceanFreight; // For break bulk, freight might be quoted per MT directly

  let fobValue: number;
  let cifValue: number;

  if (input.incoterm === 'FOB') {
    fobValue = input.basePrice;
    cifValue = input.basePrice + freightPerMT;
  } else {
    // CIF: base price includes freight and insurance
    // Back-calculate FOB from CIF
    cifValue = input.basePrice;
    // Approximate FOB by subtracting freight (insurance is small, handled separately)
    fobValue = input.basePrice - freightPerMT;
  }

  // ============================================
  // STEP 2: Apply weight gain adjustment
  // ============================================
  // Weight gain reduces effective FOB (you pay for more weight than you receive)
  const weightGainMultiplier = 1 - (input.weightGainPercent / 100);
  const adjustedFOB = fobValue * weightGainMultiplier;

  // ============================================
  // STEP 3: Build cost breakdown line items
  // ============================================

  // Base FOB Price
  lineItems.push({
    label: 'Base FOB Price',
    amountPerMT: fobValue,
    amountPerLb: fobValue / MT_TO_LB,
  });

  // Weight gain adjustment (if applicable)
  if (input.weightGainPercent > 0) {
    const weightGainCost = fobValue - adjustedFOB;
    lineItems.push({
      label: `Weight Gain (${input.weightGainPercent.toFixed(2)}%)`,
      description: 'Adjustment for mill vs theoretical weight',
      amountPerMT: -weightGainCost,
      amountPerLb: -weightGainCost / MT_TO_LB,
    });
  }

  // Ocean Freight
  if (input.incoterm === 'FOB') {
    const freightLabel = input.shippingType === 'container'
      ? `Ocean Freight ($${input.oceanFreight.toLocaleString()} ÷ ${input.containerCapacity} MT)`
      : `Ocean Freight`;
    lineItems.push({
      label: freightLabel,
      amountPerMT: freightPerMT,
      amountPerLb: freightPerMT / MT_TO_LB,
    });
  }

  // ============================================
  // STEP 4: Duties & Government Fees
  // ============================================

  // Section 232 Tariff (applied to FOB value)
  const section232 = adjustedFOB * (input.section232Rate / 100);
  lineItems.push({
    label: `Section 232 (${input.section232Rate}% × FOB)`,
    amountPerMT: section232,
    amountPerLb: section232 / MT_TO_LB,
  });

  // HMF (Harbor Maintenance Fee) - applied to FOB
  const hmf = adjustedFOB * (input.hmfRate / 100);
  lineItems.push({
    label: `HMF (${input.hmfRate}% × FOB)`,
    amountPerMT: hmf,
    amountPerLb: hmf / MT_TO_LB,
  });

  // MPF (Merchandise Processing Fee) - applied to FOB
  const mpf = adjustedFOB * (input.mpfRate / 100);
  if (input.mpfRate > 0) {
    lineItems.push({
      label: `MPF (${input.mpfRate}% × FOB)`,
      amountPerMT: mpf,
      amountPerLb: mpf / MT_TO_LB,
    });
  }

  // ============================================
  // STEP 5: Insurance (based on CIF value)
  // ============================================

  // Marine Insurance
  const marineIns = cifValue * (input.marineInsuranceRate / 100);
  lineItems.push({
    label: `Marine Insurance (${input.marineInsuranceRate}% × CIF)`,
    amountPerMT: marineIns,
    amountPerLb: marineIns / MT_TO_LB,
  });

  // Credit Insurance
  const creditIns = cifValue * (input.creditInsuranceRate / 100);
  lineItems.push({
    label: `Credit Insurance (${input.creditInsuranceRate}% × CIF)`,
    amountPerMT: creditIns,
    amountPerLb: creditIns / MT_TO_LB,
  });

  // ============================================
  // STEP 6: Finance Charges
  // ============================================

  // LC Pre-Cash Finance
  let lcFinance = 0;
  if (input.includeLCFinance) {
    lcFinance = (cifValue * (input.lcRate / 100) * input.lcDays) / DAYS_PER_YEAR;
    lineItems.push({
      label: `LC Pre-Cash (${input.lcRate}% × ${input.lcDays}d)`,
      amountPerMT: lcFinance,
      amountPerLb: lcFinance / MT_TO_LB,
    });
  }

  // Post-Sailing Finance (LC Sailing)
  let postSailingFinance = 0;
  if (input.includeFinancing) {
    const financingDays = input.waterDays + input.termsDays + input.bufferDays;
    postSailingFinance = (cifValue * (input.financingRate / 100) * financingDays) / DAYS_PER_YEAR;
    lineItems.push({
      label: `LC Sailing (${input.financingRate}% × ${financingDays}d)`,
      description: `${input.waterDays} water + ${input.termsDays} terms + ${input.bufferDays} buffer`,
      amountPerMT: postSailingFinance,
      amountPerLb: postSailingFinance / MT_TO_LB,
    });
  }

  // Tariff Finance
  let tariffFinance = 0;
  if (input.includeTariffFinance) {
    // Finance cost on the portion of tariff that is financed
    tariffFinance = (adjustedFOB * (input.section232Rate / 100) * (input.tariffFinancePercent / 100) *
      (input.tariffFinanceRate / 100) * input.tariffFinanceDays) / DAYS_PER_YEAR;
    lineItems.push({
      label: `Tariff Finance (${input.tariffFinancePercent}% × ${input.tariffFinanceRate}% × ${input.tariffFinanceDays}d)`,
      amountPerMT: tariffFinance,
      amountPerLb: tariffFinance / MT_TO_LB,
    });
  }

  // ============================================
  // STEP 7: Handling Costs
  // ============================================

  let handlingCost = 0;

  if (input.shippingType === 'container') {
    // Drayage / Destuffing (container shipping)
    if (input.drayagePerContainer > 0) {
      handlingCost = input.drayagePerContainer / input.destuffCapacity;
      lineItems.push({
        label: `Drayage ($${input.drayagePerContainer.toLocaleString()} ÷ ${input.destuffCapacity} MT)`,
        amountPerMT: handlingCost,
        amountPerLb: handlingCost / MT_TO_LB,
      });
    }
  } else {
    // Stevedoring (break bulk shipping)
    if (input.stevedoringPerMT > 0) {
      handlingCost = input.stevedoringPerMT;
      lineItems.push({
        label: `Stevedoring`,
        amountPerMT: handlingCost,
        amountPerLb: handlingCost / MT_TO_LB,
      });
    }
  }

  // ============================================
  // STEP 8: Storage
  // ============================================

  let storageCost = 0;
  if (input.storagePerMTPerMonth > 0 && input.storageMonths > 0) {
    storageCost = input.storagePerMTPerMonth * input.storageMonths;
    lineItems.push({
      label: `Storage ($${input.storagePerMTPerMonth}/MT × ${input.storageMonths} mo)`,
      amountPerMT: storageCost,
      amountPerLb: storageCost / MT_TO_LB,
    });
  }

  // ============================================
  // STEP 9: Broker Fees
  // ============================================

  let brokerCost = 0;
  if (input.brokerFee > 0) {
    if (input.brokerFeeType === 'perMT') {
      brokerCost = input.brokerFee;
      lineItems.push({
        label: `Broker Fee`,
        amountPerMT: brokerCost,
        amountPerLb: brokerCost / MT_TO_LB,
      });
    } else if (input.brokerFeeType === 'perContainer') {
      brokerCost = (input.brokerFee * input.brokerContainers) / input.containerCapacity;
      lineItems.push({
        label: `Broker Fee ($${input.brokerFee} × ${input.brokerContainers} FCL)`,
        amountPerMT: brokerCost,
        amountPerLb: brokerCost / MT_TO_LB,
      });
    } else {
      // Flat fee - divide by container capacity as approximation
      brokerCost = input.brokerFee / input.containerCapacity;
      lineItems.push({
        label: `Broker Fee (flat)`,
        amountPerMT: brokerCost,
        amountPerLb: brokerCost / MT_TO_LB,
      });
    }
  }

  // ============================================
  // STEP 10: Commission
  // ============================================

  let commission = 0;
  if (input.commissionRate > 0) {
    commission = adjustedFOB * (input.commissionRate / 100);
    const commissionLabel = input.commissionName
      ? `${input.commissionName} (${input.commissionRate}% × FOB)`
      : `Commission (${input.commissionRate}% × FOB)`;
    lineItems.push({
      label: commissionLabel,
      amountPerMT: commission,
      amountPerLb: commission / MT_TO_LB,
    });
  }

  // ============================================
  // STEP 11: Calculate Totals
  // ============================================

  // Sum all costs for total landed cost
  const totalLandedCostMT =
    adjustedFOB +
    freightPerMT +
    section232 +
    hmf +
    mpf +
    marineIns +
    creditIns +
    lcFinance +
    postSailingFinance +
    tariffFinance +
    handlingCost +
    storageCost +
    brokerCost +
    commission;

  const totalLandedCostLb = totalLandedCostMT / MT_TO_LB;

  // ============================================
  // STEP 12: Calculate Margin
  // ============================================

  let targetSalePrice: number;
  let marginAmount: number;
  let marginPercent: number;

  if (input.targetSalePrice > 0) {
    // User specified a target sale price - calculate margin from it
    targetSalePrice = input.targetSalePrice;
    marginAmount = targetSalePrice - totalLandedCostLb;
    marginPercent = (marginAmount / targetSalePrice) * 100;
  } else if (input.targetMarginPercent > 0) {
    // User specified a margin percent - calculate sale price
    marginPercent = input.targetMarginPercent;
    targetSalePrice = totalLandedCostLb / (1 - marginPercent / 100);
    marginAmount = targetSalePrice - totalLandedCostLb;
  } else {
    // No margin specified
    targetSalePrice = totalLandedCostLb;
    marginAmount = 0;
    marginPercent = 0;
  }

  return {
    fobValue,
    adjustedFOB,
    freightPerMT,
    cifValue,
    lineItems,
    totalLandedCostMT,
    totalLandedCostLb,
    marginAmount,
    marginPercent,
    targetSalePrice,
  };
}

/**
 * Calculate margin if sold at a specific price
 */
export function calculateMarginAtPrice(landedCostLb: number, salePrice: number): { amount: number; percent: number } {
  const amount = salePrice - landedCostLb;
  const percent = (amount / salePrice) * 100;
  return { amount, percent };
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return value.toFixed(decimals) + '%';
}
