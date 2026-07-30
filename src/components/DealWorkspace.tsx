import { useMemo, useState } from 'react';
import type { Deal, DealProduct, GlobalDefaults, ProductResult } from '../engine/types';
import { calculateDeal, fmtLb, fmtMoney, fmtPct, MT_TO_LB } from '../engine/calc';
import { newProduct } from '../data/appDefaults';
import { encodeDealToHash } from '../data/share';
import { Button, Card, CardHeader, Field, GpPill, NumInput, Segmented, SelectInput, TextInput, ToggleRow } from './ui';
import { WeightGainPicker } from './WeightGainPicker';

export function DealWorkspace({
  deal,
  onChange,
  onBack,
  onDuplicate,
  onDelete,
  defaults,
}: {
  deal: Deal;
  onChange: (deal: Deal) => void;
  onBack: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  defaults: GlobalDefaults;
}) {
  const result = useMemo(() => calculateDeal(deal), [deal]);
  const [selectedId, setSelectedId] = useState<string>(deal.products[0]?.id ?? '');
  const [gainPickerFor, setGainPickerFor] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const selected: ProductResult | undefined =
    result.products.find(p => p.productId === selectedId) ?? result.products[0];

  // --- mutation helpers ---------------------------------------------------
  const patch = (p: Partial<Deal>) => onChange({ ...deal, ...p, updatedAt: new Date().toISOString() });
  const patchRates = (p: Partial<Deal['rates']>) => patch({ rates: { ...deal.rates, ...p } });
  const patchHandling = (p: Partial<Deal['handling']>) => patch({ handling: { ...deal.handling, ...p } });
  const patchFinance = (p: Partial<Deal['finance']>) => patch({ finance: { ...deal.finance, ...p } });
  const patchProduct = (id: string, p: Partial<DealProduct>) =>
    patch({ products: deal.products.map(x => (x.id === id ? { ...x, ...p } : x)) });

  const addProduct = () => {
    const prod = newProduct();
    patch({ products: [...deal.products, prod] });
    setSelectedId(prod.id);
  };
  const removeProduct = (id: string) => {
    if (deal.products.length <= 1) return;
    patch({ products: deal.products.filter(p => p.id !== id) });
    if (selectedId === id) setSelectedId(deal.products.find(p => p.id !== id)?.id ?? '');
  };

  const setDestinationPort = (port: string) => {
    // Autofill port-specific handling rates when we know them.
    const drayage = defaults.drayageByPort[port];
    const storage = defaults.storageByPort[port];
    patch({
      destinationPort: port,
      handling: {
        ...deal.handling,
        ...(drayage != null && deal.shippingType === 'container' ? { drayagePerContainer: drayage } : {}),
        ...(storage != null && deal.handling.storagePerMTMonth > 0 ? { storagePerMTMonth: storage } : {}),
      },
    });
  };

  const applyDefaults = () => {
    if (
      confirm(
        'Replace this deal’s rates, finance, and handling assumptions with the current global defaults? Prices and freight are kept.',
      )
    ) {
      patch({
        rates: { ...defaults.rates },
        finance: {
          basis: defaults.finance.basis,
          lcPreCash: { ...defaults.finance.lcPreCash },
          lcSailing: { ...defaults.finance.lcSailing },
          tariff: { ...defaults.finance.tariff },
        },
        handling: {
          ...defaults.handling,
          // keep deal-specific port rates if the port has a known rate
          drayagePerContainer:
            defaults.drayageByPort[deal.destinationPort] ?? defaults.handling.drayagePerContainer,
        },
      });
    }
  };

  const share = async () => {
    const url = `${location.origin}${location.pathname}${encodeDealToHash(deal)}`;
    try {
      await navigator.clipboard.writeText(url);
      setToast('Share link copied — anyone opening it gets this exact deal.');
    } catch {
      prompt('Copy this link:', url);
    }
    setTimeout(() => setToast(null), 4000);
  };

  const isCIF = deal.incoterm === 'CIF';
  const isContainer = deal.shippingType === 'container';

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <header className="no-print flex flex-wrap items-center gap-3 mb-5">
        <Button variant="ghost" onClick={onBack} title="Back to deals">
          ← Deals
        </Button>
        <input
          type="text"
          value={deal.name}
          onChange={e => patch({ name: e.target.value })}
          className="flex-1 min-w-48 bg-transparent text-lg font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none px-1"
        />
        <div className="flex gap-2">
          <Button onClick={share}>Share link</Button>
          <Button onClick={() => window.print()}>Print</Button>
          <Button onClick={onDuplicate}>Duplicate</Button>
          <Button
            variant="danger"
            onClick={() => {
              if (confirm(`Delete "${deal.name}"?`)) onDelete();
            }}
          >
            Delete
          </Button>
        </div>
      </header>

      {/* Print-only header */}
      <div className="hidden print:block mb-4">
        <h1 className="text-xl font-bold">{deal.name}</h1>
        <p className="text-sm text-slate-600">
          {deal.supplier && `${deal.supplier} → ${deal.customer}`} · {deal.incoterm} ·{' '}
          {isContainer ? 'Container' : 'Break bulk'} · {deal.destinationPort} ·{' '}
          {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-5 items-start">
        {/* ============ Main column ============ */}
        <div className="space-y-5 min-w-0">
          {/* Deal setup */}
          <Card className="no-print">
            <CardHeader title="Deal setup" />
            <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Supplier">
                <TextInput value={deal.supplier} onChange={v => patch({ supplier: v })} placeholder="e.g. Yuen Chang" />
              </Field>
              <Field label="Customer">
                <TextInput value={deal.customer} onChange={v => patch({ customer: v })} placeholder="e.g. Alro" />
              </Field>
              <Field label="Origin port">
                <TextInput value={deal.originPort} onChange={v => patch({ originPort: v })} />
              </Field>
              <Field label="Destination port">
                <SelectInput
                  value={deal.destinationPort}
                  onChange={setDestinationPort}
                  options={[
                    ...defaults.destinationPorts.map(p => ({ value: p, label: p })),
                    ...(defaults.destinationPorts.includes(deal.destinationPort)
                      ? []
                      : [{ value: deal.destinationPort, label: deal.destinationPort }]),
                  ]}
                />
              </Field>

              <Field label="Incoterm">
                <Segmented
                  value={deal.incoterm}
                  onChange={v => patch({ incoterm: v })}
                  options={[
                    { value: 'FOB', label: 'FOB' },
                    { value: 'CIF', label: 'CIF' },
                  ]}
                />
              </Field>
              <Field label="Shipping">
                <Segmented
                  value={deal.shippingType}
                  onChange={v => patch({ shippingType: v })}
                  options={[
                    { value: 'container', label: 'Container' },
                    { value: 'breakBulk', label: 'Break bulk' },
                  ]}
                />
              </Field>

              {/* Freight — the fields depend on incoterm + shipping */}
              {isCIF ? (
                <>
                  <Field label="Freight in CIF ($/MT)">
                    <NumInput value={deal.freightPerMT} onChange={v => patch({ freightPerMT: v })} prefix="$" />
                  </Field>
                  <Field label="Freight adder ($/MT)">
                    <NumInput
                      value={deal.freightAdderPerMT}
                      onChange={v => patch({ freightAdderPerMT: v })}
                      prefix="$"
                    />
                  </Field>
                </>
              ) : isContainer ? (
                <>
                  <Field label="Ocean freight ($/container)">
                    <NumInput
                      value={deal.freightPerContainer}
                      onChange={v => patch({ freightPerContainer: v })}
                      prefix="$"
                    />
                  </Field>
                  <Field label="Container capacity (MT)">
                    <NumInput
                      value={deal.handling.containerCapacityMT}
                      onChange={v => patchHandling({ containerCapacityMT: v })}
                      suffix="MT"
                    />
                  </Field>
                </>
              ) : (
                <Field label="Ocean freight ($/MT)">
                  <NumInput value={deal.freightPerMT} onChange={v => patch({ freightPerMT: v })} prefix="$" />
                </Field>
              )}

              <Field label="Default markup %" className="col-span-2 md:col-span-1">
                <NumInput value={deal.markupPct} onChange={v => patch({ markupPct: v })} suffix="%" />
              </Field>
            </div>
            {isCIF && (
              <p className="px-4 pb-3 -mt-1 text-[11px] text-slate-400">
                CIF: freight is used to back out FOB for the duty calc; the adder raises the contract value
                (e.g. a Baltimore adder). Marine insurance is already in the CIF price, so no M.I. line.
              </p>
            )}
          </Card>

          {/* Products grid */}
          <Card>
            <CardHeader
              title="Sizes & pricing"
              hint="Shared freight, duties, and finance apply to every size. Sale price is optional — the deal markup fills in."
              right={
                <Button variant="ghost" className="no-print !text-blue-600" onClick={addProduct}>
                  + Add size
                </Button>
              }
            />
            <div className="overflow-x-auto px-4 pb-4">
              <table className="w-full text-sm min-w-[420px]">
                <thead>
                  <tr>
                    <th className="w-36 min-w-32"></th>
                    {deal.products.map(p => (
                      <th key={p.id} className="px-1.5 pb-1 min-w-32 align-bottom">
                        <div className="flex items-center gap-1">
                          <TextInput
                            value={p.description}
                            onChange={v => patchProduct(p.id, { description: v })}
                            placeholder={'e.g. 1/2"'}
                            className="!font-semibold text-center"
                          />
                          {deal.products.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeProduct(p.id)}
                              className="no-print text-slate-300 hover:text-rose-500 text-lg leading-none px-0.5"
                              title="Remove size"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="[&>tr>td]:px-1.5 [&>tr>td]:py-1 [&>tr>th]:text-left [&>tr>th]:text-xs [&>tr>th]:font-medium [&>tr>th]:text-slate-500 [&>tr>th]:pr-2">
                  <tr>
                    <th>{isCIF ? 'CIF price ($/MT)' : 'FOB price ($/MT)'}</th>
                    {deal.products.map(p => (
                      <td key={p.id}>
                        <NumInput
                          value={p.contractPrice}
                          onChange={v => patchProduct(p.id, { contractPrice: v })}
                          prefix="$"
                        />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th>
                      Weight gain %
                    </th>
                    {deal.products.map(p => (
                      <td key={p.id}>
                        <div className="flex items-center gap-1">
                          <NumInput
                            value={p.weightGainPct}
                            onChange={v => patchProduct(p.id, { weightGainPct: v })}
                            suffix="%"
                          />
                          <button
                            type="button"
                            onClick={() => setGainPickerFor(p.id)}
                            className="no-print shrink-0 text-slate-400 hover:text-blue-600 text-xs border border-slate-300 rounded px-1 py-1"
                            title="Look up by thickness"
                          >
                            ▦
                          </button>
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th>Sale price ($/lb)</th>
                    {deal.products.map(p => (
                      <td key={p.id}>
                        <NumInput
                          value={p.salePricePerLb}
                          onChange={v => patchProduct(p.id, { salePricePerLb: (v as number | null) ?? null })}
                          nullable
                          prefix="$"
                          step={0.005}
                          placeholder={deal.markupPct > 0 ? 'markup' : ''}
                        />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th>Quantity (lbs)</th>
                    {deal.products.map(p => (
                      <td key={p.id}>
                        <NumInput
                          value={p.quantityLbs}
                          onChange={v => patchProduct(p.id, { quantityLbs: (v as number | null) ?? null })}
                          nullable
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Computed rows */}
                  <tr className="border-t border-slate-200">
                    <th className="pt-2">Landed $/MT</th>
                    {result.products.map(p => (
                      <td key={p.productId} className="num text-right pt-2 text-slate-600">
                        {p.landedPerMT > 0 ? fmtMoney(p.landedPerMT) : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th>Landed $/lb</th>
                    {result.products.map(p => (
                      <td key={p.productId} className="num text-right font-bold text-slate-900">
                        {p.landedPerLb > 0 ? fmtLb(p.landedPerLb) : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th>Sale $/lb</th>
                    {result.products.map(p => (
                      <td key={p.productId} className="num text-right text-slate-700">
                        {p.salePerLb != null ? (
                          <>
                            {p.salePerLb.toFixed(3)}
                            {p.saleSource === 'markup' && (
                              <span className="text-[10px] text-slate-400 ml-1">({deal.markupPct}%)</span>
                            )}
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th>Margin $/lb</th>
                    {result.products.map(p => (
                      <td
                        key={p.productId}
                        className={`num text-right font-semibold ${
                          p.marginPerLb == null ? 'text-slate-400' : p.marginPerLb >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {p.marginPerLb != null ? fmtLb(p.marginPerLb) : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th>GP %</th>
                    {result.products.map(p => (
                      <td key={p.productId} className="text-right">
                        <GpPill gp={p.gpPct} />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th>Margin $</th>
                    {result.products.map(p => (
                      <td key={p.productId} className="num text-right text-slate-600">
                        {p.marginDollars != null ? `$${fmtMoney(p.marginDollars, 0)}` : '—'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            {result.hasQuantities && (
              <div className="flex justify-between items-center px-4 py-2.5 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                <span className="text-xs font-medium text-slate-600">Total margin (quote)</span>
                <span
                  className={`num text-base font-bold ${result.totalMarginDollars >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                >
                  ${fmtMoney(result.totalMarginDollars, 0)}
                </span>
              </div>
            )}
          </Card>

          {/* Cost breakdown for the selected size */}
          {selected && selected.landedPerMT > 0 && (
            <BreakdownCard
              result={selected}
              products={result.products}
              selectedId={selected.productId}
              onSelect={setSelectedId}
            />
          )}
        </div>

        {/* ============ Assumptions rail ============ */}
        <aside className="no-print space-y-4">
          <Card>
            <CardHeader title="Duties & insurance" />
            <div className="px-4 pb-4 grid grid-cols-2 gap-3">
              <Field label="Section 232">
                <NumInput value={deal.rates.sec232Pct} onChange={v => patchRates({ sec232Pct: v })} suffix="%" />
              </Field>
              <Field label="HMF">
                <NumInput value={deal.rates.hmfPct} onChange={v => patchRates({ hmfPct: v })} suffix="%" />
              </Field>
              <Field label="MPF">
                <NumInput value={deal.rates.mpfPct} onChange={v => patchRates({ mpfPct: v })} suffix="%" />
              </Field>
              <Field label="Credit ins.">
                <NumInput value={deal.rates.creditInsPct} onChange={v => patchRates({ creditInsPct: v })} suffix="%" />
              </Field>
              {!isCIF && (
                <Field label="Marine ins.">
                  <NumInput
                    value={deal.rates.marineInsPct}
                    onChange={v => patchRates({ marineInsPct: v })}
                    suffix="%"
                  />
                </Field>
              )}
            </div>
            {isCIF && (
              <p className="px-4 pb-3 -mt-1 text-[11px] text-slate-400">Marine insurance is included in the CIF price.</p>
            )}
          </Card>

          <Card>
            <CardHeader title="Finance" />
            <div className="px-4 pb-4 space-y-2.5">
              <Field label="Finance base">
                <SelectInput
                  value={deal.finance.basis}
                  onChange={v => patchFinance({ basis: v as Deal['finance']['basis'] })}
                  options={[
                    { value: 'contract', label: 'Contract price' },
                    { value: 'cfr', label: 'Contract + freight (CFR)' },
                  ]}
                />
              </Field>
              <ToggleRow
                label="LC — pre-cash"
                checked={deal.finance.lcPreCash.enabled}
                onChange={v => patchFinance({ lcPreCash: { ...deal.finance.lcPreCash, enabled: v } })}
              >
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Rate">
                    <NumInput
                      value={deal.finance.lcPreCash.ratePct}
                      onChange={v => patchFinance({ lcPreCash: { ...deal.finance.lcPreCash, ratePct: v } })}
                      suffix="%"
                    />
                  </Field>
                  <Field label="Days">
                    <NumInput
                      value={deal.finance.lcPreCash.days}
                      onChange={v => patchFinance({ lcPreCash: { ...deal.finance.lcPreCash, days: v } })}
                    />
                  </Field>
                </div>
              </ToggleRow>
              <ToggleRow
                label="LC — sailing"
                checked={deal.finance.lcSailing.enabled}
                onChange={v => patchFinance({ lcSailing: { ...deal.finance.lcSailing, enabled: v } })}
              >
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Rate">
                    <NumInput
                      value={deal.finance.lcSailing.ratePct}
                      onChange={v => patchFinance({ lcSailing: { ...deal.finance.lcSailing, ratePct: v } })}
                      suffix="%"
                    />
                  </Field>
                  <Field label="Days">
                    <NumInput
                      value={deal.finance.lcSailing.days}
                      onChange={v => patchFinance({ lcSailing: { ...deal.finance.lcSailing, days: v } })}
                    />
                  </Field>
                </div>
              </ToggleRow>
              <ToggleRow
                label="Tariff finance"
                checked={deal.finance.tariff.enabled}
                onChange={v => patchFinance({ tariff: { ...deal.finance.tariff, enabled: v } })}
              >
                <div className="grid grid-cols-3 gap-2">
                  <Field label="% financed">
                    <NumInput
                      value={deal.finance.tariff.financedPct}
                      onChange={v => patchFinance({ tariff: { ...deal.finance.tariff, financedPct: v } })}
                      suffix="%"
                    />
                  </Field>
                  <Field label="Rate">
                    <NumInput
                      value={deal.finance.tariff.ratePct}
                      onChange={v => patchFinance({ tariff: { ...deal.finance.tariff, ratePct: v } })}
                      suffix="%"
                    />
                  </Field>
                  <Field label="Days">
                    <NumInput
                      value={deal.finance.tariff.days}
                      onChange={v => patchFinance({ tariff: { ...deal.finance.tariff, days: v } })}
                    />
                  </Field>
                </div>
                <p className="mt-1.5 text-[10px] text-slate-400">
                  Cost of financing the Section 232 duty. 100% = the full tariff is financed.
                </p>
              </ToggleRow>
            </div>
          </Card>

          <Card>
            <CardHeader title="Handling & other" />
            <div className="px-4 pb-4 grid grid-cols-2 gap-3">
              {isContainer ? (
                <Field label="Drayage ($/cont.)" className="col-span-2">
                  <NumInput
                    value={deal.handling.drayagePerContainer}
                    onChange={v => patchHandling({ drayagePerContainer: v })}
                    prefix="$"
                  />
                </Field>
              ) : (
                <Field label="Stevedoring ($/MT)" className="col-span-2">
                  <NumInput
                    value={deal.handling.stevedorePerMT}
                    onChange={v => patchHandling({ stevedorePerMT: v })}
                    prefix="$"
                  />
                </Field>
              )}
              <Field label="Storage ($/MT/mo)">
                <NumInput
                  value={deal.handling.storagePerMTMonth}
                  onChange={v => patchHandling({ storagePerMTMonth: v })}
                  prefix="$"
                />
              </Field>
              <Field label="Months">
                <NumInput value={deal.handling.storageMonths} onChange={v => patchHandling({ storageMonths: v })} />
              </Field>
              <Field label="Trucking ($/FTL)">
                <NumInput
                  value={deal.handling.truckingPerFTL}
                  onChange={v => patchHandling({ truckingPerFTL: v })}
                  prefix="$"
                />
              </Field>
              <Field label="MT per FTL">
                <NumInput value={deal.handling.ftlCapacityMT} onChange={v => patchHandling({ ftlCapacityMT: v })} />
              </Field>
              <Field label="Broker fee">
                <NumInput value={deal.handling.brokerFee} onChange={v => patchHandling({ brokerFee: v })} prefix="$" />
              </Field>
              <Field label="Broker basis">
                <SelectInput
                  value={deal.handling.brokerBasis}
                  onChange={v => patchHandling({ brokerBasis: v as Deal['handling']['brokerBasis'] })}
                  options={[
                    { value: 'perMT', label: 'per MT' },
                    { value: 'perContainer', label: 'per container' },
                    { value: 'flat', label: 'flat / shipment' },
                  ]}
                />
              </Field>
              <Field label="Commission">
                <TextInput
                  value={deal.handling.commissionName}
                  onChange={v => patchHandling({ commissionName: v })}
                  placeholder="e.g. Chiu"
                />
              </Field>
              <Field label="Rate">
                <NumInput
                  value={deal.handling.commissionPct}
                  onChange={v => patchHandling({ commissionPct: v })}
                  suffix="%"
                />
              </Field>
            </div>
          </Card>

          <Button className="w-full justify-center" onClick={applyDefaults}>
            Apply global defaults to this deal
          </Button>

          <Card>
            <CardHeader title="Notes" />
            <div className="px-4 pb-4">
              <textarea
                value={deal.notes}
                onChange={e => patch({ notes: e.target.value })}
                rows={3}
                placeholder="Anything worth remembering about this deal…"
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              />
            </div>
          </Card>
        </aside>
      </div>

      {gainPickerFor && (
        <WeightGainPicker
          onSelect={pct => patchProduct(gainPickerFor, { weightGainPct: pct })}
          onClose={() => setGainPickerFor(null)}
        />
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg no-print">
          {toast}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cost breakdown with per-line formulas — the audit trail.
// ---------------------------------------------------------------------------
function BreakdownCard({
  result,
  products,
  selectedId,
  onSelect,
}: {
  result: ProductResult;
  products: ProductResult[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [whatIf, setWhatIf] = useState<number | null>(null);
  const whatIfMargin = whatIf != null && whatIf > 0 ? whatIf - result.landedPerLb : null;

  return (
    <Card>
      <CardHeader
        title="Cost breakdown"
        hint="Every line shows its formula — audit any number at a glance."
        right={
          products.length > 1 ? (
            <div className="no-print flex gap-1">
              {products.map(p => (
                <button
                  key={p.productId}
                  type="button"
                  onClick={() => onSelect(p.productId)}
                  className={`px-2 py-1 text-xs font-medium rounded-md ${
                    p.productId === selectedId
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p.description || '—'}
                </button>
              ))}
            </div>
          ) : undefined
        }
      />
      <div className="px-4 pb-4 overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-slate-400 border-b border-slate-200 [&>th]:pb-1.5 [&>th]:font-medium">
              <th className="text-left">Item</th>
              <th className="text-left">Formula</th>
              <th className="text-right w-24">$/MT</th>
              <th className="text-right w-24">$/lb</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {result.lines.map(line => (
              <tr key={line.key} className="[&>td]:py-1.5">
                <td className="text-slate-700 pr-3 whitespace-nowrap">{line.label}</td>
                <td className="text-xs text-slate-400 pr-3">{line.formula}</td>
                <td className="num text-right text-slate-700">{fmtMoney(line.perMT)}</td>
                <td className="num text-right text-slate-500">{fmtLb(line.perMT / MT_TO_LB)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-slate-300 bg-slate-50 [&>td]:py-2">
              <td className="font-bold text-slate-900">Landed cost</td>
              <td className="text-xs text-slate-400">Σ all lines</td>
              <td className="num text-right font-bold text-slate-900">{fmtMoney(result.landedPerMT)}</td>
              <td className="num text-right font-bold text-slate-900">{fmtLb(result.landedPerLb)}</td>
            </tr>
            {result.salePerLb != null && (
              <>
                <tr className="[&>td]:py-1.5">
                  <td className="text-slate-700">Sale price</td>
                  <td className="text-xs text-slate-400">
                    {result.saleSource === 'markup' ? 'landed × (1 + markup), rounded to 0.001' : 'entered'}
                  </td>
                  <td></td>
                  <td className="num text-right text-slate-700">{result.salePerLb.toFixed(4)}</td>
                </tr>
                <tr className="bg-emerald-50/60 [&>td]:py-2">
                  <td className="font-semibold text-emerald-800">Margin</td>
                  <td className="text-xs text-emerald-700/60">sale − landed · GP on sale</td>
                  <td className="num text-right font-semibold text-emerald-800">
                    {result.gpPct != null ? fmtPct(result.gpPct) : ''}
                  </td>
                  <td className="num text-right font-semibold text-emerald-800">
                    {result.marginPerLb != null ? fmtLb(result.marginPerLb) : ''}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>

        {/* What-if */}
        <div className="no-print mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-sm text-slate-600">
          <span>What if sold at</span>
          <NumInput
            value={whatIf}
            onChange={v => setWhatIf((v as number | null) ?? null)}
            nullable
            prefix="$"
            step={0.005}
            className="w-28"
          />
          <span>/lb →</span>
          {whatIfMargin != null ? (
            <span className={`num font-semibold ${whatIfMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              margin {fmtLb(whatIfMargin)} · GP {fmtPct(((whatIfMargin / whatIf!) * 100))}
            </span>
          ) : (
            <span className="text-slate-400">enter a price</span>
          )}
        </div>
      </div>
    </Card>
  );
}
