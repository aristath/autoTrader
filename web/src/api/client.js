/**
 * API Client for Sentinel backend
 */

const API_BASE = import.meta.env.VITE_MONOLITH_API_BASE || '/api';

async function requestFrom(base, endpoint, options = {}) {
  const response = await fetch(`${base}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    // Try to extract error detail from response body
    let errorMessage = `API error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      // Response body is not JSON, use default message
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function request(endpoint, options = {}) {
  return requestFrom(API_BASE, endpoint, options);
}

// Version
export const getVersion = () => request('/version');

// Portfolio
export const getPortfolio = () => request('/portfolio');
export const getPositions = () => request('/positions');
export const getPortfolioStructure = (force = false) =>
  request(`/portfolio/structure${force ? '?force=true' : ''}`);

// Securities
export const getSecurities = () => request('/securities');
export const getSecurity = (symbol) => request(`/securities/${symbol}`);
export const addSecurity = (symbol) =>
  request('/securities', {
    method: 'POST',
    body: JSON.stringify({ symbol }),
  });
export const deleteSecurity = (symbol, sellPosition = false) =>
  request(`/securities/${encodeURIComponent(symbol)}?sell_position=${sellPosition}`, {
    method: 'DELETE',
  });

// Recommendations (minValue optional - uses backend setting if not provided)
export const getRecommendations = (minValue) => {
  const url = minValue !== undefined
    ? `/planner/recommendations?min_value=${minValue}`
    : '/planner/recommendations';
  return request(url);
};

// Jobs/Scheduler
export const getSchedulerStatus = () => request('/jobs');

export const runJob = (jobName) => {
  return request(`/jobs/${encodeURIComponent(jobName)}/run`, { method: 'POST' });
};

export const refreshAll = async () => {
  await request('/jobs/refresh-all', { method: 'POST' });
  return { status: 'ok', message: 'All jobs rescheduled' };
};

// Job Schedules
export const getJobSchedules = () => request('/jobs/schedules');

export const updateJobSchedule = (jobType, data) => {
  return request(`/jobs/schedules/${encodeURIComponent(jobType)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};
export const getJobHistory = (jobType = null, limit = 50) => {
  const params = new URLSearchParams();
  if (jobType) params.append('job_type', jobType);
  if (limit) params.append('limit', limit);
  const query = params.toString();
  return request(`/jobs/history${query ? '?' + query : ''}`);
};

// AI research pipeline
export const getAiStatus = () => request('/ai/status');
export const getAiModels = () => request('/ai/models');
export const getAiUnits = ({ kind = '', staleOnly = false } = {}) => {
  const params = new URLSearchParams();
  if (kind) params.set('kind', kind);
  if (staleOnly) params.set('stale_only', 'true');
  const query = params.toString();
  return request(`/ai/units${query ? `?${query}` : ''}`);
};
export const postAiRequest = ({ kind, unitKind, unitKey }) =>
  request('/ai/requests', {
    method: 'POST',
    body: JSON.stringify({ kind, unit_kind: unitKind, unit_key: unitKey }),
  });
export const getAiHistory = (limit = 50) => request(`/ai/history?limit=${encodeURIComponent(limit)}`);
export const getAiArtifact = ({ kind, unitKey, name }) =>
  request(`/ai/artifacts/${encodeURIComponent(kind)}/${encodeURIComponent(unitKey)}/${encodeURIComponent(name)}`);

// Editable folder tasks
export const getTasks = () => request('/tasks');
export const getTask = (id) => request(`/tasks/${encodeURIComponent(id)}`);
export const createTask = (name = 'New Task') => request('/tasks', { method: 'POST', body: JSON.stringify({ name }) });
export const deleteTask = (id) => request(`/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' });
export const validateTask = (id) => request(`/tasks/${encodeURIComponent(id)}/validate`);
export const getTaskFiles = (id) => request(`/tasks/${encodeURIComponent(id)}/files`);
export const getTaskFile = (id, name) => request(`/tasks/${encodeURIComponent(id)}/files/${encodeURIComponent(name)}`);
export const saveTaskFile = (id, name, content) => request(`/tasks/${encodeURIComponent(id)}/files/${encodeURIComponent(name)}`, { method: 'PUT', body: JSON.stringify({ content }) });
export const createTaskFile = (id, name, content = '') => request(`/tasks/${encodeURIComponent(id)}/files`, { method: 'POST', body: JSON.stringify({ name, content }) });
export const deleteTaskFile = (id, name) => request(`/tasks/${encodeURIComponent(id)}/files/${encodeURIComponent(name)}`, { method: 'DELETE' });
export const saveTaskMeta = (id, meta) => request(`/tasks/${encodeURIComponent(id)}/meta`, { method: 'PUT', body: JSON.stringify(meta) });
export const startTaskRun = (id, runMode = 'balanced', inputs = {}) => request(`/tasks/${encodeURIComponent(id)}/run`, { method: 'POST', body: JSON.stringify({ runMode, inputs }) });
export const getTaskRuns = (id, limit = 50) => request(`/tasks/${encodeURIComponent(id)}/runs?limit=${encodeURIComponent(limit)}`);
export const getTaskRun = (runId) => request(`/task-runs/${encodeURIComponent(runId)}`);
export const stopTaskRun = (runId) => request(`/task-runs/${encodeURIComponent(runId)}`, { method: 'DELETE' });

// Settings
export const getSettings = () => request('/settings');
export const updateSetting = (key, value) =>
  request(`/settings/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ value }),
  });
export const updateSettingsBatch = (values) =>
  request('/settings', {
    method: 'PUT',
    body: JSON.stringify({ values }),
  });

// Unified view
export const getUnifiedView = (period = '1Y', asOf = null, includeInactive = false, inactiveOnly = false) => {
  const params = new URLSearchParams({ period });
  if (asOf) params.append('as_of', asOf);
  if (includeInactive) params.append('include_inactive', 'true');
  if (inactiveOnly) params.append('inactive_only', 'true');
  return request(`/unified?${params.toString()}`);
};

// Update security. Geography and industry are broker-sourced and not editable
// here; the backend silently drops them if a stale client tries to PUT them.
export const updateSecurity = (symbol, data) => {
  const processedData = { ...data };
  if (Array.isArray(processedData.aliases)) {
    processedData.aliases = processedData.aliases.join(', ');
  }
  return request(`/securities/${encodeURIComponent(symbol)}`, {
    method: 'PUT',
    body: JSON.stringify(processedData),
  });
};
export const updateSecurityPreference = ({ symbol, user_multiplier, analysis }) =>
  request('/securities/preference', {
    method: 'POST',
    body: JSON.stringify({ symbol, user_multiplier, analysis }),
  });

// Markets
export const getMarketsStatus = () => request('/markets/status');

// LED Display
export const getLedStatus = () => request('/led/status');
export const setLedEnabled = (enabled) =>
  request('/led/enabled', {
    method: 'PUT',
    body: JSON.stringify({ enabled }),
  });
export const setLedBrightness = (brightness) =>
  request('/led/brightness', {
    method: 'PUT',
    body: JSON.stringify({ brightness }),
  });
export const syncLed = () => request('/led/sync', { method: 'POST' });

// Trades
export const getTrades = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.symbol) searchParams.append('symbol', params.symbol);
  if (params.side) searchParams.append('side', params.side);
  if (params.start_date) searchParams.append('start_date', params.start_date);
  if (params.end_date) searchParams.append('end_date', params.end_date);
  if (params.limit) searchParams.append('limit', params.limit);
  if (params.offset) searchParams.append('offset', params.offset);
  const query = searchParams.toString();
  return request(`/trades${query ? '?' + query : ''}`);
};
export const syncTrades = () => request('/trades/sync', { method: 'POST' });

// Cash Flows
export const getCashFlows = () => request('/cashflows');
export const syncCashFlows = () => request('/cashflows/sync', { method: 'POST' });

// Portfolio P&L History
export const getPortfolioPnLHistory = (period = '1Y') =>
  request(`/portfolio/pnl-history?period=${encodeURIComponent(period)}`);
export const getPortfolioValueProjection = (years = 10, avgMonthlyNetDepositEur = null) => {
  const params = new URLSearchParams({ years: String(years) });
  const hasOverride = avgMonthlyNetDepositEur !== null && avgMonthlyNetDepositEur !== undefined && avgMonthlyNetDepositEur !== '';
  const override = hasOverride ? Number(avgMonthlyNetDepositEur) : NaN;
  if (hasOverride && Number.isFinite(override)) {
    params.set('avg_monthly_net_deposit_eur', String(override));
  }
  return request(`/portfolio/value-projection?${params.toString()}`);
};
export const getPortfolioPeriodStats = () => request('/portfolio/period-stats');

// Portfolio composition + risk/return metrics (replaces freedom24 PRAAMS)
export const getPortfolioComposition = () => request('/portfolio/composition');

// Forecasts
export const getForecastStatus = () => request('/forecasts/status');
export const getSecurityForecast = (symbol) => request(`/forecasts/${encodeURIComponent(symbol)}`);
