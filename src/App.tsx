import { useEffect, useState } from 'react';
import type { Deal, GlobalDefaults } from './engine/types';
import {
  GLOBAL_DEFAULTS,
  makeId,
  newDeal,
  normalizeDeal,
  normalizeDeals,
  normalizeDefaults,
  seedDeals,
} from './data/appDefaults';
import { decodeDealFromHash } from './data/share';
import { useLocalStorage } from './hooks/useLocalStorage';
import { DealsList } from './components/DealsList';
import { DealWorkspace } from './components/DealWorkspace';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SettingsModal } from './components/SettingsModal';

function AppContent() {
  // Stored data may predate this version, so it is merged over current
  // defaults on load — see normalizeDeals / normalizeDefaults.
  const [deals, setDeals] = useLocalStorage<Deal[]>('spt2-deals', seedDeals, normalizeDeals);
  const [defaults, setDefaults] = useLocalStorage<GlobalDefaults>(
    'spt2-defaults',
    GLOBAL_DEFAULTS,
    normalizeDefaults,
  );
  const [openDealId, setOpenDealId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Import a deal shared via URL hash (#d=...)
  useEffect(() => {
    const shared = normalizeDeal(decodeDealFromHash(location.hash));
    if (shared) {
      const imported: Deal = {
        ...shared,
        id: makeId('deal'),
        updatedAt: new Date().toISOString(),
      };
      setDeals(prev => [...prev, imported]);
      setOpenDealId(imported.id);
      history.replaceState(null, '', location.pathname + location.search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDeal = deals.find(d => d.id === openDealId) ?? null;

  const updateDeal = (updated: Deal) =>
    setDeals(prev => prev.map(d => (d.id === updated.id ? updated : d)));

  const createDeal = () => {
    const deal = newDeal(defaults);
    setDeals(prev => [...prev, deal]);
    setOpenDealId(deal.id);
  };

  const duplicateDeal = (id: string) => {
    const source = deals.find(d => d.id === id);
    if (!source) return;
    const now = new Date().toISOString();
    const copy: Deal = {
      ...structuredClone(source),
      id: makeId('deal'),
      name: `${source.name} (copy)`,
      createdAt: now,
      updatedAt: now,
    };
    setDeals(prev => [...prev, copy]);
    setOpenDealId(copy.id);
  };

  const deleteDeal = (id: string) => {
    setDeals(prev => prev.filter(d => d.id !== id));
    if (openDealId === id) setOpenDealId(null);
  };

  return (
    <div className="min-h-screen">
      {openDeal ? (
        <DealWorkspace
          deal={openDeal}
          onChange={updateDeal}
          onBack={() => setOpenDealId(null)}
          onDuplicate={() => duplicateDeal(openDeal.id)}
          onDelete={() => deleteDeal(openDeal.id)}
          defaults={defaults}
          onDefaultsChange={setDefaults}
        />
      ) : (
        <DealsList
          deals={deals}
          onOpen={setOpenDealId}
          onNew={createDeal}
          onDuplicate={duplicateDeal}
          onDelete={deleteDeal}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {showSettings && (
        <SettingsModal defaults={defaults} onChange={setDefaults} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
