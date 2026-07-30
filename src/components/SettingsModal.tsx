import { useState } from 'react';
import type { GlobalDefaults } from '../engine/types';
import { GLOBAL_DEFAULTS } from '../data/appDefaults';
import { Button, Field, Modal, NumInput, SelectInput, TextInput } from './ui';

type Tab = 'rates' | 'handling' | 'ports';

/**
 * Global defaults editor. Defaults seed NEW deals; existing deals keep their
 * own snapshot (use "Apply global defaults" inside a deal to pull these in).
 */
export function SettingsModal({
  defaults,
  onChange,
  onClose,
}: {
  defaults: GlobalDefaults;
  onChange: (d: GlobalDefaults) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>('rates');

  const patchRates = (p: Partial<GlobalDefaults['rates']>) =>
    onChange({ ...defaults, rates: { ...defaults.rates, ...p } });
  const patchFinance = (p: Partial<GlobalDefaults['finance']>) =>
    onChange({ ...defaults, finance: { ...defaults.finance, ...p } });
  const patchHandling = (p: Partial<GlobalDefaults['handling']>) =>
    onChange({ ...defaults, handling: { ...defaults.handling, ...p } });

  const tabs: { key: Tab; label: string }[] = [
    { key: 'rates', label: 'Rates & finance' },
    { key: 'handling', label: 'Handling' },
    { key: 'ports', label: 'Port reference' },
  ];

  return (
    <Modal
      title="Rates & defaults"
      subtitle="These seed new deals. Existing deals keep their own numbers until you use “Apply global defaults” inside the deal."
      onClose={onClose}
      wide
    >
      <div className="border-b border-slate-200 px-5 flex gap-1">
        {tabs.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-3 py-2.5 text-sm font-medium border-b-2 -mb-px ${
              tab === t.key
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === 'rates' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Duties & insurance</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Field label="Section 232 %">
                  <NumInput value={defaults.rates.sec232Pct} onChange={v => patchRates({ sec232Pct: v })} suffix="%" />
                </Field>
                <Field label="HMF %">
                  <NumInput value={defaults.rates.hmfPct} onChange={v => patchRates({ hmfPct: v })} suffix="%" />
                </Field>
                <Field label="MPF %">
                  <NumInput value={defaults.rates.mpfPct} onChange={v => patchRates({ mpfPct: v })} suffix="%" />
                </Field>
                <Field label="Marine ins. %">
                  <NumInput
                    value={defaults.rates.marineInsPct}
                    onChange={v => patchRates({ marineInsPct: v })}
                    suffix="%"
                  />
                </Field>
                <Field label="Credit ins. %">
                  <NumInput
                    value={defaults.rates.creditInsPct}
                    onChange={v => patchRates({ creditInsPct: v })}
                    suffix="%"
                  />
                </Field>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Finance</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Field label="LC pre-cash %">
                  <NumInput
                    value={defaults.finance.lcPreCash.ratePct}
                    onChange={v => patchFinance({ lcPreCash: { ...defaults.finance.lcPreCash, ratePct: v } })}
                    suffix="%"
                  />
                </Field>
                <Field label="Pre-cash days">
                  <NumInput
                    value={defaults.finance.lcPreCash.days}
                    onChange={v => patchFinance({ lcPreCash: { ...defaults.finance.lcPreCash, days: v } })}
                  />
                </Field>
                <Field label="LC sailing %">
                  <NumInput
                    value={defaults.finance.lcSailing.ratePct}
                    onChange={v => patchFinance({ lcSailing: { ...defaults.finance.lcSailing, ratePct: v } })}
                    suffix="%"
                  />
                </Field>
                <Field label="Sailing days">
                  <NumInput
                    value={defaults.finance.lcSailing.days}
                    onChange={v => patchFinance({ lcSailing: { ...defaults.finance.lcSailing, days: v } })}
                  />
                </Field>
                <Field label="Tariff fin. %/yr">
                  <NumInput
                    value={defaults.finance.tariff.ratePct}
                    onChange={v => patchFinance({ tariff: { ...defaults.finance.tariff, ratePct: v } })}
                    suffix="%"
                  />
                </Field>
                <Field label="Tariff fin. days">
                  <NumInput
                    value={defaults.finance.tariff.days}
                    onChange={v => patchFinance({ tariff: { ...defaults.finance.tariff, days: v } })}
                  />
                </Field>
                <Field label="% of tariff financed">
                  <NumInput
                    value={defaults.finance.tariff.financedPct}
                    onChange={v => patchFinance({ tariff: { ...defaults.finance.tariff, financedPct: v } })}
                    suffix="%"
                  />
                </Field>
                <Field label="Finance base">
                  <SelectInput
                    value={defaults.finance.basis}
                    onChange={v => patchFinance({ basis: v as GlobalDefaults['finance']['basis'] })}
                    options={[
                      { value: 'contract', label: 'Contract price' },
                      { value: 'cfr', label: 'Contract + freight' },
                    ]}
                  />
                </Field>
              </div>
            </div>
          </div>
        )}

        {tab === 'handling' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Drayage $/container">
              <NumInput
                value={defaults.handling.drayagePerContainer}
                onChange={v => patchHandling({ drayagePerContainer: v })}
                prefix="$"
              />
            </Field>
            <Field label="Container capacity MT">
              <NumInput
                value={defaults.handling.containerCapacityMT}
                onChange={v => patchHandling({ containerCapacityMT: v })}
              />
            </Field>
            <Field label="Stevedoring $/MT">
              <NumInput
                value={defaults.handling.stevedorePerMT}
                onChange={v => patchHandling({ stevedorePerMT: v })}
                prefix="$"
              />
            </Field>
            <Field label="MT per FTL">
              <NumInput value={defaults.handling.ftlCapacityMT} onChange={v => patchHandling({ ftlCapacityMT: v })} />
            </Field>
            <Field label="Commission name">
              <TextInput
                value={defaults.handling.commissionName}
                onChange={v => patchHandling({ commissionName: v })}
              />
            </Field>
            <Field label="Commission %">
              <NumInput
                value={defaults.handling.commissionPct}
                onChange={v => patchHandling({ commissionPct: v })}
                suffix="%"
              />
            </Field>
            <Field label="Default markup %">
              <NumInput value={defaults.markupPct} onChange={v => onChange({ ...defaults, markupPct: v })} suffix="%" />
            </Field>
          </div>
        )}

        {tab === 'ports' && (
          <div>
            <p className="text-xs text-slate-500 mb-3">
              Selecting a destination port in a deal autofills these rates.
            </p>
            <table className="w-full text-sm max-w-lg">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-slate-200 [&>th]:pb-1.5 [&>th]:font-medium">
                  <th className="text-left">Port</th>
                  <th className="text-right">Drayage $/cont.</th>
                  <th className="text-right">Storage $/MT/mo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {defaults.destinationPorts.map(port => (
                  <tr key={port} className="[&>td]:py-1">
                    <td className="text-slate-700 font-medium">{port}</td>
                    <td className="w-32 pl-3">
                      <NumInput
                        value={defaults.drayageByPort[port] ?? 0}
                        onChange={v =>
                          onChange({ ...defaults, drayageByPort: { ...defaults.drayageByPort, [port]: v } })
                        }
                        prefix="$"
                      />
                    </td>
                    <td className="w-32 pl-3">
                      <NumInput
                        value={defaults.storageByPort[port] ?? 0}
                        onChange={v =>
                          onChange({ ...defaults, storageByPort: { ...defaults.storageByPort, [port]: v } })
                        }
                        prefix="$"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="px-5 py-3 border-t border-slate-200 flex justify-between">
        <Button
          variant="danger"
          onClick={() => {
            if (confirm('Reset all defaults to factory values?')) onChange(structuredClone(GLOBAL_DEFAULTS));
          }}
        >
          Reset to factory defaults
        </Button>
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      </div>
    </Modal>
  );
}
