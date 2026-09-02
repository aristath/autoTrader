/**
 * Security Expanded Row Component
 *
 * Inline expandable content for a security row showing:
 * - Aliases and security metadata
 * - Price and forecast charts
 * - AI research multiplier, current action, and opportunity signals
 */
import { Fragment, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Group,
  Stack,
  Text,
  Badge,
  TagsInput,
  Grid,
  Table,
  Box,
  Tooltip,
  ActionIcon,
  Button,
} from '@mantine/core';
import { IconPlayerPlay, IconTrash, IconAlertTriangle } from '@tabler/icons-react';
import { SecurityChart } from './SecurityChart';
import { SecurityForecastCard } from './SecurityForecastCard';
import { catppuccin } from '../theme';
import { formatCurrencySymbol as formatCurrency, formatPercent } from '../utils/formatting';
import { getSecurityForecast } from '../api/client';

// Aliases is stored as a comma-separated string but TagsInput wants an array.
function parseCommaSeparated(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return value.split(',').map((v) => v.trim()).filter(Boolean);
}

function selectForecastPoints(forecastData) {
  const points = forecastData?.points || {};
  if (Array.isArray(points.grouped) && points.grouped.length > 0) {
    return points.grouped;
  }
  if (Array.isArray(points.solo) && points.solo.length > 0) {
    return points.solo;
  }
  return [];
}

