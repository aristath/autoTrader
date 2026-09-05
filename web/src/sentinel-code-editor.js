class SentinelCodeEditor extends HTMLElement {
  static observedAttributes = [
    "aria-label",
    "color-scheme",
    "disabled",
    "document-id",
    "filename",
    "height",
    "language",
  ];

  #value = "";
  #view;
  #runtime;
  #fallback;
  #initialization = 0;
  #languageLoad = 0;
  #colorSchemeLoad = 0;
  #documentSyncQueued = false;

  connectedCallback() {
    this.style.display = "block";
    this.style.height = this.editorHeight;
    this.style.maxWidth = "100%";
    this.style.minWidth = "0";
    this.style.overflow = "hidden";
    this.#showFallback();
    void this.#initialize();
  }

  disconnectedCallback() {
    this.#initialization += 1;
    this.#languageLoad += 1;
    this.#colorSchemeLoad += 1;
    this.#view?.destroy();
    this.#view = undefined;
    this.#runtime = undefined;
    this.#fallback = undefined;
  }

  attributeChangedCallback(name) {
    if (name === "height") {
      this.style.height = this.editorHeight;
      return;
    }

    if (name === "disabled") {
      this.#syncDisabled();
      return;
    }

    if (name === "aria-label") {
      this.#syncAriaLabel();
      return;
    }

    if (name === "color-scheme") {
      void this.#syncColorScheme();
      return;
    }

    if (name === "document-id") {
      this.#queueDocumentSync();
      return;
    }

    if (name === "filename" || name === "language") {
      void this.#syncLanguage();
    }
  }

  get value() {
    return this.#value;
  }

  set value(value) {
    const next = String(value ?? "");
    if (next === this.#value) return;
    this.#value = next;
    if (this.#fallback && this.#fallback.value !== next) {
      this.#fallback.value = next;
    }
    this.#queueDocumentSync();
  }

  get documentId() {
    return this.getAttribute("document-id") ?? "";
  }

  get filename() {
    return this.getAttribute("filename") ?? "";
  }

  get language() {
    return (this.getAttribute("language") || "plaintext").trim().toLowerCase();
  }

  get disabled() {
    return this.hasAttribute("disabled");
  }

  get editorHeight() {
    return this.getAttribute("height") || "30lh";
  }

  get colorScheme() {
    const value = this.getAttribute("color-scheme") || "monochrome";
    return ["monochrome", "latte", "frappe", "macchiato", "mocha"].includes(
      value,
    )
      ? value
      : "monochrome";
  }

  get editorLabel() {
    return this.getAttribute("aria-label") || "Code editor";
  }

  focus(options) {
    if (this.#view) {
      this.#view.focus();
    } else {
      this.#fallback?.focus(options);
    }
  }

  #showFallback() {
    const textarea = document.createElement("textarea");
    textarea.value = this.#value;
    textarea.disabled = this.disabled;
    textarea.spellcheck = false;
    textarea.setAttribute("aria-label", this.editorLabel);
    textarea.style.boxSizing = "border-box";
    textarea.style.display = "block";
    textarea.style.height = "100%";
    textarea.style.width = "100%";
    textarea.style.background = "var(--tui-background)";
    textarea.style.color = "var(--tui-color)";
    textarea.style.font = "inherit";
    textarea.addEventListener("input", (event) => {
      event.stopPropagation();
      this.#value = textarea.value;
      this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    });
    this.replaceChildren(textarea);
    this.#fallback = textarea;
  }

  async #initialize() {
    const initialization = ++this.#initialization;

    try {
      const [
        { basicSetup, EditorView },
        { Compartment, EditorState },
        { markdown },
        { languages },
        { LanguageDescription },
      ] = await Promise.all([
        import("codemirror"),
        import("@codemirror/state"),
        import("@codemirror/lang-markdown"),
        import("@codemirror/language-data"),
        import("@codemirror/language"),
      ]);

      if (!this.isConnected || initialization !== this.#initialization) return;

      const languageCompartment = new Compartment();
      const colorSchemeCompartment = new Compartment();
      const editableCompartment = new Compartment();
      const readOnlyCompartment = new Compartment();
      const ariaCompartment = new Compartment();
      const initialLanguageKey = this.#languageKey();
      const initialColorScheme = this.colorScheme;
      const languageExtension = await this.#loadLanguageExtension({
        LanguageDescription,
        languages,
        markdown,
      });
      const colorSchemeExtension = await this.#loadColorSchemeExtension(
        { EditorView },
        initialColorScheme,
      );

      if (!this.isConnected || initialization !== this.#initialization) return;

      const layoutTheme = EditorView.theme({
        "&": {
          height: "100%",
          maxWidth: "100%",
          fontSize: "inherit",
        },
        ".cm-scroller": {
          height: "100%",
          fontFamily: "var(--tui-font-family)",
          lineHeight: "inherit",
          overflow: "auto",
        },
        ".cm-content": { padding: "0" },
        ".cm-line": { padding: "0 1ch" },
        ".cm-gutters": {
          border: "0",
        },
        ".cm-activeLine, .cm-activeLineGutter": {
          backgroundColor: "transparent",
        },
        "&.cm-focused": { outline: "none" },
      });

      const runtime = {
        EditorState,
        EditorView,
        LanguageDescription,
        languages,
        markdown,
        languageCompartment,
        colorSchemeCompartment,
        editableCompartment,
        readOnlyCompartment,
        ariaCompartment,
        languageExtension,
        languageKey: initialLanguageKey,
        colorSchemeExtension,
        colorScheme: initialColorScheme,
        documentId: this.documentId,
        lastDocument: this.#value,
      };

      runtime.buildState = (document) =>
        EditorState.create({
          doc: document,
          extensions: [
            basicSetup,
            languageCompartment.of(runtime.languageExtension),
            EditorView.lineWrapping,
            ariaCompartment.of(
              EditorView.contentAttributes.of({
                "aria-label": this.editorLabel,
              }),
            ),
            layoutTheme,
            colorSchemeCompartment.of(runtime.colorSchemeExtension),
            editableCompartment.of(EditorView.editable.of(!this.disabled)),
            readOnlyCompartment.of(EditorState.readOnly.of(this.disabled)),
            EditorView.updateListener.of((update) => {
              if (!update.docChanged) return;
              const next = update.state.doc.toString();
              if (next === runtime.lastDocument) return;
              runtime.lastDocument = next;
              this.#value = next;
              this.dispatchEvent(
                new Event("input", { bubbles: true, composed: true }),
              );
            }),
          ],
        });

      this.#runtime = runtime;
      this.replaceChildren();
      this.#fallback = undefined;
      this.#view = new EditorView({
        state: runtime.buildState(this.#value),
        parent: this,
      });
      void this.#syncLanguage();
      void this.#syncColorScheme();
    } catch (error) {
      console.error("Failed to load Sentinel code editor", error);
    }
  }

  async #loadLanguageExtension(runtime = this.#runtime) {
    if (!runtime) return [];
    const normalized = this.language;
    if (!normalized || normalized === "plaintext" || normalized === "text") {
      return [];
    }
    if (normalized === "markdown") {
      return runtime.markdown({ codeLanguages: runtime.languages });
    }
    const description =
      runtime.LanguageDescription.matchLanguageName(
        runtime.languages,
        normalized,
        true,
      ) ||
      (this.filename
        ? runtime.LanguageDescription.matchFilename(
            runtime.languages,
            this.filename,
          )
        : undefined);
    return description ? (await description.load()).extension : [];
  }

  async #syncLanguage() {
    const runtime = this.#runtime;
    const view = this.#view;
    if (!runtime || !view) return;
    const nextKey = this.#languageKey();
    if (nextKey === runtime.languageKey) return;
    const languageLoad = ++this.#languageLoad;
    const extension = await this.#loadLanguageExtension(runtime);
    if (
      languageLoad !== this.#languageLoad ||
      runtime !== this.#runtime ||
      view !== this.#view
    ) {
      return;
    }
    runtime.languageExtension = extension;
    runtime.languageKey = nextKey;
    view.dispatch({
      effects: runtime.languageCompartment.reconfigure(extension),
    });
  }

  #languageKey() {
    return `${this.language}\n${this.filename}`;
  }

  async #loadColorSchemeExtension(runtime, colorScheme) {
    if (colorScheme === "monochrome") {
      return runtime.EditorView.theme({
        "&": {
          backgroundColor: "var(--tui-background)",
          color: "var(--tui-color)",
        },
        ".cm-gutters": {
          backgroundColor: "var(--tui-background)",
          color: "var(--tui-color)",
          border: "0",
        },
        ".cm-cursor, .cm-dropCursor": {
          borderLeftColor: "var(--tui-color)",
        },
        ".cm-content *": {
          color: "var(--tui-color) !important",
        },
      });
    }

    const {
      catppuccinFrappe,
      catppuccinLatte,
      catppuccinMacchiato,
      catppuccinMocha,
    } = await import("@catppuccin/codemirror");
    return {
      latte: catppuccinLatte,
      frappe: catppuccinFrappe,
      macchiato: catppuccinMacchiato,
      mocha: catppuccinMocha,
    }[colorScheme];
  }

  async #syncColorScheme() {
    const runtime = this.#runtime;
    const view = this.#view;
    if (!runtime || !view) return;
    const nextColorScheme = this.colorScheme;
    if (nextColorScheme === runtime.colorScheme) return;
    const colorSchemeLoad = ++this.#colorSchemeLoad;
    const extension = await this.#loadColorSchemeExtension(
      runtime,
      nextColorScheme,
    );
    if (
      colorSchemeLoad !== this.#colorSchemeLoad ||
      runtime !== this.#runtime ||
      view !== this.#view
    ) {
      return;
    }
    runtime.colorSchemeExtension = extension;
    runtime.colorScheme = nextColorScheme;
    view.dispatch({
      effects: runtime.colorSchemeCompartment.reconfigure(extension),
    });
  }

  #queueDocumentSync() {
    if (this.#documentSyncQueued) return;
    this.#documentSyncQueued = true;
    queueMicrotask(() => {
      this.#documentSyncQueued = false;
      this.#syncDocument();
    });
  }

  #syncDocument() {
    const runtime = this.#runtime;
    const view = this.#view;
    if (!runtime || !view) return;

    if (runtime.documentId !== this.documentId) {
      runtime.documentId = this.documentId;
      runtime.lastDocument = this.#value;
      view.setState(runtime.buildState(this.#value));
      return;
    }

    if (runtime.lastDocument === this.#value) return;
    runtime.lastDocument = this.#value;
    const head = Math.min(view.state.selection.main.head, this.#value.length);
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: this.#value,
      },
      selection: { anchor: head },
    });
  }

  #syncDisabled() {
    if (this.#fallback) this.#fallback.disabled = this.disabled;
    const runtime = this.#runtime;
    const view = this.#view;
    if (!runtime || !view) return;
    view.dispatch({
      effects: [
        runtime.editableCompartment.reconfigure(
          runtime.EditorView.editable.of(!this.disabled),
        ),
        runtime.readOnlyCompartment.reconfigure(
          runtime.EditorState.readOnly.of(this.disabled),
        ),
      ],
    });
  }

  #syncAriaLabel() {
    this.#fallback?.setAttribute("aria-label", this.editorLabel);
    const runtime = this.#runtime;
    const view = this.#view;
    if (!runtime || !view) return;
    view.dispatch({
      effects: runtime.ariaCompartment.reconfigure(
        runtime.EditorView.contentAttributes.of({
          "aria-label": this.editorLabel,
        }),
      ),
    });
  }
}

customElements.define("sentinel-code-editor", SentinelCodeEditor);
