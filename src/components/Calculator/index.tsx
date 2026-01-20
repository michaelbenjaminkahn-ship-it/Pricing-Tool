import { useState, useMemo, useCallback } from 'react';
import { InputSection } from './InputSection';
import { CostBreakdown } from './CostBreakdown';
import { WeightGainPicker } from './WeightGainPicker';
import { useAppSettings } from '../../hooks/useAppSettings';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { calculateCostBreakdown } from '../../utils/calculations';
import { DEFAULT_PRICING_INPUT } from '../../data/defaults';
import type { PricingInput, Scenario } from '../../types';

export function Calculator() {
  const { settings } = useAppSettings();
  const [input, setInput] = useLocalStorage<PricingInput>('steel-pricing-current-input', DEFAULT_PRICING_INPUT);
  const [showWeightGainPicker, setShowWeightGainPicker] = useState(false);
  const [scenarios, setScenarios] = useLocalStorage<Scenario[]>('steel-pricing-scenarios', []);
  const [compareScenario, setCompareScenario] = useState<Scenario | null>(null);

  // Calculate cost breakdown whenever input changes
  const breakdown = useMemo(() => {
    return calculateCostBreakdown(input);
  }, [input]);

  // Handle input changes
  const handleInputChange = useCallback((updates: Partial<PricingInput>) => {
    setInput(prev => ({ ...prev, ...updates }));
  }, [setInput]);

  // Handle weight gain selection
  const handleWeightGainSelect = useCallback((percentGain: number) => {
    setInput(prev => ({ ...prev, weightGainPercent: percentGain }));
  }, [setInput]);

  // Save current calculation as scenario
  const handleSaveScenario = useCallback(() => {
    const name = prompt('Enter a name for this scenario:');
    if (name) {
      const scenario: Scenario = {
        id: Date.now().toString(),
        name,
        createdAt: new Date().toISOString(),
        input: { ...input },
        breakdown: { ...breakdown },
      };
      setScenarios(prev => [...prev, scenario]);
    }
  }, [input, breakdown, setScenarios]);

  // Load a scenario
  const handleLoadScenario = useCallback((scenario: Scenario) => {
    setInput(scenario.input);
  }, [setInput]);

  // Delete a scenario
  const handleDeleteScenario = useCallback((id: string) => {
    setScenarios(prev => prev.filter(s => s.id !== id));
    if (compareScenario?.id === id) {
      setCompareScenario(null);
    }
  }, [setScenarios, compareScenario]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    if (confirm('Reset all inputs to defaults?')) {
      setInput(DEFAULT_PRICING_INPUT);
    }
  }, [setInput]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Steel Pricing Calculator</h1>
              <p className="text-sm text-gray-500">Stainless Steel Import Landed Cost Tool</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveScenario}
                disabled={input.basePrice <= 0}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Scenario
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            <InputSection
              input={input}
              onChange={handleInputChange}
              suppliers={settings.suppliers}
              customers={settings.customers}
              ports={settings.ports}
              weightGainTable={settings.weightGainTable}
              drayageByPort={settings.drayageByPort}
              storageByPort={settings.storageByPort}
              onOpenWeightGainPicker={() => setShowWeightGainPicker(true)}
            />
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            <CostBreakdown breakdown={breakdown} input={input} />

            {/* Saved Scenarios */}
            {scenarios.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Saved Scenarios</h2>
                <div className="space-y-2">
                  {scenarios.map(scenario => (
                    <div
                      key={scenario.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{scenario.name}</p>
                        <p className="text-sm text-gray-500">
                          Landed: ${scenario.breakdown.totalLandedCostLb.toFixed(4)}/lb
                          <span className="mx-2">|</span>
                          {new Date(scenario.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCompareScenario(compareScenario?.id === scenario.id ? null : scenario)}
                          className={`px-3 py-1 text-xs font-medium rounded ${
                            compareScenario?.id === scenario.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {compareScenario?.id === scenario.id ? 'Comparing' : 'Compare'}
                        </button>
                        <button
                          onClick={() => handleLoadScenario(scenario)}
                          className="px-3 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteScenario(scenario.id)}
                          className="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comparison View */}
            {compareScenario && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Comparison: Current vs {compareScenario.name}
                </h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-2">Metric</th>
                      <th className="text-right py-2">Current</th>
                      <th className="text-right py-2">{compareScenario.name}</th>
                      <th className="text-right py-2">Diff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="py-2">FOB Price</td>
                      <td className="text-right font-mono">${breakdown.fobValue.toFixed(2)}</td>
                      <td className="text-right font-mono">${compareScenario.breakdown.fobValue.toFixed(2)}</td>
                      <td className={`text-right font-mono ${breakdown.fobValue - compareScenario.breakdown.fobValue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {(breakdown.fobValue - compareScenario.breakdown.fobValue) >= 0 ? '+' : ''}
                        ${(breakdown.fobValue - compareScenario.breakdown.fobValue).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2">Landed $/MT</td>
                      <td className="text-right font-mono">${breakdown.totalLandedCostMT.toFixed(2)}</td>
                      <td className="text-right font-mono">${compareScenario.breakdown.totalLandedCostMT.toFixed(2)}</td>
                      <td className={`text-right font-mono ${breakdown.totalLandedCostMT - compareScenario.breakdown.totalLandedCostMT > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {(breakdown.totalLandedCostMT - compareScenario.breakdown.totalLandedCostMT) >= 0 ? '+' : ''}
                        ${(breakdown.totalLandedCostMT - compareScenario.breakdown.totalLandedCostMT).toFixed(2)}
                      </td>
                    </tr>
                    <tr className="font-semibold">
                      <td className="py-2">Landed $/lb</td>
                      <td className="text-right font-mono">${breakdown.totalLandedCostLb.toFixed(4)}</td>
                      <td className="text-right font-mono">${compareScenario.breakdown.totalLandedCostLb.toFixed(4)}</td>
                      <td className={`text-right font-mono ${breakdown.totalLandedCostLb - compareScenario.breakdown.totalLandedCostLb > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {(breakdown.totalLandedCostLb - compareScenario.breakdown.totalLandedCostLb) >= 0 ? '+' : ''}
                        ${(breakdown.totalLandedCostLb - compareScenario.breakdown.totalLandedCostLb).toFixed(4)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Weight Gain Picker Modal */}
      <WeightGainPicker
        isOpen={showWeightGainPicker}
        onClose={() => setShowWeightGainPicker(false)}
        onSelect={handleWeightGainSelect}
        weightGainTable={settings.weightGainTable}
      />
    </div>
  );
}
