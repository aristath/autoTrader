import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { theme, colorScheme } from '../theme';
import { TaskAdminModal } from './TaskAdminModal';

vi.mock('./CodeEditor', () => ({
  CodeEditor: ({ value, onChange, disabled }) => (
    <textarea aria-label="Task file editor" value={value} onChange={(event) => onChange(event.currentTarget.value)} disabled={disabled} />
  ),
}));
vi.mock('./ScheduleEditor', () => ({ ScheduleEditor: () => <div>Schedule editor</div> }));
vi.mock('../api/client', () => ({
  createTask: vi.fn(), createTaskFile: vi.fn(), deleteTask: vi.fn(), deleteTaskFile: vi.fn(),
  getTask: vi.fn(), getTaskFile: vi.fn(), getTaskFiles: vi.fn(), getTaskRun: vi.fn(), getTaskRuns: vi.fn(),
  getTasks: vi.fn(), saveTaskFile: vi.fn(), saveTaskMeta: vi.fn(), startTaskRun: vi.fn(), stopTaskRun: vi.fn(),
  validateTask: vi.fn(),
}));

import { getTask, getTaskFile, getTaskFiles, getTaskRun, getTaskRuns, getTasks, startTaskRun } from '../api/client';

const tasks = [
  { id: 'alpha', name: 'Alpha', enabled: false, source: 'user' },
  { id: 'beta', name: 'Beta', enabled: false, source: 'user' },
];

function renderModal(onClose = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MantineProvider theme={theme} defaultColorScheme={colorScheme} forceColorScheme={colorScheme}>
        <TaskAdminModal opened onClose={onClose} />
      </MantineProvider>
    </QueryClientProvider>,
  );
  return onClose;
}

describe('TaskAdminModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTasks.mockResolvedValue(tasks);
    getTask.mockImplementation(async (id) => ({ ...tasks.find((task) => task.id === id), description: '' }));
    getTaskFiles.mockResolvedValue([
      { name: 'task.json', language: 'json', protected: true },
      { name: 'task.js', language: 'javascript', protected: true },
    ]);
    getTaskFile.mockImplementation(async (id, name) => ({
      name,
      content: name === 'task.json' ? JSON.stringify({ name: id, enabled: false }) : `console.log('${id}');`,
    }));
    getTaskRuns.mockResolvedValue([]);
  });

  it('preserves a file draft and blocks task switching until discard is confirmed', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderModal();

    const editor = await screen.findByLabelText('Task file editor');
    await waitFor(() => expect(editor).toHaveValue("console.log('alpha');"));
    fireEvent.change(editor, { target: { value: 'const changed = true;' } });
    expect((await screen.findAllByText('unsaved')).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Check' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Run' })).toBeDisabled();

    fireEvent.click(screen.getByText('Beta').closest('button'));
    expect(confirm).toHaveBeenCalledOnce();
    expect(getTask).not.toHaveBeenCalledWith('beta');
    confirm.mockRestore();
  });

  it('reconnects to a durable running task and protects core deletion', async () => {
    getTasks.mockResolvedValue([{ ...tasks[0], source: 'core' }]);
    getTask.mockResolvedValue({ ...tasks[0], source: 'core' });
    getTaskRuns.mockResolvedValue([{ id: 'run-1', status: 'running' }]);
    getTaskRun.mockResolvedValue({ id: 'run-1', status: 'running', log: ['working'], liveOutput: '' });
    renderModal();

    expect(await screen.findByRole('button', { name: 'Stop' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Delete task' })).toBeDisabled());
    expect(screen.getByText('core')).toBeInTheDocument();
  });

  it('passes operator-provided JSON inputs to a manual run', async () => {
    startTaskRun.mockResolvedValue({ id: 'run-new', status: 'queued' });
    renderModal();

    const inputs = await screen.findByLabelText('Inputs (JSON)');
    fireEvent.change(inputs, { target: { value: '{"symbol":"TEST","force":true}' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    await waitFor(() => expect(startTaskRun).toHaveBeenCalledWith(
      'alpha',
      'balanced',
      { symbol: 'TEST', force: true },
    ));
  });
});
