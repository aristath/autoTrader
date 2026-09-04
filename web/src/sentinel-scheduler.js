import { LitElement, html } from "lit";
import { getJson, postJson, putJson } from "./api.js";
import { LiveResource } from "./live-resource.js";
import {
  formatDateTime,
  formatDuration,
  formatRelativeTime,
  statusVariant,
} from "./modal-utils.js";

const intervalMultipliers = {
  minutes: 1,
  hours: 60,
  days: 1440,
};

function displayInterval(minutes) {
  if (minutes >= 1440 && minutes % 1440 === 0) {
    return { value: minutes / 1440, unit: "days" };
  }

  if (minutes >= 60 && minutes % 60 === 0) {
    return { value: minutes / 60, unit: "hours" };
  }

  return { value: minutes, unit: "minutes" };
}

class SentinelScheduler extends LitElement {
  static properties = {
    tab: { state: true },
    busyAction: { state: true },
    actionError: { state: true },
    notice: { state: true },
  };

  constructor() {
    super();
    this.tab = "status";
    this.busyAction = "";
    this.actionError = "";
    this.notice = "";
  }

  schedules = new LiveResource(
    this,
    (signal) => getJson("/api/jobs/schedules", { signal }),
    { interval: 5000 },
  );

  status = new LiveResource(
    this,
    (signal) => getJson("/api/jobs", { signal }),
    { interval: 3000 },
  );

  history = new LiveResource(
    this,
    (signal) => getJson("/api/jobs/history?limit=100", { signal }),
    { interval: 10_000 },
  );

  createRenderRoot() {
    return this;
  }

  async updateSchedule(jobType, values) {
    this.busyAction = `update:${jobType}`;
    this.actionError = "";
    this.notice = "";

    try {
      await putJson(
        `/api/jobs/schedules/${encodeURIComponent(jobType)}`,
        values,
      );
      this.notice = `${jobType} updated`;
      await this.schedules.refresh();
    } catch (error) {
      this.actionError = error.message;
    } finally {
      this.busyAction = "";
    }
  }

  async runJob(jobType) {
    this.busyAction = `run:${jobType}`;
    this.actionError = "";
    this.notice = "";

    try {
      await postJson(`/api/jobs/${encodeURIComponent(jobType)}/run`);
      this.notice = `${jobType} started`;
      await Promise.all([
        this.status.refresh(),
        this.schedules.refresh(),
        this.history.refresh(),
      ]);
    } catch (error) {
      this.actionError = error.message;
    } finally {
      this.busyAction = "";
    }
  }

  updateInterval(job, field, value, unit) {
    const minutes = Math.round(Number(value) * intervalMultipliers[unit]);

    if (minutes > 0) {
      this.updateSchedule(job.job_type, { [field]: minutes });
    }
  }

  renderInterval(job, field, label) {
    const minutes = Number(job[field] ?? job.interval_minutes);
    const display = displayInterval(minutes);

    return html`
      <label
        >${label}&nbsp;<tui-input
          type="number"
          min="1"
          max="10080"
          value=${display.value}
          ?disabled=${this.busyAction !== ""}
          @change=${(event) =>
            this.updateInterval(
              job,
              field,
              event.currentTarget.value,
              display.unit,
            )}
        ></tui-input
      ></label>
      <tui-select
        aria-label="${label} unit for ${job.job_type}"
        value=${display.unit}
        ?disabled=${this.busyAction !== ""}
        @change=${(event) =>
          this.updateInterval(
            job,
            field,
            display.value,
            event.currentTarget.value,
          )}
      >
        <option value="minutes">Minutes</option>
        <option value="hours">Hours</option>
        <option value="days">Days</option>
      </tui-select>
    `;
  }

  renderStatus() {
    const status = this.status.value ?? {};

    return html`
      <tui-box heading="Currently Running" border="single">
        ${status.current ?? "No job running"}
      </tui-box>
      <div aria-hidden="true">&nbsp;</div>
      <tui-box heading="Upcoming Jobs" border="single">
        ${
          status.upcoming?.length
            ? status.upcoming.map(
                (job) => html`
                  <div>
                    ${job.job_type} │ ${formatRelativeTime(job.next_run)}
                  </div>
                `,
              )
            : "No upcoming jobs"
        }
      </tui-box>
      <div aria-hidden="true">&nbsp;</div>
      <tui-box heading="Recent Jobs" border="single">
        ${
          status.recent?.length
            ? status.recent.map(
                (job) => html`
                  <div>
                    ${job.job_type} │
                    <tui-text variant=${statusVariant(job.status) || ""}
                      >${job.status}</tui-text
                    >
                    │ ${formatRelativeTime(job.executed_at)}
                  </div>
                `,
              )
            : "No recent jobs"
        }
      </tui-box>
    `;
  }

