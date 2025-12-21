/**
 * Geographic Allocation Chart Component
 * Displays SVG doughnut chart and allows editing geographic targets
 * No external dependencies - pure SVG with Alpine.js reactivity
 */
class GeoChart extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="card" x-data="geoChartComponent()">
        <div class="card__header">
          <h2 class="card__title">Geographic Allocation</h2>
          <button x-show="!$store.app.editingGeo"
                  @click="$store.app.startEditGeo()"
                  class="card__action">
            Edit Targets
          </button>
        </div>

        <div class="chart-container">
          <svg viewBox="0 0 100 100" class="doughnut-chart">
            <!-- Background circle -->
            <circle cx="50" cy="50" r="40" fill="none" stroke="#374151" stroke-width="16"/>

            <!-- EU segment (blue) -->
            <circle cx="50" cy="50" r="40" fill="none"
                    stroke="#3B82F6" stroke-width="16"
                    :stroke-dasharray="circumference"
                    :stroke-dashoffset="getOffset(0)"
                    :transform="'rotate(' + getRotation(0) + ' 50 50)'"
                    class="doughnut-chart__segment"/>

            <!-- ASIA segment (red) -->
            <circle cx="50" cy="50" r="40" fill="none"
                    stroke="#EF4444" stroke-width="16"
                    :stroke-dasharray="circumference"
                    :stroke-dashoffset="getOffset(1)"
                    :transform="'rotate(' + getRotation(1) + ' 50 50)'"
                    class="doughnut-chart__segment"/>

            <!-- US segment (green) -->
            <circle cx="50" cy="50" r="40" fill="none"
                    stroke="#22C55E" stroke-width="16"
                    :stroke-dasharray="circumference"
                    :stroke-dashoffset="getOffset(2)"
                    :transform="'rotate(' + getRotation(2) + ' 50 50)'"
                    class="doughnut-chart__segment"/>
          </svg>
        </div>

        <!-- View Mode -->
        <div x-show="!$store.app.editingGeo" class="allocation-list">
          <template x-for="geo in $store.app.allocation.geographic" :key="geo.name">
            <div class="allocation-item">
              <span class="allocation-item__label">
                <span class="allocation-item__dot"
                      :class="'allocation-item__dot--' + geo.name.toLowerCase()"></span>
                <span x-text="geo.name"></span>
              </span>
              <span class="allocation-item__value"
                    :class="'allocation-item__value--' + getDeviationClass(geo.deviation)">
                <span x-text="(geo.current_pct * 100).toFixed(1)"></span>% /
                <span x-text="(geo.target_pct * 100).toFixed(0)"></span>%
              </span>
            </div>
          </template>
        </div>

        <!-- Edit Mode -->
        <div x-show="$store.app.editingGeo" x-transition class="edit-mode">
          <!-- EU Slider -->
          <div class="slider-control">
            <div class="slider-control__header">
              <span class="allocation-item__label">
                <span class="allocation-item__dot allocation-item__dot--eu"></span>
                EU
              </span>
              <span class="slider-control__value slider-control__value--eu"
                    x-text="$store.app.geoTargets.EU + '%'"></span>
            </div>
            <input type="range" min="0" max="100"
                   :value="$store.app.geoTargets.EU"
                   @input="$store.app.adjustGeoSlider('EU', parseInt($event.target.value))"
                   class="slider">
          </div>

          <!-- ASIA Slider -->
          <div class="slider-control">
            <div class="slider-control__header">
              <span class="allocation-item__label">
                <span class="allocation-item__dot allocation-item__dot--asia"></span>
                ASIA
              </span>
              <span class="slider-control__value slider-control__value--asia"
                    x-text="$store.app.geoTargets.ASIA + '%'"></span>
            </div>
            <input type="range" min="0" max="100"
                   :value="$store.app.geoTargets.ASIA"
                   @input="$store.app.adjustGeoSlider('ASIA', parseInt($event.target.value))"
                   class="slider">
          </div>

          <!-- US Slider -->
          <div class="slider-control">
            <div class="slider-control__header">
              <span class="allocation-item__label">
                <span class="allocation-item__dot allocation-item__dot--us"></span>
                US
              </span>
              <span class="slider-control__value slider-control__value--us"
                    x-text="$store.app.geoTargets.US + '%'"></span>
            </div>
            <input type="range" min="0" max="100"
                   :value="$store.app.geoTargets.US"
                   @input="$store.app.adjustGeoSlider('US', parseInt($event.target.value))"
                   class="slider">
          </div>

          <!-- Total -->
          <div class="total-row">
            <span class="total-row__label">Total</span>
            <span class="total-row__value"
                  :class="$store.app.geoTotal === 100 ? 'total-row__value--valid' : 'total-row__value--invalid'"
                  x-text="$store.app.geoTotal + '%'"></span>
          </div>

          <!-- Buttons -->
          <div class="button-row">
            <button @click="$store.app.cancelEditGeo()" class="btn btn--secondary">
              Cancel
            </button>
            <button @click="$store.app.saveGeoTargets()"
                    :disabled="$store.app.geoTotal !== 100 || $store.app.loading.geoSave"
                    class="btn btn--primary">
              <span x-show="$store.app.loading.geoSave" class="btn__spinner">&#9696;</span>
              Save
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

/**
 * Alpine.js component for SVG doughnut chart
 */
function geoChartComponent() {
  return {
    // Circumference of circle with radius 40
    circumference: 2 * Math.PI * 40,

    /**
     * Get the stroke-dashoffset for a segment
     * @param {number} index - Segment index (0=EU, 1=ASIA, 2=US)
     */
    getOffset(index) {
      const geo = this.$store.app.allocation.geographic;
      if (!geo || !geo[index]) {
        return this.circumference; // Full offset = invisible
      }
      const pct = geo[index].current_pct || 0;
      return this.circumference * (1 - pct);
    },

    /**
     * Get the rotation for a segment (cumulative of previous segments)
     * @param {number} index - Segment index
     */
    getRotation(index) {
      const geo = this.$store.app.allocation.geographic;
      if (!geo) return -90;

      let cumulative = 0;
      for (let i = 0; i < index; i++) {
        cumulative += (geo[i]?.current_pct || 0);
      }
      // Start at top (-90 degrees) + cumulative percentage * 360
      return -90 + (cumulative * 360);
    }
  };
}

customElements.define('geo-chart', GeoChart);
