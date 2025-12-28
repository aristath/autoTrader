/**
 * Country Radar Card Component
 * Card wrapper for country allocation radar chart
 */
class CountryRadarCard extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="bg-gray-800 border border-gray-700 rounded p-3" x-data>
        <h2 class="text-xs text-gray-400 uppercase tracking-wide mb-3">Country Allocation</h2>
        <allocation-radar type="country"></allocation-radar>
      </div>
    `;
  }
}

customElements.define('country-radar-card', CountryRadarCard);
