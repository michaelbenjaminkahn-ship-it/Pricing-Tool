import type { ProductForm } from '../engine/types';
import { Modal } from './ui';
import { SHEET_GAUGES, WEIGHT_GAIN_TABLE } from '../data/appDefaults';

/**
 * Read-only reference. Weight gain is applied automatically when a plate
 * thickness is picked — this is here so the number can be checked against the
 * source sheet. Sheet has no gain data, so gauges show thicknesses only.
 */
export function WeightGainPicker({ form, onClose }: { form: ProductForm; onClose: () => void }) {
  return form === 'sheet' ? <GaugeReference onClose={onClose} /> : <PlateGainTable onClose={onClose} />;
}

function PlateGainTable({ onClose }: { onClose: () => void }) {
  return (
    <Modal
      title="Plate weight gains by thickness"
      subtitle="304/L and 316/L. The % Gain TW column is what gets applied."
      onClose={onClose}
      wide
    >
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-slate-50 text-xs text-slate-500">
          <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:font-medium border-b border-slate-200">
            <th className="text-left">Thickness</th>
            <th className="text-right">Sell</th>
            <th className="text-right">Buy TW</th>
            <th className="text-right">Buy JP</th>
            <th className="text-right">% Gain TW</th>
          </tr>
          <tr className="text-[10px] text-slate-400">
            <th />
            <th colSpan={3} className="pb-1 font-normal text-center">
              Weight / sq. ft
            </th>
            <th className="pb-1 font-normal text-right pr-3">applied</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {WEIGHT_GAIN_TABLE.map(row => (
            <tr key={row.thickness} className="[&>td]:px-3 [&>td]:py-1.5">
              <td className="font-medium text-slate-800">{row.thickness}</td>
              <td className="num text-right text-slate-500">{row.sellWeight}</td>
              <td className="num text-right text-slate-500">{row.buyWeightTW}</td>
              <td className="num text-right text-slate-500">{row.buyWeightJP}</td>
              <td className="num text-right font-semibold text-slate-800 bg-blue-50/60">
                {row.gainPct.toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-4 py-3 text-xs text-slate-500 border-t border-slate-200">
        Weight gain = theoretical (sell) weight vs mill (buy) weight. It reduces the effective material cost per
        sold MT; duties stay on the contract price. Buy weights are shown for reference only — the % Gain TW
        column is the figure used, and it can be overridden per size on the quote.
      </p>
    </Modal>
  );
}

function GaugeReference({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Sheet gauges" subtitle="Nominal thicknesses for stainless sheet, 10–26 GA." onClose={onClose}>
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-slate-50 text-xs text-slate-500">
          <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:font-medium border-b border-slate-200">
            <th className="text-left">Gauge</th>
            <th className="text-right">Nominal thickness (in)</th>
            <th className="text-right">Weight gain</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {SHEET_GAUGES.map(g => (
            <tr key={g.gauge} className="[&>td]:px-3 [&>td]:py-1.5">
              <td className="font-medium text-slate-800">{g.gauge}</td>
              <td className="num text-right text-slate-500">{g.nominalIn.toFixed(4)}</td>
              <td className="text-right text-slate-400 text-xs">enter manually</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-4 py-3 text-xs text-slate-500 border-t border-slate-200">
        There is no weight-gain table for sheet yet, so picking a gauge leaves the weight gain field as you set
        it rather than filling in a figure that has not been checked. Send through the sheet gain percentages and
        they can be wired up the same way plate is.
      </p>
    </Modal>
  );
}
