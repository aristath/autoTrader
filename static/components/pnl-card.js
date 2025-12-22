/**
 * P&L Card Component
 * Displays total portfolio profit/loss
 */
class PnlCard extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="bg-gray-800 border border-gray-700 rounded p-3" x-data="{ editingDeposits: false, depositAmount: '' }">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xs text-gray-400 uppercase tracking-wide">Total Gains/Losses</h2>
          <button @click="$store.app.fetchPnl()"
                  class="p-1 text-gray-400 hover:text-gray-200 rounded hover:bg-gray-700 transition-colors"
                  :disabled="$store.app.pnl.loading"
                  title="Refresh P&L">
            <span x-show="$store.app.pnl.loading" class="inline-block animate-spin">&#9696;</span>
            <span x-show="!$store.app.pnl.loading">&#8635;</span>
          </button>
        </div>

        <!-- Loading state -->
        <template x-if="$store.app.pnl.loading && $store.app.pnl.pnl === null">
          <div class="text-gray-500 text-sm">Loading...</div>
        </template>

        <!-- Error state -->
        <template x-if="$store.app.pnl.error && !$store.app.pnl.loading">
          <div class="text-red-400 text-sm" x-text="$store.app.pnl.error"></div>
        </template>

        <!-- Deposits not set - show setup form -->
        <template x-if="!$store.app.pnl.deposits_set && !$store.app.pnl.error && !$store.app.pnl.loading">
          <div>
            <div x-show="!editingDeposits">
              <p class="text-sm text-gray-400 mb-2">Set your total deposits to calculate P&L</p>
              <button @click="editingDeposits = true; depositAmount = ''"
                      class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors">
                Set Deposits
              </button>
            </div>
            <div x-show="editingDeposits" class="space-y-2">
              <input type="number"
                     x-model="depositAmount"
                     placeholder="Total deposits in EUR"
                     class="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
                     @keyup.enter="$store.app.setManualDeposits(depositAmount); editingDeposits = false">
              <div class="flex gap-2">
                <button @click="editingDeposits = false"
                        class="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition-colors">
                  Cancel
                </button>
                <button @click="$store.app.setManualDeposits(depositAmount); editingDeposits = false"
                        class="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors">
                  Save
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- P&L Value -->
        <template x-if="$store.app.pnl.deposits_set && $store.app.pnl.pnl !== null && !$store.app.pnl.error">
          <div class="text-center">
            <div class="text-2xl font-mono font-bold"
                 :class="$store.app.pnl.pnl >= 0 ? 'text-green-400' : 'text-red-400'">
              <span x-text="$store.app.pnl.pnl >= 0 ? '+' : ''"></span>
              <span x-text="'€' + $store.app.pnl.pnl.toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2})"></span>
            </div>
            <div class="text-sm font-mono"
                 :class="$store.app.pnl.pnl_pct >= 0 ? 'text-green-500' : 'text-red-500'">
              (<span x-text="$store.app.pnl.pnl_pct >= 0 ? '+' : ''"></span><span x-text="$store.app.pnl.pnl_pct.toFixed(2)"></span>%)
            </div>
            <div class="flex justify-center gap-4 mt-2 text-xs text-gray-400">
              <span>
                Value: <span class="text-gray-300" x-text="'€' + ($store.app.pnl.total_value || 0).toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2})"></span>
              </span>
              <span>
                Invested: <span class="text-gray-300" x-text="'€' + ($store.app.pnl.net_deposits || 0).toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2})"></span>
              </span>
            </div>
            <button @click="editingDeposits = true; depositAmount = $store.app.pnl.manual_deposits"
                    class="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors">
              Edit deposits
            </button>
            <div x-show="editingDeposits" class="mt-2 space-y-2">
              <input type="number"
                     x-model="depositAmount"
                     placeholder="Total deposits in EUR"
                     class="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
                     @keyup.enter="$store.app.setManualDeposits(depositAmount); editingDeposits = false">
              <div class="flex justify-center gap-2">
                <button @click="editingDeposits = false"
                        class="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition-colors">
                  Cancel
                </button>
                <button @click="$store.app.setManualDeposits(depositAmount); editingDeposits = false"
                        class="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors">
                  Save
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
    `;
  }
}

customElements.define('pnl-card', PnlCard);
