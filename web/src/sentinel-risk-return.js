import { LitElement, html } from "lit";
import { getJson } from "./api.js";
import { LiveResource } from "./live-resource.js";
import { storeWidgetCollapsed, widgetCollapsed } from "./widget-state.js";

function clamp01(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

function percent(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }
  return `${(value * 100).toFixed(digits)}%`;
}

function number(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }
  return Number(value).toFixed(digits);
}

export class SentinelRiskReturn extends LitElement {
  composition = new LiveResource(
    this,
    (signal) => getJson("/api/portfolio/composition", { signal }),
    { interval: 5 * 60_000 },
  );

  createRenderRoot() {
    return this;
  }

  storeCollapsed(event) {
    storeWidgetCollapsed("risk-return", !event.currentTarget.open);
  }

  metricRows(metrics) {
    const rows = [
      {
        label: "Last year",
        subLabel: "1Y return — money made (or lost) after subtracting deposits",
        value: metrics.return_1y,
        formatted: percent(metrics.return_1y),
        min: -0.3,
        max: 0.3,
        reference: 0,
        minLabel: "-30%",
        maxLabel: "+30%",
        referenceLabel: "break-even",
        goodDirection: "high",
      },
      {
        label: "Since the beginning",
        subLabel: `CAGR — annualized growth since first deposit (${number(metrics.inception_years || 0, 1)} years)`,
        value: metrics.return_since_inception_cagr,
        formatted: percent(metrics.return_since_inception_cagr),
        min: -0.3,
        max: 0.3,
        reference: 0,
        minLabel: "-30%",
        maxLabel: "+30%",
        referenceLabel: "break-even",
        goodDirection: "high",
      },
      {
        label: "Bumpiness",
        subLabel: "Annual volatility — how wild the daily price swings are",
        value: metrics.volatility,
        formatted: percent(metrics.volatility),
        min: 0,
        max: 0.4,
        reference: 0.18,
        minLabel: "calm",
        maxLabel: "wild",
        referenceLabel: "typical",
        goodDirection: "low",
      },
      {
        label: "Worst drop",
        subLabel: "Max drawdown — biggest dip from peak to bottom",
        value: metrics.max_drawdown,
        formatted: percent(metrics.max_drawdown),
        min: 0,
        max: 0.5,
        reference: 0.2,
        minLabel: "no dips",
        maxLabel: "crash",
        referenceLabel: "tolerable",
        goodDirection: "low",
      },
      {
        label: "Reward for the bumps",
        subLabel: "Sharpe ratio — return per unit of risk, vs cash",
        value: metrics.sharpe,
        formatted: number(metrics.sharpe),
        min: -1,
        max: 3,
        reference: 1,
        minLabel: "-1",
        maxLabel: "3",
        referenceLabel: "good",
        goodDirection: "high",
      },
      {
        label: "All in one basket?",
        subLabel: "Concentration (HHI) — 0 spread evenly, 1 single position",
        value: metrics.hhi,
        formatted: number(metrics.hhi, 3),
        min: 0,
        max: 1,
        reference: 0.1,
        minLabel: "spread",
        maxLabel: "all-in",
        referenceLabel: "diversified",
        goodDirection: "low",
      },
    ];

    if (
      (this.composition.value?.home_markets || []).length > 0 &&
      (metrics.home_coverage_pct || 0) > 0
    ) {
      const coverage = `covers ${percent(metrics.home_coverage_pct, 0)} of holdings`;
      rows.push(
        {
          label: "Tracks home markets?",
          subLabel: `Beta vs each holding's own market index, value-weighted (${coverage})`,
          value: metrics.beta_vs_home,
          formatted: number(metrics.beta_vs_home),
          min: -1,
          max: 2,
          reference: 1,
          minLabel: "-1",
          maxLabel: "+2",
          referenceLabel: "in step",
          goodDirection: "neutral",
        },
        {
          label: "Beating home markets?",
          subLabel: `Alpha — value-weighted outperformance vs each holding's home index (${coverage})`,
          value: metrics.alpha_1y_vs_home,
          formatted: percent(metrics.alpha_1y_vs_home),
          min: -0.2,
          max: 0.2,
          reference: 0,
          minLabel: "-20%",
          maxLabel: "+20%",
          referenceLabel: "matches",
          goodDirection: "high",
        },
      );
    }

    return rows;
  }

