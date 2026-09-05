export class LiveResource {
  value;
  error;
  loading = true;

  #host;
  #load;
  #interval;
  #timer;
  #request;
  #connected = false;

  constructor(host, load, { interval = 30_000 } = {}) {
    this.#host = host;
    this.#load = load;
    this.#interval = interval;
    host.addController(this);
  }

  hostConnected() {
    this.#connected = true;
    this.refresh();
  }

  hostDisconnected() {
    this.#connected = false;
    clearTimeout(this.#timer);
    this.#request?.abort();
  }

  async refresh() {
    clearTimeout(this.#timer);
    this.#request?.abort();

    const request = new AbortController();
    this.#request = request;
    this.loading = true;
    this.error = undefined;
    this.#host.requestUpdate();

    try {
      this.value = await this.#load(request.signal);
    } catch (error) {
      if (error.name !== "AbortError") {
        this.error = error;
      }
    } finally {
      if (this.#request === request) {
        this.loading = false;
        this.#request = undefined;
        this.#host.requestUpdate();

        if (this.#connected && this.#interval > 0) {
          this.#timer = setTimeout(() => this.refresh(), this.#interval);
        }
      }
    }
  }
}
