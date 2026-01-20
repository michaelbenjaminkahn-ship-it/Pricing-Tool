import { useMemo, useState } from 'react';
import type { CostBreakdown as CostBreakdownType, PricingInput } from '../../types';
import { formatCurrency, formatPercent, calculateMarginAtPrice } from '../../utils/calculations';

interface CostBreakdownProps {
  breakdown: CostBreakdownType;
  input: PricingInput;
}

export function CostBreakdown({ breakdown, input }: CostBreakdownProps) {
  const [whatIfPrice, setWhatIfPrice] = useState<number>(0);

  const whatIfMargin = useMemo(() => {
    if (whatIfPrice > 0) {
      return calculateMarginAtPrice(breakdown.totalLandedCostLb, whatIfPrice);
    }
    return null;
  }, [whatIfPrice, breakdown.totalLandedCostLb]);

  if (input.basePrice <= 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Cost Breakdown</h2>
        <p className="text-gray-500 italic">Enter a base price to see the cost breakdown</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Cost Breakdown</h2>
        <button
          onClick={() => window.print()}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print
        </button>
      </div>

      {/* Product info header */}
      {(input.productGrade || input.productSize) && (
        <div className="mb-4 pb-4 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            {input.productGrade && <span className="font-medium">{input.productGrade}</span>}
            {input.productGrade && input.productSize && ' - '}
            {input.productSize && <span>{input.productSize}</span>}
          </p>
        </div>
      )}

      {/* Cost breakdown table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left py-2 font-semibold text-gray-700">COST BREAKDOWN</th>
              <th className="text-right py-2 font-semibold text-gray-700 w-28">$/MT</th>
              <th className="text-right py-2 font-semibold text-gray-700 w-28">$/lb</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {breakdown.lineItems.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="py-2 text-gray-700">
                  {item.label}
                  {item.description && (
                    <span className="text-gray-400 text-xs ml-2">({item.description})</span>
                  )}
                </td>
                <td className="text-right py-2 text-gray-700 font-mono">
                  {item.amountPerMT < 0 ? '-' : ''}${formatCurrency(Math.abs(item.amountPerMT))}
                </td>
                <td className="text-right py-2 text-gray-700 font-mono">
                  {item.amountPerLb < 0 ? '-' : ''}${formatCurrency(Math.abs(item.amountPerLb), 4)}
                </td>
              </tr>
            ))}

            {/* CIF Value subtotal */}
            <tr className="border-t border-gray-300 bg-gray-50">
              <td className="py-2 font-medium text-gray-800">CIF Value</td>
              <td className="text-right py-2 font-medium text-gray-800 font-mono">
                ${formatCurrency(breakdown.cifValue)}
              </td>
              <td className="text-right py-2 font-medium text-gray-800 font-mono">
                ${formatCurrency(breakdown.cifValue / 2204.62, 4)}
              </td>
            </tr>

            {/* Total Landed Cost */}
            <tr className="border-t-2 border-gray-400 bg-blue-50">
              <td className="py-3 font-bold text-gray-900 text-base">TOTAL LANDED COST</td>
              <td className="text-right py-3 font-bold text-gray-900 font-mono text-base">
                ${formatCurrency(breakdown.totalLandedCostMT)}
              </td>
              <td className="text-right py-3 font-bold text-gray-900 font-mono text-base">
                ${formatCurrency(breakdown.totalLandedCostLb, 4)}
              </td>
            </tr>

            {/* Margin */}
            {(input.targetMarginPercent > 0 || input.targetSalePrice > 0) && (
              <>
                <tr className="bg-green-50">
                  <td className="py-2 text-gray-700">
                    Margin ({formatPercent(breakdown.marginPercent)})
                  </td>
                  <td className="text-right py-2 text-gray-700 font-mono">-</td>
                  <td className="text-right py-2 text-gray-700 font-mono">
                    ${formatCurrency(breakdown.marginAmount, 4)}
                  </td>
                </tr>
                <tr className="border-t-2 border-green-400 bg-green-100">
                  <td className="py-3 font-bold text-green-800 text-base">TARGET SALE PRICE</td>
                  <td className="text-right py-3 font-bold text-green-800 font-mono text-base">-</td>
                  <td className="text-right py-3 font-bold text-green-800 font-mono text-base">
                    ${formatCurrency(breakdown.targetSalePrice, 4)}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* What-if calculator */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">What-If Calculator</h3>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">If sold at $</span>
          <input
            type="number"
            value={whatIfPrice || ''}
            onChange={(e) => setWhatIfPrice(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            step={0.01}
            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm font-mono"
          />
          <span className="text-sm text-gray-600">/lb:</span>
          {whatIfMargin && (
            <span className={`text-sm font-medium ${whatIfMargin.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Margin: ${formatCurrency(whatIfMargin.amount, 4)} ({formatPercent(whatIfMargin.percent)})
            </span>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div className="mt-6 pt-4 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 uppercase">FOB Value</p>
          <p className="text-lg font-semibold text-gray-800">${formatCurrency(breakdown.fobValue)}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 uppercase">Adjusted FOB</p>
          <p className="text-lg font-semibold text-gray-800">${formatCurrency(breakdown.adjustedFOB)}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 uppercase">CIF Value</p>
          <p className="text-lg font-semibold text-gray-800">${formatCurrency(breakdown.cifValue)}</p>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-600 uppercase">Landed $/lb</p>
          <p className="text-lg font-bold text-blue-800">${formatCurrency(breakdown.totalLandedCostLb, 4)}</p>
        </div>
      </div>
    </div>
  );
}
