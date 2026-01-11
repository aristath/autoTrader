import { create } from 'zustand';
import { api } from '../api/client';

// Parse raw log string into structured object
function parseLogLine(line) {
  // Format: "Jan 11 10:30:00 hostname sentinel: [LEVEL] message" or similar
  const parts = line.split(': ');
  if (parts.length < 2) {
    return {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: line,
    };
  }

  const [dateHostService, ...messageParts] = parts;
  const message = messageParts.join(': ');

  // Extract log level from message
  let level = 'INFO';
  const levelMatch = message.match(/\[(DEBUG|INFO|WARNING|ERROR|CRITICAL)\]/) ||
    message.match(/^(DEBUG|INFO|WARNING|ERROR|CRITICAL):/i);
  if (levelMatch) {
    level = levelMatch[1].toUpperCase();
  }

  // Try to parse timestamp from the date part
  // Format is typically "Jan 11 10:30:00" or similar (journalctl short format)
  // Journalctl short format: MMM DD HH:MM:SS (no year, assumes current year)
  const dateMatch = dateHostService.match(/^(\w+ \d+ \d+:\d+:\d+)/);
  let timestamp = new Date().toISOString(); // Default to current time

  if (dateMatch) {
    const dateStr = dateMatch[1];
    // Parse date string like "Jan 11 16:25:36"
    // Add current year since journalctl short format doesn't include it
    const now = new Date();
    const year = now.getFullYear();
    const fullDateStr = `${dateStr} ${year}`;
    const parsedDate = new Date(fullDateStr);

    // Validate the parsed date
    if (!isNaN(parsedDate.getTime())) {
      timestamp = parsedDate.toISOString();
    }
  }

  return {
    timestamp,
    level,
    message,
  };
}

export const useLogsStore = create((set, get) => ({
  entries: [],
  filterLevel: null,
  searchQuery: '',
  lineCount: 100,
  showErrorsOnly: false,
  autoRefresh: true, // Auto-refresh enabled (HTTP polling)
  refreshInterval: 10000, // Refresh every 10 seconds
  loading: false,
  refreshTimer: null,
  totalLines: 0,

  fetchLogs: async () => {
    const { filterLevel, searchQuery, lineCount, showErrorsOnly } = get();
    set({ loading: true });

    try {
      let data;
      if (showErrorsOnly) {
        data = await api.fetchErrorLogs(lineCount);
      } else {
        data = await api.fetchLogs(lineCount, filterLevel, searchQuery || null);
      }

      // Parse raw log lines into structured objects
      const parsedEntries = (data.lines || []).map(parseLogLine);

      set({
        entries: parsedEntries,
        totalLines: data.total || 0,
        loading: false,
      });
    } catch (e) {
      console.error('Failed to fetch logs:', e);
      set({ loading: false });
    }
  },

  startAutoRefresh: () => {
    const { refreshTimer, refreshInterval } = get();
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }

    const timer = setInterval(() => {
      get().fetchLogs();
    }, refreshInterval);

    set({ refreshTimer: timer });
  },

  stopAutoRefresh: () => {
    const { refreshTimer } = get();
    if (refreshTimer) {
      clearInterval(refreshTimer);
      set({ refreshTimer: null });
    }
  },

  setFilterLevel: (level) => {
    set({ filterLevel: level === 'all' ? null : level });
    get().fetchLogs();
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    // Debounce is handled by the component
  },

  setLineCount: (count) => {
    set({ lineCount: Math.max(50, Math.min(1000, count || 100)) });
    get().fetchLogs();
  },

  setShowErrorsOnly: (show) => {
    set({ showErrorsOnly: show });
    get().fetchLogs();
  },

  setAutoRefresh: (enabled) => {
    set({ autoRefresh: enabled });
    if (enabled) {
      get().startAutoRefresh();
    } else {
      get().stopAutoRefresh();
    }
  },
}));
