import type { GainBasis, ProductForm } from '../engine/types';
import { Modal } from './ui';
import { SHEET_GAUGES, WEIGHT_GAIN_TABLE } from '../data/appDefaults';

/**
 * Read-only reference. Weight gain is applied automatically when a plate
 * thickness is picked — this is here so the number can be checked against the
 * source table. For sheet there is no gain data, so the gauge list is shown
 * with nominal thicknesses only.
 */
export function WeightGainPicker({
  basis,
  form,
  onClose,
}: {
  basis: GainBasis;
  form: ProductForm;
  onClose: () => void;
}) {
  if (form === 'sheet') return <GaugeReference onClose={onClose} />;
  return <PlateGainTable basis={basis} onClose={onClose} />;
}

function GaugeReference({ onClose }: { onClose: () => void }) {
  return (
    <Modal
      title="Sheet gauges"
      subtitle="Nominal thicknesses for stainless sheet, 10–26 GA."
      onClose={onClose}
    >
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

function PlateGainTable({ basis, onClose }: { basis: GainBasis; onClose: () => void }) {
  const activeCol = (col: GainBasis) =>
    col === basis ? 'bg-blue-50/60' : 'text-slate-400';

  return (
    <Modal
      title="Weight gains by thickness"
      subtitle={`304/L and 316/L plate. This deal’s origin uses the ${basis === 'JPKR' ? 'Japan/Korea' : 'Taiwan'} column (highlighted).`}
      onClose={onClose}
      wide
    >
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-slate-50 text-xs text-slate-500">
          <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:font-medium border-b border-slate-200">
            <th className="text-left">Thickness</th>
            <th className="text-right">Sell wt (lb/ft²)</th>
            <th className={`text-right ${activeCol('TW')}`}>Buy — TW</th>
            <th className={`text-right ${activeCol('TW')}`}>% Gain — TW</th>
            <th className={`text-right ${activeCol('JPKR')}`}>Buy — JP/KR</th>
            <th className={`text-right ${activeCol('JPKR')}`}>% Gain — JP/KR</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {WEIGHT_GAIN_TABLE.map(row => (
            <tr key={row.thickness} className="[&>td]:px-3 [&>td]:py-1.5">
              <td className="font-medium text-slate-800">{row.thickness}</td>
              <td className="num text-right text-slate-500">{row.sellWeight.toFixed(2)}</td>
              <td className={`num text-right ${activeCol('TW')}`}>{row.buyWeightTW.toFixed(2)}</td>
              <td className={`num text-right font-semibold ${basis === 'TW' ? 'bg-blue-50/60 text-slate-800' : 'text-slate-400'}`}>
                {row.gainPctTW.toFixed(2)}%
              </td>
              <td className={`num text-right ${activeCol('JPKR')}`}>{row.buyWeightJP.toFixed(2)}</td>
              <td className={`num text-right font-semibold ${basis === 'JPKR' ? 'bg-blue-50/60 text-slate-800' : 'text-slate-400'}`}>
                {row.gainPctJP.toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-4 py-3 text-xs text-slate-500 border-t border-slate-200">
        Weight gain = theoretical (sell) weight vs mill (buy) weight. It reduces the effective material cost per
        sold MT; duties stay on the contract price. Change which column a port uses under Rates &amp; defaults →
        Lists.
      </p>
    </Modal>
  );
}
