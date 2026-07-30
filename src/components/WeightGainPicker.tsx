import { Modal } from './ui';
import { WEIGHT_GAIN_TABLE } from '../data/appDefaults';

/**
 * Weight-gain lookup: click a % Gain cell (TW or JP/KR column) to apply it to
 * the product being edited.
 */
export function WeightGainPicker({
  onSelect,
  onClose,
}: {
  onSelect: (pct: number) => void;
  onClose: () => void;
}) {
  const pick = (pct: number) => {
    onSelect(pct);
    onClose();
  };

  const gainCell = (pct: number) => (
    <button
      type="button"
      onClick={() => pick(pct)}
      className={`num w-full rounded px-2 py-1 text-right text-sm font-semibold transition-colors hover:ring-2 hover:ring-blue-400 ${
        pct >= 5
          ? 'bg-rose-50 text-rose-700'
          : pct >= 3
            ? 'bg-amber-50 text-amber-700'
            : 'bg-emerald-50 text-emerald-700'
      }`}
    >
      {pct.toFixed(2)}%
    </button>
  );

  return (
    <Modal
      title="Weight gains by thickness"
      subtitle="304/L and 316/L plate — click a % gain to apply it. Pick the column for the mill's origin."
      onClose={onClose}
      wide
    >
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-slate-50 text-xs text-slate-500">
          <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:font-medium border-b border-slate-200">
            <th className="text-left">Thickness</th>
            <th className="text-right">Sell wt (lb/ft²)</th>
            <th className="text-right">Buy — TW</th>
            <th className="text-right">% Gain — TW</th>
            <th className="text-right">Buy — JP/KR</th>
            <th className="text-right">% Gain — JP/KR</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {WEIGHT_GAIN_TABLE.map(row => (
            <tr key={row.thickness} className="[&>td]:px-3 [&>td]:py-1.5">
              <td className="font-medium text-slate-800">{row.thickness}</td>
              <td className="num text-right text-slate-500">{row.sellWeight.toFixed(2)}</td>
              <td className="num text-right text-slate-500">{row.buyWeightTW.toFixed(2)}</td>
              <td className="w-28">{gainCell(row.gainPctTW)}</td>
              <td className="num text-right text-slate-500">{row.buyWeightJP.toFixed(2)}</td>
              <td className="w-28">{gainCell(row.gainPctJP)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-4 py-3 text-xs text-slate-500 border-t border-slate-200">
        Weight gain = theoretical (sell) weight vs mill (buy) weight. It reduces the effective material
        cost per sold MT; duties stay on the contract price.
      </p>
    </Modal>
  );
}
