import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LiveIndicator } from '../LiveIndicator';

describe('LiveIndicator', () => {
  it('renders nothing when status is idle', () => {
    const { container } = render(<LiveIndicator status="idle" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders Connecting… when status is connecting', () => {
    render(<LiveIndicator status="connecting" />);
    const indicator = screen.getByTestId('live-indicator');
    expect(indicator).toHaveTextContent('Connecting…');
    expect(indicator).toHaveAttribute('data-status', 'connecting');
  });

  it('renders Live with title when status is live', () => {
    render(<LiveIndicator status="live" />);
    const indicator = screen.getByTestId('live-indicator');
    expect(indicator).toHaveTextContent('Live');
    expect(indicator).toHaveAttribute('data-status', 'live');
    expect(indicator).toHaveAttribute('title', 'Prices update live');
  });

  it('renders Reconnecting… when status is reconnecting', () => {
    render(<LiveIndicator status="reconnecting" />);
    const indicator = screen.getByTestId('live-indicator');
    expect(indicator).toHaveTextContent('Reconnecting…');
    expect(indicator).toHaveAttribute('data-status', 'reconnecting');
  });
});
