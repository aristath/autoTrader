import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import {
  ActionIcon,
  Badge,
  Button,
  Center,
  Divider,
  Drawer,
  Group,
  Loader,
  Modal,
  Paper,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Table,
  Tabs,
  Text,
  Tooltip,
} from '@mantine/core';
import {
  IconActivity,
  IconBook2,
  IconBrain,
  IconClock,
  IconEye,
  IconHistory,
  IconPlayerPlay,
  IconRefresh,
} from '@tabler/icons-react';
import {
  getAiArtifact,
  getAiHistory,
  getAiStatus,
  getAiUnits,
  postAiRequest,
  reconcileAiUnits,
} from '../api/client';
import { formatDuration, formatRelativeTime } from '../utils/dateFormatting';
import './AIPipelineModal.css';

const STATUS_COLORS = {
  completed: 'green',
  failed: 'red',
  running: 'blue',
  idle: 'gray',
  queued: 'yellow',
};

function statusColor(status) {
  return STATUS_COLORS[status] || 'gray';
}

function formatAge(unit) {
  if (!unit.last_analyzed_at) return 'Never';
  return formatRelativeTime(unit.last_analyzed_at);
}

function formatHistoryTime(value) {
  if (!value) return '-';
  const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : formatRelativeTime(date.toISOString());
}

function historyUnit(entry) {
  if (entry.unit_label) {
    return entry.unit_key && entry.unit_key !== entry.unit_label
      ? `${entry.unit_label} (${entry.unit_key})`
      : entry.unit_label;
  }
  const id = entry.job_id || '';
  return id.startsWith('ai:tick:') ? id.slice('ai:tick:'.length) : id || '-';
}

function Metric({ label, value, detail, color }) {
  return (
    <Paper withBorder p="sm" className="ai-pipeline__metric">
      <Text size="xs" c="dimmed" tt="uppercase">{label}</Text>
      <Text size="xl" fw={700} c={color}>{value}</Text>
      {detail && <Text size="xs" c="dimmed" truncate>{detail}</Text>}
    </Paper>
  );
}

function ArtifactDrawer({ unit, onClose }) {
  const artifactNames = unit?.artifacts || [];
  const [activeArtifact, setActiveArtifact] = useState(artifactNames[0] || null);

  useEffect(() => {
    setActiveArtifact(artifactNames[0] || null);
  }, [unit?.kind, unit?.key]);

  const artifactQuery = useQuery({
    queryKey: ['aiArtifact', unit?.kind, unit?.key, activeArtifact],
    queryFn: () => getAiArtifact({ kind: unit.kind, unitKey: unit.key, name: activeArtifact }),
    enabled: Boolean(unit && activeArtifact),
  });

  let content = artifactQuery.data?.content || '';
  if (activeArtifact?.endsWith('.json') && content) {
    try {
      content = JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      // Keep malformed historical JSON readable as plain text.
    }
  }

  return (
    <Drawer
      opened={Boolean(unit)}
      onClose={onClose}
      position="right"
      size="xl"
      title={unit ? `${unit.label} / artifacts` : 'Artifacts'}
      className="ai-artifact"
    >
      {artifactNames.length === 0 ? (
        <Text c="dimmed">No artifacts have been written for this unit.</Text>
      ) : (
        <Tabs value={activeArtifact} onChange={setActiveArtifact}>
          <ScrollArea type="auto" scrollbarSize={6}>
            <Tabs.List className="ai-artifact__tabs">
              {artifactNames.map((name) => (
                <Tabs.Tab key={name} value={name}>{name}</Tabs.Tab>
              ))}
            </Tabs.List>
          </ScrollArea>
          <Divider my="md" />
          {artifactQuery.isLoading ? (
            <Center h={240}><Loader /></Center>
          ) : artifactQuery.isError ? (
            <Text c="red">{artifactQuery.error.message}</Text>
          ) : activeArtifact?.endsWith('.md') ? (
            <div className="ai-artifact__markdown">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          ) : (
            <pre className="ai-artifact__code">{content}</pre>
          )}
        </Tabs>
      )}
    </Drawer>
  );
}

