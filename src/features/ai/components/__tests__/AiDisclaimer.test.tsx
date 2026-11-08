import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AiDisclaimer } from '../AiDisclaimer';

describe('AiDisclaimer', () => {
  it('renders the standard AI disclaimer text', () => {
    render(<AiDisclaimer />);
    expect(
      screen.getByText('AI-generated · educational, not financial advice'),
    ).toBeInTheDocument();
  });
});