  metricColor(row) {
    if (row.goodDirection === "neutral") {
      return "var(--tui-color)";
    }
    const good =
      row.goodDirection === "high"
        ? row.value >= row.reference
        : row.value <= row.reference;
    return good ? "var(--tui-success-color)" : "var(--tui-error-color)";
  }

  renderMetric(row) {
    const span = row.max - row.min;
    const valuePosition =
      span > 0 ? clamp01((row.value - row.min) / span) : 0.5;
    const referencePosition =
      span > 0 ? clamp01((row.reference - row.min) / span) : 0.5;
    const color = this.metricColor(row);

    return html`
      <div style="display: grid; gap: 2px">
        <div
          style="display: flex; justify-content: space-between; gap: 1ch; align-items: baseline"
        >
          <div style="flex: 1 1 auto; min-width: 0">
            <div style="font-weight: 600">${row.label}</div>
            <div style="color: var(--tui-disabled-color); font-size: 0.75em">
              ${row.subLabel}
            </div>
          </div>
          <div style="color: ${color}; flex: 0 0 auto; font-weight: 600">
            ${row.formatted}
          </div>
        </div>
        <div
          aria-hidden="true"
          style="position: relative; height: 10px; margin: 4px 0 2px; overflow: hidden; background: color-mix(in srgb, var(--tui-color) 18%, transparent)"
        >
          <div
            style="position: absolute; left: ${Math.min(referencePosition, valuePosition) * 100}%; width: ${Math.abs(valuePosition - referencePosition) * 100}%; top: 0; bottom: 0; background: ${color}"
          ></div>
          <div
            style="position: absolute; left: ${referencePosition * 100}%; top: -2px; bottom: -2px; width: 1px; background: var(--tui-disabled-color); transform: translateX(-0.5px)"
          ></div>
        </div>
        <div
          aria-hidden="true"
          style="position: relative; height: 1.1em; color: var(--tui-disabled-color); font-size: 0.75em"
        >
          <span style="position: absolute; left: 0">${row.minLabel}</span>
          <span
            style="position: absolute; left: ${referencePosition * 100}%; transform: translateX(-50%); white-space: nowrap"
            >${row.referenceLabel}</span
          >
          <span style="position: absolute; right: 0">${row.maxLabel}</span>
        </div>
      </div>
    `;
  }

  renderHomeMarkets(data) {
    const markets = data.home_markets || [];
    if (markets.length === 0 || !(data.metrics.home_coverage_pct > 0)) {
      return html`<div
        style="color: var(--tui-disabled-color); font-size: 0.75em; font-style: italic"
      >
        Benchmarks not yet synced — home-market comparison will populate on
        next sync cycle.
      </div>`;
    }

    return html`
      <div style="display: grid; gap: 2px">
        <div
          style="color: var(--tui-disabled-color); font-size: 0.75em; font-weight: 600; text-transform: uppercase"
        >
          vs home markets
        </div>
        ${markets.map(
          (market) => html`
            <div
              style="display: flex; justify-content: space-between; gap: 1ch; font-size: 0.75em"
            >
              <span style="color: var(--tui-disabled-color)"
                >${market.group} (${percent(market.weight_pct, 0)})</span
              >
              <span
                style="color: ${market.alpha_1y >= 0
                  ? "var(--tui-success-color)"
                  : "var(--tui-error-color)"}"
                >${percent(market.alpha_1y)} α · β
                ${number(market.beta)}</span
              >
            </div>
          `,
        )}
      </div>
    `;
  }

  render() {
    const data = this.composition.value;
    if (
      (this.composition.loading && !data) ||
      this.composition.error ||
      !data?.metrics
    ) {
      return "";
    }

    return html`
      <details
        ?open=${!widgetCollapsed("risk-return")}
        @toggle=${this.storeCollapsed}
      >
        <summary style="cursor: pointer; font-weight: 600">Risk / Return</summary>
        <tui-box heading="Risk / Return" border="single">
          <div style="display: grid; gap: 1em">
            ${this.metricRows(data.metrics).map((row) => this.renderMetric(row))}
            ${this.renderHomeMarkets(data)}
          </div>
        </tui-box>
      </details>
    `;
  }
}

customElements.define("sentinel-risk-return", SentinelRiskReturn);
