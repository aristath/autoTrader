import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { theme } from '../theme';
import { SecurityExpandedRow } from './SecurityExpandedRow';

vi.mock('../api/client', () => ({
  getSecurityForecast: vi.fn().mockResolvedValue({}),
}));
vi.mock('./SecurityChart', () => ({ SecurityChart: () => <div>Price chart</div> }));
vi.mock('./SecurityForecastCard', () => ({ SecurityForecastCard: () => <div>Forecast</div> }));

const inactiveSecurity = {
  symbol: 'UNUSED.EU',
  name: 'Unused',
  active: 0,
  can_delete: true,
  transaction_count: 0,
  currency: 'EUR',
  min_lot: 1,
  allow_buy: 0,
  allow_sell: 0,
  prices: [],
};

function renderRow(security, props = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MantineProvider theme={theme}>
        <SecurityExpandedRow
          security={security}
          onUpdate={vi.fn()}
          onDelete={vi.fn()}
          onActivate={vi.fn()}
          {...props}
        />
      </MantineProvider>
    </QueryClientProvider>,
  );
}

describe('SecurityExpandedRow inactive actions', () => {
  it('allows an inactive security to be activated and permanently deleted when unused', async () => {
    const onActivate = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn();
    renderRow(inactiveSecurity, { onActivate, onDelete });

    fireEvent.click(screen.getByRole('button', { name: 'Activate' }));
    await waitFor(() => expect(onActivate).toHaveBeenCalledWith('UNUSED.EU'));

    fireEvent.click(screen.getByRole('button', { name: 'Delete UNUSED.EU' }));
    expect(onDelete).toHaveBeenCalledWith(inactiveSecurity);
  });

  it('blocks permanent deletion when historical transactions exist', () => {
    renderRow({ ...inactiveSecurity, can_delete: false, transaction_count: 2 });

    expect(screen.getByRole('button', { name: 'Delete UNUSED.EU' })).toBeDisabled();
    expect(screen.getByText(/has 2 historical transaction/)).toBeInTheDocument();
  });
});
