import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ActionIcon, Badge, Button, Divider, Group, Modal, NumberInput, ScrollArea, SegmentedControl,
  Select, Stack, Switch, Tabs, TagsInput, Text, Textarea, TextInput, Tooltip,
} from '@mantine/core';
import {
  IconCheck, IconDeviceFloppy, IconFilePlus, IconPlayerPlay, IconPlayerStop, IconPlus, IconRefresh,
  IconTrash,
} from '@tabler/icons-react';
import {
  createTask, createTaskFile, deleteTask, deleteTaskFile, getTask, getTaskFile, getTaskFiles,
  getTaskRun, getTaskRuns, getTasks, saveTaskFile, saveTaskMeta, startTaskRun, stopTaskRun, validateTask,
} from '../api/client';
import { CodeEditor } from './CodeEditor';
import { ScheduleEditor } from './ScheduleEditor';
import './TaskAdminModal.css';

const RUN_MODE_KEY = 'sentinel.taskRunMode';

function parseMetadata(content) {
  let raw = {};
  try { raw = JSON.parse(content); } catch { /* The Files tab can repair malformed JSON. */ }
  return {
    name: typeof raw.name === 'string' ? raw.name : '', enabled: raw.enabled === true,
    description: typeof raw.description === 'string' ? raw.description : '',
    tags: Array.isArray(raw.tags) ? raw.tags.filter((tag) => typeof tag === 'string') : [],
    cwd: typeof raw.cwd === 'string' ? raw.cwd : '', timeout: typeof raw.timeout === 'number' ? raw.timeout : '',
    schedule: typeof raw.schedule === 'string' && raw.schedule.trim() ? raw.schedule : null,
    schedulePolicy: raw.schedulePolicy && typeof raw.schedulePolicy === 'object' ? raw.schedulePolicy : null,
  };
}

function MetadataPane({ taskId, disabled, onDirtyChange, onSaved }) {
  const queryClient = useQueryClient();
  const metaQuery = useQuery({ queryKey: ['taskFile', taskId, 'task.json'], queryFn: () => getTaskFile(taskId, 'task.json') });
  const [draft, setDraft] = useState(null);
  const [baseline, setBaseline] = useState('');
  const draftRef = useRef(draft);
  const appliedDataRef = useRef(null);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    if (!metaQuery.data || metaQuery.data === appliedDataRef.current) return;
    appliedDataRef.current = metaQuery.data;
    if (draftRef.current !== null && JSON.stringify(draftRef.current) !== baseline) return;
    const next = parseMetadata(metaQuery.data.content);
    setDraft(next);
    setBaseline(JSON.stringify(next));
  }, [metaQuery.data, baseline]);

  const dirty = draft !== null && JSON.stringify(draft) !== baseline;
  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);

  const save = useMutation({
    mutationFn: () => saveTaskMeta(taskId, {
      name: draft.name.trim() || 'Untitled task', enabled: draft.enabled,
      description: draft.description.trim() || null, tags: draft.tags.length ? draft.tags : null,
      cwd: draft.cwd.trim() || null, timeout: typeof draft.timeout === 'number' && draft.timeout > 0 ? draft.timeout : null,
      schedule: draft.schedule?.trim() || null, schedulePolicy: draft.schedulePolicy || null,
    }),
    onSuccess: (task) => {
      if (draftRef.current) setBaseline(JSON.stringify(draftRef.current));
      queryClient.setQueryData(['task', taskId], task);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskFile', taskId, 'task.json'] });
      onSaved('Saved');
    },
    onError: (error) => onSaved(error.message),
  });
  if (!draft) return <Text c="dimmed">Loading metadata...</Text>;
  const patch = (next) => setDraft((current) => ({ ...current, ...next }));

  return (
    <Stack gap="sm" className="task-admin__meta">
      <Group justify="space-between"><Text size="xs" fw={700} c="dimmed" tt="uppercase">Metadata</Text><Button size="xs" leftSection={<IconDeviceFloppy size={14} />} onClick={() => save.mutate()} disabled={disabled || !dirty} loading={save.isPending}>Save</Button></Group>
      <Group grow align="flex-start"><TextInput label="Name" value={draft.name} onChange={(event) => patch({ name: event.currentTarget.value })} disabled={disabled} /><Switch label="Enabled" checked={draft.enabled} onChange={(event) => patch({ enabled: event.currentTarget.checked })} mt="lg" disabled={disabled} /></Group>
      <Textarea label="Description" autosize minRows={2} maxRows={4} value={draft.description} onChange={(event) => patch({ description: event.currentTarget.value })} disabled={disabled} />
      <Group grow align="flex-start"><TagsInput label="Tags" value={draft.tags} onChange={(tags) => patch({ tags })} disabled={disabled} /><NumberInput label="Timeout (seconds)" min={0} step={60} value={draft.timeout} onChange={(timeout) => patch({ timeout: typeof timeout === 'number' ? timeout : '' })} disabled={disabled} /></Group>
      <TextInput label="Working directory (cwd)" placeholder="@/tasks/artifacts/{{task-id}}" value={draft.cwd} onChange={(event) => patch({ cwd: event.currentTarget.value })} disabled={disabled} />
      <Divider label="Schedule" labelPosition="left" />
      <ScheduleEditor schedule={draft.schedule} schedulePolicy={draft.schedulePolicy} onUpdate={patch} disabled={disabled} />
    </Stack>
  );
}

