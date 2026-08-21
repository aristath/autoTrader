import { fireEvent, render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { theme, colorScheme } from '../theme';
import { AIPipelineModal } from './AIPipelineModal';

vi.mock('../api/client', () => ({
  getAiStatus: vi.fn(),
  getAiUnits: vi.fn(),
  getAiHistory: vi.fn(),
  getAiArtifact: vi.fn(),
  postAiRequest: vi.fn(),
}));

import { getAiHistory, getAiStatus, getAiUnits } from '../api/client';

function renderModal() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MantineProvider theme={theme} defaultColorScheme={colorScheme} forceColorScheme={colorScheme}>
        <AIPipelineModal opened onClose={() => {}} />
      </MantineProvider>
    </QueryClientProvider>,
  );
}

describe('AIPipelineModal', () => {
  beforeEach(() => {
    getAiStatus.mockResolvedValue({
      enabled: true,
      running: null,
      queued: [],
      staleness: {
        macro: { stale: 2, total: 4 },
        security: { stale: 3, total: 7 },
        most_stale: { kind: 'security', key: 'AAPL.US', label: 'Apple Inc.' },
      },
      last_run: null,
      memory: { findings: 42, last_stored_at: null },
      next_tick_at: null,
    });
    getAiUnits.mockResolvedValue({
      units: [{
        kind: 'security',
        key: 'AAPL.US',
        label: 'Apple Inc.',
        last_analyzed_at: null,
        stale: true,
        status: 'idle',
        last_error: null,
        artifacts: [],
      }],
    });
    getAiHistory.mockResolvedValue({ history: [] });
  });

  it('shows pipeline state and the unit ledger', async () => {
    renderModal();

    expect(await screen.findByText('Research pipeline')).toBeInTheDocument();
    expect(screen.getByText('3/7')).toBeInTheDocument();
    expect(screen.getByText('2/4')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Units' }));
    expect(await screen.findByText('Apple Inc.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analyze' })).toBeInTheDocument();
  });

  it('shows the actual unit in current work, queue, and history', async () => {
    getAiStatus.mockResolvedValue({
      enabled: true,
      running: {
        kind: 'security', key: 'AAPL.US', label: 'Apple Inc.', task_name: 'Analyze Security',
      },
      queued: [{
        id: 'queued-1', unit_kind: 'macro', unit_key: 'us-tech', unit_label: 'US + Technology',
        task_id: 'analyze-macro-bucket', task_name: 'Analyze Macro Bucket', kind: 'task',
      }],
      staleness: { macro: { stale: 0, total: 1 }, security: { stale: 0, total: 1 }, most_stale: null },
      last_run: {
        job_id: 'rate-security', unit_kind: 'security', unit_key: 'MSFT.US', unit_label: 'Microsoft Corp.',
        status: 'completed', duration_seconds: 1, finished_at: new Date().toISOString(), error: null,
      },
      memory: { findings: 42, last_stored_at: null },
      next_tick_at: null,
    });
    getAiHistory.mockResolvedValue({
      history: [{
        job_id: 'analyze-security', unit_kind: 'security', unit_key: 'AAPL.US', unit_label: 'Apple Inc.',
        status: 'completed', duration_ms: 1000, executed_at: Date.now() / 1000, error: null,
      }],
    });

    renderModal();

    expect(await screen.findByText('Apple Inc.')).toBeInTheDocument();
    expect(screen.getByText('security:AAPL.US')).toBeInTheDocument();
    expect(screen.getByText('US + Technology')).toBeInTheDocument();
    expect(screen.getByText('Analyze Macro Bucket')).toBeInTheDocument();
    expect(screen.getByText('Microsoft Corp. (MSFT.US)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'History' }));
    expect((await screen.findAllByText('Apple Inc. (AAPL.US)')).length).toBeGreaterThan(0);
  });
});
