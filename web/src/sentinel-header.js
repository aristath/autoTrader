import { LitElement, html } from "lit";
import { getJson } from "./api.js";
import { LiveResource } from "./live-resource.js";
import "./sentinel-backtest.js";
import "./sentinel-research.js";
import "./sentinel-scheduler.js";
import "./sentinel-settings.js";
import "./sentinel-trades.js";

const actions = [
  {
    id: "backtest",
    label: "Backtest",
    heading: "Backtest",
    researchOnly: true,
  },
  { id: "trades", label: "Trades", heading: "Trade History" },
  { id: "scheduler", label: "Scheduler", heading: "Scheduler" },
  { id: "research", label: "Research", heading: "Research Pipeline" },
  { id: "settings", label: "Settings", heading: "Settings" },
];

class SentinelHeader extends LitElement {
  static properties = {
    activeModal: { state: true },
  };

  constructor() {
    super();
    this.activeModal = undefined;
  }

  health = new LiveResource(
    this,
    (signal) => getJson("/api/health", { signal }),
    { interval: 30_000 },
  );

  refreshHealth = () => this.health.refresh();

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("sentinel-setting-changed", this.refreshHealth);
  }

  disconnectedCallback() {
    window.removeEventListener("sentinel-setting-changed", this.refreshHealth);
    super.disconnectedCallback();
  }

  createRenderRoot() {
    return this;
  }

  openModal(id) {
    this.activeModal = id;
  }

  closeModal(id) {
    if (this.activeModal === id) {
      this.activeModal = undefined;
    }
  }

  requestModalClose(event) {
    const contents = event.currentTarget.querySelectorAll(
      "sentinel-backtest, sentinel-research, sentinel-scheduler, sentinel-settings, sentinel-tasks, sentinel-trades",
    );

    for (const content of contents) {
      if (content.confirmClose && !content.confirmClose()) {
        event.preventDefault();
        return;
      }
    }
  }

  get visibleActions() {
    const live = this.health.value?.trading_mode === "live";

    return actions.filter((action) => !action.researchOnly || !live);
  }

  renderAction(action, index) {
    const modalId = `sentinel-${action.id}-modal`;

    return html`
      ${index > 0 ? html`<span aria-hidden="true">&nbsp;</span>` : ""}
      <tui-button
        aria-controls=${modalId}
        aria-expanded=${this.activeModal === action.id ? "true" : "false"}
        inverted
        @click=${() => this.openModal(action.id)}
        >${action.label}</tui-button
      >
    `;
  }

  renderModalContent(id) {
    switch (id) {
      case "backtest":
        return html`<sentinel-backtest></sentinel-backtest>`;
      case "trades":
        return html`<sentinel-trades></sentinel-trades>`;
      case "scheduler":
        return html`<sentinel-scheduler></sentinel-scheduler>`;
      case "research":
        return html`<sentinel-research></sentinel-research>`;
      case "settings":
        return html`<sentinel-settings></sentinel-settings>`;
      default:
        return "";
    }
  }

  renderModal() {
    const action = actions.find(({ id }) => id === this.activeModal);

    if (!action) {
      return "";
    }

    return html`
      <tui-modal
        id=${`sentinel-${action.id}-modal`}
        heading=${action.heading}
        open
        @cancel=${this.requestModalClose}
        @close=${() => this.closeModal(action.id)}
        >${this.renderModalContent(action.id)}</tui-modal
      >
    `;
  }

  render() {
    return html`
      <header>
        <tui-bar>
          <nav aria-label="Application">
            <tui-flex align="baseline" wrap>
              ${this.visibleActions.map((action, index) =>
                this.renderAction(action, index),
              )}
            </tui-flex>
          </nav>
        </tui-bar>
        ${this.renderModal()}
      </header>
    `;
  }
}

customElements.define("sentinel-header", SentinelHeader);
