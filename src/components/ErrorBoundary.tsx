import { Component, type ReactNode } from 'react';

/**
 * Last line of defence. A render error used to leave a blank white page with
 * no way back; now it shows what went wrong and offers recovery that does not
 * require clearing site data by hand.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('Steel Pricing crashed:', error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h1 className="text-lg font-bold text-slate-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-600">
            The page hit an error and stopped. Your saved deals are still on this device — reloading is
            usually enough.
          </p>
          <pre className="mt-3 rounded-md bg-slate-50 border border-slate-200 p-3 text-xs text-rose-700 whitespace-pre-wrap break-words">
            {error.message}
          </pre>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => location.reload()}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={() => {
                const backup = localStorage.getItem('spt2-deals');
                if (backup) {
                  // Keep a copy so nothing is lost if the reset was a mistake.
                  localStorage.setItem('spt2-deals-backup', backup);
                }
                localStorage.removeItem('spt2-defaults');
                location.reload();
              }}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Reset settings &amp; reload
            </button>
            <button
              type="button"
              onClick={() => {
                if (!confirm('Delete all saved deals and settings on this device? This cannot be undone.')) return;
                localStorage.removeItem('spt2-deals');
                localStorage.removeItem('spt2-defaults');
                location.reload();
              }}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
            >
              Start fresh
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            “Reset settings” keeps your deals and only restores rates and lists to defaults.
          </p>
        </div>
      </div>
    );
  }
}
