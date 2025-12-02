import { useApp } from "../AppShell";
import EditorTabs from "./EditorTabs";
import CodeEditor from "./CodeEditor";
import AnalysisPanel from "./AnalysisPanel";
import "./EditorArea.css";

export default function EditorArea() {
  const { activeTab, openTabs } = useApp();

  if (openTabs.length === 0) {
    return (
      <div className="editor-area editor-area--empty">
        <div className="editor-area__empty-message">
          <div className="editor-area__empty-icon">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10,9 9,9 8,9" />
            </svg>
          </div>
          <p className="editor-area__empty-title">No file open</p>
          <p className="editor-area__empty-subtitle">
            Select a <code>.tonto</code> file from the explorer to start editing
          </p>
        </div>
      </div>
    );
  }

  const isTontoFile = activeTab?.name.endsWith(".tonto");

  if (activeTab && !isTontoFile) {
    return (
      <div className="editor-area">
        <EditorTabs />
        <div className="editor-area__content">
          <div className="editor-area__non-tonto">
            <div className="editor-area__empty-icon">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="editor-area__empty-title">{activeTab.name}</p>
            <p className="editor-area__empty-subtitle">
              Select a <code>.tonto</code> file to edit
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-area">
      <EditorTabs />
      <div className="editor-area__content">
        <div className="editor-area__editor">
          <CodeEditor />
        </div>
        <AnalysisPanel />
      </div>
    </div>
  );
}
