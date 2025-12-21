/**
 * Status Bar Component
 * Displays system status, last sync time, and next rebalance
 */
class StatusBar extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="status-bar" x-data>
        <div class="status-bar__left">
          <span class="status-bar__item">
            <span class="status-bar__dot"
                  :class="$store.app.status.status === 'healthy' ? 'status-bar__dot--success' : 'status-bar__dot--danger'"></span>
            <span x-text="$store.app.status.status === 'healthy' ? 'System Online' : 'System Offline'"></span>
          </span>
          <span class="status-bar__divider">|</span>
          <span class="status-bar__label">
            Last sync: <span x-text="$store.app.status.last_sync || 'Never'"></span>
          </span>
        </div>
        <div class="status-bar__label">
          Next rebalance: <span x-text="formatDate($store.app.status.next_rebalance)"></span>
        </div>
      </div>
    `;
  }
}

customElements.define('status-bar', StatusBar);
