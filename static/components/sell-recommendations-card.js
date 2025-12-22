/**
 * Sell Recommendations Card Component
 * Shows top 3 sell recommendations with execute buttons
 */
class SellRecommendationsCard extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="bg-gray-800 border border-gray-700 rounded p-3" x-data>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xs text-gray-400 uppercase tracking-wide">Sell Candidates</h2>
          <button @click="$store.app.fetchSellRecommendations()"
                  class="p-1 text-gray-400 hover:text-gray-200 rounded hover:bg-gray-700 transition-colors"
                  :disabled="$store.app.loading.sellRecommendations"
                  title="Refresh sell recommendations">
            <span x-show="$store.app.loading.sellRecommendations" class="inline-block animate-spin">&#9696;</span>
            <span x-show="!$store.app.loading.sellRecommendations">&#8635;</span>
          </button>
        </div>

        <!-- Loading state -->
        <template x-if="$store.app.loading.sellRecommendations && $store.app.sellRecommendations.length === 0">
          <div class="text-gray-500 text-sm py-4 text-center">Loading sell recommendations...</div>
        </template>

        <!-- Empty state -->
        <template x-if="!$store.app.loading.sellRecommendations && $store.app.sellRecommendations.length === 0">
          <div class="text-gray-500 text-sm py-4 text-center">No sell candidates</div>
        </template>

        <!-- Sell recommendations list -->
        <div class="space-y-2">
          <template x-for="(rec, index) in ($store.app.sellRecommendations || [])" :key="rec.symbol">
            <div class="bg-gray-900 rounded p-2 border border-red-900/50">
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-mono bg-red-900/50 text-red-300 px-1.5 py-0.5 rounded">SELL</span>
                    <span class="font-mono text-red-400 font-bold" x-text="rec.symbol"></span>
                  </div>
                  <div class="text-sm text-gray-300 truncate mt-0.5" x-text="rec.name"></div>
                  <div class="text-xs text-gray-500 mt-1" x-text="rec.reason"></div>
                </div>
                <div class="text-right flex-shrink-0">
                  <div class="text-sm font-mono font-bold text-red-400" x-text="'-€' + rec.estimated_value.toLocaleString()"></div>
                  <div class="text-xs text-gray-400" x-text="rec.quantity + ' @ €' + rec.estimated_price"></div>
                </div>
              </div>
              <button @click="$store.app.executeSellRecommendation(rec.symbol)"
                      class="w-full mt-2 px-2 py-1.5 text-xs rounded transition-colors bg-red-700 hover:bg-red-600 text-white"
                      :disabled="$store.app.loading.execute">
                <span x-show="$store.app.executingSellSymbol === rec.symbol" class="inline-block animate-spin mr-1">&#9696;</span>
                <span>Execute Sell</span>
              </button>
            </div>
          </template>
        </div>
      </div>
    `;
  }
}

customElements.define('sell-recommendations-card', SellRecommendationsCard);