function StatusPanel({ status, units, onRate, ratePending }) {
  const [ratingSymbol, setRatingSymbol] = useState(null);
  const securityOptions = useMemo(
    () => units
      .filter((unit) => unit.kind === 'security')
      .map((unit) => ({ value: unit.key, label: `${unit.label} (${unit.key})` })),
    [units],
  );
  const macro = status.staleness?.macro || { stale: 0, total: 0 };
  const security = status.staleness?.security || { stale: 0, total: 0 };
  const running = status.running;

  return (
    <Stack gap="md">
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
        <Metric label="Securities" value={`${security.stale}/${security.total}`} detail="stale" color={security.stale ? 'yellow' : undefined} />
        <Metric label="Macro" value={`${macro.stale}/${macro.total}`} detail="stale" color={macro.stale ? 'yellow' : undefined} />
        <Metric label="Queued" value={status.queued?.length || 0} detail="requests" color={status.queued?.length ? 'blue' : undefined} />
        <Metric
          label="Memory"
          value={status.memory?.findings ?? '-'}
          detail={status.memory?.error ? 'unavailable' : 'findings'}
          color={status.memory?.error ? 'red' : undefined}
        />
      </SimpleGrid>

      <Paper withBorder p="md" className={`ai-pipeline__running ${running ? 'ai-pipeline__running--active' : ''}`}>
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Group gap="sm">
            {running ? <Loader size="sm" /> : <IconActivity size={18} />}
            <div>
              <Text size="xs" c="dimmed" tt="uppercase">Current work</Text>
              <Text fw={600}>{running ? running.label : 'Idle'}</Text>
              {running && <Text size="xs" c="dimmed">{running.kind}:{running.key}</Text>}
            </div>
          </Group>
          {running?.elapsed_seconds != null && (
            <Text size="sm" c="dimmed">{formatDuration(running.elapsed_seconds * 1000)}</Text>
          )}
        </Group>
      </Paper>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <div>
          <Text size="xs" c="dimmed" tt="uppercase" mb="xs">Next in line</Text>
          {status.queued?.length ? (
            <Stack gap={0} className="ai-pipeline__ledger">
              {status.queued.map((item) => (
                <Group key={item.id} justify="space-between" wrap="nowrap" className="ai-pipeline__ledger-row">
                  <Text size="sm" truncate>{item.unit_label || `${item.unit_kind}:${item.unit_key}`}</Text>
                  <Badge size="xs" variant="light" color="yellow">{item.task_name || item.task_id || item.kind}</Badge>
                </Group>
              ))}
            </Stack>
          ) : (
            <Text size="sm" c="dimmed">Queue empty</Text>
          )}
        </div>

        <div>
          <Text size="xs" c="dimmed" tt="uppercase" mb="xs">Latest tick</Text>
          {status.last_run ? (
            <Stack gap={4}>
              <Group gap="xs">
                <Badge size="xs" color={statusColor(status.last_run.status)}>{status.last_run.status}</Badge>
                <Text size="sm">{formatHistoryTime(status.last_run.finished_at)}</Text>
              </Group>
              {status.last_run.unit_label && (
                <Text size="sm">
                  {status.last_run.unit_label}
                  {status.last_run.unit_key ? ` (${status.last_run.unit_key})` : ''}
                </Text>
              )}
              {status.last_run.duration_seconds != null && (
                <Text size="xs" c="dimmed">{formatDuration(status.last_run.duration_seconds * 1000)}</Text>
              )}
              {status.last_run.error && <Text size="xs" c="red" lineClamp={2}>{status.last_run.error}</Text>}
            </Stack>
          ) : (
            <Text size="sm" c="dimmed">No runs yet</Text>
          )}
        </div>
      </SimpleGrid>

      {status.staleness?.most_stale && (
        <Text size="sm" c="dimmed">
          Oldest: {status.staleness.most_stale.label} ({status.staleness.most_stale.kind})
        </Text>
      )}
      {status.memory?.error && <Text size="xs" c="red">Memory: {status.memory.error}</Text>}

      <Divider label="Manual rating" labelPosition="left" />
      <Group align="flex-end" wrap="wrap">
        <Select
          label="Security"
          placeholder="Select a security"
          searchable
          value={ratingSymbol}
          onChange={setRatingSymbol}
          data={securityOptions}
          flex={1}
          miw={240}
        />
        <Button
          leftSection={<IconPlayerPlay size={16} />}
          onClick={() => onRate(ratingSymbol)}
          disabled={!ratingSymbol}
          loading={ratePending}
        >
          Rate now
        </Button>
      </Group>
    </Stack>
  );
}

