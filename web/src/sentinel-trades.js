import { LitElement, html } from "lit";
import { getJson, postJson } from "./api.js";
import { LiveResource } from "./live-resource.js";
import { formatDateTime, formatNumber } from "./modal-utils.js";

class SentinelTrades extends LitElement {
  static properties = {
    page: { state: true },
    symbol: { state: true },
    side: { state: true },
    startDate: { state: true },
    endDate: { state: true },
    syncing: { state: true },
    actionError: { state: true },
  };

  constructor() {
    super();
    this.page = 1;
    this.symbol = "";
    this.side = "";
    this.startDate = "";
    this.endDate = "";
    this.syncing = false;
    this.actionError = "";
  }

  pageSize = 20;

  securities = new LiveResource(
    this,
    (signal) => getJson("/api/securities", { signal }),
    { interval: 60_000 },
  );

  trades = new LiveResource(
    this,
    (signal) => getJson(this.tradesPath, { signal }),
    { interval: 30_000 },
  );

  createRenderRoot() {
    return this;
  }

  get tradesPath() {
    const parameters = new URLSearchParams({
      limit: String(this.pageSize),
      offset: String((this.page - 1) * this.pageSize),
    });

    if (this.symbol) parameters.set("symbol", this.symbol);
    if (this.side) parameters.set("side", this.side);
    if (this.startDate) parameters.set("start_date", this.startDate);
    if (this.endDate) parameters.set("end_date", this.endDate);
    return `/api/trades?${parameters}`;
  }

  changeFilter(name, value) {
    this[name] = value;
    this.page = 1;
    this.trades.refresh();
  }

  changePage(page) {
    this.page = page;
    this.trades.refresh();
  }

  async syncTrades() {
    this.syncing = true;
    this.actionError = "";

    try {
      await postJson("/api/trades/sync");
      await this.trades.refresh();
    } catch (error) {
      this.actionError = error.message;
    } finally {
      this.syncing = false;
    }
  }

  renderControls() {
    const symbols = (this.securities.value ?? [])
      .map((security) => security.symbol)
      .sort();

    return html`
      <tui-flex align="baseline" wrap>
        <label
          >Symbol&nbsp;<tui-select
            value=${this.symbol}
            @change=${(event) =>
              this.changeFilter("symbol", event.currentTarget.value)}
          >
            <option value="">All symbols</option>
            ${symbols.map(
              (symbol) => html`<option value=${symbol}>${symbol}</option>`,
            )}
          </tui-select></label
        >
        <span aria-hidden="true">&nbsp;│&nbsp;</span>
        <label
          >Side&nbsp;<tui-select
            value=${this.side}
            @change=${(event) =>
              this.changeFilter("side", event.currentTarget.value)}
          >
            <option value="">All</option>
            <option value="BUY">Buy</option>
            <option value="SELL">Sell</option>
          </tui-select></label
        >
        <span aria-hidden="true">&nbsp;│&nbsp;</span>
        <label
          >From&nbsp;<tui-input
            type="date"
            value=${this.startDate}
            @change=${(event) =>
              this.changeFilter("startDate", event.currentTarget.value)}
          ></tui-input
        ></label>
        <span aria-hidden="true">&nbsp;│&nbsp;</span>
        <label
          >To&nbsp;<tui-input
            type="date"
            value=${this.endDate}
            @change=${(event) =>
              this.changeFilter("endDate", event.currentTarget.value)}
          ></tui-input
        ></label>
        <span aria-hidden="true">&nbsp;│&nbsp;</span>
        <tui-button ?disabled=${this.syncing} @click=${this.syncTrades}
          >${this.syncing ? "Syncing…" : "Sync from Broker"}</tui-button
        >
      </tui-flex>
    `;
  }

  renderTable() {
    const trades = this.trades.value?.trades ?? [];

    if (trades.length === 0) {
      return html`<div>No trades found</div>`;
    }

    return html`
      <div style="overflow: auto; min-width: 0">
        <table style="border-collapse: collapse; width: 100%">
          <thead>
            <tr>
              <th style="text-align: left">Date</th>
              <th style="text-align: left">│ Symbol</th>
              <th style="text-align: left">│ Side</th>
              <th style="text-align: left">│ Qty</th>
              <th style="text-align: left">│ Price</th>
              <th style="text-align: left">│ Value</th>
              <th style="text-align: left">│ Commission</th>
              <th style="text-align: left">│ Currency</th>
            </tr>
          </thead>
          <tbody>
            ${trades.map((trade) => {
              const raw = trade.raw_data ?? {};
              const quantity = Number(raw.q ?? trade.quantity ?? 0);
              const price = Number(raw.p ?? trade.price ?? 0);
              const value = Number(raw.v ?? quantity * price);
              const commission = Number(
                raw.commiss_exchange ?? trade.commission ?? 0,
              );
              const currency = raw.curr_c ?? trade.commission_currency ?? "-";

              return html`
                <tr>
                  <td style="text-align: left; vertical-align: top">
                    ${formatDateTime(trade.executed_at, { seconds: true })}
                  </td>
                  <td style="text-align: left; vertical-align: top">
                    │ ${trade.symbol}
                  </td>
                  <td style="text-align: left; vertical-align: top">
                    │
                    <tui-text
                      variant=${trade.side === "BUY" ? "success" : "error"}
                      >${trade.side}</tui-text
                    >
                  </td>
                  <td style="text-align: left; vertical-align: top">
                    │ ${formatNumber(quantity, 0)}
                  </td>
                  <td style="text-align: left; vertical-align: top">
                    │ ${formatNumber(price, 2)}
                  </td>
                  <td style="text-align: left; vertical-align: top">
                    │ ${formatNumber(value, 2)}
                  </td>
                  <td style="text-align: left; vertical-align: top">
                    │ ${formatNumber(commission, 2)}
                  </td>
                  <td style="text-align: left; vertical-align: top">
                    │ ${currency}
                  </td>
                </tr>
              `;
            })}
          </tbody>
        </table>
      </div>
    `;
  }

  renderPagination() {
    const total = this.trades.value?.total ?? this.trades.value?.count ?? 0;
    const pages = Math.max(1, Math.ceil(total / this.pageSize));

    if (pages === 1) {
      return "";
    }

    return html`
      <div>
        <tui-button
          ?disabled=${this.page <= 1}
          @click=${() => this.changePage(this.page - 1)}
          >Previous</tui-button
        >
        Page ${this.page} / ${pages}
        <tui-button
          ?disabled=${this.page >= pages}
          @click=${() => this.changePage(this.page + 1)}
          >Next</tui-button
        >
      </div>
    `;
  }

  render() {
    if (this.securities.loading && !this.securities.value) {
      return html`<div>Loading trade filters…</div>`;
    }

    return html`
      ${this.renderControls()}
      <div aria-hidden="true">&nbsp;</div>
      ${
        this.trades.loading && !this.trades.value
          ? html`<div>Loading trades…</div>`
          : this.trades.error
            ? html`<tui-text variant="error"
                >Error loading trades: ${this.trades.error.message}</tui-text
              >`
            : this.renderTable()
      }
      ${this.renderPagination()}
      ${
        this.actionError
          ? html`<tui-text variant="error">${this.actionError}</tui-text>`
          : ""
      }
    `;
  }
}

customElements.define("sentinel-trades", SentinelTrades);