function FilesPane({ taskId, disabled, onDirtyChange, onNotice }) {
  const queryClient = useQueryClient();
  const filesQuery = useQuery({ queryKey: ['taskFiles', taskId], queryFn: () => getTaskFiles(taskId) });
  const files = filesQuery.data || [];
  const [active, setActive] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [baselines, setBaselines] = useState({});
  const appliedFileRef = useRef(null);
  const activeFile = files.find((file) => file.name === active);

  useEffect(() => { if (files.length && !files.some((file) => file.name === active)) setActive(files.find((file) => file.name === 'task.js')?.name || files[0].name); }, [files, active]);
  const fileQuery = useQuery({ queryKey: ['taskFile', taskId, active], queryFn: () => getTaskFile(taskId, active), enabled: Boolean(active) });
  useEffect(() => {
    if (!fileQuery.data || fileQuery.data === appliedFileRef.current) return;
    appliedFileRef.current = fileQuery.data;
    const { name, content } = fileQuery.data;
    const previousBaseline = baselines[name];
    setBaselines((current) => ({ ...current, [name]: content }));
    setDrafts((current) => name in current && current[name] !== previousBaseline ? current : { ...current, [name]: content });
  }, [fileQuery.data, baselines]);

  const draft = active ? (drafts[active] ?? fileQuery.data?.content ?? '') : '';
  const activeDirty = Boolean(active && active in baselines && drafts[active] !== baselines[active]);
  const anyDirty = files.some((file) => file.name in baselines && drafts[file.name] !== baselines[file.name]);
  useEffect(() => { onDirtyChange(anyDirty); }, [anyDirty, onDirtyChange]);

  const save = useMutation({
    mutationFn: () => saveTaskFile(taskId, active, draft),
    onSuccess: () => {
      setBaselines((current) => ({ ...current, [active]: drafts[active] ?? '' }));
      onNotice('Saved');
      queryClient.invalidateQueries({ queryKey: ['taskFiles', taskId] });
      queryClient.invalidateQueries({ queryKey: ['taskFile', taskId, active] });
      if (active === 'task.json') {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      }
    },
    onError: (error) => onNotice(error.message),
  });
  const add = async () => {
    const name = window.prompt('New file name (e.g. step.sh, prompt.md)')?.trim();
    if (!name) return;
    try {
      await createTaskFile(taskId, name);
      setDrafts((current) => ({ ...current, [name]: '' }));
      setBaselines((current) => ({ ...current, [name]: '' }));
      await queryClient.invalidateQueries({ queryKey: ['taskFiles', taskId] });
      setActive(name);
      onNotice('Created');
    } catch (error) { onNotice(error.message); }
  };
  const remove = async (name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteTaskFile(taskId, name);
      setDrafts((current) => { const next = { ...current }; delete next[name]; return next; });
      setBaselines((current) => { const next = { ...current }; delete next[name]; return next; });
      if (active === name) setActive(null);
      await queryClient.invalidateQueries({ queryKey: ['taskFiles', taskId] });
      onNotice('Deleted');
    } catch (error) { onNotice(error.message); }
  };

  return (
    <div className="task-admin__files">
      <div className="task-admin__file-list">
        <Group justify="space-between" mb="xs"><Text size="xs" fw={700} c="dimmed" tt="uppercase">Files</Text><Tooltip label="New file"><ActionIcon size="sm" variant="light" onClick={add} disabled={disabled} aria-label="New file"><IconFilePlus size={15} /></ActionIcon></Tooltip></Group>
        <Stack gap={3}>{files.map((file) => {
          const fileDirty = file.name in baselines && drafts[file.name] !== baselines[file.name];
          return <div key={file.name} className={`task-admin__file-row ${active === file.name ? 'active' : ''}`}><button type="button" onClick={() => setActive(file.name)} disabled={disabled}><span>{file.name}</span>{fileDirty && <i aria-label="unsaved" />}</button>{!file.protected && <ActionIcon size="xs" color="red" variant="subtle" onClick={() => remove(file.name)} disabled={disabled} aria-label={`Delete ${file.name}`}><IconTrash size={12} /></ActionIcon>}</div>;
        })}</Stack>
      </div>
      <div className="task-admin__editor">
        <Group justify="space-between" mb="xs"><Group gap="xs"><Text size="xs" fw={700} c="dimmed" tt="uppercase">{active || '-'}</Text>{activeFile?.protected && <Badge size="xs" variant="light">protected</Badge>}{activeDirty && <Badge size="xs" color="yellow">unsaved</Badge>}</Group><Button size="xs" leftSection={<IconDeviceFloppy size={14} />} onClick={() => save.mutate()} disabled={disabled || !activeDirty} loading={save.isPending}>Save</Button></Group>
        <CodeEditor value={draft} onChange={(value) => active && setDrafts((current) => ({ ...current, [active]: value }))} documentId={`${taskId}/${active || ''}`} filename={active || ''} language={activeFile?.language} disabled={disabled || !active || fileQuery.isLoading} />
      </div>
    </div>
  );
}

