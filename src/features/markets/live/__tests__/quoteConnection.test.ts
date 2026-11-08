import { describe, expect, it, vi } from 'vitest';
import { backoffDelay, createQuoteConnection, type EventSourceLike } from '../quoteConnection';

class FakeEventSource implements EventSourceLike {
  public onopen: ((event: Event) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public listeners = new Map<string, Array<(event: MessageEvent<string>) => void>>();
  public closed = false;

  constructor(public url: string) {}

  addEventListener(type: string, listener: (event: MessageEvent<string>) => void): void {
    const list = this.listeners.get(type) ?? [];
    list.push(listener);
    this.listeners.set(type, list);
  }

  close(): void {
    this.closed = true;
  }

  emitOpen(): void {
    this.onopen?.(new Event('open'));
  }

  emitError(): void {
    this.onerror?.(new Event('error'));
  }

  emitEvent(type: string, data: string): void {
    const list = this.listeners.get(type) ?? [];
    const event = { data } as MessageEvent<string>;
    for (const listener of list) {
      listener(event);
    }
  }
}

describe('backoffDelay', () => {
  it('calculates exponential delay capped at 30 seconds', () => {
    expect(backoffDelay(0)).toBe(1000);
    expect(backoffDelay(1)).toBe(2000);
    expect(backoffDelay(2)).toBe(4000);
    expect(backoffDelay(3)).toBe(8000);
    expect(backoffDelay(4)).toBe(16000);
    expect(backoffDelay(5)).toBe(30000);
    expect(backoffDelay(10)).toBe(30000);
  });
});

describe('createQuoteConnection', () => {
  it('manages connection lifecycle and refcounted subscriptions', () => {
    const sources: FakeEventSource[] = [];
    const onQuote = vi.fn();
    const onStatus = vi.fn();
    const scheduled = new Map<number, { fn: () => void; ms: number }>();
    let nextId = 1;

    const runNext = () => {
      if (scheduled.size === 0) return;
      let minId = -1;
      let minMs = Infinity;
      for (const [id, item] of scheduled) {
        if (item.ms < minMs) {
          minMs = item.ms;
          minId = id;
        }
      }
      const item = scheduled.get(minId);
      scheduled.delete(minId);
      item?.fn();
    };

    const connection = createQuoteConnection({
      createEventSource: (url) => {
        const es = new FakeEventSource(url);
        sources.push(es);
        return es;
      },
      onQuote,
      onStatus,
      schedule: (fn, ms) => {
        const id = nextId++;
        scheduled.set(id, { fn, ms });
        return id;
      },
      cancel: (handle) => {
        scheduled.delete(handle as number);
      },
    });

    const unsub1 = connection.subscribe(['SIM-FJRD']);
    // Execute scheduled sync (ms: 0)
    runNext();

    expect(onStatus).toHaveBeenCalledWith('connecting');
    expect(sources.length).toBe(1);
    expect(sources[0].url).toContain('ids=SIM-FJRD');
    expect(connection.streamedIds()).toEqual(['SIM-FJRD']);

    // Emitting open transitions status to 'live'
    sources[0].emitOpen();
    expect(onStatus).toHaveBeenCalledWith('live');

    // Emitting a quote event
    sources[0].emitEvent(
      'quote',
      JSON.stringify({
        orderbook_id: 'SIM-FJRD',
        symbol: 'FJRD',
        last: 123.45,
        bid: 123.35,
        ask: 123.55,
        change_percent: 1.25,
        currency: 'SEK',
        updated_at: '2026-11-08T12:00:00Z',
      }),
    );
    expect(onQuote).toHaveBeenCalledWith(
      expect.objectContaining({
        orderbook_id: 'SIM-FJRD',
        last: 123.45,
      }),
    );

    // Emitting error transitions to reconnecting
    sources[0].emitError();
    expect(onStatus).toHaveBeenCalledWith('reconnecting');
    expect(sources[0].closed).toBe(true);

    // Second subscriber for another id
    const unsub2 = connection.subscribe(['SIM-NVE']);
    runNext();
    expect(sources.length).toBe(2);
    expect(sources[1].url).toContain('ids=SIM-FJRD%2CSIM-NVE');

    // Unsubscribing one preserves the other
    unsub1();
    runNext();
    expect(connection.streamedIds()).toEqual(['SIM-NVE']);

    // Unsubscribing last id transitions to idle and closes source
    unsub2();
    runNext();
    expect(onStatus).toHaveBeenCalledWith('idle');
    expect(sources[sources.length - 1].closed).toBe(true);
    expect(connection.streamedIds()).toEqual([]);
  });
});
