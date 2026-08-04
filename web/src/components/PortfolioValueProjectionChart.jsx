import { Group, Stack, Text } from '@mantine/core';
import { catppuccin } from '../theme';
import { useResponsiveWidth } from '../hooks/useResponsiveWidth';
import { formatCompact, formatEur, formatPercent } from '../utils/formatting';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toTime(date) {
  const parsed = Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(parsed) ? parsed : null;
}

function linePath(points) {
  if (points.length < 2) return '';
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x},${point.y}`).join(' ');
}

function yearLabel(date) {
  if (!date) return '';
  return String(new Date(`${date}T00:00:00Z`).getUTCFullYear());
}

function addYears(date, years) {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(Date.UTC(parsed.getUTCFullYear() + years, parsed.getUTCMonth(), parsed.getUTCDate()));
}

function projectionYearTicks(summary) {
  const years = Number(summary?.projection_years || 0);
  const currentDate = summary?.current_date;
  if (!currentDate || !Number.isFinite(years) || years <= 0) return [];

  const stepYears = years / 5;
  return [1, 2, 3, 4, 5]
    .map((index) => {
      const tickDate = addYears(currentDate, stepYears * index);
      if (!tickDate) return null;
      return {
        label: String(tickDate.getUTCFullYear()),
        time: tickDate.getTime(),
      };
    })
    .filter(Boolean);
}

function Stat({ label, value, tone }) {
  return (
    <Stack gap={0} className="portfolio-value-projection__stat">
      <Text size="xs" c="dimmed">{label}</Text>
      <Text size="sm" fw={600} c={tone}>
        {value}
      </Text>
    </Stack>
  );
}

export function PortfolioValueProjectionChart({ data, height = 280 }) {
  const [containerRef, width] = useResponsiveWidth(320);
  const history = data?.history || [];
  const projection = data?.projection || [];
  const summary = data?.summary;

  if (!summary || history.length < 1 || projection.length < 2) {
    return (
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Text size="sm" fw={500}>Portfolio value</Text>
          <Text size="xs" c="dimmed">Projection</Text>
        </Group>
        <div ref={containerRef} style={{ width: '100%', height }}>
          <div style={{ color: catppuccin.overlay1, fontSize: 12, textAlign: 'center', paddingTop: 40 }}>
            Not enough data yet
          </div>
        </div>
      </Stack>
    );
  }

  const padding = { top: 18, right: 86, bottom: 28, left: 10 };
  const chartWidth = Math.max(0, width - padding.left - padding.right);
  const chartHeight = Math.max(0, height - padding.top - padding.bottom);
  const historyTimes = history.map((point) => toTime(point.date)).filter((value) => value != null);
  const projectionTimes = projection.map((point) => toTime(point.date)).filter((value) => value != null);
  const xMin = historyTimes.length ? Math.min(...historyTimes) : projectionTimes[0];
  const xMax = projectionTimes.length ? Math.max(...projectionTimes) : historyTimes[historyTimes.length - 1];
  const values = [
    ...history.map((point) => Number(point.total_value_eur)).filter(Number.isFinite),
    ...projection.map((point) => Number(point.projected_value_eur)).filter(Number.isFinite),
  ];
  const maxValue = values.length ? Math.max(...values) : 1;
  const yMin = 0;
  const yMax = Math.max(maxValue * 1.08, 1);

  const scaleX = (time) => padding.left + ((time - xMin) / Math.max(xMax - xMin, MS_PER_DAY)) * chartWidth;
  const scaleY = (value) => padding.top + chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight;

  const historyPoints = history
    .map((point) => {
      const time = toTime(point.date);
      const value = Number(point.total_value_eur);
      if (time == null || !Number.isFinite(value)) return null;
      return { x: scaleX(time), y: scaleY(value), value };
    })
    .filter(Boolean);

  const projectionPoints = projection
    .map((point) => {
      const time = toTime(point.date);
      const value = Number(point.projected_value_eur);
      if (time == null || !Number.isFinite(value)) return null;
      return { x: scaleX(time), y: scaleY(value), value };
    })
    .filter(Boolean);

  const historyPath = linePath(historyPoints);
  const projectionPath = linePath(projectionPoints);
  const todayX = projectionPoints[0]?.x;
  const currentY = historyPoints[historyPoints.length - 1]?.y;
  const projectedY = projectionPoints[projectionPoints.length - 1]?.y;
  const finalProjection = projection[projection.length - 1];
  const finalDate = finalProjection?.date;
  const xTicks = projectionYearTicks(summary);

  const currentTone = Number(summary.total_pnl_eur || 0) >= 0 ? 'green' : 'red';
  const returnTone = Number(summary.annualized_total_pnl_pct || 0) >= 0 ? 'green' : 'red';

  return (
    <Stack gap="xs">
      <Group justify="space-between" align="flex-start" gap="sm">
        <Stack gap={0}>
          <Text size="sm" fw={500}>Portfolio value</Text>
          <Text size="xs" c="dimmed">
            {yearLabel(summary.start_date)} to {yearLabel(finalDate)}
          </Text>
        </Stack>
        <Group gap="lg" justify="flex-end" className="portfolio-value-projection__stats">
          <Stat label="Now" value={formatEur(summary.current_value_eur, 0)} />
          <Stat label={`${summary.projection_years}Y`} value={formatEur(summary.projected_value_eur, 0)} tone="blue" />
          <Stat label="P/L" value={formatPercent(summary.total_pnl_pct, true, 1)} tone={currentTone} />
          <Stat label={`${summary.deposit_window_months}M net/mo`} value={formatEur(summary.avg_monthly_net_deposit_eur, 0)} />
          <Stat label="Run-rate" value={formatPercent(summary.annualized_total_pnl_pct, true, 1)} tone={returnTone} />
        </Group>
      </Group>

      <div ref={containerRef} style={{ width: '100%', height }}>
        <svg width={width} height={height} role="img" aria-label="Portfolio value history and projection">
          {[0.25, 0.5, 0.75].map((ratio) => {
            const y = padding.top + ratio * chartHeight;
            const value = yMax - ratio * (yMax - yMin);
            return (
              <g key={ratio}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke={catppuccin.surface2} strokeWidth="1" opacity="0.5" />
                <text x={width - padding.right + 6} y={y} fontSize="10" fill={catppuccin.overlay1} dominantBaseline="middle">
                  {formatCompact(value, 1)}
                </text>
              </g>
            );
          })}

          {todayX != null && (
            <line x1={todayX} y1={padding.top} x2={todayX} y2={padding.top + chartHeight} stroke={catppuccin.surface2} strokeWidth="1" strokeDasharray="3,4" />
          )}
          {xTicks.map((tick) => {
            const x = scaleX(tick.time);
            return (
              <g key={`${tick.label}-${tick.time}`}>
                <line x1={x} y1={padding.top} x2={x} y2={padding.top + chartHeight} stroke={catppuccin.surface2} strokeWidth="1" opacity="0.35" />
                <text x={x} y={height - 8} textAnchor="middle" fontSize="10" fill={catppuccin.overlay1}>
                  {tick.label}
                </text>
              </g>
            );
          })}
          {historyPath && <path d={historyPath} fill="none" stroke={catppuccin.green} strokeWidth="2.25" />}
          {projectionPath && (
            <path
              d={projectionPath}
              fill="none"
              stroke={catppuccin.blue}
              strokeWidth="2.25"
              strokeDasharray="7,5"
              strokeLinecap="round"
            />
          )}
          {todayX != null && currentY != null && <circle cx={todayX} cy={currentY} r="3" fill={catppuccin.green} />}

          {currentY != null && (
            <text x={width - padding.right + 6} y={currentY} fontSize="10" fill={catppuccin.green} dominantBaseline="middle">
              {formatCompact(summary.current_value_eur, 1)}
            </text>
          )}
          {projectedY != null && (
            <text x={width - padding.right + 6} y={projectedY} fontSize="10" fill={catppuccin.blue} dominantBaseline="middle">
              {formatCompact(summary.projected_value_eur, 1)}
            </text>
          )}

        </svg>
      </div>
    </Stack>
  );
}

export default PortfolioValueProjectionChart;
