import { useEffect, useRef, useState } from 'react';

export function CodeEditor({ value, onChange, documentId = '', filename = '', language = 'plaintext', disabled = false }) {
  const hostRef = useRef(null);
  const viewRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const [ready, setReady] = useState(false);

  useEffect(() => { onChangeRef.current = onChange; valueRef.current = value; }, [onChange, value]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ basicSetup, EditorView }, { EditorState }, { catppuccinMocha }, languageModule] = await Promise.all([
        import('codemirror'),
        import('@codemirror/state'),
        import('@catppuccin/codemirror'),
        loadLanguage(language),
      ]);
      if (cancelled || !hostRef.current) return;
      const state = EditorState.create({
        doc: valueRef.current,
        extensions: [
          basicSetup,
          languageModule,
          catppuccinMocha,
          EditorView.lineWrapping,
          EditorView.editable.of(!disabled),
          EditorState.readOnly.of(disabled),
          EditorView.theme({
            '&': { height: '100%', fontSize: '0.84rem' },
            '.cm-scroller': { height: '100%', overflow: 'auto', fontFamily: 'var(--mantine-font-family-monospace)' },
            '.cm-content': { padding: '8px 0' },
            '.cm-line': { padding: '0 12px' },
          }, { dark: true }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString());
          }),
        ],
      });
      viewRef.current = new EditorView({ state, parent: hostRef.current });
      setReady(true);
    })().catch((error) => console.error('Failed to load code editor', error));
    return () => { cancelled = true; viewRef.current?.destroy(); viewRef.current = null; setReady(false); };
  }, [documentId, filename, language, disabled]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || value === view.state.doc.toString()) return;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
  }, [value]);

  return (
    <div className="code-editor-shell">
      <div ref={hostRef} className="code-editor-host" />
      {!ready && <textarea value={value} onChange={(event) => onChange(event.currentTarget.value)} disabled={disabled} />}
    </div>
  );
}

async function loadLanguage(language) {
  const normalized = String(language || '').toLowerCase();
  if (normalized === 'markdown') return (await import('@codemirror/lang-markdown')).markdown();
  if (normalized === 'javascript') return (await import('@codemirror/lang-javascript')).javascript();
  if (normalized === 'python') return (await import('@codemirror/lang-python')).python();
  if (normalized === 'json') return (await import('@codemirror/lang-json')).json();
  return [];
}
