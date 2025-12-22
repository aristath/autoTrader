/**
 * Rebalance Modal Component
 * Shows rebalance preview and allows execution
 */
class RebalanceModal extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div x-data x-show="$store.app.showRebalanceModal"
           class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4"
           x-transition>
        <div class="bg-gray-800 border border-gray-700 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col" @click.stop>
          <div class="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 class="text-lg font-semibold text-gray-100">Rebalance Preview</h2>
            <button @click="$store.app.showRebalanceModal = false"
                    class="text-gray-400 hover:text-gray-200 text-2xl leading-none">&times;</button>
          </div>

          <div class="p-4 overflow-y-auto flex-1">
            <!-- Loading State -->
            <div x-show="$store.app.loading.rebalance" class="flex flex-col items-center justify-center py-8">
              <div class="text-3xl animate-spin mb-3">&#9696;</div>
              <p class="text-gray-400">Calculating optimal trades...</p>
            </div>

            <!-- Preview Content -->
            <div x-show="!$store.app.loading.rebalance && $store.app.rebalancePreview">
              <div class="grid grid-cols-3 gap-4 mb-4">
                <div class="bg-gray-900 rounded p-3 text-center">
                  <p class="text-xs text-gray-500 uppercase mb-1">Deposit</p>
                  <p class="text-lg font-mono font-bold text-blue-400"
                     x-text="formatCurrency($store.app.rebalancePreview?.deposit_amount)"></p>
                </div>
                <div class="bg-gray-900 rounded p-3 text-center">
                  <p class="text-xs text-gray-500 uppercase mb-1">Trades</p>
                  <p class="text-lg font-mono font-bold text-gray-100"
                     x-text="$store.app.rebalancePreview?.total_trades"></p>
                </div>
                <div class="bg-gray-900 rounded p-3 text-center">
                  <p class="text-xs text-gray-500 uppercase mb-1">Total Value</p>
                  <p class="text-lg font-mono font-bold text-green-400"
                     x-text="formatCurrency($store.app.rebalancePreview?.total_value)"></p>
                </div>
              </div>

              <!-- No Trades -->
              <div x-show="$store.app.rebalancePreview?.trades?.length === 0"
                   class="text-center py-8 text-gray-500">
                No trades recommended. Portfolio is well balanced.
              </div>

              <!-- Trades Table -->
              <div x-show="$store.app.rebalancePreview?.trades?.length > 0">
                <hr class="border-gray-700 my-4">
                <div class="overflow-x-auto">
                  <table class="w-full text-xs">
                    <thead class="text-gray-500 uppercase text-left border-b border-gray-700">
                      <tr>
                        <th class="py-2 px-2">Symbol</th>
                        <th class="py-2 px-2">Name</th>
                        <th class="py-2 px-2 text-right">Qty</th>
                        <th class="py-2 px-2 text-right">Price</th>
                        <th class="py-2 px-2 text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-800">
                      <template x-for="trade in $store.app.rebalancePreview?.trades" :key="trade.symbol">
                        <tr class="hover:bg-gray-800/50">
                          <td class="py-2 px-2 font-mono text-blue-400" x-text="trade.symbol"></td>
                          <td class="py-2 px-2">
                            <span class="text-gray-300" x-text="trade.name"></span>
                            <p class="text-xs text-gray-500 mt-0.5" x-text="trade.reason"></p>
                          </td>
                          <td class="py-2 px-2 text-right font-mono text-green-400" x-text="'+' + trade.quantity"></td>
                          <td class="py-2 px-2 text-right font-mono text-gray-400" x-text="formatCurrency(trade.estimated_price)"></td>
                          <td class="py-2 px-2 text-right font-mono font-semibold text-gray-200" x-text="formatCurrency(trade.estimated_value)"></td>
                        </tr>
                      </template>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div x-show="$store.app.rebalancePreview?.trades?.length > 0"
               class="flex justify-end gap-2 p-4 border-t border-gray-700">
            <button @click="$store.app.showRebalanceModal = false"
                    class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded transition-colors">
              Cancel
            </button>
            <button @click="$store.app.executeRebalance()"
                    :disabled="$store.app.loading.execute"
                    class="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm rounded transition-colors disabled:opacity-50">
              <span x-show="$store.app.loading.execute" class="inline-block animate-spin mr-1">&#9696;</span>
              Execute Trades
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('rebalance-modal', RebalanceModal);
