/**
 * Add Stock Modal Component
 * Form for adding new stocks to the universe
 */
class AddStockModal extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div x-data x-show="$store.app.showAddStockModal"
           class="modal-overlay"
           x-transition>
        <div class="modal modal--sm">
          <div class="modal__header">
            <h2 class="modal__title">Add Stock to Universe</h2>
            <button @click="$store.app.showAddStockModal = false; $store.app.resetNewStock()"
                    class="modal__close">&times;</button>
          </div>

          <div class="modal__body">
            <div class="form-group">
              <label class="label">Symbol *</label>
              <input type="text"
                     x-model="$store.app.newStock.symbol"
                     placeholder="e.g., AAPL, MSFT.US"
                     class="input">
            </div>

            <div class="form-group">
              <label class="label">Name *</label>
              <input type="text"
                     x-model="$store.app.newStock.name"
                     placeholder="e.g., Apple Inc."
                     class="input">
            </div>

            <div class="form-group">
              <label class="label">Region *</label>
              <input type="text"
                     x-model="$store.app.newStock.geography"
                     list="geographies-list"
                     placeholder="e.g., EU, US, ASIA"
                     class="input">
              <datalist id="geographies-list">
                <template x-for="geo in $store.app.geographies" :key="geo">
                  <option :value="geo"></option>
                </template>
              </datalist>
            </div>

            <div class="form-group">
              <label class="label">Industry (optional)</label>
              <input type="text"
                     x-model="$store.app.newStock.industry"
                     list="industries-list"
                     placeholder="Auto-detected from Yahoo Finance"
                     class="input">
              <datalist id="industries-list">
                <template x-for="ind in $store.app.industries" :key="ind">
                  <option :value="ind"></option>
                </template>
              </datalist>
            </div>
          </div>

          <div class="modal__footer">
            <button @click="$store.app.showAddStockModal = false; $store.app.resetNewStock()"
                    class="btn btn--secondary">
              Cancel
            </button>
            <button @click="$store.app.addStock()"
                    :disabled="$store.app.addingStock || !$store.app.newStock.symbol || !$store.app.newStock.name"
                    class="btn btn--success">
              <span x-show="$store.app.addingStock" class="btn__spinner">&#9696;</span>
              Add Stock
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('add-stock-modal', AddStockModal);
