# Web UI Refactor Summary

This document describes the refactoring of the Arduino Trader web UI from BEM CSS to Tailwind CSS.

## Overview

The web UI was refactored to:
1. Replace 1504-line BEM CSS with Tailwind CSS utility classes
2. Extract API calls into a dedicated module
3. Add responsive design with progressive column hiding
4. Prepare for future charting capabilities with Lightweight Charts

## Architecture

### Before
```
static/
  css/styles.css          (1504 lines - BEM CSS)
  js/store.js             (583 lines - state + API calls)
  components/*.js         (12 components with BEM classes)
```

### After
```
static/
  css/
    input.css             (78 lines - Tailwind directives + custom CSS)
    output.css            (17KB minified - compiled Tailwind)
  js/
    api.js                (67 lines - API layer)
    store.js              (479 lines - state management only)
    utils.js              (145 lines - formatting helpers with Tailwind classes)
  lib/
    alpine.min.js         (Alpine.js framework)
    lightweight-charts.standalone.production.js (TradingView charts)
  components/             (12 components with Tailwind classes)
```

## Build System

### Tailwind CLI (Standalone Binary)

No Node.js required. Uses the standalone Tailwind CLI binary:

```bash
# Development (watch mode)
./tailwindcss -i static/css/input.css -o static/css/output.css --watch

# Production (minified)
./tailwindcss -i static/css/input.css -o static/css/output.css --minify
```

### Configuration

`tailwind.config.js`:
```javascript
module.exports = {
  content: ["./static/**/*.html", "./static/**/*.js"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: { DEFAULT: '#1f2937', hover: '#374151' },
        eu: '#3b82f6',
        asia: '#ef4444',
        us: '#22c55e',
      }
    }
  },
  plugins: [],
}
```

## Component Migration

All 12 components were migrated from BEM classes to Tailwind utilities:

### Tier 1 (Simple Components)
- `app-header.js` - Header with connection status
- `status-bar.js` - System status display
- `summary-cards.js` - Portfolio statistics grid
- `pnl-card.js` - Profit/loss display with deposit editing

### Tier 2 (Charts)
- `geo-chart.js` - SVG doughnut chart for geographic allocation
- `industry-chart.js` - Weight bars for industry allocation

### Tier 3 (Tables)
- `trades-table.js` - Recent trades history
- `stock-table.js` - Stock universe with filters/sorting

### Tier 4 (Modals & Actions)
- `quick-actions.js` - Action buttons
- `add-stock-modal.js` - Add stock form
- `edit-stock-modal.js` - Edit stock form
- `rebalance-modal.js` - Rebalance preview/execute

## Responsive Design

### Stock Table Column Visibility

| Column | Mobile (<640px) | Tablet (640-1024px) | Desktop (>1024px) |
|--------|-----------------|---------------------|-------------------|
| Symbol | ✅ (sticky) | ✅ (sticky) | ✅ |
| Company | ❌ | ✅ | ✅ |
| Region | ✅ | ✅ | ✅ |
| Sector | ❌ | ❌ | ✅ |
| Value | ✅ | ✅ | ✅ |
| Score | ✅ | ✅ | ✅ |
| Mult | ❌ | ❌ | ✅ |
| Priority | ✅ | ✅ | ✅ |
| Actions | ❌ (row tap) | ✅ | ✅ |

On mobile, tapping a row opens the edit modal.

## API Layer

Extracted all fetch operations into `static/js/api.js`:

```javascript
const API = {
  // Status
  fetchStatus: () => fetch('/api/status').then(r => r.json()),
  fetchTradernet: () => fetch('/api/status/tradernet').then(r => r.json()),
  syncPrices: () => API._post('/api/status/sync/prices'),

  // Allocation
  fetchAllocation: () => fetch('/api/trades/allocation').then(r => r.json()),
  fetchTargets: () => fetch('/api/allocation/targets').then(r => r.json()),
  saveGeoTargets: (targets) => API._put('/api/allocation/targets/geography', { targets }),
  saveIndustryTargets: (targets) => API._put('/api/allocation/targets/industry', { targets }),

  // Stocks
  fetchStocks: () => fetch('/api/stocks').then(r => r.json()),
  createStock: (data) => API._post('/api/stocks', data),
  updateStock: (symbol, data) => API._put(`/api/stocks/${symbol}`, data),
  deleteStock: (symbol) => API._delete(`/api/stocks/${symbol}`),
  refreshScore: (symbol) => API._post(`/api/stocks/${symbol}/refresh`),
  refreshAllScores: () => API._post('/api/stocks/refresh-all'),

  // Trades
  fetchTrades: () => fetch('/api/trades').then(r => r.json()),
  previewRebalance: () => API._post('/api/trades/rebalance/preview'),
  executeRebalance: () => API._post('/api/trades/rebalance/execute'),

  // Portfolio
  fetchPnl: () => fetch('/api/portfolio/pnl').then(r => r.json()),
  setDeposits: (amount) => API._put('/api/portfolio/deposits', { amount }),
};
```

## Charting Library

Lightweight Charts by TradingView is included for future financial data visualization:

```javascript
// Example usage (for future candlestick/line charts)
const chart = LightweightCharts.createChart(container, {
  width: 400,
  height: 300,
  layout: { background: { color: '#1f2937' }, textColor: '#9ca3af' },
  grid: { vertLines: { color: '#374151' }, horzLines: { color: '#374151' } },
});

const series = chart.addCandlestickSeries({
  upColor: '#22c55e',
  downColor: '#ef4444',
});
```

The existing SVG doughnut charts in geo-chart.js are retained as they work well for allocation visualization.

## Design System

### Colors
- Background: `bg-gray-900` (body), `bg-gray-800` (cards)
- Text: `text-gray-100` (primary), `text-gray-400` (secondary), `text-gray-500` (muted)
- Accent: `text-blue-400` (links, symbols), `text-green-400` (positive), `text-red-400` (negative)

### Typography
- Headers: `text-xs text-gray-400 uppercase tracking-wide`
- Values: `font-mono font-bold` with size variants
- Labels: `text-sm text-gray-300`

### Components
- Cards: `bg-gray-800 border border-gray-700 rounded p-3`
- Buttons: `px-3 py-1.5 bg-{color}-600 hover:bg-{color}-500 text-white text-xs rounded transition-colors`
- Inputs: `px-2 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm text-gray-100 focus:border-blue-500`

## Files Changed

| File | Action | Lines Before | Lines After |
|------|--------|--------------|-------------|
| static/css/styles.css | DELETED | 1504 | 0 |
| static/css/input.css | CREATED | - | 78 |
| static/css/output.css | GENERATED | - | ~17KB |
| static/js/api.js | CREATED | - | 67 |
| static/js/store.js | REFACTORED | 583 | 479 |
| static/js/utils.js | UPDATED | 145 | 145 |
| static/components/*.js | MIGRATED | - | - |
| tailwind.config.js | CREATED | - | 18 |
| .gitignore | UPDATED | - | +tailwindcss |

## Development Workflow

1. Make changes to components or CSS
2. Run Tailwind build: `./tailwindcss -i static/css/input.css -o static/css/output.css --minify`
3. Refresh browser to see changes

For development with auto-rebuild:
```bash
./tailwindcss -i static/css/input.css -o static/css/output.css --watch
```
