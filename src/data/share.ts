import type { Deal } from '../engine/types';

// Deal share links: the deal JSON is base64-encoded into the URL hash, so a
// colleague can open the exact deal with no backend. (~2 KB per deal.)

export function encodeDealToHash(deal: Deal): string {
  const json = JSON.stringify(deal);
  const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(json)));
  return `#d=${encodeURIComponent(b64)}`;
}

export function decodeDealFromHash(hash: string): Deal | null {
  const match = /^#d=(.+)$/.exec(hash);
  if (!match) return null;
  try {
    const b64 = decodeURIComponent(match[1]);
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const deal = JSON.parse(new TextDecoder().decode(bytes)) as Deal;
    if (!deal || typeof deal !== 'object' || !Array.isArray(deal.products)) return null;
    return deal;
  } catch {
    return null;
  }
}
