/**
 * Summary Cards Component
 * Displays portfolio summary statistics
 */
class SummaryCards extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="layout__row layout__row--4col" x-data>
        <div class="stat-card stat-card--success">
          <p class="stat-card__label">Total Value</p>
          <p class="stat-card__value" x-text="formatCurrency($store.app.allocation.total_value)"></p>
        </div>
        <div class="stat-card">
          <p class="stat-card__label">Cash Balance</p>
          <p class="stat-card__value" x-text="formatCurrency($store.app.allocation.cash_balance)"></p>
        </div>
        <div class="stat-card">
          <p class="stat-card__label">Active Positions</p>
          <p class="stat-card__value" x-text="$store.app.status.active_positions || 0"></p>
        </div>
        <div class="stat-card">
          <p class="stat-card__label">Rebalance Status</p>
          <p class="stat-card__value"
             :class="$store.app.status.rebalance_ready ? 'stat-card--success' : ''"
             x-text="$store.app.status.rebalance_ready ? 'Ready' : 'Cash < ' + formatCurrency($store.app.status.min_cash_threshold || 400)"></p>
        </div>
      </div>
    `;
  }
}

customElements.define('summary-cards', SummaryCards);
