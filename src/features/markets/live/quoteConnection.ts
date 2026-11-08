import { MAX_STREAM_IDS, QUOTE_EVENT, parseQuoteEvent, quoteStreamUrl } from '../api/quoteStream';
import { useLiveQuoteStore, type StreamStatus } from '../store/useLiveQuoteStore';
import type { Quote } from '../types';

// One EventSource per browser tab for every live price on screen (story NW-09). Components subscribe the ids
// they show; the connection streams the union of all subscribed ids, re-opens when that set changes, and
// reconnects with exponential backoff after an error. With no ids left it closes.

/** The parts of EventSource the connection uses (a fake in tests). */
export interface EventSourceLike {
  onopen: ((event: Event) => void) | null;
  onerror: ((event: Event) => void) | null;
  addEventListener(type: string, listener: (event: MessageEvent<string>) => void): void;
  close(): void;
}

export interface QuoteConnectionDeps {
  createEventSource: (url: string) => EventSourceLike;
  onQuote: (quote: Quote) => void;
  onStatus: (status: StreamStatus) => void;
  /** Called with the streamed ids whenever a new stream opens, so stale quotes of other ids can be dropped. */
  onIds?: (ids: readonly string[]) => void;
  schedule?: (fn: () => void, ms: number) => unknown;
  cancel?: (handle: unknown) => void;
}

export interface QuoteConnection {
  /** Adds ids to the stream; the returned function removes them again (call it exactly once). */
  subscribe: (ids: readonly string[]) => () => void;
  /** The ids currently streamed (sorted), for tests and debugging. */
  streamedIds: () => readonly string[];
}

/** Reconnect delay after the n-th consecutive failure (0-based): 1 s, 2 s, 4 s, … capped at 30 s. */
export function backoffDelay(attempt: number): number {
  return Math.min(30_000, 1_000 * 2 ** Math.max(0, attempt));
}

export function createQuoteConnection(deps: QuoteConnectionDeps): QuoteConnection {
  const schedule = deps.schedule ?? ((fn: () => void, ms: number) => setTimeout(fn, ms));
  const cancel = deps.cancel ?? ((handle: unknown) => clearTimeout(handle as ReturnType<typeof setTimeout>));
  const counts = new Map<string, number>();
  let source: EventSourceLike | null = null;
  let streamed: string[] = [];
  let attempt = 0;
  let status: StreamStatus = 'idle';
  let retryTimer: unknown = null;
  let syncTimer: unknown = null;

  const setStatus = (next: StreamStatus): void => {
    if (next !== status) {
      status = next;
      deps.onStatus(next);
    }
  };

  const closeSource = (): void => {
    if (source) {
      source.onopen = null;
      source.onerror = null;
      source.close();
      source = null;
    }
    if (retryTimer !== null) {
      cancel(retryTimer);
      retryTimer = null;
    }
  };

  const open = (): void => {
    retryTimer = null;
    const es = deps.createEventSource(quoteStreamUrl(streamed));
    source = es;
    es.onopen = () => {
      if (source !== es) return;
      attempt = 0;
      setStatus('live');
    };
    es.addEventListener(QUOTE_EVENT, (event) => {
      if (source !== es) return;
      const quote = parseQuoteEvent(event.data);
      if (quote) deps.onQuote(quote);
      attempt = 0;
      setStatus('live');
    });
    // Network errors, non-200 answers and the server's own `event: error` (sent before it ends the stream) all
    // land here. EventSource gives up for good on some of them, so always close and retry with backoff.
    es.onerror = () => {
      if (source !== es) return;
      closeSource();
      setStatus('reconnecting');
      retryTimer = schedule(open, backoffDelay(attempt));
      attempt += 1;
    };
  };

  const sync = (): void => {
    syncTimer = null;
    const ids = [...counts.keys()].sort().slice(0, MAX_STREAM_IDS);
    if (ids.join(',') === streamed.join(',') && (source || retryTimer !== null || ids.length === 0)) return;
    closeSource();
    streamed = ids;
    attempt = 0;
    if (ids.length === 0) {
      setStatus('idle');
      return;
    }
    // Swapping the id set of an open stream keeps showing "Live"; only a first connect shows "Connecting…".
    if (status !== 'live') setStatus('connecting');
    deps.onIds?.(ids);
    open();
  };

  // Batch the subscribe/release calls of one render into a single reconnect.
  const scheduleSync = (): void => {
    if (syncTimer === null) syncTimer = schedule(sync, 0);
  };

  return {
    subscribe(ids) {
      const unique = [...new Set(ids.filter(Boolean))];
      for (const id of unique) counts.set(id, (counts.get(id) ?? 0) + 1);
      scheduleSync();
      let released = false;
      return () => {
        if (released) return;
        released = true;
        for (const id of unique) {
          const n = (counts.get(id) ?? 0) - 1;
          if (n <= 0) counts.delete(id);
          else counts.set(id, n);
        }
        scheduleSync();
      };
    },
    streamedIds: () => streamed,
  };
}

let shared: QuoteConnection | null | undefined;

/** The tab's shared connection, feeding useLiveQuoteStore; null where EventSource doesn't exist (SSR, tests). */
export function getQuoteConnection(): QuoteConnection | null {
  if (shared !== undefined) return shared;
  if (typeof window === 'undefined' || typeof window.EventSource !== 'function') return null;
  const store = useLiveQuoteStore.getState();
  shared = createQuoteConnection({
    createEventSource: (url) => new window.EventSource(url) as EventSourceLike,
    onQuote: store.applyQuote,
    onStatus: store.setStatus,
    onIds: store.retain,
  });
  return shared;
}
