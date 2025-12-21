/**
 * Geographic Allocation Chart Component
 * Displays doughnut chart and allows editing geographic targets
 *
 * Uses Chart.js v4 properly:
 * - Chart.getChart() for instance management
 * - disconnectedCallback for cleanup
 * - No recursive init/update calls
 */
class GeoChart extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="card" x-data="geoChartComponent($el)">
        <div class="card__header">
          <h2 class="card__title">Geographic Allocation</h2>
          <button x-show="!$store.app.editingGeo"
                  @click="$store.app.startEditGeo()"
                  class="card__action">
            Edit Targets
          </button>
        </div>

        <div class="chart-container">
          <canvas width="200" height="200"></canvas>
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

  disconnectedCallback() {
    // Proper cleanup when component is removed from DOM
    const canvas = this.querySelector('canvas');
    if (canvas) {
      const chart = Chart.getChart(canvas);
      if (chart) {
        chart.destroy();
      }
    }
  }
}

/**
 * Alpine.js component for chart management
 * @param {HTMLElement} el - The component's root element
 */
function geoChartComponent(el) {
  return {
    canvas: null,

    init() {
      // Use $nextTick to ensure DOM is ready
      this.$nextTick(() => {
        // Find canvas within this component (not globally by ID)
        this.canvas = el.querySelector('canvas');
        if (!this.canvas) {
          console.warn('GeoChart: Canvas not found');
          return;
        }

        // Destroy any existing chart on this canvas (safety check)
        const existing = Chart.getChart(this.canvas);
        if (existing) {
          existing.destroy();
        }

        // Create chart once
        new Chart(this.canvas, {
          type: 'doughnut',
          data: {
            labels: ['EU', 'Asia', 'US'],
            datasets: [{
              data: [1, 1, 1],  // Initial placeholder data
              backgroundColor: ['#3B82F6', '#EF4444', '#22C55E'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: { display: false }
            },
            cutout: '60%',
            animation: {
              duration: 300
            }
          }
        });

        // Watch for data changes and update (never recreate)
        this.$watch('$store.app.allocation.geographic', (geo) => {
          this.updateChart(geo);
        });

        // Initial update with current data
        this.updateChart(this.$store.app.allocation.geographic);
      });
    },

    updateChart(geo) {
      // Safety checks
      if (!this.canvas) return;
      if (!this.canvas.isConnected) return;  // Canvas removed from DOM

      // Get chart from Chart.js registry (the official way)
      const chart = Chart.getChart(this.canvas);
      if (!chart) return;

      // Validate data
      if (!Array.isArray(geo) || geo.length === 0) return;

      // Extract values, ensure non-zero for valid pie chart
      const data = geo.map(g => {
        const val = g.current_value;
        return (typeof val === 'number' && !isNaN(val) && val > 0) ? val : 1;
      });

      // Ensure at least one non-zero value
      if (data.every(v => v <= 0)) {
        data[0] = 1;
      }

      // Update data and render without animation
      chart.data.datasets[0].data = data;
      chart.update('none');
    }
  };
}

customElements.define('geo-chart', GeoChart);
