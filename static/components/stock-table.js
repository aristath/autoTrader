/**
 * Stock Table Component
 * Displays the stock universe with filtering and sorting
 */
class StockTable extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="card" x-data>
        <div class="card__header">
          <h2 class="card__title">Stock Universe</h2>
          <div class="filter-bar">
            <select x-model="$store.app.stockFilter" class="select">
              <option value="all">All Regions</option>
              <option value="EU">EU</option>
              <option value="ASIA">Asia</option>
              <option value="US">US</option>
            </select>
            <button @click="$store.app.showAddStockModal = true"
                    class="btn btn--success btn--sm">
              + Add Stock
            </button>
          </div>
        </div>

        <div class="overflow-x">
          <table class="table">
            <thead class="table__head">
              <tr>
                <th @click="$store.app.sortStocks('symbol')" class="table__col--sortable">Symbol</th>
                <th>Name</th>
                <th>Industry</th>
                <th>Region</th>
                <th @click="$store.app.sortStocks('total_score')" class="table__col--right table__col--sortable">Score</th>
                <th class="table__col--right">Tech</th>
                <th class="table__col--right">Analyst</th>
                <th class="table__col--right">Fund</th>
                <th class="table__col--center">Actions</th>
              </tr>
            </thead>
            <tbody class="table__body">
              <template x-for="stock in $store.app.filteredStocks" :key="stock.symbol">
                <tr>
                  <td class="table__col--mono" x-text="stock.symbol"></td>
                  <td x-text="stock.name"></td>
                  <td class="table__col--muted" x-text="stock.industry"></td>
                  <td>
                    <span class="tag" :class="getGeoTagClass(stock.geography)" x-text="stock.geography"></span>
                  </td>
                  <td class="table__col--right">
                    <span class="score" :class="getScoreClass(stock.total_score)"
                          x-text="formatScore(stock.total_score)"></span>
                  </td>
                  <td class="table__col--right table__col--muted" x-text="formatScore(stock.technical_score)"></td>
                  <td class="table__col--right table__col--muted" x-text="formatScore(stock.analyst_score)"></td>
                  <td class="table__col--right table__col--muted" x-text="formatScore(stock.fundamental_score)"></td>
                  <td class="table__col--center">
                    <div class="table-actions">
                      <button @click="$store.app.refreshSingleScore(stock.symbol)"
                              class="action-link action-link--primary">
                        Refresh
                      </button>
                      <button @click="$store.app.removeStock(stock.symbol)"
                              class="action-link action-link--danger">
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

customElements.define('stock-table', StockTable);
