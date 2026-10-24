import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AssetChart } from '../AssetChart';
import { getInstrumentDetails } from '@/features/markets/api/market';
import type { Candle, CandlePeriod, InstrumentDetails } from '@/features/markets/types';

interface PriceChartMockProps {
  orderbookId: string;
  currency?: string;
  initialPeriod?: CandlePeriod;
  onCandles?: (candles: Candle[], period: CandlePeriod) => void;
  className?: string;
}

const priceChartProps: PriceChartMockProps[] = [];

vi.mock('@/features/markets/api/market', () => ({
  getInstrumentDetails: vi.fn<(orderbookId: string) => Promise<InstrumentDetails>>(),
}));

vi.mock('@/features/markets/components/PriceChart', () => ({
  PriceChart: (props: PriceChartMockProps) => {
    priceChartProps.push(props);
    return <div data-testid="price-chart" data-orderbook-id={props.orderbookId} />;
  },
}));

const getDetails = vi.mocked(getInstrumentDetails);

const fjord: InstrumentDetails = {
  orderbook_id: 'SIM-FJRD',
  symbol: 'FJRD',
  name: 'Fjord Energy AB',
  currency: 'SEK',
  market: 'XSTO',
  sector: 'Energy',
  description: 'Simulated energy company.',
  last_price: 1234.5,
  change_percent: 0.8,
  key_indicators: { pe_ratio: 12.3, dividend_yield_pct: 2.1, market_cap: 1_000_000_000 },
};

function candle(t: string, o: number, c: number): Candle {
  return { t, o, h: Math.max(o, c), l: Math.min(o, c), c, v: 1000 };
}

function lastPriceChartProps(): PriceChartMockProps {
  const props = priceChartProps.at(-1);
  if (!props) throw new Error('PriceChart was not rendered');
  return props;
}

describe('AssetChart', () => {
  beforeEach(() => {
    getDetails.mockReset();
    priceChartProps.length = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('charts SIM-FJRD by default and never mentions Apple', async () => {
    getDetails.mockResolvedValue(fjord);

    render(<AssetChart />);

    expect(getDetails).toHaveBeenCalledWith('SIM-FJRD');
    expect(await screen.findByRole('heading', { name: 'FJRD' })).toBeInTheDocument();
    expect(screen.getByTestId('price-chart')).toHaveAttribute('data-orderbook-id', 'SIM-FJRD');
    expect(screen.queryByText(/AAPL/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Apple/)).not.toBeInTheDocument();
  });

  it('renders the name link, market, badge and last price without a dollar sign', async () => {
    getDetails.mockResolvedValue(fjord);

    render(<AssetChart />);

    const link = await screen.findByRole('link', { name: 'Fjord Energy AB' });
    expect(link).toHaveAttribute('href', '/markets/SIM-FJRD');
    expect(screen.getByText(/· XSTO/)).toBeInTheDocument();
    expect(screen.getByText('Simulated market data')).toBeInTheDocument();
    expect(screen.getByTestId('asset-last-price')).toHaveTextContent('1,234.50 SEK');
    expect(document.body.textContent).not.toContain('$');

    const props = lastPriceChartProps();
    expect(props.currency).toBe('SEK');
    expect(props.initialPeriod).toBe('1m');
  });

  it('shows the selected period change reported by PriceChart', async () => {
    getDetails.mockResolvedValue(fjord);
    render(<AssetChart />);
    await screen.findByRole('heading', { name: 'FJRD' });

    act(() => {
      lastPriceChartProps().onCandles?.(
        [candle('2026-10-01T00:00:00Z', 100, 101), candle('2026-10-02T00:00:00Z', 101, 101.25)],
        '1m',
      );
    });
    expect(screen.getByTestId('asset-period-change')).toHaveTextContent('+1.25 SEK (+1.25%)');
    expect(screen.getByTestId('asset-period-change')).toHaveTextContent('1M');

    act(() => {
      lastPriceChartProps().onCandles?.([candle('2026-09-01T00:00:00Z', 200, 190)], '1y');
    });
    expect(screen.getByTestId('asset-period-change')).toHaveTextContent('-10.00 SEK (-5.00%)');
    expect(screen.getByTestId('asset-period-change')).toHaveTextContent('1Y');
  });

  it('keeps the chart and titles it with the id when details fail', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    getDetails.mockRejectedValue(new Error('not found'));

    render(<AssetChart orderbookId="SIM-OTHR" />);

    const link = await screen.findByRole('link', { name: 'SIM-OTHR' });
    expect(link).toHaveAttribute('href', '/markets/SIM-OTHR');
    expect(screen.getByRole('heading', { name: 'SIM-OTHR' })).toBeInTheDocument();
    expect(screen.getByTestId('price-chart')).toHaveAttribute('data-orderbook-id', 'SIM-OTHR');
    expect(screen.queryByTestId('asset-last-price')).not.toBeInTheDocument();
    expect(getDetails).toHaveBeenCalledWith('SIM-OTHR');
  });

  it('omits the simulated badge for non-simulated instruments', async () => {
    getDetails.mockResolvedValue({ ...fjord, orderbook_id: 'REAL-1', symbol: 'REAL' });

    render(<AssetChart orderbookId="REAL-1" />);

    await screen.findByRole('heading', { name: 'REAL' });
    expect(screen.queryByText('Simulated market data')).not.toBeInTheDocument();
  });
});
