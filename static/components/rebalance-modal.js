/**
 * Rebalance Modal Component
 * Shows rebalance preview and allows execution
 */
class RebalanceModal extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div x-data x-show="$store.app.showRebalanceModal"
           class="modal-overlay"
           x-transition>
        <div class="modal">
          <div class="modal__header">
            <h2 class="modal__title">Rebalance Preview</h2>
            <button @click="$store.app.showRebalanceModal = false" class="modal__close">&times;</button>
          </div>

          <div class="modal__body">
            <!-- Loading State -->
            <div x-show="$store.app.loading.rebalance" class="loading">
              <div class="loading__spinner">&#9696;</div>
              <p class="loading__text">Calculating optimal trades...</p>
            </div>

            <!-- Preview Content -->
            <div x-show="!$store.app.loading.rebalance && $store.app.rebalancePreview">
              <div class="summary-stats">
                <div class="summary-stats__item">
                  <span class="summary-stats__label">Deposit</span>
                  <span class="summary-stats__value summary-stats__value--primary"
                        x-text="formatCurrency($store.app.rebalancePreview?.deposit_amount)"></span>
                </div>
                <div class="summary-stats__item">
                  <span class="summary-stats__label">Trades</span>
                  <span class="summary-stats__value"
                        x-text="$store.app.rebalancePreview?.total_trades"></span>
                </div>
                <div class="summary-stats__item">
                  <span class="summary-stats__label">Total Value</span>
                  <span class="summary-stats__value summary-stats__value--success"
                        x-text="formatCurrency($store.app.rebalancePreview?.total_value)"></span>
                </div>
              </div>

              <!-- No Trades -->
              <div x-show="$store.app.rebalancePreview?.trades?.length === 0" class="empty-state">
                No trades recommended. Portfolio is well balanced.
              </div>

              <!-- Trades Table -->
              <div x-show="$store.app.rebalancePreview?.trades?.length > 0">
                <hr class="divider">
                <div class="overflow-x">
                  <table class="table">
                    <thead class="table__head">
                      <tr>
                        <th>Symbol</th>
                        <th>Name</th>
                        <th class="table__col--right">Qty</th>
                        <th class="table__col--right">Price</th>
                        <th class="table__col--right">Value</th>
                      </tr>
                    </thead>
                    <tbody class="table__body">
                      <template x-for="trade in $store.app.rebalancePreview?.trades" :key="trade.symbol">
                        <tr>
                          <td class="table__col--mono" x-text="trade.symbol"></td>
                          <td>
                            <span x-text="trade.name"></span>
                            <p class="table__col--muted" style="font-size: 0.75rem; margin: 0"
                               x-text="trade.reason"></p>
                          </td>
                          <td class="table__col--right" style="color: var(--color-success)"
                              x-text="'+' + trade.quantity"></td>
                          <td class="table__col--right" x-text="formatCurrency(trade.estimated_price)"></td>
                          <td class="table__col--right" style="font-weight: 600"
                              x-text="formatCurrency(trade.estimated_value)"></td>
                        </tr>
                      </template>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div x-show="$store.app.rebalancePreview?.trades?.length > 0" class="modal__footer">
            <button @click="$store.app.showRebalanceModal = false" class="btn btn--secondary">
              Cancel
            </button>
            <button @click="$store.app.executeRebalance()"
                    :disabled="$store.app.loading.execute"
                    class="btn btn--success">
              <span x-show="$store.app.loading.execute" class="btn__spinner">&#9696;</span>
              Execute Trades
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('rebalance-modal', RebalanceModal);
