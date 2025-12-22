/**
 * App Header Component
 * Displays the application title and Tradernet connection status
 */
class AppHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header class="flex items-center justify-between py-3 border-b border-gray-800" x-data>
        <div>
          <h1 class="text-xl font-bold text-blue-400">Arduino Trader</h1>
          <p class="text-xs text-gray-500">Automated Portfolio Management</p>
        </div>
        <div class="flex items-center gap-1.5"
             :class="$store.app.tradernet.connected ? 'text-green-400' : 'text-red-400'">
          <span class="w-2 h-2 rounded-full"
                :class="$store.app.tradernet.connected ? 'bg-green-500' : 'bg-red-500'"></span>
          <span class="text-xs" x-text="$store.app.tradernet.connected ? 'Tradernet Connected' : 'Tradernet Offline'"></span>
        </div>
      </header>
    `;
  }
}

customElements.define('app-header', AppHeader);