function UnitsPanel({ units, loading, kind, staleOnly, onKind, onStaleOnly, onAnalyze, onView, onSync, busy }) {
  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Group align="flex-end" wrap="wrap">
          <Select
            label="Kind"
            value={kind}
            onChange={(value) => onKind(value || '')}
            data={[
              { value: '', label: 'All units' },
              { value: 'security', label: 'Securities' },
              { value: 'macro', label: 'Macro' },
              { value: 'portfolio', label: 'Portfolio' },
            ]}
            w={170}
          />
          <Switch label="Stale only" checked={staleOnly} onChange={(event) => onStaleOnly(event.currentTarget.checked)} mb={7} />
        </Group>
        <Tooltip label="Sync research units with the portfolio universe">
          <ActionIcon variant="light" size="lg" onClick={onSync} loading={busy} aria-label="Sync research units">
            <IconRefresh size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>

      {loading ? (
        <Center h={240}><Loader /></Center>
      ) : units.length === 0 ? (
        <Center h={220}>
          <Stack gap="xs" align="center">
            <IconBook2 size={30} />
            <Text c="dimmed">No research units match this view.</Text>
          </Stack>
        </Center>
      ) : (
        <ScrollArea type="auto" h={430}>
          <Table highlightOnHover className="ai-pipeline__table">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Unit</Table.Th>
                <Table.Th>Kind</Table.Th>
                <Table.Th>Last analyzed</Table.Th>
                <Table.Th>State</Table.Th>
                <Table.Th>Error</Table.Th>
                <Table.Th ta="right">Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {units.map((unit) => (
                <Table.Tr key={`${unit.kind}:${unit.key}`}>
                  <Table.Td>
                    <Text size="sm" fw={600}>{unit.label}</Text>
                    <Text size="xs" c="dimmed">{unit.key}</Text>
                  </Table.Td>
                  <Table.Td><Badge size="xs" variant="outline">{unit.kind}</Badge></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{formatAge(unit)}</Text></Table.Td>
                  <Table.Td>
                    <Badge size="xs" color={unit.status === 'running' ? 'blue' : unit.stale ? 'yellow' : 'green'}>
                      {unit.status === 'running' ? 'running' : unit.stale ? 'stale' : 'fresh'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {unit.last_error ? (
                      <Tooltip label={unit.last_error} multiline maw={420}>
                        <Text size="xs" c="red" truncate maw={170}>{unit.last_error}</Text>
                      </Tooltip>
                    ) : <Text c="dimmed">-</Text>}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                      {unit.kind !== 'portfolio' && (
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<IconPlayerPlay size={14} />}
                          onClick={() => onAnalyze(unit)}
                          disabled={busy || unit.status === 'running'}
                        >
                          Analyze
                        </Button>
                      )}
                      <ActionIcon
                        variant="subtle"
                        aria-label={`View artifacts for ${unit.label}`}
                        onClick={() => onView(unit)}
                        disabled={!unit.artifacts?.length}
                      >
                        <IconEye size={17} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}
    </Stack>
  );
}

function HistoryPanel({ history, loading }) {
  if (loading) return <Center h={260}><Loader /></Center>;
  if (!history.length) return <Center h={260}><Text c="dimmed">No pipeline runs yet.</Text></Center>;

  return (
    <ScrollArea type="auto" h={460}>
      <Table highlightOnHover className="ai-pipeline__table">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Unit</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Duration</Table.Th>
            <Table.Th>Finished</Table.Th>
            <Table.Th>Error</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {history.map((entry, index) => (
            <Table.Tr key={`${entry.job_id}:${entry.executed_at}:${index}`}>
              <Table.Td><Text size="sm" fw={600}>{historyUnit(entry)}</Text></Table.Td>
              <Table.Td><Badge size="xs" color={statusColor(entry.status)}>{entry.status}</Badge></Table.Td>
              <Table.Td><Text size="sm" c="dimmed">{formatDuration(entry.duration_ms)}</Text></Table.Td>
              <Table.Td><Text size="sm" c="dimmed">{formatHistoryTime(entry.executed_at)}</Text></Table.Td>
              <Table.Td>
                {entry.error ? (
                  <Tooltip label={entry.error} multiline maw={420}>
                    <Text size="xs" c="red" truncate maw={260}>{entry.error}</Text>
                  </Tooltip>
                ) : <Text c="dimmed">-</Text>}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}

export function AIPipelineModal({ opened, onClose }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('status');
  const [kind, setKind] = useState('');
  const [staleOnly, setStaleOnly] = useState(false);
  const [artifactUnit, setArtifactUnit] = useState(null);

  const statusQuery = useQuery({
    queryKey: ['aiStatus'],
    queryFn: getAiStatus,
    enabled: opened,
    refetchInterval: opened ? 3000 : false,
  });
  const unitsQuery = useQuery({
    queryKey: ['aiUnits', kind, staleOnly],
    queryFn: () => getAiUnits({ kind, staleOnly }),
    enabled: opened,
    refetchInterval: opened ? 10000 : false,
  });
  const allUnitsQuery = useQuery({
    queryKey: ['aiUnits', '', false],
    queryFn: () => getAiUnits(),
    enabled: opened && (kind !== '' || staleOnly),
    refetchInterval: opened ? 10000 : false,
  });
  const historyQuery = useQuery({
    queryKey: ['aiHistory'],
    queryFn: () => getAiHistory(100),
    enabled: opened,
    refetchInterval: opened ? 10000 : false,
  });

  const refreshPipeline = () => {
    queryClient.invalidateQueries({ queryKey: ['aiStatus'] });
    queryClient.invalidateQueries({ queryKey: ['aiUnits'] });
    queryClient.invalidateQueries({ queryKey: ['aiHistory'] });
  };
  const requestMutation = useMutation({
    mutationFn: postAiRequest,
    onSuccess: refreshPipeline,
  });
  const reconcileMutation = useMutation({
    mutationFn: reconcileAiUnits,
    onSuccess: refreshPipeline,
  });

  const status = statusQuery.data;
  const units = unitsQuery.data?.units || [];
  const allUnits = kind === '' && !staleOnly ? units : (allUnitsQuery.data?.units || []);
  const history = historyQuery.data?.history || [];
  const error = statusQuery.error || unitsQuery.error || historyQuery.error || requestMutation.error || reconcileMutation.error;

  const analyze = (unit) => requestMutation.mutate({ kind: 'analyze', unitKind: unit.kind, unitKey: unit.key });
  const rate = (symbol) => requestMutation.mutate({ kind: 'rate', unitKind: 'security', unitKey: symbol });

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        size="xl"
        title={
          <Group gap="sm">
            <IconBrain size={20} />
            <Text fw={600}>Research pipeline</Text>
            {status && <Badge size="sm" color={status.enabled ? 'green' : 'gray'}>{status.enabled ? 'enabled' : 'paused'}</Badge>}
          </Group>
        }
        className="ai-pipeline"
      >
        {statusQuery.isLoading && !status ? (
          <Center h={360}><Loader /></Center>
        ) : statusQuery.isError ? (
          <Text c="red">{statusQuery.error.message}</Text>
        ) : status ? (
          <>
            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List>
                <Tabs.Tab value="status" leftSection={<IconActivity size={16} />}>Status</Tabs.Tab>
                <Tabs.Tab value="units" leftSection={<IconBook2 size={16} />}>Units</Tabs.Tab>
                <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>History</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="status" pt="md">
                <StatusPanel status={status} units={allUnits} onRate={rate} ratePending={requestMutation.isPending} />
              </Tabs.Panel>
              <Tabs.Panel value="units" pt="md">
                <UnitsPanel
                  units={units}
                  loading={unitsQuery.isLoading}
                  kind={kind}
                  staleOnly={staleOnly}
                  onKind={setKind}
                  onStaleOnly={setStaleOnly}
                  onAnalyze={analyze}
                  onView={setArtifactUnit}
                  onSync={() => reconcileMutation.mutate()}
                  busy={requestMutation.isPending || reconcileMutation.isPending}
                />
              </Tabs.Panel>
              <Tabs.Panel value="history" pt="md">
                <HistoryPanel history={history} loading={historyQuery.isLoading} />
              </Tabs.Panel>
            </Tabs>
            {error && <Text c="red" size="sm" mt="md">{error.message}</Text>}
          </>
        ) : null}
      </Modal>
      <ArtifactDrawer unit={artifactUnit} onClose={() => setArtifactUnit(null)} />
    </>
  );
}
