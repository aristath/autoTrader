/**
 * Settings Modal Component
 * Application settings in a modal dialog
 */
class SettingsModal extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div x-data x-show="$store.app.showSettingsModal"
           class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4"
           x-transition
           @click="$store.app.showSettingsModal = false">
        <div class="bg-gray-800 border border-gray-700 rounded-lg w-full max-w-sm" @click.stop>
          <div class="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 class="text-lg font-semibold text-gray-100">Settings</h2>
            <button @click="$store.app.showSettingsModal = false"
                    class="text-gray-400 hover:text-gray-200 text-2xl leading-none">&times;</button>
          </div>

          <div class="p-4 space-y-4">
            <!-- Min Trade Size -->
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-300">Min Trade Size</span>
              <div class="flex items-center gap-1">
                <span class="text-gray-400">€</span>
                <input type="number"
                       :value="$store.app.settings.min_trade_size"
                       @change="$store.app.updateMinTradeSize($event.target.value)"
                       class="w-24 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-right font-mono text-sm text-gray-200 focus:outline-none focus:border-blue-500">
              </div>
            </div>

            <!-- Cache Reset -->
            <div class="flex items-center justify-between pt-3 border-t border-gray-700">
              <span class="text-sm text-gray-300">Caches</span>
              <button @click="$store.app.resetCache()"
                      class="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition-colors">
                Reset
              </button>
            </div>

            <!-- Sync Historical -->
            <div class="flex items-center justify-between pt-3 border-t border-gray-700">
              <span class="text-sm text-gray-300">Historical Data</span>
              <button @click="$store.app.syncHistorical()"
                      :disabled="$store.app.loading.historical"
                      class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors disabled:opacity-50">
                <span x-show="$store.app.loading.historical" class="inline-block animate-spin mr-1">&#9696;</span>
                <span x-text="$store.app.loading.historical ? 'Syncing...' : 'Sync'"></span>
              </button>
            </div>

            <!-- System Restart -->
            <div class="flex items-center justify-between pt-3 border-t border-gray-700">
              <span class="text-sm text-gray-300">System</span>
              <button @click="if(confirm('Reboot the system?')) API.restartSystem()"
                      class="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors">
                Restart
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('settings-modal', SettingsModal);
