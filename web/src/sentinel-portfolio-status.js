import { LitElement, html } from "lit";
import { getJson } from "./api.js";
import { formatCurrency } from "./format.js";
import { LiveResource } from "./live-resource.js";

class SentinelPortfolioStatus extends LitElement {
  portfolio = new LiveResource(
    this,
    (signal) => getJson("/api/portfolio", { signal }),
    { interval: 60_000 },
  );

  cashFlows = new LiveResource(
    this,
    (signal) => getJson("/api/cashflows", { signal }),
    { interval: 300_000 },
  );

  createRenderRoot() {
    return this;
  }

  renderCashBreakdown(cash) {
    const balances = Object.entries(cash ?? {}).filter(
      ([, amount]) => amount !== 0,
    );

    if (balances.length === 0) {
      return "";
    }

    return html`&nbsp;(${balances.map(
      ([currency, amount], index) =>
        html`${index > 0 ? ", " : ""}${currency}&nbsp;${formatCurrency(amount, currency)}`,
    )})`;
  }

  renderPortfolio() {
    const portfolio = this.portfolio.value;

    return html`
      <tui-flex wrap>
        <span
          >Value&nbsp;<strong
            >${formatCurrency(portfolio.total_value_eur)}</strong
          ></span
        >
        <span aria-hidden="true">&nbsp;&nbsp;│&nbsp;&nbsp;</span>
        <span
          >Cash&nbsp;<strong>${formatCurrency(portfolio.total_cash_eur)}</strong>${this.renderCashBreakdown(
            portfolio.cash,
          )}</span
        >
      </tui-flex>
    `;
  }

  renderCashFlows() {
    const cashFlows = this.cashFlows.value;

    if (!cashFlows) {
      return "";
    }

    const totalFees = cashFlows.fees + cashFlows.taxes;
    const profitVariant = cashFlows.total_profit >= 0 ? "success" : "error";

    return html`
      <tui-flex wrap>
        <span
          >Deposits&nbsp;<tui-text variant="success"
            >${formatCurrency(cashFlows.deposits)}</tui-text
          ></span
        >
        <span aria-hidden="true">&nbsp;&nbsp;│&nbsp;&nbsp;</span>
        <span
          >Withdrawals&nbsp;<tui-text variant="error"
            >${formatCurrency(cashFlows.withdrawals)}</tui-text
          ></span
        >
        <span aria-hidden="true">&nbsp;&nbsp;│&nbsp;&nbsp;</span>
        <span
          >Dividends&nbsp;<tui-text variant="success"
            >${formatCurrency(cashFlows.dividends)}</tui-text
          ></span
        >
        <span aria-hidden="true">&nbsp;&nbsp;│&nbsp;&nbsp;</span>
        <span
          >Fees&nbsp;<tui-text variant="error"
            >${formatCurrency(totalFees)}</tui-text
          ></span
        >
        <span aria-hidden="true">&nbsp;&nbsp;—&nbsp;&nbsp;</span>
        <span
          >Total Profit&nbsp;<tui-text variant=${profitVariant}
            >${formatCurrency(cashFlows.total_profit)}</tui-text
          ></span
        >
      </tui-flex>
    `;
  }

  render() {
    let content;

    if (this.portfolio.loading && !this.portfolio.value) {
      content = html`<span>Loading portfolio…</span>`;
    } else if (this.portfolio.error) {
      content = html`<tui-text variant="error"
        >Portfolio unavailable</tui-text
      >`;
    } else {
      content = this.renderPortfolio();
    }

    return html`<section aria-label="Portfolio status">
      ${content}${this.renderCashFlows()}
    </section>`;
  }
}

customElements.define("sentinel-portfolio-status", SentinelPortfolioStatus);
