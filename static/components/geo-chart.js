/**
 * Geographic Allocation Chart Component
 * Displays pie chart and allows editing geographic targets
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
          <canvas id="geoChart" width="200" height="200"></canvas>
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

// Alpine component for chart management
function geoChartComponent() {
  return {
    chart: null,
    chartUpdating: false,

    init() {
      this.destroyChart();
      setTimeout(() => {
        this.initChart();
        this.$watch('$store.app.allocation.geographic', () => this.updateChart());
      }, 100);
    },

    destroyChart() {
      if (this.chart && typeof this.chart.destroy === 'function') {
        try {
          this.chart.destroy();
        } catch (e) {
          console.error('Error destroying chart:', e);
        }
      }
      this.chart = null;
    },

    initChart() {
      this.destroyChart();

      const canvas = document.getElementById('geoChart');
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      try {
        this.chart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['EU', 'Asia', 'US'],
            datasets: [{
              data: [1, 1, 1],
              backgroundColor: ['#3B82F6', '#EF4444', '#22C55E'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            cutout: '60%'
          }
        });
        this.updateChart();
      } catch (e) {
        console.error('Chart init error:', e);
        this.chart = null;
      }
    },

    updateChart() {
      if (this.chartUpdating) return;

      const geo = this.$store.app.allocation.geographic;
      if (!Array.isArray(geo) || geo.length === 0) return;

      this.chartUpdating = true;

      try {
        if (!this.chart) {
          this.initChart();
          this.chartUpdating = false;
          return;
        }

        const data = geo.map(g => {
          const value = g.current_value;
          return (typeof value === 'number' && !isNaN(value) && value >= 0) ? value : 1;
        });

        if (data.every(v => v === 0)) data[0] = 1;

        if (this.chart?.data?.datasets?.[0]) {
          this.chart.data.datasets[0].data = data;
          this.chart.update();
        }
      } catch (e) {
        console.error('Chart update error:', e);
        this.destroyChart();
      } finally {
        this.chartUpdating = false;
      }
    }
  };
}

customElements.define('geo-chart', GeoChart);
