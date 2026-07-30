import { useMemo, useState } from 'react';
import type { Deal, DealProduct, GlobalDefaults, ProductResult } from '../engine/types';
import { calculateDeal, fmtLb, fmtMoney, fmtPct, MT_TO_LB } from '../engine/calc';
import { gainForThickness, newProduct, sizeOptionsFor } from '../data/appDefaults';
import { encodeDealToHash } from '../data/share';
import { Button, Card, CardHeader, ComboSelect, Field, GpPill, Menu, NumInput, Segmented } from './ui';
import { AssumptionsDrawer } from './AssumptionsDrawer';
import { WeightGainPicker } from './WeightGainPicker';

/**
 * Day-to-day pricing screen. Only the fields that change per quote are on
 * screen — lane, freight, and the size grid. Duties, finance, and handling sit
 * behind the assumptions summary, which shows them densely and read-only.
 */
export function DealWorkspace({
  deal,
  onChange,
  onBack,
  onDuplicate,
  onDelete,
  defaults,
  onDefaultsChange,
}: {
  deal: Deal;
  onChange: (deal: Deal) => void;
  onBack: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  defaults: GlobalDefaults;
  onDefaultsChange: (d: GlobalDefaults) => void;
}) {
  const result = useMemo(() => calculateDeal(deal), [deal]);
  const [selectedId, setSelectedId] = useState<string>(deal.products[0]?.id ?? '');
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [showGainTable, setShowGainTable] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const selected: ProductResult =
    result.products.find(p => p.productId === selectedId) ?? result.products[0];

  const patch = (p: Partial<Deal>) => onChange({ ...deal, ...p, updatedAt: new Date().toISOString() });
  const patchProduct = (id: string, p: Partial<DealProduct>) =>
    patch({ products: deal.products.map(x => (x.id === id ? { ...x, ...p } : x)) });

  /**
   * Picking a plate thickness fills in its weight gain from the table. Sheet
   * gauges have no gain data, so a previously auto-filled figure is cleared
   * rather than left to sit under a size it does not belong to. A gain the
   * user typed is always kept.
   */
  const setSize = (id: string, size: string) => {
    const product = deal.products.find(p => p.id === id);
    const gain = deal.productForm === 'sheet' ? null : gainForThickness(size);
    if (gain != null) {
      patchProduct(id, { description: size, weightGainPct: gain, weightGainAuto: true });
    } else if (product?.weightGainAuto) {
      patchProduct(id, { description: size, weightGainPct: 0, weightGainAuto: false });
    } else {
      patchProduct(id, { description: size });
    }
  };

  /**
   * Switching form switches the size vocabulary, so any size that belongs to
   * the other one is cleared — a gauge must never sit under Plate, or an inch
   * thickness under Sheet. Auto-filled gains follow; typed ones are left alone.
   */
  const setProductForm = (form: Deal['productForm']) => {
    const sizes = sizeOptionsFor(form);
    patch({
      productForm: form,
      products: deal.products.map(p => {
        const description = sizes.includes(p.description) ? p.description : '';
        if (!p.weightGainAuto) return { ...p, description };
        const gain = form === 'sheet' ? null : gainForThickness(description);
        return gain != null
          ? { ...p, description, weightGainPct: gain }
          : { ...p, description, weightGainPct: 0, weightGainAuto: false };
      }),
    });
  };

  const setDestinationPort = (port: string) => {
    const drayage = defaults.drayageByPort[port];
    patch({
      destinationPort: port,
      handling: {
        ...deal.handling,
        ...(drayage != null && deal.shippingType === 'container' ? { drayagePerContainer: drayage } : {}),
      },
    });
  };

  const addSize = () => {
    const prod = newProduct();
    patch({ products: [...deal.products, prod] });
    setSelectedId(prod.id);
  };
  const removeSize = (id: string) => {
    if (deal.products.length <= 1) return;
    patch({ products: deal.products.filter(p => p.id !== id) });
    if (selectedId === id) setSelectedId(deal.products.find(p => p.id !== id)?.id ?? '');
  };

  const share = async () => {
    const url = `${location.origin}${location.pathname}${encodeDealToHash(deal)}`;
    try {
      await navigator.clipboard.writeText(url);
      setToast('Link copied — whoever opens it gets this exact deal.');
    } catch {
      prompt('Copy this link:', url);
    }
    setTimeout(() => setToast(null), 4000);
  };

  const isCIF = deal.incoterm === 'CIF';
  const isContainer = deal.shippingType === 'container';
  const anyQty = deal.products.some(p => p.quantityLbs != null && p.quantityLbs > 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <header className="no-print flex items-center gap-2 mb-5">
        <Button variant="ghost" onClick={onBack}>
          ← Deals
        </Button>
        <input
          type="text"
          value={deal.name}
          onChange={e => patch({ name: e.target.value })}
          className="flex-1 min-w-32 bg-transparent text-lg font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none px-1"
        />
        <Button onClick={share}>Share</Button>
        <Button onClick={() => window.print()}>Print</Button>
        <Menu
          items={[
            { label: 'Duplicate deal', onClick: onDuplicate },
            {
              label: 'Delete deal',
              danger: true,
              onClick: () => {
                if (confirm(`Delete "${deal.name}"?`)) onDelete();
              },
            },
          ]}
        />
      </header>

      {/* Print-only header */}
      <div className="hidden print:block mb-4">
        <h1 className="text-xl font-bold">{deal.name}</h1>
        <p className="text-sm text-slate-600">
          {deal.supplier} → {deal.customer} · {deal.grade} · {deal.incoterm} ·{' '}
          {isContainer ? 'Container' : 'Break bulk'} · {deal.destinationPort} · {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="space-y-4">
        {/* ---- Lane: who / where / how ---- */}
        <Card className="no-print">
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Supplier">
              <ComboSelect
                value={deal.supplier}
                onChange={v => patch({ supplier: v })}
                options={defaults.suppliers}
                onAdd={name => onDefaultsChange({ ...defaults, suppliers: [...defaults.suppliers, name] })}
                addLabel="New supplier"
              />
            </Field>
            <Field label="Customer">
              <ComboSelect
                value={deal.customer}
                onChange={v => patch({ customer: v })}
                options={defaults.customers}
                onAdd={name => onDefaultsChange({ ...defaults, customers: [...defaults.customers, name] })}
                addLabel="New customer"
              />
            </Field>
            <Field label="Origin">
              <ComboSelect
                value={deal.originPort}
                onChange={v => patch({ originPort: v })}
                options={defaults.originPorts}
                onAdd={name => onDefaultsChange({ ...defaults, originPorts: [...defaults.originPorts, name] })}
                addLabel="New origin port"
              />
            </Field>
            <Field label="Destination">
              <ComboSelect
                value={deal.destinationPort}
                onChange={setDestinationPort}
                options={defaults.destinationPorts}
                onAdd={name =>
                  onDefaultsChange({ ...defaults, destinationPorts: [...defaults.destinationPorts, name] })
                }
                addLabel="New destination port"
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

            {isCIF ? (
              <Field label="Freight in CIF ($/MT)">
                <NumInput value={deal.freightPerMT} onChange={v => patch({ freightPerMT: v })} prefix="$" />
              </Field>
            ) : isContainer ? (
              <Field label="Freight ($/container)">
                <NumInput
                  value={deal.freightPerContainer}
                  onChange={v => patch({ freightPerContainer: v })}
                  prefix="$"
                />
              </Field>
            ) : (
              <Field label="Freight ($/MT)">
                <NumInput value={deal.freightPerMT} onChange={v => patch({ freightPerMT: v })} prefix="$" />
              </Field>
            )}

            <Field label="Markup %">
              <NumInput value={deal.markupPct} onChange={v => patch({ markupPct: v })} suffix="%" />
            </Field>
          </div>
        </Card>

        {/* ---- Sizes & pricing: one row per quote line ---- */}
        <Card>
          <CardHeader
            title="Sizes & pricing"
            hint={
              deal.markupPct > 0
                ? `One row per size. Leave a sale price blank to price it at ${deal.markupPct}% markup.`
                : 'One row per size. Enter a sale price, or set a markup % above to fill them in.'
            }
            right={
              <div className="no-print flex items-center gap-2">
                <Segmented
                  value={deal.productForm}
                  onChange={setProductForm}
                  options={[
                    { value: 'plate', label: 'Plate' },
                    { value: 'sheet', label: 'Sheet' },
                  ]}
                />
                <Button variant="ghost" className="!text-blue-600" onClick={addSize}>
                  + Add size
                </Button>
              </div>
            }
          />
          <div className="overflow-x-auto px-4 pb-4">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-slate-400 border-b border-slate-200 [&>th]:pb-1.5 [&>th]:px-1.5 [&>th]:font-medium">
                  <th className="text-left w-40">{deal.productForm === 'sheet' ? 'Gauge' : 'Thickness'}</th>
                  <th className="text-left w-28">{isCIF ? 'CIF $/MT' : 'FOB $/MT'}</th>
                  <th className="text-left w-24">
                    Weight gain
                    <button
                      type="button"
                      onClick={() => setShowGainTable(true)}
                      className="no-print ml-1 text-slate-300 hover:text-blue-600"
                      title={deal.productForm === 'sheet' ? 'View the gauge reference' : 'View the weight gain table'}
                    >
                      ▦
                    </button>
                  </th>
                  <th className="text-left w-24">Sale $/lb</th>
                  <th className="text-left w-24">Qty lbs</th>
                  <th className="text-right w-24">Landed $/lb</th>
                  <th className="text-right w-24">Margin $/lb</th>
                  <th className="text-right w-16">GP</th>
                  {anyQty && <th className="text-right w-24">Margin $</th>}
                  <th className="w-6" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deal.products.map((p, i) => {
                  const r = result.products[i];
                  return (
                    <tr key={p.id} className="[&>td]:px-1.5 [&>td]:py-1.5">
                      <td>
                        <ComboSelect
                          value={p.description}
                          onChange={v => setSize(p.id, v)}
                          options={sizeOptionsFor(deal.productForm)}
                          placeholder={deal.productForm === 'sheet' ? 'Gauge…' : 'Thickness…'}
                          className="!font-semibold"
                        />
                      </td>
                      <td>
                        <NumInput
                          value={p.contractPrice}
                          onChange={v => patchProduct(p.id, { contractPrice: v })}
                          prefix="$"
                        />
                      </td>
                      <td>
                        <NumInput
                          value={p.weightGainPct}
                          onChange={v => patchProduct(p.id, { weightGainPct: v, weightGainAuto: false })}
                          suffix="%"
                        />
                      </td>
                      <td>
                        <NumInput
                          value={p.salePricePerLb}
                          onChange={v => patchProduct(p.id, { salePricePerLb: (v as number | null) ?? null })}
                          nullable
                          prefix="$"
                          step={0.005}
                          placeholder={deal.markupPct > 0 ? 'auto' : ''}
                        />
                      </td>
                      <td>
                        <NumInput
                          value={p.quantityLbs}
                          onChange={v => patchProduct(p.id, { quantityLbs: (v as number | null) ?? null })}
                          nullable
                          placeholder="optional"
                        />
                      </td>
                      <td className="num text-right font-bold text-slate-900">
                        {r && r.landedPerLb > 0 ? fmtLb(r.landedPerLb) : '—'}
                      </td>
                      <td
                        className={`num text-right font-semibold ${
                          !r || r.marginPerLb == null
                            ? 'text-slate-400'
                            : r.marginPerLb >= 0
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                        }`}
                      >
                        {r && r.marginPerLb != null ? fmtLb(r.marginPerLb) : '—'}
                      </td>
                      <td className="text-right">
                        <GpPill gp={r?.gpPct ?? null} />
                      </td>
                      {anyQty && (
                        <td className="num text-right text-slate-600">
                          {r && r.marginDollars != null ? `$${fmtMoney(r.marginDollars, 0)}` : '—'}
                        </td>
                      )}
                      <td className="text-right">
                        {deal.products.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSize(p.id)}
                            className="no-print text-slate-300 hover:text-rose-500 text-lg leading-none"
                            title="Remove this size"
                          >
                            ×
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {result.hasQuantities && (
            <div className="flex justify-between items-center px-4 py-2.5 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              <span className="text-xs font-medium text-slate-600">Total margin (quote)</span>
              <span
                className={`num text-base font-bold ${
                  result.totalMarginDollars >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                ${fmtMoney(result.totalMarginDollars, 0)}
              </span>
            </div>
          )}
        </Card>

        {/* ---- Assumptions: dense, read-only, one click to edit ---- */}
        <AssumptionsSummary deal={deal} onEdit={() => setShowAssumptions(true)} />

        {/* ---- Breakdown ---- */}
        {selected && selected.landedPerMT > 0 && (
          <BreakdownCard
            result={selected}
            products={result.products}
            selectedId={selected.productId}
            onSelect={setSelectedId}
          />
        )}
      </div>

      {showAssumptions && (
        <AssumptionsDrawer
          deal={deal}
          onChange={onChange}
          defaults={defaults}
          onClose={() => setShowAssumptions(false)}
        />
      )}
      {showGainTable && <WeightGainPicker form={deal.productForm} onClose={() => setShowGainTable(false)} />}

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg no-print">
          {toast}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dense read-only summary of the set-once assumptions.
// ---------------------------------------------------------------------------
function AssumptionsSummary({ deal, onEdit }: { deal: Deal; onEdit: () => void }) {
  const r = deal.rates;
  const f = deal.finance;
  const h = deal.handling;
  const n = (v: number) => (Number.isInteger(v) ? v.toString() : String(v));

  const bits: string[] = [`232 ${n(r.sec232Pct)}%`, `HMF ${n(r.hmfPct)}%`];
  if (r.mpfPct > 0) bits.push(`MPF ${n(r.mpfPct)}%`);
  if (deal.incoterm !== 'CIF' && r.marineInsPct > 0) bits.push(`M.I. ${n(r.marineInsPct)}%`);
  bits.push(`C.I. ${n(r.creditInsPct)}%`);
  if (f.lcPreCash.enabled) bits.push(`LC ${n(f.lcPreCash.ratePct)}%/${f.lcPreCash.days}d`);
  if (f.lcSailing.enabled) bits.push(`Sailing ${n(f.lcSailing.ratePct)}%/${f.lcSailing.days}d`);
  if (f.tariff.enabled) bits.push(`Tariff fin ${n(f.tariff.ratePct)}%/${f.tariff.days}d`);
  if (deal.shippingType === 'container') {
    if (h.drayagePerContainer > 0) bits.push(`Drayage $${n(h.drayagePerContainer)}/${n(h.containerCapacityMT)}MT`);
  } else if (h.stevedorePerMT > 0) {
    bits.push(`Stevedoring $${n(h.stevedorePerMT)}/MT`);
  }
  if (h.storagePerMTMonth > 0 && h.storageMonths > 0)
    bits.push(`Storage $${n(h.storagePerMTMonth)}×${h.storageMonths}mo`);
  if (h.truckingPerFTL > 0) bits.push(`Trucking $${n(h.truckingPerFTL)}/FTL`);
  if (h.brokerFee > 0) bits.push(`Broker $${n(h.brokerFee)}`);
  if (h.commissionPct > 0) bits.push(`${h.commissionName || 'Commission'} ${n(h.commissionPct)}%`);

  return (
    <button
      type="button"
      onClick={onEdit}
      className="w-full text-left rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm hover:border-blue-300 transition-colors print-block"
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <span className="text-xs font-semibold text-slate-700">Assumptions</span>
          <span className="num ml-2 text-xs text-slate-500">{bits.join(' · ')}</span>
        </div>
        <span className="no-print shrink-0 text-xs font-medium text-blue-600">Edit</span>
      </div>
    </button>
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
        hint="Every line shows its formula — check any number the way you would in Excel."
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
              margin {fmtLb(whatIfMargin)} · GP {fmtPct((whatIfMargin / whatIf!) * 100)}
            </span>
          ) : (
            <span className="text-slate-400">enter a price</span>
          )}
        </div>
      </div>
    </Card>
  );
}
