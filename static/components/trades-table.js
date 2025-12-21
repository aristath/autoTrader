/**
 * Trades Table Component
 * Displays recent trades
 */
class TradesTable extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="card" x-data>
        <div class="card__header">
          <h2 class="card__title">Recent Trades</h2>
        </div>

        <div x-show="$store.app.trades.length === 0" class="empty-state">
          No trades yet
        </div>

        <div x-show="$store.app.trades.length > 0" class="overflow-x">
          <table class="table">
            <thead class="table__head">
              <tr>
                <th>Date</th>
                <th>Symbol</th>
                <th>Name</th>
                <th>Side</th>
                <th class="table__col--right">Quantity</th>
                <th class="table__col--right">Price</th>
                <th class="table__col--right">Value</th>
              </tr>
            </thead>
            <tbody class="table__body">
              <template x-for="trade in $store.app.trades" :key="trade.id">
                <tr>
                  <td x-text="formatDateTime(trade.executed_at)"></td>
                  <td class="table__col--mono" x-text="trade.symbol"></td>
                  <td class="table__col--muted" x-text="trade.name"></td>
                  <td>
                    <span class="tag" :class="getSideTagClass(trade.side)" x-text="trade.side"></span>
                  </td>
                  <td class="table__col--right" x-text="trade.quantity"></td>
                  <td class="table__col--right" x-text="formatCurrency(trade.price)"></td>
                  <td class="table__col--right" style="font-weight: 600" x-text="formatCurrency(trade.quantity * trade.price)"></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

customElements.define('trades-table', TradesTable);
