import type { WeightGainEntry } from '../../types';

interface WeightGainPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (percentGain: number) => void;
  weightGainTable: WeightGainEntry[];
}

export function WeightGainPicker({
  isOpen,
  onClose,
  onSelect,
  weightGainTable,
}: WeightGainPickerProps) {
  if (!isOpen) return null;

  const handleSelect = (percentGain: number) => {
    onSelect(percentGain);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Weight Gains by Thickness</h2>
              <p className="text-sm text-gray-500">304/L and 316/L - Click a row to select</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-y-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">
                    Thickness
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 border-b">
                    Sell Weight
                    <span className="block text-xs font-normal text-gray-500">lb/sq.ft</span>
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 border-b">
                    Buy Weight
                    <span className="block text-xs font-normal text-gray-500">lb/sq.ft</span>
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 border-b">
                    % Gain
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {weightGainTable.map((entry, index) => (
                  <tr
                    key={index}
                    onClick={() => handleSelect(entry.percentGain)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {entry.thickness}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 font-mono">
                      {entry.sellWeight.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 font-mono">
                      {entry.buyWeight.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      <span className={`px-2 py-1 rounded ${
                        entry.percentGain >= 5 ? 'bg-red-100 text-red-700' :
                        entry.percentGain >= 3 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {entry.percentGain.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500">
              Weight gain represents the difference between theoretical (sell) weight and actual (buy) weight.
              Higher percentages mean you pay for more weight than you receive.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
