/**
 * Quick Actions Component
 * Provides action buttons for rebalance, refresh scores, sync prices
 */
class QuickActions extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="card" x-data>
        <div class="card__header">
          <h2 class="card__title">Quick Actions</h2>
        </div>

        <div class="actions-list">
          <button @click="$store.app.showRebalanceModal = true; $store.app.previewRebalance()"
                  class="btn btn--primary btn--full"
                  :disabled="$store.app.loading.rebalance">
            <span x-show="$store.app.loading.rebalance" class="btn__spinner">&#9696;</span>
            Preview Rebalance
          </button>

          <button @click="$store.app.refreshScores()"
                  class="btn btn--purple btn--full"
                  :disabled="$store.app.loading.scores">
            <span x-show="$store.app.loading.scores" class="btn__spinner">&#9696;</span>
            Refresh All Scores
          </button>

          <button @click="$store.app.syncPrices()"
                  class="btn btn--secondary btn--full"
                  :disabled="$store.app.loading.sync">
            <span x-show="$store.app.loading.sync" class="btn__spinner">&#9696;</span>
            Sync Prices
          </button>
        </div>

        <div x-show="$store.app.message"
             x-text="$store.app.message"
             class="message"
             :class="$store.app.messageType === 'success' ? 'message--success' : 'message--error'">
        </div>
      </div>
    `;
  }
}

customElements.define('quick-actions', QuickActions);
