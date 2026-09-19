import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { BriefDocument } from './components/BriefDocument';
import { BriefEditor } from './components/BriefEditor';
import {
  createBrief,
  readinessNotes,
  validateBrief,
  type Brief,
} from './domain/brief';
import { downloadBrief, MAX_FILE_BYTES, parseBrief } from './domain/files';

export function App() {
  const [brief, setBrief] = useState<Brief>(() => createBrief());
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'screen' | 'paper'>('screen');
  const [presenting, setPresenting] = useState(false);
  const [paperOverflow, setPaperOverflow] = useState(false);
  const [screenOverflow, setScreenOverflow] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const printLayout = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  let structurallyValid = true;
  try {
    validateBrief(brief);
  } catch {
    structurallyValid = false;
  }

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);

  useEffect(() => {
    const measure = () => {
      const paper = printLayout.current
        ?.firstElementChild as HTMLElement | null;
      const screen = preview.current?.firstElementChild as HTMLElement | null;
      if (paper)
        setPaperOverflow(
          paper.scrollHeight > (paper.clientWidth * 297) / 210 + 3,
        );
      if (screen && mode === 'screen')
        setScreenOverflow(
          screen.scrollHeight > (screen.clientWidth * 9) / 16 + 3,
        );
    };
    const observer = new ResizeObserver(measure);
    if (printLayout.current) observer.observe(printLayout.current);
    if (preview.current) observer.observe(preview.current);
    measure();
    return () => observer.disconnect();
  }, [brief, mode, presenting]);

  function change(value: Brief) {
    setBrief(value);
    setDirty(true);
    setNotice('');
    setError('');
  }
  function replace(value: Brief) {
    setBrief(value);
    setDirty(false);
    setError('');
  }
  function canReplace() {
    return (
      !dirty ||
      window.confirm(
        'Ungesicherte Änderungen verwerfen? Lade die aktuelle Übersicht vorher als JSON herunter, wenn du sie behalten möchtest.',
      )
    );
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      if (file.size > MAX_FILE_BYTES) throw new Error('File too large');
      const imported = parseBrief(await file.text());
      if (!canReplace()) return;
      replace(imported);
      setNotice('Datei geöffnet. Inhalt und Quellen bitte fachlich prüfen.');
    } catch {
      setError(
        'Datei nicht geöffnet. Erwartet wird eine gültige öffentliche Council-OnePager-Datei in Version 1.0, höchstens 256 KB. Der aktuelle Entwurf bleibt erhalten.',
      );
    }
  }

  function save() {
    try {
      downloadBrief(brief);
      setDirty(false);
      setError('');
      setNotice(
        'Download gestartet. Bewahre die JSON-Datei auf, um später weiterzuarbeiten.',
      );
    } catch {
      setError(
        'Speichern nicht möglich. Bitte Beträge, Datumsangaben und Quellenlinks prüfen.',
      );
    }
  }

  return (
    <>
      <a className="skip-link" href="#workspace">
        Zum Arbeitsbereich
      </a>
      <header className="app-header">
        <div className="brand-mark" aria-hidden="true">
          C<span>1</span>
        </div>
        <div>
          <p className="eyebrow">COUNCIL ONEPAGER</p>
          <h1>Entscheidungen verständlich machen.</h1>
          <p>Eine Eingabe. Eine Übersicht. Eine gemeinsame Grundlage.</p>
        </div>
      </header>
      <div className="app-shell">
        <aside className="privacy-note">
          <strong>Öffentliche Vorlagen · lokal im Browser</strong>
          <p>
            Deine Eingaben werden nicht an einen Server gesendet und nicht
            automatisch gespeichert. Sichere deinen Arbeitsstand als JSON-Datei.
            Verwende hier nur öffentliche Informationen.
          </p>
        </aside>
        <nav className="toolbar" aria-label="Dateiaktionen">
          <div className="toolbar-group">
            <button
              type="button"
              onClick={() => {
                if (canReplace()) {
                  replace(createBrief());
                  setNotice('Neuer Arbeitsentwurf angelegt.');
                }
              }}
            >
              Neue Übersicht
            </button>
            <button type="button" onClick={() => fileInput.current?.click()}>
              JSON öffnen
            </button>
            <input
              ref={fileInput}
              type="file"
              accept=".json,application/json"
              className="visually-hidden"
              aria-label="JSON-Datei auswählen"
              onChange={importFile}
            />
            <button
              type="button"
              className="primary"
              disabled={!structurallyValid}
              onClick={save}
            >
              JSON speichern
            </button>
          </div>
          <span className="save-state">
            {dirty ? 'Ungesicherte Änderungen' : 'Arbeitsentwurf'}
          </span>
        </nav>
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {!structurallyValid && (
          <p className="error" role="alert">
            Speichern und Drucken sind gesperrt: Bitte Beträge, Datumsangaben
            und Quellenlinks prüfen.
          </p>
        )}
        <main
          id="workspace"
          className={`workspace ${presenting ? 'workspace--presenting' : ''}`}
        >
          {!presenting && (
            <div>
              <div className="pane-heading">
                <h2>Inhalt erfassen</h2>
                <span>7 Bereiche</span>
              </div>
              <BriefEditor brief={brief} onChange={change} />
            </div>
          )}
          <div className="preview-pane">
            <div className="pane-heading">
              <h2>Vorschau</h2>
              <div className="view-switch" role="group" aria-label="Ansicht">
                <button
                  type="button"
                  aria-pressed={mode === 'screen'}
                  onClick={() => setMode('screen')}
                >
                  Beamer
                </button>
                <button
                  type="button"
                  aria-pressed={mode === 'paper'}
                  onClick={() => setMode('paper')}
                >
                  A4
                </button>
              </div>
            </div>
            <div className="preview-actions">
              <button type="button" onClick={() => setPresenting(!presenting)}>
                {presenting ? 'Zurück zur Bearbeitung' : 'Große Ansicht'}
              </button>
              <button
                type="button"
                disabled={!structurallyValid || paperOverflow}
                onClick={() => window.print()}
              >
                Drucken / PDF
              </button>
            </div>
            <p className="preview-help">
              {mode === 'screen'
                ? 'Die Beameransicht zeigt Kernaussagen; Haushaltsdetails und vollständige Quellen stehen auf A4.'
                : 'A4-Ansicht mit Haushaltsdetails und Quellen. Im Druckdialog A4, 100 % und keine Kopf-/Fußzeilen wählen.'}
            </p>
            {paperOverflow && (
              <p className="error" role="alert">
                Der Inhalt passt nicht auf eine A4-Seite. Bitte kürzen oder
                Details in den Originalunterlagen belassen. Der PDF-Druck bleibt
                bis dahin gesperrt.
              </p>
            )}
            {mode === 'screen' && screenOverflow && (
              <p className="notice">
                Diese Vorschau ist höher als 16:9. Prüfe die große Ansicht und
                kürze gegebenenfalls die Kernaussagen. Es wird kein Text
                abgeschnitten.
              </p>
            )}
            <div ref={preview} className="preview-canvas">
              <BriefDocument brief={brief} mode={mode} />
            </div>
            <details className="readiness">
              <summary>
                Vor der Verwendung prüfen ({readinessNotes(brief).length}{' '}
                Hinweise)
              </summary>
              <ul>
                {readinessNotes(brief).map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              <p>
                Diese Hinweise prüfen nur Vollständigkeit. Richtigkeit,
                Neutralität und die Tragfähigkeit der Quellen müssen Menschen
                prüfen. Alle Ausgaben bleiben Arbeitsentwürfe.
              </p>
            </details>
          </div>
        </main>
        <footer className="app-footer">
          Unabhängiges Werkzeug · keine amtliche Veröffentlichung · Version
          0.1.0
        </footer>
      </div>
      <div ref={printLayout} className="print-layout" aria-hidden="true">
        <BriefDocument brief={brief} mode="paper" />
      </div>
    </>
  );
}