  renderJob(job) {
    const busy = this.busyAction !== "";

    return html`
      <div>
        <tui-flex align="baseline" justify="between" wrap>
          <span>
            ${job.job_type}
            ${
              job.last_status
                ? html`<tui-text variant=${statusVariant(job.last_status) || ""}
                    >${job.last_status}</tui-text
                  >`
                : ""
            }
          </span>
          <span>
            <label
              >Timing&nbsp;<tui-select
                value=${String(job.market_timing)}
                ?disabled=${busy}
                @change=${(event) =>
                  this.updateSchedule(job.job_type, {
                    market_timing: Number(event.currentTarget.value),
                  })}
              >
                <option value="0">Any time</option>
                <option value="1">After close</option>
                <option value="2">During open</option>
                <option value="3">All closed</option>
              </tui-select></label
            >
            <tui-button
              ?disabled=${busy}
              @click=${() => this.runJob(job.job_type)}
              >${
                this.busyAction === `run:${job.job_type}` ? "Running…" : "Run"
              }</tui-button
            >
          </span>
        </tui-flex>
        <div>${job.description ?? ""}</div>
        <tui-flex align="baseline" wrap>
          ${this.renderInterval(job, "interval_minutes", "Interval")}
          <span aria-hidden="true">&nbsp;│&nbsp;</span>
          ${this.renderInterval(
            job,
            "interval_market_open_minutes",
            "Market open",
          )}
          ${
            job.next_run
              ? html`<span aria-hidden="true">&nbsp;│&nbsp;</span
                  ><span>Next ${formatRelativeTime(job.next_run)}</span>`
              : ""
          }
        </tui-flex>
      </div>
    `;
  }

  renderJobs() {
    const schedules = this.schedules.value?.schedules ?? [];
    const categories = [
      ...new Set(schedules.map((job) => job.category).filter(Boolean)),
    ];

    return categories.map(
      (category, index) => html`
        ${index > 0 ? html`<div aria-hidden="true">&nbsp;</div>` : ""}
        <tui-box heading=${category} border="single">
          ${schedules
            .filter((job) => job.category === category)
            .map(
              (job, jobIndex) => html`
                ${
                  jobIndex > 0
                    ? html`<div aria-hidden="true">────────────────</div>`
                    : ""
                }
                ${this.renderJob(job)}
              `,
            )}
        </tui-box>
      `,
    );
  }

  renderHistory() {
    const history = this.history.value?.history ?? [];

    if (history.length === 0) {
      return html`<div>No execution history</div>`;
    }

    return html`
      <div style="overflow: auto; min-width: 0">
        <table style="border-collapse: collapse; width: 100%">
          <thead>
            <tr>
              <th style="text-align: left">Job ID</th>
              <th style="text-align: left">│ Status</th>
              <th style="text-align: left">│ Duration</th>
              <th style="text-align: left">│ Executed</th>
              <th style="text-align: left">│ Error</th>
            </tr>
          </thead>
          <tbody>
            ${history.map(
              (entry) => html`
                <tr>
                  <td style="text-align: left; vertical-align: top">
                    ${entry.job_id}
                  </td>
                  <td style="text-align: left; vertical-align: top">
                    │
                    <tui-text variant=${statusVariant(entry.status) || ""}
                      >${entry.status}</tui-text
                    >
                  </td>
                  <td style="text-align: left; vertical-align: top">
                    │ ${formatDuration(entry.duration_ms)}
                  </td>
                  <td style="text-align: left; vertical-align: top">
                    │ ${formatDateTime(entry.executed_at, { seconds: true })}
                  </td>
                  <td
                    style="text-align: left; vertical-align: top; overflow-wrap: anywhere"
                  >
                    │ ${entry.error ?? "-"}
                  </td>
                </tr>
              `,
            )}
          </tbody>
        </table>
      </div>
    `;
  }

  render() {
    const error =
      this.schedules.error ?? this.status.error ?? this.history.error;
    const loading =
      (!this.schedules.value && this.schedules.loading) ||
      (!this.status.value && this.status.loading) ||
      (!this.history.value && this.history.loading);

    if (loading) {
      return html`<div>Loading scheduler…</div>`;
    }

    if (error) {
      return html`<tui-text variant="error"
        >Error loading scheduler: ${error.message}</tui-text
      >`;
    }

    return html`
      <tui-radio-buttonset
        aria-label="Scheduler view"
        value=${this.tab}
        @change=${(event) => (this.tab = event.currentTarget.value)}
      >
        <tui-radio-button value="status">Status</tui-radio-button>
        <tui-radio-button value="jobs">Jobs</tui-radio-button>
        <tui-radio-button value="history">History</tui-radio-button>
      </tui-radio-buttonset>
      <div aria-hidden="true">&nbsp;</div>
      ${
        this.tab === "jobs"
          ? this.renderJobs()
          : this.tab === "history"
            ? this.renderHistory()
            : this.renderStatus()
      }
      ${this.notice ? html`<div aria-live="polite">${this.notice}</div>` : ""}
      ${
        this.actionError
          ? html`<tui-text variant="error">${this.actionError}</tui-text>`
          : ""
      }
    `;
  }
}

customElements.define("sentinel-scheduler", SentinelScheduler);
