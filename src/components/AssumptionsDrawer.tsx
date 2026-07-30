import type { Deal, GlobalDefaults } from '../engine/types';
import { Button, ComboSelect, Field, Modal, NumInput, SelectInput, ToggleRow } from './ui';

/**
 * Everything that is set once per lane and then rarely touched. Kept out of the
 * day-to-day screen so pricing a quote only exposes the fields that change.
 */
export function AssumptionsDrawer({
  deal,
  onChange,
  defaults,
  onClose,
}: {
  deal: Deal;
  onChange: (deal: Deal) => void;
  defaults: GlobalDefaults;
  onClose: () => void;
}) {
  const patch = (p: Partial<Deal>) => onChange({ ...deal, ...p, updatedAt: new Date().toISOString() });
  const patchRates = (p: Partial<Deal['rates']>) => patch({ rates: { ...deal.rates, ...p } });
  const patchHandling = (p: Partial<Deal['handling']>) => patch({ handling: { ...deal.handling, ...p } });
  const patchFinance = (p: Partial<Deal['finance']>) => patch({ finance: { ...deal.finance, ...p } });

  const isCIF = deal.incoterm === 'CIF';
  const isContainer = deal.shippingType === 'container';

  const applyDefaults = () => {
    if (
      !confirm(
        'Replace this deal’s duties, finance, and handling with the current global defaults? Prices and freight are kept.',
      )
    )
      return;
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
        drayagePerContainer:
          defaults.drayageByPort[deal.destinationPort] ?? defaults.handling.drayagePerContainer,
      },
    });
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">{title}</h3>
      {children}
    </div>
  );

  return (
    <Modal
      title="Deal assumptions"
      subtitle="Set once per lane. These feed every size in the quote."
      onClose={onClose}
      wide
    >
      <div className="p-5 space-y-6">
        <Section title="Duties & insurance">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Section 232 %">
              <NumInput value={deal.rates.sec232Pct} onChange={v => patchRates({ sec232Pct: v })} suffix="%" />
            </Field>
            <Field label="HMF %">
              <NumInput value={deal.rates.hmfPct} onChange={v => patchRates({ hmfPct: v })} suffix="%" />
            </Field>
            <Field label="MPF %">
              <NumInput value={deal.rates.mpfPct} onChange={v => patchRates({ mpfPct: v })} suffix="%" />
            </Field>
            <Field label="Credit ins. %">
              <NumInput value={deal.rates.creditInsPct} onChange={v => patchRates({ creditInsPct: v })} suffix="%" />
            </Field>
            {!isCIF && (
              <Field label="Marine ins. %">
                <NumInput value={deal.rates.marineInsPct} onChange={v => patchRates({ marineInsPct: v })} suffix="%" />
              </Field>
            )}
          </div>
          {isCIF && (
            <p className="mt-1.5 text-[11px] text-slate-400">
              Marine insurance is already included in a CIF price, so it is not charged again.
            </p>
          )}
        </Section>

        <Section title="Finance">
          <div className="space-y-2.5">
            <ToggleRow
              label="LC — pre-cash"
              checked={deal.finance.lcPreCash.enabled}
              onChange={v => patchFinance({ lcPreCash: { ...deal.finance.lcPreCash, enabled: v } })}
            >
              <div className="grid grid-cols-2 gap-2 max-w-xs">
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
              <div className="grid grid-cols-2 gap-2 max-w-xs">
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
              <div className="grid grid-cols-3 gap-2 max-w-md">
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
            <Field label="Finance charged on" className="max-w-xs pt-1">
              <SelectInput
                value={deal.finance.basis}
                onChange={v => patchFinance({ basis: v as Deal['finance']['basis'] })}
                options={[
                  { value: 'contract', label: 'Contract price' },
                  { value: 'cfr', label: 'Contract + freight (CFR)' },
                ]}
              />
            </Field>
          </div>
        </Section>

        <Section title="Handling & other">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {isContainer ? (
              <>
                <Field label="Drayage $/container">
                  <NumInput
                    value={deal.handling.drayagePerContainer}
                    onChange={v => patchHandling({ drayagePerContainer: v })}
                    prefix="$"
                  />
                </Field>
                <Field label="Container capacity MT">
                  <NumInput
                    value={deal.handling.containerCapacityMT}
                    onChange={v => patchHandling({ containerCapacityMT: v })}
                    suffix="MT"
                  />
                </Field>
              </>
            ) : (
              <Field label="Stevedoring $/MT">
                <NumInput
                  value={deal.handling.stevedorePerMT}
                  onChange={v => patchHandling({ stevedorePerMT: v })}
                  prefix="$"
                />
              </Field>
            )}
            <Field label="Storage $/MT/mo">
              <NumInput
                value={deal.handling.storagePerMTMonth}
                onChange={v => patchHandling({ storagePerMTMonth: v })}
                prefix="$"
              />
            </Field>
            <Field label="Storage months">
              <NumInput value={deal.handling.storageMonths} onChange={v => patchHandling({ storageMonths: v })} />
            </Field>
            <Field label="Trucking $/FTL">
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
            <Field label="Commission agent">
              <ComboSelect
                value={deal.handling.commissionName}
                onChange={name => {
                  const agent = defaults.commissionAgents.find(a => a.name === name);
                  patchHandling({ commissionName: name, ...(agent ? { commissionPct: agent.pct } : {}) });
                }}
                options={defaults.commissionAgents.map(a => a.name)}
              />
            </Field>
            <Field label="Commission %">
              <NumInput
                value={deal.handling.commissionPct}
                onChange={v => patchHandling({ commissionPct: v })}
                suffix="%"
              />
            </Field>
            {isCIF && (
              <Field label="Freight adder $/MT">
                <NumInput
                  value={deal.freightAdderPerMT}
                  onChange={v => patch({ freightAdderPerMT: v })}
                  prefix="$"
                />
              </Field>
            )}
          </div>
        </Section>

        <Section title="Notes">
          <textarea
            value={deal.notes}
            onChange={e => patch({ notes: e.target.value })}
            rows={2}
            placeholder="Anything worth remembering about this lane…"
            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
          />
        </Section>
      </div>

      <div className="px-5 py-3 border-t border-slate-200 flex justify-between">
        <Button onClick={applyDefaults}>Reset to global defaults</Button>
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      </div>
    </Modal>
  );
}
