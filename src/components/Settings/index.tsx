import { useState } from 'react';
import { useAppSettings } from '../../hooks/useAppSettings';
import { NumberInput } from '../common';
import type { Supplier, Customer } from '../../types';

type SettingsTab = 'suppliers' | 'customers' | 'rates' | 'ports';

export function Settings({ onClose }: { onClose: () => void }) {
  const {
    settings,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    updateDefaultRates,
    updateDrayageByPort,
    updateStorageByPort,
    resetToDefaults,
  } = useAppSettings();

  const [activeTab, setActiveTab] = useState<SettingsTab>('suppliers');
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const handleAddSupplier = () => {
    const newSupplier: Supplier = {
      id: `supplier-${Date.now()}`,
      name: 'New Supplier',
      defaultOriginCountry: 'Taiwan',
      defaultOriginPort: 'Kaohsiung',
      defaultIncoterm: 'FOB',
      weightBasis: 'actual',
      defaultWeightGainPercent: 0,
      agentName: '',
      agentFeePercent: 0,
    };
    addSupplier(newSupplier);
    setEditingSupplier(newSupplier);
  };

  const handleAddCustomer = () => {
    const newCustomer: Customer = {
      id: `customer-${Date.now()}`,
      name: 'New Customer',
      defaultDestinationPort: 'Los Angeles',
      creditInsuranceRate: 0.11,
      paymentTermsDays: 30,
    };
    addCustomer(newCustomer);
    setEditingCustomer(newCustomer);
  };

  const tabs: { key: SettingsTab; label: string }[] = [
    { key: 'suppliers', label: 'Suppliers' },
    { key: 'customers', label: 'Customers' },
    { key: 'rates', label: 'Default Rates' },
    { key: 'ports', label: 'Port Rates' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Settings</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (confirm('Reset all settings to defaults? This cannot be undone.')) {
                    resetToDefaults();
                  }
                }}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Reset to Defaults
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex px-6 -mb-px">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-3 px-4 text-sm font-medium border-b-2 ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Suppliers Tab */}
            {activeTab === 'suppliers' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">Manage supplier configurations and defaults</p>
                  <button
                    onClick={handleAddSupplier}
                    className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Supplier
                  </button>
                </div>

                <div className="space-y-2">
                  {settings.suppliers.map(supplier => (
                    <div
                      key={supplier.id}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      {editingSupplier?.id === supplier.id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editingSupplier.name}
                            onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Supplier Name"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={editingSupplier.defaultOriginCountry}
                              onChange={(e) => setEditingSupplier({ ...editingSupplier, defaultOriginCountry: e.target.value })}
                              className="px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Origin Country"
                            />
                            <input
                              type="text"
                              value={editingSupplier.defaultOriginPort}
                              onChange={(e) => setEditingSupplier({ ...editingSupplier, defaultOriginPort: e.target.value })}
                              className="px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Origin Port"
                            />
                            <select
                              value={editingSupplier.defaultIncoterm}
                              onChange={(e) => setEditingSupplier({ ...editingSupplier, defaultIncoterm: e.target.value as 'FOB' | 'CIF' })}
                              className="px-3 py-2 border border-gray-300 rounded-md"
                            >
                              <option value="FOB">FOB</option>
                              <option value="CIF">CIF</option>
                            </select>
                            <select
                              value={editingSupplier.weightBasis}
                              onChange={(e) => setEditingSupplier({ ...editingSupplier, weightBasis: e.target.value as 'actual' | 'theoretical' })}
                              className="px-3 py-2 border border-gray-300 rounded-md"
                            >
                              <option value="actual">Actual Weight</option>
                              <option value="theoretical">Theoretical Weight</option>
                            </select>
                            <input
                              type="number"
                              value={editingSupplier.defaultWeightGainPercent}
                              onChange={(e) => setEditingSupplier({ ...editingSupplier, defaultWeightGainPercent: parseFloat(e.target.value) || 0 })}
                              className="px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Weight Gain %"
                              step={0.01}
                            />
                            <input
                              type="text"
                              value={editingSupplier.agentName}
                              onChange={(e) => setEditingSupplier({ ...editingSupplier, agentName: e.target.value })}
                              className="px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Agent Name"
                            />
                            <input
                              type="number"
                              value={editingSupplier.agentFeePercent}
                              onChange={(e) => setEditingSupplier({ ...editingSupplier, agentFeePercent: parseFloat(e.target.value) || 0 })}
                              className="px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Agent Fee %"
                              step={0.01}
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                updateSupplier(editingSupplier.id, editingSupplier);
                                setEditingSupplier(null);
                              }}
                              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingSupplier(null)}
                              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-800">{supplier.name}</p>
                            <p className="text-sm text-gray-500">
                              {supplier.defaultOriginCountry} | {supplier.defaultIncoterm} |
                              {supplier.agentName ? ` ${supplier.agentName} ${supplier.agentFeePercent}%` : ' No agent'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingSupplier({ ...supplier })}
                              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete ${supplier.name}?`)) {
                                  deleteSupplier(supplier.id);
                                }
                              }}
                              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customers Tab */}
            {activeTab === 'customers' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">Manage customer configurations and defaults</p>
                  <button
                    onClick={handleAddCustomer}
                    className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Customer
                  </button>
                </div>

                <div className="space-y-2">
                  {settings.customers.map(customer => (
                    <div
                      key={customer.id}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      {editingCustomer?.id === customer.id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editingCustomer.name}
                            onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Customer Name"
                          />
                          <div className="grid grid-cols-3 gap-3">
                            <input
                              type="text"
                              value={editingCustomer.defaultDestinationPort}
                              onChange={(e) => setEditingCustomer({ ...editingCustomer, defaultDestinationPort: e.target.value })}
                              className="px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Destination Port"
                            />
                            <input
                              type="number"
                              value={editingCustomer.creditInsuranceRate}
                              onChange={(e) => setEditingCustomer({ ...editingCustomer, creditInsuranceRate: parseFloat(e.target.value) || 0 })}
                              className="px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Credit Ins. %"
                              step={0.01}
                            />
                            <input
                              type="number"
                              value={editingCustomer.paymentTermsDays}
                              onChange={(e) => setEditingCustomer({ ...editingCustomer, paymentTermsDays: parseInt(e.target.value) || 0 })}
                              className="px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Payment Terms (days)"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                updateCustomer(editingCustomer.id, editingCustomer);
                                setEditingCustomer(null);
                              }}
                              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingCustomer(null)}
                              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-800">{customer.name}</p>
                            <p className="text-sm text-gray-500">
                              {customer.defaultDestinationPort} | {customer.paymentTermsDays} days | CI: {customer.creditInsuranceRate}%
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingCustomer({ ...customer })}
                              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete ${customer.name}?`)) {
                                  deleteCustomer(customer.id);
                                }
                              }}
                              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Default Rates Tab */}
            {activeTab === 'rates' && (
              <div className="space-y-6">
                <p className="text-sm text-gray-600">Configure default rates for new calculations</p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <NumberInput
                    label="Section 232 Rate"
                    value={settings.defaultRates.section232Rate}
                    onChange={(v) => updateDefaultRates({ section232Rate: v })}
                    suffix="%"
                  />
                  <NumberInput
                    label="HMF Rate"
                    value={settings.defaultRates.hmfRate}
                    onChange={(v) => updateDefaultRates({ hmfRate: v })}
                    suffix="%"
                  />
                  <NumberInput
                    label="MPF Rate"
                    value={settings.defaultRates.mpfRate}
                    onChange={(v) => updateDefaultRates({ mpfRate: v })}
                    suffix="%"
                  />
                  <NumberInput
                    label="Marine Insurance"
                    value={settings.defaultRates.marineInsuranceRate}
                    onChange={(v) => updateDefaultRates({ marineInsuranceRate: v })}
                    suffix="%"
                  />
                  <NumberInput
                    label="Credit Insurance"
                    value={settings.defaultRates.creditInsuranceRate}
                    onChange={(v) => updateDefaultRates({ creditInsuranceRate: v })}
                    suffix="%"
                  />
                  <NumberInput
                    label="LC Rate"
                    value={settings.defaultRates.lcRate}
                    onChange={(v) => updateDefaultRates({ lcRate: v })}
                    suffix="%"
                  />
                  <NumberInput
                    label="Financing Rate"
                    value={settings.defaultRates.financingRate}
                    onChange={(v) => updateDefaultRates({ financingRate: v })}
                    suffix="%"
                  />
                  <NumberInput
                    label="Tariff Finance Rate"
                    value={settings.defaultRates.tariffFinanceRate}
                    onChange={(v) => updateDefaultRates({ tariffFinanceRate: v })}
                    suffix="%"
                  />
                  <NumberInput
                    label="Commission Rate"
                    value={settings.defaultRates.defaultCommissionRate}
                    onChange={(v) => updateDefaultRates({ defaultCommissionRate: v })}
                    suffix="%"
                  />
                  <NumberInput
                    label="20ft Container Capacity"
                    value={settings.defaultRates.defaultContainerCapacity20ft}
                    onChange={(v) => updateDefaultRates({ defaultContainerCapacity20ft: v })}
                    suffix="MT"
                  />
                  <NumberInput
                    label="40ft Container Capacity"
                    value={settings.defaultRates.defaultContainerCapacity40ft}
                    onChange={(v) => updateDefaultRates({ defaultContainerCapacity40ft: v })}
                    suffix="MT"
                  />
                  <NumberInput
                    label="Destuff Capacity"
                    value={settings.defaultRates.defaultDestuffCapacity}
                    onChange={(v) => updateDefaultRates({ defaultDestuffCapacity: v })}
                    suffix="MT"
                  />
                </div>
              </div>
            )}

            {/* Port Rates Tab */}
            {activeTab === 'ports' && (
              <div className="space-y-6">
                <p className="text-sm text-gray-600">Configure drayage and storage rates by port</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Drayage Rates */}
                  <div>
                    <h3 className="font-medium text-gray-800 mb-3">Drayage Rates ($/container)</h3>
                    <div className="space-y-2">
                      {Object.entries(settings.drayageByPort).map(([port, rate]) => (
                        <div key={port} className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 w-24">{port}</span>
                          <input
                            type="number"
                            value={rate}
                            onChange={(e) => updateDrayageByPort(port, parseFloat(e.target.value) || 0)}
                            className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Storage Rates */}
                  <div>
                    <h3 className="font-medium text-gray-800 mb-3">Storage Rates ($/MT/month)</h3>
                    <div className="space-y-2">
                      {Object.entries(settings.storageByPort).map(([port, rate]) => (
                        <div key={port} className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 w-24">{port}</span>
                          <input
                            type="number"
                            value={rate}
                            onChange={(e) => updateStorageByPort(port, parseFloat(e.target.value) || 0)}
                            className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                            step={0.1}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