export function TaskAdminModal({ opened, onClose }) {
  const queryClient = useQueryClient();
  const tasksQuery = useQuery({ queryKey: ['tasks'], queryFn: getTasks, enabled: opened, refetchInterval: opened ? 20000 : false });
  const tasks = tasksQuery.data || [];
  const [selectedId, setSelectedId] = useState(null);
  const activeId = selectedId && tasks.some((task) => task.id === selectedId) ? selectedId : tasks[0]?.id;
  const taskQuery = useQuery({ queryKey: ['task', activeId], queryFn: () => getTask(activeId), enabled: opened && Boolean(activeId) });
  const [notice, setNotice] = useState('');
  const [filesDirty, setFilesDirty] = useState(false);
  const [metaDirty, setMetaDirty] = useState(false);
  const dirty = filesDirty || metaDirty;
  const [runMode, setRunMode] = useState(() => globalThis.localStorage?.getItem(RUN_MODE_KEY) || 'balanced');
  const [runInputs, setRunInputs] = useState('{}');
  const [runId, setRunId] = useState(null);
  const runsQuery = useQuery({ queryKey: ['taskRuns', activeId], queryFn: () => getTaskRuns(activeId), enabled: opened && Boolean(activeId), refetchInterval: opened ? 2000 : false });
  const runQuery = useQuery({ queryKey: ['taskRun', runId], queryFn: () => getTaskRun(runId), enabled: opened && Boolean(runId), refetchInterval: (query) => ['queued', 'running'].includes(query.state.data?.status) ? 800 : false });
  const running = ['queued', 'running'].includes(runQuery.data?.status);
  useEffect(() => { globalThis.localStorage?.setItem(RUN_MODE_KEY, runMode); }, [runMode]);
  useEffect(() => { setRunId(null); setRunInputs('{}'); setNotice(''); setFilesDirty(false); setMetaDirty(false); }, [activeId]);
  useEffect(() => {
    const rows = runsQuery.data || [];
    const active = rows.find((row) => ['queued', 'running'].includes(row.status));
    setRunId((current) => active?.id || (rows.some((row) => row.id === current) ? current : rows[0]?.id || null));
  }, [runsQuery.data]);

  const create = useMutation({ mutationFn: () => createTask('New Task'), onSuccess: (task) => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); setSelectedId(task.id); }, onError: (error) => setNotice(error.message) });
  const validate = useMutation({ mutationFn: () => validateTask(activeId), onSuccess: (result) => setNotice(result.ok ? 'Validation passed' : result.errors.join('\n')), onError: (error) => setNotice(error.message) });
  const run = useMutation({ mutationFn: (inputs) => startTaskRun(activeId, runMode, inputs), onSuccess: (result) => { setRunId(result.id); queryClient.invalidateQueries({ queryKey: ['taskRuns', activeId] }); }, onError: (error) => setNotice(error.message) });

  const start = () => {
    try {
      const inputs = JSON.parse(runInputs);
      if (!inputs || Array.isArray(inputs) || typeof inputs !== 'object') throw new Error('Inputs must be a JSON object');
      setNotice('');
      run.mutate(inputs);
    } catch (error) {
      setNotice(`Invalid inputs: ${error.message}`);
    }
  };

  const selectTask = (id) => {
    if (id === activeId) return;
    if (dirty && !window.confirm(`Discard unsaved changes to "${taskQuery.data?.name || activeId}"?`)) return;
    setSelectedId(id);
  };
  const close = () => {
    if (dirty && !window.confirm(`Discard unsaved changes to "${taskQuery.data?.name || activeId}"?`)) return;
    onClose();
  };
  const createTaskDefinition = () => {
    if (dirty && !window.confirm(`Discard unsaved changes to "${taskQuery.data?.name || activeId}"?`)) return;
    create.mutate();
  };

  const removeTask = async () => {
    if (!taskQuery.data || !window.confirm(`Delete task "${taskQuery.data.name}"?`)) return;
    try { await deleteTask(taskQuery.data.id); setSelectedId(null); await queryClient.invalidateQueries({ queryKey: ['tasks'] }); setNotice('Deleted'); } catch (error) { setNotice(error.message); }
  };
  const stop = async () => { try { await stopTaskRun(runId); await runQuery.refetch(); await runsQuery.refetch(); } catch (error) { setNotice(error.message); } };
  const groups = useMemo(() => [['Invalid', tasks.filter((task) => task.invalid)], ['Enabled', tasks.filter((task) => task.enabled && !task.invalid)], ['Disabled', tasks.filter((task) => !task.enabled && !task.invalid)]].filter(([, items]) => items.length), [tasks]);
  const runOptions = useMemo(() => (runsQuery.data || []).map((item) => ({
    value: item.id,
    label: `${item.status} - ${item.createdAt ? new Date(item.createdAt).toLocaleString() : item.id}`,
  })), [runsQuery.data]);

  return (
    <Modal opened={opened} onClose={close} title="Task Administration" fullScreen classNames={{ body: 'task-admin__modal-body' }}>
      <Stack gap="sm" className="task-admin">
        <Group justify="space-between"><Text size="sm" c="dimmed">{tasks.length} core and user task definitions</Text><Group gap="xs"><Button size="xs" variant="light" leftSection={<IconPlus size={15} />} onClick={createTaskDefinition} loading={create.isPending}>New</Button><ActionIcon variant="light" onClick={() => tasksQuery.refetch()} aria-label="Refresh tasks"><IconRefresh size={16} /></ActionIcon></Group></Group>
        <div className="task-admin__layout">
          <div className="task-admin__list"><ScrollArea h="100%"><Stack gap="md">{groups.map(([label, items]) => <Stack gap={4} key={label}><Text size="xs" fw={700} c="dimmed" tt="uppercase">{label}</Text>{items.map((task) => <button type="button" key={task.id} className={`task-admin__task ${activeId === task.id ? 'active' : ''}`} onClick={() => selectTask(task.id)} disabled={running}><span><strong>{task.name}</strong><small>{task.id}</small></span><Badge size="xs" color={task.invalid ? 'red' : task.enabled ? 'green' : 'gray'}>{task.invalid ? 'invalid' : task.enabled ? 'on' : 'off'}</Badge></button>)}</Stack>)}</Stack></ScrollArea></div>
          <div className="task-admin__workbench">
            {taskQuery.data ? <>
              <Group justify="space-between" className="task-admin__toolbar"><div><Group gap="xs"><Text fw={700}>{taskQuery.data.name}</Text>{dirty && <Badge size="xs" color="yellow">unsaved</Badge>}<Badge size="xs" variant="outline">{taskQuery.data.source}</Badge></Group><Text size="xs" c="dimmed">{taskQuery.data.id}</Text></div><Group gap="xs"><SegmentedControl size="xs" value={runMode} onChange={setRunMode} data={['fast', 'balanced', 'deep']} disabled={running} /><Button size="xs" variant="light" leftSection={<IconCheck size={14} />} onClick={() => validate.mutate()} loading={validate.isPending} disabled={dirty || running}>Check</Button>{running ? <Button size="xs" color="red" variant="light" leftSection={<IconPlayerStop size={14} />} onClick={stop}>Stop</Button> : <Button size="xs" leftSection={<IconPlayerPlay size={14} />} onClick={start} loading={run.isPending} disabled={dirty || taskQuery.data.invalid}>Run</Button>}<Tooltip label={taskQuery.data.source === 'core' ? 'Core tasks can be disabled or overridden' : 'Delete task'}><ActionIcon color="red" variant="subtle" onClick={removeTask} disabled={running || taskQuery.data.source === 'core'} aria-label="Delete task"><IconTrash size={16} /></ActionIcon></Tooltip></Group></Group>
              {notice && <Text size="sm" c={notice.toLowerCase().includes('error') || notice.toLowerCase().includes('invalid') ? 'red' : 'dimmed'} className="task-admin__notice">{notice}</Text>}
              <div className="task-admin__body">
                <Tabs defaultValue="files" className="task-admin__tabs"><Tabs.List><Tabs.Tab value="files">Files</Tabs.Tab><Tabs.Tab value="metadata">Metadata</Tabs.Tab></Tabs.List><Tabs.Panel value="files" pt="sm" className="task-admin__tab-panel"><FilesPane key={activeId} taskId={activeId} disabled={running} onDirtyChange={setFilesDirty} onNotice={setNotice} /></Tabs.Panel><Tabs.Panel value="metadata" pt="sm" className="task-admin__tab-panel"><ScrollArea h="100%"><MetadataPane key={activeId} taskId={activeId} disabled={running} onDirtyChange={setMetaDirty} onSaved={setNotice} /></ScrollArea></Tabs.Panel></Tabs>
                <div className="task-admin__run"><Group justify="space-between"><Text size="xs" fw={700} c="dimmed" tt="uppercase">Run</Text><Badge size="xs" color={runQuery.data?.status === 'error' ? 'red' : running ? 'blue' : runQuery.data?.status === 'done' ? 'green' : 'gray'}>{runQuery.data?.status || 'idle'}</Badge></Group><Select label="History" size="xs" data={runOptions} value={runId} onChange={setRunId} placeholder="No runs" clearable={false} allowDeselect={false} disabled={!runOptions.length} /><Textarea label="Inputs (JSON)" size="xs" rows={3} value={runInputs} onChange={(event) => setRunInputs(event.currentTarget.value)} disabled={running} /><ScrollArea className="task-admin__run-log"><Stack gap={3}>{(runQuery.data?.log || []).map((line, index) => <Text component="code" size="xs" key={`${index}-${line}`}>{line}</Text>)}{runQuery.data?.error && <Text size="xs" c="red">{runQuery.data.error}</Text>}</Stack></ScrollArea><pre>{runQuery.data?.liveOutput || ' '}</pre></div>
              </div>
            </> : <div className="task-admin__empty"><Text fw={700}>No task selected</Text></div>}
          </div>
        </div>
      </Stack>
    </Modal>
  );
}
