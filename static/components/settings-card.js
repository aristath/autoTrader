/**
 * Settings Card Component
 * Allows inline editing of app settings
 */
class SettingsCard extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="bg-gray-800 border border-gray-700 rounded p-3" x-data>
        <h2 class="text-xs text-gray-400 uppercase tracking-wide mb-3">Settings</h2>
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
      </div>
    `;
  }
}

customElements.define('settings-card', SettingsCard);
