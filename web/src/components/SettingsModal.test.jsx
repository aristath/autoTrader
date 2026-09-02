import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { colorScheme, theme } from '../theme';
import { SettingsModal } from './SettingsModal';

vi.mock('../api/client', () => ({
  getAiModels: vi.fn(),
  getSettings: vi.fn(),
  updateSetting: vi.fn(),
  updateSettingsBatch: vi.fn(),
}));

import { getAiModels, getSettings, updateSetting } from '../api/client';

function renderModal() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MantineProvider theme={theme} defaultColorScheme={colorScheme} forceColorScheme={colorScheme}>
        <SettingsModal opened onClose={() => {}} />
      </MantineProvider>
    </QueryClientProvider>,
  );
}

describe('SettingsModal model discovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSettings.mockResolvedValue({
      ai_llm_base_url: 'http://llm/v1',
      ai_llm_api_key: 'local',
      ai_llm_model: 'current-model',
    });
    getAiModels.mockResolvedValue({ ok: true, models: ['available-model', 'current-model'] });
    updateSetting.mockResolvedValue({ status: 'ok' });
  });

  it('shows discovered models in a searchable selector and saves the selection', async () => {
    renderModal();
    fireEvent.click(await screen.findByRole('tab', { name: 'Research' }));

    const selector = await screen.findByRole('combobox', { name: 'Model' });
    const refresh = screen.getByRole('button', { name: 'Refresh available models' });
    expect(selector).toHaveValue('current-model');
    await waitFor(() => expect(refresh).not.toBeDisabled());
    fireEvent.change(selector, { target: { value: 'available-model' } });

    await waitFor(() => {
      expect(updateSetting).toHaveBeenCalledWith('ai_llm_model', 'available-model');
    });
  });

  it('refreshes model discovery on demand', async () => {
    renderModal();
    fireEvent.click(await screen.findByRole('tab', { name: 'Research' }));
    const refresh = await screen.findByRole('button', { name: 'Refresh available models' });
    fireEvent.click(refresh);

    expect(getAiModels).toHaveBeenCalledTimes(2);
  });
});
