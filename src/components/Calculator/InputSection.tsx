import { NumberInput, Select, RadioGroup, Checkbox, Collapsible } from '../common';
import type { PricingInput, Supplier, Customer, Port, WeightGainEntry } from '../../types';
import { ORIGIN_COUNTRIES, getDestinationPorts } from '../../data/defaults';

interface InputSectionProps {
  input: PricingInput;
  onChange: (updates: Partial<PricingInput>) => void;
  suppliers: Supplier[];
  customers: Customer[];
  ports: Port[];
  weightGainTable: WeightGainEntry[];
  drayageByPort: Record<string, number>;
  storageByPort: Record<string, number>;
  onOpenWeightGainPicker: () => void;
}

export function InputSection({
  input,
  onChange,
  suppliers,
  customers,
  ports,
  drayageByPort,
  storageByPort,
  onOpenWeightGainPicker,
}: InputSectionProps) {
  const destinationPorts = getDestinationPorts(ports);

  // Handle supplier selection - auto-fill defaults
  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier) {
      onChange({
        supplierId,
        originCountry: supplier.defaultOriginCountry,
        originPort: supplier.defaultOriginPort,
        incoterm: supplier.defaultIncoterm,
        weightGainPercent: supplier.defaultWeightGainPercent,
        commissionName: supplier.agentName,
        commissionRate: supplier.agentFeePercent,
      });
    } else {
      onChange({ supplierId });
    }
  };

  // Handle customer selection - auto-fill defaults
  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      const drayage = drayageByPort[customer.defaultDestinationPort] || input.drayagePerContainer;
      const storage = storageByPort[customer.defaultDestinationPort] || input.storagePerMTPerMonth;
      onChange({
        customerId,
        destinationPort: customer.defaultDestinationPort,
        creditInsuranceRate: customer.creditInsuranceRate,
        termsDays: customer.paymentTermsDays,
        drayagePerContainer: drayage,
        storagePerMTPerMonth: storage,
      });
    } else {
      onChange({ customerId });
    }
  };

  // Handle destination port change - update drayage/storage rates
  const handleDestinationPortChange = (portName: string) => {
    const drayage = drayageByPort[portName] || input.drayagePerContainer;
    const storage = storageByPort[portName] || input.storagePerMTPerMonth;
    onChange({
      destinationPort: portName,
      drayagePerContainer: drayage,
      storagePerMTPerMonth: storage,
    });
  };

  // Handle container size change - update capacity
  const handleContainerSizeChange = (size: '20ft' | '40ft') => {
    onChange({
      containerSize: size,
      containerCapacity: size === '20ft' ? 19 : 38,
    });
  };

  return (
    <div className="space-y-6">
      {/* Deal Parameters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Deal Parameters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Select
            label="Supplier"
            value={input.supplierId}
            onChange={handleSupplierChange}
            options={suppliers.map(s => ({ value: s.id, label: s.name }))}
            placeholder="Select supplier..."
          />
          <Select
            label="Customer"
            value={input.customerId}
            onChange={handleCustomerChange}
            options={customers.map(c => ({ value: c.id, label: c.name }))}
            placeholder="Select customer..."
          />
          <Select
            label="Origin Country"
            value={input.originCountry}
            onChange={(v) => onChange({ originCountry: v })}
            options={ORIGIN_COUNTRIES.map(c => ({ value: c, label: c }))}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Origin Port</label>
            <input
              type="text"
              value={input.originPort}
              onChange={(e) => onChange({ originPort: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <Select
            label="Destination Port"
            value={input.destinationPort}
            onChange={handleDestinationPortChange}
            options={destinationPorts.map(p => ({ value: p.name, label: p.name }))}
          />
          <RadioGroup
            label="Incoterm"
            value={input.incoterm}
            onChange={(v) => onChange({ incoterm: v as 'FOB' | 'CIF' })}
            options={[
              { value: 'FOB', label: 'FOB' },
              { value: 'CIF', label: 'CIF' },
            ]}
          />
          <RadioGroup
            label="Shipping Type"
            value={input.shippingType}
            onChange={(v) => onChange({ shippingType: v as 'container' | 'breakBulk' })}
            options={[
              { value: 'container', label: 'Container (FCL)' },
              { value: 'breakBulk', label: 'Break Bulk' },
            ]}
          />
          {input.shippingType === 'container' && (
            <RadioGroup
              label="Container Size"
              value={input.containerSize}
              onChange={(v) => handleContainerSizeChange(v as '20ft' | '40ft')}
              options={[
                { value: '20ft', label: '20ft' },
                { value: '40ft', label: '40ft' },
              ]}
            />
          )}
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NumberInput
            label={input.incoterm === 'FOB' ? 'FOB Price ($/MT)' : 'CIF Price ($/MT)'}
            value={input.basePrice}
            onChange={(v) => onChange({ basePrice: v })}
            prefix="$"
            min={0}
          />
          {input.incoterm === 'FOB' && (
            <NumberInput
              label={input.shippingType === 'container' ? 'Ocean Freight ($/container)' : 'Ocean Freight ($/MT)'}
              value={input.oceanFreight}
              onChange={(v) => onChange({ oceanFreight: v })}
              prefix="$"
              min={0}
            />
          )}
          {input.shippingType === 'container' && (
            <NumberInput
              label="Container Capacity (MT)"
              value={input.containerCapacity}
              onChange={(v) => onChange({ containerCapacity: v })}
              suffix="MT"
              min={1}
            />
          )}
        </div>
      </div>

      {/* Product Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Product Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Product Grade</label>
            <input
              type="text"
              value={input.productGrade}
              onChange={(e) => onChange({ productGrade: e.target.value })}
              placeholder="e.g., 304/L"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Product Size</label>
            <input
              type="text"
              value={input.productSize}
              onChange={(e) => onChange({ productSize: e.target.value })}
              placeholder="e.g., 1/2 inch"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              Weight Gain %
              <button
                type="button"
                onClick={onOpenWeightGainPicker}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                (lookup table)
              </button>
            </label>
            <input
              type="number"
              value={input.weightGainPercent || ''}
              onChange={(e) => onChange({ weightGainPercent: parseFloat(e.target.value) || 0 })}
              step={0.01}
              min={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Duties & Fees */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Duties & Fees</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NumberInput
            label="Section 232 Rate"
            value={input.section232Rate}
            onChange={(v) => onChange({ section232Rate: v })}
            suffix="%"
            min={0}
            max={100}
            tooltip="Applied to FOB value"
          />
          <NumberInput
            label="HMF Rate"
            value={input.hmfRate}
            onChange={(v) => onChange({ hmfRate: v })}
            suffix="%"
            min={0}
            tooltip="Harbor Maintenance Fee - applied to FOB"
          />
          <NumberInput
            label="MPF Rate"
            value={input.mpfRate}
            onChange={(v) => onChange({ mpfRate: v })}
            suffix="%"
            min={0}
            tooltip="Merchandise Processing Fee - applied to FOB"
          />
        </div>
      </div>

      {/* Insurance */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Insurance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumberInput
            label="Marine Insurance Rate"
            value={input.marineInsuranceRate}
            onChange={(v) => onChange({ marineInsuranceRate: v })}
            suffix="%"
            min={0}
            tooltip="Applied to CIF value"
          />
          <NumberInput
            label="Credit Insurance Rate"
            value={input.creditInsuranceRate}
            onChange={(v) => onChange({ creditInsuranceRate: v })}
            suffix="%"
            min={0}
            tooltip="Applied to CIF value"
          />
        </div>
      </div>

      {/* Finance - Collapsible */}
      <Collapsible title="Finance Options" defaultOpen={true}>
        <div className="space-y-4">
          {/* LC Pre-Cash */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <Checkbox
              label="Include LC Finance (Pre-Cash)"
              checked={input.includeLCFinance}
              onChange={(v) => onChange({ includeLCFinance: v })}
              className="mb-3"
            />
            {input.includeLCFinance && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <NumberInput
                  label="LC Rate"
                  value={input.lcRate}
                  onChange={(v) => onChange({ lcRate: v })}
                  suffix="%"
                  min={0}
                />
                <NumberInput
                  label="Days"
                  value={input.lcDays}
                  onChange={(v) => onChange({ lcDays: v })}
                  suffix="days"
                  min={0}
                  step={1}
                />
              </div>
            )}
          </div>

          {/* Post-Sailing Finance */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <Checkbox
              label="Include Financing (Post-Sailing / LC Sailing)"
              checked={input.includeFinancing}
              onChange={(v) => onChange({ includeFinancing: v })}
              className="mb-3"
            />
            {input.includeFinancing && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                <NumberInput
                  label="Finance Rate"
                  value={input.financingRate}
                  onChange={(v) => onChange({ financingRate: v })}
                  suffix="%"
                  min={0}
                />
                <NumberInput
                  label="Water Days"
                  value={input.waterDays}
                  onChange={(v) => onChange({ waterDays: v })}
                  suffix="days"
                  min={0}
                  step={1}
                />
                <NumberInput
                  label="Terms Days"
                  value={input.termsDays}
                  onChange={(v) => onChange({ termsDays: v })}
                  suffix="days"
                  min={0}
                  step={1}
                />
                <NumberInput
                  label="Buffer Days"
                  value={input.bufferDays}
                  onChange={(v) => onChange({ bufferDays: v })}
                  suffix="days"
                  min={0}
                  step={1}
                />
              </div>
            )}
          </div>

          {/* Tariff Finance */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <Checkbox
              label="Include Tariff Finance"
              checked={input.includeTariffFinance}
              onChange={(v) => onChange({ includeTariffFinance: v })}
              className="mb-3"
            />
            {input.includeTariffFinance && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <NumberInput
                  label="Finance %"
                  value={input.tariffFinancePercent}
                  onChange={(v) => onChange({ tariffFinancePercent: v })}
                  suffix="%"
                  min={0}
                  max={100}
                  tooltip="Portion of tariff financed"
                />
                <NumberInput
                  label="Finance Rate"
                  value={input.tariffFinanceRate}
                  onChange={(v) => onChange({ tariffFinanceRate: v })}
                  suffix="%"
                  min={0}
                />
                <NumberInput
                  label="Days"
                  value={input.tariffFinanceDays}
                  onChange={(v) => onChange({ tariffFinanceDays: v })}
                  suffix="days"
                  min={0}
                  step={1}
                />
              </div>
            )}
          </div>
        </div>
      </Collapsible>

      {/* Handling & Other */}
      <Collapsible title="Handling & Other Costs" defaultOpen={true}>
        <div className="space-y-4">
          {/* Container handling */}
          {input.shippingType === 'container' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumberInput
                label="Drayage / Destuffing ($/container)"
                value={input.drayagePerContainer}
                onChange={(v) => onChange({ drayagePerContainer: v })}
                prefix="$"
                min={0}
              />
              <NumberInput
                label="Destuff Capacity (MT)"
                value={input.destuffCapacity}
                onChange={(v) => onChange({ destuffCapacity: v })}
                suffix="MT"
                min={1}
              />
            </div>
          ) : (
            <NumberInput
              label="Stevedoring ($/MT)"
              value={input.stevedoringPerMT}
              onChange={(v) => onChange({ stevedoringPerMT: v })}
              prefix="$"
              min={0}
            />
          )}

          {/* Storage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NumberInput
              label="Storage ($/MT/month)"
              value={input.storagePerMTPerMonth}
              onChange={(v) => onChange({ storagePerMTPerMonth: v })}
              prefix="$"
              min={0}
            />
            <NumberInput
              label="Storage Months"
              value={input.storageMonths}
              onChange={(v) => onChange({ storageMonths: v })}
              suffix="months"
              min={0}
              step={1}
            />
          </div>

          {/* Broker */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <NumberInput
              label="Broker Fee"
              value={input.brokerFee}
              onChange={(v) => onChange({ brokerFee: v })}
              prefix="$"
              min={0}
            />
            <RadioGroup
              label="Broker Fee Type"
              value={input.brokerFeeType}
              onChange={(v) => onChange({ brokerFeeType: v as 'perMT' | 'perContainer' | 'flat' })}
              options={[
                { value: 'perMT', label: 'Per MT' },
                { value: 'perContainer', label: 'Per Container' },
                { value: 'flat', label: 'Flat' },
              ]}
              inline={false}
            />
            {input.brokerFeeType === 'perContainer' && (
              <NumberInput
                label="# Containers"
                value={input.brokerContainers}
                onChange={(v) => onChange({ brokerContainers: v })}
                min={1}
                step={1}
              />
            )}
          </div>

          {/* Commission */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Commission Name</label>
              <input
                type="text"
                value={input.commissionName}
                onChange={(e) => onChange({ commissionName: e.target.value })}
                placeholder="e.g., Chiu, Tradehansa"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <NumberInput
              label="Commission Rate"
              value={input.commissionRate}
              onChange={(v) => onChange({ commissionRate: v })}
              suffix="%"
              min={0}
              tooltip="Applied to FOB value"
            />
          </div>
        </div>
      </Collapsible>

      {/* Margin */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Margin / Target Price</h2>
        <p className="text-sm text-gray-600 mb-4">Enter either a target margin % or a target sale price (entering one will clear the other)</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumberInput
            label="Target Margin %"
            value={input.targetMarginPercent}
            onChange={(v) => onChange({ targetMarginPercent: v, targetSalePrice: 0 })}
            suffix="%"
            min={0}
          />
          <NumberInput
            label="Target Sale Price ($/lb)"
            value={input.targetSalePrice}
            onChange={(v) => onChange({ targetSalePrice: v, targetMarginPercent: 0 })}
            prefix="$"
            min={0}
            step={0.0001}
          />
        </div>
      </div>
    </div>
  );
}
