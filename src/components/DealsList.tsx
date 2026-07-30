import { useMemo } from 'react';
import type { Deal } from '../engine/types';
import { calculateDeal, fmtLb, fmtMoney } from '../engine/calc';
import { Button, Card, GpPill } from './ui';

function DealCard({
  deal,
  onOpen,
  onDuplicate,
  onDelete,
}: {
  deal: Deal;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const result = useMemo(() => calculateDeal(deal), [deal]);
  const priced = result.products.filter(p => p.landedPerMT > 0);
  const shown = priced.slice(0, 4);

  return (
    <Card className="flex flex-col hover:border-blue-300 hover:shadow-md transition-all group">
      <button type="button" onClick={onOpen} className="text-left px-4 pt-3.5 pb-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 truncate">{deal.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {deal.incoterm} · {deal.shippingType === 'container' ? 'Container' : 'Break bulk'}
              {deal.destinationPort ? ` · ${deal.destinationPort}` : ''}
            </p>
          </div>
        </div>

        {shown.length > 0 ? (
          <table className="w-full mt-3 text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-slate-400 [&>th]:font-medium [&>th]:pb-1">
                <th className="text-left">Size</th>
                <th className="text-right">Landed $/lb</th>
                <th className="text-right">Sale</th>
                <th className="text-right">GP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shown.map(p => (
                <tr key={p.productId} className="[&>td]:py-1">
                  <td className="text-slate-700 font-medium">{p.description || '—'}</td>
                  <td className="num text-right text-slate-900 font-semibold">{fmtLb(p.landedPerLb)}</td>
                  <td className="num text-right text-slate-600">
                    {p.salePerLb != null ? p.salePerLb.toFixed(3) : '—'}
                  </td>
                  <td className="text-right">
                    <GpPill gp={p.gpPct} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-3 text-xs text-slate-400 italic">No prices entered yet</p>
        )}
        {priced.length > shown.length && (
          <p className="mt-1 text-[11px] text-slate-400">+{priced.length - shown.length} more sizes</p>
        )}
      </button>

      <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100">
        <span className="text-[11px] text-slate-400">
          {result.hasQuantities ? (
            <>
              Total margin{' '}
              <span className={`num font-semibold ${result.totalMarginDollars >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                ${fmtMoney(result.totalMarginDollars, 0)}
              </span>
            </>
          ) : (
            `Updated ${new Date(deal.updatedAt).toLocaleDateString()}`
          )}
        </span>
        <span className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" className="!px-2 !py-0.5 !text-xs" onClick={onDuplicate} title="Duplicate deal">
            Duplicate
          </Button>
          <Button
            variant="ghost"
            className="!px-2 !py-0.5 !text-xs !text-rose-500 hover:!text-rose-700"
            onClick={onDelete}
            title="Delete deal"
          >
            Delete
          </Button>
        </span>
      </div>
    </Card>
  );
}

export function DealsList({
  deals,
  onOpen,
  onNew,
  onDuplicate,
  onDelete,
  onOpenSettings,
}: {
  deals: Deal[];
  onOpen: (id: string) => void;
  onNew: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenSettings: () => void;
}) {
  const sorted = [...deals].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Steel Pricing</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Landed cost &amp; quote workspace — open a deal, change a price, everything recalculates.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onOpenSettings}>Rates &amp; defaults</Button>
          <Button variant="primary" onClick={onNew}>
            + New deal
          </Button>
        </div>
      </header>

      {sorted.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-slate-500 mb-4">No deals yet.</p>
          <Button variant="primary" onClick={onNew}>
            Create your first deal
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map(deal => (
            <DealCard
              key={deal.id}
              deal={deal}
              onOpen={() => onOpen(deal.id)}
              onDuplicate={() => onDuplicate(deal.id)}
              onDelete={() => {
                if (confirm(`Delete "${deal.name}"? This cannot be undone.`)) onDelete(deal.id);
              }}
            />
          ))}
        </div>
      )}

      <p className="mt-8 text-center text-[11px] text-slate-400">
        Calculations are verified against the original pricing workbooks by an automated test suite.
        Hover any number in a deal's cost breakdown to see its formula.
      </p>
    </div>
  );
}