export function SecurityExpandedRow({ security, onUpdate, onDelete, onActivate }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const { data: forecastData } = useQuery({
    queryKey: ['forecast', security?.symbol],
    queryFn: () => getSecurityForecast(security.symbol),
    enabled: Boolean(security?.symbol),
    staleTime: 5 * 60 * 1000,
  });

  if (!security) return null;

  const handleUpdate = async (field, value) => {
    setIsUpdating(true);
    try {
      await onUpdate(security.symbol, { [field]: value });
    } finally {
      setIsUpdating(false);
    }
  };

  const {
    symbol,
    currency,
    geography,
    industry,
    min_lot,
    aliases,
    ai_research_multiplier,
    ai_research_multiplier_updated_at,
    ai_research_multiplier_source,
    ai_research_multiplier_analysis,
    has_position,
    quantity,
    avg_cost,
    opp_score,
    forecast_score,
    forecast_return_4w,
    dip_score,
    capitulation_score,
    cycle_turn,
    freefall_block,
    prices,
    recommendation,
    price_warning,
    active,
    can_delete,
    transaction_count,
  } = security;

  const inactive = !active;
  const permanentDeleteBlocked = inactive && !can_delete;
  const deleteTooltip = permanentDeleteBlocked
    ? `Cannot delete: ${transaction_count || 0} historical transaction(s)`
    : inactive
      ? 'Permanently delete unused security'
      : 'Remove security from the active universe';

  const handleActivate = async () => {
    if (!onActivate) return;
    setIsActivating(true);
    try {
      await onActivate(symbol);
    } finally {
      setIsActivating(false);
    }
  };

  const forecastChartPoints = selectForecastPoints(forecastData);

  const storedMultiplier = Math.max(0, Math.min(1, ai_research_multiplier ?? 0.5));
  const storedMultiplierPercent = formatPercent(storedMultiplier * 100, false, 0);
  const preferenceTimestamp = ai_research_multiplier_updated_at
    ? new Date(ai_research_multiplier_updated_at).toLocaleString()
    : null;
  const opportunityRows = [
    [
      { label: 'Opportunity score', value: formatPercent((opp_score || 0) * 100, true, 1) },
      {
        label: 'Forecast timing',
        value: forecast_score !== undefined && forecast_score !== null
          ? formatPercent((forecast_score || 0) * 100, false, 0)
          : '-',
      },
    ],
    [
      { label: 'Dip', value: formatPercent((dip_score || 0) * 100, false, 1) },
      { label: 'Cycle turn', value: cycle_turn ? 'Yes' : 'No' },
    ],
    [
      { label: 'Capitulation', value: formatPercent((capitulation_score || 0) * 100, false, 1) },
      { label: 'Freefall blocked', value: freefall_block ? 'Yes' : 'No' },
    ],
  ];

  return (
    <Box
      p="md"
      style={{
        background: catppuccin.mantle,
        borderTop: `1px solid ${catppuccin.surface0}`,
      }}
    >
      <Stack gap="md">
        {price_warning && (
          <Box
            p="xs"
            style={{
              background: catppuccin.yellow + '33',
              borderRadius: 'var(--mantine-radius-sm)',
              border: `1px solid ${catppuccin.yellow}`,
            }}
          >
            <Group gap="xs">
              <IconAlertTriangle size={16} color={catppuccin.yellow} />
              <Text size="sm" fw={500}>{price_warning}</Text>
            </Group>
          </Box>
        )}

        <Group align="flex-end" gap="sm" wrap="nowrap">
          <Box style={{ flex: 1, minWidth: 0 }}>
            <TagsInput
              label="Aliases"
              size="xs"
              value={parseCommaSeparated(aliases)}
              onChange={(v) => handleUpdate('aliases', v)}
              placeholder="News search names"
              clearable
              disabled={isUpdating}
            />
          </Box>
          <Group gap="xs" wrap="nowrap">
            {inactive && onActivate && (
              <Button
                variant="light"
                color="green"
                size="xs"
                leftSection={<IconPlayerPlay size={14} />}
                loading={isActivating}
                onClick={handleActivate}
              >
                Activate
              </Button>
            )}
            <Tooltip label={deleteTooltip}>
              <span>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="lg"
                  disabled={permanentDeleteBlocked}
                  onClick={() => onDelete(security)}
                  aria-label={`Delete ${symbol}`}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </span>
            </Tooltip>
          </Group>
        </Group>

        {permanentDeleteBlocked && (
          <Text size="xs" c="dimmed">
            Permanent deletion is unavailable because this security has {transaction_count || 0} historical transaction(s).
          </Text>
        )}

        <Group gap="md" wrap="wrap">
          <Text size="xs" c="dimmed">
            Geography: <Text component="span" size="xs" fw={500}>{geography || '—'}</Text>
          </Text>
          <Text size="xs" c="dimmed">
            Industry: <Text component="span" size="xs" fw={500}>{industry || '—'}</Text>
          </Text>
          <Text size="xs" c="dimmed">
            Lot Size: <Text component="span" size="xs" fw={500}>{min_lot}</Text>
          </Text>
        </Group>

        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Box
              p="xs"
              style={{
                background: catppuccin.base,
                border: `1px solid ${catppuccin.surface0}`,
                height: '100%',
              }}
            >
              <Stack gap={6}>
                <Group justify="space-between" align="center">
                  <Text size="xs" fw={700} tt="uppercase" c="dimmed">Price</Text>
                  {has_position && (
                    <Text size="xs" c="dimmed">
                      Avg <Text component="span" size="xs" fw={500}>{formatCurrency(avg_cost, currency)}</Text>
                    </Text>
                  )}
                </Group>
                <SecurityChart
                  prices={prices}
                  avgCost={avg_cost}
                  hasPosition={has_position}
                  forecastPoints={forecastChartPoints}
                  height={100}
                />
              </Stack>
            </Box>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <SecurityForecastCard
              symbol={symbol}
              forecastData={forecastData}
              forecastScore={forecast_score}
              forecastReturn4w={forecast_return_4w}
              chartHeight={100}
            />
          </Grid.Col>
        </Grid>

        <Box
          p="xs"
          style={{
            background: catppuccin.base,
            borderRadius: 'var(--mantine-radius-sm)',
            border: `1px solid ${catppuccin.surface0}`,
          }}
        >
          <Group gap="xs" mb={ai_research_multiplier_analysis ? 4 : 0}>
            <Badge variant="light" color="blue" size="xs">AI_RESEARCH</Badge>
            <Text size="xs" fw={600}>{storedMultiplierPercent}</Text>
            {ai_research_multiplier_source && ai_research_multiplier_source !== 'ai_research' && (
              <Badge variant="light" color="gray" size="xs">{ai_research_multiplier_source}</Badge>
            )}
            {preferenceTimestamp && <Text size="xs" c="dimmed">{preferenceTimestamp}</Text>}
          </Group>
          {ai_research_multiplier_analysis && (
            <Text size="xs" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              {ai_research_multiplier_analysis}
            </Text>
          )}
        </Box>

        {recommendation && (
          <Box
            p="sm"
            style={{
              background: catppuccin.base,
              borderRadius: 'var(--mantine-radius-sm)',
              borderLeft: `3px solid ${recommendation.action === 'buy' ? catppuccin.green : catppuccin.red}`,
            }}
          >
            <Group gap="sm">
              <Badge
                color={recommendation.action === 'buy' ? 'green' : 'red'}
                variant="filled"
                size="sm"
              >
                {recommendation.action.toUpperCase()}
              </Badge>
              <Text size="xs">
                {formatCurrency(Math.abs(recommendation.value_delta_eur))}
                {recommendation.action === 'sell' && quantity > 0 && (
                  <Text span c="dimmed"> ({Math.round((recommendation.quantity / quantity) * 100)}%)</Text>
                )}
              </Text>
            </Group>
            <Text size="xs" c="dimmed" mt={4}>{recommendation.reason}</Text>
          </Box>
        )}

        <Box style={{ overflowX: 'auto' }}>
          <Table
            withRowBorders={false}
            style={{
              width: '100%',
              minWidth: 520,
            }}
          >
            <Table.Tbody>
              {opportunityRows.map((row) => (
                <Table.Tr key={row.map((item) => item.label).join('-')}>
                  {row.map((item) => (
                    <Fragment key={item.label}>
                      <Table.Th
                        scope="row"
                        style={{ padding: '2px 12px 2px 0', fontWeight: 400 }}
                      >
                        <Text size="xs" c="dimmed">{item.label}</Text>
                      </Table.Th>
                      <Table.Td
                        ta="right"
                        style={{
                          padding: '2px 32px 2px 0',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        <Text size="xs" fw={500}>{item.value}</Text>
                      </Table.Td>
                    </Fragment>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>
      </Stack>
    </Box>
  );
}
