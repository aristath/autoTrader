/**
 * App Header Component
 * Displays the application title and Tradernet connection status
 */
class AppHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header class="header" x-data>
        <div class="header__brand">
          <h1 class="header__title">Arduino Trader</h1>
          <p class="header__subtitle">Automated Portfolio Management</p>
        </div>
        <div>
          <span class="status-badge"
                :class="$store.app.tradernet.connected ? 'status-badge--success' : 'status-badge--danger'">
            <span class="status-badge__dot"></span>
            <span x-text="$store.app.tradernet.connected ? 'Tradernet Connected' : 'Tradernet Offline'"></span>
          </span>
        </div>
      </header>
    `;
  }
}

customElements.define('app-header', AppHeader);
